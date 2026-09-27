안녕하세요. 여기어때컴퍼니 SRE팀에서 클라우드 엔지니어링 업무를 하고 있는 제이슨입니다. 저는 오늘 조금은 특이했던 경험을 공유드리려고 하는데요, Docker를 이용해서 서비스하는 인스턴스의 CodeDeploy 배포 실패를 Troubleshooting하는 과정에서 겪은 일입니다.

회사마다 다르긴 하지만 일반적으로 AWS 환경에서 배포할 때는 아래와 같은 방법으로 하게 됩니다.

![](https://images.gogumang.com/bbd83fb3dc/01.png)

*AWS 환경에서의 일반적인 배포 프로세스*

### 1. 사건의 시작

평화로웠던 어느 오전… 갑자기 TargetGroup의 인스턴스가 unhealthy 상태로 되었다고 슬랙 모니터링 채널에 알림이 올라왔습니다. 이제 어떤 문제가 있는지 인스턴스를 확인해 봐야겠네요.

![](https://images.gogumang.com/bbd83fb3dc/02.png)

### 2. 문제 해결을 위한 체크 리스트 확인

1. 인스턴스 확인

우선 인스턴스가 On-Demand 혹은 Auto Scaling으로 구성되었는지를 확인 합니다. 문제의 인스턴스는 Auto Scaling으로 구성되어 있었고 TargetGroup의 Health Check 실패로 인해 Auto Scaling 정책에 따라 인스턴스 교체가 반복되는 상황이었습니다.

![](https://images.gogumang.com/bbd83fb3dc/03.png)

2. CodeDeploy 상태 확인

1번 확인으로 CodeDeploy에서 이력을 확인해보니 배포 실패가 반복되고 있었습니다.

![](https://images.gogumang.com/bbd83fb3dc/04.png)

CodeDeploy의 배포 과정 중 어떤 부분에서 문제가 있었는지 자세히 확인해 보니 ValidateService 단계에서 TimeOut으로 실패했네요.

![](https://images.gogumang.com/bbd83fb3dc/05.png)

CodeDeploy의 ValidateService 단계에서 발생한 문제를 확인하기 위해서는 CodeDeploy 배포 프로세스를 알아야 할 필요가 있습니다.

담당 개발자에게 문의할 수도 있지만 Jenkins에서 Build 후 업로드된 xxxx.tar.gz 파일을 S3 버킷에서 다운로드하여 압축을 풀게되면 아래 그림에서 보는 것처럼 CodeDeploy 배포 프로세스를 정의하는 appspec.yml 파일을 확인할 수 있습니다.

![](https://images.gogumang.com/bbd83fb3dc/06.png)

*CodeDeploy 배포 프로세스*

CodeDeploy에서 확인한 것과 같이 AfterInstall 단계까지 정상적으로 수행 되었지만 ValidateService 단계에서 문제가 발생한 것으로 보입니다. 그렇다면 이전 단계에서 문제가 발생했을 가능성이 큽니다. AfterInstall 단계를 점검해 보니 Docker를 사용해서 Application을 서비스한다는 것이 확인되네요.

```
[root@ip-xx-x-xx-xxx ~]# cat appspec.yml
version: 0.0
os: linux
files:
  - source: /
    destination: /home/xxxx/deploy/xxxxxx-api/temp
permissions:
  - object: /home/xxxx
    owner: xxxx
    group: xxxx
    mode: 775
hooks:
  BeforeInstall:
    - location: BeforeInstall.sh
      timeout: 60
  AfterInstall:
    - location: AfterInstall.sh
      timeout: 60
  ApplicationStart:
    - location: ApplicationStart.sh
      timeout: 300
  ValidateService:
    - location: ValidateService.sh
      timeout: 100
[root@ip-xx-x-xx-xxx ~]# cat ApplicationStart.sh
#!/bin/bash
set -x

SCRIPT=$(readlink -f $0)
SCRIPT_DIR=$(dirname $SCRIPT)

source ${SCRIPT_DIR}/env.sh
ECR_URL_VERSION=${ECR_URL}:${PROJECT_VERSION}

cp ${DEPLOY_TMP}/daemon.json /etc/docker/daemon.json

docker run -d --network host --name ${PROJECT_NAME} --log-driver json-file --log-opt max-size=100m --log-opt max-file=10 -p 5701:5701 -p 5702:5702 -p 5703:5703 -p ${PROJECT_PORT}:${PROJECT_PORT} -e JAVA_OPTS="${JAVA_OPTS}"  ${ECR_URL_VERSION}

cp ${DEPLOY_TMP}/app.service /etc/systemd/system/${PROJECT_NAME}.service

systemctl enable ${PROJECT_NAME}.service
```

혹시 Docker 서비스가 문제가 있는지 확인해보니 정상입니다.

```
[root@ip-xx-x-xx-xxx ~]# systemctl status docker
● docker.service - Docker Application Container Engine
   Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; vendor preset: disabled)
   Active: active (running) since Tue 2024-05-07 05:07:31 KST; 2 months 5 days ago
     Docs: https://docs.docker.com
 Main PID: 4075 (dockerd)
    Tasks: 13
   Memory: 165.5M
   CGroup: /system.slice/docker.service
           └─4075 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock --default-ulimit nofile=32768:65536
```

현재 실행 중인 Docker Container 상태를 점검을 했는데, 흠… 아무것도 없습니다. ValidateService 단계에서 TimeOut 에러가 발생한 이유는 실행 중인 Container가 없어서 발생한 문제네요.

```
[root@ip-xx-x-xx-xxx ~]# docker ps -a
CONTAINER ID   IMAGE                                                                                                COMMAND                  CREATED       STATUS       PORTS     NAMES
```

### 3. 문제 해결

1. Docker Container Start

Docker Container를 수동으로 실행시켜 줬더니 정상적으로 시작되었습니다.

```
1. xxxxxx-api Docker Container 시작
[root@ip-xx-x-xx-xxx ~]# systemctl restart xxxxxx-api.service

2. 실행중인 Doceker Container 확인
[root@ip-xx-x-xx-xxx ~]# docker ps -a
CONTAINER ID   IMAGE                                                                                                COMMAND                  CREATED       STATUS       PORTS     NAMES
xxxxxxxxxxxx   xxxxxx.dkr.ecr.ap-northeast-2.amazonaws.com/xxxxxx/xxxxxx/xxxxxx/xxxxxx-api:0.0.1-SNAPSHOT   "/bin/sh -c 'exec ja…"   Up 4 minutes ago   Up 4 minutes      xxxxxx-api
```

2. CodeDeploy에서도 확인해보니 성공적으로 배포되었네요.

![](https://images.gogumang.com/bbd83fb3dc/07.png)

3. TargetGroup 역시 인스턴스가 Healthy 상태로 되었으니 이 이슈는 해결되었습니다.

![](https://images.gogumang.com/bbd83fb3dc/08.png)

### 4. 근본적인 해결을 위한 원인 파악 시작

1. 인스턴스, Docker, CodeDeploy의 시작 시각을 확인합니다.

CodeDeploy의 ApplicationStart가 Docker 서비스 Start 시각보다 빠르다고 기록되어 있습니다. Docker Container가 정상적으로 시작되지 못한 것으로 확인되었습니다.

![](https://images.gogumang.com/bbd83fb3dc/09.png)

이제 Docker 서비스가 CodeDeploy의 ApplicationStart 보다 늦게 시작된 이유를 확인해야 할 것 같습니다. 경험 상 설마… 혹시 몰라서 Docker 패키지의 설치 시각을 확인해 본 결과, 12:57:18에 설치된 것으로 보입니다. 흠… 그런데 뭔가 이상합니다.

```
[root@ip-xx-x-xx-xxx ~]# rpm -qi docker
Name        : docker
Version     : 25.0.3
Release     : 1.amzn2.0.1
Architecture: x86_64
Install Date: Fri 12 Jul 2024 12:57:18 PM KST
Group       : Unspecified
Size        : 174997696
License     : ASL 2.0 and MIT and BSD and MPLv2.0 and WTFPL
Signature   : RSA/SHA512, Thu 01 Jan 1970 09:00:00 AM KST, Key ID 11cf1f95c87f5b1a
Source RPM  : docker-25.0.3-1.amzn2.0.1.src.rpm
Build Date  : Wed 28 Feb 2024 09:30:56 AM KST
Build Host  : build.amazon.com
Relocations : (not relocatable)
Packager    : Amazon Linux
Vendor      : Amazon Linux
URL         : http://www.docker.com 
Summary     : Automates deployment of containerized applications
Description :
Docker is an open-source engine that automates the deployment of any
application as a lightweight, portable, self-sufficient container that will
run virtually anywhere.

Docker containers can encapsulate any payload, and will run consistently on
and between virtually any server. The same container that a developer builds
and tests on a laptop will run at scale, in production*, on VMs, bare-metal
servers, OpenStack clusters, public instances, or combinations of the above.
```

이제 Docker 패키지 설치 시각이 확인했으니 인스턴스의 message 로그를 확인해 봐야겠습니다. 로그를 보니 yum update가 12:55:48\~12:57:59까지 실행되었고 이 과정에서 Docker 패키지도 함께 업데이트된 것을 확인할 수 있었습니다.

```
[root@ip-xx-x-xx-xxx log]# cat messages
Jul 12 12:55:12 ip-xx-x-xx-xxx cloud-init: Cloud-init v. 19.3-45.amzn2 running 'modules:config' at Fri, 12 Jul 2024 03:55:12 +0000. Up 12.25 seconds.
Jul 12 12:55:15 ip-xx-x-xx-xxx cloud-init: Loaded plugins: extras_suggestions, langpacks, priorities, update-motd
Jul 12 12:55:53 ip-xx-x-xx-xxx cloud-init: 4 packages excluded due to repository priority protections
Jul 12 12:55:57 ip-xx-x-xx-xxx cloud-init: --> jbigkit-libs-2.0-11.amzn2.0.3.x86_64 from amzn2-core removed (updateinfo)
Jul 12 12:55:57 ip-xx-x-xx-xxx cloud-init: --> 14:tcpdump-4.9.2-4.amzn2.1.0.1.x86_64 from amzn2-core removed (updateinfo)
Jul 12 12:55:57 ip-xx-x-xx-xxx cloud-init: --> rsyslog-8.24.0-57.amzn2.2.0.2.x86_64 from amzn2-core removed (updateinfo)
중략
Jul 12 12:55:58 ip-xx-x-xx-xxx cloud-init: 104 package(s) needed (+0 related) for security, out of 199 available
Jul 12 12:55:58 ip-xx-x-xx-xxx cloud-init: Resolving Dependencies
Jul 12 12:55:58 ip-xx-x-xx-xxx cloud-init: --> Running transaction check
Jul 12 12:57:58 ip-xx-x-xx-xxx cloud-init: Verifying  : docker-25.0.3-1.amzn2.0.1.x86_64                         109/221
Jul 12 12:57:58 ip-xx-x-xx-xxx cloud-init: Verifying  : docker-20.10.13-2.amzn2.x86_64                           113/221
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: docker.x86_64 0:25.0.3-1.amzn2.0.1
중략
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: Dependency Updated:
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: libseccomp.x86_64 0:2.5.2-1.amzn2.0.1
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: nspr.x86_64 0:4.35.0-1.amzn2
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: nss-softokn.x86_64 0:3.90.0-6.amzn2.0.2
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: nss-softokn-freebl.x86_64 0:3.90.0-6.amzn2.0.2
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: nss-util.x86_64 0:3.90.0-1.amzn2
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: Replaced:
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: grub2.x86_64 1:2.06-9.amzn2.0.1     grub2-tools.x86_64 1:2.06-9.amzn2.0.1
Jul 12 12:57:59 ip-xx-x-xx-xxx cloud-init: Complete!
```

2. YUM 업데이트가 자동으로 실행된 원인을 파악해봐야겠습니다.

먼저, 시작 탬플릿의 userdata와 CodeDeploy를 봐도 관련된 설정을 확인하지 못했습니다. yum이 실행된 기록을 확인하기 위해 messages 로그를 보면 OS 자체에서 실행될 경우 주로 kernel이나 systemd로 기록되고 사용자가 실행하면 root나 ec2-user등 사용자 계정으로 기록되는데 이번에는 특이하게 cloud-init에서 실행되었습니다.

3. cloud-init에 대해서 AWS의 Document를 확인해 봅니다.
> cloud-init는 클라우드 인스턴스 초기화 도구로 시스템을 부팅하는 동안 클라우드 인스턴스/VM 또는 네트워크 구성을 자동화하는 역할

[Using cloud-init On AL2 - Amazon Linux 2](https://docs.aws.amazon.com/ko_kr/linux/al2/ug/amazon-linux-cloud-init.html) AWS Document를 보니 cloud-init 설정은 /etc/cloud/cloud.cfg에 있다고 하네요.

4. 거의 원인을 찾아가는 느낌입니다. 이제 cloud-init 설정을 점검합니다.

cloud-init의의 17\~22번째 라인에서 YUM 보안 업데이트가 실행되도록 설정되어 있었으며 재부팅시 kernel, nvidia\*, cuda\*을 제외하고 보안 업데이트가 진행되는 부분도 확인되었습니다.

```
[root@ip-xx-x-xx-xxx ~]# cat /etc/cloud/cloud.cfg
datasource_list: [ Ec2, None ]
repo_upgrade: security
repo_upgrade_exclude:
 - kernel
 - nvidia*
 - cuda*
```

5. 마지막으로 cloud-init을 좀 더 꼼꼼하게 봐야겠죠.

/etc/cloud/cloud.cfg 파일의 생성일이 OS 설치일과 비슷한 2021년 10월 29일이고 [AWS FAQ](https://aws.amazon.com/ko/amazon-linux-ami/faqs/)에서 비활성화하는 방법이 안내된 것으로 보아 Amazon Linux 2의 Default 설정으로 보입니다.

Amazon Linux 2023에서도 확인해 본 결과 package-update-upgrade-install 모듈은 AWS Document는 아니지만 [cloud-init Document](https://cloudinit.readthedocs.io/en/latest/reference/modules.html#package-update-upgrade-install)에 따르면 Module frequency: once-per-instance로 설정되어 있어서 최초 1회만 실행되는 것으로 보입니다. AMI 생성 시 이미 1회 실행되었기 때문에 Amazon Linux 2023에서는 동일한 현상이 발생하지 않을 것으로 예상됩니다.

```
# The modules that run in the 'final' stage
cloud_final_modules:
 - package-update-upgrade-install
```

### 5. 마무리

1. AutoScaling 정책에 의해 인스턴스가 교체되는 과정에서 YUM 보안 업데이트가 진행되었고 마침 2024.02.28에 빌드된 Docker 패키지가 같이 업데이트되면서 ApplicationStart가 Docker 서비스보다 먼저 실행되는 문제가 발생했습니다.
2. CodeDeploy로 배포할 때 ApplicationStart 단계에서 Docker 서비스 Start 여부를 확인한 후 Docker Run 실행, Docker 서비스가 Start되지 않으면 Retry하는 로직을 추가할 필요가 있습니다.
3. 또한 Docker뿐만 아니라 Nginx, Tomcat, Spring Boot, Undertow 등을 사용하여 Application을 구성하는 경우에도 ValidateService 단계에서 Health Check 뿐만 아니라 ApplicationStart 단계에서 관련된 프로세스가 정상적으로 시작되었는지 확인하고 Retry하는 로직이 필요합니다.

이상으로 CodeDeploy 배포 Troubleshooting 관련된 조금은 특이했던 저의 경험이 여러분께 도움이 되었기를 바라며 마치겠습니다.