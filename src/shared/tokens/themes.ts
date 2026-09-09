import type { vars } from '../styles/contract.css'
import paletteTokens from './palette.tokens.json'
import shapeTokens from './shape.tokens.json'
import darkTokens from './theme.dark.tokens.json'
import lightTokens from './theme.light.tokens.json'

/**
 * DTCG 토큰(JSON)을 vanilla-extract가 쓰는 객체로 편다.
 * 값을 고치려면 같은 폴더의 *.tokens.json을 고친다.
 */

type TokenNode = { $value?: unknown; $type?: string } & { [key: string]: unknown }

const REFERENCE = /^\{([^}]+)\}$/

const primitives: Record<string, unknown> = { ...paletteTokens, ...shapeTokens }

function valueAtPath(path: string): unknown {
  let node: unknown = primitives
  for (const key of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[key]
  }
  return (node as TokenNode | undefined)?.$value
}

/** 폰트 스택 배열의 원소도 다른 스택을 가리킬 수 있다 — display가 sans 전체를 뒤에 붙이는 식. */
function expand(entry: unknown): string[] {
  const reference = typeof entry === 'string' ? REFERENCE.exec(entry) : null
  if (!reference) return [String(entry)]

  const referenced = valueAtPath(reference[1] ?? '')
  return Array.isArray(referenced) ? referenced.flatMap(expand) : [String(referenced)]
}

/** DTCG는 fontWeight를 숫자로 규정한다. JSON을 규격대로 두고 변환만 여기서 한다. */
function toCssValue(raw: unknown, type: string | undefined): string {
  if (Array.isArray(raw)) {
    return raw
      .flatMap(expand)
      .map((name) => (name.includes(' ') ? `'${name}'` : name))
      .join(', ')
  }
  if (type === 'fontWeight') return String(raw)
  return String(raw)
}

function resolve(node: unknown): unknown {
  if (typeof node !== 'object' || node === null) return node

  const token = node as TokenNode
  if ('$value' in token) {
    const raw = token.$value
    const reference = typeof raw === 'string' ? REFERENCE.exec(raw) : null
    const source = reference ? valueAtPath(reference[1] ?? '') : raw
    return toCssValue(source, token.$type)
  }

  const output: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(token)) {
    // $description 같은 메타 필드는 값이 아니다.
    if (key.startsWith('$')) continue
    output[key] = resolve(child)
  }
  return output
}

/** 토큰이 하나라도 빠지면 컴파일 에러로 잡힌다. */
type Theme = {
  [Group in keyof typeof vars]: { [Key in keyof (typeof vars)[Group]]: string }
}

/** 색은 테마별, 간격·글꼴은 공통이라 둘을 합쳐야 계약이 채워진다. */
function buildTheme(themeTokens: { semantic: unknown }): Theme {
  return {
    ...(resolve(shapeTokens.semantic) as object),
    ...(resolve(themeTokens.semantic) as object),
  } as Theme
}

export const lightTheme = buildTheme(lightTokens)
export const darkTheme = buildTheme(darkTokens)
