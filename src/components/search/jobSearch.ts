import type { Job } from '../../shared/types'
import { formatPostDate } from '../../shared/utils/formatDate'
import { filterJobsByQuery, selectOpenJobs } from '../../shared/utils/jobFilters'

export interface JobSearchResult {
  url: string
  title: string
  /** '토스뱅크 · Backend · 경력 · 9월 29일 마감' */
  meta: string
}

/**
 * 검색 모달에 띄울 공고. 받아 둔 목록은 빌드 시점 것이라 마감이 지난 공고를 한 번 더 거른다.
 * 본문이 없으니 발췌 대신 회사·직군·마감을 한 줄로 붙인다.
 */
export function searchJobs(jobs: Job[], query: string, now: Date, maxResults: number): JobSearchResult[] {
  return filterJobsByQuery(selectOpenJobs(jobs, now), query)
    .slice(0, maxResults)
    .map((job) => ({
      url: `/jobs/${job.id}`,
      title: job.title,
      meta: [job.company, job.jobGroup, job.career, job.deadline ? `${formatPostDate(job.deadline)} 마감` : '상시 채용']
        .filter(Boolean)
        .join(' · '),
    }))
}
