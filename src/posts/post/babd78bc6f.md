안녕하세요. LINE Plus Tech Content Strategy 팀 하성창입니다. 저희 팀은 테크니컬 라이터로 구성돼 있으며, LINE Plus에서 개발한 다양한 플랫폼의 기술 문서를 작성하는 한편 사내 용어집 사이트인 Words의 콘텐츠와 LY Corporation Tech Blog의 국문 콘텐츠를 담당하고 있습니다. 이 글에서는 LINE Planet이라는 VoIP 플랫폼의 문서에 싱글 소싱(single sourcing)을 적용해 문서 관리 효율성을 개선한 사례를 공유하려고 합니다.

## 싱글 소싱이란?

싱글 소싱은 하나의 소스에서 여러 가지 결과물을 생성하는 것을 뜻하는 용어입니다. 문서화에서는 아래와 같은 두 가지를 모두 의미합니다.

* 단일 소스에서 여러 포맷(HTML, PDF, EPUB 등)으로 문서를 생성하기. 멀티 채널 퍼블리싱(multi-channel publishing)이라고도 합니다.
* 단일 소스에서 맥락에 따라 여러 문서를 생성하기. 여기서 맥락은 문서화 요구사항에 따라 정의할 수 있습니다(배포 환경, 구동 플랫폼 등).

예전에는 첫 번째 의미로 주로 사용했으나, 최근에는 두 번째 의미도 포함하여 더 넓게 사용하는 용어입니다. 이 글에서 '싱글 소싱'은 두 번째 의미에 해당합니다.

### 싱글 소싱의 목적

싱글 소싱의 주요 목적은 문서 관리의 효율성과 문서의 품질을 개선하는 데 있습니다.

* 문서 관리 효율성 측면에서는 '복사 및 붙여넣기' 작업을 최소화하여 유지 보수를 간소화할 수 있습니다. 콘텐츠를 재사용하여 불필요한 반복 작업을 줄이고 시간을 절약할 수 있습니다.
* 문서 품질 측면에서는 단일 출처에서 정보를 가져옴으로써 각각의 문서가 따로 작성되었을 때에 비해 내용이나 스타일 면에서 일관성을 높이고 오류를 줄일 수 있습니다.

### 싱글 소싱이 필요한 경우

다음과 같은 경우에 싱글 소싱을 적용할 수 있습니다.

* 공통된 부분이 많지만 조금씩 차이가 있는 제품군의 문서를 관리해야 할 때
  * 예: high-end_A/B/C, mid-end_A/B/C, low-end_A/B/C 제품의 문서
* 소프트웨어 배포 환경에 따라 해당하는 내용의 문서를 만들고 싶을 때
  * 예: dev/staging/prod 환경별 문서

### 싱글 소싱 주요 기법

싱글 소싱의 주요 기법으로는 다음과 같은 것들이 있습니다.

* 조건부 콘텐츠(conditional content)
* 변수 처리(variables)
* 콘텐츠 재사용(content reuse)

각각에 대해 좀 더 자세히 살펴보겠습니다.
> 상용/독점(proprietary) 문서화 도구 또는 정적 사이트 생성 도구(static site generator, SSG)에서 이러한 기법을 제공하는 방식이나 문서에서 사용하기 위한 문법은 매우 다양합니다. 따라서 이 글에서는 특정 도구의 문법을 예로 들기보다는 이해를 돕기 위한 의사코드(pseudocode)를 사용했습니다.
>
> 상용/독점 문서화 도구에서 제공하는 싱글 소싱 기능에 대한 정보가 궁금하신 경우 다음 링크를 참고하시기 바랍니다.
>
> * Adobe FrameMaker의 [Single-sourcing content](https://help.adobe.com/en_US/framemaker/using/index.html#t=using-framemaker/FrameMaker-2022/user-guide/frm_single_sourcing.html)
> * Writerside의 [Single sourcing and content reuse](https://www.jetbrains.com/help/writerside/single-sourcing.html)

#### 조건부 콘텐츠

일정한 조건에 따라 콘텐츠 포함 여부를 결정하는 필터링 처리를 의미합니다. 다음과 같은 경우에 활용할 수 있습니다.

* 특정 개발 환경에만 해당하는 내용이 있을 때
* 멀티플랫폼 문서에서 플랫폼별로 조금씩 차이가 나는 부분이 있을 때

예를 들어 'staging' 환경 문서에만 포함되어야 하는 내용을 조건부 콘텐츠로 관리하는 것을 의사코드로 나타내면 다음과 같습니다.

```markdown
// 메타데이터나 설정 파일에서 맥락 정의
env: ['dev', 'staging', 'prod']
```

```markdown
// 문서에서 조건부 구문 사용
<if env="staging">
  {content}
</if>
```

#### 변수 처리

값이나 용어를 변수화하는 것을 의미합니다. 다음과 같은 경우에 활용할 수 있습니다.

* SDK별 최신 버전을 변수로 관리
* 특정 기능을 사용하는 데 필요한 최소 SDK 버전을 변수로 관리
* 연락처, 고객 지원 채널 등의 URL을 변수로 관리

예를 들어 SDK 최소 버전을 변수로 처리하는 것을 의사코드로 나타내면 다음과 같습니다.

```markdown
// 메타데이터나 설정 파일에서 변수 선언
minimum_version: 2.0
```

```markdown
// 문서에서 변수 사용
Use the SDK <var name="minimum_version" /> or higher.
```

#### 콘텐츠 재사용

자주 쓰이는 콘텐츠를 재사용하는 것을 의미합니다. 다음과 같은 경우에 활용할 수 있습니다.

* 여러 페이지에 동일하게 나타나야 하는 안내 문구를 재사용
* 가이드나 튜토리얼에 반복되는 사전 절차(prerequisites)를 재사용

예를 들어 오래된 문서에 대한 안내 문구를 재사용하는 것을 의사코드로 나타내면 다음과 같습니다.

```markdown
// 재사용할 콘텐츠를 정의
<note id="deprecation-note">
  This page has been deprecated.
</note>
```

```markdown
// 문서에서 콘텐츠 재사용
<include element-id="deprecation-note" />
```

재사용할 콘텐츠는 위 예시처럼 안내 문구 하나가 될 수도 있지만, 여러 개의 문단 혹은 페이지 단위가 될 수도 있습니다.

## LINE Planet 및 문서 사이트 소개

LINE Planet은 음성 및 영상 통화 기능을 제공하는 VoIP 플랫폼으로, 서비스형 커뮤니케이션 플랫폼(CPaaS)입니다. 클라우드 기반으로 1대1 통화, 그룹 통화, 화면 공유 등 다양한 기능을 제공하며, 클라이언트 앱 개발을 위해 다음처럼 여러 가지 플랫폼을 지원하는 SDK를 제공합니다.

* 네이티브 플랫폼
  * 모바일 운영체제: iOS, Android
  * 데스크톱 운영체제: macOS, Windows
* 웹
* 크로스 플랫폼 프레임워크
  * Flutter

LINE Planet 프로덕트의 특성 중 문서 사이트 구축 및 운영에 영향을 주는 특성은 다음과 같습니다.

* 네이티브, 웹, Flutter 간 제공하는 기능 및 세부 구현 방식에 차이가 있음
  * 네이티브 플랫폼에서 가장 많은 기능을 제공하고, 웹과 Flutter는 주로 부분집합에 해당하는 기능을 제공합니다.
  * 하나의 기능 내에서도 플랫폼 간 세부 구현 방식에 조금씩 차이가 나기도 합니다.
* 플랫폼별로 API 네이밍은 조금씩 다르지만 기능별로 비교적 균일하게 설계됨
  * 예를 들어 1대1 통화에서 전화를 걸기 위한 메서드 이름은 `makeCall()` 또는 `MakeCall()`로 거의 같고, 통화가 연결되었을 때 발생하는 이벤트(콜백) 이름은 `onConnected`, `didConnect`, `OnConnected`, `evtConnected` 등 특정 표현을 포함하면서 플랫폼별로 사용되는 프로그래밍 언어의 코딩 컨벤션을 따르고 있습니다.
  * 아예 동떨어진 이름을 사용하거나, 나머지 플랫폼에서 하나의 메서드로 된 것을 특정 플랫폼에서만 여러 개 메서드로 나누는 등의 이례적인 경우는 드뭅니다.

[LINE Planet 문서 사이트](https://docs.lineplanet.me/)(이하 Planet Docs)는 LINE Planet의 기술 문서를 제공하는 웹사이트로, 프로덕트 개요, 시작하기, SDK 문서, 서버 API 문서, 도움받기 문서 등의 영역으로 구성되어 있습니다.

![image](https://images.gogumang.com/babd78bc6f/01.png)

### 문서 사이트 요구사항

문서 사이트는 아래처럼 버전 관리가 필요한 영역(SDK 문서)과 그렇지 않은 영역으로 나뉩니다. SDK 문서의 경우 이전 버전을 사용하는 고객사에서 참고할 수 있도록 버전별 문서를 제공하고 있습니다.

|   영역   |                                  설명                                  |           문서 버전 구분           |
|--------|----------------------------------------------------------------------|------------------------------|
| 개요     | LINE Planet의 주요 특징, 전체 기능 목록, 주요 용어 정의 등을 포함한 개요를 제공합니다.             | 버전 관리하지 않음^\*^               |
| 시작하기   | LINE Planet 연동을 시작하는 데 도움을 주는 영역으로, 개발 환경 및 인증 정보를 제공하고 데모 앱을 소개합니다. | 버전 관리하지 않음                   |
| SDK    | 애플리케이션 클라이언트를 구현하기 위한 가이드와 참조 문서를 플랫폼별로 제공합니다.                       | 플랫폼마다 해당 SDK 버전별 문서 제공^\*\*^ |
| 서버 API | 서버 측 연동을 위한 가이드 및 참조 문서를 제공합니다.                                      | 버전 관리하지 않음                   |
| 도움받기   | 자주 묻는 질문과 답변, 트러블슈팅 자료, 연락처 정보를 제공합니다.                               | 버전 관리하지 않음                   |

^\*^ 버전 관리하지 않는 영역에서는 최신 정보만 제공합니다.

^\*\*^ 프로덕트 특성상 플랫폼별 버전 관리에 차이가 있습니다. 가령 네이티브 플랫폼용 SDK는 최신 버전이 5.5이지만, 웹용 SDK는 5.3, Flutter용 SDK는 0.9입니다.

여기에 더해 문서 사이트 전체적으로 영어, 한국어, 일본어 세 가지 언어를 지원하기 위해 다국어화도 필요합니다.

### Docusaurus를 사용하는 이유

Planet Docs의 문서화 도구로는 [Docusaurus](https://docusaurus.io/)를 사용하고 있습니다. Docusaurus를 사용하는 가장 큰 이유는 LINE Plus 테크니컬 라이팅 조직에서 Docusaurus를 공용 SSG로 선정하여 사용하고 있기 때문입니다(참고: [기술 문서 사이트로 Docusaurus 활용하기](https://techblog.lycorp.co.jp/ko/docusaurus-as-a-technical-document-website)).

위 블로그 글에서 소개하듯 Docusaurus는 React 컴포넌트를 개발해 기능을 확장할 수 있다는 장점이 있습니다. 또한 Planet Docs의 요구사항을 충족할 수 있는 아래와 같은 기능을 기본으로 제공한다는 점도 Docusaurus 선택에 중요하게 작용했습니다.

* [멀티 인스턴스](https://docusaurus.io/ko/docs/docs-multi-instance) 및 [버전 관리](https://docusaurus.io/ko/docs/versioning) 기능으로 플랫폼별로 인스턴스를 정의하여 SDK 영역에서 플랫폼별 문서를 제공하고, 플랫폼마다 서로 다른 버전 집합으로 구성된 문서를 제공할 수 있습니다(기본 인스턴스로는 버전 관리하지 않는 문서들을 관리합니다).
* [마크다운 임포트](https://docusaurus.io/ko/docs/markdown-features/react#importing-markdown) 기능으로 콘텐츠를 재사용할 수 있습니다. Docusaurus에서는 이름이 언더바로 시작하는 마크다운 파일에 재사용할 콘텐츠를 작성하고(이러한 파일을 "partial"이라고 부릅니다) 다른 마크다운 파일에서 이 파일을 가져와서 재사용할 수 있습니다.

Planet Docs의 경우 각 플랫폼에 해당하는 인스턴스를 정의하되, iOS와 macOS는 문서 내용이 대부분 비슷하여 하나의 인스턴스로 묶어서 관리하고 있습니다. Planet Docs에서 지원하는 SDK 플랫폼과 각각의 인스턴스 및 제공 버전은 아래와 같습니다.

|  SDK 플랫폼   | 인스턴스 이름  |        제공 버전(2025년 3월 기준)         |
|------------|----------|-----------------------------------|
| Android    | android  | 4.4, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5 |
| iOS, macOS | iosmacos | 4.4, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5 |
| Windows    | windows  | 4.4, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5 |
| 웹          | web      | 4.2, 5.0, 5.1, 5.2, 5.3           |
| Flutter    | flutter  | 0.6, 0.7, 0.8, 0.9, 1.0           |

## Planet Docs에 적용한 싱글 소싱 사례 소개

### 싱글 소싱 적용 필요성

앞서 SDK 문서의 경우 버전 관리와 세 가지 언어로 다국어화가 필요하다고 말씀드렸습니다. SDK 전체 플랫폼 개수는 6개(iOS, Android, macOS, Windows, 웹, Flutter)이지만, 위 표와 같이 iOS와 macOS는 하나의 인스턴스로 묶어서 관리하고 버전 차이가 큰 Flutter는 별도로 관리하고 있어서 현재 싱글 소싱이 적용되는 문서 인스턴스는 4개(android, iosmacos, windows, web)입니다.

이러한 상황에서 싱글 소싱 미적용/적용 상태 각각에 대해 단일 버전에서 변경 사항 1개를 적용할 때 수정해야 할 문서 파일의 수를 계산해 보면 다음과 같습니다.

* 싱글 소싱 미적용: 인스턴스 수(4개) \* 언어 수(3개) = 12개
* 싱글 소싱 적용: 단일 공유 문서(1개) \* 언어 수(3개) = 3개

실제로는 이전 버전 문서를 함께 수정해야 할 수도 있고, 향후 지원하는 플랫폼이나 언어가 늘어날 가능성도 있습니다. 따라서 싱글 소싱을 적용하지 않은 경우 싱글 소싱을 적용했을 때보다 수정해야 할 문서의 수가 산술적으로 훨씬 많아집니다. 여러 개의 파일에 각각 복사-붙여넣기하고 차이점을 반영하는 식으로 편집 작업을 하다 보면 오류가 생길 수도 있고, 일관성 면에서 틀어지는 문제가 발생할 수도 있습니다. 따라서 싱글 소싱을 적용하는 것이 여러모로 유리하다고 판단했습니다.

### 싱글 소싱 설계

앞서 LINE Planet 프로덕트에는 다음과 같은 특성이 있다고 말씀드렸습니다.

* 네이티브, 웹, Flutter 간 제공하는 기능 및 세부 구현 방식에 차이가 있음
* 플랫폼별로 API 네이밍은 조금씩 다르지만 기능별로 비교적 균일하게 설계됨

각 특성에 대해 아래와 같이 싱글 소싱 기법을 적용하는 것을 생각해 볼 수 있습니다.

* 네이티브, 웹, Flutter 간 제공하는 기능 및 세부 구현 방식에 차이가 있음 → 조건부 콘텐츠
  * 공유 문서에서 조건부 구문으로 특정 인스턴스인 경우에만 포함될 내용이나 특정 인스턴스가 아닌 경우에만 포함될 내용을 기술합니다.
  * 플랫폼별로 생성된 문서에는 그 플랫폼에 해당하는 내용만 포함됩니다.
* 플랫폼별로 API 네이밍은 조금씩 다르지만 기능별로 비교적 균일하게 설계됨 → 변수 처리
  * API 항목별로 ID를 붙여 ID와 실제 이름을 매핑하는 메타데이터를 플랫폼별로 준비하고, 공유 문서에는 API를 변수화하여 작성합니다.
  * 플랫폼별로 생성된 문서에서는 변수 부분이 플랫폼별 실제 API 이름으로 대체됩니다.

이를 바탕으로 한 Planet Docs의 싱글 소싱 구조는 아래와 같습니다.

![image](https://images.gogumang.com/babd78bc6f/02.png)

* 조건부 콘텐츠와 변수 처리를 위한 React 컴포넌트를 개발하고, API 정보를 담은 메타데이터를 준비합니다.
* 조건부 콘텐츠와 변수 처리용 컴포넌트를 사용하여 공유 문서를 작성합니다.
* 플랫폼별로 공유 문서를 가져오는 플레이스홀더 문서를 만듭니다.
* 빌드를 실행하면 조건부 콘텐츠와 변수를 처리하여 플랫폼별 실제 문서가 생성됩니다.

Planet Docs에서는 이러한 플랫폼 정보 외에도 버전 또한 맥락의 일부입니다. 따라서 현재 플랫폼이 무엇인지, 위치한 플랫폼 내에서 현재 버전이 무엇인지, 이 두 가지가 전체 맥락을 결정합니다.

### 싱글 소싱 구현 및 적용

Planet Docs에서는 다음과 같이 싱글 소싱을 구현하고 적용했습니다.

#### 조건부 콘텐츠

조건부 처리에서는 인스턴스를 기준으로 필터링 여부를 결정합니다. 앞서 말씀드린 것처럼 Planet Docs에서 싱글 소싱을 적용하는 문서 인스턴스는 아래와 같이 4개입니다.
> Docusaurus의 멀티 인스턴스 기능으로 정의한 인스턴스 정보와 인스턴스별로 만들어진 버전 정보는 Docusaurus 내부에서 관리됩니다. 따라서 실제로는 아래처럼 별도로 설정하는 것이 아니라 Docusaurus 내부 API를 이용해 얻어 옵니다.

```markdown
// 맥락 정의(인스턴스)

platform: ['android', 'iosmacos', 'windows', 'web']
```

위 인스턴스를 기준으로 필터링을 수행하는 `<Conditional>` 컴포넌트를 구현했고, 이 컴포넌트는 공유 문서에서 아래처럼 사용할 수 있습니다.

```markdown
// 문서에서 조건부 구문 사용

<Conditional ifNotAppliesTo="web">
  {content for non-web platforms}
</Conditional>
<Conditional ifAppliesTo="web">
  {content for web}
</Conditional>
```

#### 변수 처리

변수 처리에서는 인스턴스와 버전 둘 다 맥락을 결정하는 데 필요합니다. 인스턴스 및 버전별로 아래처럼 API 정보를 담은 YAML 형식의 메타데이터를 작성합니다.

```yaml
// 메타데이터에 변수 정의

# android, 5.5
makeCall:
  name: makeCall()
evtConnected:
  name: onConnected

# iosmacos, 5.5
makeCall: 
  name: makeCall()
evtConnected:
  name: didConnect

# windows, 5.5
makeCall:
  name: MakeCall()
evtConnected:
  name: OnConnected

# web, 5.3
makeCall:
  name: makeCall()
evtConnected:
  name: evtConnected
```

위와 같은 메타데이터를 읽어 와서 ID에 해당하는 실제 API 정보로 대체하는 `<Api>` 컴포넌트를 구현했습니다. 이 컴포넌트는 공유 문서에서 아래처럼 사용할 수 있습니다.

```markdown
// 문서에서 변수 사용

After calling <Api id="makeCall" />, the <Api id="evtConnected" /> event occurs.
```

#### 콘텐츠 재사용

Planet Docs에서는 싱글 소싱 기법 소개 부분의 예시처럼 작은 단위의 콘텐츠를 재사용하기보다 페이지 단위로 재사용하는 방식을 사용합니다. 아래처럼 조건부 콘텐츠 및 변수 처리용 컴포넌트를 사용해 공유 문서를 작성합니다.

```markdown
// 재사용할 콘텐츠를 작성
// _shared/en/{ver}/call-flow/_flow-1-to-1-call.mdx

<Conditional ifNotAppliesTo="web">
After calling <Api id="makeCall" />, the <Api id="evtConnected" /> event occurs.
</Conditional>
<Conditional ifAppliesTo="web">
After calling <Api id="makeCall" />, the <Api id="evtConnected" /> event occurs.  (Some other description for web)
</Conditional>
```

이러한 공유 문서를 플랫폼별 문서에서 Docusaurus의 마크다운 임포트 기능으로 가져와서 재사용합니다.

```markdown
// 플랫폼별 문서에서 콘텐츠 재사용
// {platform}/call-flow/flow-1-to-1-call.mdx

---
title: "1-to-1 call flow"
---

import Content from '@site/_shared/{lang}/{ver}/call-flow/_flow-1-to-1-call.mdx';

<Content />
```

위와 같은 공유 문서를 빌드하여 플랫폼별로 생성된 문서 내용은 다음과 같습니다.

**Android**

![image](https://images.gogumang.com/babd78bc6f/03.png)

**iOS/macOS**

![image](https://images.gogumang.com/babd78bc6f/04.png)

**Windows**

![image](https://images.gogumang.com/babd78bc6f/05.png)

**웹**

![image](https://images.gogumang.com/babd78bc6f/06.png)

### 싱글 소싱 기능 확장

실제 문서화 과정에서는 더욱 다양한 요구 사항이 발생하기 마련입니다. 그중 변수 처리 측면에서 기능을 확장한 사례를 소개하겠습니다.

이 사례들을 살펴보려면 API에 대해 좀 더 자세히 이야기해야 하는데요. 이와 관련해 싱글 소싱이 적용되는 플랫폼마다 SDK의 API가 어떤 프로그래밍 언어로 제공되고 API 레퍼런스가 어떤 도구로 생성되는지 아래 표에 정리해 놓았으니 참고해 주시기 바랍니다.

|  SDK 플랫폼  | API의 프로그래밍 언어 | API 레퍼런스 생성 도구 |
|-----------|---------------|----------------|
| Android   | Kotlin        | Dokka          |
| iOS/macOS | Swift         | Jazzy          |
| Windows   | C++           | Doxygen        |
| 웹         | JavaScript    | JSDoc          |

#### API 포함 관계 표현

LINE Planet SDK에는 1대1 통화와 그룹 통화를 처리하는 주 클래스(각각 `PlanetKitCall`, `PlanetKitConference`)와 통화 유형별 이벤트 처리용 API가 존재합니다. 그런데 통화 연결과 연결 종료 시 발생하는 `onConnected`와 `onDisconnected` 같은 이벤트는 두 통화 유형의 이벤트 처리용 API에 공통으로 정의되어 있습니다. 이외에도 기능에 따라 통화 유형별 주 클래스에 같은 이름의 메서드를 나란히 정의한 경우도 있습니다. 이와 같은 API를 문서에서는 어떻게 구분해야 할까요?

객체 지향 프로그래밍 언어에서 API는 크게 상위 요소(클래스, 인터페이스, 구조체, 열거형 등)와 그 이하에 정의되는 하위 요소(속성, 메서드, 구조체 멤버, 열거형 케이스 등)로 나눠 볼 수 있습니다. 이와 같이 두 개의 수준으로 나눠 LINE Planet SDK의 API 메타데이터를 작성해 보면 다음과 같습니다(너무 길어지지 않도록 Android용 메타데이터만 예로 들겠습니다).

```yaml
// 상위 요소와 하위 요소의 2수준으로 작성한 메타데이터
 
# 통화 유형별 클래스가 구분되지 않는 API
PlanetKit:
  name: PlanetKit
  makeCall:
    name: makeCall()
  verifyCall:
    name: verifyCall()
  joinConference:
    name: joinConference()
 
# 1대1 통화용 API
PlanetKitCall:
  name: PlanetKitCall
  startMyScreenShare:
    name: startMyScreenShare()
  stopMyScreenShare:
    name: stopMyScreenShare()
...
CallListener:
  name: CallListener
  evtConnected:
    name: onConnected
  evtDisconnected:
    name: onDisconnected
...
 
# 그룹 통화용 API
PlanetKitConference:
  name: PlanetKitConference
  startMyScreenShare:
    name: startMyScreenShare()
  stopMyScreenShare:
    name: stopMyScreenShare()
...
ConferenceListener:
  name: ConferenceListener
  evtConnected:
    name: onConnected
  evtDisconnected:
    name: onDisconnected
```

이러한 2수준 구조의 메타데이터를 처리할 수 있도록 `<Api>` 컴포넌트를 수정하고, 공유 문서에서 아래와 같이 사용합니다.

```markdown
// _shared/en/{ver}/_some-document.mdx
 
- In 1-to-1 calls, after calling <Api id="makeCall" />, <Api id="CallListener.evtConnected" /> occurs.
- In group calls, after calling <Api id="joinConference" />, <Api id="ConferenceListener.evtConnected" /> occurs.
```

두 요소가 잘 구분되도록 상위 요소를 함께 표시하고 싶을 수도 있습니다. 이러한 경우를 처리하도록 `showParent` 속성을 추가하고, 아래처럼 사용합니다.

```markdown
// _shared/en/{ver}/_some-document.mdx
 
- In 1-to-1 calls, after calling <Api id="makeCall" />, <Api id="CallListener.evtConnected" showParent /> occurs.
- In group calls, after calling <Api id="joinConference" />, <Api id="ConferenceListener.evtConnected" showParent /> occurs.
```

위와 같은 공유 문서를 빌드하여 생성된 Android 문서의 내용은 다음과 같습니다.

![image](https://images.gogumang.com/babd78bc6f/07.png)
> 문서에서 API 상위 요소와 하위 요소 관계를 나타내는 표기법은 표준화되어 있지 않고 회사나 프로젝트의 문서화 스타일에 따라 다를 수 있습니다. 프로그래밍 언어에 따라 점(`.`)으로 구분하거나 이중 콜론(`::`)으로 구분하는 등의 표기법을 사용하는 경우도 있지만, Planet Docs에서는 LINE Planet 개발 팀과 협의한 대로 위와 같이 풀어서 설명하는 표기법을 적용하고 있습니다. (실제로는 플랫폼에 따라 static 메서드는 점으로만 구분하는 등 세부 규칙이 있고, `<Api>` 컴포넌트가 이러한 규칙을 처리하는 기능도 포함하고 있습니다.)

이렇게 하면 문서에서 API 포함 관계를 정해진 스타일에 따라 일관성 있게 표현할 수 있고, 상위 요소 표시 여부를 컴포넌트 속성으로 제어할 수 있어 효율적입니다.

#### API 레퍼런스 링크 제공

다음으로, 문서에 포함된 API에서 API 레퍼런스의 해당 항목으로 링크를 거는 것을 생각해 볼 수 있습니다. LINE Planet에서는 플랫폼별 프로그래밍 언어에 따라 널리 사용되는 도구를 사용해 API 레퍼런스를 생성하고 있고, 멀티플랫폼 프로덕트의 문서에서는 이렇게 하는 것이 일반적입니다.

앞에서 메타데이터를 상위 요소와 하위 요소의 2수준으로 확장했기 때문에 API 레퍼런스의 내부 구조를 파악하면 각 API 요소의 링크를 적절히 읽어오는 스크립트를 작성할 수 있습니다. 이러한 스크립트를 사용해 메타데이터에 링크 필드(`path`)를 추가한 결과는 다음과 같습니다.

```yaml
// API 레퍼런스 링크가 추가된 메타데이터
 
# 통화 유형별 클래스가 구분되지 않는 API
PlanetKit:
  name: PlanetKit
  path: /planet/com.linecorp.planetkit/-planet-kit/index.html
  makeCall:
    name: makeCall()
    path: /planet/com.linecorp.planetkit/-planet-kit/make-call.html
  verifyCall:
    name: verifyCall()
    path: /planet/com.linecorp.planetkit/-planet-kit/verify-call.html
  joinConference:
    name: joinConference()
    path: /planet/com.linecorp.planetkit/-planet-kit/join-conference.html
 
# 1대1 통화용 API
PlanetKitCall:
  name: PlanetKitCall
  path: /planet/com.linecorp.planetkit.session.call/-planet-kit-call/index.html
  startMyScreenShare:
    name: startMyScreenShare()
    path: /planet/com.linecorp.planetkit.session.call/-planet-kit-call/start-my-screen-share.html
  stopMyScreenShare:
    name: stopMyScreenShare()
    path: /planet/com.linecorp.planetkit.session.call/-planet-kit-call/stop-my-screen-share.html
...
CallListener:
  name: CallListener
  path: /planet/com.linecorp.planetkit.session.call/-call-listener/index.html
  evtConnected:
    name: onConnected
    path: /planet/com.linecorp.planetkit.session.call/-call-listener/on-connected.html
  evtDisconnected:
    name: onDisconnected
    path: /planet/com.linecorp.planetkit.session.call/-call-listener/on-disconnected.html
...
 
# 그룹 통화용 API
PlanetKitConference:
  name: PlanetKitConference
  path: /planet/com.linecorp.planetkit.session.conference/-planet-kit-conference/index.html
  leaveConference:
    name: leaveConference()
    path: /planet/com.linecorp.planetkit.session.conference/-planet-kit-conference/leave-conference.html
  startMyScreenShare:
    name: startMyScreenShare()
    path: /planet/com.linecorp.planetkit.session.conference/-planet-kit-conference/start-my-screen-share.html
  stopMyScreenShare:
    name: stopMyScreenShare()
    path: /planet/com.linecorp.planetkit.session.conference/-planet-kit-conference/stop-my-screen-share.html
...
ConferenceListener:
  name: ConferenceListener
  path: /planet/com.linecorp.planetkit.session.conference/-conference-listener/index.html
  evtConnected:
    name: onConnected
    path: /planet/com.linecorp.planetkit.session.conference/-conference-listener/on-connected.html
  evtDisconnected:
    name: onDisconnected
    path: /planet/com.linecorp.planetkit.session.conference/-conference-listener/on-disconnected.html
...
```

`<Api>` 컴포넌트에 필요 시 링크를 적용할 수 있도록 하는 withLink 속성을 추가하고, 공유 문서에서 아래와 같이 사용합니다.

```markdown
// _shared/en/{ver}/_some-document.mdx
 
- In 1-to-1 calls, after calling <Api id="makeCall" withLink  />, <Api id="CallListener.evtConnected" showParent withLink /> occurs.
- In group calls, after calling <Api id="joinConference" withLink  />, <Api id="ConferenceListener.evtConnected" showParent withLink /> occurs.
```

위와 같은 공유 문서를 빌드하여 생성된 Android 문서의 내용은 다음과 같습니다.

![image](https://images.gogumang.com/babd78bc6f/08.png)

이러한 처리가 없다면 플랫폼별로 API 레퍼런스 링크를 하나씩 복사-붙여넣기하는 수고가 들고, 문서에서 다루는 API가 많아질수록 일이 늘어날 것입니다. 메타데이터에서 정보를 가져오도록 하면 관리 효율성을 높이고 오류 발생 가능성을 줄일 수 있습니다.

### 적용 전제 조건과 제약 사항 및 효과

먼저 멀티플랫폼 문서에 싱글 소싱을 적용하기 위한 전제 조건부터 말씀드릴 필요가 있겠습니다. LINE Planet 프로덕트 특성 중에 '플랫폼별로 API 네이밍은 조금씩 다르지만 기능별로 비교적 균일하게 설계됨'이 있었는데요. 이처럼 API 설계와 네이밍이 균일해야만 API 메타데이터를 통한 변수 처리가 가능합니다. (이 지면을 빌려 보다 나은 API 설계와 네이밍을 위해 애써 주신 LINE Planet SDK 개발자 분들께 감사드립니다.)

다음으로 제약 사항도 고려해야 합니다. 모든 유형의 문서에 싱글 소싱을 적용하기는 어렵습니다. 구현 단계에 가까워질수록 플랫폼별로 차이가 나는 부분이 많아져서, 튜토리얼 같은 문서를 공유 문서로 작성하려다가는 조건부 콘텐츠 구문이 난무하게 되어 관리가 더 어려워질 것입니다. 그래서 Planet Docs에서는 개념 가이드(통화 흐름, 서브그룹)와 확장 기능 가이드에만 싱글 소싱을 적용하고 튜토리얼 성격이 강한 예제 코드 문서에는 싱글 소싱을 적용하지 않고 있습니다(물론 그럼에도 싱글 소싱이 적용된 영역이 분량 면에서 상당 부분을 차지하므로 그 효과는 크다고 볼 수 있습니다).

적용 효과로는 도입부에서 언급한 문서 관리 효율성 개선과 문서 품질 향상 외에도, 플랫폼 간에 차이가 나는 부분을 문서 내에 조건부 콘텐츠 구문으로 명시하고 추적할 수 있다는 점이 장점입니다. 또한 다국어화할 때 플랫폼 수만큼의 문서 대신 단일 공유 문서를 번역하면 되므로 비용과 공수를 줄일 수 있다는 점도 부가적인 이점입니다.

한편, 싱글 소싱이 적용된 문서를 작성하고 유지 보수하려면 그만큼 프로덕트의 API 구조를 잘 파악해야 하므로 테크니컬 라이터의 노력이 필요합니다. 아울러 문서를 리뷰하는 개발 팀에서도 이러한 문서 구조를 인지하고 있어야 합니다.

## 마치며

지금까지 LINE Planet의 문서 사이트에 적용한 싱글 소싱을 살펴보았습니다. 현재는 API 메타데이터의 ID와 실제 API 이름을 입력하는 단계를 수동으로 처리하고 있습니다만, AI를 활용해 API 레퍼런스를 기반으로 자동으로 메타데이터를 생성하는 등 개선할 부분이 있을 것이라고 생각합니다. 이외에도 추가적인 요구사항을 반영하여 싱글 소싱을 위한 컴포넌트와 문서 사이트를 꾸준히 개선해 나갈 예정입니다.

긴 글 읽어 주셔서 감사합니다. 이 글이 멀티플랫폼 프로덕트의 문서 사이트를 관리하는 테크니컬 라이터나 개발자 분들, 그리고 문서화와 싱글 소싱에 관심이 있는 분들께 도움이 되기를 바랍니다.