![NHN Cloud_meetup banner_frontendnews2024_202412_900.png](https://images.gogumang.com/be70bbded4/01.png)

안녕하세요. NHN Cloud NCUI개발팀 이진우입니다.

저는 올해 2월부터 매주 프론트엔드 관련 다양한 뉴스레터를 읽고, FE 개발 직무 동료들에게 흥미로운 뉴스, 읽을거리, 유용한 도구 등을 공유해 왔습니다. 어느덧 연말이 가까워지며 쌓여 온 링크들은 상당한 양이 되었는데요. 이를 정리하며 개인적으로 인상 깊었던 주제와 도구를 공유드리고자 합니다.

물론, 개인적인 관심사가 반영되어 있기도 하고, 조직 내에서 영향이 큰 프레임워크나 기술 스택 위주로 정리된 만큼 부족한 부분이 있을 수 있습니다. 훑어보시면서 혹시 낯설거나 관심이 가는 주제가 있다면 함께 제공한 읽을거리 링크가 도움이 되기를 바랍니다. (정리된 내용 중 일부는 시간이 지나며 업데이트되거나 새로운 정보로 대체되었을 수 있습니다. 🙏)

## 프론트엔드 기술 스택

프론트엔드 개발은 마치 9G 중력 가속도처럼 빠르게 변하며 개발자들을 압박해 왔지만 최근엔 변화의 속도가 다소 안정된 듯한 느낌입니다. ☕️ 새로운 개념을 바탕으로 한 프레임워크와 도구가 끊임없이 쏟아졌던 과거와 달리, 이제는 더 나은 생산성과 사용자 경험을 위한 실용적인 도구들이 점차 정착되고 있습니다. 2024년에 출시되진 않았지만, 개인적으로 올해 활약상이 인상 깊었던 몇 가지 라이브러리를 소개하고자 합니다. 🧑‍💻

### shadcn/ui

[shadcn/ui](https://ui.shadcn.com/)는 TailwindCSS와 Headless UI의 철학을 결합한 라이브러리로, 복사-붙여넣기(copy-paste) 방식으로 빠르게 UI를 구현할 수 있는 점이 특징입니다. 개발자는 필요한 컴포넌트를 복사한 뒤, 프로젝트 요구에 맞게 간단히 수정하여 사용할 수 있어 효율성이 뛰어납니다.

* [(번역) shadcn/ui의 해부](https://siosio3103.medium.com/shadcn-ui-%EC%9D%98-%ED%95%B4%EB%B6%80-ebd469c34614)
* [How headless components became the future for building UI libraries](https://www.subframe.com/blog/how-headless-components-became-the-future-for-building-ui-libraries)
* [Headless, boneless, skinless \& lifeless UI](https://nerdy.dev/headless-boneless-and-skinless-ui)

### Zod

[Zod](https://zod.dev/)는 TypeScript와 완벽히 통합된 스키마 선언 및 데이터 검증 라이브러리로, 간결한 문법과 타입 추론을 통해 개발 생산성을 크게 높여 서버-클라이언트 간 데이터 구조를 명확하게 정의하고 유지할 수 있습니다. REST API, GraphQL, Form Data Validation 등 다양한 환경에서 활용 가능하며, 코드의 가독성을 유지하면서도 강력한 검증 로직을 구현할 수 있는 도구입니다.

* [The process.env frontend time bomb](https://massimilianomirra.com/notes/the-frontend-process-env-time-bomb-plus-a-sustainable-definition-of-fixed)
* [Making a REST API typesafe with Ready Query and Zod](https://noahflk.com/blog/typesafe-rest-api)

### Vitest

[Vitest](https://vitest.dev/)는 Vite 기반의 테스트 러너로, 빠른 테스트 실행 속도와 간편한 설정으로 주목 받고 있습니다. 테스트 생태계의 하나의 표준과도 같았던 Jest와 유사한 API를 제공해 쉽게 전환이 가능하며, ESM과 TypeScript를 기본적으로 지원합니다. 특히 Vite와의 긴밀한 통합을 통해 개발 환경과 테스트 환경 간의 일관성을 유지할 수 있어 Vite 사용 시 더욱 효율적인 테스트 경험을 제공합니다.

* [Vitest vs. Jest](https://www.speakeasy.com/post/vitest-vs-jest)
* [Storybook 8.3 - First class Vitest integration](https://storybook.js.org/blog/storybook-8-3/)
* [JavaScript unit testing frameworks in 2024: A comparison](https://raygun.com/blog/javascript-unit-testing-frameworks/#vitest)

### 기타

* [Biome](https://biomejs.dev/)은 ESLint, Prettier의 대체 도구로 빠른 속도를 자랑합니다. 하지만 파일 간의 의존성이나 프로젝트 전반의 정보를 필요로 하는 정적 분석엔 아직 개선이 필요한데, 최근 Biome의 개발자는 [다중 파일 분석의 접근 방법](https://arendjr.nl/blog/2024/11/biome_approach_to_multi_file_analysis/)을 공유했습니다.

* 요즘 웹사이트만 들어가면 쿠키 동의 때문에 정신없으시죠? GDPR(general data protection regulation)을 준수하기 위함인데 이와 관련된 라이브러리들([cookieconsent](https://github.com/brainsum/cookieconsent), [cookie checker](https://complydog.com/free-cookie-checker-tool))이 눈에 띄었습니다.

* Zod의 대안으로 Yup, AJV, Joi, Superstruct 등이 있지만 TypeScript와의 통합이 부족하거나, 기능이 부족하거나, 러닝 커브가 높기도 합니다. 하지만 최근 [Vailbot](https://valibot.dev/)이 v1 베타 기간을 갖고 있는데, 더 작은 번들 사이즈로도 Zod와 유사한 기능을 제공해 주목을 받고 있습니다.

* [TanStack](https://tanstack.com/)은 Tanner Linsley가 운영하는 라이브러리 생태계로, 현재 9개 라이브러리를 운영하며 프론트엔드 개발에서 빠르게 주목 받고 있습니다. 특히 알파 단계인 TanStack Start 프레임워크는 Next.js의 잠재적 경쟁자로 화제가 되고 있으며, TanStack Router는 SSR을 강력히 지원하며 클라이언트 사이드의 인터랙션도 최적화합니다. 또한, 엔터프라이즈급 라우팅을 타입 안전하게 구현하며, 번들링 및 배포는 [Vinxi](https://github.com/nksaraf/vinxi)를 통해 처리해 높은 성능과 유연성을 제공합니다.

## React

### React Deep Dive

NHN Cloud의 FE 개발 조직은 React를 사용하고 있는데요. 사실 React로 기술 스택을 전환한 지는 React의 역사에 비해 그리 오래되지 않았습니다. 시간이 지남에 따라 React 사용에 익숙해지면서 내부 동작 원리에 대한 호기심이 생겼고, 조직 내 몇 명이 모여 React 내부 구조를 알아보는 스터디를 시작했습니다. 🧑‍🎓 아래는 스터디 과정에서 참고했던 링크들입니다.

* [React 톺아보기](https://goidle.github.io/react/in-depth-react-preview/)
* [(번역) A deep dive into React Fiber internals](https://bumkeyy.gitbook.io/bumkeyy-code/frontend/a-deep-dive-into-react-fiber-internals)
* ▶️ [React 파이버 아키텍처 분석](https://d2.naver.com/helloworld/2690975)
* ▶️ [Inside React (동시성을 구현하는 기술)](https://deview.kr/2021/sessions/518)

### React 19

React팀은 v19 업데이트를 위해 많은 노력을 기울였습니다. 하지만 최초 v19 RC가 공개된 후 Suspense의 동작 변경으로 인해 여러 컴포넌트가 순차적으로 데이터를 가져오게 되는 워터폴 현상이 발생했습니다. 😰 React 팀은 이 동작이 의도된 동작이 아님을 확인하고 수정하겠다고 밝혔습니다. 이 사건은 오픈 소스 커뮤니티에서 투명한 소통과 협력의 중요성을 다시 한번 환기시켰습니다. 현재 React v19는 `prewarming`이라는 기능을 통해 이슈를 해소하며, 다시 RC v1 단계를 거쳐 현재 [v19](https://github.com/facebook/react/releases/tag/v19.0.0)를 릴리스했습니다. 🚀

* [React 19 and suspense](https://tkdodo.eu/blog/react-19-and-suspense-a-drama-in-3-acts)
* [React core PR - sibiling pre-rendering feature](https://github.com/facebook/react/issues/29898#issuecomment-2477449973)
* [What's new in react 19](https://vercel.com/blog/whats-new-in-react-19)
* [Server Actions have been renamed to Server Functions](https://19.react.dev/reference/rsc/server-functions)

### React Compiler

React v19만큼이나 커뮤니티를 들썩이게 만든 또 다른 주제는 바로 React Compiler(코드명: Forget 😶‍🌫️)입니다. React는 상태 변경과 리렌더링을 중심으로 동작하지만, 때로는 memoization을 통해 이러한 동작을 최적화해야 할 때가 있습니다. 그러나 이 과정에서 가독성이 떨어지고 오류가 발생하는 경우가 많았습니다. 이러한 문제를 해결하기 위해 React Compiler가 등장했죠. 🤩

React Compiler는 memoization 최적화를 자동으로 처리할 뿐만 아니라, 앞으로는 JSX Inlining과 JSX Outlining 같은 기능도 지원할 예정입니다.

- JSX Inlining: 불필요한 JSX Runtime 호출을 제거하고 미리 빌드된 JSX 객체를 삽입. - JSX Outlining: 컴파일러가 하위 컴포넌트를 자동으로 추출하여 최적화.

현재 [베타 릴리스](https://react.dev/blog/2024/10/21/react-compiler-beta-release) 단계이며, React v17 이상에서 사용할 수 있습니다. ✨

* [(번역) 리액트 컴파일러 사용법](https://junghan92.medium.com/%EB%B2%88%EC%97%AD-%EB%A6%AC%EC%95%A1%ED%8A%B8-%EC%BB%B4%ED%8C%8C%EC%9D%BC%EB%9F%AC-%EC%82%AC%EC%9A%A9%EB%B2%95-%EC%99%84%EB%B2%BD-%EA%B0%80%EC%9D%B4%EB%93%9C-a6a0e96edc97)
* [Understanding React Compiler](https://tonyalicea.dev/blog/understanding-react-compiler/)
* [Alias analysis in the React Compiler](https://www.recompiled.dev/blog/alias-analysis/)
* [Compiler Theory and Reactivity](https://www.recompiled.dev/blog/ssa/)
* [Type system of the React Compiler](https://www.recompiled.dev/blog/type-system/)
* ▶️ [What's next for the react compiler?](https://www.youtube.com/watch?v=qd5yk2gxbtg)

### Next.js

[Next.js](https://nextjs.org/)는 React 기반의 풀스택 프레임워크로, 서버와 클라이언트 렌더링을 유연하게 결합해 강력한 개발 경험을 제공합니다. 특히 App Router와 React Server Components(RSC)의 도입으로 동적 라우팅과 성능 최적화가 크게 강화되었습니다. 올해 Next.js는 [v14.2](https://nextjs.org/blog/next-14-2), v15 RC [v1](https://nextjs.org/blog/next-15-rc), [v2](https://nextjs.org/blog/next-15-rc2)를 거쳐 정식으로 [v15](https://nextjs.org/blog/next-15)를 릴리스했습니다. 여기에 모노레포(monorepo) 관리를 위한 Turborepo와 차세대 번들러인 Turbopack 또한 긴밀히 통합해 Next.js 생태계를 구축하고 있습니다.

* [How vercel adopted microfrontends](https://vercel.com/blog/how-vercel-adopted-microfrontends)
* [Turbopack Dev is now stable](https://nextjs.org/blog/turbopack-for-development-stable)
* [How to set up next.js 15 for production in 2024](https://www.reactsquad.io/blog/how-to-set-up-next-js-15-for-production)
* [Vercel functions - serverless servers and the challenge of new React architecture](https://bobaekang.com/blog/serverless-servers-and-the-challenge-of-new-react-architecture)
* [Turborepo installation](https://turbo.build/repo/docs/getting-started/installation#start-with-an-example)
* ▶️ [Self-hosting Next.js](https://www.youtube.com/watch?v=sIVL4JMqRfc)

### Remix

[Remix](https://remix.run/)는 React를 기반으로 한 풀스택 웹 프레임워크로, 서버 사이드 렌더링(SSR)과 클라이언트 사이드 라우팅을 지원하여 빠르고 유연한 웹 애플리케이션 개발을 가능하게 합니다. 2022년 10월, Remix는 [Shopify에 인수](https://remix.run/blog/remixing-shopify)되었으며, 이후 Shopify는 [Hydrogen](https://hydrogen.shopify.dev/)에 Remix를 기반으로 한 기능을 도입해 보다 강력한 전자상거래 플랫폼을 구축했습니다.

사실 Remix와 React Router는 아주 긴밀하게 연결되어 있었습니다. 이런 관계로 인해 점점 두 프로젝트의 경계가 모호해지며, Remix는 사실상 React Router의 확장판이 되었습니다. 이에 따라 Remix팀은 React Router 사용자들이 코드 분할, 데이터 로딩, 서버 렌더링 등 Remix의 강력한 기능을 손쉽게 활용할 수 있도록 두 프로젝트의 통합을 결정했습니다.

* [Incremental path to React 19](https://remix.run/blog/incremental-path-to-react-19)
* ▶️ [Remix Roadmap](https://www.youtube.com/watch?v=fjTX8hQTlEc&t=400s)

### 기타

리액트 관련해 흥미로웠던 글들을 소개합니다.

* [Conceptual Model of React and RSC](https://ondrejvelisek.github.io/conceptual-model-of-react-and-rsc/)
* [The two reacts](https://overreacted.io/the-two-reacts/)
* [The anatomy of a React Island](https://swizec.com/blog/the-anatomy-of-a-react-island/)
* [Locality of Behavior in React Components](https://alexkondov.com/locality-of-behavior-react/)
* [React's evolution from Hooks to Concurrent React: From React 16 to 18, a long overview](https://tigerabrodi.blog/reacts-evolution-from-hooks-to-concurrent-react)
* [Two ways to the two Reacts](https://bobaekang.com/blog/two-ways-to-the-two-reacts/)

## 개발 환경

### JavaScript Runtimes

한때 크로스 브라우저 호환성이 웹 개발의 주요 화두였다면, 이제는 자바스크립트 런타임 전쟁이 서서히 다가오고 있습니다. 오랜 시간 표준처럼 여겨졌던 [Node.js](https://nodejs.org/en) 외에도 [Deno](https://deno.com/)와 [Bun](https://bun.sh/)이 놀라운 속도로 발전하며 도전장을 내밀고 있습니다. 여기에 [LLRT](https://github.com/awslabs/llrt)와 같은 새로운 도구들까지 등장하면서, 자바스크립트 런타임 생태계는 이제 다양한 선택지와 경쟁으로 가득 찬 새로운 시대를 맞이하고 있습니다. 한편, Node.js 또한 선두 주자로서 입지를 지키기 위해 새로운 기술을 적극 수용하며 생태계를 확장하고 우위를 유지하려는 노력을 이어가고 있습니다.

* [JS Toolbox 2024: Runtime environments \& package management](https://raygun.com/blog/js-toolbox-part-1/)
* [Runtime Compatibility](https://runtime-compat.unjs.io/)
* [Node Core PR module: add --experimental-transform-types](https://github.com/nodejs/node/pull/54283)
* [Native Support for CJS/ESM Interoperability Begins in Node.js 22](https://webdeveloper.beehiiv.com/p/native-support-cjsesm-interoperability-begins-nodejs-22)
* [Node.js takes steps towards removing corepack](https://socket.dev/blog/node-js-takes-steps-towards-removing-corepack)

### Package Managers

다양한 JavaScript Runtime들만큼이나 프로젝트 의존성 관리와 패키지 설치를 돕는 Package Manager도 전통적인 npm과 Yarn을 넘어 더 빠르고 효율적인 대안들이 떠오르며 경쟁이 치열해지고 있습니다. 📦

[pnpm](https://pnpm.io/ko/)은 디스크 공간 효율성과 모노레포(monorepo) 지원을 강점으로, [Bun](https://bun.sh/)은 올인원 도구로 놀라운 설치 속도를 자랑합니다. 또한 [JSR](https://jsr.io/docs/with/deno)은 다양한 JavaScript Runtime과 호환되며 TypeScript와 ESM을 네이티브로 지원해 현대적인 모듈 관리를 선도하고 있습니다. npm의 개발자는 새롭게 팀을 만들어 [vlt](https://www.vlt.sh/client)라는 패키지 매니저와 레지스트리인 [vsr](https://www.vlt.sh/serverless-registry)까지 출시했습니다.

각 Package Manager는 고유의 특징과 강점을 바탕으로 개발자들에게 더 나은 선택지를 제공하며, 자바스크립트 생태계를 넓히고 있습니다.

* [Introducing Deno 2](https://deno.com/blog/v2.0)
* [Bun 1.1](https://bun.sh/blog/bun-v1.1)
* [vlt - Introducing our team, investors \& more](https://blog.vlt.sh/blog/the-team)

### Build Tools

현대적인 프론트엔드 개발을 위한 빌드 도구는 결국 [Vite](https://vite.dev/) 아래 모이게 되었습니다. 👑 [Remix가 Vite로 마이그레이션](https://remix.run/blog/remix-vite-stable)되었고, [Angular의 툴 체인](https://v17.angular.io/guide/esbuild)에도 도입되었으며, 그 외 수많은 라이브러리와 프레임워크가 Vite 위에 구축되어 오고 있습니다. 이로 인해 Vite의 주간 npm 다운로드 수는 1,700만건 가까이 기록하고 있으며 Next.js를 제외한 주요 생태계를 점령했습니다.

Evan You에 의하면 Vite팀은 소스 파일에서 AST를 만들고, Linting, Formatting, Testing 등 모든 과정을 네이티브 수준의 속도로 처리는 툴체인을 구축하려는 목표를 세웠고 실제로 [VoidZero](https://voidzero.dev/posts/announcing-voidzero-inc)라는 회사를 설립해 투자 유치에 성공했습니다.

최근 릴리스된 Vite 6.0에선 [Environment API](https://main.vite.dev/guide/api-environment)를 추가해 단일 Vite 서버에서 필요한 만큼 환경을 생성해 앱이 동작하는 방식을 매핑할 수 있게 됩니다. Vite는 이제 Deno, Bun과 같은 JavaScript Runtime으로 실행과 번들링이 가능해지고, React Native나 Electron과 같은 특수한 Runtime도 지원합니다.

* [Vite Dev Server 이해하기](https://1ilsang.dev/posts/js/dev-server)
* [Increasing Vite's potential with the Environment API](https://green.sapphi.red/blog/increasing-vites-potential-with-the-environment-api)
* ▶️ [Visual Guide to the Modern Frontend Toolchain - Vite](https://youtu.be/M_edImKoEt8?si=RL1VrRyD1BYhqEnA)

### Bundler

현재 개발에 박차를 가하고 있는 차세대 번들러들은 Rust 기반으로 설계되어 기존의 Parcel, Rollup, Webpack에 비해 더욱 빠르고 강력한 성능을 자랑합니다. ⚡️ 물론, 일부 개발자들은 이런 장점을 위해 모든 것을 새로 만드는 것이 과연 필요한가에 대한 의문을 제기하기도 합니다.

하지만, Go로 작성된 [esbuild](https://esbuild.github.io/)로 Dev Server를 제공하는 Vite를 경험하고 나니, 다시 Webpack으로 돌아가는 일이 무척 멀게만 느껴지는 것도 사실입니다.

차세대 번들러를 간단히 살펴보자면, [Rspack](https://rspack.dev/)은 Webpack의 [Drop-in Replacement](https://rspack.dev/guide/migration/webpack#migrate-from-webpack)로 호환성과 성능을 강조하고 있으며, [Turbopack](https://nextjs.org/docs/architecture/turbopack)은 안정화 단계를 거쳐 [Next.js v15의 권장 도구](https://nextjs.org/blog/next-15#turbopack-dev)로 자리 잡으며 Webpack의 후계자를 자처하고 있습니다. 또한 Vite 진영에서도 [Rolldown](https://rolldown.rs/)이라는 차세대 도구를 개발 중입니다. 마지막으로 또 내가 제일 빠르다고 하는 [Mako](https://makojs.dev/)도 있네요.

각 도구들이 경쟁하며 프론트엔드 생태계에 바람을 일으키고 있습니다. 앞으로 누가 이 씬을 주도하게 될지 기대가 됩니다. 🧐

* [Rspack announcing 1.0](https://rspack.dev/blog/announcing-1-0)
* [Rslib](https://github.com/web-infra-dev/rslib)
* [Lessons learned switching to Rspack](https://birtles.blog/2024/08/14/lessons-learned-switching-to-rspack)
* [Why does Vercel bother with Turbopack when Vite already exists?](https://github.com/vercel/next.js/issues/48748#issuecomment-2199941311)
* [Why we are building Rolldown](https://rolldown.rs/about#why-we-are-building-rolldown)

## 프레임워크

### Vue

Vue는 올해 [v3.5](https://blog.vuejs.org/posts/vue-3-5)의 첫 번째 마이너 릴리스를 발표하며 성능과 메모리 최적화, SSR 지원에 주력했습니다. 특히, 반응형 시스템을 리팩터링하여 메모리 사용량을 56% 감소시키고, 대규모 및 깊은 배열의 처리 성능을 눈에 띄게 향상시켰습니다. Vue 역시 SSR(Server-Side Rendering) 지원 강화를 목표로 새로운 기능들을 추가하며, 현대적인 웹 애플리케이션 개발을 위한 진화를 계속하고 있습니다.

* [10 Years of Vue: the Past and the Future](https://www.youtube.com/watch?v=OmrwRrZitv4)

### Angular

올해 Angular는 3월, 구글의 내부 프레임워크 [Wiz와의 통합](https://blog.angular.dev/angular-and-wiz-are-better-together-91e633d8cd5a)을 발표했습니다. Wiz는 Gmail, Search와 같은 성능이 중요한 서비스에서 사용되는 프레임워크로 이번 통합은 SSR 지원 강화를 목적으로 이루어졌습니다. 이어 5월에는 [v18](https://blog.angular.dev/angular-v18-is-now-available-e79d5ac0affe)을 발표하며 변경 감지 라이브러리 추출, 홈페이지 개편, 그리고 SSR 기능 강화를 진행했습니다. 11월에는 [v19](https://blog.angular.dev/meet-angular-v19-7b29dfd05b84)가 [릴리스](https://github.com/angular/angular/releases/tag/19.0.0)되며, 부족했던 렌더링 모드의 다양화, Hydration 제어 개선, 그리고 Signal 도입이라는 큰 변화를 선보였습니다.

* [Google Angular Lead sees convergence in JavaScript Framework](https://thenewstack.io/google-angular-lead-sees-convergence-in-javascript-frameworks/)
* [Managing Angular](https://blog.mgechev.com/2024/08/25/managing-angular/)

### Svelte

Svelte는 [v5](https://svelte.dev/blog/svelte-5-is-alive) 릴리스를 통해 패러다임의 전환을 알렸습니다. 과거에는 `let count = 0`만 작성해도 Svelte의 컴파일러가 이를 상태로 처리했지만, 이제는 더 명시적으로 상태를 선언하는 방식으로 변화했습니다. 새로운 메커니즘인 [runes](https://svelte.dev/blog/runes)가 도입되었으며, `$state()`를 통해 반응형 상태를 명확히 관리할 수 있게 되었습니다.

### Astro

Astro는 최근 [v5](https://astro.build/blog/astro-5/) 업데이트에서 타입 안전 환경 변수 설정을 지원하며 환경 변수의 가시성과 안전성을 강화했습니다. 또한 Content Layer API를 통해 다양한 데이터 소스에서 가져온 콘텐츠를 타입 안전하게 관리할 수 있게 되었으며, 렌더링 기능을 강화해 페이지와 컴포넌트별로 SSR과 정적 생성을 유연하게 선택할 수 있게 했습니다.

### Hono

[Hono](https://hono.dev/)는 모든 JavaScript Runtime에서 실행 가능한 경량 웹 서버 프레임워크로, 빠른 라우팅을 지원하는 RegExpRouter 개념과 여러 헬퍼, 미들웨어로 주목 받고 있습니다.

### Waku

[Waku](https://waku.gg/)는 Zustand와 Jotai 진영에서 개발한 리액트 기반 풀스택 프레임워크로, React의 Server Action API를 지원하는 [v0.21](https://waku.gg/blog/server-actions-are-here)을 출시했습니다. 중규모 애플리케이션 개발을 목표로 하며, Next.js의 대안으로 기대를 받고 있습니다.

## 다양한 렌더링 모드

최근 프론트엔드 프레임워크들은 다양한 렌더링 방식을 제공하여 각자의 장점을 활용한 최적화 전략을 선보이고 있습니다. CSR(Client-Side Rendering)은 동적이고 빠른 사용자 경험(UX)을 제공하지만, 초기 HTML이 서버에서 제공되지 않기 때문에 SEO에는 다소 불리합니다. 이에 반해, SSR(Server-Side Rendering)과 SSG(Static-Site Generation)은 초기 페이지 로드 시 완전한 HTML을 제공해 SEO와 성능 최적화에 유리합니다. Astro는 [Islands Architecture](https://jasonformat.com/islands-architecture)를 활용해 정적 콘텐츠와 인터랙티브 요소를 분리하고, Server Islands를 통해 필요한 동적 콘텐츠만 효율적으로 로드합니다. 또한, Next.js는 [PPR(Partial Pre-Rendering)](https://vercel.com/blog/partial-prerendering-with-next-js-creating-a-new-default-rendering-model)을 통해 동적 콘텐츠를 스트리밍 하며 점진적 렌더링 방식을 선도하고 있습니다. 이런 다양한 렌더링 방식들은 앱의 목적과 성능 요구 사항에 따라 적절히 선택할 필요가 있습니다.

* [Client-Side Rendering](https://github.com/theninthsky/client-side-rendering)
* [What's a Single-Page App?](https://jakelazaroff.com/words/whats-a-single-page-app/)
* [How to choose the best rendering strategy for your app](https://vercel.com/blog/how-to-choose-the-best-rendering-strategy-for-your-app)

## JavaScript

### Signals

ECMAScript 위원회인 TC39에 [Signal 도입 제안](https://github.com/tc39/proposal-signals)이 올라왔습니다. [Preact](https://preactjs.com/), [Solid](https://solidjs.com/)와 같은 프레임워크는 이미 Signal을 활용하여 Reactivity를 구현하고 있습니다. Signal은 애플리케이션 상태를 관리하는 방식으로, 상태 변경 시 UI를 업데이트합니다. React의 상태 변경이 전체 리렌더링을 유발하는 반면, Signal은 세분화된 상태 변경을 처리하여 렌더링 없이 최소한의 작업으로 UI를 갱신합니다. 이 제안을 통해 여러 프레임워크에서 중복된 Reactivity 모델을 제거하고, 개발 도구에서도 Signal의 활용이 기대됩니다.

* [How to Build Signals from Scratch](https://www.freecodecamp.org/news/learn-javascript-reactivity-build-signals-from-scratch/)

### Temporal

새로운 날짜 및 시간 처리 기능인 Temporal이 [Stage 3](https://github.com/tc39/proposal-temporal)에 도달했습니다. 기존 JavaScript의 `Date` 객체가 가진 문제들을 해결하기 위해 설계되었으며, 개발자들이 보다 직관적이고 강력한 시간 처리를 할 수 있도록 도울 것입니다.

* [JS Dates are about to be fixed](https://docs.timetime.in/blog/js-dates-finally-fixed)

### ECMAScript 2024

2024년 ECMAScript 언어 사양이 승인되면서 새로운 기능들이 추가되었습니다. 주요 기능으로는 `Promise.withResolvers()`, `Object.groupBy`, `Map.groupBy` 등이 있습니다. 과거처럼 대규모 신규 개념이 추가되기보다는 기존 기능의 개선과 최적화가 주를 이루는 모습입니다.

* [ECMAScript 2024](https://2ality.com/2024/06/ecmascript-2024.html)
* [What's new in ECMAScript 2024](https://pawelgrzybek.com/whats-new-in-ecmascript-2024/)
* [The state of ES5 on the web](https://philipwalton.com/articles/the-state-of-es5-on-the-web/)

### 기타

TC39는 기존에 JavaScript 표준 프로세스에서 Stage를 [0\~4 단계](https://tc39.es/process-document/)로 유지했으나, 최근 [Stage 2.7](https://thenewstack.io/inside-ecmascript-javascript-standard-gets-an-extra-stage/)을 추가했습니다. 이는 Stage 3에서 Stage 2로 롤백될 경우 발생하는 리소스를 줄이고, 작업 효율성을 향상시키기 위한 조치로 보입니다.

## CSS

### CSS-in-JS

CSS-in-JS는 SSR의 활성화에 따라 한동안 인기를 잃어 왔지만 React v19의 새로운 기능으로 다시 주목을 받고 있습니다. 특히 스타일 호이스팅(precedence 속성을 사용해 `<style>` 태그를 문서 헤드로 이동)을 지원하며, 온디맨드 스타일 렌더링이 개선되었습니다. 이에 따라 [Restyle](https://www.restyle.dev/), [StyleX](https://stylexjs.com/blog/introducing-stylex), [PandaCSS](https://panda-css.com/)와 같은 라이브러리가 주목 받고 있으며, MUI는 [PigmentCSS의 도입](https://mui.com/blog/introducing-pigment-css)을 시도하고 있습니다. 또한 CSS-in-JS의 리소스 문제를 극복한 Compiled CSS-in-JS 방식도 주목을 받고 있습니다.

* [CSS in React Server Components](https://www.joshwcomeau.com/react/css-in-rsc/)
* [Why is CSS-in-JS slow?](https://playfulprogramming.com/posts/why-is-css-in-js-slow)
* [A preview of Pigment CSS: the next generation of CSS-in-JS](https://mui.com/blog/introducing-pigment-css/)

### CSS 신규 기능

2024년에는 CSS의 새로운 스펙들이 도입되며, 작년에 이어 [Baseline](https://web.dev/baseline)과 [Interop](https://web.dev/blog/interop-2024)과 같이 플랫폼 간 상호운용성에 대한 노력이 CSS 생태계가 더욱 강력하게 만들고 있습니다. `@property` 문법으로 CSS 변수를 선언하고 속성을 정의하거나, Popover API로 번거롭던 Modal 문제를 해결하는 등 개발자의 생산성을 크게 향상시키고 있습니다. 이번에는 2024년 도입된 주요 기능과 개인적으로 관심을 가졌던 최신 CSS 관련 링크를 공유 드립니다.

* [CSS Container Queries](https://css-tricks.com/css-container-queries/)
* [If CSS gets inline conditionals](https://css-tricks.com/if-css-gets-inline-conditionals/)
* [CSS anchor API](https://developer.chrome.com/blog/anchor-positioning-api)
* [Popover API lands in Baseline](https://web.dev/blog/popover-api)
* [The undeniable utility of CSS `:has`](https://www.joshwcomeau.com/css/has/)
* [CSS `@property` and the new style](https://ryanmulligan.dev/blog/css-property-new-style/)
* [New CSS that can actually be used in 2024](https://thomasorus.com/new-css-that-can-actually-be-used-in-2024.html)
* [Old Dogs, new CSS Tricks](https://mxb.dev/blog/old-dogs-new-css-tricks/)
* [A Framework for evaluating browser support](https://www.joshwcomeau.com/css/browser-support/)
* [CSS Wrapped 2024](https://chrome.dev/css-wrapped-2024/)
* ▶️ [Amazing CSS in 2024](https://www.youtube.com/watch?v=D79TND9w_AY)

### Masonry 레이아웃

오랫동안 웹 개발자들은 Pinterest 스타일의 Masonry 레이아웃을 구현하기 위해 JavaScript에 의존해왔습니다. 🧱 그러나 이제 CSS가 이 기능을 네이티브로 지원할 준비를 하고 있으며 이를 구현하는 방식에 대해 [Chrome팀](https://rachelandrew.co.uk/archives/2024/09/21/masonry-and-good-defaults)과 [Webkit팀](https://webkit.org/blog/15269/help-us-invent-masonry-layouts-for-css-grid-level-3/) 간에 새로운 `display`를 추가할지, `grid` 내에 통합할지 [논의](https://webkit.org/blog/16026/css-masonry-syntax/)가 이어지고 있습니다.

## Performance

### e18e

JavaScript 생태계의 성능 향상을 목표로 한 커뮤니티 기반 이니셔티브 [e18e(Ecosystem Performance)](https://e18e.dev/)가 실질적인 진전을 이루며 주목 받고 있습니다. e18e는 다음 세 가지 목표를 중심으로 자바스크립트 생태계의 개선을 추진하고 있습니다.

1. Clean up: 인기 있는 패키지의 중복된 의존성 제거 또는 대체를 통해 속도를 최적화.
2. Speed up: 널리 사용되는 패키지와 프레임워크의 성능 개선.
3. Level up: 오래된 패키지에 대해 더 가볍고 모던한 대안을 마련.

이니셔티브의 노력은 커뮤니티의 참여로 이루어지며, 최신 패치 목록과 대안을 제안하는 [module-replacements](https://github.com/es-tooling/module-replacements)와 같은 결과물로 나타나고 있습니다. 최근 공개된 [October Contribution Showcase](https://e18e.dev/blog/october-contributions-showcase.html)에서는 Storybook과 ESLint 같이 널리 사용되는 도구에 대한 기여가 눈에 띕니다. 이를 통해 e18e는 자바스크립트 생태계의 전반적인 성능을 끌어올리는 데 실질적인 역할을 하고 있으며, 커뮤니티와 오픈 소스 생태계의 협력을 이끌어내고 있습니다. e18e는 단순히 성능 개선을 넘어, 개발자들이 사용하는 핵심 도구를 더 가볍고 빠르게 만들어 생태계 전반에 긍정적인 영향을 미칠 것으로 기대됩니다.

### Web Vitals - INP

[Web Vitals](https://web.dev/articles/vitals)는 Google이 정의한 웹 성능 지표로, 사용자 경험(UX)을 개선하기 위한 기준을 제공합니다. 2024년 정식으로 선정된 [INP(Interaction to Next Paint)](https://web.dev/articles/inp)는 사용자 상호작용 후 다음 화면이 렌더링될 때까지의 지연 시간과 응답성을 측정하며, 기존 FID(First Input Delay)보다 더 포괄적이고 실질적인 경험을 반영합니다. INP는 사용자 입력 이벤트를 우선 처리하고, 비동기 렌더링을 최적화하는 등 동시성 기술을 통해 개선할 수 있습니다.

* [What is INP and why you should care](https://blog.sentry.io/what-is-inp/)
* [Understanding Interaction to Next Paint(INP)](https://frontendmasters.com/blog/understanding-inp/)
* [Investigating INP issues](https://www.stefanjudis.com/blog/investigating-inp-issues/)
* [How to improve INP in React](https://kurtextrem.de/posts/improve-inp-react)
* [How to Improve INP: Yield Patterns](https://kurtextrem.de/posts/improve-inp)
* [Demystifying INP: New tools and actionable insights](https://vercel.com/blog/demystifying-inp-new-tools-and-actionable-insights)

## 기타

### Mobile

모바일 개발 생태계에서도 큰 변화가 이어지고 있습니다. React Native는 [새로운 아키텍처](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here)로 재작성되어 [v0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture)에서 동기식 네이티브 통신, 동시성 시스템, 새로운 이벤트 루프를 도입하며 성능과 안정성을 크게 개선했습니다. 한편, Google의 Flutter는 최근 조직 축소와 커뮤니티 대응 지연으로 비판을 받아 왔으며, 이에 대응해 커뮤니티가 Flutter를 포크한 [Flock](https://flutterfoundation.dev/blog/posts/we-are-forking-flutter-this-is-why)를 발표했습니다. Flock은 문제 해결에 집중하고 있지만 인원 부족으로 인상적인 성과를 내기 어려울 것이라는 전망도 있습니다. 이러한 변화들은 크로스 플랫폼 개발의 미래를 더욱 흥미롭게 만들고 있습니다.

### Architecture

개인적으로 소프트웨어 설계 관련해 기억나는 포스트는 C4 모델을 응용한 Visualizing Frontend Architecture와 FSD(Feature-Sliced Design)입니다. C4 모델은 소프트웨어 시스템을 Context, Container, Component, Code의 4가지 레벨로 나누어 시각화하는 방식으로, 이를 프론트엔드에 적용해 아키텍처를 명확히 표현한 접근이 인상 깊었습니다. 한편, FSD는 기능(feature) 단위로 관심사를 분리하여 모듈화된 폴더 구조를 설계하는 방식으로, 대규모 프로젝트의 유지 보수성과 확장성을 크게 향상시킵니다. 이러한 접근법들은 구조적 명확성을 제공하며, 올해 프론트엔드 설계에서 중요한 흐름으로 자리 잡았습니다.

* ▶️ [Visualising software architecture with the C4 model](https://www.youtube.com/watch?v=x2-rSnhpw0g)
* [Visualizing Frontend Architecture](https://frontendatscale.com/issues/17)
* [Feature-Slided Design Pattern](https://feature-sliced.design/)
* [FSD 관점으로 바라보는 코드 경계 찾기](https://velog.io/@teo/fsd)
* [프론트엔드 개발자 관점으로 바라보는 관심사의 분리와 좋은 폴더 구조 (feat. FSD)](https://velog.io/@teo/separation-of-concerns-of-frontend)

### IT 뉴스

* 미국 법무부는 2024년, ADA(미국 장애인 법)에 따라 웹 콘텐츠와 모바일 애플리케이션의 [접근성 규정을 발표](https://www.tpgi.com/the-ada-now-has-regulations-for-accessibility-of-web-content-and-mobile-apps/)했습니다. 이는 공공 기관이 운영하는 디지털 콘텐츠가 WCAG 2.1 레벨 AA 기준을 충족하도록 요구하며, 장애인을 위한 더 나은 디지털 접근성을 보장합니다. 민간 기업에도 간접적인 영향을 미칠 것으로 보입니다.
* 영국 정부가 인도양 차고스 제도(British Indian Ocean Territory)의 주권을 포기하며 [.io 도메인이 사라질 예정](https://every.to/p/the-disappearance-of-an-internet-domain)입니다. 새로운 등록이 중단되며, 기존 도메인 역시 점진적으로 폐기 프로세스가 시작됩니다. .io 도메인을 사용하는 많은 기업에 영향을 미칠 것으로 보입니다. 하지만 .su 도메인이 특수 사례로 살아남은 적이 있어 어떤 식으로 흘러갈지는 지켜봐야 할 것 같습니다.
* 올해 Sentry는 [페어 소스(Fair Source)](https://fair.io/)라는 새로운 소프트웨어 라이선스를 도입한다고 했습니다. 이는 오픈 소스와 유사하게 코드를 공개적으로 공유하지만, 제작자의 비즈니스 모델을 보호하기 위해 사용, 수정, 재배포에 제한을 두는 것이 특징입니다. 또한 지연된 오픈소스 퍼블리싱(DOSP) 방식으로 초기에는 독점 라이선스를 유지하다가 일정 계획에 따라 오픈소스화합니다.

*** ** * ** ***

막상 정리를 해보겠다고 마음먹고 주요 기술 스택과 뉴스를 간추리는 데 생각보다 시간이 오래 걸렸습니다. 내년에도 같은 작업을 이어간다면 반기로 나누어 진행해야 할 것 같습니다. 처음에는 2\~3개의 뉴스레터로 시작했지만, 욕심이 생겨 점점 범위를 넓히다 보니 지금은 UI/UX와 디자인까지 포함해 매주 약 19개의 뉴스레터를 훑고 있는 상황입니다. 😅

뉴스레터로 알게 된 내용을 실제로 제품에 적용해 볼 기회는 많지 않았지만, 프론트엔드 트렌드를 파악하고, 우리 팀과 조직에서 적용해 볼 만한 부분을 점검할 수 있었다는 점에서 개인적으로 만족스러웠습니다. 본 글에서 다루지 못했지만 JavaScript의 AI, Privacy 강화, WASM과 같은 주제에도 변화가 있었습니다. 관심 있는 분들은 관련 내용을 찾아보시는 것도 추천드립니다.

앞으로도 새롭게 등장할 기술들 속에서 각자의 서비스에 적합한 것을 선택하고 도입하며, 변화에 유연하게 대응해 나가길 바랍니다. 😊 (혹시라도 깨진 링크나 잘못된 내용이 있다면 제보 부탁드립니다. 🙇)

[![NHN Cloud_meetup banner_footer_blue_202412_900.png](https://images.gogumang.com/be70bbded4/02.png)](https://www.nhncloud.com/kr)