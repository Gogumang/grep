![NHN클라우드 Meetup!-DataFlow 서비스 소개_섬네일_230117.jpg](https://images.gogumang.com/9bb5f0aeab/01.jpg)

DataFlow는 Drag \& Drop과 간편한 설정으로 손쉽게 ETL 플로우를 생성할 수 있는 서비스입니다. 입력 메시지에 대해 간단한 변형 작업을 수행할 수 있는 암호화 필터, 파싱 필터 등을 제공합니다.

## 주요 기능

* 입력 데이터 소스로부터 인입된 데이터를 필터를 통해 변형하여 목적 데이터 소스로 데이터를 전달하는 플로우를 생성할 수 있습니다.
* Drag \& Drop과 간편한 설정을 통해 플로우의 로직을 손쉽게 작성할 수 있습니다.
* 다양한 데이터 소스와의 손쉬운 연동을 지원합니다.
  * 입력 데이터 소스
    * NHN Cloud Log \& Crash Search
    * NHN Cloud CloudTrail
    * NHN Cloud Object Storage, Kafka, S3 외(예정)
  * 목적 데이터 소스
    * NHN Cloud Object Storage
    * Apache Kafka
    * Amazon S3
    * MongoDB, Elasticsearch 외 (예정)
* 스케줄링 기능을 통해 특정 시간에 플로우를 예약 실행하는 기능을 지원합니다.
  * 추후 주기적인 플로우 동작과 같은 다양한 기능을 추가할 예정입니다.
* 모니터링을 통해 플로우가 사용하는 리소스와 처리 중인 데이터의 양을 확인할 수 있습니다.

![img_dataflow.png](https://images.gogumang.com/9bb5f0aeab/02.png)

## 서비스 대상

* Log \& Crash Search, CloudTrail의 데이터를 OBS에 원하는 형태로 데이터를 적재하고 싶은 경우
* 여러 데이터 소스로부터 다른 데이터 소스로 N:M 취합하는 경우
* 준실시간으로 생성되는 데이터를 OBS에 백업해야 하는 경우

## 마치며

보다 자세한 내용은 [서비스 소개](https://www.nhncloud.com/kr/service/data-analytics/dataflow) 및 [사용자 설명서](https://docs.nhncloud.com/ko/Data%20&%20Analytics/DataFlow/ko/overview/)를 참고해 주세요.