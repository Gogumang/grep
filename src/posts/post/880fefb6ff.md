[![NHN Cloud_meetup banner_Obfuscation_202507-01.png](https://images.gogumang.com/880fefb6ff/01.png)](https://www.nhncloud.com/kr)

## 들어가며: 모바일 앱 난독화란?

모바일 애플리케이션(이하 ‘앱’)은 사용자 데이터와 기업 지식 재산권을 보호하기 위한 강력한 보안 조치가 반드시 필요합니다. 특히, 인터넷을 통해 앱이 전 세계로 배포되면서 해커들의 공격 대상이 되기 쉬워졌습니다. 이러한 상황에서 **난독화(Obfuscation**)는 소스 코드나 바이너리 파일을 복잡하게 변환하여 역공학(逆工學, Reverse Engineering) 및 해킹 시도로부터 앱을 보호하는 핵심 기술로 자리 잡았습니다. 이 글에서는 모바일 환경에서 난독화의 중요성과 다양한 난독화 솔루션들이 제공하는 기능들을 살펴보겠습니다.

## 모바일 앱 난독화의 필요성

**역공학** , 즉 **리버스 엔지니어링**은 모바일 앱 보안에 큰 위협이 됩니다. 해커들은 앱 코드를 분석해 작동 원리를 파악하고, 이를 통해 취약점을 찾아내거나 코드를 무단으로 변경할 수 있습니다. 악의적인 공격자들은 리버스 엔지니어링을 이용하여 앱의 핵심 로직을 탈취하거나, 유료 기능을 무료로 사용하도록 조작하며, 심지어 악성코드를 삽입해 사용자에게 피해를 줄 수도 있습니다.

이러한 위협에 대응하기 위한 방법 중 하나가 바로 **난독화**입니다. 난독화는 앱의 코드를 읽기 어렵게 만들어 리버스 엔지니어링을 방해하는 기술로, 코드를 마치 암호처럼 복잡하게 변환하여 해커가 분석하기 어렵게 만듭니다. 이로 인해 공격자는 시간과 노력을 과도하게 소모하게 되어, 공격 시도를 크게 저지할 수 있습니다.

난독화는 안티 디버깅, 안티 템퍼링, 무결성 검증과 같은 다른 보안 기술과 병행 사용될 때 그 효과가 더욱 극대화됩니다.

## 난독화 기술의 종류

「Parvez Faruki 외, (2026). Android Code Protection via Obfuscation Techniques: Past, Present and Future Directions」에 따르면 난독화 기술은 총 네 가지 카테고리로 분류됩니다.
> 1. Layout Obfuscation
> 2. Control Obfuscation
> 3. Preventive Obfuscation
> 4. Data Obfuscation

여기서는 눈으로 쉽게 확인할 수 있는 **Layout Obfuscation** 과 **Control Obfuscation**에 대해 자세히 알아보겠습니다.

### **Layout Obfuscation**

Layout Obfuscation의 대표적인 방식은 **식별자 난독화**입니다. 이는 소스 코드 내 변수, 함수, 클래스 등의 이름을 의미 없는 문자나 숫자로 변경하는 방식입니다. Android 앱에서는 주로 Java나 Kotlin 코드가, iOS 앱에서는 Objective-C 나 Swift 코드가 난독화 대상이 됩니다. 이 기술을 통해 해커가 코드에서 의미 있는 단어를 찾거나 앱의 기능을 파악하기 어렵게 만듭니다.

#### **장점**

* 코드 가독성이 크게 낮아져 역공학 도구가 코드의 구조나 역할을 파악하기 어렵습니다.
* 단순한 변환만으로도 상당한 보안 효과를 얻을 수 있어 초기 보안 강화 수단으로 효과적입니다.

#### **단점**

* 지나치게 난독화된 코드는 디버깅이나 유지보수가 어려워질 수 있습니다.
* 코드 최적화와 충돌할 가능성이 있어 성능에 미치는 영향을 고려해야 합니다.

**원본 코드**

```java
public class UserData {
  private String userName;
  private String userPassword;

  public String getUserName() {
    return userName;
  }

  public void setUserPassword(String password) {
    this.userPassword = password;
  }
}
```

**난독화된 코드**

```java
public class a {
  private String b;
  private String c;

  public String a() {
    return b;
  }

  public void b(String d) {
    this.c = d;
  }
}
```

### **Control Obfuscation**

Control Obfuscation은 코드의 실행 경로와 제어 흐름을 복잡하게 변경하는 기술입니다. 조건문, 반복문, 분기문의 순서를 재구성하거나 불필요한 코드 조각을 삽입하여 실제 로직과 혼동을 유발합니다. 이러한 변환은 역공학 도구가 실제 실행 경로를 파악하는 데 많은 시간과 노력을 필요로 하게 만듭니다.

#### **예시**

* 실제 로직과 무관한 조건문과 반복문을 추가해 제어 흐름을 복잡하게 만듭니다.
* 함수 호출 순서를 임의로 변경하여 코드 흐름을 추적하기 어렵게 합니다.

#### **효과**

* 공격자가 앱 내부의 실제 동작을 분석하는 데 소요되는 시간이 크게 증가합니다.
* 역공학 도구를 이용한 자동 분석의 정확도를 낮춰 보안성을 극대화합니다.

대표적으로 Flattening 기법을 통해 이를 확인할 수 있습니다.

**원본 코드**

```java
public class Calculator {
    public int calculate(int a, int b) {
        int result = a + b;
        return result * 2;
    }
}
```

**난독화된 코드**

```java
public class Calculator {
    public int calculate(int a, int b) {
        int result = 0;
        int state = 0;
        int opaque = (a * b) % 2 + 1; // 항상 1 또는 2

        while (opaque > 0) {
            switch (state) {
                case 0:
                    result = a + b;
                    state = opaque;     // 조건에 따라 1 또는 2로 전환
                    break;
                case 1:
                    result = result * 2; // 곱셈 수행
                    state = 3;          // 종료를 위해 3 부여
                    break;
                case 2: // 의미 없는 연산(dead code)
                    result = b - a;
                    state = 1;
                    break;
                case 3: // 종료
                    opaque = -1;        // 루프 종료(실제로 불필요)
                    break;
            }
            if (opaque < 0) break; // 더미 코드 및 탈출 조건
        }
        return result;
    }
}
```

## 시장에 존재하는 모바일 앱 난독화 솔루션

모바일 난독화 솔루션은 무료와 상용 제품으로 구분됩니다. 각 솔루션은 기능, 사용 편의성, 그리고 업데이트 지원 측면에서 차이가 있으며, 개발자의 필요에 따라 선택할 수 있습니다.

### **무료 난독화 솔루션**

#### **Proguard**

Proguard는 Android 개발 환경에서 가장 널리 사용되는 오픈 소스 난독화 도구입니다. Java 기반의 코드를 대상으로 식별자 난독화와 코드 최적화, 그리고 불필요한 코드 제거 기능을 제공합니다. 이 도구는 Android Studio와 통합되어 있어 사용이 매우 간편한 점이 큰 장점입니다.

* 주요 기능
  * 식별자 난독화 및 코드 압축
  * 불필요한 코드 제거를 통한 앱 크기 감소
  * 자동화된 설정과 빌드 프로세스와의 원활한 통합

Control Obfuscation의 기능은 제공되지 않습니다.

#### **Black Obfuscation**

OpenSource로 제공되고 있는 난독화 솔루션 중 하나입니다.

* 주요 기능
  * Control flow flattening
  * If 분기문 흐름 변경
  * 복잡한 명령어로 치환

식별자 난독화와 같은 Layout Obfuscation을 제공하지 않습니다.

#### **그 밖의 OpenSource**

* ObfusApk
  * <https://github.com/ClaudiuGeorgiu/Obfuscapk>
* dprotect
  * <https://obfuscator.re/dprotect/>

### **상용 난독화 솔루션**

#### **D사 솔루션**

난독화 기능에 더해, 문자열 암호화, 코드 삽입, 디버깅 방지 등 다양한 보안 기능을 제공합니다.

#### **Q사 솔루션**

코드 난독화, 변조 방지, 런타임 보호 등 다양한 보안 기능을 제공하는 솔루션입니다.

#### **NHN AppGuard 난독화**

NHN Cloud의 NHN AppGuard는 난독화(Layout 및 Control Obfuscation)뿐만 아니라, 변조 방지, 런타임 보호, 안티 디버깅, 안티 템퍼링 등 다층적인 보안 기능을 제공하는 통합 모바일 보안 솔루션입니다. NHN AppGuard의 난독화는 보안 모듈과의 상호작용을 통해 Control Flow를 변동시켜 더욱 강력한 난독화 기능을 제공합니다.
> 👉 [NHN AppGuard 더 알아보기](https://www.nhncloud.com/kr/service/security/nhn-appguard)

## 난독화 솔루션 선택 기준

* **난독화 강도**: 솔루션이 제공하는 난독화 기술의 종류와 강도를 확인합니다.
* **지원 기능**: 디버깅 방지, 변조 방지, 런타임 보호 등 추가적인 보안 기능을 지원하는지 확인합니다.
* **성능 영향**: 난독화로 인해 앱 성능에 미치는 영향을 고려합니다.
* **사용 편의성**: 솔루션의 사용 방법이 얼마나 쉽고 편리한지 확인합니다.
* **기술 지원**: 솔루션 제공 업체의 기술 지원 수준을 확인합니다.
* **가격**: 솔루션의 가격과 라이선스 정책을 확인합니다.

## 나가며

오늘날 강력한 모바일 앱 보안은 선택 사항이 아닌 필수 요건입니다. 특히 리버스 엔지니어링은 앱의 지식 재산권을 침해하고 사용자 데이터를 위협하는 심각한 공격 방식으로 부상했습니다. 이러한 위협에 효과적으로 대응하기 위해서는 전문적인 난독화 솔루션 도입이 중요하지만, 난독화만으로는 완벽한 보안을 보장할 수 없습니다.

진정한 앱 보안은 난독화뿐만 아니라 다양한 보안 기술들이 유기적으로 결합될 때 실현됩니다. NHN AppGuard는 이러한 다층적인 보안 기능을 통합적으로 제공하여 난독화의 한계를 극복하고, 더욱 강력하고 견고한 앱 보호 체계를 구축합니다.

NHN AppGuard와 함께 귀사의 소중한 앱을 안전하게 보호하고, 비즈니스 성공을 위한 든든한 토대를 마련하시기 바랍니다. 긴 글을 읽어 주셔서 감사합니다. 😀

[![NHN Cloud_meetup banner_footer_202507-01.png](https://images.gogumang.com/880fefb6ff/02.png)](https://www.nhncloud.com/kr)