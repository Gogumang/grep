안녕하세요. 공통플랫폼개발팀 데이터 엔지니어 지키입니다.

여기어때의 성장에 맞춰 **Apache Iceberg 테이블 포맷** 을 도입하고, 컴퓨팅과 스토리지가 분리된 **데이터 레이크 아키텍처**를 구축하게 된 배경과 그 과정을 소개합니다.

### 왜 변화가 필요했나

Amazon Redshift로 시작한 데이터 웨어하우스는 초기에는 충분했습니다. 하지만 조직이 성장하고 데이터가 늘어나면서, 단일 클러스터 아키텍처의 한계가 점점 선명해졌습니다.

**직면한 문제들:**

가장 먼저 느낀 것은 데이터 **적재의 비효율**: 초기에는 전체 테이블을 삭제하고 다시 로드하는 단순한 방식으로 시작했습니다. 데이터가 작을 때는 문제없었지만, 테이블이 커지면서 매일 많은 양의 데이터를 재적재하는 것이 부담이 되었습니다. 증분 처리 방식으로 개선하고, 나중에는 MERGE 패턴까지 도입했지만, 배치 시간은 계속 늘어났습니다. 제한된 시간 안에 모든 테이블을 적재하기 위해 병렬 처리를 늘렸고, 그러다 보니 워커 서버를 계속 추가해야 했습니다.

더 근본적인 문제는 단일 클러스터의 **리소스 경합**이었습니다. 야간 뿐 아니라 주간에도 시간당 배치의 필요성을 느껴 스케줄이 돌고 있었고, 여러 팀이 동시에 쿼리를 실행하면, 무거운 분석 쿼리 하나가 대시보드까지 느려지게 만들었습니다. 3시간 이상 실행되는 쿼리를 지속적으로 모니터링하며 수동으로 프로세스를 중단시키는 일이 빈번했고, 테이블 Lock으로 인해 후속 스케줄이 지연될 경우 긴급하게 쿼리를 강제 종료해야 했습니다. 이러한 사후 대응 방식으로는 근본적인 문제 해결에 한계가 있었습니다.

성능 문제는 해결하기위해 클러스터를 확장하자 **비용** 이 급격히 **증가**했습니다. 이에 대한 절충안으로 Redshift Spectrum을 도입해 일부 대용량 테이블을 이관해 스토리지 비용을 덜어보았습니다. 하지만 S3를 경유하는 구조적 특성상 Native Table보다 조회 속도가 현저히 느려 적용 범위를 확대하기에는 어려웠습니다.

결국, 데이터 적재 방식을 아무리 개선해도 근본적인 한계는 극복할 수 없다는 점이었습니다. 비용 부담이 컸고, 무엇보다 특정 플랫폼에 종속적인 것과 플랫폼 확장이 유연하지 않다는 것이 우려되었습니다.

### Apache Iceberg를 선택한 이유

새로운 아키텍처를 설계하면서 가장 중요하게 생각한 것은 미래의 선택지를 열어두는 것이었습니다. 데이터 기술이 급변하는 만큼, 유연하게 대응할 수 있는 구조가 필요했습니다.

**벤더 종속성에서 벗어나기**
> ***벤더 종속성(Vendor Lock-in)*** *: 특정 벤더의 독점적인 기술이나 포맷을 사용하다 보면, 나중에 다른 플랫폼으로 옮기고 싶어도 쿼리 재작성, 데이터 재적재 등 엄청난 비용이 발생합니다. 한 번 선택하면 쉽게 바꿀 수 없게 되는 문제입니다.*

Redshift를 사용하면서 이 문제를 체감했습니다. Redshift 고유의 기능에 의존할수록, 다른 플랫폼으로 이동하는 것은 점점 어려워졌습니다.

Iceberg는 **오픈 소스 커뮤니티가 관리하는 테이블 포맷**입니다. 데이터를 Iceberg 포맷으로 저장하면, BigQuery, Spark, Flink, Athena등 심지어 Redshift 까지 연동이 되고 같은 데이터를 여러 엔진에서 자유롭게 사용할 수 있습니다.

**멀티 엔진의 실질적 가치**

여러 엔진을 지원한다는 게 왜 중요할까요?

각 엔진은 태생적으로 다른 문제를 해결하기 위해 설계되었습니다. BigQuery는 빠른 애드혹 분석에 최적화되어 있습니다. 대규모 집계 쿼리를 초 단위로 처리하지만, 복잡한 데이터 변환이나 세밀한 튜닝이 필요한 작업에는 제약이 있습니다.

반면 Spark는 메모리와 파티셔닝을 직접 제어하며 복잡한 ETL 파이프라인을 구축할 수 있지만, 쿼리 속도만 놓고 보면 BigQuery를 따라잡기 어렵습니다. Flink는 또 다른 영역을 담당합니다. 실시간 스트리밍 처리에서는 Flink만한 도구가 없지만, 배치 작업에는 과하게 복잡합니다.

문제는 실무에서 이 모든 워크로드가 동시에 필요하다는 것입니다. 이전 방식이라면 각 도구마다 데이터를 복제해야 했겠지만, Iceberg는 데이터를 한 곳에 두고 여러 엔진이 공유하게 해줍니다. 데이터 복제 없이, 메타데이터만 공유하면 됩니다.

여기어때의 멀티 엔진 활용 방식:

* **Spark**: 복잡한 데이터 변환, ETL 작업, Iceberg 테이블에 데이터 쓰기
* **BigQuery**: 빠른 애드혹 쿼리, 대시보드, BI 분석 (읽기 전용)
* **향후**: Flink 등 필요에 따라 추가 가능

만약 BigQuery 비용이 올라가거나 더 나은 도구가 나온다면? 데이터는 그대로 두고 엔진만 바꾸면 됩니다.

**클라우드 이전의 자유**

물론 클라우드를 옮겨야 하는 상황이 온다면 그것도 가능합니다. Iceberg 데이터를 다른 스토리지(S3, Azure Blob Storage 등)로 복사하고, **Catalog만 해당 클라우드의 메타스토어로 바꾸면** 그대로 사용할 수 있습니다. 데이터를 재가공하거나 포맷을 변환할 필요가 없습니다. 쿼리 엔진도 BigQuery에서 Athena나 Snowflake로 바꾸면 됩니다.

다만 데이터 이전 자체에는 비용이 적지 않게 발생합니다. 실제로 이번 Redshift에서 GCP로 마이그레이션할 때도 상당한 데이터 전송 비용이 들었습니다. 특히 클라우드 간 데이터 이동에서는 데이터 유입 비용은 적지만, 데이터 송출 비용이 많이 발생합니다. AWS에서 데이터를 내보낼 때 GB당 과금되는 구조입니다.

하지만 중요한 것은 데이터 포맷 변환이나 애플리케이션 추가 개발 없이 전송 비용만으로 플랫폼을 바꿀 수 있다는 것이 핵심입니다. 벤더 종속 포맷을 사용했다면 전송 비용 외에 엔지니어링 비용, 시간, 리스크까지 감수해야 했을 것입니다.

### 왜 GCP와 BigQuery였나

Iceberg를 선택했다면, 어떤 클라우드에서든 사용할 수 있습니다. 예를 들어 데이터를 AWS로 이전한다면, 기존 RDS 데이터가 이미 AWS 생태계에 있기 때문에 S3로의 데이터 이동이 훨씬 효율적입니다.

**그럼 왜 GCP였을까요?**

쿼리 엔진으로서 Redshift가 컴퓨팅과 스토리지를 분리했다고는 하지만, 여전히 프로비저닝된 컴퓨팅 자원 내에서 작업을 수행해야 한다는 한계가 있습니다. 반면, 클러스터 개념 없이 거대한 자원 풀에서 쿼리 실행 시점에 필요한 슬롯을 즉시 할당받아 사용하는 BigQuery의 장점이 주효했습니다.

* **독립적인 리소스 할당**: 무거운 쿼리가 다른 쿼리에 영향을 주지 않음
* **동시 실행 가능**: 여러 팀이 동시에 쿼리해도 서로 영향 없음
* **클러스터 관리 불필요**: 별도의 튜닝이나 설정이 필요 없음

또한, 아키텍처 측면에서도 다음과 같은 차별화된 강점이 있습니다.

* BigQuery의 서버리스 아키텍처: 인프라 관리가 전혀 필요 없는 클라우드 네이티브 환경 제공
* BigQuery Metastore Catalog: Iceberg 테이블 사용을 위한 카탈로그 지원
* GCP 생태계와의 유기적 연동: 다양한 Google Cloud 서비스들과 자연스럽게 연결되는 확장성

### Iceberg 데이터레이크 아키텍처

![](https://cdn-images-1.medium.com/max/1024/1*reZpquuDHmoTHsypCA9NbA.png)

가장 중요한 것은 데이터와 메타데이터를 분리한 것입니다. 데이터는 GCS에 Iceberg 포맷으로 저장되고, 메타데이터는 BigLake Metastore에서 중앙 관리됩니다. 각 엔진은 메타스토어를 통해 어떤 데이터가 어디에 있는지 알고, 필요한 데이터만 읽어갑니다.

**Google Cloud Storage — 확장 가능한 저장소**

데이터 저장소로는 GCS를 선택했습니다. 객체 스토리지의 **확장성과 경제성**이 매력이었습니다. 데이터가 늘어나도 자동으로 확장되고, 사용한 만큼만 비용을 내면 됩니다. Redshift처럼 미리 클러스터 크기를 정하고 비용을 예측할 필요가 없습니다.

보안도 기본으로 제공됩니다. 모든 데이터가 자동으로 암호화되고, 라이프사이클 관리 기능으로 오래된 데이터는 저렴한 스토리지(Nearline, Coldline, Archive)로 자동 이동시킬 수 있습니다.

**Apache Iceberg — 파일 시스템 위에 구축된 고성능 테이블 포맷**

GCS와 같은 객체 스토리지에 데이터를 단순히 파일 형태로 적재하는 것을 넘어, **Apache Iceberg**를 도입하여 체계적으로 관리합니다.

Iceberg의 핵심은 ‘파일 포맷’이 아닌 ‘테이블 포맷’이라는 점입니다. 일반적인 Parquet 파일이 단순히 데이터를 담고 있는 개별 파일들의 집합이라면, Iceberg는 이 파일들 위에 메타데이터 계층을 얹어 데이터베이스 테이블과 같은 기능을 제공합니다. 이를 통해 파일 시스템 위에서도 스키마 관리, 파티셔닝, ACID 트랜잭션, 타임 트래블과 같은 고급 기능을 사용할 수 있습니다.

**데이터 파일:**

실제 물리적인 데이터는 Parquet와 같은 컬럼 기반 포맷으로 저장됩니다. 이를 통해 높은 압축률로 스토리지 비용을 절감하고, 분석 쿼리 시 필요한 컬럼만 읽어들이는 빠른 성능을 보장합니다.
> *BigQuery의 BigLake Metastore 서비스는 현재 Parquet만 지원하므로 Parquet를 사용했습니다.*

**메타데이터:**

Iceberg의 핵심 가치는 메타데이터 관리입니다.

* Table Metadata File (JSON): 테이블 스키마, 파티션 스펙, 스냅샷 정보
* Manifest List (Avro): 각 스냅샷에 속한 manifest 파일들의 목록
* Manifest Files (Avro): 실제 데이터 파일들의 위치와 통계 정보

이러한 계층적 메타데이터 구조를 통해 쿼리 시 필요한 파일만 읽을 수 있어 성능과 비용이 개선됩니다.

### BigLake Metastore — 멀티 엔진의 핵심

BigLake Metastore는 GCP의 **Apache Iceberg Catalog 서비스**입니다. Iceberg 테이블의 메타데이터(스키마, 파티션, 스냅샷 등)를 중앙에서 관리하며, 여러 엔진이 이 메타데이터를 공유할 수 있게 해줍니다.

**어떻게 작동할까요?**

Spark와 같은 엔진에서 테이블을 생성하면 해당 정보가 즉시 BigLake Metastore에 등록됩니다. BigQuery는 이 메타데이터를 실시간으로 참조하여 데이터를 조회하기 때문에, 사용자가 BigQuery에서 **별도로 외부 테이블 스키마를 정의하거나 업데이트할 필요가 없습니다.**

즉, **Catalog만 공유하면** 어떤 엔진을 사용하든 항상 동기화된 최신 테이블 상태에 접근할 수 있는 진정한 멀티 엔진 환경이 구현됩니다.

**메타데이터로 얻을 수 있는 정보들:**

Iceberg는 메타데이터만으로도 다양한 정보를 제공합니다.

* **테이블 통계**: 전체 레코드 수, 파일 개수, 총 데이터 크기
* **파티션 정보**: 각 파티션별 레코드 수, 데이터 크기
* **스키마 진화 이력**: 언제 어떤 컬럼이 추가/삭제/변경되었는지
* **스냅샷 히스토리**: 각 시점별 데이터 상태, 커밋 시간, 작업 내역
* **파일 레벨 메트릭**: Min/Max 값, Null 개수, 컬럼별 통계

위 정보를 알기 위해 실제 데이터를 읽을 필요가 없습니다. 이는 쿼리 성능과 비용 절감에 도움이 됩니다.

**Spark 설정 예시:**

```
spark = SparkSession.builder \
    .config("spark.sql.catalog.blms", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.blms.catalog-impl", 
            "org.apache.iceberg.gcp.bigquery.BigQueryMetastoreCatalog") \
    .config("spark.sql.catalog.blms.gcp_project", "your-project-id") \
    .config("spark.sql.catalog.blms.warehouse", "gs://your-bucket/warehouse") \
    .getOrCreate()
# Iceberg 테이블 생성
spark.sql("""
    CREATE TABLE blms.your_database.your_table (
        id BIGINT,
        name STRING,
        created_at TIMESTAMP
    ) USING iceberg
    PARTITIONED BY (days(created_at))
""")
# 데이터 적재
df.writeTo("blms.your_database.your_table").append()
```

> *서비스 명은 BigLake Metastore이나, 코드 상의 클래스명에서는 `BigQueryMetastoreCatalog`을 사용*

**BigQuery에서 바로 조회:**

```
SELECT name, COUNT(*) as cnt
FROM `project.dataset.your_table`
WHERE created_at >= '2025-01-01'
GROUP BY name;
```

메타스토어 덕분에 Spark와 BigQuery가 **같은 테이블 정의를 공유**합니다. 데이터 동기화나 복제가 필요 없습니다.

### Iceberg의 주요 기능들

1. **ACID 트랜잭션**

여러 사용자가 동시에 데이터를 읽고 쓰더라도 일관성이 보장됩니다. Spark에서 데이터를 쓰는 중에 BigQuery로 조회해도 문제없습니다. 트랜잭션이 실패하면 자동으로 롤백됩니다.

**2. Schema Evolution**

새 컬럼을 추가하거나 기존 컬럼 이름을 바꿔야 할 때, Iceberg는 데이터를 다시 쓸 필요가 없습니다.

```
-- 컬럼 추가
-- 기존 데이터는 NULL, 새 데이터부터 값이 들어감
-- 쿼리 중단 없음, 데이터 복사 불필요
ALTER TABLE your_table ADD COLUMN status STRING;
```

Redshift에서도 ALTER TABLE은 가능하지만, Iceberg는 스키마 변경 이력을 모두 추적하고 타임 트래블로 예전 스키마도 조회할 수 있습니다.

**3. Time Travel**

실수로 데이터를 잘못 업데이트했다면? Iceberg는 모든 변경 사항을 스냅샷으로 저장하므로 과거 시점으로 돌아갈 수 있습니다.

```
-- 1시간 전 데이터 조회
SELECT * FROM your_table
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR);

-- 이전 스냅샷으로 롤백
CALL BQ.ROLLBACK_TABLE('dataset.your_table', '2025-01-01 10:00:00');
```

**4. Hidden Partitioning**

Hive 스타일 파티셔닝은 사용자가 파티션 컬럼(`date`)을 WHERE 절에 명시해야 합니다.

예를 들어:

```
-- Hive 방식 (파티션 컬럼을 직접 사용해야 효율적)
-- 파티션 구조: /date=2025-01-01/category=A/data.parquet
SELECT * FROM your_table WHERE date = '2025-01-01' AND category = 'A';

-- Iceberg 방식 (원본 컬럼만 사용해도 자동 최적화)
-- 파티션 구조: 내부적으로 days(created_at)로 파티셔닝
SELECT * FROM your_table WHERE created_at >= '2025-01-01' AND category = 'A';
```

Hive는 `date`라는 별도의 파티션 컬럼을 만들어야 하지만, Iceberg는 `created_at`이라는 원본 컬럼을 그대로 사용하면서 내부적으로 `days(created_at)`로 파티셔닝합니다. 사용자는 파티션 컬럼을 의식할 필요가 없습니다.

**파티셔닝과 비용 절감:**

파티셔닝을 제대로 활용하면 **쿼리 비용을 줄일 수 있습니다**. BigQuery는 스캔한 데이터양에 따라 과금되므로, 파티션 조건을 WHERE 절에 포함하면 전체 테이블 대신 필요한 파티션만 스캔하여 비용이 감소합니다.

예를 들어:

```
-- 파티션 조건 없음: 전체 10TB 테이블 스캔 → $50 비용
SELECT * FROM your_table WHERE category = 'A';

-- 파티션 조건 포함: 하루치 10GB만 스캔 → $0.05 비용
SELECT * FROM your_table
WHERE created_at >= '2025-01-01' AND created_at < '2025-01-02'
AND category = 'A';
```

Iceberg의 메타데이터 기반 파티션 pruning 덕분에 1000배 비용 차이가 날 수 있습니다.

파티션 전략을 바꾸고 싶다면 데이터를 다시 쓸 필요 없이 메타데이터만 업데이트하면 됩니다.

```
-- 월별 파티션 → 일별 파티션으로 변경
-- 기존 데이터는 그대로, 새 데이터부터 새 파티션 전략 적용
ALTER TABLE your_table SET PARTITION SPEC (days(created_at));
```

### 구축하며 겪은 어려움

**용어와 문서의 혼란 — 명칭의 파편화**

GCP는 **BigLake Metastore** 라는 이름의 관리형 메타스토어 서비스를 제공합니다. 하지만 도입 과정에서 가장 큰 장벽 중 하나는 잦은 명칭 변경과 용어의 혼재였습니다. 코드 상의 클래스명에서는 `BigQueryMetastoreCatalog`을 사용하기에 서비스명과의 불일치도 혼란을 가중시켰습니다.

문서를 참조할 때마다 대상 테이블을 지칭하는 용어가 “BigLake metastore Iceberg tables”, “BigQuery metastore Iceberg tables”, “Iceberg tables for BigQuery” 등으로 계속해서 바뀌거나 혼용되어 등장했습니다. 이로 인해 문서에 나온 내용들이 모두 동일한 아키텍처를 설명하는 것인지, 아니면 각기 다른 기술적 방식을 의미하는 것인지 명확히 구분하기가 매우 혼란스러웠습니다.

**환경 구성의 어려움**

PoC 당시 BigLake Metastore가 지원하는 Iceberg 버전이 1.5.2였고, 각 컴포넌트를 이 버전에 맞춰야 했습니다. GCP 공식 문서는 Dataproc(GCP의 관리형 Spark) 환경을 기준으로 작성되어 있었습니다. 우리는 기존 AWS 인스턴스에서 Spark를 운영하고 있었기에 AWS와 GCP를 연결하는 구성이 필요했습니다.

가장 어려웠던 부분은 필요한 라이브러리를 찾는 것이었습니다. BigQueryMetastoreCatalog를 사용하려면 여러 라이브러리가 호환되는 조합을 찾아야 했고, 버전 충돌도 해결해야 했습니다. GCP 인증 설정, 네트워크 설정, 방화벽 규칙, Spark 설정 등 AWS 환경에서 GCP 서비스를 사용하기 위한 설정 작업도 필요했습니다. PoC를 통해 작동하는 조합을 찾았고, 나중에 팀원들이 겪지 않도록 가이드를 만들었습니다.

**제약사항과 전략적 선택**

**BigLake Metastore 기반 Iceberg 테이블 제약**

* **Read-Only:** BigQuery 내 DML(INSERT/UPDATE/DELETE) 작업 불가
* **포맷 제한:** Parquet 파일 포맷 단독 지원
* **자동 최적화 미지원:** BigQuery 자체 Clustering 및 Compaction 기능 미적용

하지만 이는 쓰기와 읽기를 분리한 운영 전략과 부합합니다.

* **데이터 쓰기:** Spark 주도의 모든 데이터 변경 및 최적화 수행
* **데이터 읽기:** BigQuery를 활용한 순수 데이터 조회 및 분석 집중

결과적으로 이 제약사항들 덕분에 엔진 간의 명확한 역할 분담이 이루어졌습니다. Spark는 데이터 처리를, BigQuery는 분석을 담당하며 각자가 가장 잘하는 영역에 집중하는 효율적인 아키텍처가 완성되었습니다.

### 얻은 것들

**운영의 여유**

서버리스 아키텍처의 가장 큰 장점은 신경 쓸 게 줄어든다는 것입니다.

Redshift를 운영할 때는 성능 문제가 생기면 어느 레이어에서 병목이 생겼는지 찾느라 시간을 보냈습니다. 배치가 느려지면 클러스터 크기를 늘려야 하나, 쿼리를 최적화해야 하나, 워커 서버를 더 추가해야 하나 고민해야 했습니다

BigQuery는 쿼리를 던지면 알아서 리소스를 할당하고, 끝나면 반환합니다. 50개 쿼리가 동시에 실행되어도 각자 독립적인 리소스를 받습니다. 한 팀의 무거운 쿼리가 다른 팀에 영향을 주지 않습니다. 리소스 경합으로 인한 문제가 사라졌습니다.

Iceberg의 자동 최적화도 도움이 됩니다. Hidden Partitioning으로 사용자는 파티션을 의식하지 않고 원본 컬럼만으로 쿼리할 수 있게 해줍니다.

다만 작은 파일들이 쌓이는 문제는 여전히 발생하므로, 주기적으로 Data Compaction을 포함한 **Table Optimization 작업을 스케줄링**해야 합니다. 완전히 자동화된 것은 아니지만, 메타데이터 기반으로 최적화가 필요한 테이블과 파티션을 식별할 수 있습니다.

**데이터 품질과 안정성**

Iceberg의 **ACID 트랜잭션**은 동시성 문제를 해결해줍니다. Spark에서 데이터를 쓰는 동안 BigQuery로 조회해도 일관된 스냅샷을 보장받습니다. 트랜잭션이 실패하면 자동 롤백되어 중간 상태의 데이터가 노출되지 않습니다.

**Schema Evolution**도 도움이 됩니다. 새 컬럼을 추가하거나 스키마를 바꿀 때 서비스 중단이나 데이터 복사 없이 즉시 적용됩니다. Redshift에서도 ALTER TABLE은 가능하지만, Iceberg는 변경 이력까지 추적하고 Time Travel로 예전 스키마도 조회할 수 있습니다.

**미래를 위한 선택지**

현재는 BigQuery를 주로 쓰지만, 필요하면 다양한 쿼리 엔진을 추가할 수 있습니다. 데이터를 옮길 필요 없이 메타스토어만 연결하면 됩니다. 더 나은 도구가 나오면 시도해볼 수 있고, 비용 효율이 좋은 옵션이 생기면 전환할 수 있습니다. 이런 선택의 자유가 생겼다는 것이 가장 큰 변화입니다.

### 마치며

현재 여기어때의 Iceberg 데이터레이크는 주로 배치 처리 중심입니다. 앞으로는 실시간 스트리밍 처리를 강화하고, 데이터 거버넌스 체계를 고도화하며, 비용 최적화를 지속해 나갈 계획입니다.

변화하는 요구사항에 유연하게 대응할 수 있는 기반을 마련했고, 특정 벤더에 종속되지 않는 전략적 자유를 확보했습니다. 무엇보다 데이터 팀이 인프라 운영보다는 데이터 그 자체에 집중할 수 있는 환경을 만들었습니다. 이 글이 비슷한 고민을 하는 분들에게 도움이 되었으면 합니다.

### 참고자료

[Object Lifecycle Management \| Cloud Storage \| Google Cloud Documentation](https://cloud.google.com/storage/docs/lifecycle)

[Java API — Apache Iceberg™](https://iceberg.apache.org/docs/latest/api/#table-metadata)

[Performance — Apache Iceberg™](https://iceberg.apache.org/docs/latest/performance/#metrics)

[Reliability — Apache Iceberg™](https://iceberg.apache.org/docs/latest/reliability/)

[Evolution — Apache Iceberg™](https://iceberg.apache.org/docs/latest/evolution/)

[Partitioning — Apache Iceberg™](https://iceberg.apache.org/docs/latest/partitioning/)

[BigQuery](https://cloud.google.com/bigquery/pricing?hl=en)

[Evolution — Apache Iceberg™](https://iceberg.apache.org/docs/latest/evolution/#partition-evolution)

[Introduction to BigLake metastore \| Google Cloud Documentation](https://docs.cloud.google.com/biglake/docs/about-blms)

[Maintenance — Apache Iceberg™](https://iceberg.apache.org/docs/latest/maintenance/)