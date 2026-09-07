![image.png](https://helloworld.kurly.com/_astro/connection-leak.DRjYbKfR_Z1b6mnb.webp) *© Image Created by [DALL-E](https://openai.com/dall-e-3)*

안녕하세요. '컬리로' 팀의 김동호입니다. 😀

팀 내에서 사용중이던 JDBC Driver를 MariaDB에서 MySQL로 변경한 이후, 운영중인 AWS EC2가 OOM이 발생하며 종료되고 새로운 인스턴스로 교체되는 현상이 주기적으로 일어났습니다. 이로인해 한동안 새벽에도 모니터링 알람을 받게 되었으며, 문제를 해결하기 위해 여러 방법들을 시도한 끝에 DB Connection 누수 문제를 발견하여 해결하였습니다.

이 글에서는 DB Connection의 생명 주기(Lifecycle)와 함께 DB Connector와 Garbage Collector의 관계를 분석합니다. 그리고 Connection 누수(Leak)가 발생하는 이유와, 해결 방법을 정리하여 공유합니다.

## Connection 누수를 탐지할 수 있는 증상들

### Out Of Memory

Connection 누수로 인한 대표적인 증상으로는 메모리가 부족한 상태로 유지되다가 인스턴스가 결국 버티지 못하고 비정상적으로 종료되는 현상이 발생합니다.

아래는 사용 가능한 메모리가 거의 0에 수렴하고 이 상태가 지속되는 상황입니다. 노란색 호스트는 메모리가 거의 없는 상태로 유지되다가 결국 종료되며 인프라 설정에 의해 재부팅되었습니다. 정상적인 상황이라면 GC가 주기적으로 돌아 인스턴스를 정리하고 메모리의 공간을 계속해서 마련해야 합니다.

![image.png](https://helloworld.kurly.com/_astro/start1.BFKUysQt_Z1r7XCq.webp)

### Old, New GC 공간 확보 불가

GC의 동작에서도 이상 징후를 감지할 수 있습니다. 컬리로 서비스의 Old 영역 최대 사이즈는 2G로 설정되어 있었습니다. 하지만 Old Gen size 사용량이 2G에 도달해도 GC가 돌지 않고 New 영역의 점유율이 일정 이상 차지하지 못했습니다. 그리고 계속해서 New 영역의 GC만 반복해서 동작하다 결국 비정상으로 종료되는 상황이 발생하였습니다.

![image.png](https://helloworld.kurly.com/_astro/start3.BLe-ebdq_Z1yk6X5.webp)

![image.png](https://helloworld.kurly.com/_astro/start4.CzL7bJ2P_m56tK.webp)

### API 요청시 비정상적으로 긴 애플리케이션 점유 시간

이슈가 주로 발생하는 시간대에서는 특히 응답 시간이 오래 걸리는 API 호출이 발견되는데, DB 쿼리 수행 시간이 오래 걸리는 것보다는 애플리케이션의 점유가 월등히 높은 특징이 있었습니다.
> 초록색 부분은 애플리케이션 점유시간, 보라색으로 작게 보이는 부분은 DB 점유시간 입니다. 2분 가량의 요청에 비해 DB 점유시간은 아주 짧은 것으로 보입니다.

![image.png](https://helloworld.kurly.com/_astro/start5.C1-iGMih_Z1dHTTN.webp)

## 문제 원인 찾기

내부에서 메모리 누수가 발생한다고 판단을 하였고, 메모리 누수 지점을 찾기 위해 [Heap Dump를 추출하여 원인을 파악](https://honeymon.io/tech/2019/05/30/java-memory-leak-analysis.html)하였습니다. 실행 중인 java 인스턴스에서 (`jmap -dump:format=b,file=<파일명> <PID>`)를 입력하면, heap dump 파일을 뽑아낼 수 있습니다. 이를 [MemoryAnalyzer](https://eclipse.dev/mat/) 같은 heap dump 분석 프로그램을 통해 열면 어떤 인스턴스가 메모리를 할당받고 있는지를 알 수 있습니다.

![image.png](https://helloworld.kurly.com/_astro/leak1.BP3172pJ_2cUpTx.webp)
> MemoryAnalyzer 가 분석해준 내용을 확인해보면 `AbandonedConnectionCleanupThread`의 인스턴스가 대부분의 메모리를 차지하고 있다는 사실을 알 수 있습니다.

![image.png](https://helloworld.kurly.com/_astro/leak234.BQJMyh1P_1Oqdnj.webp)

1. Problem Suspect 1: ConnectionImpl 이 13,689 개의 인스턴스를 차지 하고 있습니다.
2. Problem Suspect 2, 3: 대부분의 인스턴스가 `AbandonedConnectionCleanupThread`의 ConcurrentHashMap와 관련이 있습니다.

> *번역) 이 클래스는 버려진 MySQL connection, 즉 명시적으로 닫히지 않은 connection을 닫는 작업을 담당하는 스레드를 구현합니다. 이 클래스의 인스턴스는 단 하나이며 이 작업을 수행하는 단일 스레드가 있습니다. 이 스레드의 실행자는 동일한 클래스에서 정적으로 참조됩니다.*

![image.png](https://helloworld.kurly.com/_astro/leak5.DYjSe4zY_1SbNla.webp)

### Connection의 생명주기(Lifecycle)

Connection과 `AbandonedConnectionCleanupThread`의 관계를 이해하기 위해 Connection이 생성되고 종료되는 과정을 그림과 함께 살펴보겠습니다.

#### Connection 생성

HikariCP에 의해 Connection이 생성됩니다. (실제로는 Connection Pool과 관련해서 더 많은 복잡한 과정이 있겠지만, 전체적인 흐름을 이해하기 위해 간단하게 설명합니다.)

![image.png](https://helloworld.kurly.com/_astro/lifetime1.CyFumn4W_ZReoWw.webp) *© 2025. Kurly. All rights reserved.*

Connection이 생성되면 바로 `AbandonedConnectionCleanupThread`에 의해 `PhantomReference` 인스턴스가 생성되어 connectionFinalizerPhantomRefs에 보관합니다. `PhantomReference`를 생성하는 이유는, `AbandonedConnectionCleanupThread`에서 Connection이 GC에게 수거되기 전에 네트워크 리소스를 지워주기 위함입니다. 마지막 설명에서 그림과 함께 다시한번 자세히 설명하겠습니다. (`PhantomReference`에 대한 이해가 필요합니다. [Java Reference와 GC](https://d2.naver.com/helloworld/329631)를 참고하여 이해하는 것을 추천드립니다. 하지만 글의 흐름을 위해선 'GC에 의해 특별히 추적되는 객체'로 이해하고 넘어가도 괜찮습니다.)

![image.png](https://helloworld.kurly.com/_astro/lifetime2.DMTP2u85_ZnvID5.webp) *© 2025. Kurly. All rights reserved.*

*갑자기 그림이 복잡해져서 놀라셨겠지만, `PhantomReference`가 생성되었고, `AbandonedConnectionCleanupThread`가 보유한 필드 2개(Stack 영역의 referenceQueue, connectionFinalizerPhantomRefs)가 `PhantomReference`에 연결된 그림입니다.* 😊

`AbandonedConnectionCleanupThread`의 `trackConnection()` 메서드에서 `ConnectionFinalizerPhantomReference`(=위에서 설명한 PhantomReference)를 생성하는 부분을 보면 conn(Connection), io(네트워크 리소스), referenceQueue(레퍼런스 큐)를 **넣어주며** 생성합니다.

`connectionFinalizerPhantomRefs -> ConnectionFinalizerPhantomReference -> referenceQueue` 로 이어지는 의존관계를 확인할 수 있습니다.

![image.png](https://helloworld.kurly.com/_astro/lifetime2-1.rZvqNh0-_lV1LP.webp)

#### Connection 종료 (수명 끝)

Connection이 수명이 다하면 HikariCP에서 직접 Connection을 참조하던 부분이 끊기게 되고 Connection 객체는 Phantomly Reachable 상태가 됩니다. (Phantomly Reachable 상태는 흐름을 위해 'GC가 Root에서 직접 접근하지 못하고 `PhantomReference` 로 접근가능한 상태'로 이해해주세요.)

![image.png](https://helloworld.kurly.com/_astro/lifetime3.C-P8FLaj_1XDLql.webp) *© 2025. Kurly. All rights reserved.*

GC 가 동작하면 Phantomly Reachable 객체를 탐지한 후에 `finalize()` 하고 `PhantomReference`를 생성할 때 같이 넣어주었던 ReferenceQueue 에 `enqueue()` 합니다. (화살표 방향이 바뀝니다.)

![image.png](https://helloworld.kurly.com/_astro/lifetime4.DjOMr02w_ZCNaor.webp) *© 2025. Kurly. All rights reserved.*

`AbandonedConnectionCleanupThread` 는 내부에서 실행되는 백그라운드 스레드입니다. `ReferenceQueue`를 계속해서 polling(`remove()`) 하며 `enqueue()`된 `PhantomReference` 를 가져오고, 직접 `finalizeResource()` 를 해줍니다.

![image.png](https://helloworld.kurly.com/_astro/lifetime5.v68UeE5x_11SMmk.webp)

![image.png](https://helloworld.kurly.com/_astro/lifetime6.CjiNgWXZ_ZYqCwr.webp)

`PhantomReference` 내부의 `finalizeResource()`는 명시적으로 networkResources를 닫아주는 역할을 합니다. **만약 제가 HikariCP를 사용하지 않고 Connection을 직접 관리했다면 놓쳤을 수 있는 networkResource를 이곳에서 종료해 주는 것이죠.** `AbandonedConnectionCleanupThread` 의 존재이유 이기도 합니다.

![image.png](https://helloworld.kurly.com/_astro/lifetime7.BYOJsCO6_Z2joFfM.webp)

### 문제 원인 파악

#### 상황 정리

지금까지의 상황을 정리해보겠습니다.

1. 메모리 누수가 있었고 Heap Dump 를 분석해보니 connectionFinalizerPhantomRefs 에 많은 인스턴스가 쌓여있어 메모리를 차지하고 있었다.
2. connectionFinalizerPhantomRefs가 무엇인지 살펴보니 `AbandonedConnectionCleanupThread` 가 보유하고 있는 자료구조이다.
3. 생성된 Connection을 보유하여 Connection이 종료되면 네트워크 리소스를 직접 명시적으로 종료시키고 있었다.

#### 원인 발견

##### AbandonedConnectionCleanupThread 의 구조적 문제

static 영역을 확인해보시면 `AbandonedConnectionCleanupThread`는 newSingleThreadExecutor에 의해 **단일 스레드** 로 실행됩니다. 그리고 **한 번에 한 개의 Reference** 를 꺼내와 **네트워크 자원을 종료** 해줍니다. 그리고 네트워크 자원 종료는 클라이언트와 서버 간의 TCP/IP 소켓 연결을 확인하기 때문에 **네트워크 환경에 따라 병목** 이 생길 수 있습니다. 이렇게 `AbandonedConnectionCleanupThread`는 단일 스레드에서 한 번에 한 개의 네트워크 종료를 한다는 구조적인 문제로 인해 병목이 발생할 수 있는 상황입니다.

![image.png](https://helloworld.kurly.com/_astro/lifetime8.bcGNOyGY_ZszhxU.webp)

##### 팀 내 max-lifetime 설정값

컬리로 팀에서는 HikariCP의 Connection 수명(max-lifetime)을 **50초** 로 지정해놓고 있습니다. 기본값(30분)보다 **36배 빠르게 Connection이 재생성** 됩니다.

이 때문에, `AbandonedConnectionCleanupThread` 에서 버려진 Connection을 **처리하는 속도가 재생성되는 속도를 따라잡지 못하고** 계속해서 `AbandonedConnectionCleanupThread` 에 Connection이 쌓이는 현상이 발생하고 있던 것입니다.

수명이 기본값(30분)일 때는 단일 스레드에서 Connection을 1개씩 꺼내고, 네트워크 리소스를 종료하는 작업이 병목이 생길 정도의 속도가 아니었지만, 이보다 빠르게 그리고 더 많이 Connection을 생성함으로 인해 병목이 발생한 것입니다.

![image.png](https://helloworld.kurly.com/_astro/dishwasher.BzQ0o4wN_1MOq55.webp) *© Image Created by [DALL-E](https://openai.com/dall-e-3)*
> 어떤 음식점의 설거지 담당 종업원은 기름이 낀 그릇(네트워크 병목)이 있어도 무리없이 처리할 수 있지만, 설거지 양이 많이 밀려들면(max-lifetime 이 작은 수치이면) 결국엔 설거지 거리가 쌓일 수 있는 것 처럼요.

## 해결하기

max-lifetime 을 다시 늘린다면 Connection 누수 자체는 방지할 수 있습니다. 하지만 컬리로에서는 [DB failover 시에 slave로 빠르게 연결하기 위해](https://github.com/brettwooldridge/HikariCP/issues/625) max-lifetime을 작게 설정하고 있습니다.

mysql-connector-j 8.0.22 버전 이상부터는 `AbandonedConnectionCleanupThread` 를 비활성화 하는 옵션이 추가되었고, mysql-connector-j 8.0.22 이상 버전으로 업그레이드한 뒤, `AbandonedConnectionCleanupThread` 를 비활성화하는 옵션을 추가해주면 됩니다.

[같은 문제](https://github.com/brettwooldridge/HikariCP/issues/1473)를 겪었던 다른 개발자가 이미 존재했었고, mysql-connector-j 8.0.22 버전에 [비활성화 옵션이 추가](https://bugs.mysql.com/bug.php?id=96870)되었습니다.

### 해결 방법 정리

* 방법1) max-lifetime 을 다시 늘린다.
* 방법2) `AbandonedConnectionCleanupThread`를 비활성화 한다.
  1. mysql-connector-j 8.0.22 버전 이상 업그레이드
  2. 자바 실행 옵션에 `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` 추가하기

보통의 서비스는 개발자가 Connection을 직접 얻어와 networkResource를 열거나 닫는 등의 행위를 하지 않기 때문에 `AbandonedConnectionCleanupThread` **비활성화 방법을 더 추천**합니다.

### 옵션 적용 결과

옵션 적용 후 Heap Dump 를 한번 더 확인해보았습니다. `AbandonedConnectionCleanupThread`에 의한 메모리점유는 사라진 것을 볼 수 있습니다. 실제로도 배포 이후 몇 달간 안정적으로 서비스가 운영되고 있습니다.

![image.png](https://helloworld.kurly.com/_astro/end1.CBI4gq5Y_Z7kU7w.webp)

## 끝내며

Connection 누수 문제는 자칫 트래픽 문제로 착각하기 쉽습니다. 트래픽이 몰리면 메모리가 부족해 Connection 및 메모리 누수가 더 빠르게 발생하기 때문입니다. 컬리로는 물류센터 근무자의 출근시간이 몰리는 경우 순간적으로 많은 트래픽이 생기는 상황이었고, 트래픽이 급증하는 문제로 착각하여 다른 조치로 인해 제대로된 원인파악이 늦어졌습니다. 앞으로는 CPU 사용량이 증가하거나 메모리 사용량이 증가하는 장애가 발생하면 Heap Dump를 먼저 분석하는 습관을 가져야겠습니다.

길고 복잡한 내용을 끝까지 읽어주셔서 감사합니다. 고생하셨습니다. 😊

참고자료

* <https://honeymon.io/tech/2019/05/30/java-memory-leak-analysis.html>
* <https://eclipse.dev/mat/>
* <https://d2.naver.com/helloworld/329631>
* <https://github.com/brettwooldridge/HikariCP/issues/625>
* <https://github.com/brettwooldridge/HikariCP/issues/1473>
* <https://bugs.mysql.com/bug.php?id=96870>

*** ** * ** ***

[컬리로](https://kurlyro.kurly.com/)에서 함께 서비스를 만들어 가고 싶으시다면? 👉 **[커머스/풀필먼트 백엔드 개발자 공고 바로가기 (Backend Developer)](https://kurly.career.greetinghr.com/ko/recruiting)**