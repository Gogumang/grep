안녕하세요. 커뮤니케이션 앱 LINE의 모바일 클라이언트를 개발하고 있는 Ishikawa입니다.

저희 회사는 높은 개발 생산성을 유지하기 위해 코드 품질 및 개발 문화 개선에 힘쓰고 있습니다. 이를 위해 다양한 노력을 하고 있는데요. 그중 하나가 Review Committee 활동입니다.

Review Committee에서는 머지된 코드를 다시 리뷰해 리뷰어와 작성자에게 피드백을 주고, 리뷰하면서 얻은 지식과 인사이트를 Weekly Report라는 이름으로 매주 공유하고 있습니다. 이 Weekly Report 중 일반적으로 널리 적용할 수 있는 주제를 골라 블로그에 [코드 품질 개선 기법 시리즈](https://techblog.lycorp.co.jp/ko/techniques-for-improving-code-quality-list)를 연재하고 있습니다.

이번에 블로그로 공유할 Weekly Report의 제목은 '마구 자를 것인가 반듯하게 자를 것인가'입니다.

다음 코드는 만약 `ContactModel`이 `Person` 타입이고 'friend' 상태라면 `displayName`을 조회해 `normalizeEmoji`를 실행한 결과를 반환한다는 내용입니다.

```kotlin
fun ...(contact: ContactModel): ReturnValue? {
    val friendName = (contact as?
            ContactModel.Person)?.takeIf {
        it.isFriend
    }?.let { normalizeEmoji(it.displayName) } ?: return null

    // snip...
    // snip...
}
```

위 코드에서 `let`은 Kotlin의 표준 함수로 다음과 같이 작동합니다.

* `?.takeIf`의 반환값이 `null`인 경우: 아무것도 하지 않고 `null` 반환
* `?.takeIf`의 반환값이 `null`이 아닌 경우: 반환값을 `it`으로 사용해서 `normalizeEmoji(it.displayName)`를 호출한 뒤 결과 반환

이 코드에서 개선할 수 있는 부분이 있나요?

### 자르기 전에 칼을 갈자

위 코드는 부적절한 줄 바꿈 때문에 가독성이 떨어집니다. 로직에 전혀 손을 대지 않고 줄 바꿈 위치를 바꾸는 것만으로도 가독성을 높일 수 있습니다.

```kotlin
    val friendName = (contact as? ContactModel.Person)
        ?.takeIf { it.isFriend }
        ?.let { normalizeEmoji(it.displayName) }
        ?: return null
```

기본적으로 '의미가 크게 구분되는' 곳에서 줄을 바꾸는 것이 좋습니다. 줄을 바꿀 적절한 위치를 고르기 어려울 때는 코드를 자연어(영어, 일본어 등)로 번역해 보는 것도 하나의 방법입니다. 이렇게 하면 어디에서 의미가 크게 구분되는지 명확해질 수 있습니다.

위 코드는 다음과 같이 번역할 수 있습니다.
> If a contact is a `Person` and the person is a friend, take the name with normalizing; otherwise this returns null.

여기서 의미가 크게 구분되는 곳에 슬래시를 넣으면 다음과 같습니다.
> If a contact is a `Person` / and the person is a friend, / take the name with normalizing; / otherwise this returns null.

위 결과의 슬래시 위치는 개선된 코드의 줄 바꿈 위치와 일치합니다.

반면, 처음 살펴본 가독성이 떨어지는 예시의 줄 바꿈 위치에 해당하는 곳에 슬래시를 넣으면 다음과 같습니다.
> If a contact is a / `Person` and the person is / a friend / , take the name with normalizing; otherwise this returns null.

올바른 위치에서 줄을 바꾸면 더 나은 리팩터링을 할 수 있습니다. 첫 번째 줄의 `as? ContactModel.Person`과 두 번째 줄의 `.takeIf`는 필터 역할을 하고, 네 번째 줄의 `?: return null`은 그에 해당하는 결과입니다. 그러면 세 번째 줄의 `normalizeEmoji(it.displayName)`는 메서드 체인 외부로 이동해도 괜찮다는 것을 알 수 있습니다.

```kotlin
    val friend = (contact as? ContactModel.Person)
        ?.takeIf { it.isFriend }
        ?: return null
    val friendName = normalizeEmoji(friend.displayName)
```

### 다양한 방법의 자르기

#### 메서드 체인/폴백 체인

도트 연산자(`.`)나 세이프 콜 연산자(`?.`) 등을 이용한 메서드 체인 또는 [엘비스 연산자](https://en.wikipedia.org/wiki/Elvis_operator)(`?:`) 등을 이용한 폴백(fallback) 체인을 사용하는 경우, 코드의 세부적인 부분 보다 로직의 구조와 흐름이 더 중요한 경우가 많습니다. 이러한 경우는 `.`, `?.`, `?:` 연산자 바로 앞에 줄 바꿈을 넣는 것이 좋습니다.

```kotlin
    val ... = someCollection
        .filterIsInstance<SomeModel>()
        .filter { ... }
        .map { ... }
        .toSet()
```

```kotlin
    val ... = nullable?.value
        ?: fallback.value
        ?: another.fallback(value)
```

혹시 인수가 길어지는 경우(람다 포함)에는 인수가 짧아지도록 보조 함수나 확장 함수 등을 사용해 줄 바꿈 위치를 조정할 수 있습니다.

```kotlin
    val ... = nullable?.value
        ?: fallback.shortcut
        ?: another.fallback(value)
...
private val Fallback.shortcut: ...? get() =
    value.with(long.long.long.long.long.long.long.argument)
```

#### 연산자 우선순위

대부분의 경우 연산자 우선순위는 의미 연결의 강도에 따라 결정됩니다.

예를 들어 다음 두 코드를 비교해 보면, `==`에서 줄을 바꾸는 것이 `+`나 `-`에서 줄을 바꾸는 것보다 이해하기 쉬운 코드가 됩니다.

```kotlin
valueWithLongName1 - valueWithLongName2 ==
    valueWithLongName3 + valueWithLongName4
```

```kotlin
valueWithLongName1 -
    valueWithLongName2 == valueWithLongName3 +
    valueWithLongName4
```

식에 `()`를 사용할 때는 `()`로 묶인 부분의 연결성이 더 강합니다.

```kotlin
valueWithLongName1 *
    (valueWithLongName2 + valueWithLongName3)
```

#### 엘비스 리턴(`?: return`)

만약 어떤 코드의 영향이 국소적으로 국한되는 것이 아니라면 그 영향이 강조될 수 있도록 줄 바꿈 위치를 신중하게 결정해야 합니다. `return`과 `throw`가 그 대표적인 예라고 할 수 있습니다. `return`이나 `throw`를 사용할 때는 코드의 왼쪽에 나타나게 두면 그것을 강조할 수 있습니다. 따라서 엘비스 리턴 `?: return`이나 `?: throw`, `?: error(...)`를 사용할 때는 그 바로 앞에서 줄을 바꾸는 것이 좋습니다.

```kotlin
    val nonNullValue = some.nullable.value.with(parameter)
        ?: return someReturnValue
```

*** ** * ** ***

> 한 줄 요약: 코드에서 줄을 바꿀 때는 의미 구분에 신경 쓴다.
>
> 키워드: `line-break`, `code chunk`, `operator precedence`