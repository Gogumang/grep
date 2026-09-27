![](https://images.gogumang.com/c67baa6d5e/01.png)
> ***바쁜 현대인을 위한 3줄 요약 🚀***
>
> ****1. GitLab CI와 ArgoCD를 활용한 CI/CD 알림 개선****
>
> ****2. 파편화된 알림 구조의 통합****
>
> ****3. 세분화된 환경 및 이벤트별 알림 구현****

### ***1. 들어가며***

***안녕하세요, 여기어때컴퍼니 DevOps팀 클로이입니다.***

***지난 ‘CI/CD 개선기’ 시리즈에서는 DevOps팀이 하나의 표준화된 CI/CD 파이프라인을 구축하는 과정을 공유드렸습니다. 하지만 여전히 알림 프로세스에는 개선할 여지가 남아 있었습니다. 알림 기준과 구현 방식이 팀별로 달라 파이프라인 개선 효과를 온전히 확인하기 어려웠고, 특히 DevOps팀이 반드시 필요로 했던 **배포 실패 감지 환경**도 기존에는 충분히 제공되지 않았습니다.***

***이에 이번 CI/CD 개선기 5편에서는 **GitLab CI와 ArgoCD 기반으로 동작하는 슬랙 알림 개선기**를 소개하고자 합니다. 먼저 2장에서 GitLab CI 파이프라인에서 일관된 알림 체계를 구현한 방법을 살펴보고, 이어서 3장에서 ArgoCD 배포 결과를 효율적으로 알릴 수 있도록 개선한 과정을 다루겠습니다.***

### ***2. CI 알림 (Gitlab CI + Slack)***

### ***2–1 문제 인식***

![](https://images.gogumang.com/c67baa6d5e/02.png)

***사내 CI 알림 구조는 **파편화된 알림 체계**로 운영되고 있었습니다. 각 개발팀에서 자체적으로 알림 모듈을 구현하거나 일부는 알림 없이 완료만 확인하는 경우도 있어, DevOps팀이 전체 현황을 일관되게 파악하기 어려웠습니다.***

***더불어, **기존 알림 방식의 한계**도 존재했습니다. Gitlab for Slack App의 경우, 환경별·이벤트별 알림 구분, 실패 로그나 추가 컨텍스트 제공에도 제약이 있었습니다.***

***즉, 기존 구조로는 DevOps팀이 필요로 하는 파이프라인 실패 조기 감지가 어려웠습니다. 마침 CI/CD 파이프라인 표준화 작업과 맞물리면서, 다음의 요구사항을 만족하는 새로운 알림 프로세스를 구축하게 되었습니다.***

****✅ 파편화된 알림 단일화****

****✅ 환경·이벤트별 알림 세분화****

****✅ 전체 모니터링과 팀별 알림을 동시에 충족****

### ***2–2 구현하기***

***CI 알림 프로세스는 크게 세 가지 축으로 구현했습니다. 먼저 알림의 기반이 되는 전용 에이전트를 도입했고, 그 위에서 환경별 알림 채널 선택과 결과에 따른 알림 흐름을 구성했습니다.***

#### ***1️⃣ Pipeline-agent의 도입***

***초기에는 Slack Webhook에 `curl`로 JSON payload를 전송하는 방식으로 구현했는데, 메시지 포맷이 길어지고 따옴표 이스케이프가 늘어나면서 스크립트가 200줄을 넘어가곤 했습니다. 또한 알림을 여러 채널로 보내려면 채널 수만큼 Job을 복제해야 하는 번거로움도 있었습니다.***

```
# (구방식) webhook + curl — 길어지는 JSON payload
.send-slack-message:
  - |
    curl -X POST --data-urlencode 'Content-type: application/json' --data \
    "payload={
       \"attachments\": [
       {
          \"color\": \"$COLOR\",
          \"text\": \"<$CI_PIPELINE_URL|🔗 *파이프라인 이동*>\",
          \"fields\": [......]
       }
     ]}"
```

***이를 해결하기 위해 **Golang** 으로 pipeline-agent를 개발했습니다. 이제 `.gitlab-ci.yml`에서는 에이전트를 한 줄로 호출해, 내부에서 환경별 채널 분기·다중 채널 전송·템플릿 관리까지 모두 처리합니다. 단일 Job에서 팀 채널과 관제 채널에 동시에 전송할 수 있고, 메시지 포맷도 함수로 관리되어 가독성이 크게 개선되었습니다.***

***아래 코드는 실패 알림 대상 채널을 환경에 따라 결정하는 부분입니다. 특히 `release` 환경에서는 팀 채널과 devops팀의 관제 채널에 동시 전송하도록 분기합니다.***

```
func (alarmPolicy *Policy) FailureChannels() []string {
 var channels []string
```

```
switch profile := alarmPolicy.Profile; {
 case gitlab.IsFeatureBranch(profile):
  channels = []string{gitlab.SlackTeamChannel(profile)}
 case profile == string(gitlab.ProfileDev):
  channels = []string{gitlab.SlackTeamChannel(profile)}
 case profile == string(gitlab.ProfileStage):
  channels = []string{gitlab.SlackTeamChannel(profile)}
 case profile == string(gitlab.ProfileRelease):
  channels = []string{gitlab.SlackTeamChannel(profile), gitlab.SlackReportChannel(profile)}
 }
 return channels
}
```

***메시지 내용도 템플릿화했습니다. 예를 들어 실패 알림의 경우 프로젝트명, 파이프라인 링크, 브랜치, 커밋 작성자 등 실무에 필요한 맥락을 간결하게 담아 전달합니다.***

```
func (alarmPolicy *Policy) FailureMessage() string {
 return fmt.Sprintf(
  ":warning: `%s` <%s |Pipeline> 실패\n"+
   "`%s` 브랜치 작업자 %s와 원인을 확인해보세요. :eyes:\n",
  gitlab.ProjectName(),
  gitlab.PipelineUrl(),
  gitlab.BranchName(),
  gitlab.CommitAuthor())
}
```

#### ***2️⃣ 환경별 알림 채널 선택***

***이제 각 프로젝트의 `.gitlab-ci.yml`에서 개발자가 환경별 Slack 채널을 선언합니다. 아래처럼 팀에 맞는 채널명을 입력하면 됩니다.***

```
variables:
  DEV_SLACK_CHANNEL: "#devops-ci-dev"
  STAGE_SLACK_CHANNEL: "#devops-ci-stage"
  RELEASE_SLACK_CHANNEL: "#devops-ci-release"
```

***파이프라인은 `$PROFILE` 값으로 현재 실행 환경(`dev`, `stage`, `release`)을 구분하고, 알림 Job은 이 값을 읽어 해당 환경에 대응하는 채널로 알림을 전송합니다. 덕분에 팀별로 '어떤 환경의 알림을 어떤 채널로 받을지'만 선언하는 방식이 간편해졌습니다. 실제 전송 로직은 pipeline-agent가 처리합니다.***

#### ***3️⃣ CI 결과에 따른 알림***

***알림은 CI 결과(성공/실패)에 따라 다르게 흐릅니다. 실패 시에는 남은 스테이지를 기다리지 않고 즉시 `alarm` 스테이지로 점프하여 실패 알림을 전송합니다. 이 알림은 **개발팀 채널은 물론, DevOps 관제 채널에도 동시에 전송되어 대응 속도를 높입니다.*****

***이 구조는 Gitlab CI 파이프라인의 특성과 관련이 있습니다. Gitlab CI 파이프라인 스테이지는 정적으로 정의되기에, 파이프라인 시작과 동시에 모든 스테이지가 생성됩니다. 따라서 `on_failure` 조건을 활용해 앞선 스테이지의 실패가 감지되는 즉시 작업을 중단시키고 알림 Job을 트리거하도록 구성했습니다. 이로써 실패에 대한 즉각적인 대응이 가능해집니다.***

***아래 예시는 dev 환경의 MR 파이프라인이 실패했을 때 바로 alarm 스테이지가 실행되는 구성입니다.***

```
.when-merge-request-event-in-stage-with-ci-failure:
  if: >-
    $CI_PIPELINE_SOURCE == "merge_request_event" && 
    $CI_MERGE_REQUEST_TARGET_BRANCH_NAME =~ /^(dev)$/ &&
    $DEV_SLACK_CHANNEL != "<nil>"
  when: on_failure # CI가 실패했을 때 실행
```

```
alarm-ci-failure:
  stage: alarm
  image:
    name: pipeline-agent:latest
  rules:
    - !reference [ .alarm-rules, .when-merge-request-event-in-dev-with-ci-failure ]
    - when: never # 명시된 조건 외에는 실행하지 않음
  script:
    - /main slack --action=alarm --template=failed --profile=$PROFILE
```

*****정리*****

***Pipeline-agent 도입으로 스크립트 복잡도가 크게 줄었고, 다중 채널 전송과 메시지 커스텀이 쉬워졌습니다. 덕분에 개발자가 작성할 `.gitlab-ci.yml` 파일은 간결하게 유지하면서도, **환경별 채널 선택** 과 **이벤트별 알림**이라는 두 축을 유연하고 유지보수 가능한 방식으로 구현할 수 있었습니다.***

### ***3. CD 알림 (ArgoCD Notification + Slack)***

### ***3–1 문제 인식***

![](https://images.gogumang.com/c67baa6d5e/03.png)

***기존에는 EKS 배포 및 Sync 알림 방식이 PostSync/SyncFail Hook이나 Lifecycle Hook, ConfigMap 직접 수정 방식 등으로 혼재되어 있었습니다. 이로 인해 관리가 복잡하고 일관성이 떨어지는 문제가 있었습니다.***

***따라서 EKS 배포 알림을 **ArgoCD Notifications**로 통합했습니다. ArgoCD Notifications는 어플리케이션의 Sync 성공/실패, Health 상태 변화 등 다양한 이벤트를 감지하여 Slack, Gmail 등으로 알림을 전송하는 기능입니다. Trigger와 Template을 조합해 알림 조건과 메시지를 정의할 수 있으며, 전역(Global) 구독이나 어플리케이션 단위 구독도 지원합니다.***

***그러나, 공식 문서에 기반한 기본 설정에서 벗어나 **사내 환경에 맞는 보다 고도화된 활용** 이 필요했습니다. 첫째, 모든 이벤트가 하나의 공통 채널로만 전달되는 기존 방식의 한계를 극복해야 했습니다. 둘째, Karpenter 자동 노드 스케일링처럼 불필요한 알림이 대량으로 쌓이면서, 정작 중요한 배포 성공/실패 이벤트의 **가시성**이 떨어지는 문제가 있었습니다. 나아가, ApplicationSet과 App of Apps의 특성에 맞게 Health/Sync 상태를 보다 세밀하게 구분할 필요성도 커졌습니다.***

***따라서 CD 알림 개선 시 요구사항은 다음과 같습니다.***

****✅ 팀 단위 알림 분리****

****✅ 내부 인프라 작업이나 자동 스케일링 이벤트로 인한 노이즈 알람 제거****

****✅ 앱 트리거 상태 세분화****

### ***3–2 구현하기***

#### ***1️⃣ 팀 채널 분리***

***DevOps팀이 이미 관리하고 있던 ApplicationSet 템플릿을 활용했습니다. 개발자가 어플리케이션 manifest에 팀 전용 채널을 지정하면, 템플릿이 이를 읽어 공통 채널(dev-eks-deploy)과 함께 알림을 보낼 수 있도록 어노테이션에 주입하는 방식입니다. 그 결과, 각 팀은 자신에게 필요한 배포 이벤트만 받아보고, 공통 채널은 클러스터 관제용으로 활용하는 효율적인 운영이 가능해졌습니다.***

```
# values.yaml (개발자가 설정)
global:
  teamName: devops
  teamCode: dop
  helmStandardVersion: 1.0.0-115782
  eksDeploySlackChannel: dop-eks-deploy # 팀 알림 채널
```

```
# applicationset.yaml (DevOps팀 관리 템플릿)
annotations:
  notifications.argoproj.io/subscribe.on-health-degraded-at-applicationset.slack: {{ printf "%s;dev-eks-deploy" $.Values.global.slackChannel | quote }}
```

#### ***2️⃣ 스케일링 알림 제거***

***Notifications 트리거를 정의할 때, `revision` 검증과 `oncePer` 옵션을 적용했습니다. 이를 통해 Karpenter 스케일링이나 인프라성 Sync로 인한 불필요한 알림을 제거하고, **실질적인 배포 이벤트에 집중**할 수 있게 되었습니다.***

* ***`when` 조건에서 유효한 `revision`만 검증 → 인프라성 빈 Sync 차단***
* ***`oncePer` 설정으로 같은 커밋에서 발생하는 반복 알림 억제***

***ApplicationSet 패턴에서 sync 알림을 예시로 들면 다음과 같습니다.***

```
# ApplicationSet 에서의 성공 트리거 예시
trigger.on-sync-succeeded-at-applicationset: |
  - description: Application syncing has succeeded.
    when: |
      app.status.operationState.phase == 'Succeeded' &&
      app.status.health.status == 'Healthy' &&
      app.status.operationState.syncResult.revisions[1] != ''
    oncePer: app.status.operationState.syncResult.revisions[1]
    send:
    - app-sync-succeeded-at-applicationset
```

#### ***3️⃣ 트리거/템플릿 세분화***

***기존 사내 EKS 1.30 클러스터에서는 **싱글소스 구조** 의 **App of Apps 패턴** 을 중심으로 배포를 관리했습니다. 하지만 EKS 1.33로 업그레이드 후 ArgoCD 2.6부터 지원되는 **멀티소스 ApplicationSet**을 도입하면서, 하나의 어플리케이션이 여러 Git 저장소와 Helm Chart를 동시에 참조할 수 있게 되었습니다.***

***즉, **현재는 ApplicationSet과 App of Apps가 공존**합니다. 두 패턴은 Application 상태 필드 구조가 다르기 때문에 동일한 트리거를 공유할 경우 중복 알림이나 누락이 발생할 수 있습니다. 이에 따라 각각에 맞는 트리거와 템플릿을 별도로 정의해 Health/Sync 이벤트를 보다 세밀하게 모니터링할 수 있도록 개선했습니다.***

*****App of Apps (싱글소스)*****

***App of Apps 패턴에서는 `syncResult.revision`을 기준으로 알림을 제어했습니다.***

```
# 트리거: Health Degraded (App of Apps)
trigger.on-health-degraded-at-app-of-apps: |
  - when: app.status.health.status == 'Degraded'
    oncePer: app.status.operationState.syncResult.revision
    send: [app-health-degraded-at-app-of-apps]
```

```
# 템플릿: Slack 메시지
template.app-health-degraded-at-app-of-apps: |
  slack:
    attachments: |
      [
        {
          "color": "#FE0505",
          "text": "*App*: {{.app.metadata.name}}\n*Status*: {{.app.status.health.status}} :x:\n*Revision*: {{.app.status.sync.revision}}"
        }
      ]
```

*****ApplicationSet (멀티소스)*****

***반면 ApplicationSet은 `syncResult.revisions`가 배열 형태로 제공되기 때문에, 단일 `revision` 값만으로는 알림 중복 제어가 불가능합니다. 따라서 `revisions[1]`을 활용하여 조건을 구성했고, 이를 통해 멀티소스 환경에서도 불필요한 중복 알림을 방지했습니다.***

```
# 트리거: Health Degraded (ApplicationSet)
trigger.on-health-degraded-at-applicationset: |
  - when: app.status.health.status == 'Degraded'
    oncePer: app.status.operationState.syncResult.revisions[1]
    send: [app-health-degraded-at-applicationset]
```

```
# 템플릿: Slack 메시지
template.app-health-degraded-at-applicationset: |
  slack:
    attachments: |
      [
        {
          "color": "#FE0505",
          "text": "*App*: {{.app.metadata.name}}\n*Status*: {{.app.status.health.status}} :x:\n*Revision*: {{ (index .app.status.sync.revisions 1) }}"
        }
      ]
```

***이처럼 각각의 구조적 차이를 반영해 트리거와 템플릿을 세분화함으로써, 운영 환경에서 발생할 수 있는 알림 중복/누락 문제를 효과적으로 해결할 수 있었습니다.***

### ***4. 마무리하며***

***본 글에서는 GitLab CI와 ArgoCD Notifications를 활용해 CI/CD 알림 프로세스를 개선하고, 팀별 대응과 전체 모니터링 가시성을 확보한 과정을 공유드렸습니다. 이번 프로젝트를 통해 각 영역을 고도화하고, 일관된 알림 운영을 위한 기반을 마련할 수 있었습니다.***

***저 역시 이 과정에서 DevOps 엔지니어로서 한층 성장할 수 있었습니다. 첫 커리어를 여기어때에서 시작하며, 단순 툴 구현에 그치지 않고, 운영 환경에서 발생할 영향도를 고려하며 해결책을 구현하는 경험을 쌓을 수 있었습니다.***

***또한, 저희 DevOps팀 동료분들과 함께 고민하며 만들어온 CI/CD 개선 결과를 돌아보는 기회가 되어 뜻깊었습니다. 이로써 CI/CD 개선기 시리즈를 마무리하게 되었으며, 앞으로도 저희가 만들어가는 배포 문화와 운영 환경의 발전 과정을 함께 지켜봐 주시길 바랍니다.***

***감사합니다. ☺️🍀***