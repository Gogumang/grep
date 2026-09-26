![NHN Cloud_meetup banner_Resilience4j_202408_900.png](https://images.gogumang.com/de6abd63d9/01.png)

## 들어가며

### 무더운 여름날, 전기가 갑자기 끊긴 경험이 있으신가요?

이는 누전 차단기(Circuit Breaker)가 작동하여 과전류로 인한 사고를 방지하기 때문입니다. 누전 차단기는 내부의 배선 차단기가 과전류를 감지하면 전기를 차단해 더 큰 피해를 예방하는 중요한 역할을 합니다.

이 원리는 소프트웨어 시스템에서도 비슷하게 적용됩니다. NHN Cloud에서는 Resilience4j Circuit Breaker를 도입하여 시스템의 안정성을 높이고, 더 큰 장애 상황으로 이어질 수 있는 문제를 효과적으로 예방할 수 있었습니다. 이번 글에서는 Resilience4j Circuit Breaker를 적용하며 경험한 내용을 중심으로 아래의 주제에 대해 자세히 소개하고자 합니다.

* 문제 상황: Circuit Breaker를 적용하게 된 배경
* Resilience4j Circuit Breaker의 동작 원리
* Resilience4j Circuit Breaker 설정 옵션

## 문제 상황: Circuit Breaker를 적용하게 된 배경

### 서비스 장애 발생

현대의 많은 서비스들은 API(application programming interface)나 RPC(remote procedure call)를 통해 데이터를 주고받습니다. 그런데 만약 특정 서비스가 응답하지 않는다면 어떤 일이 발생할까요? 호출한 서비스는 설정된 타임아웃 시간이 지날 때까지 응답을 기다리게 되고, 이로 인해 다른 서비스에도 **연쇄적인 영향을 미쳐 심각한 장애**로 이어질 수 있습니다.

![NHN Cloud_meetup diagram_Resilience4j_01_2408_900.png](https://images.gogumang.com/de6abd63d9/02.png)

### 타임아웃이 왜 서비스 장애로 이어질까?

애플리케이션은 작업을 처리하기 위해 스레드를 할당받아 실행합니다. 그러나 스레드 풀은 유한하기 때문에 동시에 처리할 수 있는 작업의 수에도 한계가 있습니다.

![NHN Cloud_meetup diagram_Resilience4j_02_2408.png](https://images.gogumang.com/de6abd63d9/03.png)

위 그림에서처럼 서비스 A와 관련된 요청이 증가하면서, 스레드 풀이 점점 더 많은 요청을 처리하게 되고, 결국 모든 스레드를 점유하게 됩니다. 이후 들어오는 요청들은 대기 큐에 쌓이게 되며, 대기 시간 동안 처리되지 못한 요청은 타임아웃이 발생합니다. 즉, 스레드 풀이 가득 찬 상태에서는 새로운 요청을 처리할 수 없어 서비스 장애가 발생하게 됩니다.

### Circuit Breaker로 문제 해결하기

위와 같은 상황에서 Circuit Breaker를 도입하면 문제를 효과적으로 해결할 수 있습니다. Circuit Breaker는 서비스 호출의 실패율이 설정된 임곗값을 초과할 경우, 해당 서비스 호출을 즉시 차단하고 오류를 발생시킵니다. 이렇게 하면 A 서비스가 응답하지 않아 스레드 풀의 모든 스레드를 장시간 점유하는 상황을 방지할 수 있습니다. Circuit Breaker는 문제 발생 시 즉시 대응하여 시스템 전체에 미치는 영향을 줄이고, 장애가 전파되는 것을 방지합니다.

## Resilience4j란?

먼저 Resilience4j Circuit Breaker 소개에 앞서 Resilience4j가 무엇인지 간단하게 소개하겠습니다.

Resilience4j는 Netflix Hystrix로부터 영감을 받은 **함수형 프로그래밍(functional programming)으로 설계된, 경량의 내결함성(fault tolerance) 라이브러리**입니다. Resilience4j는 Circuit Breaker 이외에 다른 핵심 모듈인 Bulkhead, RateLimiter, Retry, TimeLimiter, Cache을 제공하고 있습니다.
> 현재 Netflix Hystrix는 maintenance 모드이며, Resilience4j 사용을 권장하고 있습니다.

## Circuit Breaker란?

Circuit Breaker는 **CLOSED** , **OPEN** 및 **HALF_OPEN** 의 세 가지 일반 상태와 **DISABLED** 및 **FORCED_OPEN** 의 두 가지 특수 상태를 갖는 **유한 상태 머신** 입니다. 그리고 Circuit Breaker 동작을 이해하기 위해 필요한 `상태`와 `슬라이딩 윈도우`라는 2가지 주요 요소가 있습니다.

### 상태(State)

![NHN Cloud_meetup diagram_Resilience4j_03_2408_900.png](https://images.gogumang.com/de6abd63d9/04.png)

* 일반 상태
  * CLOSED: 정상적으로 요청을 처리할 수 있는 상태입니다.
  * OPEN: 장애 상황으로 간주하여 이후 모든 요청에 대해 거부하는 상태입니다.
  * HALF_OPEN: 연동된 서비스의 장애 여부를 확인하기 위해 일시적으로 호출을 허용하는 상태이고 결과에 따라 상태를 전환합니다.
* 특수 상태
  * DISABLED: Circuit Breaker가 비활성화된 상태입니다. 즉, Circuit Breaker를 적용하지 않았을 때와 동일하게 동작합니다.
  * FORCED_OPEN: 특정 조건에서 강제로 OPEN 상태로 변경되어 요청에 대해 처리할 수 없는 상태입니다.

### 슬라이딩 윈도우(Sliding Window)

슬라이딩 윈도우는 시간 기반(Time-Based)과 개수 기반(Count-Based)의 2가지 타입을 갖습니다.

* Time-Based: **특정 기간(Duration)** 의 호출 결과를 저장하는 슬라이딩 윈도우를 제공합니다.
* Count-Based: **특정 개수(Count)** 의 호출 결과를 저장하는 슬라이딩 윈도우를 제공합니다.

## Circuit Breaker 동작

Circuit Breaker는 **슬라이딩 윈도우 기반으로 호출(call) 결과를 기록 및 집계하고 그 결과에 따라 상태를 전환**합니다.

기본적으로 CLOSED 상태로 시작되며, 연동된 서비스의 호출 결과를 `성공` 또는 `실패`로 기록합니다. 이때, 실패로 기록된 호출 결과의 비율이 설정한 임계치를 초과하게 되면 연동된 서비스를 장애 상태로 판단하여 OPEN 상태로 전환됩니다.

이후 Circuit Breaker는 설정에 의해 HALF_OPEN 상태로 전환될 수 있습니다. HALF_OPEN 상태에서는 일부 요청을 연동된 서비스로 호출하고 그 결과에 따라 CLOSED 또는 OPEN 상태로 전환합니다.

## Circuit Breaker 설정 옵션

Resilience4j Circuit Breaker의 각 설정 옵션에 대한 정확한 이해를 바탕으로 보다 명확하게 사용자의 의도에 맞게 설정할 수 있습니다. 공식 문서에 명시된 설명과 유의 사항을 소개하겠습니다.

### failureRateThreshold

```java
// 0 < failureRateThreshold <= 100 범위 내 설정, Default = 50
failureRateThreshold(float failureRateThreshold)
```

호출 결과의 실패율(%)에 대한 임계치를 설정합니다. 호출 결과의 실패율(%)이 설정한 임계치 이상일 때 Circuit Breaker는 OPEN 상태로 전환됩니다.

### slowCallDurationThreshold

```java
// Default = 60s(초)
slowCallDurationThreshold(Duration slowCallDurationThreshold)
```

느린 요청의 판단 기준을 설정합니다. 호출 결과를 받기까지의 시간이 설정한 값 이상으로 소요될 때 느린 요청으로 결과가 집계됩니다.

호출 성공 또는 실패 여부와 상관없이 호출 결과를 받기까지 소요된 시간을 기준으로 판단합니다. 실패했지만 느린 요청은 요청 횟수뿐 아니라 요청 실패 횟수도 증가합니다.

![NHN Cloud_meetup diagram_Resilience4j_04_2408.png](https://images.gogumang.com/de6abd63d9/05.png)

CircuitBreakerStateMachine 클래스에는 내부적으로 AbstractAggregation을 상속 받은 TotalAggregation 객체를 가지고 있고, 이 객체에서 호출 결과에 따라 그 수를 각각 저장합니다. 위 화면에서 호출 결과가 SLOW_SUCCESS, SLOW_ERROR일 때 numberOfSlowCalls 카운트를 증가시키고 있습니다. 즉 **호출 성공 또는 실패 여부와 상관없이 느린 요청의 수를 증가**시킵니다.

### slowCallRateThreshold

```java
// 0 < slowCallRateThreshold <= 100 범위 내 설정, Default = 100
slowCallRateThreshold(float slowCallRateThreshold)
```

느린(slow) 요청 비율(%)에 대한 임계치를 설정합니다. 느린 요청 비율(%)이 설정한 임계치 이상일 때 Circuit Breaker는 OPEN 상태로 전환됩니다.

### slidingWindowType

```java
// Default = COUNT_BASED
slidingWindowType(SlidingWindowType slidingWindowType)
```

슬라이딩 윈도우 타입을 설정합니다. COUNT_BASED와 TIME_BASED 2가지 타입이 존재합니다.

### slidingWindowSize

```java
// Default = 100
slidingWindowSize(int slidingWindowSize)
```

슬라이딩 윈도우의 사이즈를 설정합니다. 슬라이딩 윈도우 타입에 따라 설정한 값의 의미가 다릅니다.

* TIME_BASED: slidingWindowSize 값은 초(second) 단위이며, 600으로 설정할 경우 600초를 의미합니다.
* COUNT_BASED: slidingWindowSize 값은 개수 단위이며, 100으로 설정할 경우 100개의 요청 수를 의미합니다.

Time/Count Based 2가지 타입 모두 현재를 기준으로 합니다. 즉, Time-Based는 최근 x초 동안의 호출을 기록하고, Count-Based는 최근 x개의 호출 수를 기록합니다.

### minimumNumberOfCalls

```java
// Default = 100
minimumNumberOfCalls(int minimumNumberOfCalls)
```

임계치 초과 여부를 판단하기 위한 최소 호출 수에 대해 설정합니다.
> Q. 만약 이 값이 없다면? 최초 1개의 요청이 실패하면 즉시 실패율이 100%가 되어 Circuit Breaker 상태가 변경될 수 있습니다. 따라서, 임계치 초과 여부를 판단하기 위해 최소한의 호출 수가 필요합니다.

#### **유의 사항**

이 설정 값의 실제 동작에서의 역할과 유의 사항은 아래와 같습니다.

* 최소 호출 수에 도달할 때까지 Circuit Breaker는 CLOSED 상태를 유지합니다.

* 슬라이딩 윈도우가 시간 기반(Time-Based)일 경우에도 이 설정 값은 시간이 아닌 `개수`입니다.

* 슬라이딩 윈도우가 시간 기반(Time-Based)일 경우 시간이 지나면서 이전 호출 결과가 슬라이딩 윈도우에 포함되지 않을 경우가 있습니다.

  * 따라서 슬라이딩 윈도우에 기록 및 집계된 호출 결과의 수가 최소 요청 수를 만족할 때까지 상태를 전환하지 않습니다.
  * 예: 슬라이딩 윈도우의 사이즈가 30분일 때 14시 30분\~15시까지 100개의 요청이 있고 15시부터 요청이 없다면, 15시 30분 기준에서는 단 하나의 요청도 없기 때문에 다시 최소 요청 수에 도달하기 전까지 임계치 초과 여부를 판단할 수 없습니다.
* HALF_OPEN 상태일 때 **permittedNumberOfCallsInHalfOpenState에 설정된 값과 minimumNumberOfCalls 값 중 최솟값을 사용**합니다.

  * 예: permittedNumberOfCallsInHalfOpenState=10, minimumNumberOfCalls=5일 경우, Circuit Breaker는 HALF_OPEN 상태일 때 5개의 호출 결과에 대해 임계치를 계산하여 상태를 전환합니다.

### permittedNumberOfCallsInHalfOpenState

```java
// Default = 10
permittedNumberOfCallsInHalfOpenState(int permittedNumberOfCallsInHalfOpenState)
```

Circuit Breaker가 HALF_OPEN 상태일 때 허용 가능한 호출 수를 설정합니다.
> minimumNumberOfCalls 유의 사항 4번 참고

### waitDurationInOpenState / waitIntervalFunctionInOpenState

```java
// Default = 60s(초)
waitDurationInOpenState(Duration waitDurationInOpenState)
waitIntervalFunctionInOpenState(IntervalFunction waitIntervalFunctionInOpenState)
```

Circuit Breaker가 OPEN 상태에서 HALF_OPEN 상태로 전환하기 위해 필요한 대기 시간을 설정합니다. 이 설정 값만큼 Circuit Breaker는 OPEN 상태를 유지해야 함을 의미합니다.

waitIntervalFunctionInOpenState를 사용하면 interval function에 대해 커스터마이징이 가능합니다.
> 반드시 하나만 설정해야 하고, 모두 설정하면 오류가 발생합니다.

### automaticTransitionFromOpenToHalfOpenEnabled

```java
// Default = false
automaticTransitionFromOpenToHalfOpenEnabled(boolean enableAutomaticTransitionFromOpenToHalfOpen)
```

Circuit Breaker가 OPEN 상태에서 HALF_OPEN 상태로 전환 시 자동화 여부에 대해 설정합니다. 만약 true로 설정되었다면, waitDurationInOpenState에서 설정한 시간이 지나면 자동으로 OPEN 상태에서 HALF_OPEN 상태로 전환합니다.

### maxWaitDurationInHalfOpenState

```java
// Default : minimumNumberOfCalls 값만큼 호출 후 OPEN 또는 CLOSED 상태로 전환될 때까지 HALF_OPEN 상태 유지 
maxWaitDurationInHalfOpenState(Duration maxWaitDurationInHalfOpenState)
```

Circuit Breaker가 HALF_OPEN 상태로 최대 몇 초 동안 유지될지에 대한 값을 설정합니다. 설정된 시간이 지나면 Circuit Breaker는 OPEN 상태로 전환합니다.

### writableStackTraceEnabled

```java
// Default = false
writableStackTraceEnabled(boolean writableStackTraceEnabled)
```

오류 발생 시 stackTrace 출력 여부에 대한 설정 값입니다. false로 설정된다면 Exception.getStackTrace() 호출 시 길이가 0인 배열을 반환합니다. Circuit Breaker가 OPEN 상태일 때 받는 요청은 이미 CLOSED 상태에서 인지한 오류와 동일할 가능성이 크기 때문에 스팸성 로그를 줄이는 데 유용할 수 있습니다.

### recordException

```java
recordException(Predicate\<Throwable> predicate)
```

실패로 기록될 오류를 판단하는 조건문을 설정합니다. 조건문에 의해 true가 반환되면 해당 오류는 실패로 기록됩니다. 반대로 오류가 성공으로 간주되어야 하는 경우 false로 반환되어야 합니다.
> IgnoreExceptions, ignoreException에 의해 설정된 오류는 제외 가능

### recordResult

```java
recordResult(Predicate\<Object> predicate)
```

응답 결과의 성공/실패에 대해 판단하는 조건문을 설정합니다. 오류가 발생하지 않더라도 특정 응답 결과가 실패로 기록되어야 한다면 해당 조건문에 의해 true가 반환되어야 합니다.

### ignoreException

```java
ignoreException(Predicate<Throwable> predicate)
```

결과에 포함하지 않을 오류를 판단하는 조건문을 설정합니다. 조건문에 의해 true가 반환되는 오류는 성공/실패로 기록되지 않으며 호출 내역에 집계되지 않습니다.

## 예제

앞서 소개한 내용을 바탕으로 설정 값에 따라 Circuit Breaker가 어떻게 동작하는지 예제를 통해 소개하겠습니다. 예제를 소개하기 앞서, Circuit Breaker는 아래와 같이 설정되었다고 가정하겠습니다.

* 슬라이딩 윈도우: Count-Based, Size=10
* 최소 호출 수: 6개
* 실패 임계치: 50%

### 1) Circuit Breaker 상태가 CLOSED 상태를 유지하는 경우: 현재 Circuit Breaker 상태 \[CLOSED\]

#### Case 1-1) 최소 호출 수를 받지 않은 경우

![NHN Cloud_meetup diagram_Resilience4j_05_2408.png](https://images.gogumang.com/de6abd63d9/06.png)

위 그림에서 5개의 호출 중 3개가 실패하여, **실패율은 60%** 가 되었어도 요청 수가 최소 호출 수를 만족하지 않았으므로 **Circuit Breaker는 CLOSED 상태를 유지**합니다. 하지만, 6번째 요청을 받게 되면 최소 호출 수를 만족하게 되고 해당 호출의 결과가 SUCCESS라고 하더라도 실패율이 50%가 되어 Circuit Breaker의 상태는 OPEN으로 전환됩니다.

#### Case 1-2) 실패 임계치 미만인 경우

![NHN Cloud_meetup diagram_Resilience4j_06_2408.png](https://images.gogumang.com/de6abd63d9/07.png)

위 그림에서 6개의 호출 중 2개가 실패하여 **실패율은 약 33** %가 되었습니다. 실패 임계치인 50%를 만족하지 않아 **Circuit Breaker는 CLOSED 상태**를 유지합니다.

### 2) Circuit Breaker 상태가 CLOSED → OPEN 상태로 전환되는 경우: 현재 Circuit Breaker 상태 \[CLOSED\]

#### Case 2-1) 실패 임계치 이상인 경우 (1)

![NHN Cloud_meetup diagram_Resilience4j_07_2408.png](https://images.gogumang.com/de6abd63d9/08.png)

위 그림에서 6개의 호출 중 3개가 실패하여 **실패율은 50** %가 되었습니다. 실패 임계치인 50%를 만족하여 **Circuit Breaker는 OPEN 상태로 전환**됩니다.

#### Case 2-2) 실패 임계치 이상인 경우 (2)

![NHN Cloud_meetup diagram_Resilience4j_08_2408.png](https://images.gogumang.com/de6abd63d9/09.png)

슬라이딩 윈도우에 저장된 10개의 호출 중 5개가 실패하여 **실패율은 50** %가 되었습니다. 실패 임계치인 50%를 만족하여 **Circuit Breaker는 OPEN 상태로 전환**됩니다.

위 그림에서 마지막 호출이 14번째 호출인 이유는 이전 요청의 결과는 슬라이딩 윈도우에 저장되지 않기 때문입니다. 슬라이딩 윈도우의 사이즈가 10이므로 이전에 받았던 1\~4번째 요청의 결과는 실패율을 계산하는 데 사용되지 않습니다.

### 3) Circuit Breaker 상태가 HALF_OPEN → CLOSED 상태로 전환되는 경우: 현재 Circuit Breaker 상태 \[HALF_OPEN\]

#### Case 3-1) 실패 임계치 미만인 경우

![NHN Cloud_meetup diagram_Resilience4j_09_2408.png](https://images.gogumang.com/de6abd63d9/10.png)

위 그림에서 6개의 호출 중 2개가 실패하여 **실패율은 약 33** %가 되었습니다. 실패 임계치인 50% 미만이기 때문에 정상화되었다고 판단하고 **Circuit Breaker는 CLOSED 상태**로 전환됩니다.

Circuit Breaker가 CLOSED 상태일 때와 다르게 HALF_OPEN 상태에서는 permittedNumberOfCallsInHalfOpenState에 설정된 값만큼 호출 결과를 기록 및 집계할 수 있습니다. 즉, HALF_OPEN 상태에서는 슬라이딩 윈도우를 사용하지 않고 permittedNumberOfCallsInHalfOpenState에 설정된 값만큼의 호출 수 내에서 판단합니다.

추가로 permittedNumberOfCallsInHalfOpenState 설정 값이 minimum call 설정 값보다 작을 경우, permittedNumberOfCallsInHalfOpenState 설정 값만큼 호출하여 그 결과에 따라 상태를 전환합니다. (아래 그림 참고)

![NHN Cloud_meetup diagram_Resilience4j_10_2408.png](https://images.gogumang.com/de6abd63d9/11.png)

### 4) Circuit Breaker 상태가 HALF_OPEN → OPEN 상태로 전환되는 경우: 현재 Circuit Breaker 상태 \[HALF_OPEN\]

#### Case 4-1) 실패 임계치 이상인 경우

![NHN Cloud_meetup diagram_Resilience4j_11_2408.png](https://images.gogumang.com/de6abd63d9/12.png)

위 그림에서 6개의 호출 중 3개가 실패하여 **실패율은 50%** 가 되었습니다. 실패 임계치인 50%를 만족하여 **Circuit Breaker는 OPEN 상태로 전환**됩니다.

#### Case 4-2) maxWaitDurationInHalfOpenState 설정 값만큼 대기한 이후

![NHN Cloud_meetup diagram_Resilience4j_12_2408.png](https://images.gogumang.com/de6abd63d9/13.png)

최소 호출 수만큼 요청을 받기 전에 maxWaitDurationInHalfOpenState에 설정된 값만큼 시간이 지나면 Circuit Breaker는 OPEN 상태로 전환합니다. 해당 시간 동안 받은 응답의 결과와 상관없이 무조건 OPEN 상태로 전환합니다.

# 나가며

Resilience4j Circuit Breaker 공식 문서는 설명이 잘 되어 있지만 각 설정을 통해 Circuit Breaker가 어떻게 동작하는지 이해하는 데 어려움을 느껴 이 글을 쓰게 되었습니다. 앞으로 Resilience4j Circuit Breaker를 적용하실 분들께 이 글이 많은 도움이 되었으면 좋겠습니다.

## 참고 문헌

* <https://resilience4j.readme.io/docs/circuitbreaker>

[![NHN Cloud_meetup banner_footer_gray_202408_900.png](https://images.gogumang.com/de6abd63d9/14.png)](https://www.nhncloud.com/kr)