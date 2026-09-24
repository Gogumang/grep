안녕하세요! 마이쿠키런에서 팬플랫폼 iOS 개발을 하고 있는 이인애입니다. 벌써 팀에 합류한지 약 6개월이 되었는데요. 오늘은 신입 iOS 개발자가 Swift 5.5에 새롭게 등장한 동시성, 그중에서도 async/await 키워드의 동작에 대해 공부하면서 깨달았던 내용들을 공유해 보려고 합니다.

## Swift 5.5 이전의 동시성

Swift 5.5에서 새로운 동시성 모델을 제시하기 전까지 우리는 GCD와 completion handler를 사용해 비동기 프로그래밍을 해야 했습니다. GCD API로 비동기 작업을 처리하고, completion handler로 비동기가 끝나는 시점에 필요한 작업을 할 수 있었습니다.

기존에도 Swift에는 동시성 프로그래밍을 위한 방법들이 존재하고 있었습니다. 그런데 왜 또 다른 동시성 생태계([Swift Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html))를 도입하고자 했을까요?

그 배경을 이해하기 위해 *바삭한 쿠키🍪*를 함께 구워보겠습니다. 쿠키 만드는 각 단계는 긴 시간이 소요되기 때문에 비동기로 동작한다고 가정하겠습니다.

1. 도우 만들기
2. 도우 숙성시키기
3. 오븐에 굽기
4. 쿠키에 얼굴 그리기

먼저 completion handler를 사용해 구현한 코드입니다.

    func makeCrunchyCookie(completion: @escaping ((Cookie) -> Void)) {
        makeDough { dough in
            self.chillDough(dough: dough) { ripedDough in
                self.bakeCookie(dough: ripedDough, time: bakeTime) { cookie in
                    self.drawFace(cookie: cookie) { crunchyCookie in
                        completion(crunchyCookie)
                    }
                }
            }
        }
    }

자, 여기서 '\*개발자의 실수로 인해 발생할 수 있는 오류'\*가 발생할 가능성이 있기 때문에 쿠키를 굽는 개발자들이 주의해야 할 점이 있습니다.

* 에러 처리를 위해 모든 case에서 completion handler를 리턴했나요?
* self property에 접근할 때, 어떤 스레드에서 접근하게 될지 생각했나요?
* self property에서 retain cycle이 발생할 가능성은 없나요?
* etc

가장 먼저 눈에 띄는 것은 중첩되는 코드 블럭입니다. 들여쓰기가 많아지면 가독성이 떨어질 뿐 아니라, 코드 내부에서 분기 처리 시 **completion handler를 호출하지 않는 실수**를 할 수도 있습니다.

또 코드 내부에서 `self` 키워드에 접근해야 한다면 **retain cycle(참조 사이클) 발생 가능성** 을 고려해야 합니다. 그렇다고 무분별한 `[weak self]`의 사용은 런타임 오버헤드를 발생시킬 수도 있고, nil을 체크해야 하는 수고를 거쳐야 합니다. guard let 문법을 사용한다면 self가 nil 일 때 특정 코드들을 건너뛰게 되는 상황도 발생할 수 있습니다.

    ✅ completion handler의 문제점
        ∙ 중첩되는 들여쓰기로 인한 가독성 저하
        ∙ 개발자의 실수로 인해 발생할 수 있는 오류
            ◦ 복잡한 에러 핸들링
            ◦ closure에서 self capture → retain cycle 발생 가능성

컴파일러는 이런 종류의 \*'개발자로 인해 발생할 수 있는 오류'\*들을 감지할 수 없습니다. 그래서 문법적인 패턴을 도입해 보다 명확하고 안전하게 문제를 해결하고자 했습니다.

## async, await 문법의 도입

아래의 키워드를 사용해서 비동기 함수를 사용할 수 있습니다.

* `async`: 비동기 함수임을 나타낸다.
* `await`: async 키워드가 표시된 메소드나 함수의 리턴을 기다린다. 즉, `async` 함수는 비동기적으로 동작할 수 있고, `await` 키워드를 사용해 비동기 함수의 결과를 대기할 수 있습니다.

앞서 살펴본 예제를 async, await로 변경한 코드입니다.

    func makeCrunchyCookie() async throws -> Cookie {
        let dough = try await makeDough()
        let ripedDough = try await chillDough(dough: dough)
        let cookie = try await bakeCookie(dough: ripedDough, time: bakeTime)
        let crunchyCookie = try await drawFace(cookie: cookie)

        return crunchyCookie
    }

completion handler가 사라지면서, 비동기 함수를 한 줄로 처리할 수 있어 훨씬 간결해 보입니다. 이와 동시에 retain cycle이 발생할 우려도 사라졌습니다. 또, 개발자가 실수로 try await 키워드를 빼먹은 경우에는 컴파일러가 오류를 알려줘 조금 더 안정적인 에러 핸들링이 가능합니다.

이처럼 가독성이 더 좋아졌을 뿐 아니라 위에서 언급한 여러 문제를 해결하고 있습니다.

## 동작 과정

최근 새로운 프로그래밍 패러다임으로 자리 잡기 시작한 구조화된 동시성([Structured Concurrency](https://en.m.wikipedia.org/wiki/Structured_concurrency))이 Swift에도 도입되었습니다. Swift 5.5부터 도입된 구조화된 동시성은 async/await 키워드로서 제공됩니다.

다른 언어에서도 Swift와 유사하게 구조화된 동시성이 async/await 키워드로 제공됩니다. async 키워드를 사용해서 비동기적으로 동작하는 함수를 만들 수 있는데, 이때 이 비동기 함수는 코루틴([Coroutine](https://en.wikipedia.org/wiki/Coroutine))으로 만들어집니다. Coroutine은 함수가 동작하는 도중 특정 시점에 suspend(일시정지)할 수 있고, resume(다시 재개)할 수 있게 합니다.

다른 언어에서는 Coroutine을 이용해서 비동기 함수 매커니즘을 제공하고, Swift의 구조화된 동시성 또한 이와 유사하게 동작합니다.

함수의 이름 뒤에 `async` 키워드를 붙여 해당 함수가 비동기임을 나타낼 수 있고, 비동기 함수가 결과를 반환할 때까지 **suspend** (일시정지) 될 수 있습니다. 이때 비동기 함수가 일시정지될 수 있는 지점을 알려주는 장치가 `await` 키워드입니다.

`await` 키워드는 호출할 함수의 앞에 붙여 **suspension point** 임을 나타냅니다. 호출된 함수가 결과값 혹은 오류를 던진 이후, suspension point에서 **resume**(실행을 재개)할 수 있습니다.

### 📌 비동기 함수를 처리할 때 suspend / resume이 왜 필요하죠?

Swift의 모든 비동기 함수는 여러 `task`의 집합으로 이뤄져 있습니다. 비동기 함수가 다른 비동기 함수를 호출했을 때, 해당 호출 또한 task입니다. task는 동기 함수에서 스레드 내 함수 컨텍스트에 해당하는 `continuation`을 포함합니다. continuation은 task가 suspend 되었을 때 발생하며, resume 될 때 이를 이용해 suspension point로 돌아갈 수 있습니다.

해당 과정을 코드와 함께 살펴보겠습니다. 먼저 위의 예시에 등장한 비동기 함수들을 task로 나눠보겠습니다. 우리는 함수를 기다려야 하는 부분과, 비동기로 처리되어야 하는 코드의 일부분을 task로 나눌 수 있습니다. 시스템은 이 task들을 각각 어떤 스레드에서 동작할지 `executor`(일종의 스레드 풀)를 통해 결정합니다.
![make crunchy cookie func](https://images.gogumang.com/180fdbeb9f/01.png)

함수가 실행되는 과정에서 await 키워드를 만나면 해당 지점을 suspension point로 표시하게 됩니다.

작업이 **suspend** 되면, task는 작업을 진행 중이던 **스레드의 제어권을 포기**하게 됩니다. 이때 해당 스레드 제어권은 시스템이 가지게 되는데, 시스템은 이 스레드에서 다른 작업을 수행하다가 task의 수행이 필요하다고 느껴지는 적절한 시점에 스레드 제어권을 반환합니다.

스레드 제어권은 다시 suspension point가 발생한 지점으로 돌아가 작업이 resume 됩니다.

    ✅ suspend → resume의 과정
        1. await 키워드를 만나면 suspension point로 지정하고 일시정지 (suspend)
        2. 스레드의 제어권을 시스템에게 넘겨줌
        3. 시스템이 다시 비동기 함수에게 스레드 제어권을 넘겨줌
        4. suspension point에서 작업 재개 (resume)

#### 헉 그럼 이 task는 어떤 스레드에서 실행되는거죠..?

![스레드는 너굴맨이 처리했으니 안심하라구!](https://images.gogumang.com/180fdbeb9f/02.jpg) 스레드는 너굴맨이 처리했으니 안심하라구!

일반적으로 함수는 정해진 스레드에서 처리해야 합니다. 즉, 처리해야 할 작업이 많아지면 생성되는 스레드도 증가하게 됩니다. 그렇다면 스레드의 수가 많아지면 더 많이 처리할 수 있으니까 더 좋은 거 아닐까요?

예상외로 그렇지는 않습니다. 스레드의 수가 지나치게 많이 생성되는 현상(thread explosion)이 발생합니다. 스레드의 수가 디바이스의 CPU 코어 수보다 많아지면 실제 용량을 초과해 요구하는 셈(overcommit)이 되어버립니다.

코어의 수가 제한된 디바이스에서 스레드가 과도하게 생성될 경우 빈번한 컨텍스트 스위칭(context switching)으로 인해 스케줄링 오버헤드가 발생하거나, block된 스레드가 다시 실행되기를 기다리면서 가지고 있는 메모리 및 리소스 때문에 메모리 오버헤드가 발생해 성능을 저하시킬 가능성이 있습니다.

또, 엄청난 양의 스레드를 개발자들이 직접 관리하는 것은 꽤나 복잡한 작업을 요구하게 될 것입니다.

GCD를 사용할 때는 너무 많은 스레드들이 block 되지 않도록 제어하거나, 세마포어(semaphore)를 사용해 할당되는 스레드의 수를 제한하는 방법을 사용해야 했습니다. 이 점 또한 앞에서 언급한 '*개발자의 실수로 인해 발생할 수 있는 오류*'를 발생시킬 가능성이 있기 때문에 언어적인 측면에서 안전하다고 판단되는 것은 아니었습니다.
![Swift concurrency: Behind the scenes](https://images.gogumang.com/180fdbeb9f/03.png) Swift concurrency: Behind the scenes [WWDC 2021](https://developer.apple.com/videos/play/wwdc2021/10132?time=995)에 따르면, 애플은 스레드 관리를 개발자에게 맡기기보다 시스템 자체에서 처리해 안전성을 보장하고자 했습니다. 그래서 시스템이 넘겨받은 작업의 우선순위와 실행하기에 적절한 스레드를 고려하여 제어권을 넘겨줍니다.

즉, 함수가 suspend 되는 과정에는 추가적인 스레드의 생성 없이 작업할 수 있도록 executor가 task를 적절한 스레드로 배정하는 과정이 포함되었다고 볼 수 있습니다.

이제 task는 시스템에게 넘겨받은 스레드 제어권으로 작업을 재개할 수 있습니다. 하지만 여기서 task가 재개되는 스레드는 이전과 같지 않을 수 있다는 점을 기억해야 합니다.

    ✅ suspension point에서 변할 수 있는 것
        ∙ 스레드 제어권
        ∙ resume 되는 스레드
        ∙ suspend → resume 이후 앱의 상태

### 📌 작업이 재개되는 스레드가 왜 이전과 같지 않을 수 있을까요?

이것을 알기 위해서는 비동기 task가 어떤 식으로 동작하는지 이해해야 합니다. **continuation**이란, 특정 지점에서의 함수 실행 컨텍스트를 추적할 수 있는 객체입니다. 새로운 Swift 동시성 모델에서는 각 task에 대해서 스레드를 생성하는 대신 continuation을 할당합니다.

일반적으로 실행 중인 프로세스 내에서 모든 스레드는 독립적인 stack 영역과 프로세스 내에서 공유되는 heap 영역을 가지고 있습니다. 이때 stack은 함수 호출의 상태를 저장하기 위해 사용됩니다. 지역 변수와 반환 주소값 등 함수 호출에 필요한 정보들을 함께 저장하고 있습니다.
![](https://images.gogumang.com/180fdbeb9f/04.gif)

일반적으로 함수가 호출 및 반환될 때의 stack의 모습입니다. 함수가 호출되면 stack에 **push** 되고, 실행이 끝나 함수가 return 되면 **pop**을 수행합니다. 기존에 동시성 프로그래밍을 구현하기 위해서는 여러 개의 스레드를 사용해 처리해야 했습니다. 이처럼 여러 개의 스레드 작업을 번갈아가며 처리할 때 컨텍스트 스위칭(context switching)이 발생합니다.

![async stack heap](https://images.gogumang.com/180fdbeb9f/05.png)

그러나 Swift Concurrency에 도입된 코루틴에서는 비동기 함수의 실행을 stack과 heap에서 관리합니다. **stack** 에는 비동기 함수를 실행할 때 사용되지 않는 지역변수들을 저장합니다. 추가로 **heap** 에는 suspension point에서 실행하는데 필요한 함수 컨텍스트들을 저장합니다. 이것을 **continuation**이라고 부르며, 이를 통해 일시정지된 함수의 상태를 추적해 어디서부터 재개할지 알 수 있습니다.

continuation은 heap에 저장되기 때문에 스레드 간의 함수 컨텍스트를 공유할 수 있습니다. 바삭한 쿠키를 굽는 과정에서 `makeDough` 함수가 suspend 된 상황을 가정해 보겠습니다.

먼저 미래에 사용될 가능성이 있는 변수들이 continuation의 형태로 heap에 저장됩니다. suspend 되었던 함수가 resume 되면, stack의 최상단 frame이 해당 함수 frame으로 교체됩니다. 이미 heap에 함수 컨텍스트가 저장되어 있기 때문에 새로운 stack frame을 생성하지 않고 교체만으로도 동작할 수 있습니다.

![suspend - resume의 진행 과정](https://images.gogumang.com/180fdbeb9f/06.gif)

작업의 교체만 이뤄지면 이미 생성된 스레드를 재사용하는 것도 가능합니다. 비동기 함수가 어떤 스레드에서 suspend 되었는지와 관계없이 가장 효율적으로 실행될 수 있는 스레드에서 함수 컨텍스트를 불러와 resume 할 수 있습니다. 또, 이러한 과정은 컨텍스트 스위칭 없이 함수 호출 만으로도 작업의 변경이 가능해 스케줄링 오버헤드를 줄일 수 있는 이점이 있습니다.

그래서 쿠키를 굽기 위해 비동기 함수 `makeDough`를 실행하다가(suspend), 손을 씻어야 할 때가 오면 비동기 함수 `washHand`를 실행(resume)할 수 있는 것입니다. 이 말은 곧, 비동기 함수를 실행하다가 UI 업데이트 같은 중요한 작업을 진행할 수 있게 해준다는 뜻입니다.

비동기 함수가 suspend 되면 해당 스레드 제어권은 시스템이 가지고 있기 때문에, 시스템 판단하에 적절한 스레드를 찾아서 task에게 제어권을 넘겨줍니다. 여기서 말하는 적절한 스레드는 '원래 작업 중이던 스레드' 혹은 '작업이 다 완료되어 쉬고 있는 다른 스레드'가 될 수 있습니다. 따라서 작업이 resume 되는 스레드가 같지 않을 수 있다는 특징이 여기서 발생하게 됩니다.

    ✅ continuation 특징
        ∙ 컨텍스트 스위칭을 함수 호출로 대체 → 스케줄링 오버헤드 감소
        ∙ 추가적인 스레드 생성 없이 스레드 재사용 → thread explosion 방지

## 요약

지금까지 Swift에서 async, await가 어떤 원리로 비동기 처리를 하고 있는지 살펴봤습니다. coroutine model을 기반으로 한 Swift Concurrency는 함수의 실행이 스레드에 국한되지 않는 동시성 생태계를 제공하고 있습니다. 요약하자면, Swift 5.5에 반영된 async/await 문법은 컴파일 타임과 런타임에 안전성을 보장하면서 한 번 이상 suspend, resume 될 수 있음을 의미합니다.

    ✅ Swift Concurrency에 적용된  변화
        📌 언어적 개선
            ∙ completion handler 제거로 인한 가독성 증가
            ∙ self 참조 사이클이 생길 우려 제거
            ∙ 에러 처리 용이
        📌 성능적 개선
            ∙ 시스템이 스레드 관리
            ∙ continuation으로 스레드 증가 방지
            ∙ 컨텍스트 스위칭을 함수 호출로 대체

## Swift Concurreny의 미래

한편, [WWDC](https://developer.apple.com/videos/wwdc2021/)에서 애플이 소개한 안전한 동시성 생태계의 [최종 목표](https://github.com/apple/swift/blob/71aa4c983221f3f890163c55c47d8443e05f83c7/docs/ConcurrencyRoadmap.md)는 아래와 같습니다.

* 편리하고 명확한 비동기 프로그래밍 환경 제공
* Swift 개발자들이 따를 수 있는 표준 언어와 기술 제공
* 컴파일 타임에 비동기 코드의 성능 향상
* 데이터 레이스(data race)와 데드락(deadlock)의 제거

수차례의 release를 통해 이러한 목표를 달성할 예정인데, 이는 크게 두 단계로 나눌 수 있습니다.

    ✅ Swift Concurrency의 2단계
        1. async, await 문법과 actor 타입의 등장
        2. full actor isolation (독립성)

**첫 번째 단계**는 async/await API를 도입해 언어적, 성능적 관점에서의 개선을 이뤄냅니다. 이 과정에서 발생 가능한 data race를 줄이기 위한 방식으로 actor 타입을 제안합니다.

**두 번째 단계**는 data race를 줄이는 것이 아닌, 완전한 제거를 목표로 full actor isolation 한 생태계를 조성하는 것입니다. 이를 위한 다양한 기능들도 함께 제공하는 것이 목표입니다.

Swift 5.6까지 release된 현재 시점에서 살펴본 Swift Concurrency에는 첫 번째 단계가 충분히 반영되었다고 느낄 만큼 큰 변화를 체감할 수 있었습니다. 또, 여러 공식 문서를 통해 Swift가 얼마나 [safe-by-default](https://forums.swift.org/t/concurrency-in-swift-5-and-6/49337)함을 중시하고 있는지 옅볼 수 있는 기회였습니다.

이번 글에서는 async/await의 동작만 살펴봤지만, data race를 회피할 수 있는 동시성 프로그래밍을 위한 actor 타입과 task의 우선순위와 취소 기능을 위해 Structured Concurrency에 도입된 API 등 추가로 이해해야 할 개념이 많습니다.

아직 Swift 동시성 모델 없이 개발된 코드들이 많이 존재합니다. 하지만 시간이 지남에 따라 Swift의 동시성 모델의 제약조건에 맞게 바꿀 일이 생길 것이라고 생각합니다. 마이쿠키런 iOS 팀에서는 이런 변화에 대응하기 위한 기술 스터디를 진행하며 쿠키런 팬들을 위한 플랫폼 서비스를 만들고 있습니다.

<br />

이 글을 흥미롭게 읽으셨거나, 이미지 처리 혹은 서비스 개발에 관심이 많으신 iOS 개발자님이 계시다면 지금 당장 마이쿠키런의 n번째 바삭한 쿠키가 되어주세요! 🍪

긴 글 읽어주셔서 감사합니다.
![deco cookie](https://images.gogumang.com/180fdbeb9f/07.png)

## 데브시스터즈는 최고의 인재를 찾고 있습니다.

자세한 내용은 채용 사이트를 확인해 주세요!