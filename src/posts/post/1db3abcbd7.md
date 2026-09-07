안녕하세요, 힐링페이퍼에서 백엔드 엔지니어로 재직 중인 Manggo입니다.

미용 의료 병원향 SaaS팀에서 서버 아키텍처와 셋업 등 알차고 다양한 경험을 하게 되었고, 이 경험을 공유해보려고 합니다.

제가 공유하고자 하는 내용은 총 3개가 있습니다.

1. Github actions, Private EKS Cluster를 이용한 CI/CD pipeline를 어떻게 구축하였는지
2. SaaS 서비스에서 확장이 쉬운 엔터프라이즈 환경을 어떻게 구축하였는지
3. 엔터프라이즈 환경에서 각 서비스별 비밀정보들은 어떻게 관리하였는지

저희 서비스는 쿠버네티스 클러스터 위에서 구동하고 있고, 주로 AWS를 이용하여 인프라를 구축하기 때문에 AWS EKS(Elastic Kubernetes Service)를 이용하고 있습니다. 또한 보안을 고려해서 EKS 엔드포인트를 Public으로 열어두지 않고 Private으로 설정하여 운영합니다.

이번 글에서는 Private EKS 클러스터 기반에서 GitHub Actions를 활용해 CI/CD 파이프라인을 구축하고 있는 분들에게 도움이 되는 내용을 소개하고자 합니다.

## Infra architecture

힐링페이퍼 조직은 단일 AWS account를 사용하는 것이 아닌 멀티 AWS account를 이용하고 있습니다.

이 글에서 다룰 주제에 필요한 AWS 계정들을 간략하게 나열해 보자면, 다음과 같습니다.

* 공통 자원들이 존재하는 shared account
* development용 account
* production용 account

shared account에는 Docker image repository(ECR), GitHub Actions runner용 ec2 등 제품에 간접적으로 관여하며 공통으로 이용을 하는 자원들이 있고, development용, production용 account에는 EKS cluster, AWS Secret Manager 등 제품이 직접적으로 관여하는 자원들이 있습니다.

## Action Runner approach to EKS Cluster

저희는 deploy를 위해서 private vpc에 존재하는 eks cluster에 github action runner가 어떻게 붙어야 할지에 대한 해결책을 찾아야 했습니다. 이때 두가지 방법을 떠올리게 되었는데, 첫번째는 github에서 제공하는 action runner의 ip대역들을 열어주는 방법, 두번째는 private vpc에 self hosted runner를 구축하여 vpc내부 통신을 하여 접근을 하는 방법 입니다. 첫번째 방법은 다양한 ip대역을 통신할 수 있도록 열어주는 위험성과 github에서 변경이 될때마다 대응을 해야 한다는 단점이 크게 다가왔기 때문에 두번째 방법을 선택하게 되었습니다.

1. shared account에 self-hosted runner를 위한 EC2를 띄우고 runner를 구동시킵니다.
   1. 위 background문서를 참고하시면 GitHub에서 self-hosted runner를 이용하여 자신만의 runner환경을 구축할 수 있도록 제공해주고 있습니다.
2. 1번에서 생성한 EC2가 있는 VPC와 EKS 클러스터가 있는 VPC를 연결합니다.
3. development, production account에 있는 EKS 클러스터에 접근 할 수 있는 IAM role을 생성합니다.
4. AWS IAM OIDC에 GitHub Actions용 OIDC를 설정합니다([link](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#adding-the-identity-provider-to-aws))

그 후, GitHub Actions Job에서 EKS 클러스터에 접근 할 수 있는 IAM role을 assume하면 runner에서 EKS에 접근이 가능하게 됩니다.

ex)

    jobs:
      deploy:
        name: {your_job_name}
        runs-on: {your_self_hosted_runner_tags}
        permissions:
          id-token: write# This is required for requesting the JWTcontents: read# This is required for actions/checkoutsteps:
          - name: Checkout
            uses: actions/checkout@v2
            with:
              fetch-depth: 1

          - name: Configure Aws Credentials
            uses: aws-actions/configure-aws-credentials@v1
            with:
              aws-region: ap-northeast-2
              role-to-assume: {your_iam_role_arn_for_accecing_eks_cluster}

이를 통해서 GitHub Actions을 통해 EKS에 접근할 수 있도록 되었습니다.

#### Apply k8s resource yaml file to EKS Cluster by Using Github Actions

Github actions을 통해서 eks cluster에 접근이 가능해졌기 때문에 k8s command를 runner에서 가능해졌습니다.

이제 action에서 kube config셋팅을 하고 kubectl command를 호출하게 되면 deploy를 위한 준비는 끝났습니다.

    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --region ap-northeast-2 --name {your_eks_clust_name} --role-arn {your_role_to_access_eks}

    - name: Deploy
      run: kubectl apply -f {your_k8s_yaml_file}

위와 같이 GitHub Actions를 통해 쿠버네티스 리소스 매니페스트를 EKS 클러스터에 적용시킬 수 있게 되었습니다.

#### CI

runner를 통해서 kubernetes에 command까지 정상적으로 실행되는거 까지 완성이 되었습니다.

이제 실제 appliction을 build하고 build된 docker image를 k8s에 띄워야 하는데, CI pipeline을 통해서 image build및 push까지 하는 방법을 알아보겠습니다.

1. AWS ECR에 image repository를 생성합니다.
   * docker hub혹은 다른 image repository를 이용해도 상관은 없습니다. 저희는 AWS ECR을 이용하였습니다.
2. self hosted runner가 구동되고 있는 EC2 IAM role에 ecr repository관련 permission들을 추가해줍니다.

    jobs:
      build:
        name: {your_job_name}
        runs-on: {your_self_hosted_runner_tags}
        permissions:
          id-token: write
          contents: read
        steps:
          - name: Checkout
            uses: actions/checkout@v2
            with:
              fetch-depth: 1

          - name: Configure Aws Credentials
            uses: aws-actions/configure-aws-credentials@v1
            with:
              aws-region: ap-northeast-2

          - name: Login to Aws ECR
            id: login-ecr
            uses: aws-actions/amazon-ecr-login@v1

          - name: Docker Build & Push
            run: |
              {your_docker_image_build_script}
              docker push {IMAGE_REPOSITORY}:$IMAGE_TAG

위 예시와 같이 action flow를 작성하면 runner에서 EC2에 붙어있는 있는 role을 assume 받고, ECR에 login한 뒤 docker image를 build하고 push까지 가능해졌습니다.

#### Summary

대략적으로 위에 설명한 내용을 그림으로 표현하고 요약하자면 다음과 같습니다.

1. self-hosted runner에서 Docker image를 빌드하고 shared account에있는 ECR에 푸쉬한다.
2. self-hosted runner에서 쿠버네티스 Deployment를 각 환경별 클러스터에 적용한다.
3. 각 환경별 클러스터에 있는 서비스들은 shared account에 있는 ECR의 Docker image를 이용하여 구동된다.

## To be continued

지금까지 Private VPC에 존재하는 EKS 클러스터와 GitHub에서 제공하는 GitHub Actions을 연결하여 CI/CD 파이프라인을 구축하는 방법에 대해서 알아보았습니다.

다음 글에서는 SaaS를 위한 쿠버네티스 매니페스트는 어떻게 구성되고 관리를 하였는지, EKS 클러스터를 어떻게 운영하고 있는지에 대해서 소개를 하고자 합니다. 다음 글을 기대해주세요!