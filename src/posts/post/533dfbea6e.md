LY Corporation에서는 2024년 10월에 사내 웹 프런트엔드 개발에 관여하는 사내 구성원을 대상으로 본인이 생각하는 2024년의 웹 프런트엔드 관련 근황 및 관련 툴 이용 현황을 알아보는 설문 조사, 'State of LY Frontend 2024'를 실시했습니다. 이와 유사한 설문 조사로 [State of JavaScript](https://2024.stateofjs.com/)나 [State of CSS](https://2024.stateofcss.com/)가 많이 알려져 있는데요. 이런 설문 조사의 LY Corporation 사내 버전이라고 생각하시면 이해하기 쉬울 것 같습니다.

이번 설문 조사는 합병 후 1년여의 시간이 흐르며 새로 탄생한 회사의 체제가 정비된 후 처음으로 전사적으로 실시된 설문 조사입니다. 그 덕분에 웹 프런트엔드 개발자만 342명이 참여하는 등 단독 그룹사 직원을 대상으로는 드물게 대규모 조사 결과를 얻을 수 있었습니다.

이례적으로 많은 응답을 받은 만큼 설문 조사 결과 내역을 더 자세히 살펴볼 수 있는 웹페이지도 제작했습니다(아쉽지만 사내에서만 접근 가능해 이 글에서 공유하지는 않겠습니다). 이를 통해 서로 관련 있는 각 문항의 응답을 연관 짓고 비교해 볼 수 있었고, State of JavaScript 및 State of CSS의 결과와 비교해 LY Corporation의 웹 프런트엔드 동향은 어떠한지 그 특징을 자세히 살펴볼 수 있었습니다. 이번 글에서는 그 중에서 특히 흥미로웠던 점을 골라 살펴보겠습니다.

## 조사 개요

* 대상: LY Corporation 그룹 프런트엔드 엔지니어(한국, 일본, 베트남, 대만 조직 소속)
* 조사 기간: 2024/10/14\~2024/10/21
* 응답자 수: 342명

## 응답자 통계

다음은 응답자의 소속 조직을 살펴본 결과입니다. 응답자 비율을 살펴보면 일본(LY Corporation) 외에도 베트남 거점(LINE VIETNAM COMPANY LIMITED/LINE TECHNOLOGY VIETNAM CO., LTD)과 한국 거점(LINE Plus Corporation), 대만 거점(LINE Taiwan Limited) 등 다양한 지역의 구성원이 설문 조사에 참여했습니다.

!["어느 조직에 소속되어 있습니까?"라는 질문에 대한 응답 그래프. 응답: LY Corporation (구 Yahoo! JAPAN Corporation) - 214, LY Corporation (구 LINE) - 61, LINE VIETNAM COMPANY LIMITED / LINE TECHNOLOGY VIETNAM CO., LTD - 18, LINE Plus Corporation - 16, LY Corporation (기타 / 2023년 10월 이후 입사) - 14, LINE Taiwan Limited - 9, 일본 내 다른 회사 - 6, 기타 - 4.](https://images.gogumang.com/533dfbea6e/01.png)

다음은 응답자들의 현재 회사에서의 근무 기간을 조사한 결과입니다. 입사한 지 5년 미만인 임직원의 비율이 가장 높았으며 10년 이상 근무한 임직원도 상당수 있었습니다. 또한 조직에 따라 응답자들의 근무 기간 구성 비율에 편차가 있다는 것도 알 수 있었습니다.

!["현재 회사에서 몇 년 동안 근무하셨습니까?"라는 질문에 대한 응답 그래프. 응답: 0-1년 - 16, 1-2년 - 31, 2-3년 - 65, 3-4년 - 36, 4-5년 - 29, 5-6년 - 31, 6-7년 - 21, 7-8년 - 23, 8-9년 - 9, 9-10년 - 10, 10-15년 - 45, 15-20년 - 21, 20년 이상 - 0, 기타 - 5.](https://images.gogumang.com/533dfbea6e/02.png)

다음은 현재 어떤 분야의 업무를 맡고 있는지 조사한 결과입니다. 복수 응답이 가능했는데요. 백엔드 개발에 참여하고 있다고 답한 응답자 중 77%가 프런트엔드 개발에도 참여하고 있다고 응답했습니다. 특히 Yahoo Japan Corporation 출신 구성원 중 상당수가 프런트엔드를 담당하면서 백엔드나 디자인 분야를 함께 담당하고 있는 것으로 나타났는데요. 이는 구 LINE Corporation에서는 웹 프런트엔드 개발이 비교적 독립적인 개발 조직이었던 반면, 구 Yahoo Japan Corporation에서는 백엔드 개발자나 디자이너가 웹 프런트엔드 개발을 겸하는 경우가 많았기 때문입니다.

!["업무에서 어떤 분야를 담당하고 있습니까?"라는 질문에 대한 응답 그래프. 응답: 프런트엔드 - 294, 백엔드 - 123, 팀 리더/매니저 - 54, 디자인 - 40, 제품 관리 - 16, 기타 - 4.](https://images.gogumang.com/533dfbea6e/03.png)

또한 위 조사 결과에서는 응답자 342명 중 웹 프런트엔드 개발을 담당한다고 응답한 건수가 294명이었다는 점도 흥미로운데요. 웹 프런트엔드 개발에 관여하는 응답자 중 약 15%가 담당 업무가 프런트엔드 개발이 아니라는 것이기 때문입니다. 새삼 웹 프런트엔드의 저변이 넓다는 것을 느낄 수 있었습니다.

다음은 업무 중 사용하는 언어를 조사한 결과입니다. 아무래도 일본어가 다수를 차지하고 있고, 지역이나 프로젝트 구성원 비율 등에 따라 영어나 한국어, 베트남어, 중국어를 사용하기도 합니다. 이에 따라 통역과 함께 진행하는 회의도 많습니다.

!["업무에서 어떤 언어를 사용하십니까?"라는 질문에 대한 응답 그래프. 응답: 일본어 - 300, 영어 - 88, 한국어 - 25, 베트남어 - 21, 중국어 - 11.](https://images.gogumang.com/533dfbea6e/04.png)

## JavaScript 관련 조사 결과

먼저 사용해 본 프레임워크를 조사한 결과입니다. 여러 프레임워크 중 React와 Vue.js의 사용률이 압도적으로 높았습니다. 그 안에서 다시 React와 Vue.js를 비교하면, Vue.js 사용률이 React의 약 절반 수준인 것으로 나타났습니다.

![JavaScript 라이브러리/프레임워크 경험에 대한 질문에 대한 응답 그래프. 응답: React - 208, Next.js - 186, Vue.js v3 - 109, Nuxt - 76, Vue.js v2 - 49, Lit - 8, Angular - 7, Svelte - 7, Preact - 2, Solid.js - 2, HTMX - 1, Qwik - 1.](https://images.gogumang.com/533dfbea6e/05.png)

위 그래프에는 표시돼 있지 않지만 소속 조직별로 살펴보면 LINE Corporation 출신 조직에서는 React와 Vue.js의 사용률이 거의 비슷했습니다. Yahoo Japan Corporation 출신 조직에서는 React의 사용률이 과반수를 차지했으며, 생각보다 Vue.js도 많이 사용하고 있었습니다. 그 외 프레임워크로는 Angular와 Svelte, Lit 등을 사용하고 있었는데요. Lit은 인지도에 비해 사용률이 매우 높았습니다.

메타 프레임워크인 Next.js와 Nuxt는 각각 React와 Vue.js v3의 사용률과 비교해 보면 약 90%와 70%라는 높은 비율로 사용되고 있었습니다. 특히 React의 경우 Next.js와 함께 사용하는 경우가 매우 많은 것으로 보입니다. 이 그래프에는 포함되지 않았지만 자유 응답에서 Astro나 Remix, SvelteKit을 사용한다는 답변도 있었는데요. 다음 설문 조사에서는 이들 메타 프레임워크도 선택지에 포함해 놓으면 결과가 달라질 수도 있을 것 같습니다.

다음은 빌드 툴 사용 조사 결과입니다. webpack 사용률이 가장 높게 나타났고, Vite가 바로 뒤를 잇고 있었습니다. 지난 2023년 조사(참고(일본어))에서는 Vite가 webpack을 앞선 것으로 나타났었는데요. 이번에 webpack이 역전한 것은 모집단 변화에 따른 일시적인 현상으로 추정되며, 전체적으로는 Vite로 전환하는 흐름에는 변함이 없을 것으로 예상됩니다. 또한 이번 조사에서 선택지 내용을 재검토한 결과 임직원들이 이외에도 다양한 빌드 툴을 활용하고 있다는 것을 알 수 있었습니다.

![JavaScript 빌드 도구 경험에 대한 질문에 대한 응답 그래프. 응답: webpack - 220, Vite - 176, tsc (TypeScript CLI) - 126, esbuild - 46, SWC - 40, Rollup - 39, Turbopack - 25, Parcel - 5.](https://images.gogumang.com/533dfbea6e/06.png)

다음으로 테스트 툴을 조사한 결과입니다. Jest와 Vitest 가장 많았고, 둘 중에서는 Jest를 사용한다는 답변이 여전히 다수였지만, 소속 조직별 내역을 살펴보고 작년 결과와 비교하면 Vitest가 빠르게 확산되고 있다는 것을 알 수 있습니다. 또한 Playwright를 사용한다는 응답이 35%로 나타났고, cypress와 Puppeteer 역시 각각 15%씩 나타나는 등 E2E 테스트가 널리 보급되고 있다는 점이 인상적이었습니다.

!["주로 사용하는 테스트 도구는 무엇입니까?"라는 질문에 대한 응답 그래프. 응답: Jest - 256, Vitest - 123, Playwright - 121, cypress - 54, Puppeteer - 50, Mocha - 32, 없음 - 22, Jasmine - 18, 기타 도구 - 8.](https://images.gogumang.com/533dfbea6e/07.png)

다음은 런타임 도구를 조사한 결과입니다. Node.js가 압도적으로 많았고, 그 외 Bun이 21건, Deno 12건 등으로 나타났습니다.

!["주로 사용하는 JavaScript 런타임은 무엇입니까?"라는 질문에 대한 응답 그래프. 응답: Node.js - 314, Bun - 21, Deno - 12, 없음 - 3, 기타 - 1.](https://images.gogumang.com/533dfbea6e/08.png)

## CSS 관련 조사 결과

CSS 구현을 위한 기술 스택 사용 조사 결과에서는 Tailwind CSS와 CSS Modules의 사용률이 비등한 수준으로 높게 나타났습니다. 조직별로 경향을 살펴보면 Yahoo Japan Corporation 출신 조직에서는 CSS Modules를, LINE Corporation 출신 조직에서는 Tailwind CSS를 선택하는 경향이 있는 것으로 보입니다. 또한 사내용 라이브러리를 포함해 그 외의 선택지도 폭넓게 선택되고 있습니다.

![CSS 라이브러리/프레임워크 경험에 대한 질문에 대한 응답 그래프. 응답: Tailwind CSS - 112, CSS Modules - 110, Styled Components - 58, Emotion / Chakra UI - 35, Saya - 34, Bootstrap - 33, LDS (LINE Design System) - 29, Riff - 23, Headless UI Library - 21, Styled JSX - 20, koromo - 15, Zero-runtime CSS - 11.](https://images.gogumang.com/533dfbea6e/09.png)

위 결과를 통해 CSS 관련해서는 JavaScript만큼 다수를 차지하는 라이브러리가 없고, 프로젝트에 따라 최적의 라이브러리를 선택한다는 것을 알 수 있습니다. 참고로 가장 인지도가 높은 라이브러리는 Bootstrap이지만 사용하는 프로젝트는 소수에 불과한 것으로 보입니다.

## 기타 주목할 만한 답변

아래 두 그래프는 각각 JavaScript와 CSS 관련 지식이 스스로 어느 정도 수준인지를 5점 만점 기준으로 평가해 달라고 요청한 질문의 응답 결과인데요. JavaScript의 평균이 3.035인 반면 CSS의 평균은 2.632로 확연히 낮게 나온 점이 눈에 띕니다. 최근 몇 년 동안 점점 발전하는 CSS 기술을 따라가지 못해 스스로 자신 없다고 느끼는 사람이 많다는 것인데요. 저희가 해결해야 할 과제 중 하나로 보입니다.

!["JavaScript에 대한 지식 수준을 말씀해 주세요."라는 질문에 대한 응답 그래프. 평균 점수는 5점 만점에 3.035점입니다.](https://images.gogumang.com/533dfbea6e/10.png)

!["CSS에 대한 지식 수준을 말씀해 주세요."라는 질문에 대한 응답 그래프. 평균 점수는 5점 만점에 2.632점입니다.](https://images.gogumang.com/533dfbea6e/11.png)

LY Corporation에서는 ChatAI([참고](https://www.lycorp.co.jp/ja/news/release/007755/)(일본어))나 SeekAI([참고](https://www.lycorp.co.jp/ja/news/release/008806/)(일본어)) 등 사내용 생성형 AI 툴을 제공하고 있는데요. 설문 조사 결과 이런 툴들이 널리 사용되고 있는 것으로 나타났습니다. 그 밖에도 GitHub Copilot나 Slack AI 툴 등을 많이 사용하고 있는 것으로 보이며, 자유 응답에서는 그 외 다양한 툴도 추가로 언급됐습니다.

!["어떤 생성형 AI 도구를 사용하십니까?"라는 질문에 대한 응답 그래프. 응답: ChatAI - 310, GitHub Copilot - 222, SeekAI - 97, Slack AI - 60, 없음 - 15, Miro AI - 6, ChatGPT - 5, 기타 - 12.](https://images.gogumang.com/533dfbea6e/12.png)

## 마치며

이번 설문 조사 결과를 요약하면 다음과 같습니다.

* 채택하는 기술 스택은 소속 조직에 따라 여러 측면에서 차이가 있었습니다.
  * 구 Yahoo Japan Corporation 출신 조직에서 사용하는 가장 대표적인 기술 스택은 React이고, 대부분 Next.js와 함께 사용하고 있었습니다. CSS 프레임워크로는 CSS Modules, 테스트 툴은 Jest를 많이 사용하며, Playwright를 사용한 E2E 테스트도 적극적으로 도입하고 있었습니다.
  * 구 LINE Corporation 출신 조직에서는 경우에 따라 React와 Vue.js를 구분해서 사용하고 있었으며, 메타 프레임워크인 Next.js와 Nuxt는 절반 정도 사용하고 있었고, 사용하지 않는 경우도 있었습니다. CSS 프레임워크는 Tailwind CSS의 채택률이 높았고, 빌드 툴과 테스트 툴은 각각 Vite, Vitest로 마이그레이션이 진행되고 있었습니다.
* 많은 웹 프런트엔드 개발자가 JavaScript에 비해 CSS 지식이 부족하다고 생각하는 것으로 나타났습니다.
* 웹 프런트엔드 개발에 관여하는 응답자 중 약 15%는 담당 업무가 프런트엔드 개발이 아니라고 응답해 웹 프런트엔드 개발의 목적이 다양하다는 것을 알 수 있었습니다.

이번 설문 조사를 통해 합병 이후 잘 알려지지 않았던 각 조직의 웹 프런트엔드 현황을 알 수 있었습니다. State of LY Frontend 2024의 결과가 여러분이 생각했던 것과 비슷했나요? 아니면 생각했던 것과는 다른 결과였나요? 팟캐스트 '[UIT INSIDE](https://uit-inside.linecorp.com/episode/168)(일본어)'에서 이번 조사에 대해 이야기한 에피소드도 확인할 수 있으니 관심 있으신 분들은 한 번 들어보시기 바랍니다.