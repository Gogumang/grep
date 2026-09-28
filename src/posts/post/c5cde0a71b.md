**[바닥부터 시작하는 Vue 테스트와 리팩토링](//www.slideshare.net/secret/5tUhoUwnTKFd6k "바닥부터 시작하는 Vue 테스트와 리팩토링")** from **[if kakao](https://www.slideshare.net/ifkakao)**

*** ** * ** ***

## 들어가며

안녕하세요. 카카오 FE플랫폼팀 Lumi입니다. 얼마 전 열렸던 kakao FE(Front end) meetup 행사에서 '바닥부터 시작하는 Vue 테스트와 리팩토링’이라는 주제로 발표를 맡았고, 그때 발표했던 내용을 글로 재구성해 보았습니다.

들어가기 앞서, 테스트 방법은 다양하고 이 글에서 제시하는 방법이 정답이 아닐 수도 있지만 더 좋은 테스트와 테스트하기 좋은 코드를 탐구했던 과정을 공유하는 것에 가치를 두고 읽어 주셨으면 합니다.

이 글은 Vue 컴포넌트 테스트를 작성하며 알게 된 지식과 함께, 작성 과정 중 했던 생각들, 팀 안에서 관련 주제로 나눴던 대화들을 다룹니다. Vue와 유닛 테스트의 기본적인 경험을 가지신 분들을 대상으로 글을 작성했으며, Vue 컴포넌트 테스트는 어떻게 시작하면 좋을지, 컴포넌트에서는 무엇을 테스트하는 게 좋을지 궁금하신 분들께 도움이 될 것 같습니다.

## 배경

![](https://images.gogumang.com/c5cde0a71b/01.png)

제가 카카오에 입사하여 1년이 조금 안 되는 기간 동안 계속 맡고 있는 프로젝트 소개를 간단히 드리면서, 테스트를 시작하게 된 배경을 말씀드리려고 합니다. 위에 보시는 화면은 제가 맡고 있는 "Kakao for Business"라는 웹사이트 화면인데요.

카카오의 비즈니스 사용자를 위한 통합 플랫폼이라서, 아마 대부분은 처음 보실 수도 있을 것 같습니다. 이 프로젝트는 Nuxt 기반의 Vue 컴포넌트로 이루어져 있습니다. 처음에는 기존에 개발하셨던 분과 같이 업무를 하다가, 인수인계를 받고 어느 날부터 혼자 운영을 하기 시작했습니다. 그러던 어느 날, 이야기가 시작됩니다.

기존에 구현되어 있던 코드량도 많고, 로직도 복잡한 몇몇 덩치 큰 Vue 컴포넌트들이 있었는데요. 이 쪽의 유지보수가 꾸준히 들어오면서, 저는 무럭무럭 덩치를 더 키우게 됩니다. 기존 구조를 유지하면서 기능 추가를 하다 보니 당연한 이야기지만 점점 수정하는데 들이는 비용이 커지게 됐어요.

프로젝트를 맡은 초반에 기존 코드를 재빠르게 리팩토링 하지 못해 점점 심리적 부담이 늘어났습니다. 그래서 저는 리팩토링이라 말하며, 제 눈에 익숙한 코드로 바꾸고 싶은 욕구를 저희 파트의 Paul에게 드러냈습니다.

Paul이 대답하셨어요. “QA를 거치고 운영되는 코드는 귀한 코드입니다. 테스트 코드 없이 리팩토링 완성을 어떻게 보장할 수 있을까요? 가시적으로도, 안정성면으로도 테스트 코드가 필요할 거예요. 테스트 코드와 함께 리팩토링 하는 것을 추천해요.”

다만, 기능 추가와 리팩토링을 같이 하지 말 것이라고 추가로 가이드도 주셨습니다.

## 테스트를 시작한 이유

보통 테스트라고 하면, TDD를 많이 떠올리실 것 같은데요. 앞선 Paul과의 대화에서도 알 수 있듯이, 테스트를 먼저 만들지 않았더라도 운영 중인 코드를 수정할 때 코드의 안정성을 돕고, 리팩토링이라는 추상적인 진행상황을 가시적으로 측정할 수 있게 해주는 역할이 있기 때문에 필요성을 공감했어서 테스트를 시작하는 첫 번째 이유가 되었습니다.

그리고 저는 운영 업무 외에도 업무 안에서 좀 더 성장할 수 있는 방법을 찾고 있었는데 그 첫 과제로 시작하기에 좋아 보였습니다. 저는 유닛 테스트 경험은 있었는데, 컴포넌트 테스트 경험이 없었기 때문에 프로젝트 코드를 대상으로 컴포넌트 테스트를 학습하며 적용해 보는 기회를 가졌고요. 또 기존 프로젝트에는 테스트 코드가 하나도 없었기 때문에 테스트 환경을 마련해 두고 추후에 추진력 있게 테스트 작성을 시작할 수 있는 기반 마련의 의미도 있었습니다.

이러한 이유들로 테스트 코드 작성을 시작하게 되었습니다.

## Vue 컴포넌트 테스트 작성 과정

Vue 컴포넌트의 테스트 작성 과정을 \[ 환경 구성 \> 컴포넌트 생성 테스트 \> 컴포넌트 데이터 테스트 \> 컴포넌트 간 테스트 \]와 같은 순서로 다뤄 보았습니다.

### 환경 구성

첫 번째로는 환경 구성인데요. 환경 구성 같은 경우는 테스트 도구의 종류가 굉장히 여러 가지가 있기 때문에 제가 사용한 도구에 대한 상세한 설명보다는 무엇을 어떻게 구성했는지 간략하게 소개해 드리려 합니다.

```vim
│  
├─ pages (component)
│  ├─ inspection
│  │    inspectionDetail.vue -----------> 테스트 당할 파일
├─ tests
│  ├─ specs
│  │    inspectionDetail.spec.vue -----------> 테스트코드 작성 파일
│  ├─ mock
│  │    approvedDetails.js  -----------> mock data (가짜 response data)
│  │    rejectedDetails.js
│  │ _setup.js
│  │
```

일단 테스트할 컴포넌트를 선정했습니다. tests/specs/\* 에 테스트할 파일 이름을 따서 테스트 파일을 만들어 두고요. mock 폴더에는 가짜 응답 데이터를 미리 마련해둬서, 테스트 시 요청 메서드의 반환 값으로 사용할 수 있게 했습니다.

```javascript
import test from 'ava'
import sinon from 'sinon'
import { mount, shallowMount } from '@vue/test-utils'
import InspectionPage from '~/pages/.../inspectionDetail.vue'
import InspectionErrorModal from '~/components/.../InspectionErrorModal.vue'
​
import statesMock from '~/tests/mock/states'
import approvedDetailsMock from '~/tests/mock/approvedDetails'
import rejectedDetailsMock from '~/tests/mock/rejectedDetails'
​
import {
  INSPECTION_TYPES,
  WAITING_INSPECTION,
  OPEN_INSPECTION,
  ...
} from '~/../constants'
​
// 이 부분부터 테스트 코드 작성 시작..!
test('...', t => {
​
})
```

테스트 코드 내부 구성은 이렇습니다. 테스트 프레임워크는 ava를 사용했고, 테스트 더블을 위해 sinon, Vue 컴포넌트 테스트를 좀 더 쉽게 도와주는 API를 제공하는 vue-test-util을 사용했습니다. 테스트에 전역으로 쓰일 객체와 값을 준비하고 나면, test(’…’) 부분부터 작성을 시작하면 됩니다.

Q\&A 시간에, 한 질문자 분께서 왜 ava를 선택했는지 물어보셨었는데요. 일단 빨리 테스트를 작성해보는 게 중요하다고 생각해서 Nuxt 공식 가이드 문서에서 추천하는 도구로 선택했다고 답변드렸던 기억이 납니다.

### 컴포넌트 생성 조건 셋팅

환경을 마련했으니, 본격적인 테스트 코드 작성을 시작해봐야겠죠. 프로젝트 내 '검수 신청 페이지’는 하나의 큰 페이지 컴포넌트로 구현되어 있었는데요. 그래서 테스트할 시나리오를 이렇게 잡아봤습니다.

1. 페이지에 진입할 때 (다른 말로는, 컴포넌트를 생성할 때)
2. 라우트에서 아이디 정보를 가져오도록 되어있는데, 이 정보를 가져오지 못하면
3. 에러 모달을 띄워주는 상황을 테스트하려고 합니다.

#### 컴포넌트 생성 조건 셋팅

```javascript
import InspectionPage from '~/pages/.../inspectionDetail.vue'
​
test('아이디 정보가 없으면, 페이지 진입 시 에러 모달을 보여준다.', t => {
  // given
  const option = {
    mocks: {
      $route: {
        query: { id: null },
      },
    }
  }
​
  // when
  const wrapper = mount(InspectionPage, option)
​
  // ...
})
​
test('검수 상태 조회 후 응답 데이터가 없으면, 페이지 진입 시 에러 모달을 보여준다.', t => {
  // given
  const FAKE_ID = 123456
  const option = {
    mocks: {
      $route: {
        query: { id: FAKE_ID },
      },
    }
  }
​
  // when
  const wrapper = mount(InspectionPage, option)
​
  // ...
})
```

저는 일단 given when then 패턴을 지켜서 일관성 있게 테스트 작성을 하기로 했고, 방금 말씀드린 시나리오처럼 given 위치에 테스트 사전 조건으로 $route에서 아이디 정보를 null로 셋팅해 뒀습니다.

```javascript
function createOption (query) {
  const FAKE_ID = 123456
  const defaultQuery = { id: FAKE_ID }
  
  return {
    mocks: {
      $route: {
        query: query || defaultQuery
      },
    },
  }
}
​
test('아이디 정보가 없으면, 페이지 진입 시 에러 모달을 보여준다.', t => {
  // given
  const option = createOption({ id: null })
​
  // ...
})
​
test('검수 상태 조회 후 응답 데이터가 없으면, 페이지 진입 시 에러 모달을 보여준다.', t => {
  // given
  const option = createOption()
​
  // ...
})
```

두 번째 시나리오로는 아이디 정보는 있지만, 검수 상태 API 조회 시 빈 응답 데이터가 오면 에러 모달을 띄워주는 테스트를 작성했는데요. 이때 반복되는 컴포넌트 생성 조건에 따라 중복되는 코드가 발생하는 것을 알게 되었습니다. 앞으로 작성될 테스트에서도 계속 이 옵션 코드가 반복될 것을 예상할 수 있었습니다.

그래서 컴포넌트 생성 옵션 객체를 만드는 유틸을 추가했습니다. vue-test-util 이 제공하는 인터페이스에 맞게 디폴트로 셋팅할 옵션과 커스텀 옵션을 받게 만들었고요. 유틸을 사용하여 중복을 제거하고 테스트 코드 내부를 깨끗하게 만들 수 있었습니다.

### mount 되기 전 로직 테스트

```javascript
import InspectionPage from '~/pages/.../inspectionDetail.vue'
​
test('검수 상태 조회 후 응답 데이터가 없으면, 페이지 진입 시 에러 모달을 보여준다.', t => {
  // given
  const EMPTY_RESPONSE = null
  const requestInspectionStateStub =
    sinon.stub(InspectionPage.methods, 'requestInspectionState').callsFake(() => EMPTY_RESPONSE)
​
  // when
  const option = createOption()
  const wrapper = mount(InspectionPage, option)
​
  // then
  t.true(requestInspectionStateStub.calledOnce)
  t.is(wrapper.vm.showErrorModal, true)
})
​
test('검수 상태 조회 결과가 [심사 대기 상태] 일 경우, 페이지 진입 시 에러 모달을 보여준다.', t => {
  // given
  const MOCK_WAITING_STATE = statesMock[WAITING_INSPECTION]
  const requestInspectionStateStub =
    sinon.stub(InspectionPage.methods, 'requestInspectionState').callsFake(() => MOCK_WAITING_STATE)
​
  // when
  const option = createOption()
  const wrapper = mount(InspectionPage, option)
​
  // then
  t.true(requestInspectionStateStub.calledOnce)
  t.is(wrapper.vm.showErrorModal, true)
})
```

방금 말씀드린 두 번째 시나리오의 조건을 좀 더 자세히 보면 \[검수 상태 조회 후 응답 데이터가 없으면\] 이라는 조건이 보이는데요. 이 API 조회는 컴포넌트의 created 훅으로 호출되고 있었어요. mount 이전에 create가 발생하기 때문에 mount를 시키기 전에, 컴포넌트의 methods 속성에 접근해서 created시 호출될 메서드에 테스트 더블을 미리 붙여주었습니다.

여기서는 테스트 더블 중 하나인 stub을 사용했고요. 간단히 stub에 대해 말씀드리면, 원래의 메서드를 덮어씌워서 대신 실행되는 함수를 만들 수 있는 도구이고 return값도 셋팅해 줄 수 있습니다. 시나리오에서는 응답 데이터가 없어야 하니, 빈 리턴 값을 반환하도록 셋팅했습니다.

```javascript
Error thrown in test:
​
TypeError {
  message: 'Attempted to wrap requestInspectionState which is already wrapped'
}
```

다음 테스트에서는 \[검수 상태 조회 후 응답 데이터가 있으면\] 이라는 시나리오를 테스트하려고 같은 메서드에 한번 더 테스트 더블을 붙였는데요. 이때 에러! 가 발생했습니다.

에러 메시지를 살펴보니 이미 전역 객체인 컴포넌트의 같은 메서드에 테스트 더블을 붙여뒀기 때문에 중복(오염)되어 나는 에러였습니다.

```javascript
function restore (...testDoubles) {
  testDoubles.forEach(obj => obj.restore && obj.restore())
}
​
test('검수 상태 조회 후 응답 데이터가 없으면, 페이지 진입 시 에러 모달을 보여준다.', t => {
  // given
  const EMPTY_RESPONSE = null
  const requestInspectionStateStub =
    sinon.stub(InspectionPage.methods, 'requestInspectionState').callsFake(() => EMPTY_RESPONSE)
​
  // ...
​
  restore(requestInspectionStateStub)
})
​
test('검수 상태 조회 결과가 [심사 대기 상태] 일 경우, 페이지 진입 시 에러 모달을 보여준다.', t => {
  // given
  const MOCK_WAITING_STATE = statesMock[WAITING_INSPECTION]
  const requestInspectionStateStub =
    sinon.stub(InspectionPage.methods, 'requestInspectionState').callsFake(() => MOCK_WAITING_STATE)
​
  // ...
​
  restore(requestInspectionStateStub)
})
```

그래서 테스트 더블이 붙어서 오염된 전역 컴포넌트 객체를 복원시켜주는 restore 함수를 추가했고, 테스트가 끝나는 시점마다 호출시켰습니다.

이때 테스트 더블을 붙이는 시기가 mounted 이전이어야 할 때는 전역 컴포넌트 객체 하위 속성의 메서드로 접근해서 테스트 더블을 붙이므로 전역 컴포넌트가 오염된 것을 restore 시켜줘야 했지만, mounted 이후에는 컴포넌트의 인스턴스에 접근해서 테스트 더블을 붙일 수 있고 각 테스트마다 인스턴스를 새로 생성해주므로 restore호출이 필요하지 않았습니다.

**Life Cycle Hook 안의 코드를 쉽게 테스트하려면?**

이 과정을 통해 만약 Life Cycle Hook 내부에 추상화되지 않은 코드들이 나열된 상태였다면 테스트가 어려울 거라는 생각을 했습니다. 추상화된 메서드들로 구성되어 있어야 호출 시점이 프레임워크에서 제어되는 코드들에 테스트 더블을 붙이고 테스트하기 수월하니까요. 그런데 기존 프로젝트의 컴포넌트들에서 훅 메서드 내부에 추상화되지 않은 코드들이 꽤나 많았고 쉬운 테스트를 위해서 이러한 부분들이 보일 때마다 메서드로 추상화 해 두어야겠다는 생각을 하게 되었습니다.

### 컴포넌트 데이터 테스트

이제 컴포넌트의 가장 메인이 되는 컴포넌트의 데이터들을 테스트해 볼 차례인데요. 먼저 Vue 컴포넌트에서 테스트해야 할 데이터 타겟에 대해 추려보면 일단 props, data, computed 속성이 있겠고, 데이터는 아니지만 데이터를 변경시키는 watch와 method도 간접적인 테스트 타겟으로 보입니다.

사실 테스트할 것이 하나 더 있었는데, template 내부에 선언된 표현식 결과값입니다. 앞서 설명드린 데이터들은 비교적 테스트가 간단한데 비해, 이 template 안의 표현식 부분에 대해서는 고찰해 볼거리들이 있었기 때문에 먼저 얘기해보려고 합니다.

**템플릿에 로직이 있을 때**

```javascript

  타이틀
  디스크립션

​
test('선택한 검수타입에 [Foo]가 있으면, Foo 헤드라인을 보여준다.', t => {
  // ...
​
  // then
  const headline = wrapper.find({ ref: 'headline' })
  const headlineHtml = headline.html()
  t.true(headlineHtml.includes('타이틀'))
})
```

템플릿 내부에 표현식으로 로직이 들어 있는 경우 어떻게 테스트해야 했을까요? 첫 번째로 시도했던 방법은 일단 DOM에 접근할 수 있는 ref, class 같은 셀렉터를 (기존에 없었다면) 추가해서 테스트 코드 내에서 셀렉터로 DOM에 접근한 뒤에 렌더링 된 결과물을 확인해줬습니다.

```javascript

  타이틀
  디스크립션

​
test('선택한 검수타입에 [Foo]가 있으면, Foo 헤드라인을 보여준다.', t => {
  // ...
​
  // then
  t.is(wrapper.vm.hasFooType, true)
})
```

두 번째 방법은, 템플릿 표현식을 computed 속성을 이용해 템플릿 내에서 제거하고 치환된 computed 속성의 결과값을 테스트하는 방법이었는데요. 이렇게 로직이 템플릿과 분리되고 해당 데이터의 계산된 결과만 체크할 수 있으면 이 편이 여러모로 테스트를 유지하기 좋은 방식이 아닐까 하는 생각이 들었습니다.

파트 내부에서도 이와 관련된 이야기를 한 적이 있어서 대화 내용 일부를 갈무리해서 가져와 봤습니다.

![](https://images.gogumang.com/c5cde0a71b/02.png)

변화율이 높은 뷰를 테스트 코드가 직접 관계 맺지 않게 하는 장치로 Page Object에 대한 조언을 해주셨던 내용인데요. 테스트 시 템플릿에 로직이 있으면 뷰에 직접 접근할 수밖에 없으니 PO를 두고 로직을 제거하면 좋다는 내용이었습니다. 저 같은 경우도 Vue 컴포넌트를 만들 때 템플릿 내부에 로직을 자주 쓰는 편이었어서 찔려하면서도 유용한 내용이라 기억해뒀었던 대화였습니다.

**리팩토링과 테스트 전략**

이런 식으로 테스트하기 좋도록 템플릿에서 로직을 분리(computed, methods 활용)하는 리팩토링을 생각해볼 수 있었고, 더불어 테스트 전략을 세워봤습니다.

컴포넌트 테스트의 기본적인 예제를 찾아보면 DOM에 접근해(ex. ref, class, id 등) 렌더링 된 뷰의 결과물(ex. class, text 등)을 단언문에 넣어서 체크하는 예제가 많은데요. 앞서 말씀드린 대로, 변화율이 높은 뷰를 테스트 코드에 넣어서 체크하는 것은 유지보수 비용이 커지는 테스트라고 생각했기에, 테스트 조건에 따른 컴포넌트 데이터 변화값만 확인하고 데이터와 템플릿 바인딩 여부는 스냅샷이나 E2E테스트에 책임을 넘기는 방식으로 테스트를 진행해봐도 좋겠다는 생각을 했습니다.

**스냅샷 테스트**

그래서 간단히 스냅샷 테스트도 다뤄봤습니다.

![](https://images.gogumang.com/c5cde0a71b/03.png)

\[출처\] <https://medium.com/@luisvieira_gmr/snapshot-testing-react-components-with-jest-3455d73932a4>

스냅샷 테스트는 렌더링 된 구성요소를 저장해서 비교(diff)하는 테스트인데요. 이전에 저장된 스냅샷이 없으면 생성하고, 있으면 이전 저장값과 diff를 해서 pass, fail을 체크하는 방법입니다.

```javascript
test('선택한 검수타입에 [Foo]가 있으면, Foo 헤드라인을 보여준다.', t => {
  // given
  const wrapper = mount(InspectionPage, createOption())
​
  // ...
​
  t.snapshot(wrapper.html(), 'Foo가 있을 때 html')
})
```

테스트 코드로 보시면, 마운트로 반환된 wrapper의 html로 스냅샷을 실행시키면 아래 폴더 구조처럼 tests/snapshot 폴더 하위에 스냅샷 결과물이 저장되었습니다.

```vim
│  │ 
├─tests
│  ├─snapshot
│  │    approvedDetail.spec.js.md
│  │    approvedDetail.spec.js.snap
│  ├─specs
│  │    inspectionDetail.spec.vue
│  │
```

스냅샷 처리방식은 테스트 프레임워크마다 다를 수도 있을 것 같은데, 제가 사용한 ava라는 테스트 프레임워크 같은 경우에는 스냅샷 보고서가 마크다운으로 제공되고, 실제 스냅샷 테스트로 값을 diff 할 때는 \*.snap 파일을 사용해서 체크합니다.

**나머지 데이터들은?**

```javascript
const TITLE = '테스트 타이틀'
const DESCRIPTION = '테스트 디스크립션'
​
// mount시 props 주입
const wrapper = mount(Component, {
  propsData: {
    title: TITLE
  }
})
wrapper.setData({ description: DESCRIPTION })
​
// props 확인
t.is(wrapper.props('title'), TITLE)
​
// computed 확인 (data와 동일)
t.is(wrapper.vm.hasTitleAndDescription, true)
```

처음에 말씀드렸던 것처럼 템플릿 표현식 결과값 이외의 나머지 데이터(data, computed, props) 테스트는 비교적 간단했습니다. props는 인스턴스 생성 시에 옵션으로 주입해주고, 이후 wrapper의 props로 값을 조회 가능했으며 data와 computed도 인스턴스 생성 후 테스트 명세에 맞게 조작한 뒤 wrapper의 뷰 인스턴스에서 속성 값을 조회하여 테스트할 수 있습니다.

그리고 watch와 methods도 테스트 명세에 맞는 실행 조건을 설정하고, 의존관계가 있는 데이터의 변화를 테스트하거나 메서드 호출, 반환 값을 확인하는 식이어서 일반적인 유닛 테스트처럼 작성하는 식이었습니다.

**나는 망각의 동물…**

![](https://images.gogumang.com/c5cde0a71b/04.png)

이 화면은, 얼마 전 있었던 팀 내 코드 리뷰 대화의 일부인데요. 제가 상수를 템플릿에서 접근할 수 있게 하려고 컴포넌트의 data에 값을 넣어뒀는데, 그 코드를 보신 동료분이 템플릿에서 상수의 접근 없이 computed를 활용하는 패턴을 추천해주셨습니다. 제가 테스트 작성 과정을 통해 뷰와 로직을 분리하는 것의 장점을 깨달았다고 했으나, 깨달은 것과 체화시키는 것의 간극…! 을 느꼈던 계기였습니다.

### 컴포넌트 간 테스트

이제 마지막으로, 컴포넌트 간 테스트를 알아보겠습니다.

**mount v.s shallowMount**

![](https://images.gogumang.com/c5cde0a71b/05.png)

\[출처\] <https://vuejsdevelopers.com/2019/09/30/stubs-vue-unit-test/>

부모-자식 컴포넌트 간 테스트를 위해서는 shallowMount의 동작 방식에 대한 이해가 필요했습니다. 만약 자식 컴포넌트를 많이 가지고 있는 부모 컴포넌트를 테스트한다면 부모를 마운트 할 때 자식 컴포넌트까지 모두 마운트 할 필요가 없습니다. 특히 자식 컴포넌트 중 created 될 때 API 요청이 있거나 한 경우엔 더욱 불편해질 텐데요.

이럴 때 부모 컴포넌트를 shallowMount 하게 되면 두 번째 그림처럼, 자식 컴포넌트가 모두 stub 객체, 즉 가짜 객체로 대체되어서 부모 컴포넌트의 독립적인 테스트가 가능하도록 지원됩니다.

```markup

  
  
    
      
        에러모달 타이틀
      
      
        …
      
    
  

```

두 방식으로 렌더링 된 html을 비교해보면 mount시에 실제 html이 반환된 반면에, shallowMount에서는 stub이라는 이름으로 내부가 빈 html로 대체된 것을 확인해 볼 수 있었습니다.

**부모-자식 컴포넌트 간 테스트는?**

![](https://images.gogumang.com/c5cde0a71b/06.png)

컴포넌트 자신을 테스트할 때는 내부 데이터와 로직을 체크했고, 부모-자식 컴포넌트 관계에서의 테스트에서는 컴포넌트 경계에서 주고받는 데이터를 체크했습니다.

그러려면 부모 컴포넌트를 shallowMount 하여 자식들이 모두 stub객체가 되어도 그 중 테스트할 특정 자식 컴포넌트는 stub 객체가 되지 않아야 할 텐데요. vue-test-util에서 부모 wrapper의 find 셀렉터로 자식 컴포넌트 객체를 넘겨주면 가능합니다.

```javascript
// 부모가 자식에게
test(‘페이지에서 메시지를 전달하며 에러 모달을 열면, 모달 컴포넌트에 prop으로 전달된다.', t => {
  // given
  const MODAL_MSG = '테스트용 메세지'
  const wrapper = shallowMount(InspectionPage, createOption())
​
  // when
  wrapper.vm.showErrorModal(MODAL_MSG)
  const errorModalWrapper = wrapper.find(InspectionErrorModal)
​
  // then
  t.is(errorModalWrapper.props('msg'), MODAL_MSG)
})
​
// 자식이 부모에게
test(‘페이지에서 열린 에러 모달에서, show 이벤트가 오면 값이 페이지에 업데이트된다.', t => {
  // given
  const MODAL_MSG = '테스트용 메세지'
  const wrapper = shallowMount(InspectionPage, createOption())
​
  // when
  wrapper.vm.showErrorModal(MODAL_MSG)
  const errorModalWrapper = wrapper.find(InspectionErrorModal)
  errorModalWrapper.vm.$emit('update:show', false)
​
  // then
  t.is(wrapper.vm.showInspectionErrorModal, false)
})
```

이렇게 특정 자식을 stub 되지 않게 설정한 후, 부모가 자식에게 props를 넘겨주면 자식 wrapper에서 props를 테스트할 수 있고,자식 wrapper에서 직접 인스턴스의 $emit이벤트를 발생시킨 뒤에 부모의 데이터 값이 변경되었는지 체크해 볼 수 있었습니다.

## 과정을 통해 얻은 것

이것으로 테스트에 관한 내용은 마쳤고, 이러한 과정을 통해서 얻은 것들이 있었습니다.

일단 기술적으로는

1. 운영 중인 코드에 대한 테스트의 리팩토링 안정성, 가시성에 대한 역할을 이해할 수 있었고
2. 컴포넌트 테스트를 처음 해봤는데, 그 방법과 노하우를 얻을 수 있었으며
3. 마지막으로는 테스트가 쉬운 컴포넌트를 고민해볼 수 있었고, 이를 통해 근거 있는 리팩토링 계획이 세워지면서, 코드 일관성을 가져갈 수 있겠구나 라는 생각을 했습니다.

개인적인 측면에서 얻은 것들도 있었는데요.

1. 일단은, 업무가 항상 바쁘기만 한 건 아니어서 그럴 때 꾸준히 진행해 볼 수 있는 도전 과제가 마련되었다는 점이고
2. 운영 업무 외에도, 이런 활동을 시도해보며 업무로 성장하는 느낌이 있는 거 같습니다.
3. 또, 업무를 하다 보면 (특히 저처럼 프로젝트에 FE가 혼자 일 때) 피드백에 대한 갈증을 느끼기도 했는데 이런 활동으로 어느정도 해소되는 것 같기도 합니다.

그럼에도 불구하고 (아주 현실적인) 아쉬움이 하나 있다면, 진행상황에 대한 업무 가시화가 어려웠다는 점인데요. 삽질의 연속이었기 때문에 무엇을, 어떻게, 어디까지 해야 할지 측정할 감이 없어서 일정이나 할 일 목록을 모호하게 잡고 공유할 수밖에 없었습니다. \^\^; 이런 부분은 좀 더 경험을 쌓다 보면 해결될 수 있을 거라 생각합니다.

## 마치며

지금까지 Vue 컴포넌트 테스트 작성 방법과 과정 중의 경험, 개인적인 생각들을 공유해 보았습니다. 이번 발표가 아직 남아있는 고민(기존 코드를 망가뜨리지 않으면서 테스트와 리팩토링을 잘 병행하는 방법)이나, 아직 해보지 않은 것들(store 테스트/ 테스트 유지보수 경험/ 더 복잡한 케이스의 테스트)등 다음 스텝을 진행하는데 좋은 계기가 된 것 같습니다. 자료를 준비하면서 팀 안에서 실력 있는 동료들과 다양한 개발 문화(코드 리뷰, 기술 공유, 토론, 스터디)를 통해 키워드를 얻을 수 있었고, 이러한 과정을 업무로 인정해주는 환경에도 고마움을 느꼈습니다. 앞으로도 기회가 되고 좋은 경험들이 쌓이게 된다면 공유할 수 있도록 하겠습니다.

## Reference

* [https://vue-test-utils.vuejs.org](https://vue-test-utils.vuejs.org/)
* <https://lmiller1990.github.io/vue-testing-handbook/>
* <https://joshua1988.github.io/vue-camp/testing/getting-started.html>
* <https://github.com/avajs/ava>

*** ** * ** ***

## 함께 해요!

* [카카오 – 프론트엔드 개발자 모집](https://careers.kakao.com/jobs?keyword=FE)