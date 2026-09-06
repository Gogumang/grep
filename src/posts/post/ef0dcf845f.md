### 사내 DB 관리 규정을 AI로 적용하다 : Amazon Bedrock 기반 DBA 리뷰봇 개발기

![](https://cdn-images-1.medium.com/max/1024/1*1XmQ86I4O81_2iFTP6JaSQ.png)

DDL 관리는 어떻게 하고 계신가요?

마이크로서비스 환경에서 DB 스키마 변경은 빈번하게 발생합니다.
문제는 단일 DDL이 아니라, 여러 DDL이 한 요청에 섞여 들어오거나 CDC·Replication과 같은 복제 구조가 함께 고려되어야 하는 복잡도가 높은 작업에서 발생합니다. 이러한 요청을 리뷰하는 DBA의 부담은 요청 수와 복잡도에 비례해 빠르게 커집니다.

요기요에서는 이러한 스키마 변경을 내부 관리 포털인 DBportal(요기요의 DDL 관리 및 배포 시스템)을 통해 처리하고 있습니다.
개발팀이 DBportal에 DDL과 적용 일정을 등록하면, DBA 리뷰와 승인 과정을 거쳐 지정된 시점에 자동으로 배포가 이루어지는 구조입니다.
이때 DBA 리뷰는 자동 배포 이전에 서비스 안정성을 확보하기 위한 가장 중요한 단계입니다.

기존에는 이 리뷰 과정이 전적으로 DBA의 수동 판단에 의존하고 있었습니다.
사내 DB 관리 규정을 기준으로 ddl이 올바르게 요청되었는지, CDC 대상 여부, 복제 구조, 변경 방식의 적합성 등을 요청마다 직접 확인해야 했고, 요청이 몰리는 상황에서는 판단 누락이 발생할 여지도 있었습니다.
![](https://cdn-images-1.medium.com/max/1024/1*jYpNYPEptfMTV6FbT8uN7g.png)그림1. 기존 요기요 DDL 배포 프로세스

이를 개선하기 위해 요기요 DBA팀은 사내 DB 관리 규정을 기반으로
DDL 요청을 1차적으로 정리·검토해 주는 DBA 리뷰봇을 도입했습니다.
이러한 구조에서 DBA 리뷰봇을 도입한 이후, 리뷰 과정에서는 다음과 같은 변화가 나타났습니다.

* 다양한 DDL 요청을 리뷰봇이 1차적으로 분석하면서,
  DBA가 반드시 확인해야 하는 크리티컬한 사항(CDC/Replication 대상, 위험한 ALTER 등)을 사전에 식별해 주어 리뷰 부담이 줄어들었습니다.
  DBA는 반복적인 규정 확인 대신, 정말 중요한 판단에 더 집중할 수 있게 되었고 개발자 역시 요청 단계에서 작업의 위험도를 인지할 수 있게 되었습니다.
* DDL 요청이 규정에 맞지 않거나 보완이 필요한 경우,
  기존처럼 DBA와 개발자 간에 여러 차례 의견을 주고받는 과정이 줄어들었습니다. 리뷰봇이 규칙 위반 사유와 권장 방향을 함께 제시함으로써, 커뮤니케이션 비용이 눈에 띄게 감소했습니다.
* Slack 챗봇 형태로 제공되면서,
  사내 DB 관리 규칙을 확인하기 위해 별도로 Wiki 문서를 찾아보지 않아도
  필요한 시점에 바로 질의하고 답변을 받을 수 있게 되었습니다.

이러한 변화로 인해, **DDL 요청부터 리뷰 완료까지의 전체 처리 속도는
기존 대비 약 20% 정도 개선**되는 효과를 확인할 수 있었습니다.
![](https://cdn-images-1.medium.com/max/1024/1*kN-zq1vpqTA72LoXts-vmg.png)그림2. Bedrock 을 활용한 DBA-review ai bot이 도입된후 변경된 프로세스

이 글에서는 이러한 변화를 만들어낸 DBA 리뷰봇의 설계 배경과,
Amazon Bedrock Knowledge Base와 Agent를 활용해 구현한 기술적 선택들을 소개합니다.

#### DBA 리뷰봇 프로젝트 소개

요기요 DBA팀은 **사내 DB 스키마 변경 리뷰 과정을 보다 일관되고 효율적으로 수행하기 위해**, AI 기반의 DBA 리뷰봇을 개발했습니다.

개발팀으로부터 들어오는 다양한 DDL 요청은 단순한 SQL 하나로 끝나지 않습니다. 여러 DDL 변경이 한 요청 안에 섞여 들어오거나, CDC·Replication 같은 복제 구조와 관련된 테이블들이 포함되는 경우가 많습니다. 이때 사내 DB 관리 규정에 따라 잠재적인 리스크를 검토하는 과정은 반복적이고 부담이 큰 작업입니다.

리뷰봇은 이러한 반복적인 판단을 1차적으로 보조하기 위해 만들어졌습니다. 입력된 DDL 요청을 기반으로 다음과 같은 정보를 자동으로 정리해줍니다.

* 사내 DB 관리 규정과의 적합성 판단 및 규정을 준수하는 적합한 쿼리 제공
* 추가 확인 작업이 필요한 위험도가 높은 작업 판별
* 복제 대상(CDC, REPLICATION) 테이블 식별

1. 리뷰봇 활용 case 1

```
##신청 ddl 예시
create table t3(id bigserial);
alter table t2 alter column abc type varchar(10);
```

![](https://cdn-images-1.medium.com/max/656/1*Joj5dYz-Qik1md966YAzmw.png)그림3. review bot 활용사례:
추가 확인이 필요한 작업(alter column) 판별 및
cdc대상 테이블 식별

2. 리뷰봇 활용 case 2

```
##신청 ddl
CREATE TABLE test1 (
.
<생략>
.
.
);
CREATE INDEX CONCURRENTLY ix_test1_diff_saved ON entity_change_history (diff_saved);
CREATE INDEX CONCURRENTLY ix_test1_created_at ON entity_change_history (created_at);
CREATE INDEX CONCURRENTLY ix_test1_updated_at ON entity_change_history (updated_at);
ALTER TABLE test12 ADD COLUMN created_by VARCHAR(50);
```

![](https://cdn-images-1.medium.com/max/938/1*Xo8UJsXRfynHwYnLnJaRpQ.png)그림4. review bot 활용사례:
ddl 리뷰 특이사항 없음

또한 DBA-리뷰봇은 DDL신청에 대한 리뷰 기능뿐만 아니라, 요기요의 공식 업무용 메신저인 Slack에 챗봇 형태로 배포되어 활용되고 있습니다.

이를 통해 개발자와 DBA는 별도의 페이지로 이동하지 않고도, 필요한 시점에 바로 리뷰봇을 호출할 수 있습니다.

예를 들어 DDL 요청을 준비하면서 참고해야 할 **사내 DB 관리 규정이나 가이드가 필요한 경우**, 기존처럼 Wiki 문서를 직접 찾아보지 않아도 Slack에서 리뷰봇에게 질문하고 관련 정보를 바로 확인할 수 있습니다. 또한 DDL 리뷰 결과 역시 Slack 대화를 통해 빠르게 공유할 수 있어, 커뮤니케이션 비용을 줄이는 데에도 도움이 됩니다.

DBA-리뷰봇은 Amazon Bedrock의 Knowledge Base와 Agent 기능을 활용해 구현되었으며, 사내 규정 문서를 지식으로 활용해 DDL 요청과 질의에 대한 응답을 생성합니다. 리뷰봇은 DDL을 자동으로 승인하거나 실행하지 않으며, 어디까지나 DBA 리뷰의 앞단에서 동작하는 **보조 도구**로 설계되었습니다.

이를 통해 반복적인 리뷰 작업과 규정 확인에 소요되는 시간과 오류를 줄이고, DBA와 개발팀 모두가 보다 중요한 판단과 논의에 더욱 집중할 수 있을 것으로 기대됩니다.

#### Amazon Bedrock을 사용한 이유

DBA-리뷰봇은 사내 DB 관리 규정과 같은 내부 문서를 기반으로 동작하는 생성형 AI 애플리케이션입니다. 이를 구현하기 위해서는 문서 수집, 임베딩, 검색, 추론, 응답 생성까지의 전 과정을 고려해야 했습니다.

하지만 제한된 시간과 리소스 안에서, 이러한 파이프라인을 처음부터 직접 구현하고 운영하기에는 현실적인 부담이 컸습니다. 특히 모델 선택과 운영, 보안 설정, 인프라 관리까지 함께 고려해야 하는 상황에서, 개발 공수가 빠르게 증가할 수 있었습니다.

이러한 배경에서 저희팀은 Amazon Bedrock을 선택했습니다. Bedrock은 Knowledge Base와 Agent 기능을 통해, 내부 문서를 지식으로 활용하는 생성형 AI 애플리케이션을 비교적 적은 구현 비용으로 구성할 수 있는 환경을 제공합니다.

이를 통해 모델 운영이나 인프라 구성에 대한 부담을 줄이고, 리뷰봇의 핵심 로직과 실제 사용 시나리오에 집중할 수 있었으며, DBA 팀이 직접 모델 운영을 감당하지 않아도 된다는 점이 결정적이었습니다.

#### DBA-review bot 아키텍처

현재 DBA-리뷰봇에서 Amazon Bedrock Knowledge 및 Agent를 이용해 답변하는 아키텍처는 다음과 같습니다.
![](https://cdn-images-1.medium.com/max/1024/1*XztUfBb1kcGaN7S0Q6NukA.png)그림5. bedrock을 활용한 AI DBA-review bot 아키텍처

1. 사용자가 DBportal로 DDL 신청을 하거나, Slack에서 @dbadmin-bot 을 멘션하여 직접 질의를 던집니다.
2. DBportal을 통해 DDL신청이 완료되었으면, Slack으로 신청에 대한 스레드가 오픈되고, 신청된 ddl에 대하여 Bedrock Agent에게 리뷰요청을 진행합니다.
   슬랙으로 직접 유저가 리뷰봇을 호출하여 문의하였다면, 해당 이벤트가 api-gateway로 진입됩니다.
3. 슬랙에서 발생된 이벤트가 api-gateway와 연결된 람다코드로 전송됩니다.
4. 람다코드에서 이벤트처리를 진행합니다. 이때 Bedrock Agent를 호출하여 Slack에서 문의한 내용을 Agent로 전달합니다.
5. 에이전트가 전달받은 질의에 대하여 연결된 LLM(claude sonnet3.5)을 이용하여 자연어를 분석하고, 지식기반의 답변이 필요하다면 knowledge base 검색을 시도합니다.
6. Knowledge Base에서 해당 답변과 가장 관련성이 높은 정보를 Amazon OpenSearch vector store에서 조회하여 제공합니다.
7. Amazon OpenSearch vector store에는 정보들이 벡터화되어 저장되어 있으며, 질문과 관련도가 가장 높은 답변을 찾아 Knowledge Base에 전달하게 되고, Agent는 다시 Knowledge Base로 부터 받은 답변을 사용자에게 제공합니다.

#### Confluence API를 활용한 사내 Wiki 문서 동기화 전략

DBA-리뷰봇 프로젝트에서 가장 신경 썼던 부분 중 하나는, **리뷰의 근거가 되는 사내 Wiki 문서를 어떻게 최신 상태로 유지할 것인가**였습니다. 리뷰봇의 판단 품질은 결국 Knowledge Base에 저장된 규정 문서의 정확도와 최신성에 크게 의존하기 때문입니다.

Amazon Bedrock에서는 S3에 저장된 데이터를 기반으로 벡터 임베딩을 생성하고, 이를 Amazon OpenSearch Vector Store와 연동하는 기능을 서비스 형태로 제공합니다. 따라서 **S3에 최신 문서를 안정적으로 적재 및 업데이트 하는 것**이 전체 파이프라인의 핵심이었습니다.

문제는 사내 Wiki에 저장된 원본 문서가 언제, 어떤 내용으로 업데이트될지 예측하기 어렵다는 점이었습니다. 이를 해결하기 위해, Wiki 문서를 주기적으로 수집해 S3에 동기화하는 자동화 파이프라인을 구성했습니다.

구현 방식은 비교적 단순합니다.
Cron Job과 Confluence API를 활용해, Wiki에 저장된 문서들을 API로 주기적으로 조회하고 이를 S3에 저장하도록 구성했습니다. 해당 작업은 매일 오전 6시에 실행되도록 설정해, 새로운 문서나 변경 사항이 일정 주기로 반영되도록 관리했습니다.

S3 업데이트가 완료되면, Amazon Bedrock API를 호출해 **S3와 Vector Store 간의 동기화 및 재임베딩 작업**을 수행합니다. 이 과정을 통해 리뷰봇이 참조하는 Knowledge Base는 별도의 수동 개입 없이도 최신 상태를 유지할 수 있도록 설계했습니다.

이러한 구조를 통해 Wiki 문서 업데이트 → S3 반영 → Vector Store 갱신까지의 흐름을 자동화했고, DBA는 문서 동기화 상태를 별도로 관리하지 않아도 되는 환경을 만들 수 있었습니다.

```
def main():
    """
    Confluence Wiki → S3 적재 → Bedrock Knowledge Base 동기화(재임베딩)까지
    전체 파이프라인의 핵심 흐름만 요약한 예시 코드입니다.
    """
# 1) Confluence Wiki 문서 수집 (부모 페이지 기준 + 하위 페이지 포함)
    pages = get_confluence_pages_with_children(parent_page_id=PAGE_ID)
# 2) 문서 내용을 추출해 S3에 저장
    for page in pages:
        title = page["title"]
        content = download_page_content(page_id=page["id"])  # body.storage 등에서 텍스트 추출
        upload_to_s3(text=content, filename=f"{sanitize_title(title)}.txt")
# 3) S3 변경 사항을 Bedrock Knowledge Base에 반영 (Vector Store 갱신)
    start_knowledge_base_ingestion(
        knowledge_base_id=KB_ID,
        data_source_id=DATA_SOURCE_ID,
    )
# --- 아래는 구현 디테일을 숨긴 인터페이스(개념) 수준의 함수들입니다. ---
def get_confluence_pages_with_children(parent_page_id: str) -> list[dict]:
    """Confluence API로 부모/하위 페이지 목록을 수집해 반환"""
    raise NotImplementedError
def download_page_content(page_id: str) -> str:
    """Confluence 페이지의 본문을 내려받아 텍스트로 변환해 반환"""
    raise NotImplementedError
def upload_to_s3(text: str, filename: str) -> None:
    """정제된 텍스트를 S3 지정 경로로 업로드"""
    raise NotImplementedError
def start_knowledge_base_ingestion(knowledge_base_id: str, data_source_id: str) -> None:
    """Bedrock Knowledge Base ingestion job을 실행해 재임베딩/동기화를 트리거"""
    raise NotImplementedError
def sanitize_title(title: str) -> str:
    """S3 객체 키로 안전한 파일명 생성"""
    return "".join(c for c in title if c.isalnum() or c in (" ", "-", "_")).strip()
```

> ##코드1.- wiki s3 upload \& Knowledge Base를 동기화하는 python 코드
> *Confluence Wiki 문서를 주기적으로 수집해 S3에 저장한 뒤,
> Amazon Bedrock Knowledge Base의 ingestion job을 호출해 벡터 스토어를 갱신합니다.*

#### Knowledge Base 구성 방식

사내 Wiki 문서를 Knowledge Base에 그대로 적재하는 것만으로는, DDL 리뷰에 필요한 수준의 판단을 기대하기 어려웠습니다.
문서의 구조와 표현 방식이 제각각이기 때문에, **리뷰봇이 어떤 규정을 언제 참고해야 하는지**를 명확히 하기 어렵기 때문입니다.

요기요 DBA팀은 Knowledge Base를 단순한 문서 저장소가 아니라, **DDL 리뷰를 위한 판단 근거 집합**으로 활용하기 위해 문서 구조화에 집중했습니다. 이를 위해 사내 Wiki 문서를 다음과 같은 기준으로 전처리했습니다.

먼저, 규정 문서를 **DDL작업 단위로 분리**했습니다. 하나의 방대한 내용을 담고있는 문서를 그대로 임베딩하지 않고, DDL 작업유형별로 내용을 나누어 저장했습니다. 예를 들어 CREATE TABLE 규칙, Alter 규칙, Drop 규칙, 인덱스 관련 규칙등을 각각 독립적인 단위로 분리했습니다.

그리고, 규정 문서뿐만 아니라 **올바른 DDL 예시와 잘못된 DDL 예시를 함께 Knowledge Base에 저장** 했습니다. 실제 운영 과정에서 자주 등장하는 요청 패턴을 기준으로, 규정에 부합하는 예시와 그렇지 않은 예시를 함께 정리해 지식으로 활용했습니다. 이를 통해 리뷰봇은 단순히 "규정 문장을 인용하는 역할"을 넘어, **입력된 DDL과 유사한 사례를 기준으로 판단 근거를 제시**할 수 있게 되었습니다.

이러한 구성 덕분에 리뷰봇은 다양한 형태의 DDL 요청에 대해 보다 폭넓은 검색이 가능해졌고, 결과적으로 **리뷰 응답의 정확성과 일관성**을 함께 개선할 수 있었습니다. 전처리된 문서들은 S3에 저장되고, Amazon Bedrock Knowledge Base 기능을 통해 벡터화되어 관리됩니다. 리뷰봇은 DDL 요청을 입력으로 받아, 관련성이 높은 규정과 예시를 함께 조회하고 이를 기반으로 1차 리뷰 결과를 생성합니다.

이 구조를 통해 Knowledge Base는 단순한 규정 검색 용도가 아니라, **DDL 리뷰에 필요한 맥락과 사례를 함께 제공하는 판단 보조 도구**로 활용될 수 있었습니다.

#### Agent 설계와 프롬프트 전략

DBA-리뷰봇에서 Agent의 역할은 단순히 Knowledge Base를 조회하는 것이 아니라, **DDL 요청을 리뷰 관점에서 해석하고 판단 근거를 정리해 주는 것**입니다. 이를 위해 Agent는 "정답을 생성하는 역할"이 아니라, "DBA 리뷰를 보조하는 조정자(coordinator)"로 설계했습니다.
![](https://cdn-images-1.medium.com/max/1024/1*oUoXqghar3aeJGJttQsqYw.png)그림6.-Bedrock Agent 고급 프롬프트를 활용한 프롬프트 엔지니어링***Agent 지침 설계: 최소한의 역할 정의***

Agent 지침(instruction)은 의도적으로 최소화했습니다.
Agent에게 많은 규칙을 주입하기보다는, **역할과 책임의 경계만 명확히 정의** 하는 방향을 선택했습니다.
이를 통해 Agent가 과도한 판단이나 불필요한 추론을 하지 않도록 제어하고, **행동 범위를 명확히 제한**했습니다.

요기요의 DBA-review bot이 현재 사용중인 에이전트 지침입니다.

```
당신은 "DBA-bot"입니다.
"요기요(yogiyo)" 회사의 Database 관련하여, ddl작업과 관련된 전문적인 봇입니다.
당신의 주요 목표는 사내 DB규정을 참조하여, 개발자들이 요청한 ddl 쿼리에 대해서 옳바르게 신청하였는지 리뷰하고, db관련 정책이나 규칙, 기준등에 대해 질문을 받았을때 옳바르게 답변해야합니다.
당신은 숙련된 dba 리뷰 봇으로써 다음 내용들을 꼭 숙지하고있어야 합니다.
.
.
**ONLY RULE: Knowledge Base 검색 → 출력 형식을 변경하지 않는다**
**CRITICAL 금지사항:**
- KB 응답에 추가 분석, 해석, 설명 금지
- KB 응답 형식 변경 금지
- 개인적 판단이나 추론 금지
- 일반적인 데이터베이스 지식 사용 금지
- KB 응답을 재작성, 재구성, 요약 금지
.
.
```

> ***고급 프롬프트 설계: Knowledge Base 응답 템플릿 중심***

실제 리뷰 품질을 좌우하는 부분은 Agent 지침보다, **Knowledge Base 검색 결과를 어떻게 해석하고 출력할 것인가**였습니다. 이를 위해 고급 프롬프트에서는 KB 응답을 구조화하는 템플릿 설계에 집중했습니다.

**1. "KB에 없는 내용은 말하지 않는다"는 강한 제약**

DDL 리뷰에서 가장 위험한 것은 그럴듯한 추측입니다. 이를 방지하기 위해 프롬프트 단계에서부터 **지식 범위를 KB로 강제**했습니다.

**2. 질의 유형을 명확히 분리하는 Detection Logic**

DDL 리뷰, 규정 질의, CDC 확인 요청은 **겉보기에는 비슷하지만 완전히 다른 문제** 입니다. 이를 구분하지 않으면 응답 품질이 급격히 흔들리기 때문에, 프롬프트에 **명시적인 분기 로직**을 포함시켰습니다. 이 분류는 이후 응답 형식과 판단 기준을 결정하는 핵심 역할을 합니다.

* 리뷰 요청인지
* 실제 DDL이 포함되었는지
* CDC/Replication 대상 확인인지

**3. risky한 작업은 절대 놓치지 않는 보수적 설계**

DROP, 서비스 영향 가능성이 높은 ALTER 작업, DBA확인필요 키워드는
다른 조건보다 항상 우선 검색하도록 설계했습니다.이를 통해 **작업의 위험성을 개발자와 DBA 모두가 사전에 인지할 수 있도록 하고** ,
**보다 세부적인 리뷰가 필요한 작업에 자연스럽게 집중할 수 있도록 유도했습니다.**

**4. 응답 형식을 고정해 리뷰 효율을 높임**

응답은 항상 동일한 구조로 반환되도록 제한했습니다.

* DBA가 Slack에서 바로 읽을 수 있는 형식
* 중요한 부분만 빠르게 스캔 가능
* 요청마다 응답 스타일이 달라지지 않음

이는 리뷰 누락을 줄이고, 가독성을 높이는 데 큰 역할을 했습니다.

요기요의 DBA-review bot이 현재 사용중인 KB응답 지침입니다.

```
You are a response formatter for DBA-bot.
Format all responses in plain Korean text optimized for Slack readability.

<search_results>
$search_results$
</search_results>

<user_query>
$query$
</user_query>

CRITICAL:
- KB에 없는 내용은 절대 언급하지 않음
- 추측, 일반론, 경험 기반 판단 금지

DETECTION LOGIC:
1. 리뷰/검증 관련 키워드 확인
2. DDL 구문 포함 여부 확인
3. CDC / Replication 관련 키워드 확인

RESPONSE FORMAT RULES:
- 항상 동일한 구조로 응답
- JSON 금지
- Slack 가독성을 고려한 이모지 및 불릿 포인트 사용

RESPONSE FORMAT:

[Type 1A]
DBA 승인 필요

리뷰 결과:
DBA확인필요

[Type 1B]
DDL 검증 결과

리뷰 결과:
특이사항 없음 / 확인 필요

위반사항 (확인 필요 시에만):
• KB 검색 결과에 명시된 규칙 위반 항목

권장사항 (위반사항이 있을 경우):
• 규칙을 만족하는 형태의 DDL 쿼리만 제시
```

#### 결과 및 향후 개선 방향

DBA-리뷰봇은 기존 DDL 승인 및 자동 실행 프로세스를 변경하지 않은 상태에서, **리뷰 단계의 앞단에 1차 분석 도구로 추가**되어 운영 환경에 적용되었습니다. 이를 통해 실행 안정성은 유지하면서, 반복적인 규정 확인과 판단 정리로 인한 부담을 줄이는 데 기여했습니다.

운영 적용 이후에는 개발팀이 DDL 요청 전에 리뷰봇을 통해 사내 규정과 주의사항을 미리 확인하는 흐름이 자리 잡았고, 이로 인해 정보가 부족하거나 규정에 맞지 않는 요청이 초기 단계에서 감소했습니다. DBA 입장에서도 리뷰봇이 정리해 주는 1차 분석 결과를 통해 **관련 규정, 집중 확인 포인트, 추가 확인 필요 항목**을 빠르게 파악할 수 있어, 반복적인 검토 작업을 줄이고 복합적이거나 예외적인 케이스에 보다 집중할 수 있게 되었습니다. 또한 Slack 챗봇 형태로 제공되면서, DDL 검토 외에도 규정 질의 응답 등 다양한 상황에서 자연스럽게 활용되고 있습니다.

한편 현재 리뷰봇은 사내 규정과 예시를 Knowledge Base로 활용한 **문서 기반 1차 리뷰 도구** 로, 테이블 크기나 인덱스 구성과 같이 DB 접속을 통해서만 확인 가능한 정보는 직접 판단할 수 없다는 한계가 있습니다. 향후에는 MCP(Model Context Protocol) 기반의 안전한 연동을 통해 제한된 범위의 메타데이터 조회를 추가하고, 단일 Agent 구조를 **역할이 분리된 멀티 에이전트 협업 구조**로 고도화하여 리뷰 정확도와 일관성을 높이는 방향을 검토하고 있습니다. DBA-리뷰봇은 운영 경험과 데이터가 쌓일수록 점진적으로 고도화되는 도구를 목표로 발전시켜 나갈 계획입니다.

#### 마치며

DDL 리뷰는 DBA라면 누구나 익숙하지만, 동시에 늘 긴장을 요구하는 작업입니다.
요청이 많아질수록, 그리고 변경이 복합적일수록 그 부담은 더 커집니다.

요기요 DBA팀은 이 문제를 "더 꼼꼼해져야 한다"가 아니라,
"판단 과정을 어떻게 더 잘 보조할 수 있을까"라는 질문으로 접근했습니다.
DBA-리뷰봇은 그 고민의 결과물로, 단순히 DDL을 검토하는 도구가 아니라
DBA가 암묵적으로 해오던 판단 기준을 명시적으로 구조화한 시도였습니다.

그 결과, DDL 요청부터 리뷰 완료까지의 전체 흐름에서
불필요한 반복 작업과 커뮤니케이션이 줄어들었고,
실제 운영 기준으로 약 20% 수준의 처리 속도 개선을 확인할 수 있었습니다.

이 글이 비슷한 고민을 하고 있는 다른 DBA나 플랫폼 엔지니어분들께,
하나의 접근 방식으로 참고가 되기를 바랍니다.
![](https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=f845508e6055)

*** ** * ** ***

[사내 DB 관리 규정을 AI로 적용하다 : Amazon Bedrock 기반 DBA 리뷰봇 개발기](https://techblog.yogiyo.co.kr/%EC%82%AC%EB%82%B4-db-%EA%B4%80%EB%A6%AC-%EA%B7%9C%EC%A0%95%EC%9D%84-ai%EB%A1%9C-%EC%A0%81%EC%9A%A9%ED%95%98%EB%8B%A4-amazon-bedrock-%EA%B8%B0%EB%B0%98-dba-%EB%A6%AC%EB%B7%B0%EB%B4%87-%EA%B0%9C%EB%B0%9C%EA%B8%B0-f845508e6055) was originally published in [YOGIYO Tech Blog - 요기요 기술블로그](https://techblog.yogiyo.co.kr) on Medium, where people are continuing the conversation by highlighting and responding to this story.