타입스크립트 4.0 beta 버전이 릴리즈되었다. 어떤 기능이 새롭게 지원되고, Breaking Change에는 어떤 사항들이 있는지 알아보자.

## 설치

```sh
npm install typescript@beta
```

## 목차

* 가변 인자 튜플 타입
* 이름을 붙일 수 있는 튜플 요소
* 클래스 생성자로부터 속성 타입 추론
* 단락(*Short-Circuiting*) 할당 연산자
* `catch`절의 매개변수 타입 지정
* JSX 팩토리 사용자 정의
* `--noEmitOnError`옵션을 사용하는 빌드 모드에서 속도 개선
* `--incremental`과 `--noEmit` 옵션 함께 사용 가능
* 에디터 개선 (Visual Studio Code)
  * `/** @deprecated */` JSDoc 주석 지원
  * 시작 시 부분 편집 모드 지원
  * 더 똑똑해진 자동 가져오기 기능
* Breaking Changes

## 가변 인자(*variadic*) 튜플 타입

> *variadic* : 프로그래밍 언어에서 함수가 고정되지 않은 개수의 인자(*argument*)를 받을 때 붙이는 이름

* 1) **제네릭 타입을 확장(*spread*) 연산자와 사용할 수 있다.**

```java
function tail<T extends any[]>(arr: readonly [any, ...T]) {
    const [_ignored, ...rest] = arr;
    return rest;
}

const myTuple = [1, 2, 3, 4] as const;
const myArray = ["hello", "world"];

// r1: [2, 3, 4]
const r1 = tail(myTuple);

// r2: [2, 3, ...string[]]
const r2 = tail([...myTuple, ...myArray] as const);
```

* 2) **튜플 타입을 확장 연산자를 사용하여 타입 정의 할 수 있다.** 4.0 이전에는 튜플 타입으로 정의된 타입을 확장 연산자를 사용하여 새로운 타입을 지정하려고 시도하면 오류였다. 배열 타입만 확장 연산자를 사용하여 새로운 타입을 만들수 있었는데, 4.0에서는 이미 선언된 튜플 타입으로 확장 연산자를 사용하여 새로운 타입을 만들 수 있다.

```ts
/* 4.0 이전 */
type Strings = [string, string];
type Numbers = [number, number];

type NumNum = [...Numbers];
//             ~~~~~~~~~~
// 오류! A rest element type must be an array type.

type StrStrNumNum = [...Strings, ...Numbers];
//                   ~~~~~~~~~~
// 오류! A rest element must be last in a tuple type.

type NumArr = number[];
type Nums = [...NumArr]; // OK
```

```ts
/* 4.0 */
type Strings = [string, string];
type Numbers = [number, number];

// [string, string, number, number]
type StrStrNumNum = [...Strings, ...Numbers]; 
```

* 배열의 어느 위치에서든지 스프레드 연산자를 사용하여 확장 가능한데, 길이가 정해지지 않는 배열 타입이 확장되면 나머지 요소 타입을 포함하여 연속적인 배열 타입을 가지게 된다.

```ts
type Strings = [string, string];
type Numbers = number[]

// [string, string, ...(number | boolean)[]]
type Unbounded = [...Strings, ...Numbers, boolean];
```

* 1)과 2)을 활용하여 활용하여 `concat` 함수의 시그니쳐 타입을 정의할 수 있다.

```java
type Arr = readonly any[];

function concat<T extends Arr, U extends Arr>(arr1: T, arr2: U): [...T, ...U] {
    return [...arr1, ...arr2];
}

type NumNumNum = [number, number, number];
type StrStrStr = [string, string, string];

const numArr: NumNumNum = [1, 2, 3];
const strArr: StrStrStr = ['NHN', 'FE', 'TOAST UI'];

// [number, number, number, string, string, string]
const test = concat(numArr, strArr);

test[0] = 'I\'m string';
// 4.0에서는 튜플 타입 정의로 0인덱스가 string 타입이 아니라 number 타입이어야 하므로 오류!
```

* 다른 예시를 들면, 함수의 매개변수를 부분적으로 적용하여 새로운 함수를 반환하는 `partialCall`함수가 있다고 가정하자.

```java
function partialCall(f, ...headArgs) {
    return (...tailArgs) => f(...headArgs, ...tailArgs)
}

// 4.0에서 튜플 타입과 확장 연산자를 사용하여 타입 정의
type Arr = readonly unknown[];

function partialCall<T extends Arr, U extends Arr, R>(f: (...args: [...T, ...U]) => R, ...headArgs: T) {
    return (...b: U) => f(...headArgs, ...b)
}
```

4.0에서 튜플 타입의 확장 연산자를 활용하면, `partialCall`과 같은 복잡한 함수의 매개변수의 타입 추론이 좀 더 정확해 졌다.

```ts
const foo = (x: string, y: number, z: boolean) => {}

// x의 타입의 number가 아니라 string이므로 오류!
const f1 = partialCall(foo, 100);
//                          ~~~

// 함수 foo가 받을 수 있는 매개변수의 갯수가 다르므로 오류!
const f2 = partialCall(foo, "hello", 100, true, "oops")
//                                              ~~~~~~

const f3 = partialCall(foo, "hello"); // 정상 동작 'f3: (y: number, z: boolean) => void'

f3(123, true); // 정상 동작!

f3(); // 전달받아야 하는 매개변수가 2개이므로 오류 발생!

// 두번째 매개변수 타입은 boolean인데 string 타입을 넘겨주므로 오류!
f3(123, "hello");
//      ~~~~~~~
```

* `concat`, `tail`, `partialCall` 과 같이 가변 인자를 받는 함수에서 튜플 타입을 사용하여 많은 패턴에서 활용될 수 있다.
* 자바스크립트에 내장된(*built-in* ) `bind`메소드와 사용할 때 타입 검사를 더 잘할 수 있을 것이다.

## 이름을 붙일 수 있는 튜플 요소

* 함수의 매개변수를 튜플타입으로 선언해서 사용하면, 타입 검사에 영향을 미치지 않지만 가독성 측면에서 매개변수의 의도를 파악하기 어렵다.

```js
  function foo1(...args: [string, number]): void {
    // ...
  }

  function foo2(arg0: string, arg1: number): void {
    // ...
  }
```

* **튜플에 이름을 붙여줄 수 있다.**

```ts
type Range = [start: number, end: number];
type Foo = [first: number, second?: string, ...rest: any[]];

type Bar = [first: string, number];
//                         ~~~~~~
// 오류! Tuple members must all have names or all not have names.
// (튜플 타입 지정 시 모두 라벨로 이름을 지정하든지, 모두 라벨 이름을 사용하지 안하든지 해야함)
```

```ts
// 사용 예시
function foo3(x: [first: string, second: number]) {
  // ...
  let [a, b] = x;
}
```

* 튜플과 매개변수 목록을 사용하는 패턴에서 *type-safe*하는 방법으로 사용할 수 있다.

> type-safe : 데이터 타입의 다른 타입으로 잘못 취급될 수 있는 언어에서 나타날 수 있는 오류의 영향을 받지 않음

## 클래스 생성자로부터 속성 타입 추론

* 4.0에서는 `noImplicitAny`옵션을 활성화시켰을 때, 클래스의 속성 타입을 결정하기 위해 제어 흐름 분석(CFA: *control flow analysis*)를 사용할 수 있다.

> CFA는 프로그램의 제어 흐름을 결정하기 위한 정적 프로그램 분석 기법이다.

**4.0 이전)** ![1.png](https://images.gogumang.com/9cc0ae1f8c/01.png)

**4.0)** ![2.png](https://images.gogumang.com/9cc0ae1f8c/02.png)

* `strictPropertyInitialization: true`옵션을 활성화하면, `undefined` 타입이 될 수 있을 때 오류를 표시한다.

```js
class Square {
    sideLength;

    constructor(sideLength: number) {
        if (Math.random()) {
            this.sideLength = sideLength;
        }
    }

    get area() {
        return this.sideLength ** 2;
        //     ~~~~~~~~~~~~~~~
        // 오류! Object is possibly 'undefined'.
    }
}
```

* 생성자에서 다른 메소드를 호출하여 값을 할당해 준다면 속성의 타입은 `any`가 된다

```js
// AS-IS
class Square {
  sideLength; // any타입으로 오류 발생

  constructor(sideLength: number) {
    this.initialize(sideLength);
    // initialize 메소드를 가지고 해당 메소드에서 할당해주고 있다면 sideLength는 any타입으로 오류 발생!
  }

  initialize(sideLength: number) {
    this.sideLength = sideLength;
  }

  get area() {
    return this.sideLength ** 2;
  }
}
```

이런 상황에서는 확정적 할당 단언 `!`(*Definite Assignment Assertions*)을 사용하는 기존에 방식대로 처리한다.

```js
// TO-BE
class Square {
  /*
  인스턴스 속성 변수 선언 시 변수명 뒤에 !(느낌표)를 붙여
  타입스크립트 컴파일러에게 해당 변수가 실제로는 사실상 할당되었다고 간주하도록 하여 오류를 표시하지 않도록 한다.
  */
  sideLength!: number; // 명시적 타입 선언

  constructor(sideLength: number) {
    this.initialize(sideLength);
  }

  initialize(sideLength: number) {
    this.sideLength = sideLength;
  }

  get area() {
    return this.sideLength ** 2;
  }
}
```

## 단락(*Short-Circuiting*) 할당 연산자

* 복합(*compound*) 할당 연산자는 연산자를 두 개의 인수에 적용한 다음, 결과를 왼쪽에 할당한다.

```js
// 흔히 볼 수 있는 복합 할당 연산자
a += b;
a -= b;
a *= b;
a /= b;
a **= b;
a <<= b;
```

* 타입스크립트 4.0은 세 가지 **새로운 복합 할당 연산자 `&&=`, `||=`, `??=`을 추가**로 지원한다.

1. and 논리 연산자 : `&&`
2. or 논리 연산자 : `||`
3. null 병합 연산자(*nullish coalescing operator* ) : `??`

```js
a &&= b;        // a = a && b;
a ||= b;        // a = a || b;
a ??= b;        // a = a ?? b;

// a ||= b; 실제로 평가되는 것은...
a || (a = b);

// < 4.0
(values ?? (values = [])).push("hello");

// 4.0
(values ??= []).push("hello");
```

> [TC39 논리 할당 연산자 제안(*proposal*) 관련 링크](https://github.com/tc39/proposal-logical-assignment/)

## `catch`절의 매개변수 타입 지정

```js
try {
    // ...
} catch (x) { // 4.0 이전에는 x의 타입을 지정 불가
    // x의 타입은 'any'
    console.log(x.message);
    console.log(x.toUpperCase());
    x++;
    x.yadda.yadda.yadda();
}
```

* 4.0에서는 **catch절의 매개변수 타입을 `unknown` 또는 `any` 타입으로 지정 가능하다**
* ErrorException 처럼 예외 처리 클래스를 직접 정의해서 타입으로 지정하기는 불가능하다.
* `typeof` 또는 `instanceof`를 활용하여 타입을 좁혀서 사용할 수 있다.

```js
try {
  // ...
} catch (e: unknown) {
    console.log(e.toUpperCase());
    //          ~
    // 오류 발생! Object is of type 'unknown'.
    
    if (typeof e === "string") {
      console.log(e.toUpperCase());
    }
    
    if (e instanceof ErrorExcetion) {
      console.log(e.errorMessage);
    }
}
```

## JSX 팩토리 사용자 정의

* JSX 사용 시, Fragment는 여러개의 자식 엘리먼트를 반환할 수 있도록 해준다.
* 4.0에서 새로운 **`jsxFragemntFactory`옵션을 사용하여, 프래그먼트 팩토리를 사용자 정의해서 사용할 수 있다.**
* tsconfig.json 파일의 설정에서 타입스크립트가 JSX를 변환하는데 React와 호환하는 방법을 설정해줄 수 있음

```js
// tsconfig.json 예시
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "jsx": "react",
    "jsxFactory": "h",               // React.createElement 대신에 h를 사용
    "jsxFragmentFactory": "Fragment" //  React.Fragment 대신에 Fragment를 사용
  }
}

```

* 파일 별로 다른 JSX 팩토리를 사용해야 하는 경우 **새로운 프라그마 주석** (`/** @jsxFrag */`)을 사용할 수 있음

```js
// JSDoc 스타일의 여러 줄 구문을 사용하여 적용

/** @jsx h */
/** @jsxFrag Fragment */
import { h , Fragment } from 'preact';

let stuff = <>
    <div>Hello</div>
    <div>Jodeng</div>
</>;
```

**자바스크립트로 변환 결과**

```js
import { h, Fragment } from "preact";
let stuff = h(Fragment, null,
    h("div", null, "Hello"));
```

## `--noEmitOnError`옵션을 사용하는 빌드 모드에서 속도 개선

* **4.0 이전에는** 증분 빌드할 때 `--noEmitOnError` 옵션을 켜두면 빌드 속도가 매우 느렸다
  * `--noEmitOnError` 옵션을 기준으로 .tsbuildinfo 파일에서 마지막 컴파일된 결과가 캐시되지 않았기 때문이다.
* 4.0에서는 `--build` 모드 시나리오(`--incremental`와 `--noEmitOnError`)를 향상시켜 **속도를 크게 개선하였다**.

## `--incremental`과 `--noEmit` 옵션 함께 사용 가능

* **`--incremental` 옵션을 사용하면서 `--noEmit` 플래그도 함께 사용할 수 있게되었다.**
  * 4.0 이전에는 --incremetal은 .tsbuildinfo 파일을 생성해야 하므로, 허용하지 않았다.

## 에디터 개선 (Visual Studio Code)

### `/** @deprecated */` JSDoc 주석 지원

* 선언 시 `/** @deprecated */` 같이 JSDoc 주석으로 작성하면 취소선 스타일로 표시된다. ![3.png](https://images.gogumang.com/9cc0ae1f8c/03.png)

### 시작 시 부분 편집 모드 지원

* 대규모 프로젝트에서 시작 시간이 느림
  * 원인은 *프로젝트 로딩*이라는 프로세스 인데, 컴파일러의 프로그램 구성 단계와 거의 동일함
  * 파일들의 초기 설정부터 시작하여 파일 구문 분석, 종속성 해결, 종속성 구문 분석, 종속성의 또 종속성 해결 등의 작업으로 시간이 오래 걸린다.
  * 프로젝트가 클수록 코드 자동 완성 기능, \[go-to-definition\]과 같은 편집기 기본 동작을 수행하기 위해 시작 시간 지연이 더 심해진다.
* **전체 언어 서비스에 대한 제공할 수 있는 환경이 로드될 때까지 편집기가 부분적인 경험을 제공할 수 있는 새로운 모드를 개발 중** 이다.
  * 핵심 아이디어는 단일 파일 보기만 있는 경우 **편집기가 가볍게 부분적으로 서버를 실행할 수 있도록 하는 것**이다.

> 타입스크립트가 Visual Studio Code의 코드 베이스의 파일에서 응답 할 때까지 20초에서 1분 정도의 시간이 걸리는 것을 보았는데, 새로 지원될 모드는 코드 베이스에서 타입스크립트가 대화형 모드가 될 때까지 시간을 2-5초 사이로 줄일 수 있을 것이다.

* 현재 이러한 모드를 미리 경험해 보고싶다면 [Visual Studio Code Insiders](https://code.visualstudio.com/insiders/)에서 지원하고 있다.

1. Visual Studio Code Insiders 설치
2. [JavaScript and TypeScript Nightly](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) 익스텐션 설치
3. 편집기 설정 파일(settings.json)에서 아래를 내용을 추가

```js
"typescript.tsserver.useSeparateSyntaxServer": "dynamic",
```

### 더 똑똑해진 자동 가져오기 기능

```html
Q. @types 패키지에서는 잘 동작하고, 자체적으로 types를 가지고있는 프로젝트 패키지는 왜 자동 가져오기가 잘 안되는 것인가???
A. 타입스크립트에서는 node_modules/@types에 있는 모든 패키지는 자동으로 포함하지만 다른 패키지는 포함하지 않는다. 
모든 node_modules에 있는 패키지를 크롤링하는 것은 비용이 비쌀 수 있기 때문이다.
```

패키지를 방금 설치하고 아직 사용하지 않는 것을 자동으로 가져오려고 할 때 시작 경험이 별로일 수 있다.

**타입스크립트 4.0은 편집기에서 자동 가져오기 기능을 사용하기 위해 package.json의 dependencies 필드에 나열된 패키기 목록들을 포함하기 위해 약간의 추가 작업을 수행한다.** 이 패키지 정보를 가져오는 것은 오로지 자동 가져오기 기능을 개선하기 위해서만 사용하며, node_modules 디렉토리를 다 도는데 드는 비용을 줄일 수 있다.

## Breaking Changes

### `lib.d.ts` 파일 변경 사항

* **DOM** 관련 타입이 변경되었다.
  * IE와 사파리에서만 동작하던 `document.origin`제거 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/origin)에서는 `self.origin`을 사용하도록 권고)

### 부모 클래스의 속성을 재정의(*override*)하면 무조건 오류를 표시한다

* 4.0 이전 버전에는 `useDefineForClassField` 옵션이 켜져있을 때, 자식 클래스에서 부모 클래스의 프로퍼티를 재정의하면 타입스크립트 컴파일러가 오류를 표시했다.
* **4.0에서는 옵션에 사용 유무에 상관없이, 부모 클래스의 getter 또는 setter를 파생된 자식 클래스에서 재정의하면 항상 오류를 표시한다.**

```ts
class Base {
  name = 'FE Dev Lab';

  get foo() {
      return 100;
  }
  set foo(value: number) {
      // ...
  }
}

class Derived extends Base {
  foo = 10;
//~~~
// 오류! 
// 'foo' is defined as an accessor in class 'Base',
// but is overridden here in 'Derived' as an instance property.

  get name() {
    //~~~~
    // 오류! 
    // 'name' is defined as an accessor in class 'Base',
    // but is overridden here in 'Derived' as an accessor.
    return 'TOAST UI Team';
  }
}
```

### `delete`연산자의 피연산자 타입은 옵셔널 속성이어야 한다.

* `strictNullChecks: true` 옵션이 켜져있을 때, **`delete` 사용시 피연산자 타입은 `any`, `unknown`, `never`와 옵셔널 속성으로 지정했을 때 가능하다.**
* 필수 속성을 `delete` 하려고 하면 컴파일러는 오류를 표시한다.

```ts
interface Thing {
  prop: string;
  optionalProp?: number
  anyProp: any;
  unknownProp: unknown;
  neverProp: never;
}

function f(x: Thing) {
  delete x.prop;
  //     ~~~~~~
  // 오류! The operand of a 'delete' operator must be optional.

  delete x.optionalProp;
  delete x.anyProp;
  delete x.unknownProp;
  delete x.neverProp;
}
```

### 타입스크립트의 Node Factory는 더 이상 사용되지 않는다

* 타입스크립트는 노드 생성용 추상 구문 트리(AST-*Abstract Syntax Tree*) "팩토리" 함수 집합을 제공하는데, 4.0에서는 새로운 팩토리 API를 제공한다.
* 타입스크립트 4.0에서는 새로운 API를 사용하도록 하고. 기존에 만들어졌던 함수들은 더이상 사용하지 않도록(*deprecated*) 결정했다.

> 추상 구문 트리(*Abstract Syntax Tree*) : 프로그래밍 언어의 문법에 따라 소스 코드 구조를 표시하는 계층적 프로그램 표현(respresentation)한다.

## 참고

https://devblogs.microsoft.com/typescript/announcing-typescript-4-0-beta https://en.wikipedia.org/wiki/Variadic_function#In_JavaScript http://blog.woong.org/v/59aa5b8cd845cbff6d76d418 https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions https://github.com/tc39/proposal-logical-assignment/ https://gyujincho.github.io/2018-06-19/AST-for-JS-devlopers