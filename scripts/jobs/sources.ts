import { createHash } from 'node:crypto'
import { parse as parseHtml } from 'node-html-parser'
import type { Job } from '../../src/shared/types/job'
import { decodeHtmlEntities, htmlToMarkdown, normalizeMarkdown, textToMarkdown } from './markdown'

/**
 * 채용 사이트 응답 → 공고와 본문. 네트워크는 여기 없다 — fetchJobs.ts가 받아서 넘긴다.
 * 응답 모양이 기대와 다르면 던진다. 조용히 빈 목록을 돌려주면 fetchJobs가
 * '공고 0건'과 '응답이 바뀜'을 구분하지 못한다.
 */

export interface SourceContext {
  /** companies.md의 '회사 이름' */
  group: string
}

/** 공고 하나와 그 본문. 본문은 보조 데이터라 못 가져오면 null이고, 공고는 그대로 남는다. */
export interface CollectedJob {
  job: Job
  /** 마크다운. src/jobs/body/{id}.md로 저장된다. */
  body: string | null
  /** 목록 응답에 본문이 없어 한 건씩 더 받아야 하는 소스(우아한형제들·네이버)의 상세 주소 */
  detailUrl: string | null
}

export interface PagedJobs {
  jobs: CollectedJob[]
  pageCount: number
}

/**
 * 직군 코드를 주지 않는 소스(우아한형제들, Greenhouse 일부)는 제목으로 가른다.
 * 넓게 잡는다 — 개발 공고가 빠지는 것보다 인접 직군이 섞이는 편이 낫다.
 * 다만 '사업개발'과 '플랫폼'·'platform' 단독은 뺀다. 실제 수집에서 '사업개발/운영',
 * '운영기획 (Platform Biz Intelligence)'이 개발 공고로 섞였다. 플랫폼 엔지니어는 '엔지니어'로 잡힌다.
 */
const ENGINEERING_TITLE =
  /(?<!사업)개발|엔지니어|프론트|백엔드|서버|데이터|보안|인프라|아키텍트|\b(engineer|engineering|developer|frontend|backend|server|ios|android|data|ml|ai|security|infra|sre|devops|qa|architect|dba)\b/i

/** 한국 사이트라 해외 근무지는 뺀다 — 쿠팡은 타이베이·도쿄 공고가 절반 가까이 된다. */
const KOREA_LOCATION = /korea|seoul|busan|pangyo|서울|부산|판교|성남|한국/i

/** 상시 채용을 먼 미래 날짜(9999-12-31)로 적는 소스가 있다. 이 해 이후는 마감 없음으로 읽는다. */
const OPEN_ENDED_YEAR = 9000

/** 토스 커리어 페이지의 Job Category 중 개발 직군. 영업·상담·재무 등은 뺀다. */
const TOSS_ENGINEERING_CATEGORIES = new Set([
  'Backend',
  'Frontend',
  'App',
  'Device',
  'Infra',
  'ML',
  'Data Engineering',
  'Data Analysis',
  'Security Engineering',
  'Information Security',
  'QA',
  'Technical Excellence',
  '병역특례',
])

export const NAVER_PAGE_SIZE = 10
const WOOWAHAN_PAGE_SIZE = 100
export const TOSS_JOBS_URL = 'https://api-public.toss.im/api/v3/ipd-eggnog/career/jobs'

export function kakaoPageUrl(page: number): string {
  return `https://careers.kakao.com/public/api/job-list?part=TECHNOLOGY&company=ALL&page=${page}`
}

export function naverPageUrl(firstIndex: number): string {
  return `https://recruit.navercorp.com/rcrt/loadJobList.do?firstIndex=${firstIndex}`
}

export function woowahanPageUrl(page: number): string {
  return `https://career.woowahan.com/w1/recruits?recruitCampaignSeq=0&page=${page}&size=${WOOWAHAN_PAGE_SIZE}&sort=updateDate,desc`
}

/** content=true면 본문(content)이 함께 온다. 쿠팡 보드는 이렇게 받으면 13MB쯤 된다. */
export function greenhouseJobsUrl(board: string): string {
  return `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`
}

export function isEngineeringTitle(title: string): boolean {
  return ENGINEERING_TITLE.test(title)
}

function jobIdFromUrl(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 10)
}

/**
 * 한국 소스는 시간대 없이 한국 시각을 준다('2026.09.29 10:00:00', '2026-09-14T00:00:00').
 * 시간대를 붙이지 않으면 UTC로 읽혀 마감이 9시간 늦어진다.
 */
function seoulDateTime(localDateTime: string | null | undefined): string | null {
  if (!localDateTime) return null

  const normalized = localDateTime.trim().replace(/\./g, '-').replace(' ', 'T')
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(normalized)
  if (!match) throw new Error(`날짜를 읽지 못했습니다 (예: 2026-09-29 10:00:00), 입력값: ${localDateTime}`)

  const [, year = '', month, day, hour = '00', minute = '00', second = '00'] = match
  if (Number(year) >= OPEN_ENDED_YEAR) return null
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`
}

/** 시간대가 붙어 오는 값(Greenhouse)은 UTC ISO로 맞춘다. */
function isoDateTime(value: string | null | undefined): string | null {
  if (!value) return null
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) {
    throw new Error(`날짜를 읽지 못했습니다 (예: 2026-08-27T07:50:18-04:00), 입력값: ${value}`)
  }
  return time.toISOString()
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function requireArray(value: unknown, description: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`응답에 ${description} 배열이 없습니다 — 채용 사이트의 응답 모양이 바뀌었을 수 있습니다`)
  }
  return value
}

// ── 카카오 ──────────────────────────────────────────────

interface KakaoJob {
  realId: string
  jobOfferTitle: string
  companyName?: string | null
  jobTypeName?: string | null
  closeFlag?: boolean
  privateFlag?: boolean
  endDate?: string | null
  regDate?: string | null
  introduction?: string | null
  workContentDesc?: string | null
  qualification?: string | null
  jobOfferProcessDesc?: string | null
}

/** 카카오는 빈 칸을 '-'로 채워 준다. 자유 양식 공고는 introduction 하나에 본문이 다 들어 있다. */
function kakaoBody(job: KakaoJob): string | null {
  const sections = [job.introduction, job.workContentDesc, job.qualification, job.jobOfferProcessDesc].filter(
    (section): section is string => typeof section === 'string' && section.trim() !== '' && section.trim() !== '-',
  )
  return sections.length > 0 ? textToMarkdown(sections.join('\n\n')) : null
}

export function parseKakaoPage(payload: unknown, context: SourceContext): PagedJobs {
  const page = payload as { jobList?: unknown; totalPage?: unknown }
  const jobList = requireArray(page?.jobList, 'jobList') as KakaoJob[]

  const jobs = jobList
    .filter((job) => !job.closeFlag && !job.privateFlag)
    .map((job): CollectedJob => {
      const url = `https://careers.kakao.com/jobs/${job.realId}`
      return {
        job: {
          id: jobIdFromUrl(url),
          group: context.group,
          company: stringOrNull(job.companyName) ?? context.group,
          title: job.jobOfferTitle.trim(),
          url,
          jobGroup: stringOrNull(job.jobTypeName),
          career: null,
          deadline: seoulDateTime(job.endDate),
          postedAt: seoulDateTime(job.regDate),
        },
        body: kakaoBody(job),
        detailUrl: null,
      }
    })
  return { jobs, pageCount: Number(page.totalPage) || 1 }
}

// ── 네이버 ──────────────────────────────────────────────

interface NaverJob {
  annoId: number
  annoSubject: string
  sysCompanyCdNm?: string | null
  classCdNm?: string | null
  subJobCdNm?: string | null
  entTypeCdNm?: string | null
  staYmdTime?: string | null
  endYmdTime?: string | null
  jobDetailLink?: string | null
}

/** 네이버는 쪽 수 대신 전체 건수를 준다. 쪽 수로 바꿔 다른 소스와 같은 모양으로 돌려준다. 본문은 상세 페이지에만 있다. */
export function parseNaverPage(payload: unknown, context: SourceContext): PagedJobs {
  const page = payload as { list?: unknown; totalSize?: unknown }
  const list = requireArray(page?.list, 'list') as NaverJob[]

  const jobs = list
    .filter((job) => job.classCdNm === 'Tech')
    .map((job): CollectedJob => {
      const url = stringOrNull(job.jobDetailLink) ?? `https://recruit.navercorp.com/rcrt/view.do?annoId=${job.annoId}`
      return {
        job: {
          id: jobIdFromUrl(url),
          group: context.group,
          company: stringOrNull(job.sysCompanyCdNm) ?? context.group,
          title: job.annoSubject.trim(),
          url,
          jobGroup: stringOrNull(job.subJobCdNm),
          career: stringOrNull(job.entTypeCdNm),
          deadline: seoulDateTime(job.endYmdTime),
          postedAt: seoulDateTime(job.staYmdTime),
        },
        body: null,
        detailUrl: url,
      }
    })
  return { jobs, pageCount: Math.max(1, Math.ceil((Number(page.totalSize) || 0) / NAVER_PAGE_SIZE)) }
}

/**
 * 네이버 상세 페이지(HTML)에서 본문을 뽑는다. JSON 상세 API가 없어 페이지를 읽는다.
 * 본문은 .detail_box 여러 개로 나뉘어 있다 — 없으면 페이지 구조가 바뀐 것이라 던진다.
 */
export function parseNaverDetailPage(html: string): string | null {
  const boxes = parseHtml(html).querySelectorAll('.detail_box')
  if (boxes.length === 0) {
    throw new Error('네이버 상세 페이지에 .detail_box가 없습니다 — 페이지 구조가 바뀌었을 수 있습니다')
  }
  return htmlToMarkdown(boxes.map((box) => box.innerHTML).join('\n'))
}

// ── 우아한형제들 ────────────────────────────────────────

interface WoowahanJob {
  recruitNumber: string
  recruitName: string
  recruitOpenDate?: string | null
  recruitEndDate?: string | null
  careerRestrictionMinYears?: number | null
  isHidden?: boolean
  recruitDeleteYn?: boolean
}

export function parseWoowahanPage(payload: unknown, context: SourceContext): PagedJobs {
  const data = (payload as { data?: { list?: unknown; totalPageNumber?: unknown } })?.data
  const list = requireArray(data?.list, 'data.list') as WoowahanJob[]

  const jobs = list
    .filter((job) => !job.isHidden && !job.recruitDeleteYn && isEngineeringTitle(job.recruitName))
    .map((job): CollectedJob => {
      const url = `https://career.woowahan.com/recruitment/${job.recruitNumber}/detail`
      const minimumYears = Number(job.careerRestrictionMinYears) || 0
      return {
        job: {
          id: jobIdFromUrl(url),
          group: context.group,
          company: context.group,
          title: job.recruitName.trim(),
          url,
          jobGroup: null,
          // 경력 구분 코드의 이름표는 공개돼 있지 않다. 확실한 최소 연차만 적는다.
          career: minimumYears > 0 ? `경력 ${minimumYears}년 이상` : null,
          deadline: seoulDateTime(job.recruitEndDate),
          postedAt: seoulDateTime(job.recruitOpenDate),
        },
        // 목록의 recruitContents는 늘 비어 있다. 본문은 공고별 상세 API에만 있다.
        body: null,
        detailUrl: `https://career.woowahan.com/w1/recruits/${job.recruitNumber}`,
      }
    })
  return { jobs, pageCount: Number(data?.totalPageNumber) || 1 }
}

export function parseWoowahanDetail(payload: unknown): string | null {
  const data = (payload as { data?: { recruitContents?: unknown } | null })?.data
  if (!data) throw new Error('우아한형제들 상세 응답에 data가 없습니다 — 공고가 내려갔거나 응답 모양이 바뀌었을 수 있습니다')
  return typeof data.recruitContents === 'string' ? htmlToMarkdown(data.recruitContents) : null
}

// ── Greenhouse 모양 (토스, Greenhouse 보드) ────────────────

interface GreenhouseJob {
  title: string
  absolute_url: string
  location?: { name?: string | null } | null
  metadata?: { name: string; value: unknown }[] | null
  first_published?: string | null
  application_deadline?: string | null
  /** content=true일 때만 온다. HTML을 한 번 이스케이프한 문자열이다. */
  content?: string | null
}

function metadataValue(job: GreenhouseJob, isWanted: (name: string) => boolean): unknown {
  return job.metadata?.find((entry) => isWanted(entry.name))?.value
}

function toGreenhouseShapedJob(job: GreenhouseJob, context: SourceContext, company: string, jobGroup: string | null): Job {
  return {
    id: jobIdFromUrl(job.absolute_url),
    group: context.group,
    company,
    title: job.title.trim(),
    url: job.absolute_url,
    jobGroup,
    career: stringOrNull(metadataValue(job, (name) => name === 'Prior Experience')),
    deadline: isoDateTime(job.application_deadline),
    postedAt: isoDateTime(job.first_published),
  }
}

/**
 * 토스는 Greenhouse 데이터를 자체 API로 감싸 준다. 메타데이터 이름이 사내 안내문 그대로라
 * ('커리어 페이지 노출 Job Category 값을 선택해주세요') 문구가 조금 바뀌어도 잡히게 일부만 본다.
 * 본문도 메타데이터('Job Description을 작성해 주세요…')에 마크다운으로 들어 있다.
 */
export function parseTossJobs(payload: unknown, context: SourceContext): CollectedJob[] {
  const jobs = requireArray((payload as { success?: unknown })?.success, 'success') as GreenhouseJob[]

  return jobs.flatMap((job) => {
    const category = stringOrNull(metadataValue(job, (name) => name.includes('Job Category')))
    if (!category || !TOSS_ENGINEERING_CATEGORIES.has(category)) return []

    const subsidiary = stringOrNull(metadataValue(job, (name) => name.includes('자회사')))
    const description = stringOrNull(metadataValue(job, (name) => name.includes('Job Description')))
    return [
      {
        job: toGreenhouseShapedJob(job, context, subsidiary ?? context.group, category),
        body: description ? normalizeMarkdown(description) : null,
        detailUrl: null,
      },
    ]
  })
}

export function parseGreenhouseJobs(payload: unknown, context: SourceContext): CollectedJob[] {
  const jobs = requireArray((payload as { jobs?: unknown })?.jobs, 'jobs') as GreenhouseJob[]

  return jobs.flatMap((job) => {
    const location = job.location?.name
    if (location && !KOREA_LOCATION.test(location)) return []
    if (!isEngineeringGreenhouseJob(job)) return []

    const division = stringOrNull(metadataValue(job, (name) => name === 'Division'))
    const corporate = stringOrNull(metadataValue(job, (name) => name === 'Corporate'))
    return [
      {
        job: toGreenhouseShapedJob(job, context, corporate ?? context.group, division),
        body: job.content ? htmlToMarkdown(decodeHtmlEntities(job.content)) : null,
        detailUrl: null,
      },
    ]
  })
}

/** 보드마다 메타데이터가 다르다. 직군을 밝히는 값이 있으면 그것을 믿고, 없을 때만 제목을 본다. */
function isEngineeringGreenhouseJob(job: GreenhouseJob): boolean {
  const engineerFlag = metadataValue(job, (name) => name === 'Engineer')
  const division = metadataValue(job, (name) => name === 'Division')

  if (engineerFlag === true || division === 'Tech') return true
  if (typeof engineerFlag === 'boolean' || typeof division === 'string') return false
  return isEngineeringTitle(job.title)
}
