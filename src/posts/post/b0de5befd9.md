안녕하세요, 여기어때 전시개발팀 백엔드 개발자 엉입니다.

과거 웹 서비스 개편 프로젝트를 진행하면서 기존 PHP 기반 시스템을 대체할 새로운 백엔드를 Kotlin으로 구축한 경험이 있습니다. 신규 시스템 설계 단계에서 복잡한 숙박 상품 전시 로직을 명확하게 표현하기 위해 KotlinDSL을 활용하였습니다.

웹을 개편한지는 오랜 시간이 지났지만, 당시 KotlinDSL을 처음 적용하며 고민했던 경험을 공유드리고자 합니다.

### DSL이란?

![](https://cdn-images-1.medium.com/max/1024/0*0xNGvjak8lg83rL5.png)

DSL(Domain-Specific Language)은 특정 도메인에 특화된 언어입니다. 범용 프로그래밍 언어와 달리, 특정 문제 영역을 해결하는 데 최적화되어 있죠.

가장 익숙한 DSL 예시로는 SQL이 있습니다.

```
SELECT name, price 
FROM rooms 
WHERE category = 'MOTEL' 
  AND price < 100000
ORDER BY price DESC
```

Kotlin에서는 언어 자체의 강력한 기능들을 활용해 내부 DSL을 만들 수 있습니다.

간단한 예시를 보시죠:

```
// 일반적인 객체 생성 방식
val room = Room(
    id = 1L,
    name = "디럭스룸",
    price = 50000,
    checkInTime = "14:00",
    checkOutTime = "12:00"
)
```

```
// DSL 방식
val room = room {
    id = 1L
    name = "디럭스룸"
    price = 50000
    time {
        checkIn = "14:00"
        checkOut = "12:00"
    }
}
```

큰 차이가 없어 보이시나요? 하지만 복잡한 비즈니스 로직이 들어가고 객체의 속성들이 많아지면 얘기가 달라집니다.

### 왜 DSL을 선택했을까?

숙박 상품 전시 도메인은 생각보다 복잡합니다. 카테고리(모텔, 호텔, 펜션 등)에 따라, 회원 등급 등 다양한 정책에 따라 노출되는 정보가 달라집니다.

전시 도메인에 특화된 언어를 만들면 복잡한 정책이 녹여진 코드를 이해하기 쉽지 않을까? 라는 생각에 KotlinDSL을 눈여겨 보게 됩니다.

KotlinDSL을 숙박전시 도메인에 어떻게 적용했는지 모텔 카테고리를 기준으로 설명 드리겠습니다. **대실(Rent)** 과 **숙박(Stay)** 두 가지 상품 타입이 있고, 각각 다른 가격 정책, 재고 상태, 쿠폰 적용 조건을 가지고 있습니다.

#### 기존 방식의 문제점

> “아, 이 객실은 이런 정책에 의해 이렇게 보여지겠구나”라는 그림이 머릿속에 바로 그려지지 않았습니다.

“어떤 조건에서 무엇이 노출되는가?”를 파악하려면 코드를 위아래로 계속 훑어봐야 했으며, 디버깅을 통해 파악했습니다.

정적 팩토리 메서드나 생성자를 사용할 때의 코드 예시 입니다.

```
fun createRoomForPlp(
    roomRentInfo: RoomRentInfo,
    roomStayInfo: RoomStayInfo,
    fullStock: Boolean,
    checkInOut: CheckInOut,
    reservationActive: String,
): LPRoom {
    // STAY 정보 생성
    val stayRoom: LPStayRoom? = if (isNotSoldOut(fullStock)) {
        val stayLabel = if (!fullStock) {
            LPMotelLabelBuilder.createStayLabel(/* ... */)
        } else {
            null
        }
    val stayPrice = LPMotelPriceBuilder.createPriceForPlp(/* ... */)
        val stayCoupon = roomStayInfo.coupon?.let { /* ... */ }
        val stayBadges = LPRoomBadgeBuilder.listOfForSale(/* ... */)
        val staySoldOut = LPMotelSoldOutBuilder.createSoldOutForPlp(/* ... */)
        LPStayRoom(/* ... */)
    } else {
        null
    }
    // RENT 정보 생성 (거의 동일한 로직 반복...)
    val rentRoom: LPRentRoom? = if (isNotSoldOut(fullStock)) {
        val rentLabel = if (!fullStock) { /* ... */ } else { null }
        val rentPrice = LPMotelPriceBuilder.createPriceForPlp(/* ... */)
        val rentCoupon = roomRentInfo.coupon?.let { /* ... */ }
        val rentBadges = LPRoomBadgeBuilder.listOfForSale(/* ... */)
        val rentSoldOut = LPMotelSoldOutBuilder.createSoldOutForPlp(/* ... */)
        LPRentRoom(/* ... */)
    } else {
        null
    }

    // buildType에 따라 다른 조합으로 객체 생성
    return when {
        checkInOut.isContinuousStay() -> {
            LPRoom.create(
                stay = stayRoom,
                rent = null,  // 연박이면 대실 제외
                buildType = LPRoomBuildType.ONLY_STAY
            )
        }
        FilterUtil.isRentFilter(reservationActive) -> {
            LPRoom.create(
                stay = null,  // 대실 필터면 숙박 제외
                rent = rentRoom,
                buildType = LPRoomBuildType.ONLY_RENT
            )
        }
        FilterUtil.isStayFilter(reservationActive) -> {
            LPRoom.create(
                stay = stayRoom,  // 숙박 필터면 대실 제외
                rent = null,
                buildType = LPRoomBuildType.ONLY_STAY
            )
        }
        else -> {
            LPRoom.create(
                stay = stayRoom,
                rent = rentRoom,  // 둘 다 포함
                buildType = LPRoomBuildType.ALL
            )
        }
    }
}
```

한눈에 들어오지 않는 객실 object의 구조, 정책에 따른 노출 조건을 매번 코드베이스로 찾아가며 작업해야 하는 불편함을 해결하기 위해 **가독성**에 집중해서 수정해보기로 합니다.

#### DSL을 적용한 결과

```
fun createRoomForPlp(
    roomRentInfo: RoomRentInfo,
    roomStayInfo: RoomStayInfo,
    fullStock: Boolean,
    checkInOut: CheckInOut,
    reservationActive: String,
): LPRoom =
    motelRoom {
        stay {
            id = roomStayInfo.id
            title = "숙박"
            status = roomStayInfo.status
            soldOut = /* 품절 정보 생성 */
            elite = roomStayInfo.eliteRoom
            isContinuousStay = checkInOut.isContinuousStay()
            
            label = if (!fullStock) {
                /* 재고 없을 때 라벨 생성 */
            } else {
                null
            }
            
            // buildIf 블럭의 조건이 true이면 아래 정보 포함
            name = roomStayInfo.name
            price = /* 가격 정보 생성 */
            coupon = roomStayInfo.coupon?.let {
                /* 쿠폰 정보 생성 */
            }
            badges = /* 배지 리스트 생성 */
            
        } buildIf { isNotSoldOut(fullStock) }
        
        rent {
            id = roomRentInfo.id
            title = "대실"
            status = roomRentInfo.status
            maxUseTime = roomRentInfo.maxUseTime
            soldOut = /* 품절 정보 생성 */
            elite = roomRentInfo.eliteRoom
            
            label = if (!fullStock) /* 재고 없을 때 라벨 생성 */ else null
            
            // buildIf 블럭의 조건이 true이면 아래 정보 포함
            name = roomRentInfo.name
            price = /* 가격 정보 생성 */
            coupon = roomRentInfo.coupon?.let {
                /* 쿠폰 정보 생성 */
            }
            badges = /* 배지 리스트 생성 */
            
        } buildIf { isNotSoldOut(fullStock) }
        
    } buildIf {
        when {
            checkInOut.isContinuousStay() -> RoomBuildType.STAY_ONLY
            isRentFilter(reservationActive) -> RoomBuildType.RENT_ONLY
            isStayFilter(reservationActive) -> RoomBuildType.STAY_ONLY
            else -> RoomBuildType.ALL
        }
    }
```

이 시점에서 제가 가장 중요하게 느낀 변화는 **“코드를 읽는 방식**”이 완전히 달라졌다는 점이었습니다.

기존에는 “이 객체가 왜 이렇게 만들어졌는지”를 이해하려면 여러 팩토리 메서드와 조건 분기를 따라가야 했고, 결국 상용 데이터를 찍어보거나 디버깅에 의존해야 했습니다.

DSL을 적용한 이후에는 이 카테고리에서 어떤 조건일 때 숙박/대실 중 무엇이 노출되는지, 왜 제외되는지가 DSL 코드만 읽어도 바로 드러났습니다.

### 아쉬웠던 점

#### 1. 보이지 않는 곳의 복잡도

DSL을 적용하면서 가장 먼저 느낀 점은 **코드량이 어마어마하게 많아진다**는 것이었습니다.

겉으로 보기엔 깔끔해 보이지만:

```
motelRoom {
    rent {
        // ...
    } buildIf { isNotSoldOut(fullStock) }
    stay {
        // ...
    } buildIf { isNotSoldOut(fullStock) }
} buildIf {
  when {
    checkInOut.isContinuousStay() -> RoomBuildType.STAY_ONLY
    isRentFilter(reservationActive) -> RoomBuildType.RENT_ONLY
    isStayFilter(reservationActive) -> RoomBuildType.STAY_ONLY
    else -> RoomBuildType.ALL
  }
}
```

실제 내부 구현은 이런 코드들이 숨어있습니다:

```
class LPMotelRoomDSL : LPRoomDSL<LPMotelRoom> {
    var stay: LPRoomStay? = null
    var rent: LPRoomRent? = null

    override fun stay(block: LPStayDSL.() -> Unit): LPStayDSL {
        val stayDSL = LPStayDSL()
        stayDSL.block()
        return stayDSL
    }

    fun rent(block: LPRentDSL.() -> Unit): LPRentDSL {
        val rentDSL = LPRentDSL()
        rentDSL.block()
        return rentDSL
    }

    override fun build(): LPMotelRoom {
        return LPMotelRoom(stay = stay, rent = rent)
    }

    infix fun LPStayDSL.buildIf(notSoldOutCondition: () -> Boolean) {
        stay = build(notSoldOutCondition)
    }

    infix fun LPRentDSL.buildIf(notSoldOutCondition: () -> Boolean) {
        rent = build(notSoldOutCondition)
    }

    infix fun buildIf(condition: () -> LPRoomBuildType): LPMotelRoom =
        when (condition()) {
            LPRoomBuildType.ONLY_STAY -> LPMotelRoom(stay = stay)
            LPRoomBuildType.ONLY_RENT -> LPMotelRoom(rent = rent)
            LPRoomBuildType.ALL -> LPMotelRoom(stay = stay, rent = rent)
        }
}
```

**결국 내부적으로는 동일한 분기문과 객체 생성 로직이 있습니다.**

단지 사용하는 쪽에서 깔끔해 보일 뿐, DSL Builder를 만드는 코드는 오히려 일반 방식보다 복잡해질 수 있습니다.

**이게 정말 가치가 있을까?** 고민했던 순간도 있었습니다.

결국 **DSL은 복잡도를 “제거”하는 것이 아니라 복잡도를 “이동”시키는 선택** 이었습니다. 도메인 로직의 복잡도는 DSL Builder 안으로 들어갔고, 그 대가로 **사용하는 쪽의 가독성**을 얻었습니다.

#### 2. 러닝 커브

Kotlin DSL은 여러 고급 기능을 사용합니다:

* Higher-Order Functions
* Extension Functions
* Lambda with Receiver
* Infix Functions

팀원들이 이런 개념들을 이해하고 DSL을 자연스럽게 사용하기까지 **꽤 긴 시간**이 필요했습니다.

특히:

* “왜 `buildIf`가 이렇게 동작하지?”
* “이 블록 안에서 this는 뭘 가리키는 거지?”

이런 질문들이 초반에 많이 나왔습니다.
> **“우리 팀의 Kotlin 숙련도로 DSL을 도입해야 할까?”**

DSL은 강력하지만:

* 팀원 모두가 Kotlin에 익숙해야 함
* DSL 패턴을 이해하고 일관성 있게 사용해야 함
* 새로운 팀원의 온보딩 비용 증가

(AI가 없었다면.. )사실상 DSL 도입은 **시기상조**였을 것 같습니다.

#### 3. 실용적인 판단 기준

**복잡도를 “어디에 둘 것인가“를 선택한 트레이드오프**였다고 생각합니다.

* 앱 대비 케이스 변동이 크지 않음
* 정책이 비교적 고정적
* 무엇보다 가독성이 생산성과 직결되는 영역이라고 판단

당시 기준에서는 충분히 감수할 수 있는 비용이었고,

결과적으로는 **합리적인 선택**이었다고 평가할 수 있을 것 같습니다.

### 그럼에도 불구하고

이런 아쉬운 점들에도 불구하고, DSL 도입은 **긍정적** 이라고 생각합니다. **DSL을 “기술 선택“이 아니라 “이해 비용을 줄이기 위한 선택**”이었습니다.

DSL을 도입함으로써 얻은 가장 큰 가치는 성능이나 코드량 감소가 아니라,

**DSL 코드만 보아도 해당 카테고리에서 어떤 조건일 때 어떤 비즈니스 로직으로 응답 데이터를 만들고 있는지 직관적으로 이해할 수 있었다는 점**이라고 생각합니다.

도메인 정책이 코드 구조 자체로 드러나면서 **‘객체를 생성하는 코드‘가 아니라 ‘도메인을 설명하는 코드’에 가까워졌다는 점**이 분명한 장점으로 느껴졌습니다.

모든 코드를 DSL로 만들 필요는 없습니다. 복잡도가 높고, 가독성이 중요하고, 반복되는 패턴에 선택적으로 적용한다면 복잡한 비즈니스를 이해하기 쉬운 코드를 작성하는데 도움 된다고 생각합니다.