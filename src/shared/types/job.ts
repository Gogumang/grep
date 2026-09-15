/**
 * 채용 공고 하나. collector(grep-airflow)가 사람이 어드민에서 검토해 올린 공고만 src/jobs/jobs.json 에 쓴다.
 * 공고 본문은 src/jobs/body/{id}.md 에 따로 있다(목록 화면이 본문을 읽지 않게).
 *
 * 필드 이름은 collector 의 JobSiteJsonWriter 와의 계약이다 — 한쪽을 바꾸면 다른 쪽도 함께 고친다.
 */
export interface Job {
  /** 원문 주소의 해시(12자). 공고 페이지 주소(/jobs/{id})이자 React key다. */
  id: string
  /** 수집 대상 회사(collector job_source.company_key). 계열사 공고도 모회사 키로 묶인다. */
  companyKey: string
  /** 공고를 낸 회사. 계열사 공고면 계열사 이름이다(예: 카카오페이). */
  company: string
  title: string
  url: string
  /** 원문이 매긴 직군. 없으면 null. */
  jobGroup: string | null
  /** 신입·경력 구분. 원문이 밝히지 않으면 null. */
  career: string | null
  location: string | null
  /** 정규직·계약직·인턴 등. */
  employmentType: string | null
  /** 지원 마감 시각(ISO-8601). 상시 채용이면 null. */
  deadline: string | null
  /** 게시 시각(ISO-8601). 원문이 주지 않으면 null. */
  postedAt: string | null
}

export interface JobsSnapshot {
  /** collector 가 목록을 마지막으로 반영한 시각. 아직 한 번도 올린 공고가 없으면 null. */
  updatedAt: string | null
  jobs: Job[]
}
