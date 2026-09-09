안녕하세요, 토스 Data Online Processing(DOP) 팀의 이유진입니다.

토스에서는 서비스 조회와 분석 쿼리를 한 플랫폼에서 빠르게 처리하기 위해 StarRocks를 실시간 OLAP 엔진으로 도입했어요. 하나의 클러스터 위에 성격이 다른 워크로드가 쌓이다 보니, "누구의 쿼리를 먼저 보호할 것인가"가 운영의 핵심 질문이 되었습니다.

이 글(1편)에서는 StarRocks 클러스터를 운영하면서 겪었던 이야기, 그중에서도 Resource Group으로 워크로드를 분류하고 CPU 우선순위를 설계한 과정과 그 과정에서 만난 함정들을 공유합니다. 이어지는 2편에서는 이 격리가 실제로 동작하게 만드는 FE/BE/CN 서버 설정 이야기를 다룹니다. 파라미터 하나가 클러스터 전체 성능을 좌우하는 환경에서, 서로 다른 아키텍처의 클러스터들을 어떻게 하나의 구조로 일관되게 관리하고 있는지를 정리할 예정이에요.

## 왜 StarRocks였나

토스에서는 서비스 조회와 분석 쿼리를 한 플랫폼에서 빠르게 처리하기 위해 StarRocks를 실시간 OLAP 엔진으로 도입했어요. 초기에는 MySQL과 Hadoop 계열 시스템을 오가며 같은 데이터를 검증하고 서빙해야 하는 이중 경로가 문제였습니다. 서비스 개발에서 Spark 배치로 생성한 데이터와 MySQL 온라인 쿼리 결과를 같은 기준으로 비교해야 했고, 모니터링·시각화 영역에서는 Hadoop의 데이터를 별도 MySQL로 옮겨 서빙해야 하는 번거로움이 있었어요.

StarRocks는 이런 이중 경로를 줄이는 역할을 했습니다. MySQL과 유사한 SQL 인터페이스로 기존 쿼리를 비교적 쉽게 옮길 수 있었고, 대용량 분석과 서비스 조회를 한 엔진에서 처리하는 것이 가능해졌습니다. 그 결과 데이터 검증, 대시보드 조회, 서비스성 읽기 트래픽이 점차 StarRocks로 모였고, 운영 환경에서는 워크로드 성격에 따라 서비스용, 모니터링·배치용 등으로 용도에 따라 클러스터를 나누어 운영하게 되었어요. 다만 각 클러스터 내부에서는 여전히 광고 서빙, 대출 심사, 대시보드 조회, Kafka Connect 기반 적재, 배치처럼 서로 다른 성격의 워크로드가 함께 공존했습니다.

서비스형 클러스터는 24시간 평균 약 ` `69 qps` `, 1주 평균 87 qps의 조회 트래픽을 처리하고 있었고, 모니터링·배치형 클러스터는 24시간 평균 약 20 qps의 쿼리와 더 무거운 배치성 작업을 함께 감당하고 있었어요.

결국 운영에서 중요했던 건 평균 QPS 자체보다, 이 다양한 워크로드가 같은 시간대에 겹칠 때 **어떤 쿼리를 먼저 보호할 것인가**였어요.

이를 해결하기 위해 Resource Group을 적용했는데, 실제 운영에서는 설정 간 의존 관계를 놓치면 예상과 다르게 동작하는 부분들이 있었습니다. 이 글에서는 StarRocks 3.4 기준으로, 통합 클러스터에서 서로 다른 워크로드를 어떻게 분류하고 보호했는지, 그 과정에서 만난 주의점을 정리해볼게요.

*** ** * ** ***

## 1부: 워크로드 분류와 CPU 우선순위 설계

StarRocks Resource Group은 BE(Backend)와 CN(Compute Node)의 컴퓨팅 리소스를 논리적으로 분할하는 기능이에요. 참고로 토스에서는 BE와 CN을 Docker 컨테이너로 배포하고 있는데, 이 구성이 Resource Group 동작에 영향을 주는 부분은 3부에서 따로 다룹니다. 운영에서는 먼저 워크로드를 나누고, 그 분류에 맞춰 CPU 우선순위를 설계한 뒤, 배타적 격리가 필요한 경우 따로 설정을 추가했어요.

### 워크로드를 먼저 나눴어요

실제 운영에서는 워크로드를 대략 **서비스 쿼리 \> 서버 배치 \> 대규모 적재·백필 \> 모니터링·사용자 쿼리 툴** 순으로 봤습니다. 서비스 쿼리는 SLA를 준수해야 했기에 가장 먼저 보호해야 했고, 서버 배치는 완료 시간이 중요했지만 실시간 응답이 필요하지 않아서 서비스보다 뒤에 두었죠. 대규모 적재와 백필은 클러스터 전체를 쉽게 압박할 수 있어 별도 상한이 필요했고, Grafana·Tableau·Redash 같은 모니터링성 조회는 가장 낮은 우선순위로 두었어요.

처음엔 cpu_weight 설정을 통해 리소스 제어를 하고, 서비스 SLA 준수가 필요한 그룹이나 특정 그룹이 CPU를 과도하게 점유해서 상한을 강제로 걸어야 하는 경우에 exclusive_cpu_cores를 적용했습니다.

### 기본은 ` `cpu_weight` `

cpu_weight는 CPU가 경합할 때 설정된 비율대로 분배됩니다. 비유하자면, 놀이공원에서 패스트트랙을 산 사람(높은 weight)이 일반 대기줄보다 먼저 탈 수 있는 것과 비슷한데 --- 놀이기구가 텅 비어 있으면 패스트트랙이든 일반이든 바로 탈 수 있거든요. weight가 의미를 갖는 건 줄이 길어질 때, 즉 CPU가 경합할 때입니다.

그래서 Resource Group 설계의 기본값은 '어떤 워크로드를 더 중요하게 볼 것인가'를 weight으로 표현하는 거였어요.
> **더 알아보기 --- 내부 스케줄링 메커니즘**
>
**내부적으로는 Linux CFS에서 영감을 받은 자체 스케줄러가 동작하는데, weight가 높을수록 같은 실행 시간에 대해 우선순위가 느리게 소모되는 구조라서 더 많은 CPU 시간을 받게 됩니다. 파이프라인 드라이버가 100ms 타임 슬라이스 단위로 양보하면서 이 스케줄링이 적용돼요.**

    CREATE RESOURCE GROUP service_wg
    TO (user='service_app', query_type IN ('SELECT'))
    WITH ('cpu_weight' = '50', 'mem_limit' = '40%', 'concurrency_limit' = '30');

    CREATE RESOURCE GROUP batch_wg
    TO (user='airflow_batch', query_type IN ('INSERT'))
    WITH ('cpu_weight' = '10', 'mem_limit' = '60%', 'concurrency_limit' = '10');

    CREATE RESOURCE GROUP dashboard_wg
    TO (user='dashboard_reader', query_type IN ('SELECT'))
    WITH ('cpu_weight' = '5', 'mem_limit' = '30%', 'concurrency_limit' = '20');

이렇게 설정하면 CPU가 경합할 때 service_wg가 batch_wg보다, batch_wg가 dashboard_wg보다 더 많은 CPU를 가져갑니다. 반대로 경합이 없으면 어느 그룹이든 비어 있는 CPU를 자유롭게 활용할 수 있거든요. 그래서 일반적인 멀티테넌트 환경에서는 cpu_weight만으로도 많은 문제를 완화할 수 있었어요.

### 예외적으로 exclusive_cpu_cores를 썼어요

exclusive_cpu_cores는 물리 CPU 코어를 해당 그룹에 전용으로 예약해요. 단순히 코어를 '예약'하는 게 아니라, 내부적으로는 pthread_setaffinity_np로 스레드를 코어에 바인딩하고, **전용 3벌 ThreadPool을 통째로 분리 생성**합니다. 3벌이라는 건 StarRocks 파이프라인 엔진에서 쿼리 실행에 관여하는 풀을 역할별로 나눈 건데요,
* **DriverExecutor** --- 파이프라인 드라이버(쿼리 연산) 실행
* **ScanExecutor** --- 로컬 OLAP 테이블 스캔
* **ConnectorScanExecutor** --- Hive/Iceberg/JDBC 같은 External Catalog 스캔

exclusive_cpu_cores가 설정된 그룹은 이 3개 풀을 **공유 풀과 별개로** 통째로 복제해서 가지고, 그 안의 워커 스레드들이 지정된 코어에만 붙도록 affinity가 설정돼요. 덕분에 공유 풀과 경합이 전혀 없어지는 거죠.

설정 범위는 (0, min_be_cpu_cores - 1]이며, **같은 리소스 그룹 안에서** cpu_weight와 동시에 사용할 수 없어요. 다만 같은 클러스터 내에서 exclusive_cpu_cores 그룹과 cpu_weight 그룹이 공존하는 건 가능합니다. 실제로 사례에서도 일부만 exclusive_cpu_cores로 빼고, 나머지 그룹은 전부 cpu_weight로 운영했어요.

    CREATE RESOURCE GROUP service_wg
    TO (user='service_user', query_type IN ('SELECT'))
    WITH ('exclusive_cpu_cores' = '8', 'mem_limit' = '50%', 'concurrency_limit' = '30');

두 방식의 차이를 정리하면:

|    구분    |  `cpu_weight`   |       `exclusive_cpu_cores`       |
|----------|-----------------|-----------------------------------|
| 목적       | 상대 우선순위 조절      | 물리 코어 단위의 하드 격리                   |
| 격리 수준    | 소프트 (경합 시에만 적용) | 하드 (물리 코어 예약 + 전용 ThreadPool 분리)  |
| 유휴 시     | 다른 그룹이 자유롭게 사용  | 리소스 그룹 독점적 사용 (`borrowing` 별도 설정) |
| 적합한 워크로드 | 일반적인 분석/대시보드/배치 | 레이턴시 SLA가 엄격한 서비스                 |
| 설정 범위    | 양의 정수           | `(0, min_be_cpu_cores - 1]`       |

기본값은 cpu_weight이고, 배타적인 보호가 정말 필요할 때만 exclusive_cpu_cores를 도입하는 편이 운영상 안전하다고 판단했습니다.

### 토스쇼핑 사례 --- cpu_weight에서 exclusive_cpu_cores까지

토스쇼핑에서 사용하는 StarRocks 클러스터에는 실시간 서비스 조회 계정과 헤비 배치성 워크로드 계정이 같은 클러스터를 공유하고 있었어요. 편의상 서비스 계정을 shopping_service, 배치성 워크로드 계정을 commerce_batch라고 부를게요. 이 구조 때문에 두 번의 조정이 필요했습니다.

### 1단계: cpu_weight 조정

처음에는 commerce_batch 쪽의 무거운 쿼리가 길게 점유하면서 shopping_service까지 함께 밀렸어요. 두 계정이 비슷한 우선순위로 묶여 있어서 배치 쪽 쿼리가 커지면 서비스 쿼리도 함께 영향을 받았습니다.
![](/images/3c5a5ca9fa/01.avif)

이때는 shopping_service에 더 높은 weight를 부여하고, commerce_batch는 낮은 우선순위로 내려서 경합 발생 시 서비스 쿼리가 먼저 CPU를 할당받을수 있도록 설정했어요.

### 2단계: exclusive_cpu_cores 적용

그런데 shopping_service가 실시간 조회를 처리하는 동안 commerce_batch 쪽에서 헤비 배치 작업이 같은 시간대에 겹치는 일이 반복됐어요. 분당 약 1,500건 수준의 서비스 요청이 들어오는 구간에서 응답 시간이 계속 튀었고, CPU 상대 우선순위 조정만으로는 안정적으로 막기 어려웠습니다.

그래서 shopping_service만 별도 리소스 그룹으로 분리하고 exclusive_cpu_cores로 전용 코어를 할당했어요.

    CREATE RESOURCE GROUP commerce_wg
    TO (user='shopping_service', query_type IN ('SELECT'))
    WITH (
        'exclusive_cpu_cores' = '...',
        'mem_limit' = '...',
        'concurrency_limit' = '...'
    );

전용 코어를 할당한 뒤로는 commerce_batch 쪽 헤비 워크로드가 겹쳐도 shopping_service 응답 시간이 튀던 패턴이 사라졌어요.

결국 cpu_weight로 시작해서, 레이턴시가 해소되지 않으면 exclusive_cpu_cores로 올리는 식으로 점진적으로 강화해 나갔습니다.

*** ** * ** ***

## 2부: Classifier와 리소스 제어 파라미터

CPU 격리만으로는 모든 워크로드 충돌을 막을 수 없었습니다. 대시보드에서 풀 스캔 쿼리가 메모리를 독점하거나, 동시에 수백 개의 쿼리가 몰리는 상황에도 별도의 제어가 필요합니다.

### Classifier 설계 --- 시행착오에서 배운 것

Classifier는 쿼리 속성(user, role, query_type, source_ip, db 등)을 기반으로 쿼리를 리소스 그룹에 매칭하는 규칙이에요. CPU 설계가 "어떤 그룹을 더 보호할 것인가"의 문제라면, Classifier는 "어떤 쿼리를 그 그룹으로 보낼 것인가"의 문제입니다.

결론부터 말하면, 운영에서 안정적으로 쓸 수 있는 패턴은 **user 또는 db 기반**으로 잡는 겁니다. 서비스 쿼리는 user='shopping_service' AND query_type IN ('SELECT')처럼 서비스 계정 기준으로 묶고, 서버 배치는 user='airflow_batch', 대시보드 조회는 user='dashboard_reader' 기준으로 묶는 식이죠.

Classifier의 matching degree 계산식은 조건별 가중치가 크게 다릅니다. 가장 영향이 큰 건 db 조건으로, 데이터베이스 1개당 +10이라는 큰 값이 붙어요. 반면 user/role은 +1, source_ip나 query_type도 1점대 수준이라서, **db 조건이 들어간 classifier와 다른 조건만 있는 classifier가 동시에 매칭되면 db 쪽이 거의 항상 이깁니다.**

그래서 운영할 때 주의할 점은:
1. **db 기반 classifier를 만들었다면 그 db에 접근하는 쿼리가 들어갑니다**. user 조건만 잡아둔 다른 그룹이 있어도 db가 설정된 그룹으로 매칭됩니다. db classifier는 영향 범위가 넓다는 걸 인지하고 써야 합니다.
2. **단일 조건보다 여러 조건을 조합하면 weight가 합산**되므로, 의도한 그룹에 안정적으로 매칭하고 싶다면 user='X' AND query_type IN ('SELECT')처럼 조건을 늘려서 weight를 높이는 것도 방법이에요.
3. user와 db 중 무엇을 기본 키로 잡을지는 weight가 아니라 **운영 모델**로 정해야 합니다. 한 user가 여러 db를 오가는 구조라면 user 기반이 자연스럽고, 한 db를 여러 user가 공유한다면 db 기반이 단순해요.

    -- 서비스 계정은 commerce_wg로
    CREATE RESOURCE GROUP commerce_wg
    TO (user='commerce_user', query_type IN ('SELECT'))
    WITH ('exclusive_cpu_cores' = '8', 'mem_limit' = '40%');

    -- dw_common 조회는 analytics_wg로
    CREATE RESOURCE GROUP analytics_wg
    TO (db='dw_common', query_type IN ('SELECT'))
    WITH ('cpu_weight' = '50', 'mem_limit' = '30%');

여러 Classifier가 동시에 매칭되면 matching degree가 높은 쪽이 선택되고, 같으면 조건 수가 많은 Classifier가 우선해요. 그래도 같으면 임의로 선택되므로, **Classifier는 가능하면 겹치지 않게 설계하는 게 안전합니다.**

마지막으로 한 가지 더 알아둘 점은, **Classifier로 잡을 수 있는 워크로드 종류에 제약이 있다**는 거예요. StarRocks 3.4 문서 기준 Resource Group의 직접 관리 대상은 일반 쿼리, INSERT INTO, Broker Load까지입니다. Routine Load와 Stream Load는 Resource Group으로 직접 제어되지 않으므로, Kafka 입수 같은 적재 워크로드를 격리하고 싶다면 INSERT INTO 배치나 Broker Load 기준으로 설계해야 해요.

### CPU 외에는 이렇게 제어했어요

### concurrency_limit --- 동시 실행 쿼리 수 제한

    ALTER RESOURCE GROUP dashboard_wg WITH ('concurrency_limit' = '20');

리소스 그룹 내에서 동시에 실행할 수 있는 쿼리 수를 제한합니다. 초과하는 쿼리는 큐에 들어가고, 이때 쿼리 이력의 pendingTimeMs가 0보다 커지거든요. 대시보드처럼 패널에 따라 동시 요청이 폭증할 수 있는 그룹이나, 헤비 쿼리를 동시에 여러 개 날리는 유저 그룹에 설정하면 클러스터 전체가 밀리는 걸 방지할 수 있어요.

    쿼리 유입 → Classifier 매칭 → 리소스 그룹 선택
                                        │
                            concurrency_limit 초과?
                            ├─ No → 즉시 실행
                            └─ Yes → 큐 대기 (pendingTimeMs 증가)
                                        │
                                     슬롯 확보 → 실행

### big_query 제한 --- 폭주 쿼리 자동 킬

서비스나 배치 쿼리는 쿼리 패턴이 어느 정도 예측 가능하지만, adhoc 쿼리는 사용자가 직접 작성하는 경우가 많기에 예상치 못한 풀스캔이나 대규모 조인이 들어올 수 있어요. cpu_weight로 우선순위를 낮춰도 이런 쿼리 하나가 리소스를 독점하면 다른 쿼리까지 영향을 받습니다. big_query 옵션은 기준을 초과하는 쿼리를 강제 종료해줘요. 주의할 점은 이 제한이 **쿼리 전체 합계가 아니라 개별 BE 노드 기준**이라는 거예요. 10개 BE에 분산 실행되는 쿼리라면, 각 BE에서의 CPU time, scan rows, memory usage가 각각 limit과 비교됩니다.

종료된 쿼리는 어떤 limit에 걸렸는지에 따라 메시지가 다르게 찍혀요. 쿼리 이력나 클라이언트 에러를 보고 어디에서 잡혔는지 바로 구분할 수 있습니다.

|            초과 항목             |                                 종료 메시지                                 |
|------------------------------|------------------------------------------------------------------------|
| `big_query_cpu_second_limit` | `Big query cpu second limit exceeded`                                  |
| `big_query_scan_rows_limit`  | `Big query scan rows limit exceeded`                                   |
| `big_query_mem_limit`        | `Mem usage has exceed the big query limit of the resource group [그룹명]` |

    -- 대시보드 그룹: CPU 300초 초과 또는 10억 행 스캔 시 킬
    ALTER RESOURCE GROUP dashboard_wg WITH (
        'big_query_cpu_second_limit' = '300',
        'big_query_scan_rows_limit' = '1000000000'
    );

    -- 배치 그룹: 메모리 10GB 초과 시 킬
    ALTER RESOURCE GROUP batch_wg WITH (
        'big_query_mem_limit' = '10737418240'
    );

### mem_limit과 spill_mem_limit_threshold --- 합이 100%를 넘을 수 있다는 주의점

mem_limit은 리소스 그룹이 각 BE 노드에서 사용할 수 있는 메모리 비율을 설정해요. 범위는 (0, 1]이며 필수값입니다.

여기서 실수하기 쉬운 부분이 있어요. **여러 리소스 그룹의**mem_limit**합이 100%를 초과할 수 있다는 거예요.** mem_limit은 각 그룹의 상한이지, 예약이 아닙니다. Group A(mem_limit=80%)와 Group B(mem_limit=70%)가 동시에 최대 메모리를 사용하면 합계 150%로 메모리 경합이 발생해요. 이때 초과하는 쿼리는 이런 에러로 종료됩니다:

    Memory of load_wg exceed limit.
    Used: 203518716712, Limit: 203517025320.
    Mem usage has exceed the limit of the resource group [load_wg]

v4.0에서 도입된 mem_pool은 동일한 풀을 지정한 리소스 그룹들이 메모리 제한을 공유하는 기능이에요. 현재 운영 중인 v3.4에서는 사용할 수 없지만, 향후 업그레이드 시 합계를 수동으로 관리하는 부담을 줄여줄 수 있습니다.

spill_mem_limit_threshold는 리소스 그룹 차원에서 스필을 검토하기 시작하는 기준인데, 실제 스필은 enable_spill, spill_mode, 연산자 지원 여부가 함께 맞아야만 동작해요.

|            파라미터             |    역할     |  기본값  |               동작               |
|-----------------------------|-----------|-------|--------------------------------|
| `mem_limit`                 | 메모리 상한    | 필수    | 초과 시 쿼리 에러                     |
| `spill_mem_limit_threshold` | 스필 고려 임계치 | `1.0` | 조건 충족 시 `mem_limit` 기준으로 스필 시작 |

## 3부: 실전에서 만난 주의점과 적용 결과

1부에서 토스쇼핑 사례에 exclusive_cpu_cores를 적용한 과정을 다뤘는데, 이 설정이 실제로 의도한 대로 동작하려면 몇 가지 전제 조건이 필요해요. 토스에서는 StarRocks BE와 CN을 Docker 컨테이너로 배포하고 있는데, 이 구성에서는 exclusive_cpu_cores, bind_cpus, cpu_borrowing 동작이 Linux cgroup의 cpuset 설정과 직접 연결돼요.

    Docker --cpuset-cpus 설정
            │
            └─→ enable_resource_group_bind_cpus = true (be.conf, 재시작 필요)
                    │
                    ├─→ exclusive_cpu_cores 코어 바인딩 동작
                    │
                    └─→ enable_resource_group_cpu_borrowing 동작 가능
                                │
                                └─→ Exclusive RG idle 시 Shared RG가 빌림

docker로 배포한 환경에서 이 체인에서 상위 설정이 누락되면, 하위 설정이 적용되지 않습니다.

### 주의점 1. Docker cpuset 미설정 --- bind_cpus 미적용

StarRocks BE를 Docker 컨테이너로 운영할 때, 대부분 --cpus 옵션으로 CPU를 제한해요. 그런데 이것만으로는 부족합니다.

    # ❌ bind_cpus가 동작하지 않음
    docker run --cpus=92 ...

    # ✅ cpuset-cpus를 반드시 함께 설정
    docker run --cpuset-cpus="0-91" --cpus=92

|    Docker 옵션    |           역할            |             메커니즘             |
|-----------------|-------------------------|------------------------------|
| `--cpuset-cpus` | **어떤** 코어를 쓸 수 있는지      | cgroup `cpuset.cpus`에 기록     |
| `--cpus`        | **얼마나** CPU 시간을 쓸 수 있는지 | cgroup `cpu.cfs_quota_us` 설정 |

* -cpus는 CPU 사용량만 제한하고 코어 집합은 고정하지 않아요. 그래서 Docker 환경에서는 -cpuset-cpus를 함께 설정해야 bind_cpus와 cpu_borrowing이 기대대로 동작합니다.

운영에서는 Ansible 배포 스크립트에 cpuset_cpus를 함께 넣는 방식으로 해결했는데, 구체적인 Ansible task 템플릿은 2편에서 다루고자 합니다.

### 적용 결과: exclusive_cpu_cores의 효과

load_wg는 서비스 SLA 보호를 위한 사례는 아니에요. 오히려 특정 적재 워크로드가 클러스터 전체 CPU를 과도하게 점유하던 상황에서, 다른 쿼리가 밀리지 않도록 상한을 강제로 설정한 운영 사례에 가깝습니다.

cpuset 미설정 상태에서도 exclusive_cpu_cores 자체는 동작해요. 92코어 BE에서 CPU를 98%까지 점유하던 load_wg에 exclusive_cpu_cores=50을 설정했습니다:

    ALTER RESOURCE GROUP load_wg WITH (
        'exclusive_cpu_cores' = '50'
    );

exclusive_cpu_cores를 설정하면 같은 그룹의 cpu_weight는 자동으로 무시됩니다. 나머지 그룹은 여전히 cpu_weight 기반으로 운영했죠.

**결과**: 16:00 \~ 이후를 보면 CPU 부하는 약 60%로 제한됐지만, load_wg 소속 INSERT 쿼리들의 실행 시간이 약 380\~457초로 설정 전 대비 약 100초 증가했어요. 전용 코어를 줄인 만큼 느려지는 건 예상된 트레이드오프였습니다.
![](/images/3c5a5ca9fa/02.avif)

다만 이 상태에서는 load_wg가 idle할 때도 50개 코어가 놀게 돼요. borrowing으로 해결할 수 있을까? 여기서 주의점 2를 만났습니다.

### 주의점 2. bind_cpus 비활성화 → borrowing도 같이 죽는다

exclusive_cpu_cores로 전용 코어를 할당하면, 그 그룹이 idle할 때 코어가 놀게 돼요. enable_resource_group_cpu_borrowing=true로 설정하면 idle 코어를 다른 그룹이 빌려 쓸 수 있어서, 격리와 효율을 동시에 잡을 수 있습니다.

실제로 load_wg에 exclusive_cpu_cores=50을 설정한 뒤, borrowing이 동작하는지 확인해봤어요. enable_resource_group_cpu_borrowing은 이미 true였으므로, load_wg가 idle할 때 다른 그룹이 해당 코어를 빌려 쓸 수 있어야합니다.

그런데 결과가 이상했어요. **CPU를 안 빌려주는 것 같았습니다.** borrowing이 동작했다면 다른 그룹의 쿼리가 유휴 코어를 사용하면서 CPU 사용량이 더 높아야 했는데, 그렇지 않았어요.

원인을 추적한 끝에 의존 관계를 발견했습니다:

    enable_resource_group_bind_cpus = false  (기본값)
            │
            └─→ CPU binding 비활성화
                    │
                    └─→ borrowing도 자동 비활성화

스레드가 물리 코어에 바인딩되어야 "이 코어가 놀고 있으니 빌려줄 수 있다"는 판단이 가능하기 때문이에요. 특히 Docker/cpuset 환경에서는 bind_cpus=false 상태에서 borrowing이 기대대로 동작하지 않았습니다. 이 의존 관계는 [StarRocks GitHub Issue #49965](https://github.com/StarRocks/starrocks/issues/49965)에서 확인할 수 있어요.

### 해결 후: cpuset + bind_cpus 설정으로 borrowing 동작 확인

주의할 점 1, 2를 해결하고 cpuset_cpus와 bind_cpus=true를 설정한 뒤, 노드 한 대(olap-dn1006-dc3)에 먼저 적용했어요. default_wg 그룹에서 헤비 쿼리를 실행하니, **해당 노드에서만 CPU가 거의 100%까지 사용**되었습니다. 나머지 노드는 여전히 낮은 수준을 유지하고 있어, borrowing이 정상 동작함을 확인할 수 있었어요.
![](/images/3c5a5ca9fa/03.avif)

    ┌─────────────────────┐         ┌─────────────────────┐
    │  Exclusive RG       │  idle   │   Shared RG         │
    │  (전용 코어)        │ ──────► │   (cpu_weight)      │
    │                     │  빌려줌  │                     │
    └─────────────────────┘         └─────────────────────┘

    Shared RG가 빌린 코어에서 실행 중일 때,
    Exclusive RG에 쿼리가 들어오면 → yield(양보)

bind_cpus=true + borrowing=true 상태에서는 exclusive 그룹이 idle할 때 다른 그룹이 해당 코어를 빌려 쓸 수 있어요. 다만 Exclusive RG에 쿼리가 다시 들어오면 yield 대기가 발생하는데, 일반 yield는 100ms인 반면 **borrowed CPU에서 owner 쿼리가 존재하면 선제적 yield가 5ms로 짧아져요**. 따라서 p99 레이턴시가 5ms 미만인 서비스에는 borrowing=false를 권장합니다.

### 주의점 3. exclusive_cpu_cores의 상한 --- 이종 스펙 노드

exclusive_cpu_cores에는 상한이 있어요:

    exclusive_cpu_cores cannot exceed the minimum number of CPU cores
    available on the backends minus one

**BE와 CN을 합쳐서 가장 작은 코어 수 - 1**까지만 설정할 수 있어요. 예를 들어 92코어 BE 10대와 16코어 CN 2대가 섞여 있으면, exclusive_cpu_cores의 상한은 15(16-1)가 됩니다. 92코어 기준으로 50을 설정하려 했는데, CN 때문에 제한에 걸리는 상황이 발생해요.

실제 운영에서는 CN을 제외했다가 스펙을 맞추고 다시 추가하는 방식으로 우회했습니다. 클러스터에 이종 스펙 노드를 추가할 때 기존 Resource Group 설정이 깨질 수 있으므로 주의가 필요해요.

*** ** * ** ***

## 4부: 운영 가이드

### 시나리오별 권장 구성

대부분의 환경에서는 cpu_weight**만으로 시작하는 것을 권장**해요. exclusive_cpu_cores는 cpu_weight만으로 SLA를 만족시키지 못할 때 도입합니다.

이 설정들은 be.conf에서 enable_resource_group_bind_cpus와 enable_resource_group_cpu_borrowing을 활성화해야 하는데, 시나리오별 권장 구성과 구체적인 be.conf 설정은 [2편 --- 프로덕션 서버 설정](https://file+.vscode-resource.vscode-cdn.net/article/starrocks-server-config)에서 다룹니다.

### 모니터링: 쿼리 이력으로 실제 동작 확인하기

Resource Group이 의도대로 동작하는지 확인하려면 쿼리 이력 모니터링이 필수예요. StarRocks의 AuditLoader 플러그인은 모든 쿼리의 실행 로그를 테이블에 적재하며, resourceGroup, pendingTimeMs, queryTime, cpuCostNs 등의 필드로 리소스 그룹의 실제 동작을 추적할 수 있습니다.

pendingTimeMs가 0보다 크면 큐 대기가 발생하고 있다는 뜻이고, state = 'ERR'인 행은 big_query 제한 등에 의해 킬된 쿼리입니다. 이 지표들을 리소스 그룹별로 나눠 보면 어떤 그룹에서 병목이 생기는지 파악할 수 있어요.

    -- 리소스 그룹별 성능·대기·에러 종합 모니터링 쿼리 예시
    SELECT
        resourceGroup,
        DATE_TRUNC('hour', timestamp) AS hour,
        COUNT(*) AS query_count,
        AVG(pendingTimeMs) AS avg_pending_ms,
        MAX(pendingTimeMs) AS max_pending_ms,
        SUM(CASE WHEN state = 'ERR' THEN 1 ELSE 0 END) AS error_count
    FROM starrocks_audit_db__.starrocks_audit_tbl__
    WHERE timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY resourceGroup, hour
    ORDER BY hour, resourceGroup;

그리고 쿼리 이력을 StarRocks 내부 테이블에만 두면 클러스터 장애 시 모니터링도 함께 불가능해질 수 있어요. 저희는 쿼리 이력을 Kafka로 수집하여 외부 플랫폼에 이중 적재하고 Grafana 대시보드를 구성해서, 클러스터 장애 상황에서도 직전까지의 쿼리 로그를 추적할 수 있게 했습니다.

*** ** * ** ***

## 마무리

운영하면서 계속 느낀 건, cpu_weight만으로도 대부분의 멀티테넌트 문제가 완화된다는 겁니다. exclusive_cpu_cores는 서비스 SLA처럼 하드 격리가 정말 필요할 때만 꺼내는 카드입니다. 그리고 Docker 환경에서는 cpuset → bind_cpus → borrowing 체인을 함께 봐야 실제 동작을 이해할 수 있고, pendingTimeMs랑 쿼리 이력를 안 보면 설정이 제대로 먹히는 건지 알 수가 없어요.

Resource Group은 중요한 쿼리를 보호하고 폭주 워크로드에 상한을 거는 도구이지, 클러스터 용량을 늘려주는 기능이 아니거든요. 워크로드 총량이 클러스터 용량에 근접하면 논리적 격리만으로는 한계가 있고, CN 분리나 증설 같은 물리적 격리가 필요합니다. CN을 활용한 워크로드 라우팅과 Resource Group과의 결합 전략은 2편에서 다룰게요.

다음 글에서는 이 Resource Group이 실제로 동작하는 **FE/BE/CN 서버 설정** --- CPU 코어 수 하나로 60개 설정을 자동 계산하는 Ansible 템플릿 구조와, 설정을 잘못 복사해서 프로덕션이 멈춘 장애 사례를 다룰게요.

*** ** * ** ***

**참고 자료**

* [StarRocks 공식 문서 --- Resource Group (v3.4)](https://docs.starrocks.io/docs/3.4/administration/management/resource_management/resource_group/)
* [StarRocks GitHub Issue #49965](https://github.com/StarRocks/starrocks/issues/49965) --- bind_cpus와 borrowing 의존 관계
* [StarRocks PR #50809](https://github.com/StarRocks/starrocks/pull/50809) --- Docker bind_cpus 이슈
* [StarRocks PR #50421](https://github.com/StarRocks/starrocks/pull/50421) --- exclusive_cpu_cores 구현