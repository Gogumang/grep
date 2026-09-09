안녕하세요, 토스증권 Realtime Data Team 강병수입니다.

[이전 글](https://toss.tech/article/toss-securities-visualize-lineage)에서 수 천 개의 실시간 데이터 파이프라인 리니지 시각화라는 주제를 다뤘는데요. 이번 글에서는 수 천 개의 파이프라인 중 조금 더 특별한 것이 있어 이 내용을 상세하게 소개해 보려고 합니다. 그 특별한 요소는 바로 **Kafka Producer / Consumer Client와 Kafka Broker의 연결 관계를 파악하는 것** 입니다.

Kafka Producer / Consumer Client로 Kafka Broker에 연결을 맺는 경우는 대부분의 경우 토스증권 서비스 서버입니다. 서비스에서 직접 활용하는 만큼 중요도와 장애 민감도가 매우 높다는 성격을 갖고 있는데요. 토스증권에서는 10,000개의 서비스 Pod가 1,000개의 Topic을 사용 중입니다. 따라서 어떤 서비스가 어떤 Topic으로 데이터를 발생시키는지, 그리고 어떤 서비스가 어떤 Consumer Group으로 Topic의 메시지를 소비 중인지 회사 시스템을 전체적으로 볼 수 있는 지도를 만드는 일이 필요했어요.

<br />

토스증권 시스템의 가시성을 높이는데 서비스 서버와 Kafka Broker 간의 연결 관계를 파악하는 것이 매우 중요했고, 또 데이터 파이프라인 관점에서도 서비스 서버에서 발생시키는 메시지가 데이터의 원천이라는 점에서 Lineage에 포함시켜 그려내는 것이 굉장히 중요합니다.

서비스 서버와 Kafka Broker의 연결 관계 지도를 어떻게 그려냈는지, 1부 Visualize Lineage에 이어 본 글에서 2부로 소개합니다.

## 요구 조건

전체 시스템 지도를 그려내는 과정에서 원천 서비스 소스코드 수정에 의존하는 것은 불가합니다. 수 많은 서비스 서버를 모두 수정하는 것도 어렵고, 100%의 커버리지를 달성하는게 현실적으로 불가능하기 때문입니다.
1. 원천 서비스 소스코드 수정이 없어야 함
2. 연결 현황이 실시간으로 반영돼야 함
3. 100% 커버리지로 모든 연결을 다뤄서 정확성을 보장해야 함

위 세 가지 조건을 충족하면서 Kafka Client와 Kafka Broker의 연결 관계를 찾아내야 합니다.

## 서비스 서버와 Kafka Broker의 연결 현황을 파악하기

리니지는 잠시 잊고 서비스 서버와 Kafka Broker간의 연결 현황을 파악하는 방법에 집중해 볼게요.
우리는 다음과 같은 것을 알 수 있어야 합니다.
1. 서비스 서버는 수 십개의 Kafka Cluster 중 어떤 Kafka Cluster에 연결을 맺고 있는가?
2. 서비스 서버는 Kafka Producer로 어떤 Topic으로 메시지를 발행하고 있는가?
3. 서비스 서버는 Kafka Consumer로 어떤 Consumer Group으로 어떤 Topic에서 메시지를 소비하고 있는가?

이 것들을 모두 알아내기 위해 그동안 많은 고민과 시도가 있었습니다.

1번의 경우 간단합니다. 모든 Kafka Broker에서 netstat 같은 커널 명령어로 커넥션 정보를 수집한다면 구분할 수 있습니다. 하지만 이 방법은 2번 3번 조건을 충족하지 못합니다. 단순하게 연결 중인 IP:Port 정보만 알 수 있기 때문입니다.
조금 더 정확하게 표현하면, 연결 중이라는 것은 알 수 있지만 해당 서버가 Producer인지 Consumer인지도 알 수 없고, 더 깊게 들어가서 어떤 Topic에 연결을 맺는지도 알 수 없습니다. 커널 명령어로는 알 수 없는 애플리케이션 레이어의 정보가 필요한 셈입니다.

다른 방법으로 github에서 필요한 정보를 수집해 볼 수도 있는데요, 이 방법은 다음과 같은 한계가 있습니다. 먼저 서비스 담당 조직별로 코딩 스타일이 다르기 때문에 완벽하게 Producer, Consumer인지 구분하고, 어떤 Topic을 사용하는지 100% 정확하게 구분해내는 것이 어렵습니다. 또 추가적으로 소스코드 자체는 실제 배포돼 있는 형상과 다를 수 있기 때문에 실제로 현재 연결을 맺고 있는지 알 수 없습니다.

다른 방법으로는 원천 소스코드 수정을 하는 방법도 있는데, MSA 구조에서 사용하는 공통 라이브러리에 Log 혹은 Metric을 심어서 관계를 파악하는 방법입니다. 이 방법은 완벽하게 모든 서비스에 반영되고 배포된다면 모든 조건들을 충족할 수 있지만, 현실적으로 100% 커버리지로 반영해서 배포하는 것이 불가합니다. 또 다양한 언어를 지원해야 하는데 회사에서 주력으로 사용중인 Spring Framework 정도만 반영될 가능성이 높습니다.

오랜 시간동안 다양한 방법들을 고민해봤지만 모든 요구조건을 충족시키는 안은 없었습니다.

## Kafka Broker request log의 잠재력

Kafka Broker는 기본설정으로 request log를 남기지 않습니다.

request log를 남기기 위해서는 추가적인 log4j 설정이 필요한데요. 오랜시간 Kafka 운영을 해오다보니 request log를 켜야하는 순간이 자주 찾아왔습니다.

Client와 Broker간 연결이 붙지 않을 때 방화벽 이슈인지, 네트워크 이슈인지, 아니면 Broker 이슈인지를 파악을 해야하고, 증권 거래 시스템이다보니 저지연으로 응답을 내려주는 것이 중요해서 어느 구간이 병목인지 파악하기 위해서도 request log가 필요했어요.

초기에는 위와 같은 이유로 Kafka Broker의 request log를 켜서 사용하기 시작했습니다.

    {% if request_logging == true %}
    log4j.logger.kafka.request.logger=TRACE, requestAppender
    log4j.additivity.kafka.request.logger=false
    {% else %}
    log4j.logger.kafka.request.logger=WARN, requestAppender
    log4j.additivity.kafka.request.logger=false
    {% endif %}

request log를 남기려면 Kafka Broker의 log4j 설정에서 request logger의 log level을 TRACE로 적용

개발환경에서 수많은 검증과 계산을 해본 결과 request log를 단순하게 켜버리는 것은 Kafka Broker 장애로 이어질 수 있다는 걸 파악했어요. 라이브 Kafka Broker는 초당 100만 건 이상의 request가 발생하고 있어서 이 정도의 file write가 발생하면 CPU 사용률이 100%에 도달해서 문제가 생기거나, Disk가 꽉차서 장애로 이어질 수 있습니다. 그리고 Broker 서버 자체가 바빠지다보니 Client의 요청을 처리하는 것 같은 기본적인 기능에 지연이 생기는 것을 확인했습니다.

이 문제를 해결하기 위해 0.1%로 Sampling해서 request log를 남기는 라이브러리를 개발 및 적용해서 해결했습니다.

    log4j.appender.requestAppender=org.apache.log4j.RollingFileAppender
    log4j.appender.requestAppender.layout=com.tossinvest.appenders.JsonLayout
    log4j.appender.requestAppender.filter.1=com.tossinvest.appenders.SamplingFilter

log4j Filter를 상속받아 자체 개발한 Sampling Filter를 Kafka Broker log4j에 적용

Kafka Broker request log를 남기기 시작하고 이를 이용해서 디버깅에 활용하다보니 조금씩 request log의 가능성이 눈에 들어오기 시작했습니다.

request log가 기대했던 것보다 중요하고 정확한 정보를 담고 있었는데, 30개 가량의 Kafka Broker API 중 유용해 보이는 특정 API만 뜯어보면 아래와 같은 정보를 담고 있습니다.

    PRODUCE API
    - principal
    - clientName
    - clientVersion
    - clientId
    - connection (client-broker 간 연결 정보)
    - topic
    - partition
    - acks
    - 구간 별 latency

    OFFSET_COMMIT API
    - principal
    - clientName
    - clientVersion
    - clientId
    - connection (client-broker 간 연결 정보)
    - consumer group
    - topic
    - partition
    - commit offset
    - 구간 별 latency

PRODUCE API 보면 어떤 주소를 가진 Client가 어떤 Topic-Partition으로 메시지를 발생시키는지 알 수 있고, OFFSET_COMMIT API를 보면 어떤 주소를 가진 Client가 어떤 Consumer Group으로 어떤 Topic-Partition으로 commit을 날렸는지 알 수 있습니다.

API가 호출되는 즉시 로그를 남기기 때문에 이 정보는 상세한 내용을 담고 있으면서 동시에 실시간으로 커넥션 현황을 알 수 있습니다.

## 하지만 너무 많은 request log

이 정보를 활용하면 원하던 것을 이룰 수 있다는 생각이 들기 시작했습니다. 하지만 당장의 문제는 이전에 적용했던 request log sampling이었습니다.
0.1%로 Sampling을 하고 있다보니 100% 커버리지를 확보하려면 꽤 오랜기간의 로그를 활용해야 100% 가까운 연결 현황을 얻어낼 수 있는데, 이 구조는 조회 비용도 너무 커지면서 동시에 **'실시간 연결 현황'**을 파악하는데 어려움이 생깁니다.

토스증권 시스템 가시성을 높이는 것이 가장 중요한 목표였기 때문에 **'실시간 연결 현황'**은 포기할 수 없는 요건이었습니다. 회사별로 상황이 다르겠지만, 토스증권 기준으로 초당 100만 건이 넘는 요청이 발생하고 있어서 request log를 0.1% -\> 100%로 열 수 없습니다.

그래서 **30개의 Kafka Broker API 중 특정 API만 100%로 남기고 나머지는 모두 버리는 아이디어**를 생각해냈습니다.

<br />

선별할 API의 조건은
1. 구조적으로 발생되는 양이 적어서 100%로 열 수 있으면서
2. 동시에 필요한 모든 정보를 포함하고 있어야 합니다.

30개 API를 모두 전수조사해서 이 조건에 부합하는 API를 찾았습니다.

## METADATA API

모든 Kafka Client는 METADATA API를 호출합니다.

처음 Kafka Client가 Kafka Broker에 연결을 맺을 때 Topic-Partition의 leader 정보와 같은 메타데이터를 얻기 위해 METADATA API를 호출합니다. 또 Kafka Broker에서 Exception이 내려보냈을 때도 Kafka Client는 새로운 메타데이터로 새시작을 하기 위해 METADATA API를 호출하게 됩니다. 특정 상황에만 METADATA API를 호출하는 것이 아니라 **주기적으로도 METADATA API를 호출**해서 최신의 메타데이터를 유지하고 있습니다.

**100% 커버리지로 모든 연결을 다뤄서 정확성을 보장 해야 함**

중요한 점은 모든 Kafka Client는 METADATA API를 호출한다는 것입니다. Java, Kotlin, Python, Go, Javascript 모든 언어의 클라이언트가 METADATA API를 호출하고, Producer와 Consumer 구분 없이 모두 METADATA API를 사용한다는 것은 Kafka Broker에 연결된 Kafka Client를 100% 커버리지로 찾아낼 수 있겠다는 희망을 갖게 합니다.

**연결 현황이 실시간으로 반영돼야 함**

100% 커버리지 조건은 확보가 됐으니 **실시간 성격**을 충족하는지 확인해야 합니다. 모든 Kafka Client는 '주기적으로' METADATA API를 호출한다는 것에 집중했습니다. 어떤 주기로 호출하는지를 파악하고 최근 N분간의 request log를 조회하면 모든 Kafka Client의 연결 현황을 파악할 수 있다는 의미가 됩니다.

기본 설정을 보면 5분 주기로 METADATA API를 호출한다는걸 알 수 있습니다.

* [Java Producer의 METADATA API 호출 주기](https://kafka.apache.org/documentation/#producerconfigs_metadata.max.age.ms)
* [Java Consumer의 METADATA API 호출 주기](https://kafka.apache.org/documentation/#consumerconfigs_metadata.max.age.ms)

넉넉잡아 최근 10분간의 request log를 조회하면 Kafka Client가 Kafka Broker에 연결된 모든 커넥션을 알 수 있습니다.

**원천 서비스 소스코드 수정이 없어야 함**

request log를 켜는 것은 원천 서비스 서버의 소스코드 수정 없이 Kafka Broker에서 수행합니다. 따라서 원천 서비스 소스코드 수정 없이 연결 관계를 파악할 수 있게 됐습니다.

이제 이렇게 들어온 request log가 실제 우리가 필요로하는 모든 정보를 담고 있는지 확인할 시간입니다.

    {
      "@timestamp": "2025-09-15T07:34:17.835Z",
      "clientInformation": {
        "softwareName": "apache-kafka-java",
        "softwareVersion": "3.3.2"
      },
      "connection": "111.111.111.111:9092-222.222.222.222:22654-338466",
      "host": "kafka05",
      "isForwarded": false,
      "level": "DEBUG",
      "listener": "SASL_PLAINTEXT",
      "logger": "kafka.request.logger",
      "path": "/d/kafka-request.log",
      "principal": "User:***",
      "request": {
        "allowAutoTopicCreation": true,
        "topics": [
          {
            "name": "topic1"
          }
        ]
      },
      "requestHeader": {
        "clientId": "kafka-java-producer-120424",
        "correlationId": 1,
        "requestApiKey": 3,
        "requestApiKeyName": "METADATA",
        "requestApiVersion": 7
      },
      "response": {
        "brokers": [
          {
            "host": "kafka05.t.c",
            "nodeId": 0,
            "port": 9092,
            "rack": "dc1"
          }
        ],
        "clusterId": "c1",
        "controllerId": 0,
        "topics": [
          {
            "errorCode": 0,
            "isInternal": false,
            "name": "topic1",
            "partitions": [
              {
                "errorCode": 0,
                "isrNodes": [
                  0
                ],
                "leaderEpoch": 6,
                "leaderId": 6,
                "offlineReplicas": [],
                "partitionIndex": 0,
                "replicaNodes": [
                  0
                ]
              }
            ]
          }
        ]
      },
      "securityProtocol": "SASL_PLAINTEXT",
      "sendTimeMs": 0.013,
      "throttleTimeMs": 0,
      "throttleTimeMs": 0,
      "remoteTimeMs": 0,
      "localTimeMs": 0.058,
      "requestQueueTimeMs": 0.009,
      "responseQueueTimeMs": 0.007,
      "totalTimeMs": 0.088
    }

예시로 가져온 METADATA API request log 1건

위 예시는 필요없는 필드를 빼고, 값을 수정한 것이어서 실제로는 조금 더 길다란 형태를 갖고 있습니다.

이 로그가 우리가 원하는 것들을 모두 갖고있는지 확인해볼 수 있습니다.
1. connection
   1. 어떤 IP:Port의 Client가 어떤 Kafka Broker로 연결을 맺고있는지 알 수 있습니다.
2. response.topics
   1. 서비스가 어떤 Topic-Partition에 연결하고 있는지 알 수 있습니다.

다른 유용한 정보들도 있지만, 일단 Kafka Client - Kafka Broker 연결 관계를 파악하기 위해서는 두 개의 정보가 중요합니다.

<br />

이로써 세 가지 요구사항을 METADATA API request log가 충족한다는 것을 알 수 있습니다. 다른 API request log도 요건을 충족하는 것들이 있었지만 METADATA API를 사용하게 된 것에 결정적인 이유가 있습니다.

**모든 Client는 트래픽과 별개로 주기적으로 METADATA API를 호출한다는 성격** 때문입니다. 초당 1만 개 메시지를 전송하는 Client는 초당 1만개의 PRODUCE API를 호출하지만, METADATA API는 5분에 1번 호출합니다.

이러한 성격 덕분에 가장 큰 고민이었던 100%로 로그를 열었을 때 생기는 로그 폭증 문제를 해결할 수 있었습니다. 덤으로 트래픽에 기반한 API를 사용하면 메시지 발행이 없을 때 API를 호출하지 않아서 로그를 남기지 않는 문제가 생기는데 주기적으로 호출되는 METADATA API는 이 문제를 가볍게 극복합니다.

## 완벽하지 않은 METADATA API

METADATA API request log를 사용하면 모든 문제를 해결할 것 같았지만 실상은 완벽하지 않다는걸 알 수 있습니다. 아래와 같이 두 가지 문제점이 있어요.

* 로그만 봐서는 Producer 인지 Consumer 인지 구분해낼 방법이 없다.
* Consumer의 경우 Consumer Group 정보도 필요한데 METADATA API 스펙에는 Consumer Group 정보가 없다.

두 문제는 연결관계를 파악하는 데 핵심적인 요소는 아닐 수 있습니다. Client가 붙어있다는 사실만 파악하는 정도로 끝낼 수 있고 또 Consumer Group까지는 모르고 지나가도 돼요.

하지만 여기까지 와서 적당히 타협하고 끝낼 수는 없었습니다. METADATA API의 부족한 두 가지를 채울 방법을 찾기 시작했습니다. 후반부에 더 상세히 설명드릴 예정이지만, 토스증권은 request log를 ClickHouse에 모아서 활용하기 때문에 여러 테이블 간 join의 자유가 있습니다. 부족한 부분을 다른 데이터와 join해서 채워보기로 했습니다.

METADATA API와 join이 가능하면서 Client가 Consumer인지 여부와 Consumer Group을 알아낼 수 있는 추가적인 데이터는 세 가지가 있었어요.
1. HEARTBEAT request log
2. OFFSET_COMMIT request log
3. 토스증권에서 자체 개발한 Consumer Group Lag metric

이 세 가지 데이터 모두 clientId를 join key로 사용해서 조합이 가능했는데요. 최종적으로 저희는 3번 토스증권에서 자체 개발한 Consumer Group Lag metric을 사용하게 됐습니다.

1번 2번 모두 100%로 열면 초당 10만 건 이상 발생하는 너무 큰 request log였기 때문에 효용이 적다고 판단했고, 동시에 3번에서 발생시키는 metric은 이미 ClickHouse에 적재 중 이었기 때문에 join 쿼리 한방으로 당장의 문제를 쉽게 해결할 수 있었습니다.

METADATA API는 완벽하지 않았지만, Kafka Consumer Lag metric과 join을 통해 부족했던 부분을 모두 극복했습니다.

이쯤에서 중간정리를 해보면 우리는 현재 두 가지를 알 수 있습니다.
1. 111.11.111.11:52342라는 Producer가 kafka05의 topic1로 메시지를 전송하고 있다.
2. 222.22.222.22:12345라는 Consumer가 kafka04의 topic2를 asset-consumer-group으로 메시지를 소비하고 있다.

## 111.11.111.11:52342 넌 누구냐?

Kafka Client - Kafka Broker의 연결관계는 파악 할 수 있게 됐습니다. 이제 좀 더 가시성을 높이기 위한 노력이 필요합니다.

우리가 눈으로 보길 기대하는 것은 111.11.111.11:52342 같은 IP:Port가 아니라 trading-server와 같은 서비스 명입니다.

request log의 connection 필드 값을 보면 IP:Port에 대한 정보만 존재합니다. 당연하겠지만 서비스 명이라는 것은 논리적인 구분이라 기계는 알 길이 없습니다.

Kafka Broker request log에 기록된 IP:Port와 일치하는 Kubernetes pod name을 찾기 위해 Linux conntrack을 사용하기로 했습니다. conntrack으로 Kubernetes Node에서 현재 연결된 모든 커넥션 정보를 알 수 있습니다.

토스증권 Devops Team, Server Platform Team에서 기존에 운영하고 있던 conntrack 수집이 가능한 DaemonSet이 있었어요. 도움을 요청해서 모든 서비스 Kubernetes Node의 conntrack정보를 주기적으로 ClickHouse로 수집하도록 구성 했습니다.

토스증권은 팀 간 협업이 활발하게 이루어지는 조직이에요. 이번 기회를 빌려서 많은 도움을 주신 분들께 감사 인사 드립니다.

서비스 서버가 배포된 K8S Node의 conntrack 정보를 이용해서 IP, Port를 key로 join을 했더니 이제 정확한 pod name까지 알 수 있게 됐습니다.

METADATA request log, Lag Metric, conntrack를 join하니 아래와 같은 결과로 진화했습니다.

1️⃣ trading-api-server-1 이라는 Producer가 kafka05의 topic1로 메시지를 전송하고 있다.

2️⃣ asset-consumer-1 이라는 Consumer가 kafka04의 topic2를 asset-consumer-group으로 메시지를 소비하고 있다.

## ClickHouse - 토스증권 통합 모니터링 DB

request log를 많이 줄였지만 여전히 초당 수 천 건이 발생합니다. 동시에 METADATA request log, Lag Metric, conntrack 세 개의 테이블을 삼중 join 해야합니다.

토스증권은 대부분의 Metric과 Log의 수집을 ClickHouse로 통합하고 있습니다. 기존에 주로 사용하던 Prometheus는 큰 트래픽을 받아내지 못하고 join에서 너무 큰 약점을 보여서, 이처럼 고도화 된 모니터링 시스템을 만드는 것은 제약이 컸습니다.
1. ClickHouse는 초당 수 십만 건을 입수할 수 있으면서
2. 동시에 SQL을 활용한 join도 자유자재로 가능해서 필요로 하는 모든 조건을 충족합니다.
3. Grafana 연동 역시 잘 되어서 Prometheus 기반에서 ClickHouse로 전환하는데도 큰 어려움이 없었습니다.

데이터를 수집하는 것이 중요한 것이 아니라 실제 활용을 어떻게 하는지가 가장 중요하기 때문에 여러 팀에서 다양한 형태로 활용가능하도록 도와주는 ClickHouse는 화룡점정입니다.

이번에 Realtime Data Team에서 ClickHouse로 진화된 관제 시스템을 만들어 나가는 과정을 Toss Makers Conference 25에서 소개했으니 참고해 주세요.

* [증권사 실시간 Alert 플랫폼 고군분투기](https://toss.im/tmc-25/sessions/engineering/data-35)

## ClickHouse Materialized View

Realtime Data Team은 플랫폼을 제공하는 팀입니다. 이렇게 만들어진 테이블을 다른 팀들이 쉽게 활용할 수 있게 제공할 의무가 있습니다.

긴 글을 통해 소개한 방식은 다른 팀에게 사용하라고 권하기에는 아래와 같은 삼중 조인을 해야해서 너무 복잡합니다.

    WITH
    lag AS (
      lag metric table
    ),
    metadata AS (
      kafka broker request log table
    ),
    conntrack AS (
      conntrack table
    )
    SELECT
    *
    FROM metadata B
    LEFT JOIN lag M
      ON B.clientId = M.clientId AND B.topic = M.topic
    INNER JOIN conntrack C
      ON B.natIp = C.natIp
     AND B.natPort = C.natPort
     AND B.targetIp = C.targetIp
     AND B.targetPort = C.targetPort;

ClickHouse의 Materialized View를 활용하면 실시간으로 request log가 인입될 때마다 트리거 되고, 삼중 조인 결과물이 최종 테이블에 적재됩니다.

MView 결과 테이블만 간단하게 쿼리하면 실시간으로 완성된 결과물 조회가 가능합니다.

    SELECT * FROM ***.service_graph;

세 개의 데이터 소스를 조합해서 MView로 최종 테이블을 만들어 내고 있는 과정 역시 Lineage 검색 서비스에서 바로 확인 가능합니다.
![](https://images.gogumang.com/beefa4dc44/01.avif) 그림 1. service_graph 테이블을 만드는 파이프라인

Lineage 서비스를 개발한 이후로 말로 표현할 수 없는 운영 편의성이 생겼습니다.

## 최종 결과물

Realtime Data Team에서 이 테이블을 만들어 낸 이유는 Lineage에 서비스 서버를 포함하기 위함입니다. service_graph 테이블에 실시간으로 완성된 데이터가 들어오니 이 테이블의 값을 리니지 메타데이터에 반영해주면 됩니다.

다음과 같은 과정으로 리니지에 서비스 서버의 실시간 연결 현황을 표현하고 있습니다.
1. 최근의 모든 연결 정보 얻기 위해 ClickHouse service_graph 테이블에 쿼리
2. 쿼리 결과를 Kafka Topic으로 전송
3. 리니지 메타데이터를 처리하는 Flink Job은 실시간으로 Kafka Topic을 컨슘해서
   1. 신규 연결은 MongoDB 리니지 collection에 추가하고
   2. 사라진 연결은 collection에서 제거하는 방식으로 리니지 메타데이터 최신화

이 과정을 통해 그려지는 Kafka Producer / Consumer의 연결 현황입니다.
![](https://images.gogumang.com/beefa4dc44/02.avif) 그림 2. 특정 Topic으로 메시지를 발행하는 Producer와 발행된 메시지를 소비하는 Consumer 리니지 시각화

ClickHouse는 Grafana와의 연동도 잘 되기 때문에 service_graph 테이블로 아래와 같이 구성해볼 수 있습니다.

vector를 검색하면 서비스 명에 vector 라는 단어가 포함된 모든 서비스의 Producer와 Consumer를 볼 수 있고, 어떤 Topic을 활용하는지도 알 수 있습니다.
![](https://images.gogumang.com/beefa4dc44/03.avif) 그림3. Grafana에서 서비스 명 vector 검색

Kafka Client와 Kafka Broker의 실시간 연결 정보를 담은 테이블이 생겼기 때문에 이제 여러 팀에서 니즈에 맞게 창의적으로 활용할 수 있습니다. ClickHouse 테이블로 제공되기 때문에 리니지를 그리는 것은 하나의 사례에 불과하고, SQL로 각종 통계도 쉽고 빠르게 뽑을 수 있고 필요한 데이터도 손 쉽게 추출 가능합니다.

## 마무리

Kafka 기반의 MicroService Architecture 혹은 Event Driven Architecture는 여러가지 장점은 분명히 갖고있지만 Kafka와 서비스의 관계를 제대로 모니터링 할 수 없다면 장애에 취약한 구조가 됩니다.

MSA 구조를 적극적으로 채용하고 있는 토스증권은 MSA 구조의 장점은 모두 취하면서 단점을 최소화 하기 위해 관제 시스템 고도화를 해내는 과정에 있습니다. 이번 글에서 다룬 Kafka Client와 Kafka Broker간 100% 커버리지로 실시간 연결 관계를 찾아내는 것은 그 노력 중 한 가지입니다.

너무나도 중요하고 동시에 해내기 어려운 과제다보니, 오랜 시간 방법을 찾기 위해 고민했고 데이터 검증에도 시간을 많이 썼는데요. 많은 분들의 도움으로 좋은 결과물을 만든 것 같아서 보람도 있었고, 실제로 토스증권 시스템 가시성이 높아져서 안정감이 많이 생겼습니다.

이번 글은 특히 회사별로 상황이 다르기 때문에 보편적으로 적용할 수 있는 솔루션은 아닐거라고 생각합니다. 결과물 보다 안정적인 증권 시스템을 만들기 위해 고민하고 노력하고 있는 과정들을 봐주시면 더욱 큰 의미가 있을 것 같습니다.

긴 글 읽어주셔서 감사합니다.