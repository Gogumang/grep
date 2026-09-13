import { describe, expect, test } from 'bun:test'
import type { Job } from '../types'
import { buildCompanyFacets, filterJobsByQuery, selectOpenJobs } from './jobFilters'

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
    postedAt: null,
    ...overrides,
  }
}

describe('selectOpenJobs', () => {
  test('마감이 지난 공고는 빼고 상시 채용은 남긴다', () => {
    // Arrange — UTC 01:00은 한국 10:00
    const now = new Date('2026-09-13T01:00:00Z')
    const jobs = [
      job({ id: 'closed', deadline: '2026-09-13T10:00:00+09:00' }),
      job({ id: 'open', deadline: '2026-09-13T10:00:01+09:00' }),
      job({ id: 'always', deadline: null }),
    ]

    // Act
    const open = selectOpenJobs(jobs, now)

    // Assert
    expect(open.map((item) => item.id)).toEqual(['open', 'always'])
  })
})

describe('filterJobsByQuery', () => {
  const jobs = [
    job({ id: 'toss-backend', company: '토스뱅크', group: '토스', title: 'Server Developer', jobGroup: 'Backend' }),
    job({ id: 'toss-ios', company: '토스', group: '토스', title: 'iOS Developer', jobGroup: 'App' }),
    job({ id: 'kakao-backend', company: '카카오', group: '카카오', title: '백엔드 개발자', career: '경력' }),
  ]

  test('낱말이 모두 들어 있어야 맞고, 회사·직군까지 함께 찾는다', () => {
    // Arrange — '토스'는 회사(계열사면 group)에서, 'backend'는 직군에서 찾는다
    const query = '토스 backend'

    // Act
    const matched = filterJobsByQuery(jobs, query)

    // Assert
    expect(matched.map((item) => item.id)).toEqual(['toss-backend'])
  })

  test('대소문자를 가리지 않는다', () => {
    expect(filterJobsByQuery(jobs, 'IOS').map((item) => item.id)).toEqual(['toss-ios'])
  })

  test('빈 검색어는 전부 돌려준다', () => {
    expect(filterJobsByQuery(jobs, '   ')).toHaveLength(3)
  })
})

describe('buildCompanyFacets', () => {
  test('공고 수가 많은 회사부터, 같으면 이름순', () => {
    const jobs = [
      job({ company: '토스' }),
      job({ company: '당근' }),
      job({ company: '토스' }),
      job({ company: '네이버' }),
    ]

    expect(buildCompanyFacets(jobs)).toEqual([
      { company: '토스', count: 2 },
      { company: '네이버', count: 1 },
      { company: '당근', count: 1 },
    ])
  })
})
