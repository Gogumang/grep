## 사건의 발단

저희 딜리버리 프로덕트 개발팀은 AWS MSK 버전 업그레이드에 대응하기 위해 관리 중인 시스템들의 스프링부트 버전을 3.x대로 업데이트했습니다. 이미 다른 프로젝트에서 스프링부트 버전업을 경험한 데다, 팀원들이 겪었던 이슈들을 잘 정리한 문서 덕분에 큰 어려움 없이 작업을 진행할 수 있었습니다. 업데이트된 프로젝트는 QA를 무사히 통과해 운영 환경에 배포되었고, 배포 후에도 별다른 문제 없이 잘 동작하는 듯했습니다.

하지만 다음 날 자정 직전에 에러 알림이 발생하기 시작했습니다. 해당 버그로 인해 일부 배송 매니저는 배송 업무를 볼 때, 사용하는 컬리버드 앱에 로그인 자체가 불가능한 상태였습니다. 특히 에러가 발생한 시점이 샛별 배송이 활발하게 진행되는 시간대였기 때문에, 배송 업무에 차질이 없도록 신속하게 롤백을 진행한 후 다음날 에러 원인을 파악하기 시작했습니다.

![버그 지금 잡으러 갑니다](https://helloworld.kurly.com/_astro/bug_catch_right_now.BJ-6IdDg_Z29J6o9.webp)

*버그 지금 잡으러 갑니다*

## 문제 좁히기

먼저 문제의 원인을 좁히기위해서 에러 로그를 확인했습니다.
> java.time.DateTimeException: Invalid value for NanoOfSecond (valid values 0 - 999999999): -843000000

이 로그를 통해, DB에서 데이터를 조회하여 객체로 변환하는 과정에서 DateTime 형식에 문제가 있음을 파악할 수 있었습니다. 음수의 나노초 값을 가지는 데이터가 원인인 것 같아서, DB에 그런 데이터가 있는지 확인해보았습니다.

하지만 확인 결과, 음수의 나노초를 포함한 날짜나 시각 데이터는 존재하지 않았고, 모든 데이터가 0 또는 양수 값을 가지고 있었습니다.

데이터를 검토하면서 배포 이전과 이후의 시점에서 나노초 값이 미묘하게 달라졌다는 점을 발견했습니다. 배포 이전의 데이터에는 나노초가 없었으나, 배포 이후에는 나노초가 포함된 데이터가 생긴 것이었습니다.

이로 인해 두 가지 의문이 생겼습니다

1. 배포 전후로 나노초 값이 다른 이유는 무엇일까?
2. DB에는 정상 범위의 나노초가 저장되어 있는데, 왜 조회 과정에서 음수의 나노초가 발생하는 걸까?

### 1. 배포 전후로 나노초 값이 다른 이유

#### 의심 1: 자바 버전 업그레이드의 영향 (11 ➡️ 17)

배포 전후의 차이점을 분석하던 중, 먼저 자바 버전의 변경을 의심했습니다. 스프링 부트 3.x는 최소 JDK 17을 요구하므로, 자바 버전을 11에서 17로 업그레이드했고, 이로 인한 영향을 고려해 LocalTime 로직의 변화를 확인해봤습니다. 하지만 자바 11과 17의 LocalTime 로직에 수정된 부분은 없었습니다.

또한, 로컬 환경에서 테스트한 결과, 배포 이전에도 나노초 값은 0이 아닌 상태였으며, 저장 시점에 나노초 값을 버리고 DB에 저장된다는 사실을 알게 되었습니다.

#### 의심 2: 하이버네이트 버전 업그레이드의 영향 (5.6.5 ➡️ 6.5.5)

자바 버전이 원인이 아닌 것으로 확인된 후, DB 저장을 처리하는 하이버네이트 로직을 의심했습니다. 실제로 하이버네이트 버전이 변경되면서, LocalTime 타입을 DB에 저장할 때 호출되는 LocalTimeJavaType.unwrap 메서드가 수정된 것을 확인할 수 있었습니다.

이전 하이버네이트 버전에서는 LocalTime을 Time 객체로 변환할 때 나노초를 무시했지만, 최신 버전에서는 나노초까지 반영해 Time 객체를 생성하도록 변경되었습니다. 결국, 하이버네이트 버전 업그레이드로 인해 배포 전후로 나노초 유무가 달라졌다는 것을 파악했습니다.

### AS IS

LocalTimeJavaDescriptor.unwrap

    public class LocalTimeJavaDescriptor extends AbstractTypeDescriptor<LocalTime> {

        @Override
        @SuppressWarnings("unchecked")
        public <X> X unwrap(LocalTime value, Class<X> type, WrapperOptions options) {
            if (value == null) {
                return null;
            } else if (LocalTime.class.isAssignableFrom(type)) {
                return value;
            } else if (Time.class.isAssignableFrom(type)) { // 변경전
                return Time.valueOf(value);
            } else {
                // ...
            }
        }
    }

### TO BE

LocalTimeJavaType.unwrap

    public class LocalTimeJavaType extends AbstractTemporalJavaType<LocalTime> {

        @Override
        @SuppressWarnings("unchecked")
        public <X> X unwrap(LocalTime value, Class<X> type, WrapperOptions options) {
            // ...

            if (Time.class.isAssignableFrom(type)) {
                final Time time = Time.valueOf(value);
                if (value.getNano() == 0) {
                    return (X) time;
                }
                // 변경후
                return (X) new Time(time.getTime() + DateTimeUtils.roundToPrecision(value.getNano(), 3) / 1000000);
            }
        }
    }

### 2. 조회 과정에서 음수의 나노초가 발생하는 이유

나노초 유무와는 별개로, DB에는 정상적인 양수의 나노초가 저장되었는데, 조회할 때는 음수의 나노초가 발생하고 있었습니다. 이를 확인하기 위해, 하이버네이트가 DB에서 조회한 데이터를 LocalTime 타입으로 변환하는 LocalTimeJavaType.wrap 메서드를 분석했습니다. 해당 메서드에는 수정이 없었지만, 정상 범위의 나노초 값을 LocalTime으로 변환하는 과정에서 ms 계산 결과 음수 값이 나오는 현상을 확인했습니다.

## 현상 정의

문제를 분석한 결과, 이번 장애의 현상은 다음과 같이 정의할 수 있었습니다.
> LocalTime 필드를 가진 Entity를 조회할 때 PostgreSQL DB에 저장된 TIME 타입 컬럼을 자바의 LocalTime으로 변환하는 과정에서, 나노초 값이 음수로 처리되어 java.time.DateTimeException: Invalid value for NanoOfSecond 오류가 발생

### 재현 조건

해당 에러가 발생하는 조건을 테스트한 결과, 아래와 같은 상황에서 동일한 증상이 나타났습니다.

1. 타임존 설정
   * KST TimeZone: DateTimeException 에러 발생 (UTC+ 시간대를 사용하는 타임존은 모두 영향을 받을 것으로 추정)
   * UTC TimeZone: 에러 발생 X
2. 특정 시간대 (KST 기준)
   * 0 \~ 8시: DateTimeException 에러 발생
   * 9 \~ 23시: 에러 발생 X
3. 나노초 여부
   * 나노초 있음: DateTimeException 에러 발생
   * 나노초 없음: 에러 발생 X
4. 나노초의 소수점 자릿수
   * 소수점 3자리 존재: DateTimeException 에러 발생
   * 소수점 4자리 이상 존재: 에러 발생 X (단, 소수점 4번째 자리가 5 이상인 경우 반올림되어 예외 발생)

## 원인 분석

현상을 정의하면서, 문제의 원인이 하이버네이트 라이브러리에 있음을 확인했습니다. 이에 따라 DB에 데이터를 쓰고 읽는 과정을 좀 더 세부적으로 분석했습니다.

배포된 스프링부트 버전에 따라 사용된 하이버네이트 버전은 아래와 같습니다.

* 스프링 부트 버전: 2.6.4 ➡️ 3.2.4
* 하이버네이트 버전: 5.6.5 ➡️ 6.5.5

### ✅ (저장) Entity ➡️ DB

* LocalTime을 Time 객체로 변환하는 로직이 변경
  * 하이버네이트 5.6.5 버전: 밀리초(ms) 값을 버리고(=0 고정) Time 객체를 생성
  * 하이버네이트 6.5.5 버전: LocalTime의 나노초에서 밀리초(소수점 3자리)를 추출해 Time 객체의 밀리초 값에 반영 (즉, ms 값이 0이 아님)
* DB에 저장할 때는 변환된 밀리초 값이 정상적으로 반영되어, 실제 밀리초와 동일한 양수 값으로 저장

![하이버네이트 localTime 필드 db 저장 로직](https://helloworld.kurly.com/_astro/hibernate_load_db_logic_for_local_time.CtLUlANq_ZInLzI.webp)

### 🧐 (저장) Entity ➡️ DB 상세 과정

LocalTime 타입을 DB에 저장할 때는 TimeJdbcType.getBinder 메서드를 호출 이 내부에서 TemporalJavaType.unwrap 메서드를 호출하여 Time 객체로 변환
> TimeJdbcType.doBind ➡️ LocalTimeJavaType.unwrap ➡️ new Time(time.getTime() + DateTimeUtils.roundToPrecision( value.getNano(), 3 ) / 1000000)

![하이버네이트 unwrap 메서드 코드](https://helloworld.kurly.com/_astro/hibernate_unwrap_method.C4Hyoni1_2hLbs0.webp)

![하이버네이트 getBinder 메서드 코드](https://helloworld.kurly.com/_astro/hibernate_get_binder_method.Dqbv4bkZ_ZbaSyv.webp)
> HikariProxyPreparedStatement.setTime ➡️ PreparedStatementSpy.setTime(index, time)

![HikariProxyPreparedStatement setTime 메서드 코드](https://helloworld.kurly.com/_astro/HikariProxyPreparedStatement_setTime_method.XEW_IrOW_ZW2LOD.webp)

![PreparedStatementSpy setTime 메서드 코드](https://helloworld.kurly.com/_astro/PreparedStatementSpy_setTime_method.QKpVmR-S_Z1BjyoI.webp)

DB에 저장할 떄는 RdbmsSpecifics.formatParameterObject 메서드를 호출하여 (DML 쿼리를 위한) 문자열로 변경하여 new SimpleDateFormat(dateFormat).format(object) 를 호출하여 MM/dd/yyyy HH:mm:ss.SSS 문자열 포맷으로 파싱하여 저장한다. 이때 object로 들어가는 값은 LocalTimeJavaType.unwrap으로 생성한 Time 이다.

실제로 저장하려고했던 LocalTime은 08:32:00.943476 으로 ms 까지 정상적으로 반영된다. (4번째 자리 반올림)

![실제로 저장한 localTime 타입 값](https://helloworld.kurly.com/_astro/real_save_time.BNosx5Mf_2fsmA5.webp)

### ❌ (조회) DB ➡️ Entity

* LocalTime을 Time 객체로 변환하는 로직이 변경
  * 하이버네이트 5.6.5 버전: 밀리초(ms) 값을 버리고(=0 고정) Time 객체를 생성
  * 하이버네이트 6.5.5 버전: LocalTime의 나노초에서 밀리초(소수점 3자리)를 추출해 Time 객체의 밀리초 값에 반영 (즉, ms 값이 0이 아님)
* DB에 저장할 때는 변환된 밀리초 값이 정상적으로 반영되어, 실제 밀리초와 동일한 양수 값으로 저장

![PreparedStatementSpy setTime 메서드 코드](https://helloworld.kurly.com/_astro/hibernate_load_db_logic_for_local_time.CtLUlANq_ZInLzI.webp)

### 🧐 (조회) DB ➡️ Entity 상세 과정

DB에 저장된 데이터를 읽어오는 경우, TimeJdbcType.doExtract 메서드가 호출되고, 이어서 LocalTimeJavaType.wrap을 통해 LocalTime으로 변환됩니다.

![TimeJdbcType getExtractor 메서드 코드](https://helloworld.kurly.com/_astro/TimeJdbcType_getExtractor_method.BEkE03KC_Z24HpQJ.webp)

![LocalTimeJavaType wrap 메서드 코드](https://helloworld.kurly.com/_astro/LocalTimeJavaType_wrap_method.B8dZezYS_7wmrO.webp)

Time 객체는 unwrap할 때와 동일한 값을 가진 Time 객체가 생성됩니다. 그러나 밀리초(ms)를 구하는 로직에 문제가 있어 음수 값이 발생하게 됩니다.

LocalTime은 날짜 정보(년, 월, 일)를 포함하지 않지만, 시간 계산을 위해 날짜 정보가 필요합니다. 따라서 기본 날짜(epoch time 또는 유닉스 시간인 1970년 1월 1일 00:00:00 UTC)를 임의로 지정하게 됩니다. KST 타임존의 경우, UTC 기준을 맞추기 위해 9시간을 빼야 하며, 이 과정에서 epoch time이 음수로 도출됩니다. (위에서 언급한 유닉스 시간의 경우 0)

LocalTime을 Time으로 변환하여 DB에 저장할 때는 문제가 없지만, Time을 LocalTime으로 변환하는 과정에서 0시에서 (UTC와 KST의 시간 차이 - 1) 시까지의 경우 fastTime(Time 객체의 상태값)이 음수가 됩니다. 이때 ms는 이 값을 1,000으로 나눈 나머지로 계산되므로 음수 ms가 발생하게 됩니다.

## 해결 방법

해당 버그는 **[수정](https://github.com/hibernate/hibernate-orm/pull/8322/files)**된 것으로 보이지만, 아직 릴리즈되지 않은 상태입니다.(블로그 작성시점 24년10월11일 기준) 추후 버그 수정 버전이 릴리즈되면 하이버네이트 버전 업그레이드를 진행할 예정입니다. 그동안 LocalTime 객체를 저장하거나 조회할 때 나노초를 제거하는 Converter를 구현하여, 문제의 컬럼에 @Converter 설정을 적용하기로 하였습니다. 저장하거나 조회할 때 나노초가 저장되지 않도록 하는 임시 조치를 통해 이후 동일한 현상은 발생하지 않았습니다.

#### Converter 예시

    // 조회, 저장시 nano seconds를 제거하는 Converter
    @Converter
    class LocalTimeConverter: AttributeConverter<LocalTime, LocalTime> {
        override fun convertToDatabaseColumn(attribute: LocalTime?): LocalTime? {
            return attribute?.truncatedTo(ChronoUnit.SECONDS)
        }
        override fun convertToEntityAttribute(dbData: LocalTime?): LocalTime? =
            dbData?.truncatedTo(ChronoUnit.SECONDS)
    }

    // converter 설정 적용
    @Entity
    class AnyEntity(
        @Column(name = "any_time")
        @Convert(converter = LocalTimeConverter::class)
        val anyTime: LocalTime? = null,
    )

## 느낀 점

버그 분석 과정에서 아쉬웠던 점은 사전에 해당 버그를 감지하지 못했다는 것입니다. 인수 테스트와 통합 테스트가 있었다면 스프링 부트 버전 업그레이드와 같은 큰 변경 사항에 대해 전반적으로 테스트할 수 있었고, 아마도 이번 에러는 개발 과정에서 조기에 발견되었을 것이라는 아쉬움이 남았습니다. 다음에는 이러한 큰 변경을 사전에 감지할 수 있도록 인수 테스트와 통합 테스트를 작성해야겠다고 생각했습니다.

디버깅할 때 무턱대고 시작하는 경향이 있었으나, 이번에는 가설을 세우고 검증하는 과정을 통해 문제를 명확히 정의하고 원인을 파악하는 데 도움이 되었습니다. 앞으로는 큰 그림을 세우고 디버깅을 시작하는 습관을 들이겠다고 결심했습니다.