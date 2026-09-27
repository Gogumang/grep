## 들어가며

Java의 [가상 스레드(virtual thread)](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)는 효율적인 동시성 애플리케이션을 개발하기 위해 설계된 경량 스레드입니다. 기존의 Java 스레드 모델과 비교해 더 적은 자원으로 더 많은 수의 스레드를 효율적으로 관리할 수 있으며, 이를 통해 높은 동시성 처리 성능을 제공합니다. 이는 특히 많은 수의 블로킹 I/O 작업을 효율적으로 처리하는 데 큰 이점을 제공합니다.

이런 장점이 있는 가상 스레드가 구체적으로 어떤 방식으로 구현되어 있고 어떻게 작동하는지 소스 코드와 함께 알아보려고 합니다. 총 세 편에 걸쳐 아래와 같은 주제로 전달할 예정입니다.

1. **생성과 시작**
2. [컨텍스트 스위칭](https://techblog.lycorp.co.jp/ko/about-java-virtual-thread-2)
3. [고정(pinned) 이슈와 한계](https://techblog.lycorp.co.jp/ko/about-java-virtual-thread-3)

1편은 다음과 같은 순서로 진행합니다.

* [들어가며](#들어가며)
* [가상 스레드의 장점](#가상 스레드의 장점)
  * [블로킹 I/O 작업 시 발생하는 컨텍스트 스위칭 비용 감소](#블로킹 I/O 작업 시 발생하는 컨텍스트 스위칭 비용 감소)
  * [스레드 생성 비용(메모리, 연산) 감소](#스레드 생성 비용(메모리, 연산) 감소)
* [가상 스레드 생성](#가상 스레드 생성)
  * [scheduler](#scheduler)
  * [cont](#cont)
  * [runContinuation](#runContinuation)
  * [state](#state)
  * [carrierThread](#carrierThread)
* [가상 스레드의 시작](#가상 스레드의 시작)
* [마치며](#마치며)

## 가상 스레드의 장점

먼저 용어를 정리하자면, 기존 Java 스레드는 [플랫폼 스레드(platform thread)](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html#GUID-2BCFC2DD-7D84-4B0C-9222-97F9C7C6C521)라고 부릅니다. 가상 스레드는 이 플랫폼 스레드 내부에서 실행되며, 이렇게 플랫폼 스레드가 가상 스레드를 실행해 주는 역할을 할 때는 '캐리어 스레드(carrier thread)'라고 합니다.

가상 스레드는 플랫폼 스레드와 비교해 크게 아래와 같은 두 가지 장점이 있습니다.

* 블로킹 I/O 작업 시 발생하는 컨텍스트 스위칭 비용을 줄일 수 있습니다.
* 스레드 생성 비용(메모리, 연산)을 줄일 수 있습니다.

각 장점을 하나씩 살펴보겠습니다.

### 블로킹 I/O 작업 시 발생하는 컨텍스트 스위칭 비용 감소

Java의 스레드 모델은 OS의 스레드(커널 스레드)와 1대1로 매핑됩니다. 따라서 블로킹 I/O 작업이 발생하면 해당 스레드의 상태가 변경되며, 이로 인해 OS 레벨에서 컨텍스트 스위칭이 발생합니다.

아래는 기존 스레드 모델에서 컨텍스트 스위칭이 발생하는 과정을 나타낸 그림입니다.

위 그림 1과 같이 플랫폼 스레드 A에서 Task 1이 수행되다가 그림 2와 같이 블로킹 I/O 작업이 수행되면 플랫폼 스레드 A는 작업을 멈추고 대기 상태가 됩니다. 이때 그림 3과 같이 플랫폼 스레드 B가 CPU를 선점해 새로운 Task 2를 실행합니다. 이 과정에서 발생하는 OS 레벨의 컨텍스트 스위칭, 즉 실행 중인 스레드의 레지스터 상태를 저장하고 새로운 스레드의 메모리 매핑을 설정 후 레지스터 상태를 복원하는 과정은 시간과 자원을 상대적으로 많이 소모할 수 있습니다.

이어서 가상 스레드의 케이스를 확인해 보겠습니다. 아래는 가상 스레드를 사용했을 때의 모습을 나타낸 그림입니다.

가상 스레드를 사용하면 그림 4와 같이 플랫폼 스레드 내부에서 스케줄러를 통해 여러 개의 가상 스레드가 매핑되어 작업을 수행합니다. 이때 그림 5와 같이 가상 스레드 내부에서 블로킹 I/O 작업을 만나 컨텍스트 스위칭이 발생하면, 그림 6과 같이 플랫폼 스레드와 연결된 가상 스레드만 교체됩니다. 즉, 컨텍스트 스위칭 과정에서 CPU를 선점하는 플랫폼 스레드는 교체되지 않습니다. 이와 같이 가상 스레드를 사용하면 컨텍스트 스위칭이 OS 레벨이 아닌 애플리케이션 레벨에서 일어나기 때문에 메모리 매핑과 같이 자원과 시간을 상대적으로 많이 소모하는 작업이 없어지면서 기존 OS 레벨의 컨텍스트 스위칭보다 적은 비용이 듭니다.

### 스레드 생성 비용(메모리, 연산) 감소

기존 스레드는 새로 생성될 때마다 JVM 메모리 영역에서 스레드별로 필요한 영역(PC 레지스터, 스택, 네이티브 메서드 스택)을 새롭게 할당합니다. 반면 가상 스레드는 조금 다르게 작동합니다. 작동 중인 가상 스레드의 정보는 캐리어 스레드의 영역에 할당되며, 작동 중이지 않은(블로킹된) 가상 스레드의 정보는 힙 영역에 할당됩니다. 즉, 기존 스레드는 스레드마다 별도의 메모리 영역을 사용하는 반면에 가상 스레드는 소수의 스레드 메모리 영역과 힙 메모리를 사용합니다. 따라서 사용하는 메모리 공간을 줄일 수 있고, 메모리 공간을 할당하기 위한 스레드 생성 비용을 줄일 수 있습니다.

| ![image](https://images.gogumang.com/37ceeab85f/01.png) 그림 7. 기존 스레드의 메모리 구조 | ![image](https://images.gogumang.com/37ceeab85f/02.png) 그림 8. 가상 스레드의 메모리 구조 |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|

이제 가상 스레드가 구체적으로 어떤 원리로 작동해서 이런 이점을 얻게 되는지 JDK 소스 코드를 직접 분석하며 알아보겠습니다. 그 과정에서 가상 스레드의 내부 구조와 작동 원리를 깊이 이해할 수 있을 것입니다. 소스 코드는 [OpenJDK 21+35](https://github.com/openjdk/jdk/tree/jdk-21%2B35)가 기준이며, 글 중간에 등장하는 괄호 속 숫자는 함께 첨부한 소스 코드에서 각 설명에 해당하는 위치에 주석으로 남겨 놓은 숫자를 의미합니다. 가상 스레드의 작동을 보다 깊이 이해할 수 있도록 소스 코드와 함께 읽기를 권장합니다.

## 가상 스레드 생성

가상 스레드 클래스인 `VirtualThread` 클래스에는 아래와 같이 총 다섯 개의 인스턴스 멤버 변수가 있습니다. 각 인스턴스 멤버 변수의 역할을 하나씩 살펴보겠습니다.

```java
// java.lang.VirtualThread.java
final class VirtualThread extends BaseVirtualThread {
    private final Executor scheduler;
    private final Continuation cont;
    private final Runnable runContinuation;
    private volatile int state;
    private volatile Thread carrierThread;
    ...
}
```

### scheduler

앞서 말씀드렸듯 가상 스레드는, 기존 OS의 스레드와 연결되는 플랫폼 스레드(Java 스레드) 내부에서 여러 개의 가상 스레드가 매핑돼 작업을 수행하는 방식으로 작동합니다. 이때 스케줄러가 현재 작업을 수행하는 가상 스레드를 캐리어 스레드와 연결하는 작업을 담당하며, `scheduler`라는 멤버 변수에 현재의 가상 스레드가 사용하는 스케줄러의 참조값이 저장됩니다. 이런 식으로 스레드의 스케줄링을 OS 레벨이 아닌 애플리케이션 레벨에서 수행하기 때문에 기존 스레드에 비해 컨텍스트 스위칭 오버헤드가 줄어들어 성능이 향상됩니다.

스케줄러 할당은 생성자에서 진행됩니다. 생성자에 `scheduler` 인자를 넣은 경우 해당 인자를 스케줄러로 사용하며, 인자를 넣지 않았을 경우에는 해당 가상 스레드를 생성한 스레드가 가상 스레드일 경우(1) 생성한 스레드의 스케줄러를 사용하며, 그 외에는 기본 스케줄러인 [ForkJoinPool](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html)을 사용합니다(2).

```java
// java.lang.VirtualThread.java
final class VirtualThread extends BaseVirtualThread {
    VirtualThread(Executor scheduler, String name, int characteristics, Runnable task) {
        ...
        if (scheduler == null) {
            Thread parent = Thread.currentThread();
            if (parent instanceof VirtualThread vparent) { // (1)
                scheduler = vparent.scheduler;
            } else {
                scheduler = DEFAULT_SCHEDULER; // (2)
            }
        }
        this.scheduler = scheduler;
        ...
    }
}
```

### cont

`cont` 멤버 변수의 타입은 [Continuation](https://cr.openjdk.org/~rpressler/loom/Loom-Proposal.html#Continuations:~:text=as%20CompletableFuture.-,Continuations,-The%20motivation%20for) 클래스로, `Continuation` 클래스는 실행해야 할 작업을 미리 저장하고 있다가, 컨텍스트 스위칭이 발생하면 기존 작업 정보를 저장하고 미리 저장해 놓았던 실행해야 할 작업 정보를 불러오는 역할을 합니다.

`VirtualThread` 클래스의 `cont` 멤버 변수는 `Continuation`을 상속한 `VThreadContinuation` 클래스를 사용합니다(1). `VThreadContinuation` 클래스는 `wrap` 메서드를 통해 `task`를 `VirtualThread` 클래스의 `run` 메서드로 감쌉니다(2). `VirtualThread` 클래스의 `run` 메서드에서는 실행해야 할 작업 전후로 가상 스레드의 상태 변경 등의 공통 작업을 실행합니다.

```java
// java.lang.VirtualThread.java
final class VirtualThread extends BaseVirtualThread {
    VirtualThread(Executor scheduler, String name, int characteristics, Runnable task) {
        ...
        this.cont = new VThreadContinuation(this, task); // (1)
    }
 
    private static class VThreadContinuation extends Continuation {
        VThreadContinuation(VirtualThread vthread, Runnable task) {
            super(VTHREAD_SCOPE, wrap(vthread, task));
        }
        ...
        private static Runnable wrap(VirtualThread vthread, Runnable task) { // (2)
            return new Runnable() {
                @Hidden
                public void run() {
                    vthread.run(task);
                }
            };
        }
    }
}
```

### runContinuation

`Runnable` 타입의 `runContinuation` 멤버 변수에는 `VirtualThread` 클래스의 `private` 메서드인 `runContinuation`의 참조값이 들어갑니다(1). `runContinuation` 메서드에서는 `cont` 멤버 변수의 `run` 메서드를 실행하며(2), `run` 메서드 실행 전후에 가상 스레드의 상태 변경 및 그 외 필요한 다른 작업을 실행합니다.

```java
// java.lang.VirtualThread.java
final class VirtualThread extends BaseVirtualThread {
    VirtualThread(Executor scheduler, String name, int characteristics, Runnable task) {
        ...
        this.runContinuation = this::runContinuation; // (1)
    }
 
    private void runContinuation() {
        ...
        try {
            cont.run(); // (2)
        } finally {
            if (cont.isDone()) {
                afterTerminate();
            } else {
                afterYield();
            }
        }
    }
}
```

### state

`state` 변수는 가상 스레드의 현재 상태를 나타내는 변수로, 스레드의 생명 주기 및 실행 상태를 관리하는 데 사용합니다. 이 변수를 이용해 스레드가 생성되거나 실행됐는지 등 스레드의 다양한 상태를 파악할 수 있습니다.

### carrierThread

`carrierThread`는 가상 스레드를 실행하고 있는 플랫폼 스레드를 참조하는 멤버 변수입니다. 가상 스레드가 실행되거나 중지된 이후 재개될 때 `carrierThread` 멤버 변수에 플랫폼 스레드의 참조값이 저장됩니다.

## 가상 스레드의 시작

이제 가상 스레드의 시작 과정을 소스 코드와 함께 확인해 보겠습니다. 플랫폼 스레드(`Thread` 클래스)와 마찬가지로 가상 스레드도 `start` 메서드를 통해 작업이 시작됩니다(1). 이때 `VirtualThread` 클래스의 `private` 메서드인 `submitRunContinuation` 메서드를 실행하며(2), 이어서 `scheduler` 멤버 변수를 통해 `runContinuation` 메서드를 실행합니다(3). 최종적으로 `VirtualThread`를 생성할 때 멤버 변수로 보관해 두었던 `cont`의 `run` 메서드를 호출해 그 속에 담긴 `task`를 실행합니다(4).

```java
// java.lang.VirtualThread.java
final class VirtualThread extends BaseVirtualThread {  
    public void start() {
        start(ThreadContainers.root()); // (1) 내부 start 메서드 호출
    }
     
    void start(ThreadContainer container) {
        ...
        submitRunContinuation(); // (2) submitRunContinuation 메서드 호출
        ...
    }
     
    private void submitRunContinuation() {
        try {
            scheduler.execute(runContinuation); // (3) scheduler에서 runContinuation 멤버 변수 실행
        } ...
    }
     
    private void runContinuation() {
        ...
        try {
            cont.run(); // (4) 최종적으로 cont의 run 메서드 실행
        } finally {
            if (cont.isDone()) {
                afterTerminate();
            } else {
                afterYield();
            }
        }
    }
}
```

초기에 `VirtualThread`를 생성할 때 실행해야 할 `Runnable` 타입의 작업은 `VThreadContinuation` 내부에 감싸져 저장됩니다. `VThreadContinuation` 클래스는 `Continuation` 클래스를 상속받아 `VirtualThread`용으로 사용하기 위한 내부 클래스입니다(1). `VThreadContinuation` 클래스는 실행해야 할 작업인 `task` 변수를 `VirtualThread` 클래스의 `run` 메서드로 감싸서(2), 작업 전후에 공통 작업을 추가합니다. 이 공통 작업에는 작업 시작 전후로 캐리어 스레드와 연결 및 분리해 주는 `mount` 메서드와 `unmount` 메서드를 실행하고(3), 가상 스레드의 상태를 변경합니다(4).

```java
// java.lang.VirtualThread.java
final class VirtualThread extends BaseVirtualThread {
    private static class VThreadContinuation extends Continuation { // (1) VirtualThread용으로 사용하기 위한 Continuation
        VThreadContinuation(VirtualThread vthread, Runnable task) {
            super(VTHREAD_SCOPE, wrap(vthread, task));
        }
 
        private static Runnable wrap(VirtualThread vthread, Runnable task) {
            return new Runnable() {
                @Hidden
                public void run() {
                    vthread.run(task); // (2) task를 vthread.run()으로 감싸서 공통 작업을 추가
                }
            };
        }
    }
 
    private void run(Runnable task) {
        ...
        mount(); // (3) mount 진행
        ...
        try {
            runWith(bindings, task); // task 실행
            ...
        } finally {
                ...
                unmount(); // (3) 작업 완료 후 unmount 진행
                setState(TERMINATED); // (4) 작업 완료 후 상태를 TERMINATED로 변경
            }
        }
    }
}
```

작업 실행 전후에 실행되는 `mount`와 `unmount` 메서드에 대해 알아보겠습니다. 이 두 메서드는 현재의 가상 스레드를 캐리어 스레드와 매핑해 실행하는 것은 아니고 단순히 참조를 연결하는 작업입니다. 플랫폼 스레드가 `VirtualThread.start` 메서드를 실행해 `mount` 메서드에 도달하면 이 플랫폼 스레드가 해당 가상 스레드의 캐리어 스레드로 지정됩니다.

`mount` 메서드는 해당 가상 스레드의 `carrierThread` 멤버 변수에 현재의 캐리어 스레드를 지정하고(1), 캐리어 스레드의 현재 스레드를 가상 스레드로 지정해(2), 양방향으로 참조하게 합니다. `unmount` 메서드는 캐리어 스레드에서 가상 스레드와의 연결 관계를 제거합니다(3).

흔히 생각하는 가상 스레드의 핵심 원리인 '캐리어 스레드 내부에서 여러 개의 가상 스레드가 컨텍스트 스위칭하는 것'은 `mount`와 `unmount` 메서드가 아니라 `VirtualThread` 클래스의 `park`와 `unpark` 메서드, 그리고 `Continuation` 클래스에서 수행합니다.

```java
// java.lang.VirtualThread.java
final class VirtualThread extends BaseVirtualThread {
    private void mount() {
        Thread carrier = Thread.currentCarrierThread();
        setCarrierThread(carrier); // (1) 현재의 스레드를 해당 가상 스레드 객체의 carrierThread 멤버 변수에 저장
        ...
        carrier.setCurrentThread(this); // (2) 캐리어 스레드의 현재 스레드에 가상 스레드를 지정
    }
     
    private void unmount() {
        Thread carrier = this.carrierThread;
        carrier.setCurrentThread(carrier); // (3) 캐리어 스레드에서의 연결 관계를 제거
        ...
    }
}
```

`VirtualThread`의 `run` 메서드가 감싸고 있던 공통 작업인 `mount` 메서드가 실행된 후 `Continuation` 타입인 `cont` 멤버 변수의 `run` 메서드가 실행됩니다. 실행해야 하는 작업(`task`)은 `Continuation` 클래스의 `target` 멤버 변수에 저장하며, 최종적으로 `Continuation` 클래스의 `run` 메서드(1) 안에서 `enterSpecial` 네이티브 메서드(2)를 통해 실행됩니다. 이때 첫 번째 실행인 경우(3) 작업을 처음부터 시작하고, 이전에 시작한 적이 있는 경우(4)에는 이전에 시작했던 작업을 재개합니다. 현재는 가상 스레드가 처음 시작하는 상황이므로 작업이 처음부터 실행됩니다.

```java
// jdk.internal.vm.Continuation
public class Continuation {
    public final void run() { // (1)
        while (true) {
            ...
            try {
                boolean isVirtualThread = (scope == JLA.virtualThreadContinuationScope());             
                if (!isStarted()) { // (3) 첫 번째 실행일 경우
                    enterSpecial(this, false, isVirtualThread);  // (2) 네이티브 메서드를 통해 실행
                } else { // (4) 이전에 시작한 적이 있는경우
                    assert !isEmpty();
                    enterSpecial(this, true, isVirtualThread);
                    ...
    }
 
    private native static void enterSpecial(Continuation c, boolean isContinue, boolean isVirtualThread);
}
```

이와 같은 과정을 거쳐 가상 스레드 내부에 포함된 `task`가 실행됩니다.

## 마치며

1편에서는 가상 스레드의 장점을 살펴본 뒤 가상 스레드를 어떻게 생성하고 시작하는지 알아봤습니다. 그 과정에서 가상 스레드를 사용해야 하는 이유와 각 멤버 변수의 역할을 하나씩 살펴봤고, 시작 과정에서 이후 발생할 컨텍스트 스위칭을 위해 어떤 사전 작업들을 진행하는지 알아봤습니다.

이어지는 2편에서는 1편에서 소개한 멤버 변수와 시작 과정에서의 추가 작업을 활용해서 어떻게 컨텍스트 스위칭이 이뤄지는지 알아보겠습니다.