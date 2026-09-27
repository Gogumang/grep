## 들어가며

안녕하세요, 카카오 분산데이터베이스 조직에서 MongoDB를 운영하고 있는 앤디입니다.

많은 분들이 공감하시겠지만, MongoDB를 운영하다 보면 궁금한 점이 참 많이 생기는 것 같습니다. 그러나 관련 정보를 찾으려 해도 Oracle이나 MySQL만큼 깊이 있는 MongoDB 자료를 찾기가 쉽지 않죠. 아직 해결되지 않은 의문들이 많지만, 그동안 제가 MongoDB를 운영하면서 경험하고 정리한 내용을 독자 여러분과 공유하고자 합니다. MongoDB를 사용하는 데 필수적인 내용은 아닐 수 있지만, 평소 호기심이 있으셨던 독자분들에게 도움이 되기를 바랍니다.

이번 시리즈에서는 본격적으로 MongoDB의 스토리지 엔진인 [WiredTiger](https://www.mongodb.com/ko-kr/docs/manual/core/wiredtiger/)에 대한 궁금증을 하나씩 풀어보려 합니다. 그 첫 번째 순서로, WiredTiger가 관리하는 파일들의 상세 내용에 대해 알아보겠습니다.

MongoDB를 사용하거나 운영하다 보면 한 번쯤 파일의 내용을 확인하기 위해 출력해 보신 분들이 많으실 텐데요. WiredTiger에서 관리하는 파일의 상세 내용을 함께 살펴보면서, 대부분 사람이 읽을 수 없는 형태로 되어 있어 답답하셨던 분들 및 평소 MongoDB에서 삽입하고 갱신한 데이터가 파일에는 어떤 구조로 저장되며 관리되고 있는지 궁금하셨던 분들에게 도움이 되기를 바랍니다

## WiredTiger 스토리지 엔진

![그림 1. MongoDB(WiredTiger) 아키텍처](https://images.gogumang.com/ec1a6fc40e/01.png)

스토리지 엔진은 위 \<그림 1\>과 같이 메모리와 디스크 모두에서 데이터가 저장되는 방식을 관리하는 등 MongoDB에서 핵심적인 역할을 담당합니다. MongoDB는 플러그형 스토리지 엔진 아키텍처를 지원하기 때문에 과거에는 MMAPv1, RocksDB 등 여러 스토리지 엔진을 지원했지만, 현재는 WiredTiger 스토리지 엔진을 기본 스토리지 엔진으로 사용하고 있습니다. WiredTiger 스토리지 엔진은 버클리(Berkeley) DB를 개발한 팀에 의해 만들어진 데이터베이스 엔진으로 트랜잭션 지원, 락 프리(Lock Free) 알고리즘, 데이터 압축 등을 통해 높은 효율성과 성능을 지원하는 키-값 저장소(key-value store) 입니다.

따라서 대부분의 사용자가 접하는 MongoDB 서버의 데이터 디렉터리에는 아래와 같이 WiredTiger 스토리지 엔진에 의해 만들어지고 관리되는 파일이 존재합니다.

```
// storage.directoryPerDB = true
WiredTiger
WiredTiger.lock
WiredTiger.turtle
WiredTiger.wt
WiredTigerHS.wt
_mdb_catalog.wt
admin
config
diagnostic.data
journal
local
mongod.lock
mongod.log
sizeStorer.wt
storage.bson
```

\< 예시 1. MongoDB 데이터 디렉터리 \>

기본적으로 위와 같은 파일들이 생성되며, storage.directoryPerDB 옵션에 따라 데이터베이스별로 전용 디렉터리를 사용할 수 있습니다. 대부분의 파일은 패키징 되고 압축되어 있어 단순히 텍스트로 내용을 확인하기가 어렵다는 특징이 있습니다.

```
> cat sizeStorer.wt 
…
@���Itable:_mdb_catalog�+numRecords%dataSize�A�table:admin/collection-0-1637195360926124997�+numRecorddataSize��table:admin/collection-0-9099766355459865316�+numRecordsdataSizeG�table:config/collection-0-8316169425761040837�+numRecordsdataSize��table:config/collection-14-9099766355459865316�+numRecordsdataSize�table:config/collection-27-9099766355459865316�+numRecordsdataSize��table:config/collection-3-2379736425568679240�+numRecordsdataSize�
�table:config/collection-32-9099766355459865316�+numRecordsdataSize)�table:config/collection-34-9099766355459865316�+numRecordsdataSize
```

\< 예시 2. sizeStorer.wt 파일 \>

파일의 내용을 알아보지 못한다고 해서 MongoDB를 사용하거나 이슈를 분석하는 데 있어 문제가 생기지는 않습니다. 하지만 눈에 힘을 잔뜩 주면 뭔가 보일 것 같기도 한 내용으로 인해 호기심을 더욱 유발합니다.

그럼 이제부터 호기심을 충족시켜 줄 도구들을 간단히 소개한 후, 언급한 파일들을 하나씩 열어보며 어떤 내용을 저장하고 있는지 알아보겠습니다.

### 분석 도구

WiredTiger에서 관리하는 파일 대부분은 사람이 읽을 수 있는 형태가 아니기 때문에 별도의 분석 도구가 필요합니다. 이번 문서에서는 주로 아래의 두 가지 도구를 사용합니다.

* [bsondump](https://www.mongodb.com/docs/database-tools/bsondump/)
* [wt](https://source.wiredtiger.com/10.0.0/command_line.html)

**먼저 bsondump**를 살펴보겠습니다.

[BSON(Binary JSON)](https://www.mongodb.com/ko-kr/docs/manual/reference/bson-types/) 형식은 MongoDB에서 데이터를 저장할 때 사용하는 표준 포맷으로, 바이너리 형태로 이루어져 있어 사람이 직접 읽기 어렵습니다. bsondump는 이러한 BSON 형식의 데이터를 사람이 읽을 수 있는 JSON 형식으로 변환해 주는 유틸리티입니다.

bsondump는 MongoDB 바이너리 패키지에 포함되어 배포됩니다.

```
> bsondump storage.bson  | jq
{
  "storage": {
    "engine": "wiredTiger",
    "options": {
      "directoryPerDB": true,
      "directoryForIndexes": false,
      "groupCollections": false
    }
  }
}
```

\< 예시 3. bsondump 사용 예제 \>

또한, **wt**는 WiredTiger에서 제공하는 유틸리티로, WiredTiger 내부 파일들에 직접 접근하고 조작할 수 있는 기능을 제공합니다. wt는 MongoDB 패키지에 포함되어 있지 않으므로 WiredTiger 소스코드에서 직접 빌드해야 합니다.

wt 빌드 방법은 아래와 같습니다. wt를 빌드할 때 필요한 의존성은 버전에 따라 다를 수 있으며, 가장 최신의 설치 방법과 필요한 의존성 리스트는 [공식 문서](https://github.com/wiredtiger/wiredtiger/tree/develop/cmake)를 참고해 주시기 바랍니다.

```
> git clone https://github.com/wiredtiger/wiredtiger.git
> git checkout mongodb-{version}  # 이 문서에서는 mongodb-6.0 사용
> cd wiredtiger
> mkdir build
> cd build
> cmake -DENABLE_SNAPPY=1 .. # SNAPPY 라이브러리가 있는 경우 기본적으로 활성화
> make wt  # wt 바이너리 빌드

> ./wt help
WiredTiger Data Engine (version 10.0)
MongoDB wiredtiger_open configuration: "log=(enabled=true,path=journal,compressor=snappy)"
global_options:
    -B  maintain release 3.3 log file compatibility
    -C config
        wiredtiger_open configuration
    -E key
        secret encryption key
    -h home
        database directory
    -L  turn logging off for debug-mode
    -m  run verify on metadata
    -R  run recovery (if recovery configured)
    -r  access the database via a readonly connection
    -S  run salvage recovery (if recovery configured)
    -V  display library version and exit
    -v  verbose
commands:
    alter
        alter an object
    backup
        database backup
    compact
        compact an object
    copyright
        display copyright information
    create
        create an object
    downgrade
        downgrade a database
    drop
        drop an object
    dump
        dump an object
    list
        list database objects
    load
        load an object
    loadtext
        load an object from a text file
    printlog
        display the database log
    read
        read values from an object
    rename
        rename an object
    salvage
        salvage a file
    stat
        display statistics for an object
    truncate
        truncate an object, removing all content
    upgrade
        upgrade an object
    verify
        verify an object
    write
        write values to an object
```

\< 예시 4. wt 빌드 방법 \>

wt를 실제 사용하는 CLI 명령어 예시는 아래와 같습니다.

```
> wt dump -x file:sizeStorer.wt | tail -n +7
// key
7461626c653a5f6d64625f636174616c6f67
// value
2b000000126e756d5265636f726473001b00000000000000126461746153697a6500363200000000000000
7461626c653a61646d696e2f636f6c6c656374696f6e2d302d39303939373636333535343539383635333136
2b000000126e756d5265636f726473000400000000000000126461746153697a6500470100000000000000
```

\< 예시 5. wt 사용 예제 \>
> 주의: wt 사용 시 mongod 프로세스가 종료된 상태여야 합니다. 또한, 이 도구는 파일을 직접 수정할 수 있으므로 운영 환경에서의 사용에 주의가 필요합니다.

## WiredTiger에서 관리하는 파일 구조

이제부터 본격적으로 파일을 하나씩 열어보며 어떤 내용을 저장하고 있는지 알아보겠습니다.

### WiredTiger

**WiredTiger 파일**은 텍스트 파일로, 현재 실행 중인 WiredTiger 스토리지 엔진의 버전 정보를 저장하고 있습니다.

```
> cat WiredTiger
WiredTiger 10.0.2: (December 21, 2021)
```

\< 파일 1. WiredTiger 파일 \>

이 파일 내용을 통해 현재 MongoDB에서 사용하는 WiredTiger는 10.0.2 버전을 사용하고 있음을 알 수 있습니다. 본 문서 작성 시 사용한 MongoDB 버전은 6.0.11 이며, 아래 표를 통해 각 MongoDB 버전에 해당하는 WiredTiger 버전을 확인할 수 있습니다.

| **MongoDB** | **WiredTiger** |
|-------------|----------------|
| 3.0.15      | 2.5.3          |
| 3.2.20      | 2.9.2          |
| 3.4.15      | 2.9.2          |
| 3.6.4       | 3.0.1          |
| 4.0.16      | 3.1.1          |
| 4.2.1       | 3.2.2          |
| 4.4.0       | 10.0.0         |
| 5.0.0       | 10.0.1         |
| **6.0.0**   | **10.0.2**     |
| 7.0.0       | 11.2.0         |
| 8.0.0       | 11.3.0         |

\< 표 1. [MongoDB 와 WiredTiger 버전 관계](https://github.com/mongodb/mongo/blob/master/src/mongo/db/storage/wiredtiger/README.md?plain=1#L322-L344) \>

WiredTiger 메이저 버전의 변화는 MongoDB의 기능과 밀접하게 연관되어 있습니다.

예를 들어, 큰 변화를 몇 가지 살펴보면 WiredTiger 3.0.0 버전에서 도입된 타임스탬프(Timestamps) 기능으로 MongoDB 3.6 버전부터 타임스탬프 관련 연산을 지원하기 시작했습니다( 관련 지라 티켓: [타임스탬프 기능 지원](https://jira.mongodb.org/browse/WT-3181) ).

또한, WiredTiger 10.0.0 버전에서 도입된 히스토리 스토어(History Store) 개념은 MongoDB 4.4 버전부터 WiredTiger.wt 파일에 데이터 변경 이력을 저장하면서 WiredTigerLAS.wt 파일을 대체했습니다( 관련 지라 티켓: [히스토리 스토어에 대한 파일 생성](https://jira.mongodb.org/browse/WT-5225) ).

이렇듯 WiredTiger의 변경사항은 MongoDB에도 큰 변화를 불러오기 때문에 함께 살펴보면 좋습니다. 주요 변경사항에 대한 자세한 내용은 추후 다른 시리즈로 찾아뵙겠습니다.

### WiredTiger.lock

**WiredTiger.lock 파일**은 다른 MongoDB 서버 인스턴스가 데이터 파일들에 동시에 접근하는 것을 방지합니다. 또한, 서버가 정상적으로 종료되었는지 여부를 판단하는 역할도 수행합니다.

```
> cat WiredTiger.lock
WiredTiger lock file
```

\< 파일 2. WiredTiger.lock 파일 \>

서버가 시작될 때, WiredTiger.lock 파일의 존재 여부를 기반으로 시스템 복구가 결정됩니다. 그러므로 비정상 종료 후 이 파일을 임의로 삭제하는 경우, 데이터 유실의 위험이 있으니 주의해야 합니다. 비정상 종료로 인해 lock 파일이 남아 있는 경우, WiredTiger는 마지막 안정된 체크포인트 시점으로 데이터 복구를 진행합니다.

```
virtual std::unique_ptr create(OperationContext* opCtx,
                                              const StorageGlobalParams& params,
                                              const StorageEngineLockFile* lockFile) const {
    if (lockFile && lockFile->createdByUncleanShutdown()) {
        LOGV2_WARNING(22302, "Recovering data from the last clean checkpoint.");

        // If we had an unclean shutdown during an ongoing backup remove WiredTiger.backup. This
        // allows WT to use checkpoints taken while the backup cursor was open for recovery.
        boost::filesystem::path basePath(storageGlobalParams.dbpath);
        if (boost::filesystem::remove(basePath / WiredTigerBackup::kOngoingBackupFile)) {
            if (boost::filesystem::remove(basePath / kWiredTigerBackupFile)) {
                LOGV2_INFO(
                    5844600,
                    "Removing WiredTiger.backup to allow recovery from any checkpoints taken "
                    "during ongoing backup.");
            } else {
                LOGV2_INFO(5844601, "WiredTiger.backup doesn't exist, cleanup not needed.");
            }
        }
    }
```

\< 코드 1. WiredTiger lock 파일의 활용( [소스코드](https://github.com/mongodb/mongo/blob/master/src/mongo/db/storage/wiredtiger/wiredtiger_init.cpp#L82-L104) ) \>

### WiredTiger.wt

**WiredTiger.wt 파일**은 WiredTiger에서 관리하는 모든 파일의 구성 정보와 최신 체크포인트 정보 등의 메타데이터를 저장하고 있습니다. 주요 내용 중 일부를 살펴보겠습니다.

```
> wt dump file:WiredTiger.wt | tail -n +7

...
// 주요 필드 : id=90, log=(enabled=false), checkpoint=(WiredTigerCheckpoint.1=(...)
file:kakao/collection-0-6574883217453298519.wt
access_pattern_hint=none,allocation_size=4KB,app_metadata=(formatVersion=1),assert=(commit_timestamp=none,durable_timestamp=none,read_timestamp=none,write_timestamp=off),block_allocation=best,block_compressor=snappy,cache_resident=false,checksum=on,collator="",columns="",dictionary=0,encryption=(keyid="",name=""),format=btree,huffman_key="",huffman_value="",
id=90,ignore_in_memory_cache_size=false,internal_item_max=0,internal_key_max=0,internal_key_truncate=true,internal_page_max=4KB,key_format=q,key_gap=10,leaf_item_max=0,leaf_key_max=0,leaf_page_max=32KB,leaf_value_max=64MB,
log=(enabled=false),memory_page_image_max=0,memory_page_max=10m,os_cache_dirty_max=0,os_cache_max=0,prefix_compression=false,prefix_compression_min=4,readonly=false,split_deepen_min_child=0,split_deepen_per_child=0,split_pct=90,tiered_object=false,tiered_storage=(auth_token="",bucket="",bucket_prefix="",cache_directory="",local_retention=300,name="",object_target_size=0),value_format=u,verbose=[],version=(major=1,minor=1),write_timestamp_usage=none,
checkpoint=(WiredTigerCheckpoint.1=(addr="018181e47b28f1be8281e41546bd168381e4d0a3d14f808080e22fc0cfc0",order=1,time=1731567505,size=8192,newest_start_durable_ts=7437025774726545409,oldest_start_ts=7437025688827199491,newest_txn=454,newest_stop_durable_ts=0,newest_stop_ts=-1,newest_stop_txn=-11,prepare=0,write_gen=327610,run_write_gen=327608)),checkpoint_backup_info="",checkpoint_lsn=(42,298112)

...
// 주요 필드 : id=92, log=(enabled=false), checkpoint=(WiredTigerCheckpoint.1=(...)
file:kakao/index-2-6574883217453298519.wt
access_pattern_hint=none,allocation_size=4KB,app_metadata=(formatVersion=8),assert=(commit_timestamp=none,durable_timestamp=none,read_timestamp=none,write_timestamp=off),block_allocation=best,block_compressor="",cache_resident=false,checksum=on,collator="",columns="",dictionary=0,encryption=(keyid="",name=""),format=btree,huffman_key="",huffman_value="",
id=92,ignore_in_memory_cache_size=false,internal_item_max=0,internal_key_max=0,internal_key_truncate=true,internal_page_max=16k,key_format=u,key_gap=10,leaf_item_max=0,leaf_key_max=0,leaf_page_max=16k,leaf_value_max=0,
log=(enabled=false),memory_page_image_max=0,memory_page_max=5MB,os_cache_dirty_max=0,os_cache_max=0,prefix_compression=true,prefix_compression_min=4,readonly=false,split_deepen_min_child=0,split_deepen_per_child=0,split_pct=90,tiered_object=false,tiered_storage=(auth_token="",bucket="",bucket_prefix="",cache_directory="",local_retention=300,name="",object_target_size=0),value_format=u,verbose=[],version=(major=1,minor=1),write_timestamp_usage=none,
checkpoint=(WiredTigerCheckpoint.1=(addr="018181e4e4eb0e718281e41546bd168381e43128d539808080e22fc0cfc0",order=1,time=1731567531,size=8192,newest_start_durable_ts=0,oldest_start_ts=0,newest_txn=0,newest_stop_durable_ts=0,newest_stop_ts=-1,newest_stop_txn=-11,prepare=0,write_gen=327610,run_write_gen=327608)),checkpoint_backup_info="",checkpoint_lsn=(42,321792)

...
// 주요 필드 : id=18, log=(enabled=true), checkpoint=(WiredTigerCheckpoint.28698=(...)
file:local/collection-2-9099766355459865316.wt
access_pattern_hint=none,allocation_size=4KB,app_metadata=(formatVersion=1,oplogKeyExtractionVersion=1),assert=(commit_timestamp=none,durable_timestamp=none,read_timestamp=none,write_timestamp=off),block_allocation=best,block_compressor=snappy,cache_resident=false,checksum=on,collator="",columns="",dictionary=0,encryption=(keyid="",name=""),format=btree,huffman_key="",huffman_value="",
id=18,ignore_in_memory_cache_size=false,internal_item_max=0,internal_key_max=0,internal_key_truncate=true,internal_page_max=4KB,key_format=q,key_gap=10,leaf_item_max=0,leaf_key_max=0,leaf_page_max=32KB,leaf_value_max=64MB,
log=(enabled=true),memory_page_image_max=0,memory_page_max=10m,os_cache_dirty_max=0,os_cache_max=0,prefix_compression=false,prefix_compression_min=4,readonly=false,split_deepen_min_child=0,split_deepen_per_child=0,split_pct=90,tiered_object=false,tiered_storage=(auth_token="",bucket="",bucket_prefix="",cache_directory="",local_retention=300,name="",object_target_size=0),value_format=u,verbose=[],version=(major=1,minor=1),write_timestamp_usage=none,
checkpoint=(WiredTigerCheckpoint.28698=(addr="018d81e45e953f458e81e4615ccec2c0ae81e4905c78bc808080e401296fc0e4010c8fc0",order=28698,time=1731567549,size=17612800,newest_start_durable_ts=0,oldest_start_ts=0,newest_txn=0,newest_stop_durable_ts=0,newest_stop_ts=-1,newest_stop_txn=-11,prepare=0,write_gen=327799,run_write_gen=327608)),checkpoint_backup_info="",checkpoint_lsn=(42,338048)
```

\< 파일 3. WiredTiger.wt 파일 \>

디스크에 저장된 B+tree 구조나 컬렉션에서 사용되는 설정 정보는 **file: 항목**에 저장되어 있습니다. 기본적으로 대부분의 설정은 동일하지만, 자세히 들여다보면 조금씩 다른 값이 눈에 들어옵니다.

이러한 차이는 분명한 의도가 있는 것이므로 그냥 지나치지 않고 하나씩 살펴보겠습니다.

1. **log=(enable=false) vs log=(enabled=true)**

**log** 설정은 WiredTiger의 write-ahead log 기능인 [저널링(Journaling)](https://www.mongodb.com/ko-kr/docs/manual/core/journaling/)의 활성화 여부를 결정합니다. 저널링은 예기치 못한 종료로부터 데이터의 내구성을 보장하기 위한 기능으로, 그 중요성은 두말할 필요가 없다고 생각합니다.

그런데 사용자가 생성한 컬렉션에 대한 데이터 파일과 인덱스 파일에는 왜 log 설정이 비활성화되어 있는 걸까요?

대부분의 경우, 이런 질문에 대한 답은 **성능을 위해서**라고 할 수 있을 것입니다.

만약 모든 파일에 log 옵션이 활성화되어 있다면 모든 파일의 변경사항을 디스크에 반영하기 전에 저널 파일에 먼저 기록을 해야 합니다. 하지만, MongoDB는 **oplog** 에 데이터베이스의 모든 변경사항을 저장하므로 **oplog**에 대한 저널링만으로도 복구에는 문제가 없습니다. 그리고 oplog는 가능하면 원본 데이터가 아닌 변경분만 저장하는 특성을 가지고 있어, 이 부분에서도 장점을 가지게 됩니다.

따라서 성능을 위해서는 모든 파일에 대해 저널링을 하는 것보다, **oplog**에 대한 저널링만 선택하는 것이 합리적인 선택이라 생각합니다.

한편, log 옵션이 활성화되지 않은 데이터 및 인덱스 파일에 대한 쓰기는 기본적으로 메모리에 유지되고 이빅션(Eviction) 혹은 체크포인트를 통해서만 디스크로 쓰이며 [체크포인트 내구성(Checkpoint-durability)](https://source.wiredtiger.com/develop/durability_checkpoint.html) 만을 보장하게 됩니다.

2. **id=90, id=92, id=18**

각 항목의 **id** 값은 파일의 고유한 식별자를 나타냅니다. 다른 파일에서 참조할 때 일반적으로 파일 이름이 아닌 여기에 설정되어 있는 **file id** 를 사용하는 경우가 많습니다. 예를 들어, 저널 파일에 변경 사항을 기록할 때, 파일 이름 대신 **file id**를 사용하여 불필요한 공간 사용을 방지할 수 있습니다.

3. **checkpoint** =(**WiredTigerCheckpoint.XXXX**)

WiredTiger에서 체크포인트는 예기치 못한 종료 시 복구할 수 있는 기준점으로 사용되며, 체크포인트가 파일별로 수행되므로 각 파일은 서로 다른 체크포인트 정보를 저장할 수 있습니다. 이 정보는 체크포인트 완료 후 변경된 디스크의 루트 페이지 주소와 같은 메타데이터를 포함합니다(체크포인트의 자세한 동작은 본 문서의 범위를 벗어나므로 생략하겠습니다).

### WiredTiger.turtle

**WiredTiger.turtle 파일** 은 독특하게 **turtle**이라는 확장자를 사용하고 있습니다. 재미 삼아 의미를 추측해 보자면, 과거에는 기록 수단이 마땅치 않아 거북이 등껍질에 중요한 기록을 새겼다는 이야기가 있는데, 이와 비슷한 의미로 사용된 것이 아닐까 싶습니다. 아니면 단순히 느림을 의미하는 것일 수도 있겠네요.

![](https://images.gogumang.com/ec1a6fc40e/02.png)

\< 출처 : [위키백과](https://ko.wikipedia.org/wiki/%EA%B0%91%EA%B3%A8_%EB%AC%B8%EC%9E%90) \>

이렇게 추측할 수 있는 이유는, 이 파일이 실제로도 앞서 소개한 메타데이터를 저장하는 WiredTiger.wt 파일의 최신 체크포인트 정보와 같은 메타데이터를 저장하는 중요한 파일이기 때문입니다.

```
> cat WiredTiger.turtle
WiredTiger version string
WiredTiger 10.0.2: (November 30, 2021)
WiredTiger version
major=10,minor=0,patch=2
// WiredTiger.wt 파일에 대한 메타데이터
file:WiredTiger.wt
access_pattern_hint=none,allocation_size=4KB,app_metadata="",assert=(commit_timestamp=none,durable_timestamp=none,read_timestamp=none,write_timestamp=off),block_allocation=best,block_compressor="",cache_resident=false,checksum=on,collator="",columns="",dictionary=0,encryption=(keyid="",name=""),format=btree,huffman_key="",huffman_value="",
id=0,ignore_in_memory_cache_size=false,internal_item_max=0,internal_key_max=0,internal_key_truncate=true,internal_page_max=4KB,key_format=S,key_gap=10,leaf_item_max=0,leaf_key_max=0,leaf_page_max=32KB,leaf_value_max=0,
log=(enabled=true),memory_page_image_max=0,memory_page_max=5MB,os_cache_dirty_max=0,os_cache_max=0,prefix_compression=false,prefix_compression_min=4,readonly=false,split_deepen_min_child=0,split_deepen_per_child=0,split_pct=90,tiered_object=false,tiered_storage=(auth_token="",bucket="",bucket_prefix="",cache_directory="",local_retention=300,name="",object_target_size=0),value_format=S,verbose=[],version=(major=1,minor=1),write_timestamp_usage=none,
checkpoint=(WiredTigerCheckpoint.2745=(addr="018881e43b0cc5238981e493ca32a38a81e40299ad3d808080e3044fc0e302afc0",order=2745,time=1723005416,size=188416,newest_start_durable_ts=0,oldest_start_ts=0,newest_txn=2,newest_stop_durable_ts=0,newest_stop_ts=-1,newest_stop_txn=-11,prepare=0,write_gen=17370,run_write_gen=17366)),checkpoint_backup_info="",checkpoint_lsn=(4294967295,2147483647)
```

\< 파일 4. WiredTiger.turtle 파일 \>

**WiredTiger.wt에 대한 메타데이터를 별도로 관리하는 이유는 무엇일까요?**

WiredTiger.wt는 각 파일의 체크포인트 정보를 포함하고 있으므로, 각 파일의 체크포인트가 수행될 때마다 파일의 내용이 갱신됩니다. 이렇듯 체크포인트 수행 중에는 WiredTiger.wt 파일이 지속적으로 갱신되므로, WiredTiger.wt 파일에 대한 체크포인트는 전체 체크포인트 과정의 마지막 단계에서 수행되며, 결과를 WiredTiger.turtle 파일에 별도로 기록합니다.

이러한 체크포인트 과정은 스냅샷 격리 트랜잭션(Snapshot isolation transaction)의 컨텍스트 내에서 실행되므로, 체크포인트가 완료될 때까지 일관된 뷰(Consistent view)를 제공할 수 있습니다.

### sizeStorer.wt

**sizeStorer.wt 파일**은 각 컬렉션의 전체 도큐먼트 수와 데이터 사이즈를 저장하는 파일입니다.

데이터를 추가하거나 수정할 때 _changeNumRecordsAndDataSize 함수를 통해 레코드 수와 데이터 사이즈를 매번 갱신하며 관리합니다. MongoDB에서는 estimatedDocumentCount() 명령어를 수행할 경우 이 파일의 값을 참조합니다.

```
void WiredTigerRecordStore::_changeNumRecordsAndDataSize(OperationContext* opCtx,
                                                         int64_t numRecordDiff,
                                                         int64_t dataSizeDiff) {
    if (!_tracksSizeAdjustments) {
        return;
    }

    if (!sizeRecoveryState(getGlobalServiceContext()).collectionNeedsSizeAdjustment(getIdent())) {
        return;
    }

    const auto updateAndStoreSizeInfo = [this](int64_t numRecordDiff, int64_t dataSizeDiff) {
        _sizeInfo->numRecords.addAndFetch(numRecordDiff);
        _sizeInfo->dataSize.addAndFetch(dataSizeDiff);

        if (_sizeStorer)
            _sizeStorer->store(_uri, _sizeInfo);
    };

    opCtx->recoveryUnit()->onRollback([updateAndStoreSizeInfo, numRecordDiff, dataSizeDiff]() {
        LOGV2_DEBUG(7105300,
                    3,
                    "WiredTigerRecordStore: rolling back change to numRecords and dataSize",
                    "numRecordDiff"_attr = -numRecordDiff,
                    "dataSizeDiff"_attr = -dataSizeDiff);
        updateAndStoreSizeInfo(-numRecordDiff, -dataSizeDiff);
    });
    updateAndStoreSizeInfo(numRecordDiff, dataSizeDiff);
}
```

\< 코드 2. _changeNumRecordsAndDataSize 함수( [소스코드](https://github.com/mongodb/mongo/blob/v6.0/src/mongo/db/storage/wiredtiger/wiredtiger_record_store.cpp#L1999-L2027) ) \>

연산이 실패했을 경우에 대한 롤백 시나리오는 고려되어 있습니다만, 체크포인트 사이에 발생한 비정상 종료로 인한 작업까지는 고려하지 않습니다. 이럴 경우, 서버를 재시작한 후 validate() 명령을 통해 메타데이터를 최신 값으로 갱신할 수 있습니다.

또한, 샤드 클러스터 환경에서 해당 파일에 저장된 값은 데이터 노드인 각각의 샤드에서 관리하는 정보이므로 고아 도큐먼트(Orphaned Document)를 필터링할 수 있는 기능은 없습니다. 고아 도큐먼트란 청크 마이그레이션에 실패하였거나 비정상적인 종료로 인해 정리되지 못하고 이전 샤드에 그대로 남아있는 도큐먼트를 의미합니다. 따라서 고아 도큐먼트가 존재할 경우 estimatedDocumentCount() 명령어는 고아 도큐먼트가 포함된 결과를 반환합니다.

고아 도큐먼트를 필터링한 정확한 결과를 얻기 위해서는 mongos에서 [샤딩 필터(SHARDING_FILTER)](https://www.mongodb.com/ko-kr/docs/manual/reference/explain-results/#explain-output-structure) 스테이지를 수행할 수 있는 countDocuments() 명령어를 사용해야 합니다.

이제 파일 내용을 살펴보겠습니다.

```
> wt dump -x file:sizeStorer.wt | tail -n +7
// key
7461626c653a5f6d64625f636174616c6f67
// value
2b000000126e756d5265636f726473001b00000000000000126461746153697a6500363200000000000000

7461626c653a61646d696e2f636f6c6c656374696f6e2d302d39303939373636333535343539383635333136
2b000000126e756d5265636f726473000400000000000000126461746153697a6500470100000000000000
7461626c653a636f6e6669672f636f6c6c656374696f6e2d302d38333136313639343235373631303430383337
2b000000126e756d5265636f726473000100000000000000126461746153697a65008e0000000000000000
7461626c653a636f6e6669672f636f6c6c656374696f6e2d31342d39303939373636333535343539383635333136
2b000000126e756d5265636f726473000000000000000000126461746153697a6500000000000000000000
7461626c653a636f6e6669672f636f6c6c656374696f6e2d32372d39303939373636333535343539383635333136

...
```

\< 파일 5. sizeStorer.wt 파일 \>

key에 해당하는 16진수 문자열은 ASCII로 인코딩 된 데이터를 나타냅니다. 이를 디코딩해보면 각각 아래와 같은 값을 얻을 수 있습니다.

```
> echo "7461626c653a5f6d64625f636174616c6f67" | xxd -r -p

7461626c653a5f6d64625f636174616c6f67
-> table:_mdb_catalog

7461626c653a61646d696e2f636f6c6c656374696f6e2d302d39303939373636333535343539383635333136
-> table:admin/collection-0-9099766355459865316

7461626c653a636f6e6669672f636f6c6c656374696f6e2d302d38333136313639343235373631303430383337
-> table:config/collection-0-8316169425761040837
```

\< 예시 6-1. sizeStorer.wt 파일 key 값 해석 \>

또한, value에 해당하는 문자열은 BSON 형식으로 bsondump를 통해 값을 확인할 수 있습니다.

```
> echo "2b000000126e756d5265636f726473002600000000000000126461746153697a6500f14200000000000000" | xxd -r -p | bsondump

2b000000126e756d5265636f726473002600000000000000126461746153697a6500f14200000000000000
-> {"numRecords":{"$numberLong":"27"},"dataSize":{"$numberLong":"12854"}}

2b000000126e756d5265636f726473000400000000000000126461746153697a6500470100000000000000
-> {"numRecords":{"$numberLong":"4"},"dataSize":{"$numberLong":"327"}}

2b000000126e756d5265636f726473000800000000000000126461746153697a6500e80000000000000000
-> {"numRecords":{"$numberLong":"1"},"dataSize":{"$numberLong":"142"}}
```

\< 예시 6-2. sizeStorer.wt 파일 value 값 해석 \>

위와 같이 sizeStorer.wt 파일은 컬렉션 별 도큐먼트 수와 데이터 사이즈에 대한 정보를 관리하고 있으며, 그 외에 확인할 내용은 없습니다.

### _mdb_catalog.wt

**_mdb_catalog.wt 파일** 에는 MongoDB 사용자에게 표시되는 컬렉션과 인덱스에 대한 메타데이터가 저장되어 있습니다. 여기에서 **mdb**는 MongoDB를 의미합니다.

```
> wt dump -x file:_mdb_catalog.wt | tail -n +7 | head -n 10
81
8d010000036d6400fb000000026e7300120000006c6f63616c2e737461727475705f6c6f6700036f7074696f6e7300330000000575756964001000000004ac87e81207744fb288b45857632224de0863617070656400011073697a65000000a0000004696e646578657300970000000330008f0000000373706563002e00000010760002000000036b6579000e000000105f6964000100000000026e616d6500050000005f69645f00000872656164790001086d756c74696b65790000036d756c74696b657950617468730010000000055f696400010000000000001268656164000000000000000000086261636b67726f756e645365636f6e646172790000000000036964784964656e740032000000025f69645f00230000006c6f63616c2f696e6465782d312d2d373030323634313732313235343034313037300000026e7300120000006c6f63616c2e737461727475705f6c6f6700026964656e7400280000006c6f63616c2f636f6c6c656374696f6e2d302d2d373030323634313732313235343034313037300000
82
a2010000036d6400fc000000026e7300260000006c6f63616c2e7265706c7365742e6f706c6f675472756e636174654166746572506f696e7400036f7074696f6e73002000000005757569640010000000049865acdfadea42649d849e14188305570004696e646578657300970000000330008f0000000373706563002e00000010760002000000036b6579000e000000105f6964000100000000026e616d6500050000005f69645f00000872656164790001086d756c74696b65790000036d756c74696b657950617468730010000000055f696400010000000000001268656164000000000000000000086261636b67726f756e645365636f6e646172790000000000036964784964656e740032000000025f69645f00230000006c6f63616c2f696e6465782d332d2d373030323634313732313235343034313037300000026e7300260000006c6f63616c2e7265706c7365742e6f706c6f675472756e636174654166746572506f696e7400026964656e7400280000006c6f63616c2f636f6c6c656374696f6e2d322d2d373030323634313732313235343034313037300000
83
84010000036d6400ed000000026e7300170000006c6f63616c2e7265706c7365742e6d696e76616c696400036f7074696f6e730020000000057575696400100000000401d9b93c7f4f452684306cec35ac61c70004696e646578657300970000000330008f0000000373706563002e00000010760002000000036b6579000e000000105f6964000100000000026e616d6500050000005f69645f00000872656164790001086d756c74696b65790000036d756c74696b657950617468730010000000055f696400010000000000001268656164000000000000000000086261636b67726f756e645365636f6e646172790000000000036964784964656e740032000000025f69645f00230000006c6f63616c2f696e6465782d352d2d373030323634313732313235343034313037300000026e7300170000006c6f63616c2e7265706c7365742e6d696e76616c696400026964656e7400280000006c6f63616c2f636f6c6c656374696f6e2d342d2d373030323634313732313235343034313037300000
...

```

\< 파일 6. _mdb_catalog.wt 파일 \>

이제 추가로 bsondump 명령어를 사용하여 BSON 형식으로 된 문자열을 디코딩하면 아래와 같은 내용을 확인할 수 있습니다.

```
> wt dump -x file:_mdb_catalog.wt | tail -n +7 | awk 'NR%2 == 0 { print }' | xxd -r -p | bsondump

...
{
  "md": {
    "ns": "kakao.wt_version",
    "options": {
      "uuid": {
        "$binary": {
          "base64": "xzdVmRFqT8SR0bLq9w/Scw==",
          "subType": "04"
        }
      }
    },
    "indexes": [
      {
        "spec": {
          "v": {
            "$numberInt": "2"
          },
          "key": {
            "_id": {
              "$numberInt": "1"
            }
          },
          "name": "_id_"
        },
        "ready": true,
        "multikey": false,
        "multikeyPaths": {
          "_id": {
            "$binary": {
              "base64": "AA==",
              "subType": "00"
            }
          }
        },
        "head": {
          "$numberLong": "0"
        },
        "backgroundSecondary": false
      },
      {
        "spec": {
          "v": {
            "$numberInt": "2"
          },
          "key": {
            "MongoDB": {
              "$numberInt": "1"
            }
          },
          "name": "MongoDB_1"
        },
        "ready": true,
        "multikey": false,
        "multikeyPaths": {
          "MongoDB": {
            "$binary": {
              "base64": "AA==",
              "subType": "00"
            }
          }
        },
        "head": {
          "$numberLong": "0"
        },
        "backgroundSecondary": false
      }
    ]
  },
  "idxIdent": {
    "_id_": "kakao/index-1-6574883217453298519",
    "MongoDB_1": "kakao/index-2-6574883217453298519"
  },
  "ns": "kakao.wt_version",
  "ident": "kakao/collection-0-6574883217453298519"
}
...
```

\< 예시 7. _mdb_catalog.wt 파일 value 값 해석 \>

주요 항목을 살펴보겠습니다.

* **md**

MongoDB에서 사용하는 네임스페이스(“kakao.wt_version”)와 컬렉션의 설정, UUID 및 인덱스 정보와 같은 메타데이터 정보를 포함합니다.

* **idxIdent** (**index identifier**)

WiredTiger는 MongoDB 인덱스를 매핑된 식별자를 사용하여 관리합니다. 예를 들어, “*id*” 에 해당하는 인덱스는 “kakao/index-1-6574883217453298519” 값으로 매핑됩니다. 이러한 매핑정보가 “_mdb_catalog.wt” 파일에서 관리되므로, 실제 인덱스 파일에는 인덱스 값만을 포함하여 데이터 처리 효율을 높일 수 있습니다.

* **ns** 와 **ident**

마찬가지로, 컬렉션도 WiredTiger 내부 동작에서 네임스페이스를 직접 사용하는 대신, 매핑된 식별자를 통해 관련 파일에 접근합니다. 예를 들어 “kakao.wt_version” 컬렉션은 “kakao/collection-0-6574883217453298519” 값으로 매핑됩니다.

### WiredTigerHS.wt

WiredTigerHS.wt 파일은 WiredTiger에서 데이터의 변경 이력을 관리하기 위해 사용되는 **히스토리 스토어** (**History Store**)의 데이터를 관리합니다. 히스토리 스토어는 WiredTiger 10.0.0 버전에서 도입되었고, 이전에 사용되던 WiredTigerLAS.wt 파일을 대체하며 MongoDB 4.4 버전부터 적용되었습니다.

**히스토리 스토어의 역할은 무엇일까요?**

WiredTiger는 MVCC(Multi Version Concurrency Control)를 활용하여 여러 버전의 데이터 변경사항을 메모리에 유지하고 있습니다. 이러한 변경사항은 **업데이트 체인** (**Update-chain** )이라고 불리는 **단일 연결 리스트** (**Singly linked list**)에 저장됩니다. 새로운 변경사항이 발생하면 업데이트 체인의 맨 앞에 추가되며, 아래 그림과 같이 가장 최근 업데이트가 맨 앞에 위치하게 됩니다.

![그림 2. 업데이트 체인 (In-memory)](https://images.gogumang.com/ec1a6fc40e/03.png)

이러한 메모리 상의 데이터는 이빅션 혹은 체크포인트 과정을 통해 디스크로 쓰여지는데요, 이 과정에서 메모리에 있는 여러 버전 중 하나의 버전만 디스크에 쓰입니다. 이렇게 메모리의 여러 버전 중 디스크에 쓰일 이미지를 선택하는 과정을 WiredTiger에서는 리컨실리에이션(Reconciliation)이라고 칭하고 있습니다. \< 그림 1. MongoDB(WiredTiger) 아키텍처 \>에 이 과정을 추가해 보면 아래 그림과 같이 표현할 수 있습니다.

![그림 3. 리컨실리에이션(Reconciliation)](https://images.gogumang.com/ec1a6fc40e/04.png)

디스크로 쓰일 이미지가 선택되면, 이전의 변경사항들은 메모리상에서 제거되어야 합니다. 하지만 WiredTiger는 **스냅샷 격리 수준** (**Snapshot isolation**)을 기본으로 사용하고 있기 때문에, 오래 수행되고 있는 트랜잭션이 존재하는 경우에는 과거 버전에 대한 조회가 필요할 수 있습니다.

이전의 변경사항들이 단순히 메모리상에서 제거된다면 조회를 실패하는 경우가 발생하게 되므로, 리컨실리에이션 과정에서 선택한 디스크 이미지보다 과거 버전에 대한 변경 이력은 모두 히스토리 스토어(WiredTigerHS.wt 파일)로 저장되는 것입니다.

*** ** * ** ***

여기까지 보면 과거에 사용하던 WiredTigerLAS.wt(Look Aside File)이 궁금하실 수 있는데요. 이제는 더 이상 볼 수 없는 파일이기 때문에, 관심 있으신 독자분들이 참고하실 수 있도록 그 내용을 기록해 두겠습니다.

WiredTiger에서 메모리 사용량이 높아지면 [이빅션 스레드(Eviction thread)](https://source.wiredtiger.com/develop/eviction.html)가 활성화되면서 이빅션할 대상 페이지를 찾습니다. 이러한 이빅션 동작은 주로 아래의 두 가지 목표를 위해 수행됩니다.

* 메모리 확보
* 체크포인트 오버헤드 감소

물론 모든 페이지를 대상으로 이빅션을 수행할 수는 없습니다. 우선적으로 이빅션 대상이 되는 페이지는 아래와 같은 조건을 충족해야 합니다.

**조건 1) 페이지 내 가장 최근 변경사항이 커밋되었는가?**

**조건 2) 과거 버전에 대한 조회를 필요로 하는 트랜잭션이 존재하는가?**

만약 두 조건을 모두 충족하는 경우라면 페이지 내의 모든 도큐먼트가 정상적으로 커밋되었고, 과거 버전에 대한 조회도 발생하지 않을 것이기 때문에 이빅션을 수행해도 문제가 없습니다.

하지만 서버 부하가 너무 높아 두 조건을 모두 충족하는 페이지에 대한 이빅션만으로 메모리 공간 확보를 할 수 없다면 어떻게 할까요?

이런 경우를 대비해 사용하던 파일이 WiredTigerLAS.wt 파일입니다. 이 경우에는 조건 1만 충족하더라도 이빅션 대상에 포함될 수 있었는데, 조건 2에 해당하는 과거 버전에 대한 조회를 필요로 하는 트랜잭션이 존재할 수 있기 때문에 과거 버전에 대한 데이터를 WiredTigerLAS.wt라는 Look Aside File에 임시로 기록해 둔 것입니다.

그리고 WiredTiger 10.0.0 버전부터는 **히스토리 스토어**가 도입되어 페이지가 이빅션 될 때 선택된 디스크 이미지보다 이전 버전의 데이터는 기본적으로 모두 WiredTigerHS.wt 파일에 기록해 두기 때문에 WiredTigerLAS.wt 파일의 기능을 완전히 대체하였습니다.

*** ** * ** ***

지금까지 소개한 내용을 기반으로 WiredTigerHS.wt 파일 내용을 예시를 통해 확인해 보겠습니다.

먼저 MongoDB에서 동일한 도큐먼트에 여러번 업데이트를 수행하여 \< 그림 2\> 와 같이 메모리 상의 업데이트 체인을 생성해보겠습니다.

```
> db.history.insert({"AAA":1})
> db.history.update({"AAA":1},{"$set":{"AAA":3}})
> db.history.update({"AAA":3},{"$set":{"AAA":5}})
> db.history.update({"AAA":5},{"$set":{"AAA":7}})
> db.history.update({"AAA":7},{"$set":{"AAA":9}})
 
> db.history.find()
[
  { _id: ObjectId('66b329e8feb0d3ca20a4da4b'), AAA: 9 }
]
```

\< 예시 8. 업데이트 체인 샘플 데이터 생성 \>

이 상태에서 이빅션 혹은 체크포인트로 인해 해당 도큐먼트가 포함된 더티 페이지(Dirty page)가 디스크로 기록된다면, 리컨실리에이션 과정에서 디스크 이미지로 선택된 { **_id: ObjectId(‘66b329e8feb0d3ca20a4da4b’** ), **AAA: 9** }를 제외한 “AAA” : 1, “AAA” : 3, “AAA” : 5, “AAA” : 7 에 해당하는 도큐먼트는 아래와 같이 WiredTigerHS.wt 파일에 기록될 것 입니다.

```

> wt dump -x file:WiredTigerHS.wt | tail -n 10
…
//key
c01e8182e866b329e7ffffdfc180
//value
e866b329f7ffffdfc2e866b329e7ffffdfc1831f000000075f69640066b329e8feb0d3ca20a4da4b10414141000100000000
c01e8182e866b329f7ffffdfc280
e866b32a0effffdfc1e866b329f7ffffdfc2831f000000075f69640066b329e8feb0d3ca20a4da4b10414141000300000000
c01e8182e866b32a0effffdfc180
e866b32a15ffffdfc1e866b32a0effffdfc1831f000000075f69640066b329e8feb0d3ca20a4da4b10414141000500000000
c01e8182e866b32a15ffffdfc180
e866b32a1bffffdfc1e866b32a15ffffdfc1831f000000075f69640066b329e8feb0d3ca20a4da4b10414141000700000000
```

\< 파일 7. WiredTigerHS.wt 파일 \>

WiredTigerHS.wt 파일의 key/value 값은 여러 값을 조합하여 만들어졌기 때문에 단순한 방법으로는 확인하기 어렵습니다. 이 부분에서는 정확한 값을 파악하기 위해 **히스토리 스토어**에 값을 삽입하는 코드를 참조합니다.

```
/* Insert the new record now. */
cursor->set_key(cursor, 4, btree->id, key, tw->start_ts, counter);
cursor->set_value(
  cursor, tw, tw->durable_stop_ts, tw->durable_start_ts, (uint64_t)type, hs_value);
```

\< 코드 3. 히스토리 스토어에 데이터 삽입 ( [소스 코드](https://github.com/mongodb/mongo/blob/master/src/third_party/wiredtiger/src/history/hs_rec.c#L248-L251) ) \>

코드에서 확인한 파라미터를 기반으로 내부적으로 사용되는 구분자를 가정해 보면 아래와 같이 key/value 값을 추출해 볼 수 있습니다.

```
KEY : (c0) 1e (81) 82 (e8) 66b329e7 (ffffdfc) 1 (80) 
VALUE : (e8) 66b329f7 (ffffdfc) 2 (e8) 66b329e7 (ffffdfc) 1 (8) 3 1f000000075f69640066b329e8feb0d3ca20a4da4b10414141000100000000
KEY : (c0) 1e (81) 82 (e8) 66b329f7 (ffffdfc) 2 (80)
VALUE : (e8) 66b32a0e (ffffdfc) 1 (e8) 66b329f7 (ffffdfc) 2 (8) 3 1f000000075f69640066b329e8feb0d3ca20a4da4b10414141000300000000
KEY : (c0) 1e (81) 82 (e8) 66b32a0e (ffffdfc) 1 (80)
VALUE : (e8) 66b32a15 (ffffdfc) 1 (e8) 66b32a0e (ffffdfc) 1 (8) 3 1f000000075f69640066b329e8feb0d3ca20a4da4b10414141000500000000
KEY : (c0) 1e (81) 82 (e8) 66b32a15 (ffffdfc) 1 (80)
VALUE : (e8) 66b32a1b (ffffdfc) 1 (e8) 66b32a15 (ffffdfc) 1 (8) 3 1f000000075f69640066b329e8feb0d3ca20a4da4b10414141000700000000
```

\< 예시 9. WiredTigerHS.wt 파일 값에 구분자 적용 \>

![그림 4. 히스토리 스토어 테이블](https://images.gogumang.com/ec1a6fc40e/05.png)

**hs_value**에 해당하는 BSON 형식의 문자열을 디코딩해 보면 과거 버전에 대한 도큐먼트 전문을 확인할 수 있습니다.

```
> echo "1f000000075f69640066b329e8feb0d3ca20a4da4b10414141000100000000" | xxd -r -p |  bsondump
{"_id":{"$oid":"66b329e8feb0d3ca20a4da4b"},"AAA":{"$numberInt":"1"}}

> echo "1f000000075f69640066b329e8feb0d3ca20a4da4b10414141000300000000" | xxd -r -p | bsondump
{"_id":{"$oid":"66b329e8feb0d3ca20a4da4b"},"AAA":{"$numberInt":"3"}}

> echo "1f000000075f69640066b329e8feb0d3ca20a4da4b10414141000500000000" | xxd -r -p | bsondump
{"_id":{"$oid":"66b329e8feb0d3ca20a4da4b"},"AAA":{"$numberInt":"5"}}

> echo "1f000000075f69640066b329e8feb0d3ca20a4da4b10414141000700000000" | xxd -r -p | bsondump
{"_id":{"$oid":"66b329e8feb0d3ca20a4da4b"},"AAA":{"$numberInt":"7"}}
```

\< 예시 10. WiredTigerHS.wt 파일 hs_value 값 해석 \>

이처럼 WiredTigerHS.wt 파일은 과거 버전의 변경사항들을 저장합니다. 만약 수행 중인 트랜잭션이 메모리에서 적절한 버전의 데이터를 찾지 못할 경우, 이 파일에서 데이터를 조회할 수 있습니다. 데이터가 삭제되어 히스토리 스토어에서도 데이터를 찾지 못할 경우 WT_NOTFOUND 에러가 반환됩니다.

MongoDB에서는 [minSnapshotHistoryWindowInSeconds](https://www.mongodb.com/docs/manual/reference/parameters/#mongodb-parameter-param.minSnapshotHistoryWindowInSeconds) 파라미터로 히스토리 스토어의 보관주기를 설정할 수 있으며, MongoDB 6.0 버전 기준으로 기본 보관주기는 300초입니다. 이 기능을 활용하여 Read Concern **snapshot** 으로 조회 시 [atClusterTime](https://www.mongodb.com/ko-kr/docs/manual/reference/read-concern-snapshot/#read-concern-and-atclustertime) 옵션을 지정하여 보관주기 내에서 특정 과거 시점 데이터를 조회할 수도 있습니다.

또한, 체크포인트 사이에 예기치 못한 종료가 발생했을 경우 히스토리 스토어를 활용해 최신 안정적인 체크포인트 시점으로 일관성 있는 복구가 가능합니다( 예: [Rollback To Stable](https://source.wiredtiger.com/develop/arch-rts.html) ).

### journal 디렉터리

journal 디렉터리는 Write-ahead log(WAL)에 해당하는 저널로그가 저장되는 폴더입니다.

저널로그의 주요 목적은 서버가 비정상 종료되었을 때에도 데이터의 내구성(Durability)을 보장하기 위해 디스크에 먼저 기록해 두는 것입니다.

WiredTiger는 저널로그 파일을 재사용하지 않고 새로운 파일을 계속 생성하는 방식을 사용합니다. 새로운 파일로의 빠른 전환을 위해 **WiredTigerPreplog.** \* 파일을 미리 생성해 두고, 실제 저널로그가 저장되는 WiredTigerLog.00000N 파일을 모두 사용했을 때 **WiredTigerPreplog.**\* 파일의 이름을 다음 번호로 변경한 후 사용합니다.

저널로그의 내용은 체크포인트 수행 시 데이터 파일에 동기화되므로 체크포인트 시점 이전의 저널로그는 더 이상 필요하지 않아 삭제됩니다.

```
> ls journal/
WiredTigerLog.0000000135
WiredTigerPreplog.0000000001
WiredTigerPreplog.0000000002
```

\< 예시 11. journal 디렉터리 \>

다음으로, MongoDB에서 간단한 쓰기 연산(삽입, 갱신 및 삭제)을 예시로 저널로그 파일 내에서 데이터 변경 사항이 어떻게 저장되는지 살펴보겠습니다.

아래와 같이 연산을 먼저 수행합니다.

```
use kakao
db.wt_version.insert({"MongoDB":"6.0.0","WiredTiger":"10.0.2"})
db.wt_version.update({"MongoDB":"6.0.0","WiredTiger":"10.0.2"},{"$set":{"check":true}})
db.wt_version.remove({"MongoDB":"6.0.0","WiredTiger":"10.0.2"})
```

\< 예시 12. 저널 로그 생성을 위한 DML 예제 \>

각 연산을 수행한 후, 수행한 연산과 관련된 저널로그를 추출하여 확인해 보겠습니다.

```
> wt -C "log=(compressor=snappy,path=journal)" printlog -xu
...
// insert
{ "lsn" : [43,17920],
"hdr_flags" : "",
"rec_len" : 512,
"mem_len" : 512,
"type" : "commit",
"txnid" : 20,
"ops": [
  { "optype": "row_put",
    "fileid": 18 0x12,
    "key": "\u00e8g6\u00d1\u000f\u00ff\u00ff\u00df\u00c2",
    "key-hex": "e86736d10fffffdfc2",
    "value": "c\u0001\u0000\u0000\u0003lsid\u0000H\u0000\u0000\u0000\u0005id\u0000\u0010\u0000\u0000\u0000\u0004\u009d\u00dc(\u00c1\u00ab\u00bbC;\u008d\u00eb\u00ab\u00ba^\u00a8M\u00e5\u0005uid\u0000 \u0000\u0000\u0000\u0000\u00e3\u00b0\u00c4B\u0098\u00fc\u001c\u0014\u009a\u00fb\u00f4\u00c8\u0099o\u00b9\$\'\u00aeA\u00e4d\u009b\u0093L\u00a4\u0095\u0099\u001bxR\u00b8U\u0000\u0012txnNumber\u0000\u0002\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0002op\u0000\u0002\u0000\u0000\u0000i\u0000\u0002ns\u0000\u0011\u0000\u0000\u0000kakao.wt_version\u0000\u0005ui\u0000\u0010\u0000\u0000\u0000\u0004\u00c77U\u0099\u0011jO\u00c4\u0091\u00d1\u00b2\u00ea\u00f7\u000f\u00d2s\u0003o\u0000@\u0000\u0000\u0000\u0007_id\u0000g6\u00d1\u000e5r/TR\u00a4\u00daL\u0002MongoDB\u0000\u0006\u0000\u0000\u00006.0.0\u0000\u0002WiredTiger\u0000\u0007\u0000\u0000\u000010.0.2\u0000\u0000\u0003o2\u0000\u0016\u0000\u0000\u0000\u0007_id\u0000g6\u00d1\u000e5r/TR\u00a4\u00daL\u0000\u0010stmtId\u0000\u0000\u0000\u0000\u0000\u0011ts\u0000\u0002\u0000\u0000\u0000\u0010\u00d16g\u0012t\u0000*\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0012v\u0000\u0002\u0000\u0000\u0000\u0000\u0000\u0000\u0000\twall\u0000:\u00aa .\u0093\u0001\u0000\u0000\u0003prevOpTime\u0000\u001c\u0000\u0000\u0000\u0011ts\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0012t\u0000\u00ff\u00ff\u00ff\u00ff\u00ff\u00ff\u00ff\u00ff\u0000\u0000",
    "value-hex": "63010000036c73696400480000000569640010000000049ddc28c1abbb433b8debabba5ea84de505756964002000000000e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855001274786e4e756d626572000200000000000000026f7000020000006900026e7300110000006b616b616f2e77745f76657273696f6e00057569001000000004c7375599116a4fc491d1b2eaf70fd273036f0040000000075f6964006736d10e35722f5452a4da4c024d6f6e676f44420006000000362e302e30000257697265645469676572000700000031302e302e320000036f320016000000075f6964006736d10e35722f5452a4da4c001073746d7449640000000000117473000200000010d136671274002a0000000000000012760002000000000000000977616c6c003aaa202e9301000003707265764f7054696d65001c000000117473000000000000000000127400ffffffffffffffff0000"
  }
]
}
...
// update
{ "lsn" : [43,33152],
"hdr_flags" : "",
"rec_len" : 384,
"mem_len" : 384,
"type" : "commit",
"txnid" : 25,
"ops": [
  { "optype": "row_put",
    "fileid": 18 0x12,
    "key": "\u00e8g6\u00d1\u0014\u00ff\u00ff\u00df\u00c1",
    "key-hex": "e86736d114ffffdfc1",
    "value": "K\u0001\u0000\u0000\u0003lsid\u0000H\u0000\u0000\u0000\u0005id\u0000\u0010\u0000\u0000\u0000\u0004\u009d\u00dc(\u00c1\u00ab\u00bbC;\u008d\u00eb\u00ab\u00ba^\u00a8M\u00e5\u0005uid\u0000 \u0000\u0000\u0000\u0000\u00e3\u00b0\u00c4B\u0098\u00fc\u001c\u0014\u009a\u00fb\u00f4\u00c8\u0099o\u00b9\$\'\u00aeA\u00e4d\u009b\u0093L\u00a4\u0095\u0099\u001bxR\u00b8U\u0000\u0012txnNumber\u0000\u0003\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0002op\u0000\u0002\u0000\u0000\u0000u\u0000\u0002ns\u0000\u0011\u0000\u0000\u0000kakao.wt_version\u0000\u0005ui\u0000\u0010\u0000\u0000\u0000\u0004\u00c77U\u0099\u0011jO\u00c4\u0091\u00d1\u00b2\u00ea\u00f7\u000f\u00d2s\u0003o\u0000(\u0000\u0000\u0000\u0010$v\u0000\u0002\u0000\u0000\u0000\u0003diff\u0000\u0015\u0000\u0000\u0000\u0003i\u0000\r\u0000\u0000\u0000\u0008check\u0000\u0001\u0000\u0000\u0000\u0003o2\u0000\u0016\u0000\u0000\u0000\u0007_id\u0000g6\u00d1\u000e5r/TR\u00a4\u00daL\u0000\u0010stmtId\u0000\u0000\u0000\u0000\u0000\u0011ts\u0000\u0001\u0000\u0000\u0000\u0015\u00d16g\u0012t\u0000*\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0012v\u0000\u0002\u0000\u0000\u0000\u0000\u0000\u0000\u0000\twall\u0000\u0012\u00ba .\u0093\u0001\u0000\u0000\u0003prevOpTime\u0000\u001c\u0000\u0000\u0000\u0011ts\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0012t\u0000\u00ff\u00ff\u00ff\u00ff\u00ff\u00ff\u00ff\u00ff\u0000\u0000",
    "value-hex": "4b010000036c73696400480000000569640010000000049ddc28c1abbb433b8debabba5ea84de505756964002000000000e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855001274786e4e756d626572000300000000000000026f7000020000007500026e7300110000006b616b616f2e77745f76657273696f6e00057569001000000004c7375599116a4fc491d1b2eaf70fd273036f00280000001024760002000000036469666600150000000369000d00000008636865636b0001000000036f320016000000075f6964006736d10e35722f5452a4da4c001073746d7449640000000000117473000100000015d136671274002a0000000000000012760002000000000000000977616c6c0012ba202e9301000003707265764f7054696d65001c000000117473000000000000000000127400ffffffffffffffff0000"
  }
]
}
...
// delete
{ "lsn" : [43,33664],
"hdr_flags" : "",
"rec_len" : 256,
"mem_len" : 256,
"type" : "commit",
"txnid" : 27,
"ops": [
  { "optype": "row_put",
    "fileid": 18 0x12,
    "key": "\u00e8g6\u00d1\u001c\u00ff\u00ff\u00df\u00c1",
    "key-hex": "e86736d11cffffdfc1",
    "value": "\u008a\u0000\u0000\u0000\u0002op\u0000\u0002\u0000\u0000\u0000d\u0000\u0002ns\u0000\u0011\u0000\u0000\u0000kakao.wt_version\u0000\u0005ui\u0000\u0010\u0000\u0000\u0000\u0004\u00c77U\u0099\u0011jO\u00c4\u0091\u00d1\u00b2\u00ea\u00f7\u000f\u00d2s\u0003o\u0000\u0016\u0000\u0000\u0000\u0007_id\u0000g6\u00d1\u000e5r/TR\u00a4\u00daL\u0000\u0011ts\u0000\u0001\u0000\u0000\u0000\u001d\u00d16g\u0012t\u0000*\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0012v\u0000\u0002\u0000\u0000\u0000\u0000\u0000\u0000\u0000\twall\u0000\u009b\u00db .\u0093\u0001\u0000\u0000\u0000",
    "value-hex": "8a000000026f7000020000006400026e7300110000006b616b616f2e77745f76657273696f6e00057569001000000004c7375599116a4fc491d1b2eaf70fd273036f0016000000075f6964006736d10e35722f5452a4da4c0011747300010000001dd136671274002a0000000000000012760002000000000000000977616c6c009bdb202e9301000000"
  }
]
}
```

\< 파일 8. 저널 로그 파일 \>

이 내용만으로는 어떤 내용을 저장하고 있는지 파악하기 어렵기 때문에, 각 항목을 하나씩 정리해 보겠습니다.

* **lsn**: Log Sequence Number

* **hdr_flags**: 헤더의 플래그 값

* **rec_len**: record length

* **mem_len**: memory length

* **type**: 트랜잭션 타입 ( 예: “commit”, “abort” )

* **txnid**: transaction ID

* **ops**: 수행한 연산 정보

  * **optype**: 연산 유형을 나타냅니다. ( 예: “row_put”,“row_modify”…)

  * **fileid**: 연산이 수행된 file id

  * **key**: key 값

  * **key-hex**: key의 16진수 값

  * **value**: value 값

  * **value-hex**: value의 16진수 값

수행된 연산에 대한 정보를 포함하는 **ops** 필드를 중점적을 살펴보겠습니다.

```

"ops": [
  { "optype": "row_put",
    "fileid": 18 0x12,
    "key": "\u00e8g6\u00d1\u000f\u00ff\u00ff\u00df\u00c2",
    "key-hex": "e86736d10fffffdfc2",
    "value": "...",
    "value-hex": "..."
  }
]

"ops": [
  { "optype": "row_put",
    "fileid": 18 0x12,
    "key": "\u00e8g6\u00d1\u0014\u00ff\u00ff\u00df\u00c1",
    "key-hex": "e86736d114ffffdfc1",
    "value":"...",
    "value-hex": "..."
  }
]
"ops": [
  { "optype": "row_put",
    "fileid": 18 0x12,
    "key": "\u00e8g6\u00d1\u001c\u00ff\u00ff\u00df\u00c1",
    "key-hex": "e86736d11cffffdfc1",
    "value": "...",
    "value-hex": "..."
  }
]
```

\< 예시 13. 저널 로그의 ops 필드 \>

위 예시에서 모든 **ops** 항목의 **optype** 은 **row_put** 으로 표시되고, **fileid**는 모두 18(0x12)입니다.

**optype** 은 해당 항목의 연산 유형을 나타내며, 일반적으로 데이터 삽입에는 **row_put** , 데이터 수정에는 **row_modify** 를 사용합니다. 여기에서 update() 연산은 **row_modify** 타입이 아닌가라는 생각이 들 수 있는데요. MongoDB에서 저널링은 `local.oplog.rs` 컬렉션에만 활성화(log=(enabled=true))되어 있고, [OpLog(Operations Log)](https://www.mongodb.com/ko-kr/docs/manual/core/replica-set-oplog/)는 복제를 목적으로 프라이머리의 모든 변경사항을 기록하여 데이터 삽입만 발생하기 때문에 모든 변경사항은 **row_put** 타입으로 기록됩니다.

위 예시의 저널로그가 `local.oplog.rs`에 해당하는 연산인지에 대한 확인은 **fileid**를 통해 할 수 있습니다.

```
// file id 18에 해당하는 메타데이터 검색
> wt dump file:WiredTiger.wt | grep -B 1 ',id=18'
file:local/collection-2-9099766355459865316.wt\00
...
```

\< 예시 14. WiredTiger.wt 파일에서 fileid 검색 \>

**fileid : 18**에 해당하는 파일은 local/collection-2-9099766355459865316.wt 입니다. 이 파일에 매핑되어 있는 네임스페이스는 _mdb_catalog.wt 파일에서 확인할 수 있습니다.

```
> wt dump -x table:_mdb_catalog | tail -n +7 | awk 'NR%2 == 0 { print }' | xxd -r -p | bsondump | grep "local/collection-2-9099766355459865316" | jq .ns
"local.oplog.rs"
```

\< 예시 15. _mdb_catalog.wt 파일에서 파일 이름 검색 \>

정리해 보면 **fileid : 18** 에 해당하는 네임스페이스는 `local.oplog.rs`이며 저널로그에는 **oplog**의 변경사항이 기록되고 있음을 알 수 있습니다.

![그림 5. 파일 식별자 매핑 정보](https://images.gogumang.com/ec1a6fc40e/06.png)

저널로그에 기록된 key/value 값도 이어서 확인해 보겠습니다.

```
// insert()
    "key-hex": "e86736d10fffffdfc2",
    "value-hex": "63010000036c73696400480000000569640010000000049ddc28c1abbb433b8debabba5ea84de505756964002000000000e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855001274786e4e756d626572000200000000000000026f7000020000006900026e7300110000006b616b616f2e77745f76657273696f6e00057569001000000004c7375599116a4fc491d1b2eaf70fd273036f0040000000075f6964006736d10e35722f5452a4da4c024d6f6e676f44420006000000362e302e30000257697265645469676572000700000031302e302e320000036f320016000000075f6964006736d10e35722f5452a4da4c001073746d7449640000000000117473000200000010d136671274002a0000000000000012760002000000000000000977616c6c003aaa202e9301000003707265764f7054696d65001c000000117473000000000000000000127400ffffffffffffffff0000"

// update()
    "key-hex": "e86736d114ffffdfc1",
    "value-hex": "4b010000036c73696400480000000569640010000000049ddc28c1abbb433b8debabba5ea84de505756964002000000000e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855001274786e4e756d626572000300000000000000026f7000020000007500026e7300110000006b616b616f2e77745f76657273696f6e00057569001000000004c7375599116a4fc491d1b2eaf70fd273036f00280000001024760002000000036469666600150000000369000d00000008636865636b0001000000036f320016000000075f6964006736d10e35722f5452a4da4c001073746d7449640000000000117473000100000015d136671274002a0000000000000012760002000000000000000977616c6c0012ba202e9301000003707265764f7054696d65001c000000117473000000000000000000127400ffffffffffffffff0000"

// delete()
    "key-hex": "e86736d11cffffdfc1",
    "value-hex": "8a000000026f7000020000006400026e7300110000006b616b616f2e77745f76657273696f6e00057569001000000004c7375599116a4fc491d1b2eaf70fd273036f0016000000075f6964006736d10e35722f5452a4da4c0011747300010000001dd136671274002a0000000000000012760002000000000000000977616c6c009bdb202e9301000000"
```

\< 예시 16. 저널 로그에 기록된 key/value 값 \>

먼저 key 값을 살펴보면 WiredTigerHS.wt에서 분석했던 값과 유사한 구분자가 적용되어 있음을 알 수 있습니다. 동일한 구분자를 적용해 보면 insert() 연산에 해당하는 key 값의 경우 "(e8) 6736d10f (ffffdfc) 2"로 표현할 수 있고, 이는 유닉스 타임스탬프와 카운터의 조합을 나타냅니다("6736d10f"는 KST 기준 2024년 11월 15일 금요일 13시 41분 51초입니다).

그리고 value 값은 BSON 형식으로 bsondump를 통해 디코딩할 수 있습니다.

```
> echo "63010000036c73696400480000000569640010000000049ddc28c1abbb433b8debabba5ea84de505756964002000000000e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855001274786e4e756d626572000200000000000000026f7000020000006900026e7300110000006b616b616f2e77745f76657273696f6e00057569001000000004c7375599116a4fc491d1b2eaf70fd273036f0040000000075f6964006736d10e35722f5452a4da4c024d6f6e676f44420006000000362e302e30000257697265645469676572000700000031302e302e320000036f320016000000075f6964006736d10e35722f5452a4da4c001073746d7449640000000000117473000200000010d136671274002a0000000000000012760002000000000000000977616c6c003aaa202e9301000003707265764f7054696d65001c000000117473000000000000000000127400ffffffffffffffff0000" | xxd -r -p | bsondump | jq
{
  "lsid": {
    "id": {
      "$binary": {
        "base64": "ndwowau7QzuN66u6XqhN5Q==",
        "subType": "04"
      }
    },
    "uid": {
      "$binary": {
        "base64": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
        "subType": "00"
      }
    }
  },
  "txnNumber": {
    "$numberLong": "2"
  },
  "op": "i",
  "ns": "kakao.wt_version",
  "ui": {
    "$binary": {
      "base64": "xzdVmRFqT8SR0bLq9w/Scw==",
      "subType": "04"
    }
  },
  "o": {
    "_id": {
      "$oid": "6736d10e35722f5452a4da4c"
    },
    "MongoDB": "6.0.0",
    "WiredTiger": "10.0.2"
  },
  "o2": {
    "_id": {
      "$oid": "6736d10e35722f5452a4da4c"
    }
  },
  "stmtId": {
    "$numberInt": "0"
  },
  "ts": {
    "$timestamp": {
      "t": 1731645712,
      "i": 2
    }
  },
  "t": {
    "$numberLong": "42"
  },
  "v": {
    "$numberLong": "2"
  },
  "wall": {
    "$date": {
      "$numberLong": "1731645712954"
    }
  },
  "prevOpTime": {
    "ts": {
      "$timestamp": {
        "t": 0,
        "i": 0
      }
    },
    "t": {
      "$numberLong": "-1"
    }
  }
}
```

\< 예시 17. 저널 로그에 기록된 value 값 해석 \>

이제 서버에 접속하여 해당 연산에 대한 **oplog**를 확인해 보면 동일한 값이 기록되는 것을 알 수 있습니다.

```
> use local
> db.oplog.rs.find({"ns":"kakao.wt_version", "op":"i"})
{
lsid: {
  id: UUID('9ddc28c1-abbb-433b-8deb-abba5ea84de5'),
  uid: Binary.createFromBase64('47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=', 0)
},
txnNumber: Long('2'),
op: 'i',
ns: 'kakao.wt_version',
ui: UUID('c7375599-116a-4fc4-91d1-b2eaf70fd273'),
o: {
  _id: ObjectId('6736d10e35722f5452a4da4c'),
  MongoDB: '6.0.0',
  WiredTiger: '10.0.2'
},
o2: { _id: ObjectId('6736d10e35722f5452a4da4c') },
stmtId: 0,
ts: Timestamp({ t: 1731645712, i: 2 }),
t: Long('42'),
v: Long('2'),
wall: ISODate('2024-11-15T04:41:52.954Z'),
prevOpTime: { ts: Timestamp({ t: 0, i: 0 }), t: Long('-1') }
}
```

\< 예시 18. 예시 17에 해당하는 oplog 확인 \>

MongoDB 쉘에서는 사용자 편의를 위해 보기 편한 형태로 데이터 타입을 변환하여 보여주기 때문에, 출력 형태는 다를 수 있지만 실제 값은 모두 동일한 것을 확인할 수 있습니다. 예를 들어, `$oid`는 ObjectId, `$timestamp`는 Timestamp({t:0, i:0})과 같이 직관적으로 이해할 수 있는 표현을 사용합니다. 추가적으로 데이터 타입에 더 궁금한 부분이 있으시다면 [mongodb-extended-json](https://www.mongodb.com/docs/manual/reference/mongodb-extended-json/#examples)을 참고하시는 것을 권장드립니다.

여기까지의 내용을 통해 저널로그에 **oplog** 의 변경사항이 저장되고 있는 것을 확인했습니다. 하지만 이는 모든 구성에 적용되는 것은 아닌데요, **standalone** 배포 형태에서는 복제를 위한 **oplog** 가 없기 때문에 모든 컬렉션과 인덱스 파일에 대한 저널링이 필요하게 됩니다. 이렇듯 **standalone** 구성으로는 MongoDB의 강력한 장점을 활용하지 못하는 경우가 대부분이기 때문에 **standalone** 배포 형태는 테스트용으로만 사용하시길 권장드립니다.

### 컬렉션 파일(collection-\*)과 인덱스 파일(index-\*)

이제 실제 데이터가 저장되는 컬렉션 파일과 인덱스 파일만 남았습니다. **directoryPerDB = True 옵션** 과 **directoryForIndexes = False 옵션**을 사용할 경우, 아래와 같이 데이터베이스별로 동일한 디렉터리에 데이터 파일과 인덱스 파일이 함께 위치하게 됩니다.

```
> ls kakao/
collection-0-6574883217453298519.wt  
index-1-6574883217453298519.wt 
index-2-6574883217453298519.wt
```

\< 예시 19. 데이터베이스(kakao) 디렉터리 \>

그리고 지금까지 해왔던 것처럼 _mdb_catalog.wt 파일을 참고하면 각 파일에 매핑되는 식별자를 확인할 수 있습니다.

```
"idxIdent": {
    "_id_": "kakao/index-1-6574883217453298519",
    "MongoDB_1": "kakao/index-2-6574883217453298519"
  },
  "ns": "kakao.wt_version",
  "ident": "kakao/collection-0-6574883217453298519"
```

\< 예시 20. 파일명에 매핑되는 식별자 \>

이렇듯 MongoDB에서는 논리적으로 컬렉션 데이터와 인덱스가 구분되어 사용되지만, WiredTiger는 기본적으로 모든 데이터를 키-값 저장소(key-value store) 형태로 관리하고 있습니다. 그러므로 WiredTiger 기준에서는 컬렉션 파일, 인덱스 파일 구분 없이 모두 B+tree 구조로 관리되며 동일한 방식으로 처리된다고 볼 수 있습니다.

![그림 6. WiredTiger의 B+tree 구조](https://images.gogumang.com/ec1a6fc40e/07.png)

먼저 도큐먼트 전문이 저장되어 있는 컬렉션 파일부터 살펴보겠습니다.

```
> wt dump -x file:kakao/collection-0-6574883217453298519.wt | tail -n +7
//key
81

//value
40000000075f69640067359f73db0cf0f693a4da4b024d6f6e676f44420006000000342e342e30000257697265645469676572000700000031302e302e300000

82
40000000075f69640067359f89db0cf0f693a4da4c024d6f6e676f44420006000000352e302e30000257697265645469676572000700000031302e302e310000
```

\< 파일9. 컬렉션 파일 \>

컬렉션 파일의 key 값으로는 WiredTiger에서 할당하는 유니크한 식별자인 RecordId가 사용됩니다. RecordId는 MongoDB에서 조회 시 showRecordId() 명령어를 통해서도 확인할 수 있습니다.

```
> db.wt_version.find().showRecordId()
{
  _id: ObjectId('67359f73db0cf0f693a4da4b'),
  MongoDB: '4.4.0',
  WiredTiger: '10.0.0',
  '$recordId': Long('1')
},
{
  _id: ObjectId('67359f89db0cf0f693a4da4c'),
  MongoDB: '5.0.0',
  WiredTiger: '10.0.1',
  '$recordId': Long('2')
}
```

\< 예시 21. showRecordId() 명령어 예제 \>

여기에서 조회되는 `$recordId`에 특정 값(0x80)이 더해진 결과가 컬렉션 파일의 key로 저장되어 있습니다.

그리고 BSON 형식의 value를 디코딩하면 아래와 같이 데이터 원본이 저장되어 있는 것을 확인할 수 있습니다.

```
> echo "40000000075f69640067359f73db0cf0f693a4da4b024d6f6e676f44420006000000342e342e30000257697265645469676572000700000031302e302e300000" | xxd -r -p | bsondump
{
  "_id": {
    "$oid": "67359f73db0cf0f693a4da4b"
  },
  "MongoDB": "4.4.0",
  "WiredTiger": "10.0.0"
}

> echo "40000000075f69640067359f89db0cf0f693a4da4c024d6f6e676f44420006000000352e302e30000257697265645469676572000700000031302e302e310000" | xxd -r -p | bsondump
{
  "_id": {
    "$oid": "67359f89db0cf0f693a4da4c"
  },
  "MongoDB": "5.0.0",
  "WiredTiger": "10.0.1"
}

//도큐먼트 조회
> db.wt_version.find()
[
  {
    _id: ObjectId('67359f73db0cf0f693a4da4b'),
    MongoDB: '4.4.0',
    WiredTiger: '10.0.0'
  },
  {
    _id: ObjectId('67359f89db0cf0f693a4da4c'),
    MongoDB: '5.0.0',
    WiredTiger: '10.0.1'
  }
]
```

\< 예시 22. 컬렉션 파일의 value 값 해석 \>

아래는 인덱스 파일입니다. 예제로 사용된 컬렉션에는 기본 키인 _id에 대한 인덱스와 { **MongoDB : 1** } 보조 인덱스(Secondary Index)가 생성되어 있습니다.

```
// { _id : 1 }
> wt dump -x file:kakao/index-1-6574883217453298519.wt | tail -n +7
6467359f73db0cf0f693a4da4b04
0008
6467359f89db0cf0f693a4da4c04
0010

// { MongoDB : 1 }
> wt dump -x file:kakao/index-2-6574883217453298519.wt | tail -n +7
3c342e342e3000040008
(공백)
3c352e302e3000040010
(공백)
```

\< 파일 10. 인덱스 파일 \>

인덱스 파일의 값은 BSON 형식의 대안인 KeyString 형식의 직렬화된 값을 사용합니다. BSON 형식은 중첩 구조 등 유연한 데이터 타입을 표현하기 좋지만 비교 연산은 상대적으로 복잡합니다.

인덱스의 주된 목적은 빠른 조회이므로, 이를 위해 MongoDB에서는 이진 비교(Binary Comparable)가 가능한 KeyString 형식을 사용하여 성능을 최적화합니다.

KeyString 직렬화는 생소한 개념일 수 있으므로, 파일 내용을 확인하기 전에 예시를 통해 설명드리겠습니다.

```
db.keystring.insertMany([{
  "normal_1": 100,
  "normal_2": 100,
},{
  "normal_1": "100",
  "normal_2": "100",
},{
  "normal_1": {"n":"100"},
  "normal_2": {"n":"100"},
}])

db.keystring.createIndex({"normal_1":1, "normal_2":1})
```

\< 예시 23-1. 데이터 타입별 샘플 데이터 생성 \>

위와 같이 데이터 타입이 다른 값을 삽입한 후 인덱스 파일의 내용을 확인해보겠습니다.

```
// {"normal_1":1, "normal_2":1} 인덱스
> wt dump -x file:kakao/index-2--8125504689748729863.wt | tail -n +7
2bc82bc8040010

3c313030003c31303000040020

463c6e003c3130300000463c6e003c3130300000040018
```

\< 예시 23-2. 샘플 데이터의 인덱스 파일 값 \>

이제 파일 내부의 값을 하나씩 살펴보겠습니다.

* **2bc82bc8040010**

인덱스 파일은 이미 필드 순서가 정의되어 있기 때문에 필드명을 따로 저장할 필요가 없습니다. 대신 MongoDB는 스키마리스(Schemaless)를 지원하기에 동일한 필드에도 여러 데이터 타입을 사용할 수 있어 이를 표현하기 위한 값을 사용합니다.

BSONObj 타입과 매핑 정보는 Ctype(Canonical types namespace)에 정의되어 있습니다.

```
...
const uint8_t kNumeric = 30;
const uint8_t kStringLike = 60;
const uint8_t kObject = 70;
...
const uint8_t kNumericPositive1ByteInt = kNumeric + 13;
const uint8_t kNumericPositive2ByteInt = kNumeric + 14;
...
```

\< 코드 4. Canonical types namespace ([소스 코드](https://github.com/mongodb/mongo/blob/master/src/mongo/db/storage/key_string/key_string.cpp#L82)) \>

이를 기반으로 2bc82bc8040010 값은 아래 그림과 같이 표현할 수 있습니다.

![그림 7. 2bc82bc8040010 값 해석](https://images.gogumang.com/ec1a6fc40e/08.png)

각 필드의 값인 100은 **kNumericPositive1ByteInt** 에 해당하므로, **kNumeric(30) + 13 = 43** 으로 매핑되며, 이는 16진수로 **2b**가 됩니다.

그리고 **c8** 은 10진수로 표현하면 200으로 실제 값보다 2배 큰 값이 저장되어 있는데, 이는 정수형 타입에는 왼쪽 시프트 연산(**integerPart \<\< 1**)이 적용되어 있기 때문으로 보입니다.

정리하자면, 2bc82bc8040010 값은 {**"": 100, “”: 100**}을 표현하며 맨 뒤에 Append 된 RecordId를 참조하여 BSON 형식의 원본 도큐먼트를 조회할 수 있습니다.

* **3c313030003c31303000040020**

**3c** 는 10진수로 60이므로, **kStringLike**에 해당합니다. 1번과 동일한 방식으로 구분해보겠습니다.

![그림 8. 3c313030003c31303000040020 값 해석](https://images.gogumang.com/ec1a6fc40e/09.png)

그리고 주어진 16진수 값을 ASCII 문자로 변환하면 아래와 같습니다.

```
> echo "31303000" | xxd -r -p
100
```

\< 예시 24. 그림 8의 value 값 해석 \>

이를 통해, 해당 값은 {**"": “100”, “”: “100”**}인 것을 알 수 있습니다.

* **463c6e003c3130300000463c6e003c3130300000040018**

**46** 은 10진수로 70이므로, **kObject**에 해당합니다. 동일한 방식으로 구분해보겠습니다.

![그림 9. 463c6e003c3130300000463c6e003c3130300000040018 값 해석](https://images.gogumang.com/ec1a6fc40e/10.png)

여기에서 값에 해당하는 **3c6e003c3130300000** 은 JSON 객체인 {**“n”:“100”**}에 해당하므로 추가적인 변환이 필요하며, 방식은 동일합니다.

```
-> (3c) 6e00 (3c) 3130300000

// 주어진 16진수 값을 ASCII 문자로 변환하면 아래와 같습니다.
> echo "6e00" | xxd -r -p
n

> echo "3130300000" | xxd -r -p
100
```

\< 예시 25. 그림 9의 value 값 해석 \>

이렇듯 인덱스 파일에서는 KeyString 직렬화를 통해 데이터를 저장하고 있으므로, 매핑 정보를 활용해 인덱스 파일의 값으로 어떤 데이터가 저장되어 있는지 확인할 수 있습니다.

마찬가지로, 인덱스 파일에서 RecordId도 컬렉션 파일에서와는 다른 값을 사용하고 있는데요.

RecordId는 최적화를 위해 독특한 인코딩 방식을 사용합니다. 이 방식은 처음과 마지막 바이트의 상위 및 하위 3비트에 숫자 **N** (**0\~7** )을 저장하여 두 바이트 사이에 얼마나 많은 바이트가 있는지를 나타냅니다. 따라서 전체 바이트 수는 (**N + 2**)가 됩니다.

예를 들어, (**N = 0**)일 때 전체 바이트 길이는 2가 됩니다. 이에 해당하는 16비트 중 처음과 마지막에는 바이트 수를 표현하는 3비트가 포함되어 있으므로, 실제 값을 위해 사용 가능한 비트는 10비트 입니다.

이러한 방식으로 RecordId는 2바이트에서 9바이트까지의 다양한 길이로 저장될 수 있으며, 최적화된 형태로 64비트의 RecordId를 모두 표현할 수 있습니다.

![그림 10. RecordId 인코딩 방식](https://images.gogumang.com/ec1a6fc40e/11.png)

위 내용 기반으로 RecordId를 변환해보겠습니다.

* **RecordId : 1**

**RecordId : 1**은 전체 2바이트로 표현(N = 0)이 가능하므로, 처음과 끝 3비트는 000이 됩니다.

따라서 (**000** )**0 0000 0000 1** (**000**)으로 표현할 수 있고, 이를 16진수로 변환하면 0008 이 되며 이 값이 인덱스 파일에 저장됩니다.

* **RecordId : 1024**

2바이트로는 (**000** )**1 1111 1111 1** (**000** )에 해당하는 1023 까지만 표현이 가능하므로, **RecordId : 1024** 부터는 \<그림 10\>과 같이 전체 3바이트로 표현(N = 1)을 해야하며, 처음과 끝 3비트는 **001**이 됩니다.

따라서 (**001** )**0 0000 0010 0000 0000 0** (**001**)으로 표현할 수 있고, 이를 16진수로 변환하면 202001 이 되고 이 값이 인덱스 파일에 저장됩니다.

해석 방식을 이해하게 되었으므로, 다시 본래의 내용으로 돌아와서 인덱스 파일을 확인해보겠습니다.

```
// { _id : 1 }
> wt dump -x file:kakao/index-1-6574883217453298519.wt | tail -n +7
6467359f73db0cf0f693a4da4b04
0008
6467359f89db0cf0f693a4da4c04
0010

// { MongoDB : 1 }
> wt dump -x file:kakao/index-2-6574883217453298519.wt | tail -n +7
3c342e342e3000040008
(공백)
3c352e302e3000040010
(공백)
```

\< 파일 10. 인덱스 파일 \>

MongoDB에서 기본 키(Primary Key) 역할을 하는 _id에 대한 인덱스부터 살펴보겠습니다. 타입을 표현하는 64(kOID)와 마지막 구분자를 제외하면 _id 필드의 값을 확인할 수 있습니다.

```
6467359f73db0cf0f693a4da4b04
-> (64) 67359f73db0cf0f693a4da4b (04)

> db.wt_version.find({_id: ObjectId('67359f73db0cf0f693a4da4b')})
[
  {
    _id: ObjectId('67359f73db0cf0f693a4da4b'),
    MongoDB: '4.4.0',
    WiredTiger: '10.0.0'
  }
]
```

\< 예시 26. _id 인덱스 파일의 key 값 해석 \>

그리고 value 값 0008은 RecordId를 가리키는데, MySQL에서는 기본 키가 클러스터드 인덱스(Clustered index)로 구성되기 때문에 MySQL에 익숙하신 분들은 이 내용이 다소 생소하게 느껴질 수 있으실 것 같습니다. MongoDB에서는 _id에 대한 인덱스도 보조 인덱스와 동일하게 논클러스터드 인덱스(Non-Clustered index)로 구성되어 있습니다.

따라서 B+tree 구조를 사용하는 _id 인덱스의 리프 페이지에는 실제 도큐먼트가 저장되는 것이 아닌, 아래 그림과 같이 키(_id), 값(RecordId) 쌍으로 구성된 데이터가 저장되어 있습니다.

![그림 11. _id에 대한 조회](https://images.gogumang.com/ec1a6fc40e/12.png)

기본 키를 클러스터드 인덱스로 구성하면 기본 키에 대한 조회 시 실제 데이터가 포함된 페이지로 직접 연결되기 때문에 \<그림 11\>과 같은 구조에 비해 Disk I/O를 절약하며 쿼리 수행 및 삽입 성능에 이점이 있습니다. 하지만, 이런 경우 파일 내의 도큐먼트를 항상 기본 키 값을 기준으로 정렬된 형태로 유지해야 하기 때문에, 기본 키 선택과 사용에 제약이 생겨 유연성에서는 다소 불리할 수 있다는 특징이 있습니다.

어떤 분들은 기본 키인 _id에 대한 인덱스를 논클러스터드 인덱스로도 구성하여, 모든 연산을 내부적으로 두 번 수행해야 한다는 것에 부정적인 시선을 가질 수 있다고 생각합니다. 예를 들어, 데이터 삽입에는 두 번의 쓰기가 필요하며 쿼리를 위해서는 두 번의 읽기가 필요합니다.

하지만 MongoDB가 이런 사용자를 놓칠 리 없죠. MongoDB 5.3부터는 _id에 대한 인덱스를 클러스터드 인덱스로 구성하는 [클러스터드 컬렉션(Clustered-collections)](https://www.mongodb.com/docs/manual/core/clustered-collections/)을 지원하며, 사용자는 선택에 따라 컬렉션을 구성할 수 있게 되었습니다.

클러스터드 컬렉션 파일의 내용을 아래와 같은 간단한 예제를 통해 살펴보겠습니다.

```
// 클러스터드 컬렉션 생성
> db.runCommand( {
    create: "kakao",
    clusteredIndex: { "key": { _id: 1 }, "unique": true, "name": "_id_1" }
} )

> db.kakao.getIndexes()
[
  {
    v: 2,
    key: { _id: 1 },
    name: '_id_1',
    unique: true,
    clustered: true
  }
]

// 데이터 삽입
> db.kakao.insertOne({
    _id: "777",
    MongoDB: '4.4.0',
    WiredTiger: '10.0.0'
  }) 

> db.kakao.insertOne({
    _id: "666",
    MongoDB: '5.0.0',
    WiredTiger: '10.0.1'
  })  

// 컬렉션 파일
> wt dump -x file:test/collection-0-7322022176612457386.wt | tail -n +7
//KEY
3c36363600
//VALUE
3c000000025f6964000400000036363600024d6f6e676f44420006000000352e302e30000257697265645469676572000700000031302e302e310000
3c37373700
3c000000025f6964000400000037373700024d6f6e676f44420006000000342e342e30000257697265645469676572000700000031302e302e300000

//KEY 값 확인 (3c)363636(00)
> echo "363636" | xxd -r -p
666

//VALUE 값 확인
> echo "3c000000025f6964000400000036363600024d6f6e676f44420006000000352e302e30000257697265645469676572000700000031302e302e310000" | xxd -r -p | /bsondump
{
  "_id": "666",
  "MongoDB": "5.0.0",
  "WiredTiger": "10.0.1"
}
```

\< 예시 27. 클러스터드 컬렉션 예제 \>

\< 파일9. 컬렉션 파일\>의 일반 컬렉션의 파일과는 다르게 _id 인덱스를 도큐먼트와 별도로 저장하지 않고, 컬렉션 파일에 _id 값 순서대로 도큐먼트를 저장하는 것을 확인할 수 있습니다. 하지만, 이럴 경우 보조 인덱스에서는 RecordId 값 대신 _id 값을 참조해야 하기 때문에 보조 인덱스 파일의 모든 키에는 _id 값이 더해진 형태로 저장됩니다. 그래서 클러스터드 컬렉션을 사용할 경우, _id 값 선택에 따라 인덱스가 기존에 비해 커질 수 있음을 주의해서 사용해야 합니다.

![그림 12. 클러스터드 컬렉션에서 _id에 대한 조회](https://images.gogumang.com/ec1a6fc40e/13.png)

다음으로 보조 인덱스도 _id 인덱스와 해석 방식은 다르지 않지만, 특이하게 RecordId가 key에 Append된 형태로 저장되어 있습니다. 이는 보조 인덱스의 경우 중복된 값이 저장될 수 있기 때문에 key의 고유성을 보장하기 위한 목적으로 보입니다.

```
// { MongoDB : 1 }
> wt dump -x file:kakao/index-2-6574883217453298519.wt | tail -n +7
3c342e342e3000040008
(공백)
3c352e302e3000040010
(공백)

(3c) 342e342e3000 (04) 0008
> echo "342e342e3000" | xxd -r -p
4.4.0
```

\< 예시 28. 보조 인덱스 파일의 key 값 해석 \>

## 마무리하며

이번 글에서는 MongoDB의 기본 스토리지 엔진인 WiredTiger에서 관리하는 다양한 파일들에 대해 알아보았습니다. 파일 명을 통해 그 기능을 짐작하거나 눈을 크게 뜨고 보면 이미 알고 있는 내용일 수도 있겠지만, 누군가에게는 말씀드린 내용들이 새로운 정보로 다가왔을 것이라 생각합니다.

글의 서두에 말씀드린 것처럼 이러한 세부적인 내용을 아는 것은 개인적인 호기심을 만족시킬 수 있고, 때로는 실무에서 유용한 정보들을 제공할 수도 있지만, 이러한 세부적인 내용들을 모른다고 해서 MongoDB를 사용하는 데는 지장이 없습니다.

다만, 종종 학습 과정에서 필수적이지 않은 지식도 나중에는 도움이 될 수 있고, 개인적인 성취감을 느낄 수 있는 경우도 많습니다. 이 글의 내용 또한 저뿐만 아니라 독자분들께도 언젠가 도움이 되기를 바라며, 글을 마무리하겠습니다.

긴 글 읽어주셔서 감사합니다. 또한, 이 글의 최종 검토와 리뷰를 도와주신 `dj.seo`, `david.stdio`, `vivaan.jang`께 감사드립니다. 작은 피드백 하나하나가 큰 도움이 되었습니다.

## 참고 문서

* <https://source.wiredtiger.com/11.3.1/index.html>
* <https://github.com/wiredtiger/wiredtiger>

## 📚 관련된 글

* [MongoDB WiredTiger의 파일 구조](https://tech.kakao.com/posts/670) (현재 글)
* [MongoDB WiredTiger의 B+Tree](https://tech.kakao.com/posts/688)

*** ** * ** ***

Written by `Andy.hj`

Edited by `June.6`