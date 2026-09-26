> 이 글은 2024년 3월 28일에 일본어로 먼저 발행된 기사를 번역한 글입니다.

LY Corporation은 높은 개발 생산성을 유지하기 위해 코드 품질 및 개발 문화 개선에 힘쓰고 있습니다. 이를 위해 다양한 노력을 하고 있는데요. 그중 하나가 Review Committee 활동입니다.

Review Committee에서는 머지된 코드를 다시 리뷰해 리뷰어와 작성자에게 피드백을 주고, 리뷰하면서 얻은 지식과 인사이트를 Weekly Report라는 이름으로 매주 공유하고 있습니다. 이 Weekly Report 중 일반적으로 널리 적용할 수 있는 주제를 골라 블로그에 [코드 품질 개선 기법 시리즈](https://techblog.lycorp.co.jp/ko/techniques-for-improving-code-quality-list)를 연재하고 있습니다.

이번에 블로그로 공유할 Weekly Report의 제목은 '차일드 록(child lock)'입니다.

## 차일드 록

메시지의 데이터 모델로 `MessageData`라는 추상 클래스가 있다고 가정해 봅시다. 메시지에는 여러 유형이 있으며, 각 유형은 `MessageData`의 자식 클래스를 정의하는 방식으로 표현합니다.

여기서 `MessageData`의 자식 클래스 `T`의 목록 `List<T>`를 화면에 표시하기 위해 다음과 같이 추상 클래스 `MessageListPresenter<T : MessageData>`를 정의했다고 가정하겠습니다. 단, 메시지 표시 로직은 메시지 유형에 따라 달라지므로 `MessageListPresenter.bind`에는 목록 표시 로직을 구현하지 않았습니다. 부모 클래스의 `bind`에서는 헤더와 푸터(footer)만 표시하고, 목록 표시는 자식 클래스에서 오버라이딩해서 구현할 것으로 기대한 코드입니다(Kotlin에서 `open`은 오버라이딩이 가능하다는 의미의 수정자입니다).

```kotlin
abstract class MessageListPresenter<T : MessageData>(
    ...
) {
    private val headerView: ... = ...
    private val footerView: ... = ...

    open fun bind(messageList: List<T>) {
        updateHeader(messageList.size)
        updateFooter(messageList)

        // 여기서는 `messageList` 표시가 구현되어 있지 않다.
        // 이 함수를 오버라이딩해서 `messageList` 표시를 구현한다.
    }

    private fun updateHeader(messageCount: Int) {
        headerView.text = ...
        headerView....
    }

    private fun updateFooter(messageList: List<T>) {
        footerView....
    }
}
```

다음 `SomeSpecificMessageListPresenter`는 `MessageListPresenter`를 구현한 예시입니다. `SomeSpecificMessageData`를 타입 파라미터로 지정하고, 해당 클래스 고유의 목록 표시 로직을 `bind`에 정의했습니다.

```kotlin
class SomeSpecificMessageListPresenter(
    ...
) : MessageListPresenter<SomeSpecificMessageData>(
    ...
) {
    override fun bind(messageList: List<SomeSpecificMessageData>) {
        super.bind(messageList)

        ... // `messageList` 표시
    }
}
```

이 코드에 문제가 있을까요?

### 자식 클래스가 장난을 못 치도록 하기

`super`를 명시적으로 호출해야 한다는 것은 대부분 오버라이딩 가능한 함수의 범위가 너무 넓다는 것을 의미합니다(예외에 대해서는 뒤에서 설명하겠습니다). 위 코드는 오버라이딩할 수 있는 함수의 범위가 너무 넓기 때문에 다음과 같은 구현 실수가 발생하기 쉽습니다.

* `super` 호출 누락: 모든 자식 클래스는 헤더와 푸터를 업데이트하려면 `super.bind`를 호출해야 합니다. 만약 `super.bind` 호출을 누락한 경우 헤더와 푸터가 업데이트되지 않는 버그가 발생하며, 이때 특별히 에러가 발생하지 않기 때문에 버그를 간과하기 쉽습니다.
* `bind` 오버라이딩 누락: 상속 시 오버라이딩이 필요하다는 제약 조건이 인라인 주석으로만 설명돼 있습니다. 따라서 오버라이딩해야 할 다른 함수가 있는 상황에서는 오버라이딩을 누락하는 버그가 발생하기 쉽습니다. 오버라이딩을 강제하기 위해 `abstract` 수정자를 사용하려고 해도 헤더나 푸터 업데이트 로직이 섞여 있다면 쉽지 않습니다.
* 기대하지 않은 `bind` 구현: 인라인 주석에 적혀 있는 대로 오버라이딩된 `bind`에서는 메시지 목록 표시만 구현되기를 기대하겠지만, 실제로 `bind`를 호출하면 헤더와 푸터도 표시됩니다. 즉, 오버라이딩의 책임 범위와 함수의 책임 범위가 일치하지 않습니다. 이로 인해 오버라이딩의 책임 범위를 오해하기 쉬우며, 결과적으로 책임 범위를 벗어난 코드가 자식 클래스에 구현될 수 있습니다.

이 문제를 해결하기 위해서는 `bind` 함수를 `open`으로 만들지 말고 목록을 업데이트하는 함수인 `updateMessageList`를 분리해 `abstract` 추상 메서드(또는 순수 가상 함수)로 만드는 것이 좋습니다.

```kotlin
abstract class MessageListPresenter<T : MessageData>(
    ...
) {
    ...

    fun bind(messageList: List<T>) { // `open`이 아님
        updateHeader(messageList.size)
        updateFooter(messageList)
        updateMessageList(messageList)
    }

    protected abstract fun updateMessageList(messageList: List<T>)

    ...
}
```

자식 클래스는 다음과 같습니다.

```kotlin
class SomeSpecificMessageListPresenter(
    ...
) : MessageListPresenter<SomeSpecificMessageData>(
    ...
) {
    override fun updateMessageList(messageList: List<SomeSpecificMessageData>) {
        ... // `messageList` 표시
    }
}
```

이렇게 하면 '헤더 및 푸터와 메시지 목록을 업데이트한다'는 `bind`의 흐름은 변경할 수 없게 만들면서 자식 클래스마다 메시지 목록을 다르게 구현할 수 있습니다. 이처럼 자식 클래스가 변경할 수 있는 범위를 제한하면 코드를 더욱 견고하게 만들 수 있습니다.

### super는 너무 'super'하다

비슷한 문제를 피하려면 다음과 같은 상황을 피하는 것이 좋습니다.

1. 오버라이딩된 부모 클래스의 함수를 호출하는 경우(명시적으로 `super`를 사용하는 경우)
   * 다만 라이프사이클과 관련된 함수(생성자, 소멸자 등)와 플랫폼이나 라이브러리의 제약 조건 때문에 필요한 경우(Android의 `Activity.onCreate` 등)는 예외.
2. 자식 클래스에서 공통으로 사용되는 함수의 흐름을 각 자식 클래스에서 구현하는 경우

이와 같은 상황에 해당한다면 오버라이딩 가능한 범위를 제한하는 것이 좋습니다.

### 참고: C++의 private virtual

C++에서는 `private virtual` 함수를 정의할 수 있습니다. 이 함수는 부모 클래스에서만 호출할 수 있지만, 호출은 동적으로 디스패치됩니다. `private virtual` 함수를 사용하면 전체 흐름(`callingPrivateVirtual`)을 변경하지 않고 각 자식 클래스의 로직(`privateVirtual`)을 변경할 수 있습니다.

```cpp
class Base
{
public:
    void callingPrivateVirtual()
    {
        ... // 다른 로직
        privateVirtual(); // `에서만 호출할 수 있다
    }

private:
    virtual void privateVirtual() {}
};

class Derived : public Base
{
private:
    void privateVirtual() override
    {
        // `privateVirtual`의 구현 변경은 가능
    }
};
```

*** ** * ** ***

> 한 줄 요약: 오버라이딩 가능한 범위는 최대한 제한한다.
>
> 키워드: `override`, `super`, `inheritance`