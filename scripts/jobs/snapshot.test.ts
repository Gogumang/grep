import { describe, expect, test } from 'bun:test'
import type { Job, JobsSnapshot } from '../../src/shared/types/job'
import { buildSnapshot } from './snapshot'

function job(overrides: Partial<Job>): Job {
  return {
    id: 'id',
    group: '카카오',
    company: '카카오',
    title: '서버 개발자',
    url: 'https://example.com',
    jobGroup: null,
    career: null,
    deadline: null,
    postedAt: '2026-09-01T00:00:00+09:00',
    ...overrides,
  }
}

const NOW = new Date('2026-09-13T00:00:00Z')

const previous: JobsSnapshot = {
  updatedAt: '2026-09-10T00:00:00.000Z',
  jobs: [
    job({ id: 'kakao-old', group: '카카오', title: '카카오 옛 공고' }),
    job({ id: 'naver-old', group: '네이버', title: '네이버 옛 공고' }),
  ],
}

describe('buildSnapshot', () => {
  test('실패한 소스는 이전 공고를 유지하고 성공한 소스는 새 공고로 바꾼다', () => {
    // Arrange
    const results = [
      { group: '카카오', jobs: [job({ id: 'kakao-new', title: '카카오 새 공고' })] },
      { group: '네이버', error: new Error('503') },
    ]

    // Act
    const { snapshot, failedGroups } = buildSnapshot(results, previous, NOW)

    // Assert
    const ids = snapshot.jobs.map((item) => item.id).sort()
    expect(ids, `jobs were: ${ids}`).toEqual(['kakao-new', 'naver-old'])
    expect(failedGroups).toEqual(['네이버'])
    expect(snapshot.updatedAt).toBe(NOW.toISOString())
  })

  test('0건 응답은 실패로 보고 이전 공고를 유지한다', () => {
    // Arrange
    const results = [
      { group: '카카오', jobs: [] },
      { group: '네이버', jobs: [job({ id: 'naver-new', group: '네이버' })] },
    ]

    // Act
    const { snapshot, failedGroups } = buildSnapshot(results, previous, NOW)

    // Assert
    expect(failedGroups).toEqual(['카카오'])
    expect(snapshot.jobs.some((item) => item.id === 'kakao-old')).toBe(true)
  })

  test('모든 소스가 실패하면 파일을 덮어쓰지 않도록 던진다', () => {
    // Arrange
    const results = [
      { group: '카카오', error: new Error('timeout') },
      { group: '네이버', jobs: [] },
    ]

    // Act & Assert
    expect(() => buildSnapshot(results, previous, NOW)).toThrow('모든 채용 소스가 실패')
  })

  test('공고가 그대로면 updatedAt을 바꾸지 않는다', () => {
    // Arrange
    const results = [
      { group: '카카오', jobs: [previous.jobs[0] as Job] },
      { group: '네이버', jobs: [previous.jobs[1] as Job] },
    ]

    // Act
    const { snapshot } = buildSnapshot(results, previous, NOW)

    // Assert
    expect(snapshot.updatedAt).toBe(previous.updatedAt)
  })

  test('최근 게시 순으로 정렬하고 게시 시각을 모르는 공고는 뒤로 보낸다', () => {
    // Arrange
    const results = [
      {
        group: '카카오',
        jobs: [
          job({ id: 'unknown', postedAt: null }),
          job({ id: 'older', postedAt: '2026-08-01T00:00:00+09:00' }),
          job({ id: 'newer', postedAt: '2026-09-05T00:00:00+09:00' }),
        ],
      },
    ]

    // Act
    const { snapshot } = buildSnapshot(results, null, NOW)

    // Assert
    expect(snapshot.jobs.map((item) => item.id)).toEqual(['newer', 'older', 'unknown'])
  })
})
