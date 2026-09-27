가끔 개발자들과 이야기하다 보면, 요즘엔 RDBMS를 저장소로 사용하는 프로젝트는 대부분 JPA를 사용한다고 합니다. 저도 마찬가지고요. 그런데 몇몇 분들은 JPA에 대한 오해를 하고 계시더군요. 그리고 JPA를 잘못 사용하는 분도 보이고요. 이번 기회에 제가 생각하던걸 좀 이야기해보려고 합니다.
> JPA는 왜! 객체 지향 프로그래밍과 잘 어울리는가?

오해하고 계신 분들에게 JPA를 왜 쓰시나요?라고 여쭤보면.

```javascript
- 메서드로 쿼리를 짤 수 있어서. 
- 자동으로 쿼리를 생성해주니깐. 
- 캐시가 있어서 빠르니깐. 
```

위에 언급된 것들이 JPA / Hibernate, Spring-Data-Jpa의 장점이긴 합니다만, 반드시 저 이유들 때문에 써야 하는 건 아닌 것 같습니다. JPA/Hibernate는 객체 지향 프로그래밍을 하기 위한, 매우 적합한 영속(Persistence) 프레임워크입니다. 특히 cascade 속성을 이용한 영속성 전이(transitive persistence)를 이용하면 보다 편리한 객체 지향 프로그래밍이 가능합니다. 이야기 나온 김에 위의 내용에 첨언하자면, 다음과 같이 될 겁니다.

* 메서드로 쿼리를 짤 수 있어서.

  * QueryDSL 이겠지요? 아니면 Criteria 쿼리나 JPQL 정도 이야기하시는 것 같아요. 하지만 QueryDSL 은 JPA 표준이 아닙니다. 오픈소스 프로젝트 중에 하나이며 JPQL을 만들어주는 일종의 DSL입니다.
* 자동으로 쿼리를 생성해주니깐.

  * 아마 메서드 이름으로 쿼리가 자동 실행되는 기능을 말씀하시나 봐요. 이건 Spring-Data-JPA 프레임워크에서 naming strategy에 의해서 자동으로 쿼리가 생성되는 것입니다. 이 또한 JPA 표준이 아니라서 Spring-Data-JPA 의존성을 추가해주셔야 합니다.
* 캐시가 있어서 빠르니깐.

  * JPA/Hibernate의 1차 케쉬인 EntityManager를 말씀하시는 것 같습니다. 캐시라는 표현 때문에 오해가 있지만 영속성을 위한 데이터 저장소입니다. 그리고 EntityManager는 데이터베이스 Transaction과 딱 붙어있어서 Transaction이 끝나면 저장된 데이터는 사라집니다.

왜 객체 지향 프로그래밍을 하기 위해서 JPA를 영속성 프레임워크로 써야 할까요? `마이 바티스로 마이 버텼으면 by dongmyo` (MyBatis)는 안되는 걸까요? 한 가지 예를 들어보겠습니다. 제품 정보를 가진 ProductEntity와 상품의 색깔 정보를 가진 ColourEntity 가 있다고 합시다. 그리고 다음과 같은 비즈니스 모델을 갖고 있습니다.

* Product 생성 시 Colour를 같이 생성한다.
* 1개의 Product 당 최대 10개의 Colour를 가질 수 있다.
* 특정 Product 가 삭제되면 Colour 들도 같이 삭제한다.
* Product의 이름이 Colour 이름에 prefix로 사용된다.
* Product의 이름이 변경되면 Colour 도 같이 변경된다.

위와 같은 상황에서 Product를 모델링한 ProductEntity와 Colour를 모델링한 ColourEntity의 관계에 대해서 생각해봅시다. 물론 데이터베이스에 정보를 저장하는 것은 일단 생각하지 맙시다. Colour는 Product의 속성이며, 둘의 관계를 매우 밀접하여 (삭제, 생성 등) 분리해서 생각하기 어렵습니다. 그래서 ColourEntity 객체는 ProductEntity 객체의 String과 같은 ProductEntity의 속성입니다. 또한 비즈니스 모델에 따르면 ProductEntity 가 생성되면 ColourEntities 도 생성되고, ProductEntity 가 수정되면 ColourEntity 도 같이 수정되어야 합니다. 삭제도 마찬가지죠. 그 결과 ColourEntity는 ProductEntity의 생애주기와 같이 합니다.

```
Product의 이름이 변경되면 Colour 도 같이 변경된다. 
```

위의 기능을 구현하기 위해서는 ProductEntity 클래스에 updateName() 메서드를 추가하면 될 것 같습니다. 그리고 ProductEntity의 속성인 ColourEntities의 이름도 updateName() 메서드 안에서 같이 변경되어야 합니다. 그런데 말입니다. RDB 모델에서는 product와 colour는 tbl_product, tbl_colour 테이블로 모델링해야 합니다. 그리고 두 테이블은 1:N 관계를 갖지요. 그 말은 데이터 베이스 관점에서 프로그래밍을 하면 tbl_product의 레코드를 변경하기 위한 쿼리, tbl_colour의 레코드를 변경하기 위한 쿼리를 실행해야 합니다. 즉 ProductEntity.updateName() 메서드로 위의 기능을 구현하기 어렵습니다.

그래서 RDBMS 모델과 객체지향 프로그래밍이 서로 맞지 않다고 합니다. 이런 경우 JPA를 이용하면 보다 획기적으로 프로그래밍할 수 있습니다. JPA의 @OneToMany 연관관계를 사용할 때, cascade 옵션을 이용해봅시다. 그러면 위와 같은 상황에서 ProductEntity와 ColourEntity의 모습은 다음과 같이 될 수 있습니다.

```javascript

@Getter
@Entity
public class ProductEntity {

    @Id
    private Long productId;
    
    private String name;

    // Produt 와 1:N 관계지만, 기능상 최대 10까지 Colour 를 가질 수 있으므로 EAGER 를 선언합니다.
    // 비지니스 로직상 최대 10개이기 때문에 가능한 설정입니다.
    // ProductEntity 를 EM 에서 ProductEntity 를 persist 하면 ColourEntity 들도 같이 fetch 됩니다.
    @OneToMany(
        mappedBy = "product", 
        fetch = FetchType.EAGER, 
        cascade = {
          CascadeType.PERSIST,    // Product 생성시 ColourEntity 도 같이 생성해야 하므로
          CascadeType.MERGE,      // Product 이름 변경시 ColourEntity 도 같이 변경되어야 하므로
          CascadeType.REMOVE      // Produt 삭제시 ColourEntity 도 같이 삭제되어야 하므로
        }
    )
    private List<ColourEntity> colourEntities;

    // ProductEntity 를 생성하는 static factory 메서드가 2개가 선언되어있습니다.
    // 그러므로 비지니스 모델을 단정하는 assert 구문이 private 생성자에서 사용되었습니다.
    private ProductEntity(Long productId, String name, List<String> colourNames){
    
        AssertionUtil.notNull(productId);
        AssertionUtil.notEmpty(name);
        // ColourNames 는 최대 10개만 가능하도록 단정합니다.
        AssertionUtil.notGreaterThan(colourNames, 10);
      
        this.productId = productId;
        this.name = name;
        this.colourEntities = Optional.ofNullable(colourNames)
            .stream()
            .flatMap(Collection::stream)
            .map(colour -> ColourEntity.of(this.name, colour))
            .collect(Collectors.toList());
    }

    public static final ProductEntity of(Long productId, name, List<String> colourNames){
        return new ProductEntity(productId, name, colourNames);
    }

    public static final ProductEntity of(Long productId, name){
        return new ProductEntity(productId, name, Collections.emptyList());
    }

    // ProductEntity 의 이름이 변경될때 Colour 의 이름까지 같이 변경되어야 합니다. 
    public ProductEntity updateName(String name){
        AssertionUtil.notEmpty(name);
        this.name = name;
        this.colourEntities = colourEntities.stream()
            .forEach(colourEntity -> colourEntity.updateColourPrefix(this.name));
    }
}
```

@OneToMany cascade = CascadeType.MERGE 옵션 덕분에 ProductEntity 의 updateName() 안에서 tbl_product 와 tbl_colour 테이블의 name 값을 업데이트 할 수 있습니다. 쿼리를 실행하지 않고서 말이죠. 어떤가요? 좀더 객체지향스럽게 프로그래밍되지 않았습니까? 어떻게 좀더 객체지향스럽냐고요?

* 샤이코딩
  * 기계적인 setter 메서드들이 없습니다.
  * 의미를 가진 updateName() 메서드에서 연관된 모든 정보를 한 번에 처리합니다.
* DRY 원칙
  * 연관된 메서드들만 호출합니다.
* 단정적 프로그래밍
  * private ProductEntity 생성자를 확인 바랍니다. 비즈니스 로직에 따라서 여러 정보들에 대해서 단정문(assert)이 들어가 있네요.
* 불변식.
  * 항상 이름이 null 이 아니고, 10개 미만의 개수를 갖는다.라는 불변식을 갖고 있습니다.
  * updateProductName 과 private 생성자만 데이터를 세팅하고, 단정문들이 있으므로 위의 불변식에 맞지 않는 상태는 없습니다.

## 영속성 전이

영속성 전이를 위한 CascadeType 은 다음과 같고 다음과 같은 성질을 갖고 있습니다.

```javascript
public enum CascadeType {
    ALL,
    PERSIST,        // 특정 엔티티를 저장할때, 연관된 엔티티들을 저장한다.
    MERGE,          // 특정 엔티티를 수정할때,  연관된 엔티티들도 수정한다.
    REMOVE,         // 특정 엔티티를 삭제할때, 연관된 객체들을 삭제한다.
    REFRESH,        // 특정 엔티티를 EntityManager 에서 재 조회(refresh), 연관된 객체도 재 조회한다.
    DETACH;         // 특정 엔티티를 EntityManager 에서 제외할때(detach), 연관된 객체도 제외한다.

    private CascadeType() {
    }
}
```

## 고아 객체

상위 엔티티와 하위 엔티티가 서로 연결되어있다고 생각해봅시다. 하위 엔티티가 상위 엔티티에 대한 참조가 없어지면, 하위 엔티티는 고아가 됩니다. 이런 엔티티는 DBMS에서 삭제해주는 것이 좋을 것 같습니다. 다음 코드를 살펴봅시다.

```javascript
public class ProductEntity {
    // 생략
    
    @OneToMany(
        mappedBy = "product", 
        fetch = FetchType.EAGER, 
        cascade = {
          CascadeType.PERSIST,    
          CascadeType.MERGE,    
          CascadeType.REMOVE   
        },
        orphanRemoval = true    // colourEntity 가 productEntity 에 대해서 참조를 잃으면 자동 삭제해주세요.
    )
    private List<ColourEntity> colourEntities;
    
    // 생략
    
    
    public void soldoutAllColours(){
        // List 의 clear() 를 실행하면 colourEntity 들이 참조를 잃어버립니다.
        colourEntities.clear();
    }
}

```

참고로 orphanRemoval 속성은 @OneToMany, @OneToOne에서만 사용 가능합니다. 만약에 @ManyToOne 인 경우에도 orphanRemoval 이 된다면, 상위 엔티티를 삭제하게 될 것이고, 상위 엔티티를 바라보던 다른 자식 엔티티가 오히려 자식이 되는 이상한 상황이 됩니다. 다음 그림에서 RED Colour와 Coat Product 사이에 orphanRemoval 이 된다고 생각해봅시다. Coat와 연관관계에 있는 다른 색깔들은 어떻게 될까요?

![1.png](https://images.gogumang.com/7ffe7ebe15/01.png)

## 마치고

JPA cascade 기능을 알고 계신 분들이 많지만 실제로 사용하시는 분은 적지 않은 걸로 알고 있습니다. 무섭기 때문이죠. 그리고 쿼리 컨트롤이 되지 않아서 성능에 영향이 있을 것 같다는 막연한 불안감 때문인 것 같습니다. 하지만 여기서 가장 중요한 것은 비즈니스 로직을 얼마나 정교하게 만드는 것입니다. 이에 따라서 cascade를 쉽게 사용할 수 있겠지요. 위의 예제도 '색깔은 하나의 제품에 10개까지만 등록할 수 있다'라는 제약 사항 덕분에 작성할 수 있었습니다. 만약에 10개 이상 등록하면 어쩔 건데?라고 하시면 리펙토링을 하면 됩니다. 설마 제품 색깔이 100개를 넘겠습니까?

JPA에 대한 오해도 풀고 싶었습니다. 그리고 Spring과 객체지향에 대해서 좀 더 자세하게 설명해보고 싶었지만, 시간이 허락하지 않네요.

긴 글 읽어주신 분들에게 감사의 말씀을 드립니다.