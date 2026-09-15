import { describe, expect, test } from 'bun:test'
import type { Job } from '../types'
import { buildCompanyFacets, filterJobsByCompany, filterJobsByQuery, selectOpenJobs } from './jobFilters'

function job(overrides: Partial<Job>): Job {
  return {
    id: 'id',
    companyKey: 'kakao',
    company: '카카오',
    title: '서버 개발자',
    url: 'https://example.com',
    jobGroup: null,
    career: null,
    location: null,
    employmentType: null,
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
    job({
      id: 'toss-backend',
      company: '토스뱅크',
      companyKey: 'toss',
      title: 'Server Developer',
      jobGroup: 'Backend',
    }),
    job({ id: 'toss-ios', company: '토스', companyKey: 'toss', title: 'iOS Developer', jobGroup: 'App' }),
    job({ id: 'kakao-backend', company: '카카오', companyKey: 'kakao', title: '백엔드 개발자', career: '경력' }),
  ]

  test('낱말이 모두 들어 있어야 맞고, 회사·직군까지 함께 찾는다', () => {
    // Arrange — '토스'는 회사 이름(토스뱅크)에서, 'backend'는 직군에서 찾는다
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
  test('계열사 공고를 모회사로 묶고 계열사는 소분류로 둔다', () => {
    // Arrange
    const jobs = [
      job({ companyKey: 'toss', company: '토스증권' }),
      job({ companyKey: 'toss', company: '토스' }),
      job({ companyKey: 'toss', company: '토스증권' }),
      job({ companyKey: 'daangn', company: '당근' }),
    ]

    // Act
    const facets = buildCompanyFacets(jobs)

    // Assert
    expect(facets).toEqual([
      {
        companyKey: 'toss',
        companyName: '토스',
        count: 3,
        affiliates: [
          { company: '토스증권', count: 2 },
          { company: '토스', count: 1 },
        ],
      },
      { companyKey: 'daangn', companyName: '당근', count: 1, affiliates: [{ company: '당근', count: 1 }] },
    ])
  })

  test('공고 수가 같으면 모회사 화면 이름순이다 — 키 순서가 아니다', () => {
    // Arrange — 키 순서로는 coupang이 먼저지만 이름으로는 네이버(naver)가 먼저다
    const jobs = [job({ companyKey: 'coupang', company: '쿠팡' }), job({ companyKey: 'naver', company: 'NAVER' })]

    // Act
    const names = buildCompanyFacets(jobs).map((facet) => facet.companyName)

    // Assert
    expect(names).toEqual(['네이버', '쿠팡'])
  })

  test('이름 표에 없는 키는 키를 그대로 보여준다', () => {
    const facets = buildCompanyFacets([job({ companyKey: 'newcompany', company: '새회사' })])

    expect(facets[0]?.companyName).toBe('newcompany')
  })
})

describe('filterJobsByCompany', () => {
  const jobs = [
    job({ id: 'toss', companyKey: 'toss', company: '토스' }),
    job({ id: 'toss-securities', companyKey: 'toss', company: '토스증권' }),
    job({ id: 'kakao', companyKey: 'kakao', company: '카카오' }),
  ]

  test('모회사만 고르면 계열사 공고까지 남긴다', () => {
    const matched = filterJobsByCompany(jobs, { companyKey: 'toss', company: null })

    expect(matched.map((item) => item.id)).toEqual(['toss', 'toss-securities'])
  })

  test('계열사까지 고르면 그 계열사 공고만 남긴다', () => {
    const matched = filterJobsByCompany(jobs, { companyKey: 'toss', company: '토스증권' })

    expect(matched.map((item) => item.id)).toEqual(['toss-securities'])
  })
})
