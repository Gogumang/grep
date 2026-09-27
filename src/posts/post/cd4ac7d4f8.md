![](https://images.gogumang.com/cd4ac7d4f8/01.png)

안녕하세요! 여기어때컴퍼니 DevOps팀 제이입니다. 😊

저희 팀은 여기어때컴퍼니 Tech 조직 내 개발자들의 업무 몰입을 위한 개발 환경과 체계를 만들어가는 조직으로, 조직별로 상이한 개발 환경을 통합하고 운영하고 있습니다.

이번 글에서는 신규 CI/CD Pipeline에서 어떻게 공통 Helm Chart를 관리하고 있는지 설명드리고자 합니다.

여기어때컴퍼니는 Kubernetes(EKS) 환경에서 서비스를 운영하고 있습니다. 그 과정에서 Helm은 사실상 표준 배포 도구로 자리 잡았고, 각 서비스마다 Helm Chart를 활용한 배포 방식을 채택하고 있었습니다. 하지만 각 애플리케이션에 맞춘 Helm Chart를 서비스마다 개별적으로 관리하면서 반복적인 template 설정 복사와 버전 충돌, 이력 추적의 어려움과 같은 문제들이 있었습니다. 이 글에서는 그런 문제들을 해결하기 위해 Helm Chart Registry를 도입하고, AWS ECR을 활용해 공통 Helm Chart를 관리하게 되기까지의 과정을 정리해보겠습니다.

### Helm Chart Registry가 필요했던 이유

#### Helm Chart?

![](https://images.gogumang.com/cd4ac7d4f8/02.png)

먼저 Helm에 대해 간단히 설명드리도록 하겠습니다. Helm은 Kubernetes 애플리케이션을 패키징하고 관리할 수 있게 해주는 도구입니다. 복잡한 쿠버네티스 리소스 설정을 하나의 단위로 묶어 재사용 가능하게 만들며, Chart라는 패키징 포맷을 통해 버전 관리와 배포를 체계적으로 수행할 수 있습니다.

Chart는 크게 세 가지의 구성요소로 이루어져 있습니다.

* `templates`: 리소스를 정의하는 YAML 템플릿 (*Go Template language*)
* `values.yaml`: 템플릿에 주입할 설정값
* `Chart.yaml`Chart.yaml: Chart 메타데이터 및 버전 정보

#### 무엇이 문제였을까?

![](https://images.gogumang.com/cd4ac7d4f8/03.png)

기존 EKS CI/CD Pipeline에서는 각 애플리케이션의 특성에 맞춰 Helm Chart를 개별적으로 구성하고 관리했습니다. 배포 구성 요소가 유사하더라도 각 서비스는 별도의 Chart 디렉토리에서 자체적인 템플릿과 설정값을 가지고 있었습니다. 하지만 기존 구조에는 다음과 같은 문제들이 있었습니다.

* 애플리케이션마다 중복된 Helm Chart 템플릿을 별도로 관리하면서, 유사한 설정을 반복적으로 복사·붙여넣는 작업이 지속적으로 발생함
* Chart가 각 애플리케이션별로 분산 관리되어 공통 설정을 일괄 변경 및 적용하는 데 어려움이 있음
* 버전 관리가 일관되지 않고 변경 이력 추적이 어려워 언제 어떤 버전의 Chart가 사용되었는지 정확히 파악하기 힘듦

#### 결국, Helm Chart 중앙 관리의 필요성

이 모든 문제의 근본적인 원인은 Helm Chart가 흩어져 있고 각기 다르게 관리된다는 점에 있었습니다. 결국 Helm Chart의 중앙 관리가 필요하다는 결론에 도달했고 DevOps팀은 다음과 같은 방향으로 구조를 재정비하게 되었습니다.
> *✅ 중앙 저장소에서 공통 Helm Chart를 관리하자*
>
> *✅ 각 서비스는 `values.yaml`만 override해서 사용하도록 구조를 단순화하자*
>
> *✅ Helm Chart 자체도 버전으로 배포하고, 엄격히 관리하자*

이를 위해서는 공통 Helm Chart를 저장하고 배포할 수 있는 신뢰할 수 있는 중앙 저장소가 필요했습니다.

#### AWS ECR을 선택한 이유

![](https://images.gogumang.com/cd4ac7d4f8/04.png)

Helm Chart Registry 후보로 ChartMuseum, Nexus, Harbor 등 다양한 대안들을 검토했지만, 최종적으로는 AWS의 Elastic Container Registry(ECR)를 선택하게 되었습니다.

여기어때는 대부분의 서비스를 AWS 환경에서 운영하고 있고, 컨테이너 이미지 저장소로도 이미 ECR을 사용 중이었습니다. 덕분에 Helm Chart 저장을 위해 별도의 인프라를 추가로 구축하거나 관리할 필요가 없었고, 기존 시스템과의 호환성 측면에서도 매우 유리했습니다.

추가적으로 [Helm v3.8.0. 이후부터는 OCI(Open Container Initiative) 기능이 기본 활성화](https://helm.sh/docs/topics/registries/?utm_source=chatgpt.com)되어 있어 AWS ECR과 같은 OCI 호환 레지스트리에 Helm Chart를 저장하고 push와 pull 작업을 CLI로 수행할 수 있습니다. 이를 통해 Helm Chart도 컨테이너 이미지처럼 다루며 버전 관리와 배포 이력 추적이 한층 수월해졌다는 점에서 운영 효율성 향상에 큰 도움이 되었습니다.

### AWS ECR을 어떻게 활용했는가

#### ECR Lifecycle Policy를 활용한 버전 정리

![](https://images.gogumang.com/cd4ac7d4f8/05.png)

Helm Chart는 `.tgz` 형태로 버전별 패키징되어 저장되기 때문에, 시간이 지날수록 ECR 내에 수많은 Chart 버전이 누적됩니다. 운영 초기에는 문제 없지만 시간이 지날수록 사용하지 않는 과거 버전들이 저장소 용량만 차지한 채 남아 있게 되어 관리 포인트가 불필요하게 늘어나는 문제가 발생하게 됩니다.

이러한 문제를 해결하고 저장소를 보다 효율적으로 운영하기 위해, ECR Lifecycle Policy를 적용해서 Helm Chart ECR에 저장된 이미지가 50개를 초과하면 가장 오래된 이미지부터 자동으로 삭제되게 설정하였습니다.

적절한 정리 정책이 없다면 관리 비용이 점점 커지기 때문에, ECR의 Lifecycle Policy를 적극 활용함으로써 저장소 용량뿐만 아니라 운영 복잡도까지 효과적으로 줄일 수 있었습니다.

#### 계층별 Helm Chart 버전 관리

그렇다면 Helm Chart 버전 관리는 어떤 식으로 이루어질까요? 저희는 Helm Chart 버전을 ECR Image Tag 기반으로 관리하고 있는데요, `.tgz` 패키지 파일의 Image Tag로 GitLab Pipeline Number를 포함한 버전 문자열을 사용하고 있어서 CI/CD Pipeline과의 연동도 자연스럽게 이루어집니다.

여기어때에서는 ArgoCD와 ApplicationSet을 활용하여 EKS 클러스터에 다양한 애플리케이션을 배포하고 있습니다. 이 과정에서 각 개발 환경(`dev`, `stage`, `release`)에 맞는 설정값을 `values.yaml`로 주입하고 있으며, 앞서 말씀드린 ECR Image Tag를 기반으로 Helm Chart 버전을 계층별로 다르게 설정할 수 있는 구조로 운영하고 있습니다.

Helm Chart 버전은 아래와 같은 세 가지 계층에서 설정할 수 있으며, 각 애플리케이션에 최종 적용되는 버전은 **Application, Team, Global** 순으로 적용되는 우선순위에 따라 결정됩니다.

**1) Global Level**: 모든 팀과 서비스에 공통 적용되는 Helm Chart 버전

```
global:
  environment: dev
  clusterVersion: ...
  helmStandardVersion: 1.0.0 # 모든 dev 환경에 적용되는 버전
```

**2) Team Level**: 특정 팀에 소속된 서비스 그룹에만 적용되는 버전

**3) Application Level**: 개별 Application에 직접 지정한 버전

```
global:
  teamName: devops
  teamCode: dop
  helmStandardVersion: 1.0.0-104816 # devops 팀에만 적용되는 버전
```

```
applications:
  - project: tutorial
    services:
      - name: test-api
        helmStandardVersion: 1.0.0-112453 # 해당 Application에만 적용되는 버전
```

이렇게 계층별로 Helm Chart 버전을 관리함으로써, 공통 설정에 대한 일관성을 유지하면서 각 서비스의 테스트 및 운영 상황에 맞춰 유연하게 버전 롤링을 진행할 수 있었습니다. 또한 팀이나 서비스 단위로 점진적인 업그레이드를 시도할 수 있어 전체 시스템의 안정성을 해치지 않으면서도 최신 기능을 점진적으로 반영할 수 있었습니다.

### 다음으로

Helm Chart Registry를 도입한 이후 가장 뚜렷하게 체감된 변화는 바로 **버전 기반 배포의 일관성** 을 확보한 점이었습니다. 기존에는 배포 시마다 Chart의 상태가 다소 불투명하거나 수동으로 관리되는 경우가 많아, 동일한 배포를 재현하거나 이슈 발생 시 정확한 원인 분석 및 롤백에 어려움이 있었습니다. 그러나 Helm Chart Registry를 중심으로 배포 Pipeline을 재정비하면서 배포가 **명확한 Chart 버전을 기준으로 관리**되기 시작했고, 이런 문제들이 많이 해소되었습니다.

또 **버전 태깅을 기반으로 한 안정적인 롤백 체계** 가 마련되면서 문제가 발생했을 때 “어떤 버전이 어떤 시점에 배포되었는지”를 명확히 파악할 수 있고, 이전 상태로의 복구 또한 신속하고 안전하게 이뤄질 수 있게 되었습니다. 동시에 동일한 구성을 다양한 환경에 손쉽게 재현할 수 있게 되면서 신규 애플리케이션의 EKS 환경 배포 속도와 품질도 크게 향상되었습니다. 더불어 개발팀과 운영팀 간의 **커뮤니케이션 효율**도 높아질 수 있었습니다.

다음 글에서는 현재 저희가 운영 중인 신규 CI/CD Pipeline 내에서 공통 Helm Chart를 어떻게 설계하고 최적화했는지, 그리고 그것이 어떻게 서비스 전반의 배포 품질과 유지보수성을 높였는지에 대한 구체적인 전략과 고민들을 공유드리겠습니다.

끝까지 읽어주셔서 감사합니다.

계속해서 더 나은 배포 문화를 만들어가겠습니다. 🚀🙇🏻‍♂️

Refer. <https://helm.sh/>