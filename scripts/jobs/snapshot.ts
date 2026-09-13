import type { Job, JobsSnapshot } from '../../src/shared/types/job'

export type SourceResult = { group: string; jobs: Job[] } | { group: string; error: Error }

export interface SnapshotResult {
  snapshot: JobsSnapshot
  /** 이번에 새로 받지 못해 이전 공고를 유지한 회사 */
  failedGroups: string[]
}

/**
 * 소스별 결과를 이전 파일과 합친다.
 *
 * - 실패한 소스와 0건을 돌려준 소스는 이전 공고를 유지한다. 일시 장애 한 번에 회사 하나가
 *   목록에서 통째로 사라지면, 복구될 때까지 그 상태가 배포된다. 0건도 실패로 보는 이유는 같다 —
 *   이 회사들이 개발 공고를 하나도 안 내는 날보다 응답이 비어 오는 날이 훨씬 흔하다.
 * - 모든 소스가 실패하면 던진다. 이전 파일은 호출자가 건드리지 않는다.
 * - 공고가 그대로면 updatedAt을 유지한다. 매일 도는 수집이 빈 커밋을 쌓지 않게 한다.
 */
export function buildSnapshot(results: SourceResult[], previous: JobsSnapshot | null, now: Date): SnapshotResult {
  const failedGroups: string[] = []
  const collected: Job[] = []

  for (const result of results) {
    if ('error' in result || result.jobs.length === 0) {
      failedGroups.push(result.group)
      collected.push(...(previous?.jobs.filter((job) => job.group === result.group) ?? []))
      continue
    }
    collected.push(...result.jobs)
  }

  if (results.length > 0 && failedGroups.length === results.length) {
    throw new Error(`모든 채용 소스가 실패했습니다 (${failedGroups.join(', ')}) — jobs.json을 그대로 둡니다`)
  }

  const jobs = sortJobs(dedupeById(collected))
  // 순서가 아니라 내용을 비교한다 — 손으로 고친 파일이나 정렬 규칙이 바뀐 뒤에도 내용이 같으면 같은 것이다.
  const isUnchanged = previous !== null && JSON.stringify(sortJobs(previous.jobs)) === JSON.stringify(jobs)

  return {
    snapshot: { updatedAt: isUnchanged ? previous.updatedAt : now.toISOString(), jobs },
    failedGroups,
  }
}

function dedupeById(jobs: Job[]): Job[] {
  return [...new Map(jobs.map((job) => [job.id, job])).values()]
}

/** 최근 게시 순. 게시 시각을 모르는 공고는 뒤로 보내고, 같으면 제목 순으로 고정해 파일 diff를 안정시킨다. */
function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((left, right) => {
    if (left.postedAt !== right.postedAt) {
      if (left.postedAt === null) return 1
      if (right.postedAt === null) return -1
      return right.postedAt.localeCompare(left.postedAt)
    }
    return left.title.localeCompare(right.title, 'ko') || left.id.localeCompare(right.id)
  })
}
