안녕하세요, FE플랫폼팀에서 FE 개발자를 위한 개발을 담당하는 Ethan입니다. 이 글에서는 운영 중인 서비스에서 사용하는 라이브러리의 버전을 업그레이드하는 과정에서, 기존에 사용하던 모듈 시스템인 [CommonJS](https://nodejs.org/api/esm.html#introduction)를 [ESM](https://nodejs.org/api/esm.html#introduction)으로 전환하게 된 이유와 ESM으로 전환하는 과정에 대해 설명드리고자 합니다.

## 1. ESM으로 전환하게 된 배경

FE플랫폼팀에서는 Google의 [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)를 활용하여 웹 서비스의 성능을 주기적으로 정적 분석하는 서비스 Pharus를 운영하고 있습니다.

Lighthouse는 Google에서 만든 정적 성능 분석 도구로, Chrome 환경에서 웹 서비스에 접속해 성능 정보를 수집하고 성능 리포트를 생성해 줍니다. 지속적으로 업데이트되는 라이브러리이며 올해 10 버전 및 11 버전이 출시되었습니다. 10 버전에서는 성능 점수 변화, Typescript 지원 및 ESM 전환과 같은 주요 변화가 포함되어 있습니다.

Pharus는 Lighthouse를 활용해 6시간 주기로 웹 서비스의 성능을 측정하고 개발자가 성능 변화의 추이를 쉽게 파악할 수 있도록 합니다. 또한, 성능을 측정하기 위해 웹 서비스에 접근할 때 필요한 인증 처리나 유저 에이전트 및 헤더 등의 설정을 지원하고 있습니다.

Pharus는 최신 버전의 Chrome에서 성능 측정을 지원하기 위해 Lighthouse의 버전 업데이트를 꾸준히 따라가고 있으며, Pharus에서 Lighthouse 신규 버전(10 버전)을 적용하는 것이 이번 작업의 목표였습니다.

### CommonJS에서 ESM으로 전환하게 된 이유

기존 Pharus는 CommonJS 환경에서 Lighthouse 9 버전 모듈을 로드하고 있었습니다. Lighthouse 10 버전은 모듈 시스템이 CommonJS에서 ESM으로 전환되었기 때문에 CommonJS의 **`require()`** 함수로는 ESM 시스템의 모듈을 불러올 수 없게 되었습니다. 이에 대응하여 Lighthouse 10 버전은 CommonJS 환경에서도 Lighthouse 10 버전을 불러올 수 있도록 아래의 2가지 방식을 제공하고 있습니다.

1. `await import(‘lighthouse’)`
2. `require(‘lighthouse/core/index.cjs’)`

하지만 위 두 방식을 적용하는 과정에서 `await import()`와 `require()` 함수 각각 많은 변경을 추가해야 하고 기능을 사용하는데 제약이 있었기 때문에, 10 버전의 Lighthouse를 기반으로 하는 Pharus가 모듈을 불러올 수 있도록 ESM으로 전환하게 되었습니다.

#### (1) 동적 import로 가져오기

Lighthouse 10 버전의 Pharus에서 동적 import를 통해 Lighthouse를 가져오는 방법으로 **`await import(‘lighthouse’)`** 구문을 사용할 수 있습니다. 하지만 구문을 사용하여 로직을 구현하는 과정에서 생기는 많은 변경점 때문에 결론적으로 사용하지 않게 된 방법이며, 그 과정에 대해 설명드리겠습니다.

Pharus는 Typescript로 작성되어 있으며 아래 옵션에 따라 CommonJS 환경에서 해석할 수 있는 모듈 구문으로 컴파일됩니다.

```
// tsconfig.json
{
  "compilerOption": {
    "module": "CommonJS"
  }
}
```

가장 먼저 `await import()`를 사용해 Lighthouse를 가져오도록 아래와 같이 코드를 변경했습니다.

```
// import lighthouse from ‘lighthouse’;
const lighthouse = await import('lighthouse');
```

하지만 `require()`가 ES Module을 가져올 수 없다는 에러가 발생했습니다.

**에러코드**

```
Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported.
```

해당 오류는 tsconfig에서 모듈(Module) 속성을 “CommonJS”로 설정한 경우 `await import()`를 `require()`로 변환하기 때문에 발생하는 것으로, 아래와 같이 “Node16”으로 다시금 변경해 주었습니다.

```
// tsconfig.json
{
  "compilerOption": {
    "module": "Node16"
  }
}
```

이를 다시 실행해 보면 **`await`** 구문을 **`async`** 함수 내에서 사용해야 한다는 에러가 발생합니다.

**에러코드**

```
const lighthouse = await import('lighthouse');
                   ^^^^^
SyntaxError: await is only valid in async functions and the top level bodies of modules
```

`await import()`를 통해 ESM인 Lighthouse 모듈을 불러올 수 있지만 CommonJS 환경에서는 **`await`** 구문을 **`async`** 함수 내에서만 사용할 수 있기 때문에 모듈을 불러오기 위해 여러 코드가 추가되어야 합니다. 이처럼 모듈을 가져오는 방식에 너무 많은 변경점이 추가되기 때문에 `await import()`는 사용하기 어려운 점이 많았습니다.

#### (2) cjs 파일 가져오기

Lighthouse 10 버전의 Pharus에서 `require()`를 통해 Lighthouse를 가져오는 방법으로 `require(‘lighthouse/core/index.cjs’)` 구문을 사용할 수 있습니다. 하지만 구문을 사용하여 로직을 구현하는 과정에서 발생한 기능상의 제약 때문에 결론적으로 사용하지 않게 된 방법이며, 그 과정에 대해 설명드리겠습니다.

ESM으로 전환된 Lighthouse는 기존 CommonJS 사용자들을 위해 [index.cjs](https://github.com/GoogleChrome/lighthouse/blob/main/core/index.cjs) 파일을 제공하고 있습니다. index.cjs는 Lighthouse의 진입점인 [index.js](https://github.com/GoogleChrome/lighthouse/blob/main/core/index.js)로부터 일부 모듈을 `await import()`로 가져온 뒤 `module.exports`를 사용해 내보내고 있습니다.

Pharus에서는 Lighthouse의 측정항목을 확장해 새로운 측정 환경을 정의해서 사용하고 있기 때문에 Gatherer와 Audit 클래스를 import 해서 사용해야 합니다. 하지만 index.cjs는 Gatherer와 Audit 클래스를 내보내지 않기 때문에 index.cjs를 가져오는 것만으로는 문제를 해결할 수 없었습니다.

이와 같이 CommonJS 환경에서는 기존에 사용하던 대로 Lighthouse의 기능을 사용할 수 없었기 때문에 Pharus를 ESM으로 전환하기로 결정하게 되었습니다.

## 2. CommonJS와 ESM의 주요 차이점

CommonJS와 ESM은 모듈 시스템 별로 모듈을 내보내고, 가져오는 문법이 상이합니다. 이때, 두 방식은 서로 호환되지 않기 때문에 각각 적절한 문법을 사용해야 합니다.

이제 본격적으로 Node.js가 어떤 모듈 시스템을 사용해서 파일을 구문분석할지 결정하는 방법부터 CommonJS와 ESM의 문법의 차이까지 살펴보도록 하겠습니다.

### 모듈 결정하기

Node.js가 Javascript 파일을 어떤 모듈 방식으로 구문분석할지 결정하는 방법입니다. 각 순서는 우선순위를 의미하며, 순서에 따라 조건이 맞는 경우 모듈 시스템이 결정됩니다. 보다 자세한 내용은 [Determining module system](https://nodejs.org/api/packages.html#determining-module-system) 문서에서 확인할 수 있습니다.

#### (1) 파일의 확장자 확인

* .cjs인 경우 CommonJS
* .mjs인 경우 ESM

#### (2) 가장 가까운 상위 package.json의 “type” 필드 확인

* "module"인 경우 ESM
* “commonJS” 또는 없는 경우 CommonJS

#### (3) Node.js --input-type 플래그 확인

* `--input-type=commonjs` 인 경우 CommonJS
* `--input-type=module` 인 경우 ESM

### 모듈 내보내기

#### CommonJS

* **`module.exports`** : 모듈을 내보낼 때 `module.exports`에 값을 담아서 전달합니다.

```
module.exports = 'module';
```

```
module.exports = {
  someNumber: 123,
  someMethod: () => {}
}
```

* exports: 하나의 파일에서 여러 개의 값을 내보낼 때 `module.exports`에 객체로 묶지 않고 **exports** 의 프로퍼티로 전달할 수 있습니다. `module.exports`와 같은 값을 참조하며 `exports`에 다른 값이 할당되면 `module.exports`에 대한 참조가 사라져서 내보내기를 할 수 없습니다.

```
exports.someNumber = 123;
exports.someMethod = () => {};
// 조건문에 의해 평가되지 않을 코드임에도 구문분석 단계에서 모듈이 내보내짐
if (false) {
  exports.falseModule = 'false';
}
// 구문분석 단계에서 모듈을 내보내기 때문에 exports를 변형하면 모듈이 내보내지지 않음
(function (e) {
  e.aliasModule = 'alias';
})(exports)
// 모듈이 내보내지지 않음
exports = 'abc';
// 모듈이 내보내지지 않음
exports = {
  something: 123
}
```

#### ESM

* export default: 특정 모듈 값 하나를 기본 내보내기로 내보낼 수 있습니다.

```
export default {
  something: 123
}
```

* export: 지정한 이름으로 값을 내보낼 수 있습니다.

```
export const namedVar = 'module';
```

* export from: 모듈을 불러와서 바로 내보낼 수 있습니다.

```
export otherModule from './otherModule.js';
```

### 모듈 가져오기

#### CommonJS

* **`require()`**: 모듈을 가져올 때 require 함수를 사용하며, 이 함수는 ESM 파일을 가져올 수 없습니다. ESM 파일을 가져오려고 한다면 ERR_REQUIRE_ESM 에러가 발생합니다. 또한, 파일 확장자를 작성하지 않아도 됩니다.

```
const module = require('./moduleFile');
```

* **`import()`**: ESM 모듈을 CommonJS에서 비동기적으로 불러오기 위한 표현식입니다. 반드시 파일 확장자를 지정해주어야 합니다.

```
import('./moduleFile.js').then(module => {
  ...
});
```

#### ESM

* Import 문: 모듈을 가져오기 위해 import 문을 사용합니다. 구문분석 단계에 모듈을 불러오기 때문에 값이 평가되지 않아 동적인 값을 사용할 수 없습니다. CommonJS와 ESM 모듈을 둘 다 불러올 수 있으며 반드시 파일 확장자를 지정해주어야 합니다.

```
import { functionName } from './moduleFile.js';
// 모든 named export를 가져옵니다. 
import * as allProperty from './moduleObject.js';
// 사용 불가
import {AorB_Module} from condition ? './A_module.js' : './B_module.js';
```

* **`import()`** 표현식: 동적으로 모듈을 불러오기 위해서는 import 표현식을 사용해야 합니다.

```
const module = await import('./moduleFile.js');
const aOrb_Module = await import(condition ? './A_module.js' : './B_module.js');
```

### ESM 환경에서 CommonJS 모듈 사용하기

아직까지 Pharus의 많은 라이브러리들은 CommonJS로 제공되고 있습니다. 이제 서비스를 ESM으로 전환했을 때 CommonJS 모듈을 어떻게 가져와야 하는지 살펴보겠습니다. 먼저 아래와 같이 CommonJS의 `require()`와는 다르게 ESM의 import 문 또는 import 표현식으로 CommonJS 모듈을 가져올 수 있습니다.

```
// module.exports 로 내보내진 모듈은 default 속성에 담겨서 내보내집니다.
import { default as cjsModule } from 'cjs';
// 편의성을 위해 ESM 에서 사용하는 방식대로 { default as cjs }를 사용하지 않고 가져올 수 있습니다.
import cjsSugar from 'cjs';
// cjsModule와 cjsSugar는 동일한 값을 가집니다.
// 
import * as module from 'cjs';
const m = await import('cjs');
// module과 m은 동일한 값을 가집니다.
// [Module] { default:  }
// module.default는 cjsModule과 동일한 값을 가집니다.
```

CommonJS에서도 exports를 사용하여 한 파일에서 특정 이름을 부여해 여러 모듈을 내보낼 수 있습니다. 이는 [cjs-module-lexer](https://github.com/nodejs/cjs-module-lexer/tree/main#named-exports-parsing)가 Node.js에 통합되어 구현되었기 때문으로, 이를 통해 ESM에서 CommonJS의 모듈을 개별로 가져올 수 있습니다. 이 방식은 구문분석 단계에서 모듈을 가져오기 때문에 값의 평가와 무관하게 동작할 수 있습니다.

서로 사용하는 문법이 다르기 때문에 CommonJS에서는 `import/export` 문을 사용할 수 없고 ESM에서는 `require/module.exports`를 사용할 수 없기 때문에 적절한 문법을 사용해서 각 모듈을 내보내고 가져와야 합니다.

## 3. ESM 환경으로 모듈 방식 설정하기

서비스의 환경을 ESM 시스템으로 설정해 보겠습니다.

### 모듈 방식 설정

서비스의 환경을 ESM 시스템으로 전환하기 위해서 모든 파일의 확장자를 mjs로 변경하거나 아래와 같이 package.json에서 type 프로퍼티를 “module”로 변경합니다.

```
// package.json
{
  "type": "module"
}
```

### Typescript를 위한 설정

Typescript로 작성하면 어떤 모듈 방식의 문법으로 작성하더라도 특정 모듈 방식의 문법으로 변환해 줍니다. 모듈 가져오기/내보내기 구문을 어떤 모듈 시스템의 문법으로 컴파일할지 결정하기 위해 모듈(Module) 속성을 지원하며, 기본값은 "CommonJS"입니다. Typescript가 컴파일했을 때 ESM의 import 문과 export 문으로 빌드될 수 있도록 컴파일 옵션을 설정합니다.
> **참고**
>
> ES2015, ES6, ES2020, ES2022, ESNext 값을 사용 시 ESM 문법으로 컴파일됩니다.

```
// tsconfig.json
{
  "compileOption": {
    "module": "ES2020"
  }
}
```

## 4. ESM 동작 원리 살펴보기

Pharus를 CommonJS 환경에서 ESM으로 전환하는 과정에서 2가지 이슈를 경험했습니다. 이슈들의 해결 과정을 살펴보기 전에 먼저 ESM의 동작 방식에 대해 알아보겠습니다. 보다 자세한 내용은 [ES modules: A cartoon deep-dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/) 문서에서 확인할 수 있습니다.

### ESM 동작의 전반적 흐름

ESM은 구성, 인스턴스화 그리고 평가의 3단계로 나누어 동작을 수행합니다. 모듈 리소스(파일)를 가져오고 구문분석 후에 각 변수나 함수에 대한 메모리 주소를 설정한 뒤 마지막으로 코드를 실행하며 값을 채워나가게 됩니다.

![](https://images.gogumang.com/4fb42d8aca/01.png)

출처: <https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/>

각 동작의 세부적인 절차는 아래와 같습니다.

1. **구성:** 모듈 리소스를 가져오고 구문분석을 수행합니다.
2. **인스턴스화:** 각 모듈이 가져오고 내보내는 변수의 메모리 주소를 할당 및 공유합니다.
3. **평가:** 코드를 실행하면서 메모리에 값을 채워나갑니다.

모든 모듈을 순회하면서 각 단계를 동기적으로 수행하는 CommonJS와 달리 ESM은 비동기적으로 각 단계를 수행하기 때문에 모듈 하나가 async 함수와 같이 모듈 최상위 레벨에서 await 구문을 사용할 수 있는 [top level await](https://v8.dev/features/top-level-await)이 가능해지고, 결과적으로 전체 파일 로드에 대한 성능을 향상할 수 있습니다.

#### (1) 구성

ESM의 구성 동작의 세부적인 과정은 아래와 같습니다.

![](https://images.gogumang.com/4fb42d8aca/02.png)

출처: <https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/>

1. 모듈이 포함된 파일을 어디서 가져올지 확인합니다.
   * 구문분석한 결과에서 import 문에 작성된 모듈 지정자를 보고 Loader가 [module resolution 규칙](https://nodejs.org/api/esm.html#resolution-and-loading-algorithm)에 따라 파일 경로를 결정합니다(최초에는 진입점 파일을 확인합니다).
2. 파일을 가져옵니다.
   * 파일을 가져오기 전에 모듈 맵을 확인해서 중복해서 파일을 가져오지 않도록 합니다.
   * Loader가 파일을 가져옵니다. Loader는 플랫폼에 따라 서로 다른 Loader를 사용할 수 있습니다. 예를 들면 브라우저는 HTML 스펙에 따라 HTTP 통신을 통해 파일을 가져오고, Node.js는 파일 시스템을 사용해 파일을 가져옵니다. Node.js는 Loader를 사용자 정의해서 추가할 수 있는 기능을 제공합니다.
3. 파일을 모듈 레코드로 구문분석합니다.
   * 파일 자체는 브라우저나 Node.js가 읽을 수 없기 때문에 AST(Abstract Syntax Tree)가 포함된 모듈 레코드로 파싱합니다.
   * 파일의 구문분석이 완료되면 연결된 모든 파일을 가져올 때까지 다시 1번부터 반복 수행합니다.

파일을 가져오고 구문분석하고 가져올 모듈의 파일 위치를 확인하고 다시 파일을 가져오는 행위를 반복하며 트리 구조의 모듈 레코드를 만들어갑니다.

#### (2) 인스턴스화

ESM의 인스턴스화 동작의 세부적인 과정은 아래와 같습니다.

![](https://images.gogumang.com/4fb42d8aca/03.png)

출처: <https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/>

Javascript 엔진은 모듈 레코드 별로 모듈 환경 레코드를 구성합니다. 모듈 환경 레코드는 모듈 레코드의 변수를 관리하고 각 변수의 메모리를 할당 및 추적합니다. 모듈 레코드 트리에 [깊이 우선 탐색](https://ko.wikipedia.org/wiki/%EA%B9%8A%EC%9D%B4_%EC%9A%B0%EC%84%A0_%ED%83%90%EC%83%89)을 통해 다른 모듈에 의존성이 없이 export만 하는 모듈부터 모듈 레코드에 메모리 주소를 할당합니다.

![](https://images.gogumang.com/4fb42d8aca/04.png)

출처: <https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/>

이때, import 하는 모듈은 가져올 변수가 어떤 메모리 주소를 갖는지 공유하게 됩니다.
> **참고**
>
>
> CommonJS는 각 모듈 값을 복제하지만 ESM은 메모리를 공유해서 사용합니다.

![](https://images.gogumang.com/4fb42d8aca/05.png)

출처: <https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/>

이처럼 ESM은 메모리를 공유하기 때문에, 사이드 이펙트를 방지하기 위해 import 하는 파일 상에서는 가져온 모듈에 값을 할당할 수 없습니다.

인스턴스화 과정이 끝나면 import/export 하게 된 모든 변수나 함수에 대한 메모리 위치가 연결됩니다.

#### (3) 평가

실제 메모리에 값을 채우기 위해 JS엔진이 최상단부터 코드를 실행합니다. 혹시나 발생할 수 있는 사이드 이펙트를 방지하기 위해 모듈은 한 번만 평가합니다. 예를 들어 모듈에서 서버를 호출하는 경우, 평가 횟수에 따라 결과가 달라질 수 있습니다. 평가 과정을 거치며 하나의 모듈이 하나의 모듈 레코드를 갖도록 하는 모듈 맵을 구성해서 각 모듈이 한 번만 평가될 수 있도록 합니다.

### Node.js Loader

모듈 시스템은 브라우저나 Node.js가 동일한 스펙을 갖고 적용하게 됩니다. 그러나 모듈 파일을 실제로 가져오는 Loader는 플랫폼 별로 서로 다른 각자의 스펙을 갖고 구현되었습니다. 브라우저에서는 http 통신을 사용한 파일 로드, Node.js에서는 파일시스템을 통한 로드를 하게 됩니다.

Node.js는 Loader의 동작을 사용자 정의하고 여러 개의 Loader를 사용할 수 있도록 [Loaders API](https://nodejs.org/docs/latest-v16.x/api/esm.html#loaders)를 제공합니다. 기존 CommonJS 모듈 시스템의 **`--require`** 플래그와 같이 **`--loader`** 플래그를 통해 스크립트를 제공할 수 있습니다. **`--loader`** 플래그를 통해 제공할 스크립트에는 resolve, load 및 initialize와 같은 함수를 export 해야 합니다. 아직까지는 실험적 기능으로 훅(Hook) 함수에는 변경이 발생할 수 있습니다.
> **참고**
>
>
> 2023.09.18 기준: [Module - Customization Hooks](https://nodejs.org/api/module.html#customization-hooks)로 변경되었습니다.

#### Resolve 훅

모듈 지정자(Module specifier) 문자열을 입력받아서 로드 가능한 URL 형태로 변환 후 반환합니다.

**명세**

```
resolve(specifier, context, nextResolve)
```

**파라미터**

* specifier: 모듈 지정자 문자열(예: import foo from ‘fooModule’ 일 때 ‘fooModule’’)
* context
  * conditions: 관련된 package.json의 내보내기 조건
  * parentURL: 현재 파일을 불러온 곳. 진입점인 경우 undefined
* nextResolve: 다음 resolve 훅 호출 또는 Node.js Loader의 기본 resolve 호출

**반환**

* format: load 시 구문분석에 사용할 포맷에 대한 힌트
* shortCircuit: 마지막 resolve인 경우 true, 기본값 false
* url: load 시 실제로 사용하게 될 절대 경로 URL

#### load 훅(구 getFormat, getSource, transformSource)

로드가 가능한 URL을 입력받아서 파일을 로드해서 소스코드를 반환하고 어떤 포맷으로 구문분석할지 결정합니다.

**명세**

```
load(url, context, nextLoad)
```

**파라미터**

* url: resolve를 끝낸 최종 URL
* context
  * conditions: 관련된 package.json의 내보내기 조건
  * format: resolve로부터 받는 format 힌트
* nextLoad: 다음 load 훅 호출 또는 Node.js Loader의 기본 load 호출

**반환**

* format: 구문분석 방식
  * commonjs
  * module
  * builtin
  * json
  * wasm
* shortCircuit: 마지막 Load인 경우 true, 기본값 false
* source: Node.js가 구문분석할 source

#### initialize 훅(구 globalPreload)

Node.js는 **`--`\*\*\*\*`loader`** 플래그로 제공된 스크립트를 애플리케이션이 시작되기 전에 등록하는 과정을 거치게 됩니다. **`--`\*\*\*\*`loader`** 플래그 외에도 node:module의 register 함수를 사용해서 직접 코드를 작성할 수 있습니다. register 함수가 동작할 때 한 번 수행되는 훅으로 애플리케이션이 시작되기 전에 필요한 코드나 리소스를 미리 로드하는 데 사용됩니다.

**명세**

```
initialize(data)
```

**파라미터**

* data: register 함수로부터 data를 전달받을 수 있습니다.
  * 로더와 애플리케이션은 서로 다른 스레드에서 동작하기 때문에 서로 통신을 위해서는 postMessage를 사용하기 위한 포트(Port)를 전달할 수 있습니다.
  * register 함수의 명세
  * register(loader, import.meta.url, { data })

**반환**

* register 함수에게 전달할 값으로 undefined 또는 postMessage를 통해 전달할 값의 형태가 가능합니다.

## 5. 이슈 해결(1) ts-node의 path-alias 문제 해결하기

Pharus 전환 과정에서 ESM 설정을 마치고 기존과 동일하게 스크립트를 실행했을 때, 아래와 같이 Cannot find package 에러를 마주하게 되었습니다. 이때 에러가 발생한 package는 tsconfig를 통해 path-alias를 지정한 파일이었습니다.

**실행 스크립트**

```
ts-node -r tsconfig-paths/register ./src/index.ts
```

**에러 코드**

```
/node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js:757
  throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base));
        ^
CustomError: Cannot find package '@application/***'
```

ts-node는 어떻게 동작하는지, 왜 path-alias를 지정한 파일을 찾을 수 없다고 하는지 문제를 해결하기 위해 하나씩 살펴보겠습니다.

### ts-node란?

ts-node는 Node.js가 파일을 로드할 때 중간에서 Typescript로 작성된 소스코드를 로드한 뒤 Javascript로 컴파일 후 Javascript 소스코드를 반환하는 역할을 합니다. CommonJS에서는 Module 객체를 조작해서 require 함수의 동작을 변경하지만 ESM에서는 Loaders API를 활용해 load 훅을 사용하고 있습니다.

#### ts-node/esm의 동작 원리

ts-node/esm이 export 하는 load 훅의 간단한 수도코드([링크](https://github.com/TypeStrong/ts-node/blob/main/src/esm.ts#L203))입니다.

```
export async function load (url, context, defaultLoad) {
  // 구문분석 format 결정하기
  const format = context.format ?? (await getFormat(url, context)).format;
  // typescript로 작성된 소스코드 가져오기
  const {source: rawSource} = await defaultLoad(url, {...context, format}, defaultLoad);
  // typescript 코드를 javascript로 변환하기
  const {source} = await transformSource(rawSource, {url, format});
  // javascript로 컴파일된 소스코드 반환하기
  return {format, source};
}
```

load 훅의 동작 순서는 아래와 같습니다.

1. 가져올 파일의 구문분석 형식을 결정합니다.
2. Typescript로 작성된 소스코드를 가져옵니다.
3. Typescript로 작성된 소스코드를 Javascript로 변환합니다.
4. 구문분석 형식과 Javascript 소스코드를 반환합니다.

### ESM 환경에서 ts-node 사용하기

ESM 환경에서 ts-node를 사용하기 위해서 여러 가지 방식을 활용할 수 있습니다. 보다 자세한 내용은 [ts-node 공식문서](https://typestrong.org/ts-node/docs/imports#native-ecmascript-modules)에서 확인할 수 있으며, 이 글에서는 2가지 방법을 소개드리겠습니다.

```
# 1. tsconfig.json에  "ESM": true 프로퍼티 추가
ts-node ./src/index.ts
# 2. Node.js의 --loader 플래그 직접 호출
node --loader ts-node/ESM ./src/index.ts
```

1번 방식 적용 시 tsconfig 설정

```
// tsconfig.json
{
  "compileOption": {
    "module": "es2020"
  },
  "ts-node": {
    "ESM": true
  }
}
```

### tsconfig의 path-alias 문제 해결하기

tsconfig의 path-alias를 사용하는 경우 별도의 처리를 통해 path-alias를 실제 파일 경로로 변환해주어야 합니다. 빌드 시에는 주로 tsc-alias 라이브러리를 사용하고 ts-node 사용 시에는 주로 tsconfig-paths 라이브러리를 사용합니다.

CommonJS 모듈 시스템에서 ts-node를 사용할 때는 Node.js의 **`-r(--require)`** 플래그를 통해 모듈 지정자 해석을 사용자 정의할 수 있습니다.

```
npx ts-node -r tsconfig-paths/register ./src/index.ts
```

ESM 모듈 시스템에서는 Node.js의 **`-`****`r(--`**** `require)`** 플래그를 사용할 수 없고, 대신 **`--loader`** 플래그를 사용해야 합니다. **`--loader`** 플래그의 정해진 API 규칙에 따라 resolve 훅을 작성해서 tsconfig의 path-alias 문제를 해결할 수 있습니다.

### loader 훅을 사용해서 path-alias를 resolve하기

tsconfig-paths 라이브러리는 CommonJS에서 사용 가능하도록 `-r(--require)` 플래그에 맞춰 설계되었습니다. ESM 환경에서 사용하기 위해서는 Loaders API 명세에 따라 Loader 훅 함수를 작성해주어야 합니다.

따라서 아래와 같이 ts-node/esm에 작성된 loader 훅을 이용해서 새로운 훅을 작성했습니다. tsconfig-paths 라이브러리를 통해 tsconfig.json 파일을 읽고 path 프로퍼티의 값을 절대경로로 변환해 주는 로직입니다.

```
// loader.js
import {resolve as resolveTs} from 'ts-node/esm';
import * as tsConfigPaths from 'tsconfig-paths';
import {pathToFileURL} from 'url';
const {absoluteBaseUrl, paths} = tsConfigPaths.loadConfig();
const matchPath = tsConfigPaths.createMatchPath(absoluteBaseUrl, paths);
export function resolve (specifier, ctx, defaultResolve) {
  const match = matchPath(specifier);
  if (match) {
    return resolveTs(pathToFileURL(`${match}`).href, ctx, defaultResolve);
  }
  return resolveTs(specifier, ctx, defaultResolve);
}
export {load} from 'ts-node/esm';
```

작성한 스크립트를 `--loader` 플래그에 적용해서 Node.js를 실행하면 됩니다.

```
node --loader ./loader.js ./src/index.ts
```

## 6. 이슈 해결(2) CommonJS 파일을 ESM 문법으로 컴파일하는 문제 해결하기

Pharus는 서비스를 구성하는 다양한 패키지를 [모노레포](https://monorepo.tools/#understanding-monorepos)로 관리하고 있습니다. 여러 패키지에서 공통으로 사용되는 모듈은 share 패키지에 모아서 구성하고 있습니다. 전부 공통된 Typescript 설정을 사용하며 ts-node로 구동되기 때문에 share 패키지는 별도의 빌드과정을 거치지 않고 각 패키지마다 직접 Typescript 파일을 접근해서 모듈을 가져오고 있습니다. Pharus에서 Lighthouse를 사용하는 모듈은 runner 패키지밖에 없기 때문에 변경점을 최소화하기 위해 runner 패키지만 ESM 변환 작업을 진행했습니다.

![](https://images.gogumang.com/4fb42d8aca/06.png)

위와 같이 runner 패키지가 ESM으로 전환되면서 ESM 방식으로 컴파일하는 별도의 tsconfig를 갖게 되었습니다.

![](https://images.gogumang.com/4fb42d8aca/07.png)

runner 패키지는 CommonJS인 share 패키지를 가져와서 ESM 문법으로 컴파일하는 상황이 되었습니다. CommonJS 파일에서 ESM의 문법을 사용하면서 Syntax Error가 발생하게 되었습니다. 이를 어떻게 해결했는지 3가지 방법으로 살펴보도록 하겠습니다.

### CommonJS와 ESM을 함께 지원하는 라이브러리 만들기

share 패키지는 다양한 패키지들에서 사용 중이고 runner 패키지만 ESM으로 전환했을 뿐 나머지 패키지는 아직 여전히 CommonJS인 상황이기 때문에 share 패키지는 CommonJS와 ESM 시스템을 모두 지원해야 합니다.

share 패키지를 사용하는 패키지가 share 패키지의 컴파일을 담당하고 있는데, 이 의존성을 제거하고 share 패키지에서 컴파일을 해서 여러 모듈 시스템을 지원해야 합니다.

![](https://images.gogumang.com/4fb42d8aca/08.png)

#### (1) 진입점 파일 만들기

share 패키지는 별도 진입점 없이 각 패키지에서 필요한 모듈 파일을 직접 로드해서 사용하고 있습니다. 하나의 진입점 파일을 통해 로드할 수 있도록 진입점을 생성해 줍니다.

#### (2) Javascript로 컴파일하기

Typescript는 한 가지 모듈 방식으로만 컴파일이 가능합니다. 아래와 같이 각 모듈 방식에 따라 컴파일을 해주어야 합니다.

**CommonJS**

```
npx tsc --module CommonJS --outDir cjs/
```

**ESM**

```
npx tsc --module es2020 --outDir esm/
```

#### (3) package.json의 exports 필드를 통해 모듈별 entry 파일 지정

package.json의 exports 필드를 통해 진입점 파일을 설정할 수 있습니다. exports 필드를 사용하면 subpath를 적용하거나 모듈 시스템 별 export 할 파일을 개별 적용할 수 있습니다.

```
// package.json
{
  "exports": {
    ".": {
      "require": "cjs/index.js",
      "import": "esm/index.js"
    }
  }
}
```

이제 각 패키지에서는 진입점을 통해 모듈별 파일을 가져올 수 있습니다. 보다 자세한 내용은 [Supporting CommonJS and ESM with Typescript and Node](https://evertpot.com/universal-commonjs-esm-typescript-packages/) 문서에서 확인할 수 있습니다.

### 복잡한 과정 없이 ESM으로 구성된 share 패키지를 구성하기

![](https://images.gogumang.com/4fb42d8aca/09.png)

1번 방식을 진행하기 위해서는 먼저 share 패키지 내의 모든 파일에 대해 진입점을 만들고 index 파일을 생성해주어야 합니다.

이때 share 패키지에 큰 변경점 없이 기존 share 패키지를 복제해서 share-ESM 패키지를 생성하고 package.json에 **`type: module`** 속성을 부여하면 ESM을 지원하는 share 패키지를 쉽게 생성할 수 있습니다.

마지막으로 runner 패키지에서는 share-ESM에서 파일을 가져오도록 하면 문제없이 동작하게 됩니다. 다만 공통된 모듈을 하나의 소스로 관리하기 위해 만들어진 share 패키지를 두 벌로 나누게 되면 share에 변경이 생길 때마다 두 번씩 작업해야 하는 문제가 발생하게 됩니다.

### runner 패키지에서 생긴 일은 runner 패키지가 책임지기

![](https://images.gogumang.com/4fb42d8aca/10.png)

전체 패키지를 ESM으로 전환하는 작업이 아니고, runner 패키지만 ESM으로 전환하다가 발생한 문제였기 때문에, 해결 과정에서 너무 큰 변경점을 만들고 싶지 않았습니다. runner 패키지에서는 이미 Node.js의 Loaders API를 사용하고 있기 때문에, 보다 변경점이 줄어들 수 있도록 loader 훅을 사용해서 해결해 보기로 했습니다.

loader 훅은 소스코드를 구문분석할 때 어떤 모듈 방식으로 구문분석할지 결정하고 반환합니다. share 패키지로부터 가져오는 파일은 ESM 모듈 방식으로 파일을 로드하도록 분기처리를 진행했습니다.

```
// loader.js
import {load as loadTs} from 'ts-node/esm';
export function load (url, ctx, defaultLoad) {
  if (//packages/share/src/.test(url)) {
    return loadTs(url, {...ctx, format: 'module'}, defaultLoad);
  }
  return loadTs(url, ctx, defaultLoad);
}
```

share 모듈 중에는 파일로 작성된 config값을 가져오는 모듈이 있습니다. `__dirname`을 사용해서 config값이 작성된 파일의 경로를 얻어내는데 `__dirname`은 CommonJS에서만 사용이 가능한 값이기 때문에 ESM에서 사용하기 위해서는 다른 방법을 사용해야 합니다.

```
// config.ts
import path from 'path';
import {YamlReader} from '@infra/yaml/yamlReader';
enum Stage {
  prod = 'production',
  dev = 'development',
  local = 'local'
}
export async function getConfig () {
    const stage = process.env.NODE_ENV as Stage || Stage.dev;
    const yamlPath = path.join(__dirname, `./config/${stage}.yaml`);
    const yaml = await yamlReader.read(yamlPath);
  return yaml;
}
```

해당 파일은 모듈별로 다른 코드를 갖기 때문에 ESM을 위한 .mjs 확장자를 가진 파일을 별도로 추가해 주었습니다. Typescript의 경우 mts 확장자를 지원하기 때문에 mts 확장자를 사용합니다.

#### import.meta

ESM 환경에서 현재 모듈 파일의 경로를 얻기 위해서는 **`__dirname`** 대신 `import.meta.url`을 사용해야 합니다. `import.meta.url`은 **`file: URL`** 형식으로 경로를 제공하기 때문에 파일의 절대 경로를 얻기 위해서는 url 모듈의 **`fileURLToPath`** 함수를 사용해야 합니다.

```
// config.mts
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {YamlReader} from '@infra/yaml/yamlReader';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
enum Stage {
  prod = 'production',
  dev = 'development',
  local = 'local'
}
export async function getConfig () {
    const stage = process.env.NODE_ENV as Stage || Stage.dev;
    const yamlPath = path.join(__dirname, `./config/${stage}.yaml`);
    const yaml = await yamlReader.read(yamlPath);
  return yaml;
}
```

이제 loader.js에서 config 파일은 mts 파일을 읽도록 변경합니다.

```
// loader.js
import {load as loadTs} from 'ts-node/esm';
export function load (url, ctx, defaultLoad) {
  if (//packages/share/src/.test(url)) {
    if (/config.ts/.test(url)) {
      return loadTs(`${url.replace('.ts', '.mts')}`, {...ctx, format: 'module'}, defaultLoad);
    }
    return loadTs(url, {...ctx, format: 'module'}, defaultLoad);
  }
  return loadTs(url, ctx, defaultLoad);
}
```

이렇게 2가지 이슈를 Loaders API를 사용해서 해결해 보았습니다.

첫 번째는 path-alias를 해결하기 위해서 resolve 훅에 tsconfig-paths 라이브러리를 사용해 path-alias가 적용된 경로를 절대경로로 변환해 주었습니다.

두 번째는 CommonJS로 구성된 파일을 ESM으로 컴파일하는 문제를 해결하기 위해 해당 파일을 읽을 때 ESM 방식으로 구문분석 하도록 loader 훅을 작성했습니다.

```
// loader.js
import {resolve as resolveTs, load as loadTs} from 'ts-node/esm';
import * as tsConfigPaths from 'tsconfig-paths';
import {pathToFileURL} from 'url';
const {absoluteBaseUrl, paths} = tsConfigPaths.loadConfig();
const matchPath = tsConfigPaths.createMatchPath(absoluteBaseUrl, paths);
export function resolve (specifier, ctx, defaultResolve) {
  const match = matchPath(specifier);
  if (match) {
    return resolveTs(pathToFileURL(`${match}`).href, ctx, defaultResolve);
  }
  return resolveTs(specifier, ctx, defaultResolve);
}
export function load (url, ctx, defaultLoad) {
  if (/pharus/packages/share/src/.test(url)) {
    if (/config.ts/.test(url)) {
      return loadTs(`${url.replace('.ts', '.mts')}`, {...ctx, format: 'module'}, defaultLoad);
    }
    return loadTs(url, {...ctx, format: 'module'}, defaultLoad);
  }
  return loadTs(url, ctx, defaultLoad);
}
```

위 loader.js 파일을 `--loader`플래그에 적용해서 새롭게 정의한 Loader가 동작하도록 합니다.

```
node --loader ./loader.js ./src/index.ts
```

## 7. 마무리

지금까지 ESM 라이브러리를 사용하기 위해 CommonJS 환경에서 운영하던 서비스를 ESM 환경으로 전환하는 과정을 살펴보았습니다. Typescript를 사용하지 않거나 CommonJS의 require 함수를 조작하는 ts-node나 jest와 같은 라이브러리를 사용하지 않는다면, 손쉽게 ESM 환경으로 마이그레이션 할 수 있습니다. 하지만 Typescript를 사용한다면 ESM 문법으로 컴파일하는 과정이 포함되어야 하고, ts-node나 jest를 사용한다면 Loaders API를 사용하는 버전을 사용해야 합니다.

여러 이슈들을 경험하면서 이번 기회에 ESM의 동작 방식에 대해 깊이 이해할 수 있었습니다. Javascript의 생태계가 빠르게 변화하면서 점점 ESM을 지원하는 라이브러리가 많아지고 있는데, 독자 분들의 서비스가 이러한 변화에 맞춰 ESM으로 전환해야 할 때 이 글이 도움 되었으면 좋겠습니다.

감사합니다.

## 8. 참고 문서

* <https://nodejs.org/api/packages.html#determining-module-system>
* <https://github.com/nodejs/cjs-module-lexer/tree/main#named-exports-parsing>
* <https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/>
* <https://nodejs.org/api/esm.html#resolution-and-loading-algorithm>
* <https://nodejs.org/api/esm.html#loaders>
* <https://typestrong.org/ts-node/docs/imports#native-ecmascript-modules>
* <https://evertpot.com/universal-commonjs-esm-typescript-packages/>

*written by* **Ethan.eunwu**

*edited by* **June.6**