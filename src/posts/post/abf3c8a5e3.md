#### JFR로 잡은 12분짜리 Jenkins 배치 Hang

*무신사 물류기술실 WMS팀 --- Spring Batch · Jenkins · JFR(Java Flight Recorder) · Aurora MySQL*
![](https://cdn-images-1.medium.com/max/1024/1*Lvwtd1fxrDMG6TFUM-qSFg.jpeg)

### 들어가며

저희 팀은 무신사의 창고 운영을 책임지는 **MWMS(Musinsa Warehouse Management System)** 를 만들고 있습니다. 매일 다량의 출고 작업이 인입되면 작업자에게 보낼 **피킹 지시서** 단위로 작업이 분해되는데, 이 분해 작업을 수행하는 Spring Batch가 한동안 저희를 괴롭혔습니다.

본격적인 시작은 이미 한 차례 큰 개선이 끝난 뒤였습니다. Spring Batch**의** Tasklet**을 Reader/Writer 청크 구조로 전환** 하고, Writer 안에 박혀있던 조회를 모두 Reader로 끌어올려 **장기 트랜잭션을 분해** 하는 작업이었죠. 그 결과 단건 처리 시간이 **평균 526.7초 → 41.2초(12.8배)** , 최악 케이스가 **5,035초 → 113초(44.6배)** 줄었습니다.

그런데도 사라지지 않는 잔불이 있었습니다. Jenkins Slot **하나가 5분, 어떤 날은 12분 동안 묶이는 현상.** 코드는 멀쩡한데, 무엇이 그 시간을 잡아먹고 있는지 **재현이 안 됐습니다.**

이 글은 그 잔불을 추적하기 위해 Java Flight Recorder(JFR) 를 운영에 투입하고, 처음 의심했던 라이브러리가 **알리바이를 증명한 끝에 진짜 범인을 찾아낸** 추적기입니다.
> *💡* ***이 글의 대상 독자*** *저희 팀은 중장기적으로* *Jenkins 기반 배치를* *Temporal 워크플로우 엔진으로 이관하는 로드맵을 수립했으며, 이번 이슈에서 마주한 임계점들 역시 해당 아키텍처 전환을 통해 해결할 예정입니다. 다만* *Jenkins로* *Spring Batch를 트리거하는 구조는 여전히 많은 기술 조직에서 활용 중이므로, 이관 전까지 안정적인 시스템 운영을 위한 디버깅 사례로서 본 글이 도움되기를 기대합니다. 아울러* *JFR은 워크플로우 엔진의 종류와 관계없이 적용할 수 있는 유용한 진단 도구입니다.*

### 1. 배경: 어디서 끊겼나

이 배치는 Jenkins Job으로 트리거됩니다. Job이 시작되면 Spring Boot 배치 애플리케이션이 새로 기동되고, 파라미터로 받은 작업 ID를 처리한 뒤 종료되는 구조입니다.

```
Backend API → Jenkins → Spring Boot JVM (java -jar batch.jar)
                          → Spring 기동 (~22s)
                          → Aurora MySQL 쿼리
                          → Step 완료 → JVM 종료
```

배치 자체는 단순합니다. 문제는 **"Spring 기동 후 첫 Step이 시작되기까지의 공백"** 이 어떤 날은 5분, 어떤 날은 12분이었다는 점입니다.

#### 1--1. 이미 손쓴 것들: 다 헛발질이었던 이유

* **Connection Pool 증설** : API prod=100, Batch=10이었던 풀을 20으로 늘렸습니다. 분명 조금 좋아진 것처럼 보였는데, 측정해보니 사실 **동시성 1짜리 배치에 풀 증설은 의미가 없었습니다.** 나중에 롤백했습니다.
* **Reader/Writer 분리** : 평균 처리시간은 12.8배 개선됐지만, **시작 직후 멈추는 현상**은 별개로 남아있었습니다.
* **Thread Dump 시도** : AWS Systems Manager(SSM)으로 Jenkins agent에 붙어 jstack을 떠보려 했지만, **이미 작업이 끝난 뒤** 들어가는 경우가 대부분이었습니다. hang 시점에 정확히 들어가야만 의미가 있는데, 작업자가 깨어 있는 시간과 hang 발생 시간이 일치하지 않습니다.
* **Heap Dump 시도** : 마찬가지로 **사람이 직접 들어가서 떠야 하는** 도구입니다. JVM이 죽으면 사라지고, 살아있을 때 떠도 이번 케이스는 메모리 문제가 아니어서 별 의미가 없었습니다.

결과적으로 위 세 가지 도구는 다음과 같은 공통적인 한계를 가지고 있었습니다.

1. **사람이 hang 시점에 깨어 있어야 한다** --- 새벽 배치 hang이라면 사실상 불가능합니다.
2. **순간을 찍는 스냅샷이라 "그 전에 무슨 일이 있었는가"는 알 수 없다** --- thread dump는 호출 시점의 스택만, heap dump는 메모리 상태만 보여줍니다. 시간 축이 없습니다.

#### 1--2. 무엇을 측정해야 했나

저희가 모르는 것은 **"Spring 기동 직후부터 첫 쿼리가 나가기까지 JVM 안에서 무슨 일이 벌어졌는가"** 였습니다. 시간 축이 있어야 풀리는 질문입니다. 이건 APM(DataDog) 트레이스로도, slowlog로도, 외부에서 jstack으로도 보기 어렵습니다.

여기에 두 가지 제약 조건이 더 존재했습니다.

* **운영 코드를 건드리지 않을 것** --- 디버깅을 위해 애플리케이션 코드에 로깅이나 인스트루멘테이션을 추가하면, **그 변경 자체가 다른 위험을 만듭니다.** 게다가 PR/리뷰/배포 사이클이 한 바퀴 돌아야 데이터를 받을 수 있어 **재현이 어려운 hang**에는 부적합합니다.
* **운영에 부담을 주지 않을 것** --- hang은 언제 다시 발생할지 모르니, **항상 켜둘 수 있어야** 합니다.

이 세 가지(시간 축 / 코드 변경 0 / 항상 켜둠)를 한 번에 만족하는 도구가 Java Flight Recorder(JFR) 였습니다.

### 2. JFR을 운영에 투입하기 --- 코드 변경 0줄

JFR을 처음 듣는 분을 위해 짧게 정리하자면:

* **OpenJDK에 내장된 저오버헤드 프로파일러**입니다. JDK 11부터 무료, JDK 17부터 기본 포함입니다.
* JVM 내부 이벤트(스레드 상태, lock 경합, I/O, GC, allocation 등)를 binary 파일(.jfr)로 기록합니다.
* **JDK Mission Control(JMC)** 또는 IntelliJ Profiler로 시각화/분석합니다.
* 오버헤드는 보통 1\~2% 수준이라 **운영 환경에서 always-on**도 가능합니다.

#### 2--1. 다른 도구들과의 비교: 왜 JFR이었나

* **Thread Dump (jstack)**: 코드 변경: 없음 / 시간 축: ❌ 스냅샷 / 항상 켜기: ❌ (사람이 떠야 함) / hang 시점 부재 시: 무용
* **Heap Dump**: 코드 변경: 없음 / 시간 축: ❌ 스냅샷 / 항상 켜기: ❌ (사람이 떠야 함) / hang 시점 부재 시: 무용
* **애플리케이션 로깅 추가** : 코드 변경: **있음 (PR 필요)** / 시간 축: △ 텍스트 / 항상 켜기: ✅ / hang 시점 부재 시: 정보 부족
* **APM (DataDog 등)**: 코드 변경: 에이전트 부착 / 시간 축: ✅ 트랜잭션 단위 / 항상 켜기: ✅ / hang 시점 부재 시: 부트 직후·라이브러리 내부는 보기 어려움
* **JFR** : 코드 변경: **없음** / 시간 축: **✅ JVM 이벤트** / 항상 켜기: **✅ (오버헤드 1\~2%)** / hang 시점 부재 시: **종료 시 자동 dump**

저희가 가진 모든 조건(코드 변경 0 / 시간 축 / 항상 켜둠 / hang 종료 후에도 분석 가능)을 한 번에 만족하는 건 JFR 하나였습니다.

#### 2--2. 적용 방법: JVM 옵션 한 줄

JFR을 켜는 법은 JVM 옵션 한 줄입니다. **애플리케이션 코드는 단 한 줄도 수정할 필요가 없습니다.** 이게 이번 글에서 가장 강조하고 싶은 부분입니다.

```
java \
  -XX:StartFlightRecording=name=batch,settings=profile,dumponexit=true,filename=/tmp/${JFR_NAME} \
  -jar application.jar
```

저희 환경에서는 Jenkins Execute Shell에 옵션을 추가하고, JVM이 죽거나 정상 종료될 때 .jfr 파일이 /tmp에 떨어지도록 설정한 뒤 workspace로 복사해 **Jenkins Build Artifacts**로 다운로드받게 했습니다.

```
ORIGIN_JAR=$(readlink /home/jenkins/wms-batch/application.jar)
JFR_NAME="batch-jfr-${BUILD_NUMBER}-$(date +%Y%m%d-%H%M%S).jfr"
JFR_FILE="/tmp/${JFR_NAME}"
```

```
# JVM이 어떤 식으로 죽어도 JFR 파일이 archive 디렉토리로 복사되도록 trap
trap 'cp "${JFR_FILE}" "${WORKSPACE}/" 2>/dev/null || true' EXIT
```

```
java -Dfile.encoding=UTF-8 \
  -XX:StartFlightRecording=name=batch,settings=profile,dumponexit=true,filename=${JFR_FILE} \
  -jar ${ORIGIN_JAR} \
  taskId=${TASK_ID} \
  --job.name=mainBatchJob
```

여기서 핵심은 두 가지입니다.

1. **JFR_FILE을** /tmp**(공백 없는 경로)에 둘 것** - Jenkins workspace 경로에 공백이 있으면 일부 옵션 파싱이 깨집니다.
2. trap**으로 종료 시 archive로 복사** - JVM이 비정상 종료되더라도 .jfr 파일이 보존됩니다.

이렇게 한 뒤 Jenkins Job Configuration에서 **Archive the artifacts** 패턴에 batch-jfr-\*.jfr을 추가하니, 빌드 페이지에서 바로 다운로드할 수 있게 됐습니다.
> *💡* ***운영 안전성 체크*** *:* *JFR profile settings의 오버헤드는 약 1\~2%이며, recording은 메모리 버퍼링 → dump 시 디스크 쓰기 방식이라 정상 트래픽에 영향이 없습니다. AWS 인스턴스 메타데이터/Credentials 같은 민감 정보도 기록하지 않습니다.*

### 3. 첫 번째 JFR: 가설을 죽이는 한 줄

이제 본론입니다. 이 섹션은 **저희가 JFR 파일을 어떤 순서로 열고, 어떤 패널을 어떻게 보고, 어떤 단서를 어떻게 쫓아갔는지**를 그대로 풀어 적은 부분입니다. JFR을 처음 보는 분이라면 이 흐름이 그대로 매뉴얼이 될 수 있도록 썼습니다.

#### 3--1. 시작은 가설이었습니다: 너무 그럴듯해서 위험했던

batch-jfr-244094-20260424-165125.jfr(2분 hang 케이스)을 받았을 때, 저희에게는 이미 **유력한 용의자**가 있었습니다.

logback-spring.xml에 박혀있는 이 설정.

```
<appender name="BATCH_AWS_DIRECT" class="ca.pjer.logback.AwsLogsAppender">
  <maxFlushTimeMillis>30000</maxFlushTimeMillis>  <!-- 30초까지 블로킹 -->
  <logGroupName>${BATCH_AWS_LOG_PATH}</logGroupName>
  <logRegion>ap-northeast-2</logRegion>
  ...
</appender>
```

ca.pjer.logback.AwsLogsAppender는 logback에서 CloudWatch Logs로 직접 로그를 쏘는 서드파티 appender입니다. **첫 로그 flush 시점**에 AWS SDK Client를 lazy 생성하면서 EC2 metadata service로 credential chain을 탐색합니다. 이때 EC2 메타데이터 응답이 늦으면 main 스레드가 그대로 멈추는 것으로 알려져 있습니다.

게다가 Jenkins 콘솔 로그에서 매번 보이는 시그니처가 있었습니다.

```
... Hibernate Dialect: ... [WARN]
... Creating AWSLogs Client      ← 여기서 멈춘 것처럼 보임
(5분 침묵)
... Step started                  ← 5분 뒤 갑자기 재개
```

\<root level="WARN"\>에 BATCH_AWS appender가 붙어있어서, **기동 직후 출력되는 첫 WARN 로그(Hibernate Dialect warning)** 가 AwsLogsAppender를 깨우고, AWS SDK가 credential 탐색에 시간을 다 쓰는 시나리오. 정황 증거가 너무 깔끔했습니다. **그대로 PR을 올렸어도 아무도 의심하지 않았을 정도로** 그럴듯했죠.

이 가설을 **확정 지을지, 죽일지** 정하는 것이 첫 JFR의 임무였습니다.

#### 3--2. JMC 첫 화면: 무엇을 먼저 보아야 하나

.jfr 파일은 **JDK Mission Control(JMC)** 로 엽니다. macOS에서는 다음 한 줄이면 됩니다.

```
open -a "JDK Mission Control" ~/Downloads/batch-jfr-244094-20260424-165125.jfr
```

> *JMC를 처음 받는다면* [*Adoptium Marketplace*](https://adoptium.net/)*나 Oracle 사이트에서 다운로드받을 수 있습니다. IntelliJ IDEA Ultimate 사용자라면 IDE의 Profiler 패널에서* *.jfr 파일을 직접 열 수도 있습니다.*

JMC가 열리면 좌측에 **Outline 트리**가 보입니다. 이 트리에서 가장 먼저 펼치는 항목은 매번 같습니다.

1. **Java Application** --- 스레드별 활동 / Hot method / Allocation
2. **Threads** --- 시간 축 위에 스레드 상태(Running / Blocked / Sleeping / Wait) 색칠
3. **Socket I/O** --- 어떤 호스트로 read/write가 일어났고 얼마나 걸렸는가
4. **File I/O** --- 디스크 read/write
5. **Lock Instances** --- 어느 monitor에서 경합이 일어났는가
6. **Garbage Collection** --- GC pause 분포
7. **Method Profiling** --- sampling 기반 hot method

이번 케이스처럼 **"main 스레드가 어디서 막혔는지"** 를 찾아야 할 때, 저희가 따라간 순서는 이랬습니다.
> ***(1) Threads로 main 스레드의 큰 그림을 본다 → (2) 그 시간대에 Socket I/O가 어디로 났는지 본다 → (3) Method Profiling으로 어떤 코드 경로였는지 확정한다.***

#### 3--3. Threads 패널: main이 어디서 멈춰있는가

먼저 **Java Application → Threads** 를 열고, 좌측 스레드 목록에서 main을 선택했습니다. 우측에 시간 축이 펼쳐지면서 각 시점의 스레드 상태가 색깔로 표시됩니다.

아래는 같은 JFR 파일(batch-jfr-244094)에서 jfr CLI로 Socket I/O 이벤트를 추출해 직접 그린 차트입니다(JMC GUI에서 보이는 것과 동일 데이터, 시각화만 글에 맞게 재구성).
![](https://cdn-images-1.medium.com/max/1024/1*wY7yrISWtxiDZUPCewS_bw.png)*약 22초간의 Spring 부트 단계가 끝난 직후부터 Job 종료 시점까지,* ***main 스레드는 153초 중 81%인 약 124초를 Aurora RO replica의 read 응답 대기에 사용*** *했습니다. CPU가 아닌 Network I/O 대기.*

Spring 기동 22초는 정상 범위였습니다. 문제는 **22초 직후부터 종료까지 약 2분 4초가 거의 전부 Network I/O 상태**였다는 점. 우리가 찾던 "정체불명의 멈춤"이 명확하게 시각화되었습니다.

여기서 **"AwsLogsAppender 때문에 멈춘 게 맞다면 main 스레드가 AWS SDK 호출이나 EC2 메타데이터 호출에서 막혀있어야 한다"** 는 검증 가능한 명제가 만들어졌습니다.

#### 3--4. Socket I/O: 알리바이를 묻는 한 장의 표

다음으로 **Java Application → Socket I/O → Read** 를 열었습니다. 이 패널은 **언제, 어떤 스레드가, 어떤 호스트로, 얼마나 오래** read를 호출했는지를 이벤트 단위로 다 기록하고 있습니다.

처음에는 정렬을 **Duration 내림차순** 으로 두고 봤습니다. 가장 오래 걸린 read가 어디로 갔는지가 핵심이니까요. 그리고 **그룹핑을 "Remote Address"** 로 바꾸자, 한 화면에 답이 나왔습니다.
![](https://cdn-images-1.medium.com/max/1024/1*R_uha8kYcywiOwdyuYoW3Q.png)*Main 스레드는 Aurora RO 73회 + Aurora cluster 63회로* ***총 138회 read, 누적 124.62초*** *. 반면 우리가 의심했던 CloudWatch Logs로의 read는* ***0.28초(282ms), 12회*** *, 그것도* *BATCH_AWS_DIRECT Async Worker 라는 별도 워커 스레드에서 발생했습니다. main 스레드의 hang과 무관하다는 결정적 단서입니다.*

이벤트 단위로 시간 축에 풀어보면 더 명확합니다.
![](https://cdn-images-1.medium.com/max/1024/1*TaVRNuI_Eb0aXk_XmqwKFg.png)*19초 부근부터 빨간 점(Aurora RO replica로의 read)이 줄지어 등장하고, 각각이* ***1\~4초씩 걸립니다.*** *100초 부근부터는 주황(Aurora cluster endpoint)으로 전환되며 비슷한 패턴이 이어집니다. CloudWatch(녹색) 점들은 모두* ***10\~30ms 구간에 머물러*** *거의 바닥에 깔려 있습니다.*

실제 수치는 다음과 같습니다 (jfr CLI로 SocketRead 이벤트 150건을 호스트별로 집계).

* **Aurora RO Replica** (출발: main 스레드) --- 누적 **79.67s** / **73회** / 평균 1,091ms
* **Aurora Cluster --- writer endpoint** (출발: main 스레드) --- 누적 **44.95s** / **63회** / 평균 714ms
* **소계 --- Aurora 전체** (출발: main 스레드) --- 누적 **124.62초** / **136회**
* **CloudWatch Logs** (logs.ap-northeast-2.amazonaws.com, 출발: BATCH_AWS_DIRECT Async Worker) - 누적 **0.28s** / 12회 / 평균 23ms
* **Secrets Manager** (출발: main 스레드) --- 누적 0.04s / 2회 / 평균 21ms

이 한 장의 표에서 **세 가지가 한꺼번에 결판**났습니다.

1. **Main 스레드가 막힌 곳은 Aurora 두 엔드포인트였다.** 합쳐서 136번의 read, 누적 124.62초. (이 외에 RO 응답 패킷 일부가 같은 read로 합쳐 잡혀 표시 카운트가 138까지 올라갑니다.)
2. **CloudWatch Logs 호스트로의 read는 0.28초(282ms)뿐이었다.** main 스레드도 아니고 별도 워커(BATCH_AWS_DIRECT Async Worker)에서 발생했습니다.
3. **다른 AWS 메타데이터·시크릿 호출**도 합쳐서 50ms 미만이었습니다.

> *즉* *AwsLogsAppender는* ***워커 스레드에서 282ms만 쓰고 사라졌고*** *, AWS credential/메타데이터 탐색도 사실상 즉시 끝났습니다. 정황 증거(콘솔 로그의 "Creating AWSLogs Client")는 그저* ***그 시점에 마지막으로 찍힌 stderr 출력이었을 뿐*** *, hang의 원인이 아니었습니다.*

**알리바이 성립.** 가설은 죽었습니다.

이 표 하나가 없었다면 저희는 다음 PR로 \<neverBlock\>true\</neverBlock\> 한 줄을 바꾸거나, AWS SDK Client를 eager init하는 코드를 추가하는 작업을 했을 겁니다. 그래봐야 hang은 그대로 남았겠죠.

#### 3--5. Method Profiling: main이 막힌 진짜 코드 경로

이제 **"main 스레드가 Aurora RO에 138번 socket read를 한 건 어떤 코드 경로 때문인가"** 가 다음 질문이었습니다.

같은 JFR 파일에서 **Java Application → Method Profiling** 을 열었습니다. 이 패널은 sampling 기반으로 **시간 동안 어느 메서드가 스택에 가장 자주 등장했는지** 를 누적으로 보여줍니다. main 스레드만 필터링하고 누적 시간 내림차순으로 정렬하니, 상위 스택이 뚜렷하게 한 경로를 가리켰습니다 (회사 코드 식별자는 가렸습니다).

```
[ main thread, 누적 ~120s ]
  java.net.SocketInputStream.read                              (~120s, 99%)
    └─ com.mysql.cj.protocol.... (MySQL Connector)
      └─ org.hibernate.sql.exec.internal.JdbcCallImpl ...
        └─ org.hibernate.query.sqm.internal.ConcreteSqmSelectQueryPlan ...
          └─ ...BatchQueryReader.findItemsInPartition           ← 등장 횟수 138회
            └─ ...BatchPreloaderService.preloadPlan
              └─ ProcessBatchUnitTasklet
```

여기서 두 가지가 보였습니다.

* 가장 깊은 원인은 SocketInputStream.read. 즉 main 스레드는 **MySQL 응답을 기다리는 데** 시간을 썼습니다.
* 그 위로 올라가면 우리 측 배치 코드가 보입니다. BatchQueryReader.findItemsInPartition **(가명)이 138회 등장.** 이름 그대로, **partition(작은 작업 단위) 하나당 한 번씩 호출되는 메서드**입니다.

#### 3--6. 코드를 펴고: N+1을 눈으로 확인

JFR이 가리킨 코드 경로를 따라 IDE에서 메서드를 열어봤습니다. 그리고 호출부에서 곧바로 패턴이 보였습니다 (실제 클래스/엔티티명은 추상화).

```
// BatchPreloaderService.preloadPlan() — 의사 코드
List<Partition> partitions =
    reader.findPartitionsInGroup(group);            // 1회
```

```
for (Partition partition : partitions) {
    reader.findItemsInPartition(group, partition);  // N회 (← N+1)
}
```

전형적인 **N+1** 입니다. 거기에 한 가지 미스터리가 더 있었습니다. 똑같은 코드를 dev DB나 한산한 시간대에 돌리면 한 쿼리가 **7ms** 정도밖에 안 걸렸다는 점. 그런데 JFR이 잡은 운영 환경에서는 **1.6\~1.7초**가 나왔죠.

차이의 정체를 확인하기 위해 운영 DB에서 두 가지를 추가로 측정했습니다.

* **Idle DB** (낮 시간, 단건 측정): 한 쿼리 **7ms** *(평소 dev/QA에서 보던 값)*
* **Burst** (Jenkins 배치 5건 동시 실행): 한 쿼리 **1,600ms** *(RDS RO replica* Threads_connected ≈ 600*)*

차이는 **Aurora RO replica의 CPU/IO 포화** 였습니다. 평소엔 7ms로 끝나는 쿼리가, **여러 JVM이 동시에 read를 쏘는 burst 시점** 에는 200배 늦어집니다. 그 1.6초가 138번 곱해지면 **약 2분.** Partition 300개를 넘는 대형 작업이 burst에 끼어들면 **수 분\~10분**이 됩니다. 12분 hang의 정체였습니다.

#### 3--7. 정리: 추적 흐름 한눈에

```
[Jenkins 콘솔 로그: 'Creating AWSLogs Client → 5분 침묵']
            ↓
[가설: AwsLogsAppender Eager Init]
            ↓
[JFR 활성화 — JVM 옵션 1줄]
            ↓
[batch-jfr-244094.jfr 다운로드]
            ↓
[JMC: Threads → main이 2분간 Network I/O]
            ↓
[JMC: Socket I/O → Read (그룹핑: Remote Address)]
            ↓
   ├── Aurora RO 138회 / 124.7s   ┐
   └── CloudWatch 282ms            │ → 가설 무너짐
                                   │   AwsLogsAppender 282ms뿐
            ↓
[JMC: Method Profiling
       → findItemsInPartition 138회]
            ↓
[코드 확인 → partition 단위 N+1 패턴]
            ↓
[운영 DB 실측: idle 7ms vs burst 1,600ms]
            ↓
[진짜 원인 확정: N+1 × Aurora RO 포화]
```

이 흐름 전체가 **JFR 파일 하나 + JMC 세 개의 패널 (Threads / Socket I/O / Method Profiling)** 만으로 도출됩니다. 외부 도구도, 추가 코드도 필요 없습니다.

### 4. 가설 검증과 수정: JFR이 만들어준 정확한 타깃

원인이 확정되니 수정 방향은 단순했습니다. **N개의 partition 쿼리를 1개로 묶기.** 코드 식별자는 모두 추상화한 의사 코드로 정리합니다.

```
// AS-IS: partition별 N+1
public List<Item> findItemsInPartition(Group group, Partition partition) {
    return queryFactory
        .select(...)
        .from(table)
        .join(...)
        .where(commonCondition(group), partitionFilter(partition))  // ← partition 필터
        .fetch();
}
```

```
// TO-BE: group 단위 통합 + Java에서 그룹핑
public List<Item> findAllItemsInGroup(Group group) {
    return queryFactory
        .select(...)
        .from(table)
        .join(...)
        .where(commonCondition(group))                              // partition 필터 제거
        .orderBy(partitionOrder.asc(), ...)
        .fetch();
}
```

호출부도 partition 루프를 걷어냈습니다.

```
List<Item> all = reader.findAllItemsInGroup(group);
```

```
// 기존 "지그재그 순회" 같은 도메인 정렬 규칙은 Java에서 처리
Map<String, List<Item>> byPartition = all.stream()
    .collect(groupingBy(Item::partitionKey, LinkedHashMap::new, toList()));
```

```
List<Item> ordered = new ArrayList<>();
int i = 0;
for (var entry : byPartition.entrySet()) {
    var items = entry.getValue();
    if (i % 2 == 1) items = Lists.reverse(items);
    ordered.addAll(items);
    i++;
}
```

#### 4--1. 운영 DB 시뮬레이션 (배포 전 검증)

PR을 올리기 전, 운영 DB(Idle 시간대)에서 새 쿼리를 실측했습니다.

* **소형** (1 group / 1 partition) --- 기존 23ms → 신규 23ms (**동일**)
* **중형** (15 group / 220 partition) --- 기존 3,100ms → 신규 370ms (**8.4×**)
* **대형** (32 group / 470 partition, 실측) --- 기존 6,528ms → 신규 768ms (**8.5×**)
* **대형 다른 경로** (31 group / 470 partition) --- 기존 6,214ms → 신규 429ms (**14.5×**)

**소형은 그대로, 큰 작업일수록 효과가 큽니다.** N+1의 N이 클수록 차이가 벌어지는 게 당연합니다.

#### 4--2. JFR 시나리오 재시뮬레이션

JFR이 보여준 244094 케이스(burst, 1.6s/쿼리)를 다시 추정해보면,

* **Socket read 횟수** : 138회 → **30\~40회**
* **Job 시간 (5건 BULK)** : \~67분 (worst) → **\~8.5분**
* **RO Replica 부하** : 100% → **약 12.5%**

쿼리 수 자체가 1/8 이하로 줄어드니, **다른 동시 실행 JVM과의 부하 경합도 같이 해소** 됩니다. 이게 단순히 "내 Job이 빨라진다"가 아니라, **인근 Job들도 같이 빨라지는** 효과를 만듭니다.

### 5. 두 번째, 세 번째 JFR: 수정 검증과 잔여 케이스

배포 후 진짜로 좋아졌는지 확인하기 위해, 같은 패턴으로 JFR을 두 번 더 받았습니다.

#### 5--1. batch-jfr-244700 - 수정 직후 검증

수정 PR 배포 직후 받은 JFR입니다. Method Profiling에서 N+1을 만들던 메서드(findItemsInPartition)가 사라지고 통합 메서드(findAllItemsInGroup)만 남은 것을 확인했습니다. Aurora RO socket read가 **138회 → 32회**로 줄어든 것도 이벤트 카운트로 보였습니다.

#### 5--2. batch-jfr-244869 - 12분 케이스 추가 검증

며칠 뒤 12분 걸린 Job이 한 번 더 발생했습니다. 새로 받은 JFR을 분석해보니 이건 **다른 종류의 문제**였습니다.

* N+1은 더 이상 나타나지 않음
* 대신 **다른 통합 쿼리 한 건이 자체적으로 느림**
* 같은 시간대에 5건이 BULK로 묶여 들어와 RO replica가 한계 근처

이건 단일 쿼리 최적화로는 임계점만 미루는 케이스라 판단해, **Temporal 워크플로우 이관 시 함께 정리** 하는 것으로 의사결정하고 별도 티켓으로 분리했습니다. JFR이 없었다면 "또 hang이다"라고 같은 말만 반복했을 텐데, 이번엔 **남은 잔불의 정체와 한계를 명확히 분리**할 수 있었습니다.

### 6. 정량 결과

**0단계**

* **개선 전** *(Tasklet, Long TX)*
* 단건 평균 **526.7s** / 단건 최악 **5,035s**
* *12분 hang 빈발*

**1단계**

* **Reader/Writer 분리 + Long TX 분해**
* 단건 평균 **41.2s (12.8×↑)** / 단건 최악 **113s (44.6×↑)**
* *처리량은 좋아졌으나 hang 잔존*

**2단계**

* **JFR로 N+1 식별 + 쿼리 통합**
* 단건 평균 **30s 수준** / 단건 최악 **60\~90s 추정**
* ***hang 사라짐 (RO 부하 1/8)***

**커밋 한 줄 단위로 나누어 보면** , JFR이 결정적이었던 구간은 1단계와 2단계 사이의 "보이지 않던 잔불"을 보이게 만든 부분입니다. 거기서 N+1을 짚어낸 것이 가장 큰 임팩트였고, 부수적으로 **RO replica 부하 자체를 1/8 수준으로 줄여** 인접 Job들의 안정성도 확보했습니다.

### 7. Lesson Learned

#### 7--1. "코드 변경 없이 진단할 수 있다"는 것의 가치

이번 케이스에서 가장 크게 체감한 점은, **운영 코드를 한 줄도 건드리지 않고 hang 원인을 짚어냈다** 는 것입니다. 디버깅을 위해 로깅을 추가하거나 인스트루멘테이션을 박는 순간 PR/리뷰/배포 사이클이 한 바퀴 돌고, 그 변경 자체가 새 위험을 만듭니다. 게다가 hang은 **재현이 안 되는 게 본질**이라 "다음 발생까지 기다려서 데이터 받기"도 어려운 사이클입니다.

JFR은 그 사이클 자체를 통째로 우회합니다. **JVM 옵션 한 줄, 코드 변경 0줄, 운영 PR 0건.** 이 가치가 thread/heap dump를 포함한 다른 도구와 비교해서 가장 컸습니다.

#### 7--2. "가장 그럴듯한 가설"이 가장 위험합니다

저희에겐 이미 매력적인 용의자가 있었습니다. AwsLogsAppender는 운영 hang의 단골 범인이고, "Creating AWSLogs Client" 직후 침묵이라는 정황까지 완벽했습니다. **그대로 PR을 올렸으면 appender를 비동기화하거나 제거했을 텐데**, 그래봐야 hang은 사라지지 않았을 겁니다. 진짜 원인은 N+1이었으니까요.

JFR은 **"가설을 죽이는 도구"** 였습니다. AwsLogsAppender가 282ms밖에 안 썼다는 사실 한 줄로 잘못된 PR이 막혔습니다.

#### 7--3. JFR은 운영에서 "켜놓고 사는" 게 맞습니다

처음엔 hang이 발생할 때만 켤까 고민했는데, hang은 **재현이 안 되는 게 본질** 이라 그건 답이 아니었습니다. 결국 Jenkins Shell 한 줄로 **always-on** 으로 두는 쪽이 맞았습니다. 오버헤드 1\~2%는 운영 hang 디버깅 가치 대비 매우 저렴합니다. **사람이 hang 시점에 깨어있을 필요가 없다**는 것 자체가 thread/heap dump 대비 큰 차이입니다.

#### 7--4. APM과 JFR은 보는 층위가 다릅니다

저희는 APM(DataDog)을 이미 쓰고 있습니다. APM은 "어떤 트랜잭션이 느렸나"는 잘 보여주는데, **"기동 직후 첫 쿼리가 나가기 전 22초\~수 분 사이에 main 스레드가 어디서 막혔는가"** 같은 질문에는 잘 답하지 못합니다. JFR은 그 빈틈을 채웁니다. **둘은 대체재가 아니라 보완재**입니다.

#### 7--5. Connection Pool 같은 "그럴듯한 처방"의 함정

이 이슈를 처음 만났을 때 저희는 Batch DB Pool을 10에서 20으로 늘렸습니다. 분명 처음엔 좋아진 것처럼 보였는데, 측정해보니 **단건 처리 동시성이 1짜리 배치에 풀 증설은 의미가 없었습니다.** "다들 그렇게 한다"는 패턴은 측정 없이 따라가지 않는 게 맞습니다. 결국 JFR로 진짜 원인을 짚은 뒤, Connection Pool은 다시 10으로 롤백했습니다.

#### 7--6. N+1은 한적한 시간엔 안 보입니다

이번 N+1은 평소(낮·idle) DB에서는 한 쿼리가 7ms이라 잘 드러나지 않았습니다. 부하 burst가 와서 한 쿼리가 1.6초가 됐을 때 200배가 누적돼 폭발했죠. **운영 부하 시나리오를 흉내낸 측정**이 정기적으로 필요하다는 걸 실감했습니다.

### 8. 향후 과제

* **Temporal 워크플로우 이관**: 두 번째 12분 케이스에서 보였던 "단일 쿼리 임계점" 문제는 워크플로우 엔진 전환 시 함께 정리할 예정입니다.
* **JFR 상시화**: 다른 배치 Job에도 같은 패턴(JVM 옵션 + archive 설정)을 표준화하고 있습니다.
* **부하 시뮬레이션 정례화**: idle DB에서 "괜찮아 보이는 쿼리"가 burst에서 폭발하는 패턴을 잡아낼 수 있는 정기 부하 측정 체계를 검토 중입니다.

### 9. 한 가지 더: AI 시대에 이 도구를 다시 만난 이야기

이 글을 쓰면서 한 가지 짚고 가고 싶은 게 있습니다. **JFR이라는 도구를 저희가 처음부터 떠올린 게 아니라는 점**입니다.

처음 이 hang을 맞닥뜨렸을 때 저희가 가장 먼저 한 생각은 사실 이런 흐름이었습니다.
> *"운영 코드는 절대 안 건드리고 싶다. 그렇다고 SRE를 깨우기엔 가설이 너무 약하다.* ***운영 환경에서 코드 변경 0줄로 JVM 내부를 들여다볼 수 있는 방법이 뭐가 있지?*** *"*

이 질문을 그대로 AI에게 던졌습니다. 그리고 돌아온 첫 줄이 **"Java Flight Recorder를 켜보는 게 어떨까요?"** 였습니다. 솔직히 처음 듣는 도구는 아니었습니다. JDK 11에 들어왔다는 정도로만 알고 있었고, 실제로 운영에서 켜본 적은 없었습니다. **"알고 있긴 한데 한 번도 안 써본 도구"** 였죠.

여기서 흥미로운 부분이 있습니다.

#### 9--1. AI가 코드를 짜준 게 아니라, 도구를 짚어줬습니다

요즘 AI 협업이라고 하면 보통 "코드 자동 생성"을 떠올립니다. 그런데 이번 케이스에서 AI가 한 일은 코드 생성이 아니라 **잊혀지거나 사용되지 않던 도구를 다시 끌어올려 준 것**이었습니다.

* 저희의 요구는 "운영 코드 0줄 변경 / 시간 축 / 항상 켜둠 / hang 종료 후에도 분석 가능"이라는 **제약 조건의 조합**이었고
* AI는 이 제약 조합을 만족하는 도구로 **JFR**을 제시했고
* 사람은 그 제안을 받아 **운영 환경(Jenkins Execute Shell)에 맞춰 트랩과 archive 설정으로 재조립**했습니다

이 분업이 의외로 잘 맞았습니다. AI는 도구의 폭(2014년부터 존재하는 OpenJDK 기능까지)을 끌어와 주고, 사람은 우리 운영 환경의 세부 제약(Jenkins workspace 공백 경로 이슈, ECS가 아닌 EC2 agent, AwsLogsAppender 의심 등)을 끼워 맞춥니다.

#### 9--2. "운영 코드를 건드리지 않는다"는 요구는 점점 표준이 됩니다

AI와 페어로 일하는 시간이 늘면서, 한 가지 패턴이 또렷해지고 있습니다. **변경의 단위가 작을수록 AI의 도움을 받기 쉽고, 변경이 운영에 닿을수록 사람의 책임이 커진다**는 점입니다.

그래서 디버깅에서도 같은 비대칭이 생깁니다.

* 코드를 고쳐서 로깅을 박는 디버깅은 **PR/리뷰/배포/롤백**이라는 무거운 사이클이 따라붙고, 이 사이클은 사람이 책임져야 합니다.
* 반면 JFR처럼 **JVM 옵션 한 줄로 끝나는 디버깅**은 사이클이 거의 0이고, AI에게 가설을 빠르게 시험해볼 여지가 큽니다.

이번 글이 단지 "JFR을 써보세요"가 아닌 이유가 여기 있습니다. **운영 코드를 건드리지 않고 진단할 수 있는 도구의 가치는 AI 시대에 더 커집니다.** AI와 함께 가설을 빠르게 던지고 죽일 수 있으려면, 그 가설을 검증할 도구가 운영에 부담을 주지 않아야 하기 때문입니다.

#### 9--3. AI 시대의 디버깅 = "도구를 다시 발견하는 일"

JFR은 새 도구가 아닙니다. JEP 328로 OpenJDK에 들어온 게 이미 한참 전이고, 학습 자료도 충분합니다. 그럼에도 국내 백엔드 생태계의 프로덕션 환경에서 이를 적극적으로 도입한 사례는 여전히 드문 편입니다. **"있는 줄은 알지만 안 쓰는"** 도구로 남아있죠.

AI는 이런 "알려져 있지만 잊힌 도구"를 다시 꺼내주는 데 의외로 능합니다. 학습 데이터 내에 해당 기술의 매뉴얼, 아키텍처 설계 의도, 유즈케이스가 다 들어가 있으니까요. 사람은 이 시점에서 두 가지 역할을 할 수 있습니다.

1. **도구의 적합성을 운영 환경에 맞춰 검증**: "JMC 오버헤드가 1\~2%인 게 우리 Jenkins agent에서도 사실인가? 메모리 버퍼는 어떻게 잡아두는가?" 같은 질문을 직접 측정을 통해 검증하는 역할
2. **AI가 모르는 사내 컨텍스트를 끼워 맞추기**: "Jenkins workspace 경로에 공백이 있다", "stdout이 ECS awslogs driver가 아니라 Jenkins console로 가는 구조다" 같은 환경 디테일을 파악하고 조율하는 역할

이번 추적기는 결과적으로 **AI가 끌어온 도구 + 사람이 끼운 운영 컨텍스트** 의 합작이었습니다. 그리고 그 합작이 가능했던 가장 큰 이유는, **JFR 자체가 운영 코드를 건드리지 않는 도구라서** 그 빠른 가설-검증 사이클을 돌릴 수 있었기 때문입니다.
> *만약 디버깅에 코드 변경이 필요했다면 사이클 한 바퀴마다 PR·리뷰·배포가 들어가서, AI와의 협업 속도가 무용지물이 됐을 겁니다.* ***도구가 가벼워야 협업도 가벼워집니다.***

### 마치며

JFR은 신문물이 아닙니다. 2014년 OpenJDK에 들어왔고, 이미 많은 분들이 알고 있는 도구입니다. 하지만 **운영에서 실제로 켜고,** .jfr **파일을 받아서, 가설을 죽이는 데까지 쓰는 사례**는 의외로 드뭅니다. 보통은 thread dump, heap dump, APM에서 멈춥니다.

이번 이슈에서 가장 인상 깊었던 순간은 JFR을 켠 게 아니라, **"AwsLogsAppender 282ms"** 라는 한 줄을 본 순간이었습니다. 그 한 줄 덕분에 잘못된 방향의 PR이 막혔고, 진짜 범인을 찾을 수 있었습니다.

저희 팀은 앞으로 Jenkins 기반 배치 구조를 점진적으로 **Temporal 워크플로우로 이관** 할 예정입니다. 그렇다고 해서 그 전까지 운영을 그냥 버틸 수는 없습니다. **이관이 완료되기 전까지의 안정 운영은 별개의 과제**이고, 그 과정에서 만난 hang/지연을 어떻게 잡아냈는지는 같은 구조를 운영하는 다른 팀들에게도 그대로 적용 가능한 자산이라 생각합니다.

특히 Jenkins로 Spring Batch를 트리거하는 구조는,

* 매 Job마다 **JVM이 새로 기동**되기 때문에 lazy init / eager init / 라이브러리 첫 호출의 비용이 매번 반복됩니다
* **stdout 수집 경로**가 ECS와 다르고, 로그 인프라(awslogs driver/DataDog agent/직접 appender)에 따라 함정이 다릅니다
* **Slot 단위 점유**라 하나의 hang이 인접 Job 큐 대기를 유발합니다
* 이런 특성이 있어 hang/지연 디버깅이 ECS 기반 long-running 서비스보다 까다롭습니다. 비슷한 구조를 운영 중이시라면, 이번 사례에서 두 가지만 챙겨가셔도 의미가 있다고 생각합니다.

1. **Jenkins Execute Shell에 JFR 옵션 한 줄 추가하기.** 운영에 부담 없는 수준이고, 다음 hang 때 답을 빨리 찾게 해줍니다.
2. **"가장 그럴듯한 가설"을 의심하기.** Eager Init / Connection Pool / Credential 같은 단골 용의자가 모두 알리바이를 가지고 있을 수 있습니다. JFR은 그 알리바이를 묻는 가장 빠른 도구입니다.

그리고 또 하나 --- **운영 코드를 건드리지 않는 도구의 가치는 AI 시대에 점점 더 커집니다.** AI와 함께 빠르게 가설을 던지고 죽이려면, 그 가설을 검증할 도구가 운영에 부담을 주지 않아야 합니다. JFR은 그 조건을 만족하는 가장 가벼운 옵션 중 하나입니다.

복잡한 도구가 아니라, **JVM 옵션 한 줄**입니다. 운영 hang에 한 번이라도 시간을 잃어본 적이 있다면, 다음 배치 Job 빌드 스크립트에 이 한 줄을 추가해보시기 바랍니다.

```
-XX:StartFlightRecording=name=app,settings=profile,dumponexit=true,filename=/tmp/app.jfr
```

그리고 다음에 이상한 침묵이 찾아오면, 도구가 알리바이를 따져줄 것입니다.

#### 참고 자료

* [JEP 328: Flight Recorder](https://openjdk.org/jeps/328)
* [JDK Mission Control](https://www.oracle.com/java/technologies/jdk-mission-control.html)
* IntelliJ IDEA --- Profiler (JFR 파일 직접 열기 지원)

### TEAM MUSINSA CAREER

> *무신사는 2001년 온라인 커뮤니티로 시작해 2005년 무신사 매거진, 2009년 무신사 스토어를 오픈하며 빠르게 성장하고 있는 국내 대표 온라인 패션 스토어입니다. '입점 브랜드와 동반성장'이라는 경영 철학을 바탕으로 브랜드가 안정적으로 사업을 전개할 수 있도록 무신사가 보유한 노하우와 인프라를 지원합니다. 고객에게는 풍성한 패션 콘텐츠와 패션에 특화된 차별화된 서비스로 최상의 온라인 쇼핑 경험을 제공하고 있습니다. 글로벌 №1 패션 기업으로 성장할 무신사와 함께 새로운 도전과 혁신을 만들 인재를 기다립니다.*
> *29CM는 '고객의 더 나은 선택을 돕는다'라는 미션으로 출발했습니다. 우리는 우리만의 방식으로 콘텐츠를 제공하며, 브랜드와 고객 모두에게 대체 불가능한 커머스 플랫폼을 만들어가고 있습니다. 이 미션을 이루기 위해 우리는 흥미로우면서도 복잡한 문제들을 해결하고 있습니다. 만약 우리와 함께 이 문제들을 해결해 보고 싶다면, 주저하지 말고 29CM에 합류하세요!*
> [*🚀 팀 무신사 채용 페이지*](https://www.musinsacareers.com/ko/home)*(무신사/29CM 전체 포지션 확인이 가능해요)*
> *🚀* [*팀 무신사 테크 소식을 받아보는 링크드인*](https://kr.linkedin.com/company/musinsacom)
> *🚀* [*팀 무신사 뉴스룸*](https://newsroom.musinsa.com/)
![](https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=e1578cb49bfa)

*** ** * ** ***

[의심했던 범인은 알리바이가 있었다.](https://techblog.musinsa.com/%EC%9D%98%EC%8B%AC%ED%96%88%EB%8D%98-%EB%B2%94%EC%9D%B8%EC%9D%80-%EC%95%8C%EB%A6%AC%EB%B0%94%EC%9D%B4%EA%B0%80-%EC%9E%88%EC%97%88%EB%8B%A4-e1578cb49bfa) was originally published in [MUSINSA techblog --- 무신사 테크 블로그](https://techblog.musinsa.com) on Medium, where people are continuing the conversation by highlighting and responding to this story.