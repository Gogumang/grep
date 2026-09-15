import { countBy, groupBy } from 'es-toolkit'
import type { Job } from '../types'

/** 공고를 낸 회사. 모회사 아래 소분류로 보인다(토스 → 토스증권). */
interface AffiliateFacet {
  company: string
  count: number
}

/** 모회사 하나. 계열사 공고까지 합친 수다. */
interface CompanyFacet {
  companyKey: string
  companyName: string
  count: number
  affiliates: AffiliateFacet[]
}

export interface CompanyFilter {
  companyKey: string | null
  /** companyKey 아래 계열사. companyKey 없이 혼자 쓰이지 않는다. */
  company: string | null
}

export const EMPTY_COMPANY_FILTER: CompanyFilter = { companyKey: null, company: null }

/**
 * collector job_source.company_key → 화면 이름. jobs.json 에는 키만 실려 온다.
 * 수집 대상 회사를 늘리면 여기도 한 줄 더한다 — 빠뜨리면 사이드바에 키가 그대로 보인다.
 */
const COMPANY_NAMES: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  woowahan: '우아한형제들',
  toss: '토스',
  daangn: '당근',
  line: '라인',
  kurly: '컬리',
  musinsa: '무신사',
  zigbang: '직방',
  gccompany: '여기어때',
  gangnamunni: '강남언니',
  yanolja: '야놀자',
  coupang: '쿠팡',
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

function companyNameOf(companyKey: string): string {
  return COMPANY_NAMES[companyKey] ?? companyKey
}

/** 모회사도 계열사도 공고 수가 많은 순, 같으면 이름순. */
export function buildCompanyFacets(jobs: Job[]): CompanyFacet[] {
  return Object.entries(groupBy(jobs, (job) => job.companyKey))
    .map(([companyKey, companyJobs]) => ({
      companyKey,
      companyName: companyNameOf(companyKey),
      count: companyJobs.length,
      affiliates: Object.entries(countBy(companyJobs, (job) => job.company))
        .map(([company, count]) => ({ company, count }))
        .sort((left, right) => right.count - left.count || left.company.localeCompare(right.company, 'ko')),
    }))
    .sort((left, right) => right.count - left.count || left.companyName.localeCompare(right.companyName, 'ko'))
}

export function filterJobsByCompany(jobs: Job[], filter: CompanyFilter): Job[] {
  return jobs.filter((job) => {
    if (filter.companyKey && job.companyKey !== filter.companyKey) return false
    if (filter.company && job.company !== filter.company) return false
    return true
  })
}
