import { parseMarkdownTableRows } from '../../src/service/markdownTable'

export interface CompanySource {
  name: string
  /** 'kakao' | 'naver' | 'woowahan' | 'toss' | 'greenhouse:보드이름' */
  source: string
}

const KNOWN_SOURCE = /^(kakao|naver|woowahan|toss|greenhouse:[a-z0-9-]+)$/

const INACTIVE = '비활성'

/** 모르는 소스 이름은 수집을 시작하기 전에 멈춘다 — 오타 난 회사가 매일 조용히 빠지지 않게. */
export function parseCompaniesTable(markdown: string): CompanySource[] {
  return parseMarkdownTableRows(markdown).flatMap(([name = '', source = '', status = ''], index) => {
    if (status === INACTIVE) return []

    const rowLabel = `companies.md ${index + 1}번째 행(${name || '회사 이름 없음'})`
    if (!name) throw new Error(`${rowLabel}: 회사 이름이 비어 있습니다`)
    if (!KNOWN_SOURCE.test(source)) {
      throw new Error(
        `${rowLabel}: 소스는 kakao·naver·woowahan·toss·greenhouse:보드이름 중 하나여야 합니다 (예: greenhouse:daangn), 입력값: ${source}`,
      )
    }
    return [{ name, source }]
  })
}
