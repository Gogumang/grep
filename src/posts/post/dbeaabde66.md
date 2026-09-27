안녕하세요. 커뮤니케이션 앱 LINE의 모바일 클라이언트를 개발하고 있는 Ishikawa입니다.

저희 회사는 높은 개발 생산성을 유지하기 위해 코드 품질 및 개발 문화 개선에 힘쓰고 있습니다. 이를 위해 다양한 노력을 하고 있는데요. 그중 하나가 Review Committee 활동입니다.

Review Committee에서는 머지된 코드를 다시 리뷰해 리뷰어와 작성자에게 피드백을 주고, 리뷰하면서 얻은 지식과 인사이트를 Weekly Report라는 이름으로 매주 공유하고 있습니다. 이 Weekly Report 중 일반적으로 널리 적용할 수 있는 주제를 골라 블로그에 [코드 품질 개선 기법 시리즈](https://techblog.lycorp.co.jp/ko/techniques-for-improving-code-quality-list)를 연재하고 있습니다.

이번에 블로그로 공유할 Weekly Report의 제목은 '실상과 허상'입니다.

## 실상과 허상

다음 `UserNameMapLoader`는 `apiClient`를 통해 조회한 사용자 ID와 이름을 관리합니다. 조회하려는 데이터는 한 번에 모두 가져올 수 없고, '청크(chunk)'로 구분해서 가져올 수 있습니다.

여기서 논의를 단순화하기 위해 다음과 같이 가정하겠습니다.

1. 해당 코드는 특정 스레드에서만 실행된다(스레드 안전성은 고려하지 않아도 됨).
2. 조회할 수 있는 데이터는 변하지 않으며, 청크는 `UserId`별로 정렬되어 있다(시간 경과에 따른 청크 불일치는 고려하지 않아도 됨).

```kotlin
class UserNameMapLoader(private val apiClient: ApiClient) {
    private val userNameMap: MutableMap<UserId, String> = mutableMapOf()
    private var lastChunkIndex: Int = -1

    val loadedUserNameMap: Map<UserId, String>
        get() = userNameMap

    val loadedUserIds: Set<UserId>
        get() = userNameMap.keys

    val decoratedUserNameMap: Map<UserId, String>
        get() = userNameMap.mapValues { (_, value) -> "**$value**" }

    ...

    fun loadNextChunk() {
        val response = apiClient.requestChunk(lastChunkIndex + 1) as? Success
            ?: return

        userNameMap += response.chunk.toMapEntries()
        lastChunkIndex++
    }
}
```

이 코드에 개선해야 할 점이 있나요?

### 돌은 제멋대로 굴러간다

다음 코드를 실행하면 `userNameMap`과 `decoratedUserNameMap`의 값에 일관성이 없는 것처럼 보입니다.

```kotlin
val userNameMap = loader.loadedUserNameMap
val userIds = loader.loadedUserIds
val decoratedUserNameMap = loader.decoratedUserNameMap

loadNextChunk()

println(userNameMap) // Shows {3=Alice, 5=Bob, 7=Charlie, 11=Dave}
println(userIds) // Shows [3, 5, 7, 11]
println(decoratedUserNameMap) // Shows {3=**Alice**, 5=**Bob**}
```

세 로컬 변수는 `Map`또는 `Set`이므로 모두 읽기 전용(unmodifiable/readonly)입니다. 하지만 가변성(mutability)에는 차이가 있습니다.

* `loadedUserNameMap`: 원본 `Map`에 대한 참조. `loader`에 의해 변경될 수 있음.
* `loadedUserIds`: 원본 `Map`의 키에 대한 뷰(view). `loader`에 의해 변경될 수 있음.
* `decoratedUserNameMap`: 속성 접근 시 생성된 `Map` 복사본. `loader`가 어떠한 작업을 하더라도 변경되지 않음.

이 문제를 해결하기 위한 옵션이 몇 가지 있습니다.

### 옵션 1: 요소에 대한 접근만 허용

`Map`이나 `Set`을 반환하지 않고 개별 `UserId`에 대해 이름을 반환하도록 하면, 이후 진행되는 업데이트에 신경 쓰지 않아도 됩니다.

```kotlin
class UserNameMapLoader(private val apiClient: ApiClient) {
    private val userNameMap: MutableMap<UserId, String> = mutableMapOf()

    fun getName(userId: UserId): String? = userNameMap[userId]

    ...
```

다만 이를 구현하려면 `UserId` 목록을 별도로 관리해야 하며, `loadNextChunk()`를 `loadNamesFor(userIds: List<UserId>)`로 변경해야 합니다.

### 옵션 2: 복사본만 반환

경우에 따라 후속 처리를 위해 컬렉션을 반환하고 싶을 때도 있습니다. 이런 경우에는 반드시 복사본을 반환하도록 하는 것도 하나의 방법입니다.

```kotlin
class UserNameMapLoader(...) {
    private val userNameMap: MutableMap<UserId, String> = mutableMapOf()

    fun createUserNameMapSnapshot(): Map<UserId, String> =
        userNameMap.toMap() // `toMap` is to create a copy of the map.

    ...
```

함수 이름에 "create", "snapshot", "copy", "clone", "newInstance" 등을 추가하면 복사본이 반환된다는 것을 명확하게 나타낼 수 있습니다. 또한, `toMap`이나 `toList`에 주석을 달면 다른 개발자가 실수로 복사본 생성 코드를 삭제하는 것을 방지할 수 있습니다.

다만, 이 방법은 성능에 영향을 미칠 수 있으므로 주의해야 합니다(Swift의 `Array`와 같은 카피 온 라이트(copy-on-write) 메커니즘이 있다면 이를 활용하는 것이 좋습니다).

### 옵션 3: 직접 참조만 반환

다른 옵션을 적용할 수 없는 경우에는 원본 컬렉션에 대한 참조를 그대로 반환해야 할 때도 있습니다. 다만, (가령 단일 스레드일지라도) 컬렉션이 처리되는 동안 해당 컬렉션이 변경될 수 있다는 점에 유의해야 합니다. 따라서 해당 주의사항을 문서에 언급해야 합니다.

```kotlin
class UserNameMapLoader(...) {
    private val userNameMap: MutableMap<UserId, String> = mutableMapOf()

    /**
     * A map with UserId as the key and usernames.
     *
     * This map is read-only, but the contents can be changed through
     * operations on this `UserNameMapLoader`.
     */
    val userNameMap: Map<UserId, String> = mutableUserNameMap

    ...
```

이 옵션을 적용하려면 *컬렉션을 순회하는 함수(`filter`/`map`/`flatMap`...)는 호출자에서 수행해야 합니다*. 만약 로직을 공통화해야 하는 경우라면 호출 대상 멤버로 구현하는 대신 유틸리티 함수를 구현하는 등의 방법으로 의존성을 정리하시기 바랍니다.
> 한 줄 요약: 함수의 반환값이 조회 후 변경될 수 있는지를 명확히 밝힌다.
>
>
> 키워드: `view of collection`, `copied value`, `mutability`