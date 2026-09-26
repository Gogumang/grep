import { describe, expect, test } from 'bun:test'
import { pickGradeRequest, readCollectorConfig, toClientResponse } from './collectorGrading'

describe('readCollectorConfig', () => {
  test('주소 끝의 / 를 떼어 낸다', () => {
    const config = readCollectorConfig({
      COLLECTOR_BASE_URL: 'https://example.test/collector/',
      COLLECTOR_SITE_TOKEN: 't',
    })
    expect(config).toEqual({ baseUrl: 'https://example.test/collector', siteToken: 't' })
  })

  test('토큰이 없으면 collector를 부르지 않고 바로 실패한다', () => {
    expect(() => readCollectorConfig({ COLLECTOR_BASE_URL: 'https://example.test' })).toThrow(/COLLECTOR_SITE_TOKEN/)
  })
})

test('화면이 보낸 네 필드만 넘기고 나머지는 버린다', () => {
  const picked = pickGradeRequest({ problemId: 'a', language: 'go', code: 'x', scope: 'all', admin: true })
  expect(picked).toEqual({ problemId: 'a', language: 'go', code: 'x', scope: 'all' })
})

describe('toClientResponse', () => {
  test('채점 결과는 그대로 넘긴다', () => {
    const report = { kind: 'graded', isAccepted: true, cases: [] }
    expect(toClientResponse(200, report)).toEqual({ status: 200, payload: report })
  })

  test('잘못된 요청은 collector의 메시지만 보여 준다', () => {
    const response = toClientResponse(404, { error: 'problem_not_found', message: '없는 문제입니다. 입력값: x' })
    expect(response).toEqual({ status: 404, payload: { message: '없는 문제입니다. 입력값: x' } })
  })

  test('토큰 문제(401)와 서버 오류(5xx)는 내부 사정을 싣지 않는다', () => {
    const unauthorized = toClientResponse(401, {
      error: 'unauthorized',
      message: '접근 토큰이 없거나 올바르지 않습니다',
    })
    const judgeDown = toClientResponse(502, { error: 'judge_unavailable', message: 'connect refused go-judge:5050' })
    expect(unauthorized.status).toBe(502)
    expect(JSON.stringify(unauthorized.payload)).not.toContain('토큰')
    expect(JSON.stringify(judgeDown.payload)).not.toContain('go-judge')
  })
})
