안녕하세요. \[쿠키런: 오븐브레이크\]의 서버 개발자 황재영입니다.

Database는 많은 개발자들이 유용하게 사용하면서 동시에 많은 문제를 겪는 요소라고 생각합니다. \[쿠키런: 오븐브레이크\] 팀 역시 그렇습니다. 이 글에서는 제가 22년 7월 경에 겪었던 AWS Aurora MySQL과 관련된 online alter과 CPU 100% 장애에 대해서 이야기해보려고 합니다.

# 신규 기능과 Table Alter

작업의 시작은 22년 8월에 추가된 \[쿠키런: 오븐브레이크\]의 신규 기능, `패키지 매출 랭킹`에서 비롯되었습니다. `패키지 매출 랭킹`은 현재 판매 중인 패키지들에 대해서 지난 N시간동안의 매출을 집계해서 등수를 매기고 보여주는 기능입니다. 이 기능의 내부적인 구현을 위해서는 지난 N시간동안의 패키지별 판매 수량을 집계해야 했었습니다. 그러나 기존에 구매 기록을 관리하고 있던 AWS Aurora MySQL table에는 `구매 시점` 정보가 없었기에 "지난 N시간동안"이라는 정보를 조회하기 어려웠습니다. 이를 우회하기 위한 방법도 고려해보았지만, 결론적으로는 `구매 시점` 정보를 table에 추가하기로 했습니다.

    ALTER TABLE $TABLE_NAME
    ADD COLUMN purchase_dt datetime NOT NULL DEFAULT 0,
    ADD KEY purchase_dt (purchase_dt);

`구매 시점` 정보를 purchase_dt라는 칼럼으로 생성하고 index까지 추가하기 위해서는 위와 같은 쿼리를 필요로 했습니다. 그리고 여기서 문제가 발생했습니다. 구매 기록을 관리하고 있던 table은 유저가 실제로 구매하는 로직과 직결되어 있기 때문에, 일반적인 ALTER TABLE로는 table lock이 잡혀서 문제가 될 것이기 때문에 진행할 수 없었습니다. 그렇다고 \[쿠키런: 오븐브레이크\] 팀에서 일반적으로 진행하는 점검 2시간동안 적용하기에는, 서비스 시작 이래의 모든 구매 기록을 가지고 있는 큰 크기의 테이블이었기에, 실행에 시간이 너무 오래 걸려서 어려웠습니다. 이러한 제한점 때문에 이 쿼리는 online alter를 통해 적용하는 것으로 결정하게 되었습니다.

# Online Alter Plan 1 - Inplace Algorithm

처음으로 고려해본 것은 MySQL Database에서 지원하는 기능이었습니다. 바로 lock을 잡지 않는 alter인 inplace algorithm이었는데요. 적용이 가능한지 간단히 테스트해보기 위해서, 개발팀에서 테스트로 사용하는 서버의 Database를 복제하여 alter를 진행해보았습니다. 결과는 다음과 같았습니다.

    mysql> ALTER TABLE $TABLE_NAME
        -> ADD COLUMN purchase_dt datetime NOT NULL DEFAULT 0,
        -> ADD KEY purchase_dt (purchase_dt),
        -> ALGORITHM=inplace, LOCK=none;
    ERROR 1062 (23000): Duplicate entry '73817' for key 'PRIMARY'

    mysql> ALTER TABLE $TABLE_NAME
        -> ADD COLUMN purchase_dt datetime NOT NULL DEFAULT 0,
        -> ADD KEY purchase_dt (purchase_dt),
        -> ALGORITHM=inplace, LOCK=none;
    Query OK, 0 rows affected (2.72 sec) Records: 0 Duplicates: 0 Warnings: 0

최초 시도에서는 실패하고, 2번째 시도에서는 성공하는 특이한 결과를 확인할 수 있었습니다. 최초 시도에서 발생한 에러에 대해 검색하니 [MySQL의 공식 문서](https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl-limitations.html)를 확인할 수 있었습니다. 문서에서는 위 에러가 inplace algorithm의 한계로, 간헐적으로 발생할 수 있는 문제라고 설명하고 있었습니다. 실제 서비스 환경에서 진행할 때는 더 발생할 가능성이 높은 에러로 고려되었기 때문에, inplace algorithm을 사용한 online alter plan은 폐기되었습니다.

MySQL의 기본 기능이 아닌 외부 툴에 대해서 찾아보니, **Percona Toolkit**이라는 툴에서 제공하는 online schema change라는 기능으로 실제 서비스 환경에서 online alter를 진행하는 사례를 찾았습니다. 어떤 원리로 동작하는지 궁금하여서 찾아봤더니 아래와 같이 정리할 수 있었습니다.

1. 기존 table과 동일한 스키마를 가진 신규 table 생성
2. 신규 table에 schema change를 바로 적용
3. 기존 table의 변경사항이 신규 table에도 적용될 수 있게 trigger 설정
4. 기존 table에서 일정 크기의 데이터만큼 신규 table로 복사
5. 모든 데이터를 복사할 때까지 4번을 계속 반복
6. check sum 검사를 통해 신규 table과 기존 table이 동일한 상태에 있는지 검사
7. 신규 table의 이름을 기존 table의 이름으로 변경

위 과정에 따른 online schema change에는 기존에 설정된 trigger가 없어야 한다거나 schema change에 위반되는 변경사항이 있어서는 안된다와 같은 제약사항이 있었지만, 이번에 적용하려고 하는 table에서는 문제가 없어 이 기능을 사용하여 online alter를 진행하기로 하였습니다.

해당 툴의 사용 테스트와 실제 적용은 아래와 같은 4단계로 진행하였습니다. 후술된 Staging은 내부 테스트 환경, Production은 실제 서비스 환경을 의미합니다.

1. Staging 복제본 테스트
2. Production 복제본 테스트
3. Staging 적용
4. Production 적용

# Staging 복제본 테스트

툴을 사용할 수 있는지 검증하고 실제로 일어날 변경사항을 확인하는 단계입니다.

먼저 dry run부터 사용해보았습니다.

    pt-online-schema-change \
        --dry-run
        --host $DBHOST --user $USERNAME --ask-pass \
        --alter 'ADD COLUMN purchase_dt datetime NOT NULL DEFAULT 0, ADD KEY purchase_dt (purchase_dt)' \
        D=$DB_NAME,t=$TABLE_NAME

    Starting a dry run.  `DB_NAME`.`TABLE_NAME` will not be altered.  Specify --execute instead of --dry-run to alter the table.
    Creating new table...
    Created new table DB_NAME._TABLE_NAME_new OK.
    Altering new table...
    Altered `DB_NAME`.`_TABLE_NAME_new` OK.
    Not creating triggers because this is a dry run.
    Not copying rows because this is a dry run.
    Not swapping tables because this is a dry run.
    Not dropping old table because this is a dry run.
    Not dropping triggers because this is a dry run.
    2022-07-13T11:52:58 Dropping new table...
    2022-07-13T11:52:58 Dropped new table OK.
    Dry run complete. `DB_NAME`.`TABLE_NAME` was not altered.

dry run에서는 trigger 설정도, copy도, swap도 없이 정말 툴을 사용할 수 있는지의 기본적인 검사만 이루어졌는데요. 특별한 문제가 없었기에 바로 real run으로 넘어가 보았습니다.

    pt-online-schema-change \
        --execute
        --host $DBHOST --user $USERNAME --ask-pass \
        --alter 'ADD COLUMN purchase_dt datetime NOT NULL DEFAULT 0, ADD KEY purchase_dt (purchase_dt)' \
        D=$DB_NAME,t=$TABLE_NAME

    Altering `DB_NAME`.`TABLE_NAME`...
    Creating new table...
    Created new table DB_NAME._TABLE_NAME_new OK.
    Altering new table...
    Altered `DB_NAME`.`_TABLE_NAME_new` OK.
    2022-07-13T11:55:11 Creating triggers...
    2022-07-13T11:55:11 Created triggers OK.
    2022-07-13T11:55:11 Copying approximately 9980 rows...
    ...(중략)
    2022-07-13T11:55:34 Copied rows OK.
    2022-07-13T11:55:34 Analyzing new table...
    2022-07-13T11:55:34 Swapping tables...
    2022-07-13T11:55:34 Swapped original and new tables OK.
    2022-07-13T11:55:34 Dropping old table...
    2022-07-13T11:55:34 Dropped old table `DB_NAME`.`_TABLE_NAME_old` OK.
    2022-07-13T11:55:34 Dropping triggers...
    2022-07-13T11:55:34 Dropped triggers OK.
    Successfully altered `DB_NAME`.`TABLE_NAME`.

real run에서는 원래 기대했던 기능들이 적용된 모습을 볼 수 있었습니다. 실행시간을 보면 내부 테스트용 Database라서 데이터가 많지 않아 매우 빠르게 끝났음을 알 수 있었습니다.

# Production 복제본 테스트

실제 Production에서 실행 때 일어날 변경사항과 소요 시간을 확인하는 단계입니다.

서비스의 Database 사용에 문제를 일으키지 않을 정도의 자원을 사용하면서 최대한 빠르게 실행하기 위해, Production 복제본에 적용하는 테스트는 `chunk-size` 옵션을 바꾸어 가며 여러 번 테스트를 진행했습니다. chunk-size 옵션은 위에서 설명한 작동 원리 4번의 복사 스텝에서 얼마만큼의 크기의 데이터를 복사할지를 조절하는 값으로, 이 값에 따라 툴의 실행 시간과 자원 소모량이 결정됩니다.
![Production 복제본 테스트를 실행하였을 때 확인한 CPU 그래프](https://images.gogumang.com/dd1e3de70b/01.png) Production 복제본 테스트를 실행하였을 때 확인한 CPU 그래프

그래프에서 총 3개의 피크를 확인할 수 있는데, 첫번째 피크는 Database를 생성했을 때의 피크로 무시하고, 나머지 2개의 피크에서 결과를 확인할 수 있었습니다.

2번째 피크는 chunk-size를 250으로 설정했을 때이고, 3번째 피크는 chunk-size를 500으로 설정했을 때입니다. 안정적으로 45% 정도의 CPU를 유지하는 chunk-size 250과 다르게, chunk-size 500은 최초에 CPU가 거진 80%까지 올라가고 이후에 50% 정도로 안정되는 모습을 보여주었습니다. 상시적으로 약 8%의 CPU를 사용 중인 복제본 Database와 다르게, 실제 서비스 Database는 상시적으로 약 20%의 CPU를 사용하고 있습니다. 그리고 툴 사용 중에도 CPU 70%를 넘지 않는 것을 목표로 생각하고 있었기에, chunk-size는 250으로 결정하여 Production Database에 적용하는 것으로 결정했습니다.

# Staging 환경 적용

유저가 활동하는 상황에서 online alter가 잘 되는지 테스트하는 단계입니다.

유저의 사용 패턴을 mocking하여 여러 종류의 복잡한 구매를 시도하고, Production에 비해 너무 빠르게 끝나는 실행을 보완하기 위해 sleep 옵션을 사용해서 테스트도 진행하였습니다. 다행히도 문제 없이 적용되었습니다.

# Production 환경 적용

마침내 실제 서비스에 적용하는 단계입니다.

혹시 모를 상황에 대비하여 별도의 백업도 준비한 상태로 진행하였습니다. 미리 검증을 해서인지, 툴이 잘 만들어져 있어서인지, 아래와 같은 CPU 그래프와 함께 문제 없이 잘 실행되었습니다.
![Production에서 실행하였을 때 확인한 CPU 그래프](https://images.gogumang.com/dd1e3de70b/02.png) Production에서 실행하였을 때 확인한 CPU 그래프

# CPU 100%

그렇게 online alter 작업을 성공적으로 마치고, 기능 구현도 완료한 상태로 기능 배포 당일을 맞이하였습니다. 배포를 진행하면서 살짝 불안해진 CPU 그래프를 보고 있었습니다.
![기존보다 평균치가 살짝 상승한 CPU](https://images.gogumang.com/dd1e3de70b/03.png) 기존보다 평균치가 살짝 상승한 CPU

기존에 20% 정도만 사용하던 것에 비해 약 10\~20% 정도 오른 그래프에서, 기능 구현을 위해 추가한 쿼리로 인한 영향을 인지했습니다. 그러나 아직 큰 문제는 아니기 때문에, 같이 배포된 다른 기능들에서 발견된 문제들을 먼저 해결하고 있었습니다.

그런데 상황이 바뀌기 시작했습니다. 여러 버그 픽스를 추가로 배포하고 유저들을 재접속시키니, 어느 순간 Database 알람이 울리고 다시 본 그래프는 아래와 같은 모습을 하고 있었습니다.
![100%를 달성해버린 CPU](https://images.gogumang.com/dd1e3de70b/04.png) 100%를 달성해버린 CPU

처음으로 보는 CPU 100% 그래프였는데요. 아니나 다를까, Database 접속에 문제가 생기면서 유저들이 정상적인 게임 접속/플레이가 불가능해졌습니다. 우선 서버 점검을 건 후, 문제가 되는 패키지 매출 랭킹 기능의 활성화 여부를 설정할 수 있는 기능을 빠르게 추가해 비활성화 상태로 설정한 후 서비스를 정상화시켰습니다. 서비스를 정상화시킨 다음 침착하게 기능 구현을 파악한 결과, 밝혀진 문제 원인은 2개였는데요. 바로 쿼리와 캐시 사용 패턴이었습니다.

# 문제 원인1. 쿼리

먼저 쿼리 자체가 최적화가 되어 있지 않아서, CPU를 더 많이 소모하게 되었습니다. 사용한 쿼리는 아래와 같았습니다.

    SELECT product_id, COUNT(*) AS count
    FROM $DB_NAME
    WHERE
    (product_id = 'aaa' AND {판매 시작 시간} < purchase_dt AND purchase_dt <= {현재}) OR
    (product_id = 'bbb' AND {판매 시작 시간} < purchase_dt AND purchase_dt <= {현재})

첫 번째 문제는 (product_id, purchase_dt)을 묶어서 쿼리를 하는데 이를 기준으로 한 index가 없는 것이었습니다. 두 번째 문제는 조회 과정에서 매번 바뀌는 "현재"가 조건으로 걸려 있기 때문에 Database 내부적으로 최적화하기 어렵다는 것이었습니다. 이 2개의 문제에 대해서 각각의 해결 방안을 고민해보았습니다.

첫 번째 문제인 index는, (product_id, purchase_dt)을 묶은 composite index로 해결하려고 하였습니다. online alter와 동일하게 Staging 복제본 Database에서 테스트해보았습니다. 그러나 아쉽게도 쿼리 성능 개선은 10% 정도로 미미하였고, index를 추가하는 비용에 비해 효과가 유의미하지 않다고 판단하여 현 상태를 유지하기로 하였습니다.

두 번째 문제인 최적화는, 쿼리의 컨디션을 최대한 묶고 현재 시간 기반 쿼리를 지우는 방식으로 해결하려고 하였습니다. 업데이트 때마다 새로운 상품이 출시되는 \[쿠키런: 오븐브레이크\] 특성상, 판매 시작 시간을 공유하는 상품들이 많아 해당 product_id의 컨디션을 묶는 방법으로 개선을 할 수 있었습니다. 또한 현재 시간 기반 쿼리는, 미래 시점에서 구매된 상품이 있을 수는 없으므로 무의미한 컨디션이었기 때문에 삭제하였습니다. 그 결과 다음과 같은 쿼리로 개선하였습니다.

    SELECT product_id, COUNT(*) AS count
    FROM $DB_NAME
    WHERE
    ((product_id = 'aaa' or product_id = 'bbb') AND {판매 시작 시간} < purchase_dt)

기존 쿼리에 비해 한결 짧아진 것이 눈으로도 보이는 쿼리가 되었는데요. 아쉽게도 이 쿼리 역시 성능 개선은 크지 않았지만, 부정적인 점이 없는 변경사항이었기 때문에 바로 적용하였습니다.

# 문제 원인2. 캐시 사용 패턴

사실 쿼리보다 주요하게 다룬 문제는 서버 내부의 캐시의 사용 패턴이었는데요. 이를 이해하기 위해서는 \[쿠키런: 오븐브레이크\]의 서버 구조에 대한 설명이 필요합니다. \[쿠키런: 오븐브레이크\]는 AWS autoscaling group을 활용한 수평 분산이 가능한 서버이고, 각 서버마다 독립적으로 캐시를 만들고 관리합니다. 그리고 기획팀은 필요할 때마다 게임데이터를 수정해서 업로드합니다. 이로 인해 여러 버전의 게임 데이터가 공존할 수 있습니다. 그리고 게임데이터마다 캐시 결과가 달라질 수 있으므로 게임데이터 버전에 따라 새롭게 캐시해야 합니다. 즉, 게임데이터마다 별개의 캐시가 만들어집니다.
![기존 캐시 구조. 동일한 값을 사용하는 캐시가 많다](https://images.gogumang.com/dd1e3de70b/05.jpg) 기존 캐시 구조. 동일한 값을 사용하는 캐시가 많다

문제는 패키지의 판매 시작 시간도 게임데이터에 의존한다는 점입니다. 결과적으로는 캐싱을 하고 있지만, 쿼리를 (분산 서버 수) \* (게임데이터 가짓수)만큼 실행하게 되었습니다. 게다가 서버를 업데이트하면 캐시가 비어있는 서버가 늘어나 쿼리를 더더욱 많이 실행하여 순식간에 Database에 부하를 가하게 된 것이었습니다. 개발 환경에서는 결제 데이터가 많지 않아 쿼리가 빨랐고, 분산 서버 수도 적어 이러한 문제를 발견하기 어려웠습니다.

이를 해결하기 위해서, 모든 서버들이 공통으로 사용할 수 있는 캐시를 별도로 운영하는 것으로 결정하였습니다. 그렇게 만들어진 단일 캐시는 "스케쥴러 서버"라는 이름의 별도의 서버에서 관리합니다. 이 서버는 주기적으로 주어진 요청을 처리합니다. 이를 활용하여 아래와 같은 스텝으로 구현을 변경하였습니다.

1. 서버는 결과가 필요할 때 2가지 로직을 실행합니다
   * Database에 직접 쿼리하는 대신 원격 저장소에 저장된 결과를 조회합니다. 저장된 결과가 없으면 빈 값으로 처리합니다
   * 스케쥴러 서버로의 요청을 큐에 저장합니다
2. 스케줄러 서버는 주기적으로 큐에서 모든 요청을 꺼내고, 마지막 요청을 기반으로 쿼리를 하여 결과를 계산합니다
3. 스케줄러 서버가 계산한 결과를 원격 저장소에 저장(캐싱)합니다

쿼리를 각각의 서버가 실행하는 것이 아닌, 스케줄러 서버가 일괄적으로 실행함에 따라서 쿼리의 실행 횟수를 줄여서 부하를 줄일 수 있었습니다.

# 문제 해결 완료

쿼리 최적화와 캐시 사용 패턴 개선을 적용한 다음, 조심스럽게 `패키지 매출 랭킹` 기능을 다시 활성화였을 때, 변경된 CPU 그래프는 다음과 같았습니다.
![돌아온 CPU](https://images.gogumang.com/dd1e3de70b/06.png) 돌아온 CPU

중간중간 작은 피크들을 통해 스케쥴러 서버가 쿼리를 실행하고 있다는 것이 알 수 있습니다. 이러한 피크를 제외하면 전체적으로는 문제 없이 CPU가 유지되었고 기능 자체도 성공적으로 작동하였습니다. 마침내 모든 문제를 해결한 것입니다.

# 결론

Database에 진행한 작업이 많지 않지만, 그 중에서도 `패키지 매출 랭킹` 관련 작업은 저에게 많이 인상 깊은 작업이었습니다.

1. Production 환경에서의 online alter를 위해 **Percona Toolkit**이라는 툴을 사용하여 성공적으로 진행한 경험을 쌓았습니다. 이후 몇 번 더 online alter를 해야하는 작업이 있었는데, 그 때마다 이 툴을 사용하여 문제 없이 진행할 수 있었습니다. 이 과정에서 유용한 툴을 잘 활용하는 것에 대한 중요성을 깨달았습니다.
2. 무거운 쿼리와 분산 서버 환경에서의 캐시 시스템이 합쳐져 예상치 못한 문제를 야기하였는데, 사전에 문제될 만한 지점을 잘 파악하는 것 또한 중요하다는 것을 배웠습니다
3. 장애가 발생하였을 때 원인 파악도 중요하지만 서비스 정상화를 우선시 해야 한다는 것을 새삼 깨달았습니다. 이번에는 문제 되는 기능의 활성화 여부를 설정할 수 있는 기능을 적용하여 해결했는데, 이러한 안전 장치를 미리 구현해두면 보다 안정적인 서비스를 운영하는데 도움이 될 것입니다.

이 글이 Database 작업을 하는 다른 분들께도 도움이 되길 바라며 마무리하겠습니다. 긴 글 읽어주셔서 감사합니다.
![deco cookie](https://images.gogumang.com/dd1e3de70b/07.png)

## 데브시스터즈는 최고의 인재를 찾고 있습니다.

자세한 내용은 채용 사이트를 확인해 주세요!