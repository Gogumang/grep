## 들어가며

안녕하세요. 컬리 주문플랫폼개발 팀의 이보람입니다.

Kafka Consumer를 운영하다 보면 간혹 예기치 못한 문제로 인해, 또는 의도적으로 메시지를 재처리해야 할 때가 있습니다. 이 글에서는 **Spring Kafka** 를 활용하여 **오프셋을 이동해 메시지를 재처리**하는 방법에 대해 소개하고자 합니다.

특히 **분산 시스템 환경** 에서 컨슈머 애플리케이션을 운영할 때, **컨슈머 그룹을 중단하지 않고** 오프셋을 이동하는 방법에 대해 소개하겠습니다.

## 메시지 재처리가 필요한 상황

컨슈머 리밸런싱 또는 애플리케이션의 갑작스러운 중단 등의 이유로 메시지를 재처리해야 하는 상황이 발생할 수 있습니다. 그 외 다양한 원인과 상황들이 존재하지만 일반적으로 다음의 특징을 가집니다.^[1](#f1)^
> * 컨슈머 로직이 정상적으로 수행되지 않음
> * 오프셋은 정상 커밋되어 새롭게 변경됨

주문팀에서는 드물지만 메시지 처리가 누락된 상황을 경험하였고, 최근까지 카프카 CLI의 오프셋 재설정 명령을 사용하여 문제를 해결해왔습니다.

하지만 제가 속한 팀의 환경에서는 재처리를 **제한적으로** 수행할 수 있었는데요. 다음 문단에서 기존 프로세스에 대해 조금 더 설명드리겠습니다.

## 기존 프로세스

**주문팀** 은 고객이 구매한 상품의 실시간 배송 정보를 얻기 위해 **컬리 물류 조직** 에서 운영하는 **배송 토픽**을 구독하고 있습니다.

하지만 물류 조직이 운영하는 카프카 클러스터에 대해 따로 **관리자 권한**을 가지고 있지는 않은데요. 오프셋을 이동하려면 권한을 사전에 신청해야 하지만, 이를 미처 신청하지 못한 경우에는 물류팀이나 카프카를 관리하는 데이터팀의 도움을 받아야 했습니다.

이러한 상황에서 저희 팀은 권한 없이도 **팀 내부적으로** 오프셋을 이동할 수 있는 프로세스를 마련하고자 했습니다. 특히 재처리가 빠르게 필요한 경우, 권한을 가진 사람에게 의존하지 않고 **컨슈머 담당자가 직접 처리**할 수 있는 기능이 필요했습니다.

한편 기존 프로세스는 다른 제약 사항도 가지고 있었는데요. 오프셋 이동을 위해 명령을 수행하기 전 **컨슈머를 반드시 중지** 해야 했습니다. 이는 오프셋 재설정 명령이 컨슈머 그룹이 **비활성** 상태일 때만 수행되었기 때문입니다.

결국, 오프셋을 이동하려면 담당자가 관리팀으로부터 권한을 얻거나, 권한이 없는 경우 권한을 가진 담당자와 소통하는 방식으로 작업을 진행하였습니다. 그러나 두 경우 모두 오프셋 명령을 실행하기 전에 컨슈머 애플리케이션이나 컨슈머 그룹을 중단해야 했고, 이는 **다음과 같은 문제**를 초래했습니다.

### 컨슈머 중지 및 재기동 문제

> 1. **가용성 저하**
>
> * 컨슈머를 중지하면 메시지 처리가 일시적으로 중단되어 서비스의 **가용성이 저하**됩니다.
>
> * 가용성 저하는 특히 **실시간 처리 시스템**에서 문제가 됩니다.
>
> * 컬리는 주문 후 1시간 이내 배달을 보장하는 **온라인 장보기 서비스 컬리나우**를 운영하고 있습니다. 낮시간 동안 신선 식품이 배달되므로 알림을 통해 고객에게 배달 상황을 최대한 신속히 전달할 수 있어야 합니다.
>
> 2. **데이터 처리 지연**
>
> * 애플리케이션을 중지, 재기동 하는 과정에서 쌓인 **메시지 Lag 을 처리** 하는 데 어느 정도 **지연**이 발생합니다.
>
> 3. **다른 컨슈머에도 영향**
>
> * 하나의 애플리케이션 혹은 컨슈머 그룹에 여러 종류의 컨슈머를 두는 경우
> * 특정 컨슈머 / 토픽 / 파티션의 오프셋만 이동하면 되는 경우에도 중지, 재기동으로 인해, **모든 컨슈머 / 토픽 / 파티션에서 메시지 처리가 중단**되는 문제가

    발생합니다.

이처럼 불필요한 시간과 비용을 초래하는 기존 문제를 해결하기 위해 아래와 같이 **요구 사항**을 정의할 수 있었습니다.

## 요구 사항 정의

기본적인 요구 사항은 다음과 같습니다.
> * 권한 없이 컨슈머 담당자가 **독립적으로 오프셋을 이동**할 수 있어야 합니다.
> * 이동 시 애플리케이션 혹은 컨슈머 그룹을 **중단하거나 재시작 하지 않아야** 합니다. **(무중단 오프셋 변경)**

먼저 오프셋을 옮기는 방법이 필요했으므로, **오프셋 이동 방법** 으로 총 세 가지 대안을 찾아보았고 이들이 각각 **요구 사항에 부합하는지** 살펴보았습니다.

## 대안 찾기

### 대안 1. 카프카 클러스터 권한 얻기

첫 번째 대안은 물류 카프카 클러스터의 권한을 주문팀에서 얻는 것입니다.

이는 가장 쉬운 방법이지만 아쉽게도 아래 두 가지 문제를 야기합니다.

**문제 1**

* A 조직이 B 조직의 권한을 얻을 수 있다면, 비슷한 사유로 B 조직도 A 조직의 권한을 얻을 수 있습니다.
* 조직과 무관하게 권한을 공유하거나 부여받는다면 관리자 입장에서는 체계적이고 안정적으로 권한을 관리하기가 어려워집니다.

**문제 2**

* 그럼에도 권한을 얻었다면 아래와 같은 카프카 CLI 오프셋 재설정 명령을 사용할 수 있습니다.

      $ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --reset-offsets --group consumergroup1 --topic topic1 --to-latest

* 이는 [KIP-122: Motivation](https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=67641850#KIP122:AddResetConsumerGroupOffsetstooling-Motivation) 에서 설명하듯 컨슈머 애플리케이션 외부에서 오프셋을 변경할 수 있는 간편한 방법이지만, 이 방법을 수행하기 위해서는 컨슈머 그룹 상태를 사전에 **비활성** 상태로 만들어야 합니다.

* 그 외의 상태에서는 작업이 수행되지 않고 오류를 출력하는데 관련해서는 아래 코드와 문서를 참고해주세요.

  * **초기 오프셋 재설정 기능 구현 제안** - [KIP-122: Implementation Details](https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=67641850#KIP122:AddResetConsumerGroupOffsetstooling-ImplementationDetails)

  * **Apache Kafka 버전 3.9.0 코드 구현** - [ConsumerGroupCommand.java](https://github.com/apache/kafka/blob/3.9.0/tools/src/main/java/org/apache/kafka/tools/consumer/group/ConsumerGroupCommand.java#L518)

        Map<String, Map<TopicPartition, OffsetAndMetadata>> resetOffsets() {
            // ...
            consumerGroups.forEach((groupId, groupDescription) -> {
                try {
                    // Consumer Group의 상태를 가져옵니다.
                    String state = groupDescription.get().state().toString();
                    switch (state) {
                        // Consumer Group이 비활성 상태인 경우 오프셋을 재설정합니다.
                        case "Empty":
                        case "Dead":
                            Collection<TopicPartition> partitionsToReset = getPartitionsToReset(groupId);
                            Map<TopicPartition, OffsetAndMetadata> preparedOffsets = prepareOffsetsToReset(groupId, partitionsToReset);

                            boolean dryRun = opts.options.has(opts.dryRunOpt) || !opts.options.has(opts.executeOpt);
                            if (!dryRun) {
                                // 실제로 오프셋을 재설정합니다.
                                adminClient.alterConsumerGroupOffsets(
                                    groupId,
                                    preparedOffsets,
                                    withTimeoutMs(new AlterConsumerGroupOffsetsOptions())
                                ).all().get();
                            }
                            result.put(groupId, preparedOffsets);
                            break;
                        default:
                            // Consumer Group이 비활성 상태가 아닌 경우 오류 메시지를 출력합니다.
                            printError("Assignments can only be reset if the group '" + groupId + "' is inactive, but the current state is " + state + ".", Optional.empty());
                            result.put(groupId, Collections.emptyMap());
                    }
                } catch (InterruptedException | ExecutionException e) {
                    throw new RuntimeException(e);
                }
            });
            return result;
        }

  * Apache Kafka 문서 \> [Managing Consumer Groups](https://kafka.apache.org/documentation/#basic_ops_consumer_group) ( 마지막 **Bold** 문장 참고)

    > To reset offsets of a consumer group, "---reset-offsets" option can be used. This option supports one consumer group at the time. It requires defining following scopes: ---all-topics or ---topic. One scope must be selected, unless you use '---from-file' scenario. **Also, first make sure that the** **consumer instances are inactive.** See KIP-122 for more details.

결국 첫 번째 대안은 컨슈머 그룹을 **비활성** 상태로 만들기 위해 애플리케이션을 중단해야 하므로, **무중단 오프셋 변경** 이라는 **두 번째 요구 사항을 충족하지 못하였습니다.**

### 대안 2. Apache Kafka Admin API 사용

두 번째 대안은, Apache Kafka에서 제공하는 **Admin 클라이언트 API**를 컨슈머 애플리케이션에서 사용하는 것입니다.

org.apache.kafka.clients.admin 패키지에 위치한 **Admin** 인터페이스는 오프셋 이동을 위해 **`alterConsumerGroupOffsets(..)`** 라는 메서드를 제공합니다.

    /**
     * <p>Alters offsets for the specified group. In order to succeed, the group must be empty.
     *
     * <p>This operation is not transactional so it may succeed for some partitions while fail for others.
     *
     * @param groupId The group for which to alter offsets.
     * @param offsets A map of offsets by partition with associated metadata. Partitions not specified in the map are ignored.
     * @param options The options to use when altering the offsets.
     * @return The AlterOffsetsResult.
     */
    AlterConsumerGroupOffsetsResult alterConsumerGroupOffsets(String groupId,
                                                              Map<TopicPartition, OffsetAndMetadata> offsets,
                                                              AlterConsumerGroupOffsetsOptions options);

그런데 위 주석의 첫 문장을 살펴보면, 대안 1에서와 마찬가지로 컨슈머 그룹을 **비활성** 상태로 만들어야 한다는 점을 명시하고 있습니다.
> In order to succeed, the group must be empty.

대안 1에서도 오프셋을 변경하기 위해 동일한 메서드를 사용했는데 사용 방법이 일관된 걸 알 수 있습니다.

결과적으로 두 번째 대안도 **무중단 오프셋 변경 요건을 충족하지 못한다**는 점을 확인할 수 있습니다.

### 대안 3. Spring Kafka 오프셋 이동 기능 사용

세 번째 대안은 컨슈머 애플리케이션을 구성할 때 도입한 **스프링 카프카(Spring Kafka)**를 활용하는 것입니다. 팀에서 담당하는 컨슈머 애플리케이션은 다음과 같은 기술 스택을 사용하고 있습니다.
> * Java 21
> * Spring Boot 3.3.4
> * Spring for Apache Kafka 3.2.4 (kafka-clients 3.7.1)

스프링 카프카는 Apache Kafka에서 제공하는 **Consumer** 클라이언트의 **오프셋 이동 기능** 을 내부적으로 추상화하였는데요. Apache Kafka에서는 오프셋 이동을 **`Consumer#seek..(..)`** API를 통해 수행할 수 있습니다.

스프링 카프카에서는 동일 기능을 **ConsumerSeekAware** 인터페이스와 **ConsumerSeekCallback** 을 통해 수행하도록 하였습니다. 이들을 사용하면 특히 **스프링의 컨슈머 관리 환경**에서 오프셋을 쉽게 이동할 수 있습니다.

위의 두 클래스는 일찍이 스프링 카프카 버전 1.1 부터 지원되고 있으며, 다음 메서드들을 가지고 있습니다.

* **ConsumerSeekAware**

  * 오프셋 이동 콜백(`ConsumerSeekCallback`) 등록, 제거 API 제공

  * 리스너가 특정 이벤트(`파티션 할당, 철회 등`)에 반응하여 오프셋을 변경할 수 있게 함

        void registerSeekCallback(ConsumerSeekCallback callback);

        void onPartitionsAssigned(Map<TopicPartition, Long> assignments, ConsumerSeekCallback callback);

        void onPartitionsRevoked(Collection<TopicPartition> partitions);

        void onIdleContainer(Map<TopicPartition, Long> assignments, ConsumerSeekCallback callback);

        void unregisterSeekCallback();

* **ConsumerSeekCallback**

  * 실제적인 오프셋 이동 API 제공

        void seek(String topic, int partition, long offset);

        void seek(String topic, int partition, Function<Long, Long> offsetComputeFunction);

        void seekToBeginning(String topic, int partition);

        void seekToBeginning(Collection<TopicPartitions> partitions);

        void seekToEnd(String topic, int partition);

        void seekToEnd(Collection<TopicPartitions> partitions);

        void seekRelative(String topic, int partition, long offset, boolean toCurrent);

        void seekToTimestamp(String topic, int partition, long timestamp);

        void seekToTimestamp(Collection<TopicPartition> topicPartitions, long timestamp);

  > [Spring Kafka Docs](https://docs.spring.io/spring-kafka/reference/kafka/seek.html)

Spring Kafka 버전 2.3 에서는 이보다 쉽게 오프셋을 이동하도록 **AbstractConsumerSeekAware** 라는 헬퍼 추상 클래스를 도입하기도 했습니다. 이 클래스는 기본적으로 앞서 설명한 **ConsumerSeekAware** 인터페이스와 **ConsumerSeekCallback** 을 사용합니다.

![AbstractConsumerSeekAware 클래스 관계도](https://helloworld.kurly.com/_astro/abstract_consumer_seek_aware.ChTsZxD8_ZPFctM.webp)
AbstractConsumerSeekAware 클래스 관계도
© 2024.Kurly.All right reserved

**AbstractConsumerSeekAware**를 상속한 컨슈머를 사용하면 오프셋 이동 콜백을 토픽 파티션 별로 쉽게 등록하고 제거할 수 있습니다.

스프링 카프카 컨슈머는 폴링(polling) 전에 **할당된 토픽 파티션에 대해 오프셋 이동 콜백을 자동으로 추적하고 처리**하므로, 개발자는 오프셋 제어에 대한 부담을 덜 수 있습니다. 이와 관련하여 아래 코드와 주석을 참고해주세요.

* **KafkaMessageListenerContainer.java**

    // 스프링 카프카 컨슈머가 실행되면 아래 과정이 반복적으로 수행됩니다.
    protected void pollAndInvoke() {
        // ...

        if (!this.seeks.isEmpty()) { // seeks: 오프셋 이동 요청 대기열(BlockingQueue)
            processSeeks(); // 대기열의 요청을 처리하여 오프셋을 미리 옮깁니다.
        }

        // ...

        ConsumerRecords<K, V> records = doPoll(); // 폴링 시 변경된 오프셋부터 메시지를 얻습니다.

        // ...

        invokeIfHaveRecords(records); // 메시지가 있으면 리스너를 호출하여 처리합니다.

        // ...
    }

#### 코드 예시

다음 코드는 일반적인 컨슈머가 **AbstractConsumerSeekAware**를 상속하도록 하여, 토픽 파티션 별로 오프셋을 맨 처음으로 옮기는 기능을 구현한 예시입니다.

* **SimpleSeekAwareListener.java**

    @Component
    public class SimpleSeekAwareListener extends AbstractConsumerSeekAware {

        @KafkaListener(topics = "my-topic", groupId = "my-group-id")
        public void listen(String message) {
            System.out.println("Received: " + message);
        }

        // 오프셋을 맨 처음으로 옮기는 메서드
        public void seekToEarliest() {

            // 토픽 파티션 별로 콜백을 꺼내 사용
            this.getTopicsAndCallbacks()
                .forEach((topicPartition, callbacks) -> {
                    callbacks.forEach(cb -> cb.seekToBeginning(topicPartition.topic(),
                                                               topicPartition.partition()));
                });
        }
    }

> **`getTopicsAndCallbacks()`** 는 Spring Kafka 버전 3.3.0 부터 사용할 수 있습니다. ^[2](#f2)^
>
>
> 이전 버전에서는 **`getSeekCallbacks()`** 를 사용할 수 있으나, 동일 클래스 또는 서브 클래스에서 서로 다른 컨슈머 그룹이 같은 토픽을 구독하는 경우 일부 콜백이 누락될 수 있습니다. 자세한 내용은 [GH-3328](https://github.com/spring-projects/spring-kafka/issues/3328)를 참고해주세요.

* **App.java**

    @SpringBootApplication
    public class App {

        public static void main(String[] args) {
            SpringApplication.run(App.class, args);
        }

        @Bean
        public CommandLineRunner run(SimpleSeekAwareListener listener,
                                     KafkaTemplate<String, String> kafkaTemplate) {
            return args -> {
                kafkaTemplate.send("my-topic", "my-data-1");
                kafkaTemplate.send("my-topic", "my-data-2");
                kafkaTemplate.send("my-topic", "my-data-3");
                Thread.sleep(5000);

                listener.seekToEarliest(); // 오프셋 이동
            };
        }
    }

카프카 브로커 등이 구성되어 있다면 위 스프링 애플리케이션을 실행할 때 다음과 같은 로그가 남습니다. 일정 시간이 지난 후 **my-topic-0** 의 오프셋이 맨처음으로 이동하여, 처음 처리했던 메시지를 **다시** 처리하는 것을 알 수 있습니다.

    24-11-23 17:51:10.413 INFO  ntainer#0-0-C-1 o.a.k.c.c.internals.ConsumerUtils        : Setting offset for partition my-topic-0 to the committed offset FetchPosition{offset=0, offsetEpoch=Optional.empty, currentLeader=LeaderAndEpoch{leader=Optional[localhost:29092 (id: 1 rack: null)], epoch=0}}
    24-11-23 17:51:10.415 INFO  ntainer#0-0-C-1 o.s.k.l.KafkaMessageListenerContainer    : my-group-id: partitions assigned: [my-topic-0]
    Received: my-data-1
    Received: my-data-2
    Received: my-data-3
    24-11-23 17:51:15.440 INFO  ntainer#0-0-C-1 o.a.k.c.c.internals.SubscriptionState    : [Consumer clientId=consumer-my-group-id-1, groupId=my-group-id] Seeking to earliest offset of partition my-topic-0
    24-11-23 17:51:15.486 INFO  ntainer#0-0-C-1 o.a.k.c.c.internals.SubscriptionState    : [Consumer clientId=consumer-my-group-id-1, groupId=my-group-id] Resetting offset for partition my-topic-0 to position FetchPosition{offset=0, offsetEpoch=Optional.empty, currentLeader=LeaderAndEpoch{leader=Optional[localhost:29092 (id: 1 rack: null)], epoch=0}}.
    Received: my-data-1
    Received: my-data-2
    Received: my-data-3

여기에서 주목할 점은 오프셋을 이동하기 위해 **애플리케이션을 중단하거나 컨슈머를 중지하지 않았다**는 점입니다.

대안 1과 2는 **무중단 오프셋 변경** 이라는 요건을 모두 만족하지 못하지만, 마지막 대안은 이를 만족하므로 최종적으로 이 기술을 사용하기로 **결정**하였습니다.

## 아키텍처 확장하기

이제 Spring Kafka를 사용하여 애플리케이션을 중단하지 않고 오프셋을 이동하는 것이 가능해졌지만, 아직 한 가지 살펴볼 부분이 남아 있습니다.

Kafka 컨슈머 그룹은 일반적으로 확장성과 내결함성을 위해 **여러 호스트에 분산된 컨슈머**들로 구성되는데요.

![Consumer Group 분산 시스템 구조](https://helloworld.kurly.com/_astro/consumer_group.De9ZCXX0_Z1L61Gi.webp)
Consumer Group 분산 시스템 구조
© 2024.Kurly.All right reserved

Spring Kafka의 기능은 **개별 호스트 수준에서만 적용된다는 한계** 가 있습니다.

물론 각 호스트 별로 기능을 수행할 수 있지만, 확장성까지 고려하면 이 작업은 번거롭기 때문에 개선이 필요했습니다.

그리고 이를 해결하기 위해, **분산 시스템 환경** 에서 오프셋 이동 요청을 각 서버에 효율적으로 **전파**할 수 있는 방법을 도입했습니다.

### 1. 오프셋 이동 처리 HTTP API 정의

먼저 애플리케이션에 오프셋 이동 요청(Request)를 처리할 HTTP API 를 정의하였습니다. 그리고 해당 API에 대한 Controller를 등록하여 분산된 서버 중 하나가 오프셋 이동 요청을 처리하도록 하였습니다.

Request에는 오프셋을 **이동할 토픽 목록, 파티션 목록, 그리고 조정할 시간**을 포함하여 상황에 따라 유연하게 오프셋을 이동할 수 있도록 하였습니다.

* **topics**: 토픽 목록 (required)
* **partitions**: 파티션 목록 (optional, 없으면 모든 파티션에서 오프셋 이동)
* **seekAt**: 오프셋 이동 시작 일시 (required)

    POST {{host}}/consumers/seek
    Content-Type: application/json

    {
      "topics": [
        "my-topic"
      ],
      "partitions": [0],
      "seekAt": "2024-11-23T18:47:14"
    }

### 2. Redis Pub/Sub 사용

다음으로 요청을 각 서버에 전파하기 위해 **Redis Pub/Sub** 기능을 사용하였습니다. 팀의 컨슈머 애플리케이션은 이미 Redis를 사용 중이었기 때문에 추가적인 인프라 구성이 필요하지 않았습니다.

사용자가 **오프셋 이동** 을 **1회 요청** 하면, 분산 서버 중 하나가 이 요청을 받고 내부적으로 별도의 메시지로 변환하여 **Redis 채널에 게시**하였습니다.

컨슈머 애플리케이션에는 내부적으로 해당 채널을 구독하는 **Redis 리스너** 를 두었는데요. 분산 서버의 Redis 리스너들이 메시지를 수신하면, 메시지 조건을 기준으로 **컨슈머의 오프셋 이동 메서드를 호출**하도록 하였습니다.

이를 통해 각 서버는 독립적으로 오프셋 이동을 수행하였고, 전체 시스템의 **확장성과 유연성**을 확보할 수 있었습니다.

![분산 시스템 환경 오프셋 이동 아키텍처](https://helloworld.kurly.com/_astro/offset_seek_architecture.Ck8ZZSny_Z1Mgktm.webp)
분산 시스템 환경 오프셋 이동 아키텍처
© 2024.Kurly.All right reserved

이와 같이 아키텍처를 확장함으로써, 개별 호스트에서 처리되던 오프셋 이동을 분산 환경에서 **컨슈머 그룹 레벨로 확장**할 수 있게 되었습니다.

### 3. 다른 기능으로 확장

또한, 팀에서는 위와 동일한 플로우를 사용하여 컨슈머 제어 기능을 확장하였습니다.

* 특정 컨슈머 그룹 내 **모든 컨슈머 시작/중지**
* 특정 컨슈머 그룹 내 **지정된 컨슈머 시작/중지**

현재는 필요한 기능 위주로 활용하고 있지만, 위 아키텍처와 카프카를 결합하여 앞으로 다양한 기능을 유연하고 쉽게 확장할 수 있을 것이라 기대합니다.

## 번외 : 오픈 소스 기여하기

이번 기능을 구현하면서 개인적으로 새롭게 도전한 부분도 있습니다. 바로 오픈 소스 프로젝트인 **Spring Kafka에 기여**한 것인데요. 오프셋 이동 기능을 조사하던 중 관련 자료가 많이 부족하다고 느꼈고, 제가 경험한 것을 바탕으로 다른 개발자들에게 도움을 줄 수 있으면 좋겠다는 생각이 들었습니다.

그런 마음으로 Spring Kafka의 이슈 목록을 확인하던 중, **특정 컨슈머 그룹만 선택해서 오프셋을 이동** 하고 싶다는 이슈^[3](#f3)^가 꽤 오래 전부터 열려 있는 것을 발견하였습니다. Spring Kafka는 서로 다른 컨슈머 그룹이 같은 토픽을 구독할 수 있도록 지원하고 있는데요.^[4](#f4)^ 이 구성을 테스트하다가 문제가 있음을 확인했습니다. 문제를 꼼꼼히 분석한 후 메인테이너들과 아이디어를 공유하며 해결 방안을 논의하였고, 결과적으로 기능을 개선하는 작업을 진행하였습니다.^[5](#f5)^

이번 경험은 단순히 버그를 해결하는 데 그치지 않고, 사용하고 있는 **프로젝트의 이해도를 크게 높이는** 계기가 되었습니다. 이전에 사용해 보았던 기능 외에도 전반적으로 코드 구현을 다시 살펴보며 Spring Kafka의 구조를 한층 더 깊이 이해할 수 있었습니다.^[6](#f6)^ 더불어 코드 변경 시 기존 구조와의 **일관성을 잘 유지** 하고, 사용자들에게 **미칠 영향을 매우 신중히 고려해야 한다**는 중요한 교훈을 얻을 수 있었습니다.

## 마치며

**컨슈머 클라이언트도 '분산 시스템 환경'에서 오프셋을 유연하게 변경할 수 있다**는 점을 구현하기 위해 여러 방법을 고민했습니다. 단순한 애플리케이션 환경이었다면 쉽게 해결될 문제였지만, 분산 시스템에서는 다른 종류의 접근 방식과 기술이 필요했습니다.

그런 점에서 이번 과제는 **문제와 요구 사항을 명확히 정의** 하고, **가능한 대안을 꼼꼼히 분석**하는 과정을 경험할 수 있어서 좋았습니다. 앞으로 다른 복잡한 문제를 해결할 때 이번 경험이 큰 도움이 될 것이라 믿습니다.

또한 익숙하게 사용해왔던 기술의 내부 작동 방식을 **실제 코드와 공식 문서를 통해 깊이 이해** 할 수 있었습니다. 기술의 기본적인 작동 방식과 세부 기능을 이해하고 나니 이들을 **응용**하는 것으로 보다 효과적인 솔루션을 찾을 수 있었습니다.

마지막으로 기술 선택시 잘 몰랐던 내용을 알려주시고 방향을 잡아주신 김광용님, 구현한 내용을 꼼꼼히 검토해주신 윤용성님, 글을 검수해주신 김용호님, 정영권님을 비롯한 팀원 분들에게 감사드립니다.

*** ** * ** ***

기술적 도전과 함께 이커머스의 미래를 함께 만들어가고 싶으신 분들은 아래 채용 공고를 통해 지원 바랍니다.

* [커머스/풀필먼트 백엔드 개발자 (Backend Developer)](https://kurly.career.greetinghr.com/ko/recruiting)
* [커머스 프론트엔드 개발자 (Frontend Developer)](https://kurly.career.greetinghr.com/ko/recruiting)

*** ** * ** ***

\[ Footnotes \]

1. 오프셋의 자동 커밋 방식을 사용할 때, 데이터 처리와 오프셋 커밋 처리가 비동기로 이루어지기 때문에 예상치 못한 문제로 인해 메시지 재처리가 필요할 수 있습니다. 수동 커밋을 사용하면 이러한 문제를 줄일 수 있지만, 개발자가 오류와 커밋을 어떻게 처리하느냐에 따라 여전히 오프셋을 이동해 재처리가 필요할 수 있습니다. [↩](#a1)

2. 특정 토픽 파티션의 콜백만 얻고자 한다면, Spring Kafka 버전 3.3 부터 지원되는 getSeekCallbacksFor(TopicPartition)를 사용할 수 있습니다. 이전 버전에서는 getSeekCallbackFor(TopicPartition)를 사용할 수 있으나, 동일 클래스 또는 서브 클래스에서 서로 다른 컨슈머 그룹이 같은 토픽을 구독하는 경우 일부 콜백이 누락될 수 있습니다. 자세한 내용은 [GH-3328](https://github.com/spring-projects/spring-kafka/issues/3328)를 참고해주세요. [↩](#a2)

3. Spring Kafka Issues \> [GH-2302](https://github.com/spring-projects/spring-kafka/issues/2302) [↩](#a3)

4. Spring Kafka Docs \> [Multiple Listeners, Same Topic(s)](https://docs.spring.io/spring-kafka/reference/retrytopic/multi-retry.html) [↩](#a4)

5. Spring Kafka Pull Requests \> [GH-3318](https://github.com/spring-projects/spring-kafka/pull/3318) [↩](#a5)

6. 이는 향후 다양한 [코드와 문서에 기여할 수 있는 밑거름이 되었습니다.](https://github.com/spring-projects/spring-kafka/pulls?q=author%3Abky373) [↩](#a6)