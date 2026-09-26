> 이 글은 2024년 4월 11일에 일본어로 먼저 발행된 기사를 번역한 글입니다.

LY Corporation은 높은 개발 생산성을 유지하기 위해 코드 품질 및 개발 문화 개선에 힘쓰고 있습니다. 이를 위해 다양한 노력을 하고 있는데요. 그중 하나가 Review Committee 활동입니다.

Review Committee에서는 머지된 코드를 다시 리뷰해 리뷰어와 작성자에게 피드백을 주고, 리뷰하면서 얻은 지식과 인사이트를 Weekly Report라는 이름으로 매주 공유하고 있습니다. 이 Weekly Report 중 일반적으로 널리 적용할 수 있는 주제를 골라 블로그에 [코드 품질 개선 기법 시리즈](https://techblog.lycorp.co.jp/ko/techniques-for-improving-code-quality-list)를 연재하고 있습니다.

이번에 블로그로 공유할 Weekly Report의 제목은 '생성자를 두드려 보고 건너라'입니다.

## 생성자를 두드려 보고 건너라

다음 `FooVideoPlayer`는 동영상을 재생하기 위한 클래스입니다. `FooVideoPlayer.play`를 호출해 동영상을 재생할 수 있는데요. 그 전에 `prepare`를 호출해서 `preparedValue` 값을 설정해야 합니다. 만약 `prepare`를 호출하지 않고 `play`를 호출하면 `error`로 인해 예외가 발생합니다.

```kotlin
/**
 * A video player for a file specified by [videoUri]. 
 * 
 * Call [play] to play the video, but [prepare] must be called before calling `play`.
 * Otherwise `play` will throw [IllegalStateException].
 */
class FooVideoPlayer(
    private val videoUri: Uri,
    ... // other options
) {
    private var preparedValue: PreparedValue? = null

    fun prepare() {
        if (preparedValue != null) {
            error("Already prepared")
        }

        val preparedValue = ... // execute `prepare` logic
    }

    fun play() {
        val currentValue = preparedValue
        if (currentValue == null) {
            error("Not prepared yet")
        }

        // ... play `videoUri`.
    }
}
```

이 코드에 개선할 수 있는 부분이 있을까요?

### 망가진 생성자 고쳐쓰기

이 `FooVideoPlayer`는 '준비되지 않은' 상태를 안전하게 처리하지 못하는 문제가 있습니다. `FooVideoPlayer` 인스턴스가 전달될 때 `prepare`가 호출됐는지 여부를 알 수 없는데 잘못 호출하면 예외가 발생합니다. 이와 같이 주의해서 사용해야 하는 클래스나 함수는 버그의 원인이 될 수 있습니다. 사용 시 주의해야 할 사항을 주석으로 작성해 놓을 수도 있겠지만 그보다는 애초에 '잘못 사용할 수 없도록 만드는 것'이 이상적입니다.

이번 경우는 다음과 같은 해결 방법이 있습니다.

1. 초기화 시 `prepare`를 실행한다.
2. `play`를 처음 호출 시 `prepare`를 실행한다.
3. `prepare` 전에 `play`를 호출할 수 없도록 만든다.

#### 옵션 1: 초기화 시 `prepare`를 실행

가장 단순한 해결 방법은 다음과 같이 생성자나 이니셜라이저에서 `prepare`에 해당하는 로직을 실행하는 것입니다.

```kotlin
class FooVideoPlayer(
    private val videoUri: Uri,
    ... // other options
) {
    private val preparedValue: PreparedValue

    init {
        val preparedValue = ... // execute `prepare` logic
    }

    fun play() {
        // ... play `videoUri`.
    }
}
```

이 방법의 장점은 많은 속성을 읽기 전용으로 만들 수 있다는 것입니다. `prepare` 시점에 처음으로 값이 결정되는 속성에도 `val`을 사용할 수 있습니다. 하지만 이 방식은 안전하지 않은 코드가 될 수 있다는 단점도 있습니다. 이니셜라이저 내에서 호출한 함수가 초기화되지 않은 속성을 읽어 오는 버그가 발생할 수 있습니다. `Swift`와 같은 일부 언어에서는 이와 같은 버그가 발생하지 않도록 초기화가 완료되기 전에 속성이나 함수를 호출하는 것에 제약을 두고 있습니다만, 이런 경우에는 `prepare`에 해당하는 로직을 이니셜라이저 내에 작성하지 못할 수가 있습니다. 그 외에도 `Kotlin`에서는 생성자 자체를 `suspend`할 수 없는 등 생성자에는 다양한 제약이 있습니다.

이처럼 생성자나 이니셜라이저에 복잡한 로직이나 부작용이 큰 로직을 작성하면 문제가 될 수 있습니다. 따라서 생성자를 `private`으로 설정하고 별도의 팩토리 함수를 정의한 후, 해당 함수 내에 `prepare`에 해당하는 로직을 작성하는 것도 하나의 선택지로 생각합시다. 다음 코드에서는 `companion object` 내에 `createInstance`라는 팩토리 함수를 정의했습니다(`companion object` 내에 정의한 함수는 `Java`에서 말하는 `static` 메서드에 해당합니다).

```kotlin
class FooVideoPlayer private constructor(
    private val videoUri: Uri,
    ..., // other options
    private val preparedValue: PreparedValue
) {
    fun play() {
        // ... play `videoUri`.
    }

    companion object {
        fun createInstance(videoUri: Uri, ...): FooVideoPlayer {
            val preparedValue = ... // execute `prepare` logic

            return FooVideoPlayer(
                videoUri,
                ...,
                preparedValue
            )
        }
    }
}
```

#### 옵션 2: `play`를 처음 호출 시 `prepare`를 실행

인스턴스가 생성될 때 `prepare`에 해당하는 로직을 실행하는 대신 다음과 같이 `play`를 처음 호출할 때 `prepare`를 실행하는 방법도 있습니다.

```kotlin
class FooVideoPlayer(
    private val videoUri: Uri,
    ... // other options
) {
    private var preparedValue: PreparedValue? = null

    fun play() {
        val preparedValue = prepare()

        // ... play `videoUri`.
    }

    private fun prepare(): PreparedValue {
        val existingValue = preparedValue
        if (existingValue != null) {
            return existingValue
        }

        val newValue = ... // preparation logic
        preparedValue = newValue
        return newValue
    }
}
```

이 방법은 '인스턴스가 생성돼도 `play`가 호출되지 않을 가능성이 높고 `prepare`의 비용이 높은' 경우에 효과적입니다. 하지만 `prepare`에서 확정하는 속성을 가변 (`var`)으로 해야 한다는 단점도 있습니다. 이 문제는 Kotlin의 `lazy`와 같이 최초 접근 시에 로직을 실행하는 매커니즘을 만들어 사용하는 것으로 완화할 수 있습니다.

```kotlin
class FooVideoPlayer(
    private val videoUri: Uri,
    ... // other options
) {
    private val preparedValue: PreparedValue by lazy {
        ... // preparation logic
    }

    fun play() {
        // ... play `videoUri` by using `preparedValue`
    }
}
```

#### 옵션 3: `prepare` 전에 `play`를 호출할 수 없도록 강제

정적 타입을 사용하는 언어라면 `prepare` 전과 `prepare` 후의 타입을 나눠 `prepare` 후에만 `play`를 정의하는 방법도 있습니다. 잘못 사용하면 애초에 컴파일이 불가능하게 만들자는 아이디어입니다.

이 방법은 특히 '`prepare`의 실행 비용이 비싸다'는 등의 이유로 호출자가 `prepare`의 실행 시점을 제어하고 싶을 때 유용합니다. 다른 관점에서 보면 이것은 앞서 살펴본 옵션 1 방법의 팩토리 함수를 클래스화한 것으로 볼 수 있습니다. 옵션 1과 비교할 때 이 방법만의 장점은 `prepare`된 인스턴스를 `FooVideoPlayer`의 캐시로 보유할 수 있다는 점과 '단계적인 초기화 상태'를 관리할 수 있다는 점을 들 수 있습니다.

```kotlin
class FooVideoPlayer(
    private val videoUri: Uri,
    ... // other options
) {
    fun prepare(): PreparedFooVideoPlayer {
        val preparedValue = ... // execute `prepare` logic

        return PreparedFooVideoPlayer(
            videoUri,
            ...,
            preparedValue
        )
    }
}

class PreparedFooVideoPlayer(
    private val videoUri: Uri,
    ..., // other options
    private val preparedValue: PreparedValue
) {
    fun play() {
        // ... play `videoUri`.
    }
}
```

*** ** * ** ***

> 한 줄 요약: 준비되지 않은 인스턴스는 사용할 수 없도록 한다.
>
> 키워드: `initialization`, `constructor`, `factory`