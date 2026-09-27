# Redux-Saga: 사이드 이펙트 관리

지난 1년 6개월 동안 [리액트](https://reactjs.org/), [리덕스](https://github.com/reactjs/redux)를 공부하고 활용해 [웹 애플리케이션](https://drive.toast.com)을 개발했다. 지금도 개발하고 있고, 여전히 비동기 처리와 같은 사이드 이펙트(Side effects)를 고민하고 있다. 리액트, 리덕스는 함수의 응용, 순수 함수, 불변성 등 함수형 프로그래밍을 지향한다. 그리고 사이드 이펙트를 원하지 않는다. 하지만 세상일은 뜻대로 되지 않는다는 말을 증명하듯 서비스는 사이드 이펙트 없이 개발할 수 없었다. 사실 처음에는 사이드 이펙트라는 개념도 몰랐다. 그냥 무언가 개발에 어려운 점이 있는데, 그 무언가가 무엇인지 표현도 못 했다.

리액트, 리덕스의 생태계는 마치 함수형 개발처럼 보인다. 함수형 개발은 (수학적)함수의 응용이고, 함수로 시작해 함수로 끝난다고 생각한다. 리액트 생태계 대부분은 컴포넌트다. `prop`으로 시작해 리액트 엘리먼트를 반환하는 것으로 끝난다. 컴포넌트의 근간은 함수이고, 이 생태계에서는 함수(특히 순수 함수)로서의 규칙을 잘 지켜야 인정받을 수 있다. 리덕스도 마찬가지다. Action Creator라는 순수 함수의 반환(Action)을 받아 리듀서(Reducer)라 부르는 순수 함수로 데이터를 처리한다. **결론적으로 이들에게 사이드 이펙트는 존재하지 않아야 한다.** 하지만 앞서 언급했듯, 사이드 이펙트가 없는 서비스 개발은 없다. 우리가 다루어야 할 사이드 이펙트는 어딘가에는 존재해야 하는데, 그곳이 어디냐가 문제다. 그런데 **사이드 이펙트가 비집고 들어갈 수 있는 틈** 이 하나 있었다. 그곳에 사이드 이펙트가 존재할 수 있었다. **리덕스의 미들웨어이고, 이는 정말 훌륭한 틈이라 생각한다. 그리고 [Redux-Saga](https://github.com/redux-saga/redux-saga)는 이 틈에서 사이드 이펙트를 훌륭히 관리한다.**

## 사이드 이펙트(Side Effect)

부끄럽지만 얼마 전까지 사이드 이펙트를 그냥 영어 단어 "부작용"으로만 알았고, 영화 "나비효과"를 떠올릴 뿐이었다. 그런데 리액트, 리덕스와 그 생태계들을 살펴보며 사이드 이펙트가 다른 어떤 것을 의미한다고 느끼기 시작했다. 단순히 부작용이라고만 해석을 하면 무언가 이상했다.

[Redux-Saga의 README](https://github.com/redux-saga/redux-saga/blob/master/README.md)에는 다음과 같은 설명이 있다.
> *redux-saga is a library that aims to make application side effects (i.e. asynchronous things like data fetching and impure things like accessing the browser cache) easier to manage, more efficient to execute, simple to test, and better at handling failures.*
>
> redux-saga는 애플리케이션의 "부작용"들(데이터 요청(fetch) 등의 비동기 작업, 브라우저 캐시 같은 순수하지 않은 것들)을 쉽게 관리하고 효과적으로 실행하고 간단한 테스트와 쉬운 실패 처리를 목적으로 한다.

처음엔 이런 생각이 들었다. *'데이터 요청, 브라우저 캐시가 왜 부작용이지? 안 좋은 건가? 원래는 ajax도 쓰면 안 되는 건가?'* 이상했다. 그래서 사이드 이펙트에 대해 알아보았다.

우선 영어 단어의 뜻부터 바로잡았다. 일반적으로 "Side Effect"는 원치 않은, 부정적인, 해로운 어떤 것을 내포한다. 그래서 "부작용"으로 해석하는 경우가 대부분이다. 하지만, 컴퓨터 공학에서는 "부작용"이 아니다. 조금 더 원시적인, "부수효과"라는 뜻을 더 강조한다. "부작용"은 "Negative Side Effect"라 칭하는 것이 조금 더 정확하다.

프로그래밍 혹은 컴퓨터 과학이라는 범주에서도 다시 사이드 이펙트의 정의는 여러 가지가 있을 수 있지만, 자바스크립트 관점에서 보면 *사이드 이펙트는 (자바스크립트) 코드가 **외부 세계에 영향을 주거나 받는 것이다.*** 조금 모호하지만 함수 관점으로 생각하면 조금 더 명확하다. *함수가 일관된 결과를 보장하지 못하거나, 함수 외부 어디든지 조금이라도 영향을 주는 경우 모두 사이드 이펙트를 갖는 것이라 할 수 있다.* 다만 외부 세계라는 것을 딱 잘라 정의하기에는 어렵다. 코드의 바깥(outer) 스코프도 외부 세계라 할 수 있고, 사용자의 액션이나 네트워크 통신 역시 당연히 외부 세계라 할 수 있다.

## Redux-Saga

Redux-Saga는 처음부터 사이드 이펙트를 관리하기 위해 만들어졌다. 리덕스가 처음 나왔을 때, 액션 생성자와 리듀서는 순수해야 하는데 사이드 이펙트는 어떻게 처리하는가에 대한 많은 의견이 있었다. 그리고 Redux-Saga가 등장했다.

![1.jpg](https://images.gogumang.com/a78fbbdab9/01.jpg) (아마도 이렇게...?)

Redux-Saga의 README에는 다음과 같은 내용이 있다.
> *The mental model is that a saga is like a separate thread in your application that's solely responsible for side effects. redux-saga is a redux middleware, which means this thread can be started, paused and cancelled from the main application with normal redux actions, it has access to the full redux application state and it can dispatch redux actions as well.*

Redux-Saga는 애플리케이션에서 필요한 사이드 이펙트를 별도의 스레드로 분리해서 관리할 수 있고, 리덕스의 미들웨어로 리덕스의 액션은 스레드를 시작, 중지, 취소시킬 수 있다고 한다. 그런데 이렇게만 봐서는 좀 이해가 되지 않는 부분도 있었다. 일단 처음엔 `Saga`가 무엇인지도 몰랐다.

### Saga

`Saga`에 대해 조금 알아보니 [Sagas](https://www.amundsen.com/downloads/sagas.pdf)라는 논문이 있었고, [GOTO 컨퍼런스](https://blog.gotocon.com/)-2015에 "[Applying Saga Pattern](https://youtu.be/xDuwrtwYHu8)"이라는 발표가 있었다. 요약해보면 Saga는 어떤 시스템에서의 장기(Long lived) 트랜잭션과 그 실패 처리를 어떻게 관리할지에 대한 방법이다. 하지만 MSDN의 "[A Saga on Sagas](https://msdn.microsoft.com/en-us/library/jj591569.aspx)"에서는 조금 다르다. CQRS 패턴의 프로세스 매니저로 생각한다. 작업을 효율적으로 처리하는 것 그 자체에 더 관심이 있다. Redux-Saga에서는 위 3가지에서 모두 영감을 받았다고 한다. 다만 개인적으로 Redux-Saga의 Saga는 MSDN의 Saga와 더 유사하다고 생각한다. Saga는 각 작업을 어떻게 관리할지에 대해 더 관심을 둔다.

예를 들어 여행 관련 서비스가 있고, 여행을 예약하는 데에는 항공 예약이나, 숙소, 차량 렌트가 있다고 가정하자. 사용자는 그냥 "여행 프로그램"을 예약한다. 서비스 내부적으로는 비행기, 숙소, 차량 렌트를 모두 같이 예약한다. Redux-Saga의 관점으로는 아래와 같은 흐름이 그려진다.

![2.png](https://images.gogumang.com/a78fbbdab9/02.png)

실제 서비스 로직들은 모두 Saga 내부에서 처리하며, 그 결과를 다시 액션으로 발행(dispatch)한다. 이 외의 모든 것들 - 예약 버튼이나 예약 결과를 보여주는 컴포넌트, 액션, 액션 생성자, 리듀서 모두 순수 함수로 사이드 이펙트없이 구현할 수 있다.

### Saga의 방식

처음 Redux-Saga를 접했을 때 어떤 개념인지까지는 그래도 좀 이해했지만, 리덕스의 액션과 Saga를 어떻게 구성하고 처리하는지는 여전히 감을 잡지 못했다. `effect`, `channel`, `task`, `blocking과 non-blocking`, `async`, `watcher`, `worker`, `fork`, `spawn` 등 Redux-Saga의 용어만으로도 경력이 얼마 안되는 FrontEnd 주니어를 바보로 만드는 데 충분했다. 지금 와서 보면, 저런 용어와 개념도 중요하지만 사실 그보다 선행되어야 할 것은 Saga의 흐름(Workflow)을 이해하는 것이 아닐까 생각한다. Saga는 액션을 연주하는 연주자처럼 보인다. Redux 애플리케이션은 액션을 통해 데이터(state)가 업데이트되고 뷰(View)가 변화한다. Saga는 이 액션과 데이터(state) 사이를 연주한다. 그리고 Saga의 [Beginner's tutorial](https://redux-saga.js.org/docs/introduction/BeginnerTutorial.html)을 보면서 Saga의 흐름을 조금 더 수월하게 이해할 수 있었다.

1초마다 state가 1씩 증가하는 애플리케이션에는 두 가지 액션 `INCREMENT`와 `INCREMENT_ASYNC`가 있다. `INCREMENT`는 리듀서에서 받아서 직접 처리하는 액션으로 `state =+ 1` 코드를 처리한다. `INCREMENT_ASYNC`는 **1초 후** 에 `state += 1`을 처리하고자 하는 액션이지만 리듀서는 순수 함수라는 규칙이 있기에 이 액션을 직접 처리하지 못한다. 때문에 대략적인 흐름은 다음과 같다.

```js
// 1. Dispatch Action 
  {
    type: INCREMENT_ASYNC
  }

// 2. Wait 1000ms
  delay(1000)

// 3. Dispatch Action
  {
    type: INCREMENT
  }

// 4. Reducer
  switch(action) {
    case INCREMENT: 
      return state + 1
    default:
      return state
  }
```

위 순서에서 2번, 3번은 Saga를 이용해 구현할 수 있다. (`GeneratorFunction`을 쓰는 이유, `takeEvery`나 `put`과 같은 `effect`라 부르는 것들은 기회가 된다면 후속편의 글을 작성해서 설명하려 한다. 일단은 Saga의 내부 구현까지는 몰라도 괜찮다.)

```js
import { delay } from 'redux-saga' // 참고: delay는 단순히 1초후에 Resolve가 되는 Promise다.
import { put, takeEvery } from 'redux-saga/effects'

// INCREMENT_ASYNC 액션이 Dispatch 되면 `incrementAsync`를 수행하도록 등록한다.
export function* watchIncrementAsync() {
  yield takeEvery(INCREMENT_ASYNC, incrementAsync)
}

function* incrementAsync(action) {
  yield delay(1000)                 // 1초를 기다리고
  yield put({ type: INCREMENT })    // INCREMENT 액션을 Dispatch한다.
}
```

이제 리덕스를 결합해서 생각하면 다음과 같은 흐름이 그려진다.

![3.png](https://images.gogumang.com/a78fbbdab9/03.png)

개인적으로 주목할만한 부분은 바로 1번이라 생각한다. 처음 Redux-Saga를 가지고 코드를 작성했을 때 가장 헷갈렸던 부분이었다. Saga에서만 특정 액션을 처리하고, 리듀서에서는 그 액션을 처리하지 않은 경우, 과연 그 액션은 리덕스에도 도달하는지 도달하지 않는지, 도달한다면 언제 도달하는지가 궁금했었다. 미리 말하자면 Saga를 통하는 모든 액션은 리듀서에 먼저 도달한다. Saga에서 액션을 기다리고 처리하는 코드는 다음과 같은 형태로 구현되어 있다.

```js
function sagaMiddleware({getState, dispatch}) {
  /* Saga 초기화 .... */

  return next => action => {
    const result = next(action) // hit reducers  --- 액션은 리듀서에 먼저 도달한다.
    sagaStdChannel.put(action)  // Saga에 액션이 Dispatch 됐음을 알린다.
    return result
  }
}
```

사실 조금 더 정확히 설명하자면 Redux-saga는 지나간 액션이 실제로 리듀서에 도달했는지, 중간에 변형이나 필터링 됐는지는 알 수 없다. 즉, 액션이 Dispatch 되는 과정 자체에는 관여하지 않는다. 액션이 지나가는 것을 그저 바라본(watching) 후 그들만의 연주를 한다. 이게 Saga의 방식이다.

1. 모든 액션은 리듀서에 먼저 도달한다. (사실은 그냥 액션이 지나가는 것을 본 이후 동작하는 것이다.)
2. 지나간 액션을 자신의 채널에 알린다.
3. 각 액션에 따른 작업을 처리하고, 필요에 따라 그 결과를 다시 Put(=dispatch) 한다.

## 정리

위의 Redux-Saga의 흐름 1\~4번까지를 모두 이해했다면 이제 Redux-Saga를 직접 사용할 준비가 된 것이다. 하지만 지금까지 설명한 것은 Redux-Saga의 빙산의 일각도 못 된다. 정말 눈곱만큼도 설명하지 못했다. Saga의 `Task` 개념이나, `Effect`, `Channel` 개념 등은 앞으로 복잡한 애플리케이션을 구현하는데 필수요소이고 사실 그 내용을 지금 이 글에 설명하지 못해 아쉬운 마음도 있다. 이 글을 읽고 Redux-Saga에 관심이 조금이라도 생겼다면 공식 [문서](https://redux-saga.js.org/)를 읽어보자. 문서가 잘 작성되어 있어서 이해하는 데 정말 많은 도움이 됐었다.

애플리케이션을 개발하며 사이드 이펙트, 비동기, 혹은 이 외의 것들 -

1. 병렬 처리
2. A 액션이 Dispatch 된 이후 B 액션의 Dispatch까지 한 번 더 기다린 이후 어떤 작업 처리
3. 일괄적인 실패, 에러 처리
4. 리액트 컴포넌트의 성능 (일부 상황에 대해 컴포넌트의 Reconciliation을 방지할 수도 있다.)
5. 비동기 코드들이 포함된 서비스 코드에 대한 테스트
6. Socket 연동
7. ...

이와 같은 것들을 고민한다면, Redux-Saga는 정말 좋은 선택이 될 수 있다.