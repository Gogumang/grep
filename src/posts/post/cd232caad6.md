### Robot Framework와 QA팀 동행기: 시작과 도전(1)

![](https://images.gogumang.com/cd232caad6/01.png)

*Copyright 2024. 여기어때컴퍼니 All Right Reserved. Graphic by 김제린(Riny).*

### **여러분의 테스트 자동화는 어떻게 시작하고 준비하셨나요?**

안녕하세요, 오늘은 저희 QA팀이 겪었던 테스트 자동화의 도전과 새로운 시작에 대해 이야기해보려고 합니다.

혹시 여러분은 테스트 자동화에 도전하시나요? 아니면 이미 구축까지 완료를 했나요? 저희 여기어때 QA팀도 테스트 자동화에 대해 끊임없이 도전하고 있답니다. 그 동안 저희는 “TestProject”라는 도구를 사용하여 테스트 자동화를 구축해왔고, [여기어때 기술 블로그](https://techblog.gccompany.co.kr/testproject%EB%A1%9C-ui-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EC%9E%90%EB%8F%99%ED%99%94-%EB%B9%A0%EB%A5%B4%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-c63a52e25b25)에도 소개가 되었습니다.

![](https://images.gogumang.com/cd232caad6/02.png)

#### 그런데… 사건이 발생했습니다!

어느 날, 저희가 잘 사용하던 “TestProject” 도구가 서비스 종료를 한다는 소식이 들어옵니다. “뭐지? 무슨 일이야?”라는 생각이 들었지만, 저희는 당황하지 않았습니다. 왜냐하면, 언제나 예기치 않은 상황에 대비하는 것이 우리의 일이기 때문입니다.

![](https://images.gogumang.com/cd232caad6/03.png)

#### 새로운 도전의 시작

도구가 사라졌다고 해서 테스트 자동화가 멈출 수는 없습니다. 저희는 새로운 도구와 방법을 찾기 시작했습니다. 새로운 도구를 선택하고, 기존의 테스트 케이스를 이전하고, 새로운 환경에 맞게 최적화하는 과정은 쉽지 않았지만, 저희는 한 발 한 발 나아갔습니다. 이 글은 그 여정의 시작과 도전의 이야기를 전하기 위해 작성하게 되었습니다.

자\~!! 이제 같이 시작해 보겠습니다.

Let’s QA go\~!!!!!!

### **테스트 자동화 도구는 너무 많다.. 우리한테 맞는 건 무엇일까?**

#### STEP 1. 처음 두 개의 테스트자동화 툴을 비교 분석했습니다.

![](https://images.gogumang.com/cd232caad6/04.jpeg)

두 도구 모두 유료 도구로 codeless의 레코딩 방식으로 쉽게 테스트 자동화를 구축할 수 있는 도구들입니다. 앱 개발과 테스트 자동화 분야에서 인기 있는 도구들은 처음에 무료로 배포되다가 일정 시점 이후에 라이선스를 요구하는 모델을 채택하고 있습니다. 이러한 모델은 초기에는 사용자 기반을 빠르게 확보하는 데 효과적일 수 있지만, 장기적으로는 몇 가지 문제점을 야기할 수 있습니다.

![](https://images.gogumang.com/cd232caad6/05.png)

*유료 테스트 자동화 도구의 문제점*

위 문제점을 고려하여 우리가 스스로 개발하고 우리 기술로 만들어야겠다는 생각을 하게 되었습니다.

#### STEP 2. 다음으로는 어떤 Open Source 기술로 개발을 해야할까 결정해야 했습니다.

![](https://images.gogumang.com/cd232caad6/06.png)

*Open source의 테스트 자동화 도구들*

위 그림에서 본 것처럼 Open Source 도구들이 다양한 점과 개발 언어도 다른 점이 문제가 되었고, 그래서 찾은 도구가 바로\~ Robot Framework입니다.

여기서 간단하게 Robot Framework에 대해서 설명 드리겠습니다.

![](https://images.gogumang.com/cd232caad6/07.png)

*Robot Framework*

Python 기반의 도구로 웹/앱/API/DB까지 테스트 자동화를 구축할 수 있는 도구이며, 키워드 기반으로 사전 정의된 키워드를 사용해서 테스트케이스를 작성하고 테스트를 실행 할 수 있습니다.

![](https://images.gogumang.com/cd232caad6/08.png)

#### Robot Framework의 Architecture

![](https://images.gogumang.com/cd232caad6/09.png)

*Robot Framework Architecture*
> 1. Test Data (테스트 데이터) : 테스트 데이터는 테스트 시나리오의 입력값과 기대 결과를 포함하며, 테스트의 정확성과 신뢰성을 보장하는 데 중요한 역할을 합니다.
>
> 2. Robot Framework (로봇 프레임워크) :테스트 실행을 관리하고, 라이브러리와 리소스를 효과적으로 사용할 수 있도록 합니다.
>
> 3. Test Libraries (테스트 라이브러리) : Selenium, Appium 등 다양한 기능을 제공하며, 어플리케이션과 상호 작용할 수 있게 합니다.
>
> 4. System Under Test (테스트 대상 시스템) : 실제로 테스트할 대상입니다. 예를 들어 Android, iOS, 웹 애플리케이션 등이 해당됩니다.

여기서 Test Data를 조금 더 깊게 알아보도록 하겠습니다.
> 1. 테스트 케이스(Test Cases)

Robot Framework의 가장 기본적인 구성 요소는 테스트 케이스(Test Cases)입니다. 테스트 케이스는 소프트웨어의 특정 기능을 검증하기 위해 작성된 스크립트로, 로봇 프레임워크의 문법을 사용하여 작성됩니다. 각 테스트 케이스는 설정(Setup), 테스트 수행(Execution), 테스트 종료(Teardown)의 단계로 구성되며, 이 모든 과정은 키워드를 통해 정의됩니다.

예시:

```
*** Test Cases ***
Valid Login
    Open Browser    http://example.com/login    Chrome
    Input Text      username_field    test_user
    Input Text      password_field    test_password
    Click Button    login_button
    Page Should Contain    Welcome, test_user
    Close Browser
```

> 2. 키워드(Keywords)

키워드(Keywords)는 Robot Framework의 핵심 구성 요소입니다. 키워드는 테스트 케이스의 동작을 정의하며, 재사용 가능하도록 설계되었습니다. 키워드는 자체적으로 정의할 수도 있고, Robot Framework에서 제공하는 기본 라이브러리의 키워드를 사용할 수도 있습니다. 키워드는 단일 동작을 나타낼 수도 있고, 여러 개의 키워드를 조합하여 하나의 키워드로 묶을 수도 있습니다.

예시:

```
*** Keywords ***
Login To Application
    [Arguments]    ${username}    ${password}
    Input Text    username_field    ${username}
    Input Text    password_field    ${password}
    Click Button    login_button
```

> 3. 라이브러리(Libraries)

Robot Framework는 다양한 라이브러리(Libraries)를 제공하여 키워드의 기능을 확장할 수 있습니다. 기본적으로 제공되는 라이브러리에는 SeleniumLibrary, AppiumLibrary, BuiltIn, String, DateTime 등이 있으며, 이 외에도 커뮤니티에서 제공하는 다양한 서드파티 라이브러리를 사용할 수 있습니다. 라이브러리는 Python으로 작성된 모듈이나 패키지를 통해 확장할 수도 있습니다.

예시:

```
*** Settings ***
Library    SeleniumLibrary
Library    String
```

> 4. 리소스 파일(Resources)

리소스 파일(Resources)은 키워드, 변수, 설정 등을 모듈화하여 여러 테스트 케이스에서 재사용할 수 있도록 하는 구성 요소입니다. 이를 통해 테스트 스크립트의 중복을 줄이고 유지보수성을 높일 수 있습니다. 리소스 파일은 `.robot` 확장자를 가지며, 테스트 케이스와 유사한 방식으로 작성됩니다.

예시:

```
*** Settings ***
Resource    login_resources.robot
```

> 5. 변수(Variables)

변수(Variables)는 테스트 케이스 내에서 반복적으로 사용되는 값을 저장하는 데 사용됩니다. 변수는 테스트 케이스의 맨 위에 선언되며, `$`, `@`, `&` 기호를 사용하여 정의됩니다. 변수는 값, 리스트, 딕셔너리 등 다양한 형태로 정의할 수 있습니다.

예시:

```
*** Variables ***
${URL}        http://example.com/login
${BROWSER}    Chrome
${USERNAME}   test_user
${PASSWORD}   test_password
```

> 6. 테스트 스윗(Test Suites)

테스트 스윗(Test Suites)는 여러 개의 테스트 케이스를 그룹화한 것입니다. 테스트 스윗은 디렉토리 구조로 관리되며, 각 디렉토리는 하나의 테스트 스윗으로 간주됩니다. 이를 통해 계층 구조를 이루는 테스트 스윗을 구성할 수 있으며, 이를 활용해 다양한 시나리오에 대한 테스트를 효율적으로 관리할 수 있습니다.

예시:

```
Tests/
|-- login_tests/
|   |-- valid_login.robot
|   |-- invalid_login.robot
|-- registration_tests/
    |-- valid_registration.robot
    |-- invalid_registration.robot
```

> 7. 설정(Settings)

**설정(Settings)** 섹션은 각 테스트 케이스나 키워드의 메타데이터를 정의하는 곳입니다. 여기에는 테스트 스윗의 초기화 작업, 라이브러리와 리소스 파일의 로드, 변수 파일의 로드 등이 포함됩니다. 이를 통해 테스트 케이스의 실행 환경을 설정할 수 있습니다.

예시:

```
*** Settings ***
Library           SeleniumLibrary
Resource          common_keywords.robot
Variables         variables.py
Suite Setup       Open Browser    ${URL}    ${BROWSER}
Suite Teardown    Close Browser
```

> 8. 로그 및 리포트(Log and Report)

Robot Framework는 테스트 실행 후 자동으로 로그(Log)와 리포트(Report)를 생성합니다. 로그 파일은 각 테스트 케이스의 실행 과정과 결과를 상세히 기록하며, 리포트는 전체 테스트의 요약 결과를 보여줍니다. 이를 통해 테스트 결과를 분석하고, 문제 발생 시 원인을 추적할 수 있습니다.

#### STEP 3. 스터디를 시작하게 되었습니다.

테스트 자동화를 구축하기 위한 인원과 목표, 일정을 산정했습니다.
> 인원

인원은 강제하지 않고 자율적으로 참여를 유도하였고, 초기엔 6명이 진행, 이후엔 15명으로 증원되어 스터디를 진행하였습니다.
> 목표

Robot Framework의 이해와 iOS/Android 모바일 앱과 WEB 어플리케이션에 대한 테스트 자동화 테스트케이스 작성 및 실행으로 정하였습니다.
> 일정

3개월 간 스터디 후 실제 구축 진행하기로 결정하였습니다.

스터디 과정은 아래와 같았습니다.
> **1. 기초 이해**
>
> **- 로봇 프레임워크 소개**: 테스트 자동화의 기본 개념, 로봇 프레임워크의 역사 및 장점.
>
> **- 설치 및 환경 설정**: 필요한 도구(예: Python, pip) 설치와 로봇 프레임워크의 설치 과정.
>
> **- 기본 구조와 테스트 작성**: 테스트 케이스, 테스트 스위트, 테스트 라이브러리 등의 기본적인 개념에 대한 이해.
>
> **2. WEB/APP 테스트 케이스 작성**
>
> **- 키워드 사용법**: 내장 키워드와 외부 라이브러리 키워드 사용 방법.
>
> **- 사용자 정의 키워드 만들기**: 재사용 가능한 사용자 정의 키워드를 생성하는 방법.
>
> **- 변수와 설정**: 글로벌, 스위트 수준, 테스트 케이스 수준에서 변수를 정의하고 사용하는 방법.
>
> **- 테스트 케이스 작성 실습** : 간단한 예제를 통해 실제 테스트 케이스를 작성해보기.
>
>
> -**테스트 실행**: 명령줄을 통한 테스트 실행 방법과 옵션.
>
> **- 테스트 리포트 및 로그 분석**: 테스트 실행 후 생성된 리포트와 로그 파일 분석 방법.
>
> **3. 고급 주제**
>
> **- Xpath 고유 속성 추가** : 고유 속성을 추가하여 짧게 유니크한 값을 얻어서 개발.
>
> **- 리소스와 라이브러리 관리**: 공통 키워드와 변수를 관리하는 리소스 파일 사용.
>
> **- 테스트 환경 설정**: 다양한 테스트 환경을 구축하고 관리하는 방법.
>
> **4. 실제 애플리케이션 적용**
>
> **- 실습 프로젝트**: 실제 애플리케이션에 로봇 프레임워크를 적용하여 테스트 자동화 구축.
>
> **- 문제 해결**: 일반적인 문제 상황에 대처하는 방법과 문제 해결 전략.
>
> **5. 통합 및 CI/CD**
>
> **- 버전 관리**: Git과 같은 버전 관리 시스템 사용법.
>
> **- CI/CD 도구와의 통합**: Jenkins, GitLab CI/CD 등과 로봇 프레임워크 통합 방법.

#### STEP 4. 스터디 진행 시 문제점과 테스트 자동화 구축 후 활용 방안을 고민했습니다.

당연히 스터디를 진행하면서 어려웠던 점도 있었죠. 그 중 네 가지를 꼽는다면,

첫째, 서로 다른 OS의 노트북을 가지고 있어 세팅에 어려움이 있었습니다.

![](https://images.gogumang.com/cd232caad6/10.png)

*ride 실행 시 윈도우 노트북의 문제, 파이썬 버전의 문제 등*

![](https://images.gogumang.com/cd232caad6/11.png)

*윈도우 노트북에서의 버전 문제*

둘째, Appium Inspector의 설치형에서 지속적으로 화면 refresh가 되지 않아 Browserstack의 Appium Inspector를 사용하여 각 xpath와 요소를 가져오게 되었습니다.

![](https://images.gogumang.com/cd232caad6/12.png)

*Browserstack의 Appium Inspector를 사용하여 요소를 찾기*

셋째, XPath 값이 해상도 혹은 테스트 단말별로 다르기 때문에 고유 속성을 추가하여 짧게 유니크한 값을 얻어서 개발했습니다.

![](https://images.gogumang.com/cd232caad6/13.png)

넷째, Robot Framework의 IDE 툴인 RIDE에서 몇 가지 문제가 있어 IntelliJ로 변경하여 개발 진행했습니다.

* script 작성 시 저장시 작성된 내용이 사라지는 문제
* 변수나 세팅이 많은 경우 ride에서 제어하기 어려움
* 각자 개발한 스크립트의 형상관리와 공유가 어려움

그리고 스터디 진행 간에 테스트 자동화 활용 방안에 대해서 고민하였고 아래 네 가지 안으로 결정했습니다.

![](https://images.gogumang.com/cd232caad6/14.png)

*테스트 자동화 활용 방안*

* APP/WEB 정기 업데이트 : 최종 릴리즈 버전 테스트 시 진행하는 테스트케이스를 자동화 하여 빠른 대응 및 리소스 확보를 기대합니다.
* 주중 / 주말 정기(서비스) 모니터링 테스트 : 업무 외 시간에 발생되는 장애 건들을 미리 사전에 파악하기 위한 모니터링 테스트에 도입합니다.
* 시스템 작업 후 (서비스) 모니터링 : 새벽 점검 대응 시 웹과 앱으로 구축된 테스트 자동화를 실행하여 안정성 확보를 기대합니다.
* 반복테스트 : 간헐적 발생으로 재현률이 낮은 이슈의 경우 반복 테스트를 자동화 하여 시간 절약 및 업무 스트레스 감소에 기대합니다.

### 시작과 도전을 마치며,

앞으로 해야할 일이 많이 남았습니다.

첫 번째, 각 플랫폼 별로 구축 해야하고,

두 번째, GitLab으로 형상관리를 해야하고,

세 번째, CI/CD를 통해 지속적인 모니터링 테스트를 구축해야하고,

네 번째, 커버리지 확장과 신뢰도를 높일 수 있게 고도화 작업을 해야합니다.

현재 APP/WEB 모두 1차 목표의 구축까지 마친 상태입니다. 앞으로 각 플랫폼별로 구축 과정을 소개해 드릴 예정입니다. 이후에 작성된 블로그도 지속적인 관심 부탁드립니다.