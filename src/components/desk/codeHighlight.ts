/**
 * 모니터 화면에 그릴 TypeScript 코드를 색 단위(토큰)로 나눈다.
 * 에디터 수준의 파서가 아니라 화면에서 "진짜 코드처럼" 읽히는 데 필요한 만큼만 구분한다 —
 * 주석·문자열·키워드·숫자·타입·함수 호출. 여러 줄 블록 주석만 줄을 넘어 상태를 이어 간다.
 */
export type TokenKind = 'plain' | 'comment' | 'string' | 'keyword' | 'number' | 'type' | 'function'

export interface CodeToken {
  text: string
  kind: TokenKind
}

const KEYWORDS = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'else',
  'export',
  'extends',
  'false',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'interface',
  'let',
  'new',
  'null',
  'of',
  'readonly',
  'return',
  'switch',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
])

const IDENTIFIER = /^[A-Za-z_$][\w$]*/
const NUMBER = /^\d[\d_.]*/
const QUOTES = new Set(["'", '"', '`'])

export function highlightLines(source: string): CodeToken[][] {
  let isInBlockComment = false
  return source.split('\n').map((line) => {
    const tokens: CodeToken[] = []
    const push = (text: string, kind: TokenKind) => {
      const last = tokens.at(-1)
      if (last && last.kind === kind) last.text += text
      else tokens.push({ text, kind })
    }

    let index = 0
    if (isInBlockComment) {
      const end = line.indexOf('*/')
      if (end < 0) return [{ text: line, kind: 'comment' }]
      push(line.slice(0, end + 2), 'comment')
      index = end + 2
      isInBlockComment = false
    }

    while (index < line.length) {
      const rest = line.slice(index)
      if (rest.startsWith('//')) {
        push(rest, 'comment')
        break
      }
      if (rest.startsWith('/*')) {
        const end = rest.indexOf('*/', 2)
        if (end < 0) {
          push(rest, 'comment')
          isInBlockComment = true
          break
        }
        push(rest.slice(0, end + 2), 'comment')
        index += end + 2
        continue
      }
      const character = rest[0] ?? ''
      if (QUOTES.has(character)) {
        const end = closingQuoteIndex(rest, character)
        push(rest.slice(0, end), 'string')
        index += end
        continue
      }
      const number = NUMBER.exec(rest)?.[0]
      if (number) {
        push(number, 'number')
        index += number.length
        continue
      }
      const identifier = IDENTIFIER.exec(rest)?.[0]
      if (identifier) {
        push(identifier, kindOfIdentifier(identifier, rest.slice(identifier.length)))
        index += identifier.length
        continue
      }
      push(character, 'plain')
      index += 1
    }
    return tokens
  })
}

function kindOfIdentifier(identifier: string, after: string): TokenKind {
  if (KEYWORDS.has(identifier)) return 'keyword'
  if (/^\s*\(/.test(after) || /^\s*=\s*(async\s*)?\(/.test(after)) return 'function'
  if (/^[A-Z]/.test(identifier)) return 'type'
  return 'plain'
}

/** 여는 따옴표 다음부터 이스케이프되지 않은 같은 따옴표까지. 줄 끝까지 없으면 줄 끝. */
function closingQuoteIndex(text: string, quote: string): number {
  for (let index = 1; index < text.length; index++) {
    if (text[index] === '\\') {
      index += 1
      continue
    }
    if (text[index] === quote) return index + 1
  }
  return text.length
}
