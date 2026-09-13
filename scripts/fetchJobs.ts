/**
 * 채용 공고 수집. `bun run jobs`
 *
 * src/jobs/config/companies.md의 회사들을 병렬로 수집해 공고 목록을 src/jobs/jobs.json에,
 * 본문을 src/jobs/body/{id}.md에 쓴다(글의 list/post 분리와 같은 이유 — 목록은 가볍게).
 * 한 회사가 실패해도 나머지는 진행하고, 실패한 회사는 이전 공고를 유지한다(snapshot.ts).
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { JobsSnapshot } from '../src/shared/types/job'
import { parseCompaniesTable } from './jobs/companies'
import { buildSnapshot, type SourceResult } from './jobs/snapshot'
import {
  type CollectedJob,
  greenhouseJobsUrl,
  kakaoPageUrl,
  NAVER_PAGE_SIZE,
  naverPageUrl,
  type PagedJobs,
  parseGreenhouseJobs,
  parseKakaoPage,
  parseNaverDetailPage,
  parseNaverPage,
  parseTossJobs,
  parseWoowahanDetail,
  parseWoowahanPage,
  type SourceContext,
  TOSS_JOBS_URL,
  woowahanPageUrl,
} from './jobs/sources'

const ROOT = process.cwd()
const COMPANIES_FILE = path.join(ROOT, 'src', 'jobs', 'config', 'companies.md')
const JOBS_FILE = path.join(ROOT, 'src', 'jobs', 'jobs.json')
const BODY_DIRECTORY = path.join(ROOT, 'src', 'jobs', 'body')

/** 쿠팡 보드는 본문을 포함하면 13MB라 넉넉히 둔다. */
const REQUEST_TIMEOUT_MILLISECONDS = 60_000
/** 쪽 수를 잘못 읽어 끝없이 넘기는 사고를 막는 상한. 지금은 네이버 5쪽이 가장 많다. */
const MAX_PAGE_COUNT = 30
/** 본문을 공고마다 따로 받는 소스에 한꺼번에 요청을 쏟지 않도록 동시에 이만큼만 보낸다. */
const DETAIL_CONCURRENCY = 4
/** 일부 채용 사이트는 UA가 없는 요청을 막는다. 누가 보내는 요청인지는 밝힌다. */
const USER_AGENT = 'Mozilla/5.0 (compatible; grep-jobs/1.0; +https://grep-alpha.vercel.app)'
const BODY_FILE_NAME = /^([0-9a-f]{10})\.md$/

type Collector = (context: SourceContext) => Promise<CollectedJob[]>
type CollectResult = { group: string; collected: CollectedJob[] } | { group: string; error: Error }

async function fetchText(url: string, accept: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: accept },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
  })
  if (!response.ok) throw new Error(`${url} 응답 ${response.status}`)
  return response.text()
}

async function fetchJson(url: string): Promise<unknown> {
  // 네이버는 JSON을 text/html로 보낸다. Content-Type을 믿지 않고 본문을 파싱한다.
  return JSON.parse(await fetchText(url, 'application/json'))
}

/** 한 쪽씩 받는다. 전체 쪽 수는 응답이 알려준다. */
async function collectPages(
  pageUrl: (pageIndex: number) => string,
  parse: (payload: unknown) => PagedJobs,
): Promise<CollectedJob[]> {
  const collected: CollectedJob[] = []
  let pageCount = 1
  for (let pageIndex = 0; pageIndex < Math.min(pageCount, MAX_PAGE_COUNT); pageIndex++) {
    const parsed = parse(await fetchJson(pageUrl(pageIndex)))
    collected.push(...parsed.jobs)
    pageCount = parsed.pageCount
  }
  return collected
}

async function mapWithConcurrency<Item, Result>(
  items: Item[],
  limit: number,
  work: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = new Array(items.length)
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await work(items[index] as Item)
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * 목록에 본문이 없는 소스는 공고마다 상세를 받는다. 본문은 보조 데이터라 한 건이 실패해도
 * 공고는 남기고 본문만 비운다 — 이전에 받아 둔 본문 파일은 지우지 않으므로 그대로 쓰인다.
 */
async function fillBodies(
  collected: CollectedJob[],
  group: string,
  readBody: (detailUrl: string) => Promise<string | null>,
): Promise<CollectedJob[]> {
  let failedCount = 0
  const filled = await mapWithConcurrency(collected, DETAIL_CONCURRENCY, async (item) => {
    if (item.body !== null || item.detailUrl === null) return item
    try {
      return { ...item, body: await readBody(item.detailUrl) }
    } catch {
      failedCount++
      return item
    }
  })
  if (failedCount > 0) console.warn(`  ${group}: 본문 ${failedCount}건을 받지 못했습니다`)
  return filled
}

function resolveCollector(source: string): Collector {
  if (source === 'kakao') {
    // 카카오는 쪽 번호가 1부터다.
    return (context) =>
      collectPages(
        (pageIndex) => kakaoPageUrl(pageIndex + 1),
        (payload) => parseKakaoPage(payload, context),
      )
  }
  if (source === 'naver') {
    return async (context) => {
      const collected = await collectPages(
        (pageIndex) => naverPageUrl(pageIndex * NAVER_PAGE_SIZE),
        (payload) => parseNaverPage(payload, context),
      )
      return fillBodies(collected, context.group, async (detailUrl) =>
        parseNaverDetailPage(await fetchText(detailUrl, 'text/html')),
      )
    }
  }
  if (source === 'woowahan') {
    return async (context) => {
      const collected = await collectPages(woowahanPageUrl, (payload) => parseWoowahanPage(payload, context))
      return fillBodies(collected, context.group, async (detailUrl) => parseWoowahanDetail(await fetchJson(detailUrl)))
    }
  }
  if (source === 'toss') {
    return async (context) => parseTossJobs(await fetchJson(TOSS_JOBS_URL), context)
  }
  const board = source.replace(/^greenhouse:/, '')
  return async (context) => parseGreenhouseJobs(await fetchJson(greenhouseJobsUrl(board)), context)
}

async function readPreviousSnapshot(): Promise<JobsSnapshot | null> {
  try {
    return JSON.parse(await readFile(JOBS_FILE, 'utf8')) as JobsSnapshot
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

/**
 * 받은 본문을 쓰고, 목록에서 사라진 공고의 본문 파일을 지운다.
 * 이번에 본문을 못 받은 공고(실패한 회사 포함)의 옛 파일은 목록에 남아 있는 한 지우지 않는다.
 */
async function writeBodies(bodies: Map<string, string>, keptJobIds: Set<string>): Promise<number> {
  await mkdir(BODY_DIRECTORY, { recursive: true })
  await Promise.all(
    [...bodies]
      .filter(([jobId]) => keptJobIds.has(jobId))
      .map(([jobId, body]) => writeFile(path.join(BODY_DIRECTORY, `${jobId}.md`), `${body}\n`)),
  )

  const staleFileNames = (await readdir(BODY_DIRECTORY)).filter((fileName) => {
    const jobId = BODY_FILE_NAME.exec(fileName)?.[1]
    return jobId !== undefined && !keptJobIds.has(jobId)
  })
  await Promise.all(staleFileNames.map((fileName) => rm(path.join(BODY_DIRECTORY, fileName))))
  return staleFileNames.length
}

async function main(): Promise<void> {
  const companies = parseCompaniesTable(await readFile(COMPANIES_FILE, 'utf8'))
  const previous = await readPreviousSnapshot()

  const results = await Promise.all(
    companies.map(async (company): Promise<CollectResult> => {
      try {
        return { group: company.name, collected: await resolveCollector(company.source)({ group: company.name }) }
      } catch (error) {
        return { group: company.name, error: error instanceof Error ? error : new Error(String(error)) }
      }
    }),
  )

  const bodies = new Map<string, string>()
  const sourceResults: SourceResult[] = results.map((result) => {
    if ('error' in result) {
      console.log(`✗ ${result.group}: ${result.error.message}`)
      return result
    }
    const withBody = result.collected.filter((item) => item.body !== null)
    for (const item of withBody) bodies.set(item.job.id, item.body as string)
    console.log(`✓ ${result.group}: ${result.collected.length}건 (본문 ${withBody.length}건)`)
    return { group: result.group, jobs: result.collected.map((item) => item.job) }
  })

  const { snapshot, failedGroups } = buildSnapshot(sourceResults, previous, new Date())
  if (failedGroups.length > 0) console.warn(`이전 공고를 유지한 회사: ${failedGroups.join(', ')}`)

  await writeFile(JOBS_FILE, `${JSON.stringify(snapshot, null, 2)}\n`)
  const removedCount = await writeBodies(bodies, new Set(snapshot.jobs.map((job) => job.id)))
  console.log(
    `총 ${snapshot.jobs.length}건 → ${path.relative(ROOT, JOBS_FILE)} (updatedAt ${snapshot.updatedAt}), 사라진 공고 본문 ${removedCount}건 삭제`,
  )
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exit(1)
}
