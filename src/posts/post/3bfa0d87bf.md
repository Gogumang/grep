안녕하세요. 2024년 4월에 신입 사원으로 LY Corporation에 입사한 Inoue Shuichi입니다. 현재 사내용 Kubernetes as a Service인 FKE 팀에서 개발 업무를 담당하고 있고, Orchestration 길드 멤버로 활동하고 있습니다.

Orchestration Development Workshop은 CTO가 선발한 엔지니어가 모여 현장에서 AI를 더욱 적극적으로 활용할 수 있는 실무 지식을 전사적으로 공유하는 커뮤니티입니다([참고](https://techblog.lycorp.co.jp/ko/start-orchestration-development-workshop)). Orchestration 길드는 워크숍에서 다룰 주제 제안, 바로 적용할 수 있는 실무 사례 공유, 기술 관점에서 품질을 높이기 위한 조언 등을 담당하면서 Orchestration Development Workshop 콘텐츠가 개인에 의존하지 않고 지속적으로 발전할 수 있도록 지원하는 역할을 맡고 있습니다.

이 글에서는 Orchestration Development Workshop에서 공유한 'ADK(Agent Development Kit)로 싱글/멀티 에이전트 개발 및 사내 시스템과 통합' 내용을 소개합니다.

## 사내 AI 활용 니즈와 AI 활용 확산 과정에서 드러난 과제

### 일상 업무 중 AI 활용 니즈

일상 업무 속에는 PR(pull request) 리뷰나 고객 지원 대응, 사내 문서 검색 등 업무 전반에 걸쳐 AI를 활용해 자동화하거나 보조할 수 있는 부분이 많습니다. 저희 회사는 Jira나 Confluence와 같은 사내 시스템에서 정보를 검색하기가 어렵다는 문제가 있었습니다. 글로벌 기술 기업이라는 특성상 문서가 여러 곳에 분산돼 있어 필요한 정보를 찾는 데 시간이 많이 걸렸고, 세부 규정이나 가이드라인 등 내용을 이해하기 어려운 문서도 많았습니다. AI 지원이 필요한 곳이 많았던 것입니다.

이러한 배경 속에 저희 회사는 '향후 3년 내 업무 생산성 2배 향상 및 지속적 혁신 창출을 목표로 한다'는 방침 아래 적극적으로 AI를 활용한 업무 효율화를 추진하고 있습니다.

### AI 활용이 확산되며 나타난 새로운 문제

AI 활용이 확산되면서 새로운 문제도 드러나고 있습니다. 현재 저희 회사는 Cline, Claude Code와 같은 로컬 기반 AI 에이전트 도구를 도입하고 있는데 그 활용 사례가 개인 단위에 머무르는 경향이 있습니다. 그 때문에 적극적으로 사용하는 사람과 그렇지 않은 사람 간의 격차가 발생하면서 지식이 사일로화되고 생산성에 개인 간 차이가 발생하고 있습니다. 또한 팀 내 공통 문제에 대해 여러 사람이 각각 프롬프트를 만들고 최적화하면서 중복 작업이 발생하고 있고, 더 나아가 멀티 에이전트 개념 자체를 모르는 경우가 많아 싱글 에이전트의 한계에 부딪혀 AI 에이전트 활용을 포기하는 사례도 확인되고 있습니다.
![Challenges In AIAdoption](https://images.gogumang.com/3bfa0d87bf/01.png) AI 생성 이미지

## 문제를 해결하기 위해 실습형 워크숍을 선택한 이유

이 문제를 해결하기 위해 저는 팀 내에서 상향식 활동을 진행하고 있었습니다. 구체적으로는 로컬 AI 도구에 의존하지 않고 AI 에이전트를 생성 및 호스팅해 팀 전체에 공유하는 방법을 제안했고, 멀티 에이전트가 중요하다는 것을 알리면서 도구를 개발해 사내 기술 컨퍼런스에서 발표하기도 했습니다.

저는 이와 같은 활동을 계기로 Orchestration 길드 멤버로 참여하게 되었습니다. 길드에서 워크숍을 준비하면서, 사내 AI 활용 편차 문제를 해결하려면 다음 세 가지 요소를 조직 차원에서 이해하는 것이 중요하다고 판단했습니다.
![Solutions For AI Adoption Challenges](https://images.gogumang.com/3bfa0d87bf/02.png) AI 생성 이미지

* 싱글 에이전트와 멀티 에이전트의 개념 및 특성 이해
  * 싱글 에이전트의 한계와 장단점
  * 멀티 에이전트의 특성과 장단점
* 팀 단위 지식 공유 체계 구축
  * 중앙 집중형 AI 에이전트 구축 후 지식 집약
* AI 에이전트와 사내 시스템 연계 방식 이해
  * MCP(model context protocol) 활용

이런 내용은 이론만 학습해서는 실제 업무에서 활용하는 데 한계가 있기 때문에 ADK를 주제로 삼아 참가자가 실제로 직접 손을 움직이며 위 세 가지 요소를 체험할 수 있도록 'ADK(Agent Development Kit)로 싱글/멀티 에이전트 개발 후 사내 시스템과 통합하기'라는 주제로 워크숍을 준비했습니다.

## 워크숍 내용 요약

워크숍은 이론 학습과 실습을 반복하는 형태로 진행했습니다. 내용을 간단히 요약해 공유하겠습니다.

![Workshop Banner](https://images.gogumang.com/3bfa0d87bf/03.png)

### 이론 학습: 싱글 에이전트와 멀티 에이전트 비교

싱글 에이전트는 단일 LLM으로 구성된 단순한 시스템으로 개발 비용이 낮지만, 복잡한 문제나 높은 전문성이 필요한 상황에 제한적으로만 대응할 수 있다는 단점이 있습니다. 반면 여러 개의 LLM으로 구성하는 멀티 에이전트는 복잡한 문제에 대응할 수 있는 능력과 작업 최적화 수준이 높지만, 토큰 사용량이 증가하고 개발이 복잡해지며 사용량 제한에 걸리지 않도록 주의할 필요가 있다는 단점이 있습니다.

### 이론 학습: ADK 개요

ADK는 에이전트 동작을 정의하고 멀티 에이전트 시스템을 구현하기 위한 오픈소스 소프트웨어입니다. Python/Java/Go에서 사용할 수 있으며, Python으로 함수를 정의하면 이를 에이전트가 하나의 도구로 바라보고 실행할 수 있습니다. ADK를 이용해 팀 단위로 에이전트를 구축하고 호스팅해 공유하면 팀원이 개별로 프롬프트를 조정해야 하는 수고를 줄이고 생산성을 높일 수 있습니다.

### 실습: 싱글 에이전트 생성

실습은 다음과 같은 순서로 진행했습니다.

* ADK의 기본 에이전트 체험
* ADK 웹 UI를 실행하고 브라우저에서 에이전트 실행
* 프롬프트를 변경해 에이전트 동작 조정
* 에이전트가 미리 준비한 Python 함수를 실행하게 만들어 도구 호출 체험

이 실습의 학습 내용 및 핵심 포인트는 두 가지입니다. 첫 번째는 인스트럭션으로 에이전트 응답을 유연하게 제어하는 것을 체험하는 것, 다음으로 단순한 Python 코드를 에이전트가 이용할 수 있는 도구로 쉽게 통합할 수 있다는 것을 체험하는 것입니다.

### 이론 학습: MCP 소개

MCP는 LLM을 외부 시스템과 연결하기 위해 사용하는 오픈소스 표준 프로토콜입니다. MCP를 이용하면 LLM이 과거 문의 내역이나 자료 위치 등의 정보를 능동적으로 탐색할 수 있습니다. 현재 저희 회사에서는 MCP를 이용해 Jira나 Confluence 등과 연동할 수 있도록 준비돼 있습니다.

한 가지 주의할 점은, LLM에게 사용할 수 있는 도구를 너무 많이 부여하면 프롬프트가 비대해져 응답이 지연되거나 정확도가 떨어질 수 있다는 것인데요. 이런 현상을 완화하기 위해 멀티 에이전트를 통해 컨텍스트를 분리하는 방법도 소개했습니다.

### 실습: MCP를 활용한 사내 시스템 연계

먼저 간단한 에이전트에 MCP를 설정하는 실습을 진행했습니다. 이 실습은 단순히 도구를 제공하는 것만으로는 충분하지 않으며, 적절한 프롬프트를 설정하지 않으면 LLM이 도구를 제대로 활용하지 못한다는 점을 확인하기 위한 실습이었습니다. 참가자는 실습을 통해 프롬프트를 적절히 작성하면 에이전트가 Confluence 등의 사내 시스템에서 능동적으로 정보를 검색해 활용할 수 있다는 것을 확인했습니다.

### 실습: 순차적 멀티 에이전트를 이용해 '프로젝트 추적기' 구성

MCP를 활용해 사내 시스템 연계를 실습한 뒤에는 '프로젝트 추적기'를 구성해 보는 실습을 진행했습니다. 구체적으로 말씀드리면, Jira에서 관리되는 프로젝트의 진행 상황을 분석해서 종합 리포트를 생성하는 멀티 에이전트 시스템을 구축하는 것입니다. ADK의 순차 에이전트(sequential agent)를 활용해 4개의 에이전트(정보 수집 → 분석 → 리포트 생성 → 번역)를 순차적으로 실행하는 형태로 구성했습니다.

프로젝트 추적기의 상세 아키텍처는 다음과 같습니다.

![Project Tracker](https://images.gogumang.com/3bfa0d87bf/04.png)

다음은 ADK 샘플 코드의 일부입니다.

    from google.adk.agents import Agent, SequentialAgent
    from google.adk.models.lite_llm import LiteLlm

    from common import agent_config, mcp, prompt

    # Agent 1: In-Progress Task Analyzer
    in_progress_analyzer_agent = Agent(
       name="in_progress_analyzer",
       model=LiteLlm(model=agent_config.MODEL),
       description=(
          "A specialized agent that analyzes in-progress tasks in a Jira PROJECT. "
          "Extracts PROJECT key from URL, searches for in-progress tasks, and provides detailed analysis."
       ),
       instruction=(
          prompt.mcp_agent() + prompt.mcp_jira() + prompt.in_progress_analyzer()
       ),
       tools=[
          mcp.mcp_jira,
       ],
    )

    # Agent 2: Todo Task Analyzer
    todo_analyzer_agent = Agent(
       name="todo_analyzer",
       model=LiteLlm(model=agent_config.MODEL),
       description=(
          "A specialized agent that analyzes todo/unstarted tasks in a Jira PROJECT. "
          "Searches for todo tasks and provides detailed analysis including priorities and dependencies."
       ),
       instruction=(prompt.mcp_agent() + prompt.mcp_jira() + prompt.todo_analyzer()),
       tools=[
          mcp.mcp_jira,
       ],
    )

    # Agent 3: Report Generator
    report_generator_agent = Agent(
       name="report_generator",
       model=LiteLlm(model=agent_config.MODEL),
       description=(
          "A specialized agent that generates comprehensive PROJECT progress reports. "
          "Synthesizes analysis from previous agents into a structured Markdown report."
       ),
       instruction=prompt.report_generator(),
    )

    # Agent 4: Translator
    translate_agent = Agent(
       name="translate_agent",
       model=LiteLlm(model=agent_config.MODEL),
       description=(
          f"A specialized agent that translates reports into {agent_config.LANGUAGE}. "
          "Preserves original formatting and structure while providing accurate translation."
       ),
       instruction=prompt.translate_report(),
    )

    # Root Agent - Sequential Multi-Agent System
    root_agent = SequentialAgent(
       name="PROJECT_tracker_system",
       description=(
          "Multi-agent system for PROJECT progress tracking. "
          f"Analyzes in-progress and todo tasks, generates comprehensive reports, and translates to {agent_config.LANGUAGE}."
       ),
       sub_agents=[
          in_progress_analyzer_agent,
          todo_analyzer_agent,
          report_generator_agent,
          translate_agent,
       ],

이 실습을 통해 참가자는 워크플로가 다소 복잡해도 ADK의 순차적 에이전트를 사용해 여러 에이전트를 동원하면 보다 쉽게 구현할 수 있다는 것을 경험할 수 있었습니다. 이를 기반으로 스프린트 계획 시 진행 상황을 보다 효율적으로 확인하거나 타 부서에 공유할 진척 보고서 작성을 자동화하는 등의 여러 실무에 AI를 적용할 수 있을 것입니다.

## 워크숍 성과

이번 워크숍에는 약 2,000명이 실시간으로 참여했습니다. 워크숍 성과를 측정하기 위해 참가자를 대상으로 학습 및 실습 내용을 업무에 적용했거나 앞으로 적용할 의향이 있는지 묻는 설문조사를 실시했습니다. 아래는 설문 결과입니다.

|             선택 항목              |    비율     |
|--------------------------------|-----------|
| 이미 지속적으로 활용하고 있음               | **1.7％**  |
| 이미 일부를 시도해 봄                   | **17.4％** |
| 아직 시도하지 않았지만, 가까운 시일 내에 시도할 예정 | **68.2％** |
| 아직 시도하지 않았고, 시도할 계획도 없음        | **10.0％** |
| 기타                             | **2.7％**  |

68.2%의 참가자가 '아직 시도하지 않았지만 가까운 시일 내에 시도할 예정'이라고 응답했습니다. 많은 참가자가 워크숍 내용을 긍정적으로 받아들이고 실천할 의지를 보인 것입니다. 또한 약 19%의 참가자가 '이미 일부를 시도해 봄' 혹은 '지속적으로 활용하고 있음'이라고 답하며 현재 실천 단계에 들어섰다는 것을 보여줬습니다. 이들이 만들어 내고 있는 실천 사례를 향후 사내에 공유하면 다른 참가자들이 실천할 계기가 될 수 있을 것입니다. 마지막으로 10%의 참가자가 '아직 시도하지 않았고, 시도할 계획 없음'이라고 응답했습니다. 이들에게는 도입 장벽을 낮출 수 있는 지원 정책을 제공하거나 성공 사례를 소개하는 방법이 효과적일 것으로 보입니다.

전체적으로 이번 워크숍은 참가자에게 '앞으로 실천해 보고 싶다'는 의지를 이끌어 낸 좋은 계기가 되었습니다.

## 워크숍을 준비하고 진행하며 얻은 인사이트

이번 워크숍은 콘텐츠 수집 및 선정에서부터 기획까지 길드 멤버들이 함께 협력하며 수행했습니다. 준비하고 리허설하면서 매번 회고를 진행하며 길드원의 피드백을 받았고, 이를 기반으로 실습 진행 방식을 정교하게 설계했습니다. 그 과정에서 얻은 인사이트를 공유합니다.

### 콘텐츠 설계의 중요성

워크숍에서 가장 중요한 것은 참가자의 이해 수준에 맞춘 콘텐츠 설계입니다. 저희는 이론과 실습의 균형을 맞추고 단계적으로 난도를 높이는 구조로 구성해서 초보자도 무리 없이 학습할 수 있는 흐름을 만들었습니다. 참가자가 싱글 에이전트 → MCP 연동 → 멀티 에이전트 순서로 학습 및 실습하도록 설계한 덕분에 참가자는 각 개념을 점점 깊이 이해하며 실무에 바로 적용할 수 있는 스킬을 습득할 수 있었습니다.

또한 콘텐츠를 설계할 때 제한된 시간 내에 최대한의 학습 효과를 얻을 수 있도록 체험을 최우선순위에 두었습니다. 이론 설명을 최소화하고 참가자가 직접 손을 움직이며 'AI 에이전트로 무엇을 할 수 있는가'를 체감하는 데 집중했습니다. 참가자는 에이전트가 사내 시스템에서 정보를 가져오는 모습이나, 멀티 에이전트가 서로 협력해 작업을 수행하는 과정을 실제로 확인함으로써 기술의 가능성을 보다 구체적으로 상상할 수 있었습니다.

많은 참가자는 '무엇을 할 수 있는지' 직접 체험하면서 '내 업무에도 바로 활용할 수 있겠다'는 실질적인 인사이트를 얻었고, 이는 긍정적인 설문 조사 결과로 나타났습니다.

### 길드 멤버와의 협업

길드 멤버들과 협업하면서 다양한 관점에서 피드백을 받을 수 있었던 것도 중요한 포인트입니다. 각 멤버의 배경이 서로 달랐기 때문에 '이 설명은 초보자에게 너무 어렵다', '이 부분은 더 단순하게 설명하는 것이 좋다'와 같은 구체적인 개선 제안을 받을 수 있었습니다. 리허설을 반복하면서 예상치 못한 문제에 대응하는 방안과 참가자 지원 체계를 정비할 수 있었고, 그 덕분에 본 행사에서 안정적으로 진행할 수 있었습니다.

### 사내 기술 확산의 어려움과 보람

이번 워크숍을 진행하면서 새로운 기술을 사내에 확산시키는 일이 어렵다는 점과, 동시에 이 어려운 일을 달성했다는 보람을 함께 느낄 수 있었습니다. 많은 참가자가 설문 조사에서 '가까운 시일 내에 시도해 보고 싶다'는 긍정적인 반응을 보여준 것이 큰 힘이 되었습니다. 이번 워크숍을 계기로 사내에 AI 에이전트를 활용하는 문화가 더욱 확산되기를 기대합니다.

## 앞으로 도전할 분들을 위한 추천 단계

AI 에이전트나 ADK를 활용한 개발에 도전하고자 하는 분들을 위한 실천 단계를 소개합니다.

1. 우선 싱글 에이전트부터 시작하기
   1. ADK 공식 문서를 참고해 개발 환경 구축
   2. 간단한 챗봇을 만들어 기본 동작 이해
   3. 프롬프트 엔지니어링으로 에이전트 작동 제어 감각 습득
2. 도구 연동 경험하기
   1. Python으로 간단한 함수를 작성하고 Agent 도구로 통합
   2. 파일 조작부터 업무에서 사용하는 도구까지 실용적인 도구를 실험
   3. MCP를 활용해 외부 서비스(GitHub, Slack 등)와 연동
3. 팀 내 작은 문제 해결하기
   1. 팀 내 공통 과제 탐색(예: 반복 작업 자동화, 정보 검색 효율화 등)
   2. 싱글 에이전트로 해결 가능한 범위부터 실제 업무에 적용
   3. 팀 내 공유 후 팀원의 피드백을 받아 지속적으로 개선
4. 멀티 에이전트에 도전하기
   1. 작업 중 싱글 에이전트의 한계를 느끼면 멀티 에이전트 구성 검토
   2. 순차적 에이전트부터 시작해 작업을 분해하고 연계하는 과정 이해
   3. 점진적으로 복잡한 워크플로에 도전하면서 실무 관점에서 가치 검증
5. 지식 공유 팀 내 확산
   1. 성공 사례와 실패 사례 사내 공유
   2. 다른 구성원도 참고할 수 있도록 문서와 지식 베이스 정비
   3. 워크숍이나 LT(lightning talk)를 개최해 조직 전체의 AI 활용 촉진

중요한 것은 작게 시작하여 점진적으로 확장해 나가는 것입니다. 완벽을 목표로 하기보다는 일단 작동하게 만들어 피드백을 받으면서 개선해 나가는 접근 방식이 성공으로 가는 지름길입니다.

## 마치며

이번 글에서는 Orchestration Development Workshop에서 진행한 'ADK로 싱글/멀티 에이전트 개발 및 사내 시스템과 통합' 워크숍 내용을 소개하고 그 성과를 공유했습니다. AI 에이전트는 앞으로 더욱 중요해질 기술 영역입니다. 따라서 개인 단위 활용에 머무르면 안 되고 팀 전체가 지식을 공유하며 조직 차원에서 활용을 장려해 생산성 향상에 접목해 나가야 한다고 생각합니다.

이번 워크숍을 통해 많은 참가자가 AI 에이전트의 가능성을 체감하고 실천 의지를 갖게 된 것은 매우 큰 성과였습니다. 앞으로 사내에서 AI 에이전트 활용 문화가 더욱 확산돼 업무 효율화와 혁신 창출로 이어지기를 기대합니다.

마지막으로 Orchestration 길드 멤버와 워크숍 참가자 여러분, 워크숍 개최를 지원해 주신 모든 분들께 감사드립니다. 이 글을 읽고 관심이 생기셨다면 ADK를 직접 사용해 보신 뒤 여러분의 경험과 인사이트를 사내외에 공유해 주시기를 바랍니다.

* [Orchestration Development Workshop 시리즈 기사 목록](https://techblog.lycorp.co.jp/ko/orchestration-development-workshop-article-list)