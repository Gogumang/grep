import { countBy } from 'es-toolkit'
import type { Job } from '../types'

export interface CompanyFacet {
  company: string
  count: number
}

/** 마감이 지난 공고를 뺀다. 마감이 없는 공고는 상시 채용이라 남긴다. */
export function selectOpenJobs(jobs: Job[], now: Date = new Date()): Job[] {
  return jobs.filter((job) => job.deadline === null || new Date(job.deadline).getTime() > now.getTime())
}

/**
 * 공백으로 나눈 낱말이 모두 들어 있는 공고만 남긴다 — '토스 백엔드'가 토스의 백엔드 공고만 남기게.
 * 목록에는 본문이 없으니 제목·회사·직군·경력·근무지에서 찾는다. 대소문자는 가리지 않는다('ios'로 iOS를 찾는다).
 */
export function filterJobsByQuery(jobs: Job[], query: string): Job[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return jobs

  return jobs.filter((job) => {
    const searchable = [job.title, job.company, job.companyKey, job.jobGroup, job.career, job.location]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return terms.every((term) => searchable.includes(term))
  })
}

export function buildCompanyFacets(jobs: Job[]): CompanyFacet[] {
  const counts = countBy(jobs, (job) => job.company)

  return Object.entries(counts)
    .map(([company, count]) => ({ company, count }))
    .sort((left, right) => right.count - left.count || left.company.localeCompare(right.company, 'ko'))
}
