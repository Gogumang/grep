**0. Beginning**

한정된 자원 속에서 테스트를 빠르게 반복하기 위해 많은 QA 엔지니어, 테스터분들이 테스트 자동화 구축에 도전을 합니다. 하지만, 시작부터 커다란 진입장벽이 떡 하니 버티고 있는데요. 바로, 도구 선택과 환경 구축입니다.

테스트 자동화 툴은 너무 많은데, 써본 적도 없는 툴의 특성과 현재 상황(비용 등)을 고려하여 신중하게 선택하라고 하니 매우 큰 고민이 아닐 수 없습니다. 그렇게 오랜 고민 끝에 툴을 결정하면, 이상하게 나만 안되는 환경 구축 때문에 좌절감을 느껴본 경험 다들 하나씩 갖고 계시지 않으신가요?

안녕하세요, 저는 QA팀에서 테스트 자동화를 담당하고 있는 카일 입니다. 저는 이 글에서, TestProject라는 테스트 자동화 솔루션과 QA팀이 어떻게 활용하고 있는지 소개하려고 합니다.

**1. TestProject**

TestProject는 Selenium, Appium 기반의 테스트 자동화 솔루션 입니다. 하지만, 복잡한 설치와 환경설정 과정을 제거했고, Record-Playback 방식으로 쉽게 테스트를 작성하고 수행할 수 있습니다. TestProject는 모든 기능을 무료로 제공하고 있기 때문에 테스트 자동화를 처음 시작하기에 좋습니다.

Windows, MacOS, Linux 환경에서 사용 가능하며 Docker Image도 제공하고 있습니다. 테스트 대상으로 대부분의 웹 브라우저와 iOS, Android를 지원하며, Virtual Device도 사용 가능합니다.

**2. Installation**

* <https://testproject.io>에 접속하여 Download 버튼을 클릭합니다.

![](https://images.gogumang.com/d6d05ab7ce/01.png)

*Testproject 홈페이지*

* 다음 나오는 대화상자에서 회원가입/로그인을 진행합니다.

![](https://images.gogumang.com/d6d05ab7ce/02.png)

*회원가입*

* 이메일 인증까지 완료되었다면 TestProject Agent를 설치합니다. 설치는 환경에 따라 10분 내외로 완료됩니다.

![](https://images.gogumang.com/d6d05ab7ce/03.png)

*설치 진행*

* 테스트 단말을 USB로 연결합니다. 개발자모드의 USB 디버깅 옵션이 켜져있는지 확인해야 합니다.
* 테스트 자동화를 위한 모든 준비가 완료되었습니다!

![](https://images.gogumang.com/d6d05ab7ce/04.png)

*설치가 완료된 모습*

**3. Creating Test**

* \[+New Test\] 클릭 \> Mobile 클릭 \> Test Details 입력 \> Platform 설정 \> Device에 저장된 App 등록 \> Record 방법 선택 \> 저장 위치 선택(TestProject Cloud 사용 가능) \> Start Recording 클릭하여 테스트를 생성합니다.

<https://youtu.be/orVc4_b7B_E>

* 필요에 따라 Reset App step을 제거합니다.
* 각 UI Element를 클릭하거나 화면을 스와이프 하면 자동으로 Test Step을 생성합니다.

<https://youtu.be/Y8GoiF3GrWs>

* \[Run\] 버튼을 클릭하여 내가 만든 테스트를 수행해볼 수 있습니다.

**4. Running Test**

* 실행을 원하는 테스트에 마우스 오버 시 나타나는 실행버튼을 클릭하여 테스트를 실행할 수 있습니다.

<https://youtu.be/ShTyOoQUrZA>

* 실행 중인 테스트의 진행상황을 Monitor 페이지로 이동하여 확인할 수 있습니다.

![](https://images.gogumang.com/d6d05ab7ce/05.png)

*Monitor 화면*

* 실행 완료된 테스트의 보고서를 Reports 페이지로 이동하여 확인할 수 있습니다. 보고서는 자동 생성되며, 설정에 따라 스크린샷을 함께 확인할 수 있습니다.

![](https://images.gogumang.com/d6d05ab7ce/06.png)

*Report 화면*

**5. Running Job**

Job을 이용하여 여러 테스트를 하나의 시나리오로 한 번에 수행할 수 있습니다.

* \[Add a Job\] 버튼 클릭 \> 플랫폼 선택 \> Job Detail 입력 \> Agent, 테스트 대상 단말 선택 \> 기타 설정 \> Create Job 클릭하여 Job을 생성합니다.
* 원하는 테스트를 드래그 하여 Job의 테스트 목록에 드롭합니다.

<https://youtu.be/s8N_Uz7KlTo>

* 실행을 원하는 Job에 마우스 오버 시 나타나는 실행버튼을 클릭하여 테스트를 실행합니다.
* 실행 중인 Job의 진행상황을 Monitor 페이지로 이동하여 확인할 수 있습니다.
* 실행 완료된 Job의 보고서를 Reports 페이지로 이동하여 확인할 수 있습니다. 보고서는 자동 생성되며, 설정에 따라 스크린샷을 함께 확인할 수 있습니다.

![](https://images.gogumang.com/d6d05ab7ce/07.png)

*Report 화면*

* Job의 아이콘들을 클릭하면 원하는 시간에 자동으로 실행하도록 설정 가능하며, 수행 시작과 종료 시 Slack이나 Email로 알림을 받도록 설정할 수 있습니다.

**7. Development**

* Github, Gitlab을 연동하여 버전관리를 할 수 있습니다.

![](https://images.gogumang.com/d6d05ab7ce/08.png)

*Github 연동을 통한 버전관리*

* Plugin을 통해 Jenkins와 쉽게 연동 가능합니다.

![](https://images.gogumang.com/d6d05ab7ce/09.png)

*Jenkins Freestyle project의 build step에 추가*

* Parameter, CSV 파일을 활용하여 Data Driven Test가 가능합니다.
* Test, Job 생성, 실행과 관련된 Restful API를 제공합니다. Swagger 문서를 참고하시기 바랍니다.(URL : <https://api.testproject.io/docs/v2/>)

![](https://images.gogumang.com/d6d05ab7ce/10.png)

*Restful API 목록*

**8. Strategy**

QA팀은 TestProject를 다음의 세 가지로 활용하려고 합니다.

가장 먼저, 원하는 시간대에 End to End 테스트를 수행하여 앱서비스를 실시간에 가깝게 모니터링 하려고 합니다. 앱 업데이트 검증에서 찾아내지 못한 UI 이슈 혹은 서버의 이슈가 없는지 QA 관점에서 확인하고 싶었습니다. 현재는 3시간 간격으로 여기어때 앱 전체를 가볍게 순회하는 테스트를 수행 중에 있습니다.

![](https://images.gogumang.com/d6d05ab7ce/11.png)

*QA팀에서 수행중인 모니터링 테스트 Slack 알림*

두 번째로, 앱 배포 후 테스트를 수행하여 검증 가능 여부를 판단하고, 앱업데이트의 반영 사항을 반복적으로 테스트하려고 합니다. 기존의 모듈과 새로 반영된 내용이 잘 통합이 되었는지 확인하는데 드는 시간과 노력을 줄이려고 합니다.

마지막으로, 가변 요소가 적은 범위를 효율적으로 테스트하려고 합니다. 해당 범위를 자동화로 대체하여 생산성을 높이고, 시간과 노력을 다른 곳에 더 투자할 수 있도록 합니다.

**9. Ending**

지금까지 TestProject에 대한 기본적인 내용과 이를 활용해서 어떻게 하고 있는지, 어떻게 해 나갈 것인지 소개 드렸습니다. 테스트 자동화가 수동 테스트를 완벽하게 대체할 수는 없지만, QA 생산성 향상과 품질의 보증, 개선을 위해 계속해서 확장시키고 발전시켜 나가겠습니다.

23.11.07 수정) 현재는 Testproject가 서비스를 종료한 상태로 다른 테스트 자동화 구축 방법을 구상 중에 있습니다. 완료되면 또 소개드릴 수 있도록 하겠습니다.

긴 글 읽어주셔서 감사합니다.

**\[참고자료\]**

* TestProject Documentaion : <https://docs.testproject.io/>