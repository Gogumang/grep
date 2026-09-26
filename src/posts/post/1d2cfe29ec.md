> 이 글은 2024년 4월 18일에 일본어로 먼저 발행된 기사를 번역한 글입니다.

LY Corporation은 높은 개발 생산성을 유지하기 위해 코드 품질 및 개발 문화 개선에 힘쓰고 있습니다. 이를 위해 다양한 노력을 하고 있는데요. 그중 하나가 Review Committee 활동입니다.

Review Committee에서는 머지된 코드를 다시 리뷰해 리뷰어와 작성자에게 피드백을 주고, 리뷰하면서 얻은 지식과 인사이트를 Weekly Report라는 이름으로 매주 공유하고 있습니다. 이 Weekly Report 중 일반적으로 널리 적용할 수 있는 주제를 골라 블로그에 [코드 품질 개선 기법 시리즈](https://techblog.lycorp.co.jp/ko/techniques-for-improving-code-quality-list)를 연재하고 있습니다.

이번에 블로그로 공유할 Weekly Report의 제목은 'To equal, or not to equal'입니다.

Java나 Kotlin에서는 `equals`를 오버라이딩해 '구조적 등가성(structural equality)'을 정의할 수 있습니다(단, `equals`를 오버라이딩할 때 `hashCode`도 오버라이딩해야 합니다).

다음과 같이 사용자 프로필의 UI 데이터 모델이 있다고 가정해 봅시다. 이 데이터 모델은 자체적으로 `equals`와 `hashCode`를 정의했습니다.

```kotlin
class UserProfileViewData(
    val userId: Int,
    val accountName: String,
    val nickname: String,
    val profileImageUri: Uri,
    val statusMessage: String,
    ...
) {

    override fun hashCode(): Int {
        return userId
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as UserProfileViewData
        
        return userId == other.userId
    }
}
```

이 코드에 문제가 있을까요?

### 오렌지와 사과는 같은 '과일'이니까 같은 '것'일까?

일반적으로 `equals`로 일부 속성만 비교하는 것은 피해야 합니다. `equals`(equality)는 일반적으로 '동일성(identity, referential equality, same object)' 또는 '등가성/동등성(equivalence)' 중 하나를 나타내야 하는데요. 위 `UserProfileViewData.equals` 구현은 동일성도 등가성도 아닙니다. 따라서 예상치 못한 버그가 발생할 수 있습니다.

예를 들어 `UserProfileViewData`의 정보가 변경될 때마다 UI도 업데이트해야 한다고 가정해 봅시다. `UserProfileViewData`의 인스턴스는 다음과 같이 'observable'로 제공됩니다.

* Kotlin 코루틴의 `StateFlow`
* Kotlin 코루틴의 `Flow`(`distinctUntilChanged` 포함)
* Rx의 `Observable`(`distinctUntilChanged` 포함)
* Android의 `LiveData`(`distinctUntilChanged` 포함)

이 네 개의 'observable'는 `UserProfileViewData`가 변경될 때마다 해당 인스턴스를 출력하며, `UserProfileViewData`가 변경됐는지 판단하기 위해 `equals`를 사용합니다. 즉, 바로 이전 인스턴스와 `equals`로 비교해서 `true`이면 무시하고, `false`이면 출력합니다. 그런데 위 코드는 `nickname`이나 `statusMessage`가 업데이트돼도 `userId`가 같으면 `equals`가 `true`가 되므로 UI가 업데이트되지 않습니다. 즉 `nickname`을 업데이트해도 화면에 반영되지 않는 버그가 발생합니다.

이와 같은 버그가 발생하는 것을 막기 위해 `equals`(equality)의 정의는 다음 두 가지 중 하나여야 합니다.

* 동일성(identity): 두 객체(또는 해당 참조)가 동일할 때 `true`. Java나 Kotlin의 경우는 `Object`나 `Any`의 `equals`를 그대로 사용한다.
* 등가성/동등성(equivalence): 모든 속성과 필드가 등가이거나 동등할 때 `true`. 모든 속성과 필드에 등가성/동등성이 정의되어 있어야 한다. Kotlin의 경우 `data`로 쉽게 구현할 수 있다.

만약 일부 속성만 비교하는 함수가 필요하다면 `equals`와는 별도의 함수로 정의해야 합니다. 다음 예시에서는 `userId`만 비교하는 함수를 자체 정의했습니다.

```kotlin
class UserProfileViewData(
    val userId: Int,
    ...
) {

    fun hasSameIdWith(other: UserProfileViewData): Boolean =
        userId == other.userId
    
    ...
}
```

### 보충 사항 1: Kotlin `data class`

Kotlin `data class`의 기본 `equals` 구현은 생성자 파라미터 속성을 제외한 모든 속성을 무시한다는 점에 유의하세요.

```kotlin
data class Data(val i: Int) {
    var j: Int = 0
}

val data1 = Data(42)
val data2 = Data(42)
data2.j = 2
data1 == data2 //=> true!
```

### 보충 사항 2: 예외 사례

등가성/동등성을 정의할 때 예외적으로 일부 속성을 무시하는 경우가 있습니다. 계산 결과의 캐시와 메모가 대표적인 예입니다. 다음 `Factorial`은 `n`의 계승을 구하기 위한 클래스로 일단 계산한 값을 `cachedValue`로 저장합니다. 이 `cachedValue`는 `equals`로 비교되지 않습니다. 하지만 캐시 존재 여부에 따른 동작 차이를 무시할 수 있는 경우(계산 시간 차이 등을 무시해도 되는 경우 등)는 이렇게 구현해도 문제없을 것입니다.

```kotlin
data class Factorial(val n: UInt) {
    private var cachedValue: UInt? = null

    val value: UInt
        get() {
            val cached = cachedValue
            if (cached != null) {
                return cached
            }

            val calculated = (2u..n).fold(1u) { acc, i -> acc * i }
            cachedValue = calculated
            return calculated
        }
}
```

### 보충 사항 3: 표현이냐 실제 값이냐 그것이 문제로다

지금까지 마치 등가성/동등성은 당연히 정의할 수 있는 것처럼 설명했는데요. 실제로 등가성/동등성은 관점에 따라 달라질 수 있으므로 신중하게 정의해야 합니다. 유리수 `Rational`이 다음과 같이 정의돼 있다고 가정해 봅시다.

```kotlin
class Rational(numerator: Int, denominator: UInt) {
    ...
}
```

`numerator`는 부호가 붙은 분자를 나타내고, `denominator`는 분모를 나타냅니다. 여기서 `Rational(1, 2)`(1/2)과 `Rational(2, 4)`(1/4)의 비교를 생각해 봅시다.

```kotlin
Rational(1, 2) == Rational(2, 4) // true or false?
```

이 결과가 `true`여야 하는지 `false`여야 하는지는 `Rational`이 무엇을 나타내는지에 따라 달라집니다.

* 표시를 위한 모델인 경우: `false`를 반환해야 한다. 예를 들어 `"1/2 + 2/4 = 1"`을 UI에 출력하는 경우 `1/2`과 `2/4`는 서로 다른 것이다.
* 계산을 위한 모델인 경우: `true`를 반환해야 한다. 예를 들어 `1/4 + 1/4`의 계산 결과는 `1/2`과 '동일'해야 한다.

*** ** * ** ***

> 한 줄 요약: `equals`가 동일성(identity)과 등가성/동등성(equivalence) 중 어느 쪽을 나타내는지 명확히 한다.
>
> 키워드: `identity`, `equivalence`, `equals`