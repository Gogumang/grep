import { describe, expect, test } from 'bun:test'
import type { Job } from '../../shared/types'
import { searchJobs } from './jobSearch'

function job(overrides: Partial<Job>): Job {
  return {
    id: 'id',
    companyKey: 'toss',
    company: '토스',
    title: 'Server Developer',
    url: 'https://toss.im/career/job-detail?gh_jid=1',
    jobGroup: 'Backend',
    career: null,
    location: null,
    employmentType: null,
    deadline: null,
    postedAt: null,
    ...overrides,
  }
}

describe('searchJobs', () => {
  test('마감이 지난 공고는 빼고 회사·직군·마감을 한 줄로 붙인다', () => {
    // Arrange — UTC 01:00은 한국 10:00
    const now = new Date('2026-09-13T01:00:00Z')
    const jobs = [
      job({ id: 'closed', url: 'https://example.com/closed', deadline: '2026-09-12T10:00:00+09:00' }),
      job({
        id: 'open',
        url: 'https://example.com/open',
        company: '토스뱅크',
        career: '경력',
        deadline: '2026-09-29T10:00:00+09:00',
      }),
      job({ id: 'always', url: 'https://example.com/always' }),
    ]

    // Act
    const results = searchJobs(jobs, '토스 server', now, 8)

    // Assert
    // 원문이 아니라 이 사이트의 공고 페이지로 간다
    expect(results.map((result) => result.url)).toEqual(['/jobs/open', '/jobs/always'])
    expect(results[0]?.meta).toBe('토스뱅크 · Backend · 경력 · 9월 29일 마감')
    expect(results[1]?.meta).toBe('토스 · Backend · 상시 채용')
  })

  test('결과는 상한만큼만 돌려준다', () => {
    const jobs = Array.from({ length: 12 }, (_, index) =>
      job({ id: `job-${index}`, url: `https://example.com/${index}` }),
    )

    expect(searchJobs(jobs, 'server', new Date('2026-09-13T00:00:00Z'), 8)).toHaveLength(8)
  })
})
