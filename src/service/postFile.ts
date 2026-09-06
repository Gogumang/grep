import type { Post } from '../shared/types'

/**
 * 파일이 담고 있는 것만 만든다. cardImage·wideImage는 파일 이름의 id가 있어야
 * 정할 수 있어서 읽는 쪽(content.ts)에서 채운다.
 */
export type ParsedPostFile = Omit<Post, 'cardImage' | 'wideImage'>

/**
 * frontmatter는 collector가 항상 같은 규칙으로 쓴다(값은 큰따옴표, tags만 배열).
 * 그래서 YAML 파서를 들이지 않는다. 형식이 깨진 파일은 null로 걸러낸다.
 */
export function parsePostFile(fileContents: string): ParsedPostFile | null {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(fileContents)
  if (!match) return null

  const [, frontmatter, body] = match
  const fields = parseFrontmatter(frontmatter ?? '')

  const title = fields.title
  const url = fields.url
  const publishedAt = fields.publishedAt
  if (typeof title !== 'string' || typeof url !== 'string' || typeof publishedAt !== 'string') return null

  return {
    id: asString(fields.id) || deriveIdFromNothing(url),
    title,
    url,
    blogName: asString(fields.blogName),
    blogKey: asString(fields.blogKey),
    blogHomepage: asString(fields.blogHomepage),
    publishedAt,
    summary: (body ?? '').trim(),
    sourceThumbnail: asString(fields.sourceThumbnail) || null,
    tags: Array.isArray(fields.tags) ? fields.tags : [],
    category: asString(fields.category) || null,
    author: asString(fields.author) || null,
    hidden: fields.hidden === 'true',
  }
}

type FrontmatterValue = string | string[] | undefined

function parseFrontmatter(frontmatter: string): Record<string, FrontmatterValue> {
  const fields: Record<string, FrontmatterValue> = {}

  for (const line of frontmatter.split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue

    const key = line.slice(0, separator).trim()
    const rawValue = line.slice(separator + 1).trim()
    fields[key] = rawValue.startsWith('[') ? parseArray(rawValue) : unquote(rawValue)
  }
  return fields
}

function parseArray(rawValue: string): string[] {
  const inner = rawValue.slice(1, -1).trim()
  if (!inner) return []
  return inner
    .split(',')
    .map((item) => unquote(item.trim()))
    .filter(Boolean)
}

function unquote(value: string): string {
  if (!value.startsWith('"') || !value.endsWith('"')) return value
  return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

function asString(value: FrontmatterValue): string {
  return typeof value === 'string' ? value : ''
}

/** collector는 id를 파일 이름에만 넣는다. 호출자가 넣어주는 것이 정상 경로다. */
function deriveIdFromNothing(url: string): string {
  return url
}
