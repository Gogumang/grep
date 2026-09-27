## 서론

소프트웨어 시스템의 모든 함수 및 메서드는 어떤 일을 합니다. 8비트 페미콤 시절에는(너무 아재스럽나요?) 함수 하나로 화면에 \*\*\* 를 출력하는 소프트 웨어를 만들었습니다. 하지만 지금은 롤 플레임 게임이나 상품 추천과 같은 복잡한 기능을 제공하지요. 그래서 하나의 함수로 소프트웨어를 만들 수 없을 만큼 요구 사항은 복잡합니다. 여러 가지 함수나 메서드들이 유기적으로 얽혀서 소프트웨어가 완성됩니다. 게다가 여러 개발자들이 유기적으로 동시에 여러 기능을 개발합니다.

인기 있는 소프트웨어는 기능이 점차 복잡해집니다. 그래서 개발자를 더 많이 투입합니다. 그러므로 시장에서 개발자에 대한 수요는 항상 끊이지 않습니다. 하지만 현실은 프로젝트에 투입된 개발자는 많아졌지만 소프트웨어를 개발하는 속도와 기능 추가 속도는 비례하지 않습니다. 오히려 처음보다 속도가 더 더딜 수 있습니다. 그만큼 소프트웨어의 크기가 커졌기 때문이죠. 설상가상으로 새로운 기능을 추가하거나 버그를 수정하면 다른 기능에서 버그가 새롭게 생겨나기도 합니다. 상황은 더욱 나빠질 수 있습니다. 개발자가 버그를 관리하지 못하면서 소프트웨어는 신뢰성을 잃고, 사용자는 하나 둘 떠나기 시작합니다. 그리고 그 소프트웨어는 더 이상 사람들에게서 잊혀지겠죠.

그래서 소프트웨어의 신뢰성을 높이기 위해서 개발자들은 소스코드를 이해하기 쉽게 만드려고 합니다. 의식의 흐름대로 자연스럽게 읽혀서 소프트웨어가 어떤 동작을 하는지 쉽게 이해되는 코드가 좋다고 합니다. 쉽게 이해되는 코드는 당연히 유지보수가 쉽습니다. 어디에 어떤 문제가 있는지 알 수 있기 때문이죠. 이 문서는 복잡성을 줄이기 위한 내용을 담고 있습니다.

컴퓨터 프로그래밍의 역사는 100년 정도밖에 되지 않습니다. 그리고 세상 존재하는 프로그래밍 패러다임은 3가지라고 합니다. 절차적 프로그래밍, 객체 지향 프로그래밍 그리고 함수형 프로그래밍. 구루(Guru)들은 절차적 프로그래밍은 비효율적이고 비생산적이다라고 합니다. 소프트웨어의 기능이 복잡해지고, 그 규모도 커져서 유지 보수와 기능 확장 그리고 신뢰성에 더 이상 도움이 되지 않기 때문입니다. 우리도 절차적 프로그래밍이 유지보수에 불편하다는 것을 이미 알고 있습니다. 그래서 이 문서는 몇몇 원칙과 사례로 지속 가능한 소프트웨어를 위한 코딩 방법을 말하고자 합니다.

먼저, 본 문서에는 `실용주의 프로그래머`, `오브젝트` 그리고 `이펙티브 자바` 같은 오래되고 유명하지만 아직까지 수많은 개발자들에게 영감을 주는 책에서 필요한 내용을 풀어서 설명합니다.

## DRY 원칙

하나의 기능이 여러 곳에 퍼져있으면 유지 보수하기 어렵습니다. 마침 그 기능에 버그가 있어서 고쳤는데, 실수로 다른 중복 코드는 고치는데 잊어버렸습니다. 다른 사람이 개발하거나 혹은 개발한 지 오래되어 다른 중복 코드를 잊을 수 있습니다. 그래서 Do not Repeat Yourself. 즉 중복 코드를 만들지 말고 남이 작성한 것(이미 만들어진 것)을 쓰라고 합니다. 하지만 이 원칙을 잘못 이해한 분은 기능을 너무 잘게 분해합니다. 그래서 다음과 같이 코딩할 수 있어요.

* 클래스가 너무 많이 만들어져서 클래스들 간에 의존성이 높아지거나 또는 메서드를 너무 잘게 쪼개서 코드를 이해하는데 의식의 흐름을 방해하는 코드들. 메서드 추상화의 정도가 일정치 않아서 발생합니다.
  * 아래의 코드에서 PurchaseService 클래스의 purchase 메서드의 코드를 분석한다고 가정해봅시다.
  * purchase 메서드의 기능을 분석하기 위해서는 수많은 매서드들을 확인해야 합니다.
  * 특히 아래 주석부터 코드 분석을 하고, 다시 돌아오면 기존의 context 가 유지되지 않을 겁니다.

```javascript
public class PurchaseService {
    public ApiResponse purchase(Long productId){
    
        // 이 메서드를 한번 찾아가봅시다. 그리고 다시 여기로 돌아오면 context 가 유지됩니까?
        Product product = this.getProduct(productId);   
        //....
        ....//

        return ApiResponse.of(result);
    }

    private Product getProduct(Long productId){
        return productService.getProduct(product);
    }
}

public class ProductService {
    public Product getProduct(Long productId){
        Product product = getValidProduct(product);
        return product;
    }

    public Product getValidProduct(Long productId){
        ProductEntity productEntity = productRepository.findById(productId).orElseThrow(...);
        this.convert(productEntity);
        return product;
    }

    private Product convert(ProductEntity productEntity){
        Product product = new Product();
        product.productId = productEntity.productId;
        /// get. set..

        return product
    }
}
```

* 메서드의 이름이 너무 모호한 경우. 코드를 분석하거나 사용할 때 항상 기능에 대해서 의심을 품는 상황이 발생합니다.
  * 아래 코드의 priceService.process() 같은 메서드가 대표적입니다. 메서드 이름의 추상화가 너무 심하게 되어있네요.

```javascript
public PriceEntity getPriceEntityById(Long priceId){
    PriceEntity priceEntity = priceRepository.findById(priceId);
    
    // 어떻게(How) 프로세싱하겠다는 내용을 메서드, 클래스에서 알 수 없습니다.
    return priceService.process(priceEntity);   
}
```

* 메서드 내부에서 매개변수 값을 수정하여, 메서드를 사용하는 클래스는 이를 인지하기 어려운 상황이 발생합니다.
  * 아래의 process 내부에서는 priceEntity 인수 값을 변경합니다.

```javascript
public void process(PriceEntity priceEntity){
    BigDecimal listPrice = priceEntity.calculateListPrice();
    if (listPrice != null){
        // 값 변경.
        priceEntity.setDiscountPrice(listPrice.multiply(...));
    }
    /...
    .../
}
```

그러면 DRY 원칙이 나쁜 걸까요? 혹은 DRY 원칙을 포기해야 하나요? 아닙니다. 위에서 언급한 잘못 이해한 몇 가지 사례들이 문제입니다. 우리가 객체지향 프로그래밍을 한다면 DRY원칙을 잘 지켜서 개발하셔야 합니다.

하나의 메서드는 행위 하나와 같습니다. 그래서 너무 작은 단위의 메서드를 만드는 건 좋지 않습니다. 메서드 추상화의 크기가 너무 커서도 너무 작아서도 안됩니다. 그리고 메서드의 추상화 크기가 일정하면 좋습니다. 특히 PurchaseService 클래스의 getProduct() 같은 메서드는 실제로는 아무 일도 하지 않는 의미 없는 메서드입니다. 의미 있는 작업을 하는 메서드를 만드세요. 그리고 그 메서드의 기능은 메서드 이름과 일치해야 합니다. 만약 다음과 같은 메서드가 발견되었다면 여러분들은 모든 코드를 의심해야 하고 샅샅이 뒤져봐야 합니다.

* 메서드의 이름은 updateShippingStatus()인데, 행위는 shippingStatus를 업데이트하지 않고 삭제하는 메서드
* 메서드의 이름이 process()라서 무엇을 하는지 정확한 행위가 드러나지 않는 메서드.
* 메서드의 이름이 updateShippingStatus()인데, 배송 정보를 업데이트하면서 동시에 배송 정보가 업데이트되었다고 알림을 보내는 메서드
  * 논란의 여지가 있으나, 알림을 보내는 행위는 따로 분리하면 좋겠네요. 알림을 보내는 행위와 배송정보를 업데이트하는 행위가 다르니까요.

간혹 메서드의 이름을 의미 있게 만들다 보면 다음과 같이 메서드의 이름이 길어지는 경우가 있습니다. 이런 경우에는 다음과 같이 스스로에게 물어보고 리펙토링 하는 건 어떨까요?

```javascript
- updateShippingStatusAndSendNotificationToVendor()

Q1. updateShippingStatus와 sendNotificationToVendor라는 두 가지의 행위가 메서드 이름에 표현되어야 할 만큼 매우 중요한가? 
A1-1. 네 두 행위가 매우 중요합니다. (Q2 이동) 
A1-2. 아니요 updateShippingStatus 만 중요한 행위이므로 메서드를 updateShippingStatus()로 변경합니다. (끝.) 

Q2. 두 행위 모두 중요하다면, 행위를 서로 분리해서 메서드를 분리하면 어떨까? 
A2. updateShippingStatus()와 sendNotificationToVendor()로 분리하고 이 둘을 호출하는 메서드를 하나 만듭니다.
```

이 방법 외에도 이런 경우 캔트 백이 제안한 메타포(은유)를 사용하는 방법도 있습니다. 캔트 백은 클래스 이름을 만들 때 메타포를 사용한 경험을 공유하고 있습니다. 드로잉 프레임워크의 클래스들을 책(book)에 대한 메타포로 사용했습니다. 예를 들어서 드로잉 프레임워크의 DrowingObject를 책의 그림인 Figure로 새롭게 명명했었습니다. 메서드의 이름을 만들 때도 메타포를 사용하는 건 어떨지요. 그럼 다음과 같이 리펙토링 될 수 있습니다.

```
- 배달부 메타포를 사용한다. 
- 배달부는 물건을 배달하고 난 뒤, 시스템에 배달완료를 입력을 하고 수신인에게 알림을 보냅니다. 
- 배달부 메타포를 이용해서 updateShippingStatus()를 deliver()로, sendNotificationToVendor()를 alertDelivered()를 사용하는 건 어떨까요?

public class PostMan() {
    public void afterDelivery(){
        //..
        package.delivered();
        vendor.alertDelivered();
        //.. 
    }
}

```

메타포를 사용하기 위해서는 동료들과 서로 공감대가 형성되어야 합니다. 그리고 그 표현을 사용하는데 매우 익숙해야 합니다. 나 혼자만 사용하는 메타포는 오히려 가독성을 해칩니다. 동료들과 서로 공감대를 만들기 위해서는 문서로 메타포를 정의하는 것도 하나의 방법입니다. 이름 짓는 것은 어느 정도 해결된 것 같아요. 그렇다면 어느 정도 크기로 메서드를 분리해서 개발해야 할까요? 생성한 메서드는 어떤 클래스에 선언되면 좋을까요?

다음 직교성에 대해서 알아보고 다시 생각해봅시다.

## 직교성 (Orthogonality)

직교성의 수학적인 정의는 다음과 같습니다.
> 백터 둘의 내각이 90도( 서로 직각을 이룰 때 )이면, 이 두 백터는 서로 직교한다고 한다.

두 백터는 한 공간에서 서로 마주치는 일은 단 한지점 밖에 없습니다. 그래서 두 백터의 성질이 다릅니다. 그래서 서로 공통점을 찾기는 어렵죠. 클래스 디자인도 마찬가지입니다. 각각의 클래스들은 서로 공통되는 특성이 없어야 합니다. 공통점이 없다는 성질은 앞에서 이야기한 DRY 원칙과 비슷합니다.

`Art of UNIX programming`에서는 직교성을 다음과 같이 설명하고 있습니다.

```javascript
Orthogonality is one of the most important properties that can help make even complex designs compact. In a purely orthogonal design, operations do not have side effects; each action (whether it’s an API call, a macro invocation, or a language operation) changes just one thing without affecting others. There is one and only one way to change each property of whatever system you are controlling.
```

그럼 다시 정리해볼까요? 함수나 메서드들은 다른 함수나 메서드에 영향이 있어서는 안 됩니다. 그래서 `응집성`이 있고, `독립`적인 코드를 작성해야 합니다. 이 두 가지 조건(응집, 독립)을 만족할 때 직교성이 있다고 하고, 코드를 격리하고 쉽게 유지보수할 수 있습니다. 코드가 격리되었다고 함은 특정 기능을 업그레이드해서 개발하기에도 좋다고 합니다.

아니. 직교성, DRY 원칙이 좋다는 거는 글로는 쉽게 이해하겠습니다. 그럼 어떻게 직교성이 있는 코드를 작성할 수 있나요? 특정 메서드의 signature를 변경해봅시다. 예를 들어서 매개변수를 하나 더 추가해보거나 혹은 리턴 객체의 클래스 타입을 바꿔봅시다. 가장 이상적인 것은 메서드를 호출하는 클래스와 시그니처가 변경되는 클래스 하나만 변경 되는거죠.

그런데 앞서 설명한 ProductService.java의 convert() 메서드에 인자 Long makerId를 하나 더 추가해봅시다. 데이터 모델에 따라서 다르겠지만, 꽤 많은 메서드들을 변경해야 할 것 같습니다. 기능이 복잡해서 여러 클래스들이 복잡하게 얽혀 있고, 직교성이 없다면 꽤 많은 클래스들이 수정되어야 하고, 재수 없으면 변경된 코드에 버그가 새롭게 생길 수 있습니다. 계속해서 직교성이 있는 코드를 작성하는 방법에 대해서 설명하겠습니다.

### 직교성과 Spring @Transactional

이 직교성을 만족하는 대표적인 코드가 스프링의 @Transactional입니다. Transactional 애너테이션은 AOP(Aspect Object Programming)로 구현된 대표적인 JDBC의 트렌젝션 모듈입니다. JDBC Connection의 begin, commit, rollback에 대한 기능을 비즈니스 코드와 분리해서 AOP 프로그래밍된 코드입니다. @Transactional 은 다음과 같이 spring bean의 메서드나 클래스에 선언하면 됩니다.

```javascript
@Service
public class PlanService {
    /**
     * @param createPlanRequest
     * @return created plan id
     */
    @Override
    @Transactional(readOnly = false, isolation = Isolation.READ_COMMITTED, propagation = Propagation.REQUIRED)
    public Long createPlan(CreatePlanRequest createPlanRequest) {
        ///....
        ....///
    }

}
```

개발자는 @Transactional이라는 애너테이션만 선언하고, 코드 내부에서는 트렌젝션 관련 기능을 신경 쓰지 않습니다. 트렌젝션 코드가 비즈니스 코드의 접점은 오직 @Trasnactional 애너테이션 하나입니다. 그리고 서로의 기능은 완전히 분리되어 있습니다. 비즈니스 코드의 내용을 변경하더라도 트렌젝션 코드는 변경하지 않아도 됩니다. 혹은 반대의 경우도 마찬가지입니다. 그래서 두 코드는 직교성을 갖고 있습니다.

참고로 @Transactional로 선언된 createPlan 메서드는 다음과 같이 동작하게 됩니다.

```javascript
UserTransaction utx = entityManager.getTransaction(); 

try { 
    utx.begin(); 

    planService.createPlan(...);        // 앞서 @Transactional 이 선언된 createPlan() 
    
    utx.commit(); 
} catch(Exception ex) { 
    utx.rollback(); 
    throw ex; 
} 

```

좀 더 자세한 동작을 보고 싶으신 분은 org.springframework.transaction.interceptor.TransactionIntercep tor과 org.springframework.transaction.interceptor.TransactionAspectSu pport를 참고하시길 바랍니다.

JDBC Transaction 처리 로직은 비즈니스 코드와 완전히 분리되어 TransactionInterceptor에 응집되어있고, 독립적으로 동작합니다. 그래서 PlanSerivce와 직교성을 갖고 있습니다. AOP로 프로그래밍된 코드를 예를 들어서 설명했지만, 클래스들 간에 메서드들을 호출하는 것도 마찬가지입니다.