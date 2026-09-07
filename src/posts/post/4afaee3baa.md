## 발단

    // 문제의 코드

    /**
     * 회원의 구매 불가능한 구독형 서비스의 사용 여부.
     */
    private boolean isUsedOldSubscription() {
      return getUsedOldSubscription()
          .map(subscription -> {
            if (validElementByMemberExt(subscription)) {
              return !subscription.getPeriodType().equals("N")
                  && subscription.getExpiredAt().isAfter(now())
                  && this.userStatus == UserStatus.NORMAL;
            }
            return false;
          }).orElse(false);
    }

    private boolean validElementByMemberExt(Subscription subscription) {
      return !Objects.isNull(subscription.getPeriodType())
          && !Objects.isNull(subscription.getExpiredAt());
    }

    public Optional<Subscription> getUsedOldSubscription() {
      return Optional.of(this);
    }

이 코드는 최근 수행한 리팩토링 과정의 일부를 여러분에게 소개하기 위해 가공한 코드입니다. 실제 프로덕션 코드와는 다릅니다.

## 문제의 코드를 작성한 배경

위의 코드는 제가 작년에 작성한 레거시 코드입니다. `Optional` 객체를 처리하기 위해 람다 식을 도입했었던 이력이 있습니다.

* 람다 식은 회원의 구독형 서비스를 사용 중인지 판단하는 처리를 하고 있습니다.
  * 일회용 로직을 처리하기에 람다 식이 좋다고 생각했습니다.
* 메소드 이름은 크게 고민하지 않고 지었습니다.

당시의 저는 이 정도 코드라면 문제를 충분히 해결한 것이라고 생각했습니다. 그리고 작업을 마친 다음 뿌듯한 느낌으로 **신나게 퇴근**을 했습니다. 🙀

그러나 몇 주 후 다시 이 코드를 보자 전에는 맡지 못했던 냄새를 맡게 되었습니다.

이 코드는 무엇이 문제였을까요?

## 냄새의 근원

    .map(subscription -> {
      if (validElementByMemberExt(subscription)) {
        return !subscription.getPeriodType().equals("N")
            && subscription.getExpiredAt().isAfter(now())
            && this.userStatus == UserStatus.NORMAL;
      }
      return false;
    }).orElse(false);

이 코드의 문제는 무엇을 말하려 하는 코드인가? 네 맞습니다. 제가 마주한 악취의 근본적인 원인은 **가독성**이었습니다.

* 변수와 메소드 이름이 일단 무엇을 말하는지 알 수가 없어 잘 읽히지 않습니다.
* 람다 식 하나가 표현하고 있는 내용이 복잡하여 이해하기 쉽지 않습니다.
* 람다 식을 사용한 다음의 결과로 이어지는 파이프라인이 자연스럽지 않아 흐름을 파악하기 어렵습니다.
* 이 코드를 수정해야 할 동료의 입장을 생각하니 막막했습니다.
* 굳이 람다 식을 사용해야 하나라는 의문이 문득 들었습니다.

## 개선해보자!

그래서 저는 이 코드를 개선해보기로 결심했습니다.

동료 [이종립](https://github.com/johngrib)에게 부탁하여 함께 짝 프로그래밍을 하면서 천천히 고쳐나갔습니다.

### 위 코드가 하는 일

개선을 위해 문제의 코드가 처리하는 일을 먼저 생각해 보았습니다.

1. 회원의 현재는 구매할 수 없는 구독형 서비스가 사용 여부를 판단합니다.
2. 회원은 정상 회원 이여야 합니다 -\> NORMAL
3. 기간 타입(년, 월)의 값이 `N`이 아니어야 합니다.
4. 만료 일자가 오늘보다 이후여야 합니다.

즉, 이 메소드는 다음과 같이 행동해야 합니다.

* 다음의 경우 `false`를 리턴합니다.
  * 회원 상태가 NORMAL 이 아닌 경우.
  * 만료 일자가 오늘 전인 경우.
  * 기간 타입이 `N`인 경우.
  * 위의 세 가지 조건에 해당하는 필드 값들 중 하나라도 `null`인 경우.
* 다음의 조건을 모두 만족하는 경우에만(AND) `true`를 리턴합니다.
  * 회원 상태가 `NORMAL`인 경우.
  * 만료 일자가 오늘 이후인 경우.
  * 기간 타입이 `N`이 아닌 경우.
  * 위의 세 가지 조건에 해당하는 필드 값들이 `null`이 아닌 경우.

이 메소드가 하는 일에 맞게 리팩토링을 시작하였습니다.

### 먼저 메소드 이름을 의미 있게 고쳐봅시다

첫 번째로 메소드 이름을 `isUsedOldSubscription` 에서 `isValidSubscription`로 변경했습니다.

`isUsedOldSubscription`는 올바른 메소드 이름이 아니었기 때문입니다.

왜냐하면 이 로직은 레거시 시스템의 구독 서비스인지 아닌지를 검사한다기보다는 유효한 구독 서비스인지를 검사하고 있었기 때문입니다.

게다가 "old" 라는 단어는 시간에 의존하고 있어 지나치게 상대적이기 때문에 적합하지 않다고 판단했습니다.

### 여러 개의 작은 메소드로 분리해 봅시다

그다음에 한 일은 읽기 어려운 로직을 매우 단순한 `private` 메소드들로 분리한 것이었습니다.

    private boolean hasValidPeriod() {
      return !Objects.isNull(this.getPeriodType());
    }

이 메소드는 기간 필드가 올바른지 아닌지를 확인합니다.

메소드 내부에 기간 필드를 검증하는 방법을 캡슐화하고 있습니다.

기간 필드를 검증하는 방법이 바뀌어야 한다면 이 메소드 내부만 고치면 됩니다.

같은 방법으로 다음과 같이 4개의 `private` 메소드를 분리했습니다.

* 만료 날짜가 올바른지 아닌지를 확인하는 메소드
* 사용 가능한지 아닌지를 확인하는 메소드
* 구독 서비스가 만료됐는지 아닌지 확인하는 메소드
* 회원 상태가 `NORMAL`인지 아닌지 확인하는 메소드

    private boolean hasValidExpireDate() {
      return !Objects.isNull(this.getExpiredAt());
    }

    private boolean isUsable() {
      return !this.getPeriodType().equals("N");
    }

    private boolean isNotExpired() {
      return this.getExpiredAt().isAfter(now());
    }

    private boolean isUserStatusNormal() {
      return this.userStatus == UserStatus.NORMAL;
    }

### 검증 흐름을 읽기 쉽게 고쳐 봅시다

그 후, 위에서 작성한 `private` 메소드를 사용해 검증 흐름을 만들어 보았습니다.

검증 흐름은 다음과 같습니다.

1. 필드의 유효성을 확인하고, 유효하지 않다면 `false`를 리턴한다.
2. 회원의 상태를 확인하고, 유효하지 않다면 `false`를 리턴한다.
3. ...(후략)

## 결과: Before와 After를 비교해 봅시다

위와 같은 작업을 한 결과 다음과 같은 코드가 완성되었습니다.

    /* After 짜잔 */
    private boolean isValidSubscription() {
      if (!hasValidPeriod()) {
        return false;
      }
      if (!hasValidExpireDate()) {
        return false;
      }
      return isUserStatusNormal()
        && isUsable()
        && isNotExpired();
    }

취향에 따라 다음과 같이 `if` 문을 제거할 수도 있습니다.

    /* if 를 없앤 경우 */
    private boolean isValidSubscription() {
      return hasValidPeriod()
        && hasValidExpireDate()
        && isUserStatusNormal()
        && isUsable()
        && isNotExpired();
    }

Before 메소드를 다시 한번 봐볼까요? 어느 쪽이 더 읽기 편한가요?

    /* Before */
    private boolean isUsedOldSubscription() {
      return getUsedOldSubscription()
          .map(subscription -> {
            if (validElementByMemberExt(subscription)) {
              return !subscription.getPeriodType().equals("N")
                  && subscription.getExpiredAt().isAfter(now())
                  && this.userStatus == UserStatus.NORMAL;
            }
            return false;
          }).orElse(false);
    }

`After 짜잔` 코드는 아래와 같은 점이 개선되었습니다.

* 필드들의 의미를 메소드 명으로 이해할 수 있게 되었습니다.
* 빠른 리턴이 있기 때문에, 코드를 읽으면서 각종 조건을 머릿속에 모두 넣어두지 않아도 됩니다.
* 코드의 라인 수는 몇 줄 더 길어졌지만 단순한 `if` 문으로 인해 열심히 생각하지 않아도 됩니다.
* 이 로직에 대한 도메인 지식이 없는 **신입 개발자도 이 코드를 이해할 수 있습니다**.

## 후기

이 활동을 하면서 예전에는 생각하지 못했던 교훈을 얻을 수 있었습니다. 습관적으로 가독성을 고려하지 않은 채 람다 식으로 작성하던 지난날에 대해 반성할 수 있었고. 이 코드를 읽을 동료들의 입장에서 코드를 작성해야겠다는 점과 앞으로는 람다 식의 코드가 가독성에 불편함을 전한다면 람다 식을 사용하지 않은 코드와 비교 후에 판단하는 리팩토링 하는 습관을 들여야겠다는 생각이 들었습니다. 비록 길지 않은 코드이고, 더 많은 내용을 담지는 못했지만 저 스스로에게는 많은 생각을 들게 해준 값진 시간이었습니다.

한편 조슈아 블로흐의 "이펙티브 자바 3/E"를 찾아봤더니 아이템 42에서 다음과 같은 문장이 있었습니다.

![이펙티브 자바 3판의 아이템 42를 캡처한 이미지](https://helloworld.kurly.com/_astro/effective-java.5hHtMOnW_Z2kgBjo.webp)

아 진작, 책을 먼저 찾아봤더라면 좋았을 텐데!

역시 이래서 공부를 열심히 해야 하나 봅니다. 🤗

감사합니다!