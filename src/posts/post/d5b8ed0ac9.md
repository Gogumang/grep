## 시작하며

안녕하세요, 힐링페이퍼 백엔드 엔지니어 안정균(Eddy)입니다.

저는 현재 강남언니 팀에서 미용 의료 병원용 B2B SaaS 제품(이하 KOS)을 개발하고 있습니다.

KOS 제품을 개발하면서 자동화 테스트에서는 성공하였으나 운영계 배포 후 버그가 발생했던 아찔한 경험을 한 이후로 테스트를 작성하는 방법이 많이 바뀌었는데요. 이번 글에서는 KOS의 예약 시스템 개발 과정에서 발생했던 사례를 기반으로 배운 인사이트에 대해 소개드려보고자 합니다.

## 배경

KOS의 서비스들은 여러 Microservice들로 이루어져있고, 여러 컴포넌트 간 동기 방식의 HTTP 통신 또는 메시지를 발행하여 Message Broker 등을 활용하는 등의 여러 통신 방식이 존재합니다. 그리고 메인 데이터베이스로는 MongoDB를 사용하고 있습니다.

대개 복잡한 비지니스 요구사항을 만족하기 위해 시스템은 하나의 명령(Command)이 실행 되었을 때 여러 서비스 컴포넌트 간 여러 인프라를 이용한 통신이 발생하고 이를 제어하기 위해선 하나의 유즈케이스에 많은 의존성이 필요해질 때가 있습니다.

다음과 같이 복잡한 비즈니스 요구사항과 시스템 제약사항을 만족하기 위해 다양한 의존 관계가 형성되었을 때, 어떻게 시스템을 설계하고 테스트를 작성하는지에 대한 경험을 KOS 예약 시스템의 예제 코드 기반으로 공유하고자 합니다.

## 시스템 요구사항

* 동일한 내원객(Visitor)은 동 시간대 중복 예약을 할 수 없어야 한다.
* 예약 완료 시 해당 내원객에게 예약 확정 SMS 문자가 발송되어야 한다.
* 예약 완료 시 내원객 스케줄의 조회 모델이 만들어져야 한다. (ref. CQRS)

위 조건을 만족하기 위해, 스케줄 서비스에서 발생한 사건들(Events)을 발행하여 Downstream Services 에서 요구사항에 맞게 소비하여 처리하고 있습니다.

### 예약 요구사항을 만족하기 위한 시스템 구성도

스케줄 서비스에서 예약 성공 후 발행되는 Reserved 도메인 이벤트를 알림 이벤트 처리기와 스케줄 이벤트 처리기 등에서 소비하여 요구사항을 만족하는 과정을 추상적으로 도식화해 보면 위와 같습니다.
위 이미지는 요구사항을 이해하기 위한 보충 설명일 뿐이며, 깊게 이해 안 하셔도 무방합니다 🙂

### 예약 명령 처리기 구현

    public class ReserveCommandHandler implements MessageHandler {
        private final ScheduleEventStore eventStore;
        private final VisitorReader visitorReader;
        private final ReservationOverlapValidator reservationOverlapValidator;

        public void handle(Reserve command) {
            // 내원객 정보 조회
            Visitor visitor = visitorReader.read(command.getVisitorId());

            // 중복 예약 검증
            if (!reservationOverlapValidator.validate(...)) {
                throw new RuntimeException("overlapped reservation");
            }

            // 도메인 이벤트 저장 및 발행
            eventStore.collectEvents(
                List.of(new Reserved(...))
            );
        }
    }

    public class ScheduleEventStoreImpl implements ScheduleEventStore {
        private final ScheduleEventMongoRepository repository;
        private final KinesisMessageBus messageBus;

        public void collectEvents(String aggreagteId, Iterable<Object> events) {
            repository.save(...)
            messageBus.send(...)
        }

        public List<Object> queryEvents(String aggreagteId) {
            return repository.findAll(...)
        }
    }

    public class VisitorReaderImpl implements VisitorReader {
        private final WebClient webClient;

        Visitor read(String visitorId){
            return webClient.get(...)
        }
    }

    public class ReservationOverlapValidatorImpl implements ReservationOverlapValidator {
        private final JedisPool redis;

        Boolean validate(String visitorId, OffsetDateTime startTime, OffsetDateTime endTime) {
            var key = buildKey(...)
            redis.exists(key)
            ...
        }
    }

> VisitorReader

내원객의 식별값(visitorId)으로 내원객 정보를 읽어오는 Reader입니다.

⇒ Spring Webflux의 WebClient를 이용하여 Visitor Service를 호출합니다.
> ReservationOverlapValidator

중복 예약 방지 요구사항을 만족하기 위해 필요한 내원객의 식별 값과 예약 시간을 파라미터로 받는 중복 예약 검증기입니다.

⇒ 예약 시 Redis에 캐싱하여 내원객 + 예약 시간 기반으로 중복 예약인지 검증합니다.
> ScheduleEventStore

KOS는 예약 시스템에 Event Sourcing을 적용하여, 명령이 발생하면 관련된 도메인 이벤트들을 스토어에 적재하고 있습니다. EventStore는 도메인 이벤트들을 관리하는 스토어입니다. (ref. [시간여행이 가능한 시스템 아키텍처](https://blog.gangnamunni.com/post/saas-event-sourcing/))

⇒ MongoDB와 AWS Kinesis Data Stream을 이용하여 생산된 Message에 대해 Store and Forward 작업을 수행합니다.

이어서 유즈케이스 구현체에 대응하는 테스트를 작성해 보겠습니다.

### Test Code (as-is)

    @SpringBootTest
    public class ReserveCommandHandlerTest() {

        @Autowired
        private final ScheduleEventStore eventStore;

        @Autowired
        private final VisitorReader visitorReader;

        @Autowired
        private final ReservationOverlapValidator reservationOverlapValidator;

        @Test
        void `Sut는 동일한 내원객이 동 시간대 중복 예약을 하면 예외를 발생시켜야한다`() {
            //Arrange
            var sut = new ReserveCommandHandler(
                eventStore,
                visitorReader,
                reservationOverlapValidator
            )
            var command = new Reserve(...);
            sut.handle(command);

            //Act & Assert
            assertThrows(RuntimeException.class, () -> sut.handle(command));
        }
        ...
    }

현재의 구조에서는 테스트를 실행하기 위해서 모든 서비스의 구동이 필요한 상황입니다.

즉, 모든 인프라 계층에 강결합이 되어있는 지금은 Docker와 같은 컨테이너 서비스를 이용하여 Visitor Service, Redis,

MongoDB, AWS LocalStack 등의 프로세스를 실행하여 테스팅을 진행할 수 밖에없는 상황인것이죠.

게다가 Docker를 사용하기 힘든 환경이라면, 개발자들은 로컬 장비에 MongoDB, Redis를 설치받아야하고 AWS와 같은 자원은 테스트를 위한 서비스 계정을 추가로 관리해야 할 수 있습니다.

이 때, 위의 문제들을 해결하기 위해 생각할 수 있는 것 중 하나가 바로 테스트 대역입니다.

이를 활용하여 테스트 코드를 리팩터 해보겠습니다.

### 리팩터한 Test Code

    public class ReserveCommandHandlerTest() {

        @Test
        void `Sut는 동일한 내원객이 동 시간대 중복 예약을 하면 예외를 발생시켜야한다`() {
            //Arrange
            var sut = new ReserveCommandHandler(
                InMemoryEventStoreFake(),
                VisitorReaderStub(),
                ReservationOverlapValidatorFake()
            );

            var command = new Reserve(...);
            sut.handle(command)

            //Act & Assert
            assertThrows(RuntimeException.class, () -> sut.execute(command));
        }
        ...
    }

    public class InMemoryEventStoreFake implements ScheduleEventStore {
        private final Map<String, List<Object>> store;

        public InMemoryEventStoreFake() {
            this.store = new HashMap<>();
        }

        @Overrride
        public void collectEvents(String streamId, Iterable<Object> events) {
            store.computeIfAbsent(
                streamId,
                x -> new ArrayList<>()
            ).addAll(events);
        }

        @Override
        public List<Object> queryEvents(String streamId) {
            return store.getOrDefault(streamId, Collections.emptyList());
        }
    }

    public class VisitorReaderStub implements VisitorReader {

        @Override
        public Visitor read(String visitorId) {
            return new Visitor(
                visitorId,
                UUID.randomUUID().toString()
            );
        }
    }

    public class ReservationOverlapValidatorFake implements ReservationOverlapValidator {
        private final Map<String, String> collection = new HashMap<>();

        @Override
        public Boolean validate(...) {
            String key = buildKey(...);
            boolean flag = collection.containsKey(key);
            if (!flag) { collection.put(key, visitorId); }
            return !flag;
        }
    }

현재 테스트 대상(System Under Test, 이하 SUT)의 의존성 주입하는 부분을 보시면, 인터페이스를 구현한 테스트 대역들을 주입하고 있는 것을 확인할 수 있습니다. 이와 같이 대역을 사용하면, 모든 의존성을 가짜 객체로 대체하여 외부 의존성 없이 단위 테스트를 진행할 수 있습니다.

이러한 테스트 대역의 종류로는 Stub, Fake, Spy, Mock, Dummy가 존재하는데, 테스트 대역 개념에 대한 소개 목적이 아니니 사용한 개념들에 대해서만 가볍게 예제 코드로 알아보겠습니다.

### 테스트 대역(Test Double)

> 테스트 환경에서 실제 객체를 대신하여 사용되는 객체들을 의미합니다. 이는 테스트의 독립성을 유지하고, 외부 의존성에 대한 제어를 통해 다양한 시나리오를 검증하는데 유용하게 사용됩니다.

(만약, 테스트 대역에 대한 개념을 알고 계신 분이라면 아래 예제 내용은 건너뛰셔도 좋겠습니다 🙂)

### Fake

> SUT가 의존하는 구성 요소(depended-on component, 이하 DoC)를 대체하여 동일한 기능을 간단하게 구현한 객체입니다. 검증 목적으로 사용되지는 않으며, 제어점이나 관찰점으로 사용되지 않습니다.

    public class InMemoryEventStoreFake implements ScheduleEventStore {
        private final Map<String, List<Object>> store;

        public InMemoryEventStoreFake() {
            this.store = new HashMap<>();
        }

        @Overrride
        public void collectEvents(String streamId, Iterable<Object> events) {
            store.computeIfAbsent(
                streamId,
                x -> new ArrayList<>()
            ).addAll(events);
        }

        @Override
        public List<Object> queryEvents(String streamId) {
            return store.getOrDefault(streamId, Collections.emptyList());
        }
    }

시나리오에서는 DoC와 동일한 논리이지만 외부 인프라 자원의 결합 없이 테스트하기 위해 구현했습니다.

### Stub

> SUT가 DoC를 대체하여, 미리 정의된 응답이나 동작을 제공하는 객체입니다. SUT가 특정 조건이나 상황에서 어떻게 동작하는지를 테스트하기 위해 사용되며, 내부 동작이나 호출된 메서드를 기록하지는 않습니다.

    public class VisitorReaderStub implements VisitorReader {
        private Visitor visitor;

        public VisitorReaderStub(Visitor visitor) {
            this.visitor = visitor;
        }

        @Override
        public Visitor read(String visitorId) {
            return new Visitor(
                visitor.getId(),
                visitor.getName()
            );
        }
    }

내부 간접 입력을 통해 미리 정해진 결과를 반환하는 VisitorReaderStub의 구현체입니다.

만약 DoC를 사용했다면, WebClient를 이용하여 Visitor Service로 HTTP 요청을 보내야 합니다. 테스트 실행 시 Visitor Service가 구동되어 있지 않다면 테스트는 실패하게 됩니다. 따라서 Stub 객체를 읽어 간접 출력한 값으로 테스트를 진행하도록 했습니다.

### Spy

> DoC를 대체하면서, 호출된 메서드나 전달된 인자를 기록하는 객체입니다. SUT의 상호작용을 검증하는 데 사용되며, Stub 처럼 미리 정의된 동작을 제공할 수도 있습니다.

    public class EventStoreSpy implements EventStore {
        private final List<Object> eventLogs = new ArrayList<>();

        @Override
        public void collectEvents(Iterable<Object> events) {
            this.eventLogs.addAll(events);
        }

        public List<Object> getEvents() {
            return this.eventLogs;
        }
    }

위 예제로는 유즈케이스가 실행되었을 때, ScheduleEventStore의 collectEvents가 호출된 기록을 검증하기 위해 사용했습니다. 대개 Spy는 명령이 몇 번 실행 되었는지, 또는 메시지가 정상적으로 발행을 했는지 등을 검증할 때 사용합니다.

## 테스트 대역이 모든 문제를 해결해준걸까?

이번글을 작성한 가장 큰 이유입니다.

예약 유즈케이스를 처음 구현 했을 당시 ReservationOverlapValidator에 대한 Fake 객체를 사용하여 테스트를 작성했습니다. 이 테스트는 성공적으로 통과 됨에 따라 안정감을 갖고 운영에 배포되었습니다. 그러나 얼마 지나지 않아 운영 환경에서 특정 상황에서 예약이 실패하는 버그가 발생했다는 VoC를 전달받았습니다.

이유는 다음과 같았습니다.

1. ReservationOverlapValidator는 예약 시간이 지난 데이터를 Redis의 TTL(Time To Live) 기능으로 제거하는 논리를 포함하고 있습니다.
2. 운영에서 내원객의 예약 일정을 과거로 수정하는 요청이 발생했고, TTL 계산 과정에서 음수가 발생하면서 Redis에서 예외가 발생하여 예약이 실패하는 문제가 발생했습니다.

만약 테스트 단계에서 DoC를 사용하여 Redis와 상호작용을 했다면 SUT의 또 다른 테스트 케이스인 "내원객의 스케줄을 과거 일정으로 수정 가능하다" 에서 분명 이 오류를 발견할 수 있었을 것입니다.

### 그럼 어떻게 테스트 방식을 변경했나요?

    @DataRedisTest
    @ContextConfiguration(classes = [TestRedisContext::class])
    public class ReserveCommandHandlerTest {

        @Autowired
        private final JedisPool redis;

        @Test
        void `Sut는 동일한 내원객이 동 시간대 중복 예약을 하면 예외를 발생시켜야한다`() {
            //Arrange
            var sut = new ReserveCommandHandler(
                InMemoryEventStoreFake(),
                VisitorReaderStub(),
                new OverlapReservedDateTimeValidator(redis) // 실제 객체 사용
            );

            var command = new Reserve(...);
            sut.handle(command)

            //Act & Assert
            assertThrows(RuntimeException.class, () -> sut.execute(command));
        }

      ...
    }

    @TestConfiguration
    public class TestRedisContext {

        @Bean
        public JedisPool jedisPool() {
            return new JedisPool(new JedisPoolConfig(), "redis://localhost:6379");
        }
    }

@DataRedisTest를 이용하여 테스트 실행 시 실제 Redis 인스턴스를 활용하여, 가정 기반이 아닌 실제 논리들을 실행시켜 거짓음성을 방지하도록 했습니다.

실제 객체를 사용함으로써 테스트 속도는 대역을 활용했을 때보다 느려졌을 것이고, 만약 검증기 구현체에서 Redis가 아닌 다른 Database로 변경된다면 테스트 코드도 동일하게 변경이 되어야 할 것입니다. 트레이드 오프에 대해 명확히 인지하고 DoC를 사용한다면 가정 기반이 아닌 실제 구현된 논리들을 동작시킴으로써 거짓 음성을 최소화할 수 있게 될 것 입니다.

(Redis Container는 Docker를 이용하여 실행시켰으며, 팀 내 환경에 따라 [Test Container](https://testcontainers.com/)와 같은 오픈 소스 라이브러리들을 활용하는 것도 좋은 방법이 될 수 있을 것 같습니다.)

#### 언제나 테스트 대역은 "가정"에 기반합니다.

분명 외부 의존성을 제거하여 독립적이고 빠른 피드백을 제공할 수 있는 유용한 도구이지만, 가정을 기반함으로 운영 환경과의 차이에서 오는 한계가 존재합니다. 그로 인해, 테스트는 성공하고 운영에서는 버그가 발생하는 거짓 음성(False-Negative) 상황이 발생할 수 있게 됩니다.

#### 그럼 테스트 대역은 사용하지 않는게 좋은걸까요?

또 그렇지만은 않습니다. 이미 작성된 테스트들은 언제 어디서나 실행이 되고 성공해야 합니다. 만약 VisitorReader의 의존성을 DoC로 사용했다면 테스트를 실행할 때마다 Visitor Service를 호출하게 됩니다. 이는 네트워크나 외부 서비스의 구동 환경에 따라 테스트의 성공 여부, 속도 모두 영향을 받게 됩니다.

#### 무분별한 테스트 대역 사용을 지양합니다.

테스트 대역은 매우 명확한 트레이드 오프를 갖고있는 개념이라 생각합니다.

만약 SUT가 외부 서비스의 속도나 네트워크에 민감하게 동작하는 시스템이라면 VisitorReader와 같이 원격 서비스를 호출하는데 DoC를 사용해야할 수 있습니다.

그러나 SUT가 검증하고자 하는 논리가 다른 원격 서비스의 환경, 논리가 아닌 본인이 담당하는 서비스의 논리 복잡성이라면 이에 대역을 활용하면 외부 의존성에 대한 정확한 출력과 빠른 테스트 실행 속도를 보장할 수 있습니다.

## 마치며

많은 이가 알고 계시듯 테스트를 작성하는 근본적인 이유와 목적은 안정감을 확보하기 위함이라 생각합니다.

이때 "단위 테스트를 하고 있으니 외부 의존성을 모두 모킹해야한다"라는 생각으로 모든 의존성을 가정 기반의 대역을 주입하여 안정감을 방해하는 방식의 구현을 경계하고, 대역을 사용한다면 한 번 더 사용하는 것이 맞는지 고민하게 해준 사례였습니다.

이번 사례를 계기로 테스트 작성을 하는 근본적인 이유에 대해 다시 한번 고민해 볼 수 있었고, 확고한 인사이트를 얻어갈 수 있었습니다.

P.S

강남언니 팀의 백엔드 엔지니어는 테스트뿐만 아니라 복잡한 비즈니스의 문제 해결에 필요한 시스템 디자인, 데이터 엔지니어링 등에 대해 다양한 고민을 하고 직접 빠르게 실행해 볼 수 있는 최고의 환경을 갖춘 팀이라 생각합니다. 이러한 과정을 함께하고 싶으시다면 아래 채용 링크를 확인해 주세요!