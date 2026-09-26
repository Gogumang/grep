import { describe, expect, test } from 'bun:test'
import { PROBLEMS } from './problems'
import raw from './problems.json'

/** 정답 검증(참조 풀이)과 숨은 테스트는 collector에 있다. 여기서는 사이트에 실리는 파일이 안전하고 온전한지만 본다. */
describe('problems.json', () => {
  test('숨은 테스트·참조 풀이가 실리지 않는다 — 이 저장소는 공개다', () => {
    const text = JSON.stringify(raw)
    for (const forbidden of ['hiddenCases', 'referenceCode', 'referenceLanguage']) {
      expect(text, `${forbidden}가 problems.json에 있다`).not.toContain(forbidden)
    }
  })

  test('id가 겹치지 않고 주소에 쓸 수 있는 모양이다', () => {
    const ids = PROBLEMS.map((problem) => problem.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  test('문제마다 예시와 숨은 테스트가 있다 — 없으면 풀이 화면과 제출 채점이 성립하지 않는다', () => {
    for (const problem of PROBLEMS) {
      expect(problem.examples.length, problem.id).toBeGreaterThan(0)
      expect(problem.hiddenCaseCount, problem.id).toBeGreaterThan(0)
    }
  })
})
