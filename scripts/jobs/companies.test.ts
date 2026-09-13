import { describe, expect, test } from 'bun:test'
import { parseCompaniesTable } from './companies'

describe('parseCompaniesTable', () => {
  test('비활성 행은 빼고 설명 목록은 읽지 않는다', () => {
    // Arrange
    const markdown = [
      '# 채용 공고 수집 대상',
      '',
      '- `kakao` — 설명 목록은 표가 아니다',
      '',
      '| 회사 이름 | 소스 | 수집 |',
      '| --- | --- | --- |',
      '| 카카오 | kakao | |',
      '| 당근 | greenhouse:daangn |',
      '| 쿠팡 | greenhouse:coupang | 비활성 |',
    ].join('\n')

    // Act
    const companies = parseCompaniesTable(markdown)

    // Assert
    expect(companies).toEqual([
      { name: '카카오', source: 'kakao' },
      { name: '당근', source: 'greenhouse:daangn' },
    ])
  })

  test('모르는 소스 이름은 예시와 함께 실패한다', () => {
    const markdown = '| 회사 이름 | 소스 | 수집 |\n| --- | --- | --- |\n| 라인 | line | |'

    expect(() => parseCompaniesTable(markdown)).toThrow('(예: greenhouse:daangn), 입력값: line')
  })
})
