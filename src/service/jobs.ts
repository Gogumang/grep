import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { JobsSnapshot } from '../shared/types'
import { selectOpenJobs } from '../shared/utils/jobFilters'

/** scripts/fetchJobs.ts가 쓰는 자리다. 옮기면 그쪽과 GitHub Actions 워크플로도 함께 고친다. */
const JOBS_ROOT = path.join(process.cwd(), 'src', 'jobs')
const JOBS_FILE = path.join(JOBS_ROOT, 'jobs.json')
/** 공고 본문. 목록(jobs.json)과 갈라 둔 것은 글과 같은 이유다 — 목록 화면은 본문을 읽지 않는다. */
const BODY_DIRECTORY = path.join(JOBS_ROOT, 'body')

const JOB_ID = /^[0-9a-f]{10}$/

/** 빌드 시점에 마감이 지난 공고는 뺀다. 빌드 뒤에 지나는 마감은 화면(JobExplorer)이 한 번 더 거른다. */
export async function loadJobs(now: Date = new Date()): Promise<JobsSnapshot> {
  try {
    const snapshot = JSON.parse(await readFile(JOBS_FILE, 'utf8')) as JobsSnapshot
    return { updatedAt: snapshot.updatedAt, jobs: selectOpenJobs(snapshot.jobs, now) }
  } catch (error) {
    // 아직 한 번도 수집하지 않았으면 파일이 없다 — 빈 목록으로 다룬다.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { updatedAt: null, jobs: [] }
    throw error
  }
}

/** 본문을 못 받은 공고는 파일이 없다 — null이면 페이지가 원문으로 안내한다. */
export async function loadJobBody(jobId: string): Promise<string | null> {
  // id가 파일 경로에 들어간다. 형식이 다르면 읽지 않는다.
  if (!JOB_ID.test(jobId)) return null
  try {
    return await readFile(path.join(BODY_DIRECTORY, `${jobId}.md`), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}
