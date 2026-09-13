/**
 * 채용 공고 하나. 본문은 싣지 않는다 — 제목과 원문 주소만 두고 지원은 원문에서 한다.
 * scripts/fetchJobs.ts가 만들어 src/jobs/jobs.json에 쓴다.
 */
export interface Job {
  /** 원문 주소의 해시. React key다. */
  id: string
  /** src/jobs/config/companies.md의 '회사 이름'. 한 소스에서 온 공고를 묶는 이름이다. */
  group: string
  /** 공고를 낸 회사. 계열사 공고면 계열사 이름이다(예: 카카오페이). */
  company: string
  title: string
  url: string
  /** 원문이 매긴 직군. 없으면 null. */
  jobGroup: string | null
  /** 신입·경력 구분. 원문이 밝히지 않으면 null. */
  career: string | null
  /** 지원 마감 시각(ISO-8601). 상시 채용이면 null. */
  deadline: string | null
  /** 게시 시각(ISO-8601). 원문이 주지 않으면 null. */
  postedAt: string | null
}

export interface JobsSnapshot {
  /** 공고 목록이 마지막으로 바뀐 시각. 수집만 하고 바뀐 게 없으면 그대로 둔다 — 매일 빈 커밋이 쌓이지 않게. */
  updatedAt: string | null
  jobs: Job[]
}
