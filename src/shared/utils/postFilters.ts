import { countBy, uniqBy } from 'es-toolkit'
import type { Post } from '../types'

export interface BlogFacet {
  blogKey: string
  blogName: string
  count: number
}

export interface TagFacet {
  tag: string
  count: number
}

export interface CategoryFacet {
  category: string
  count: number
}

export interface PostFilter {
  blogKey: string | null
  tag: string | null
  category: string | null
}

export const EMPTY_FILTER: PostFilter = { blogKey: null, tag: null, category: null }

const TAG_FACET_LIMIT = 20

const MEANINGLESS_TAGS = new Set([
  'post',
  'posts',
  'blog',
  'blogs',
  'hello world',
  'article',
  'uncategorized',
  '미분류',
  '기타',
  'tech',
])

const SELF_LABEL_MIN_LENGTH = 3

export function buildBlogFacets(posts: Post[]): BlogFacet[] {
  const counts = countBy(posts, (post) => post.blogKey)

  return uniqBy(posts, (post) => post.blogKey)
    .map((post) => ({ blogKey: post.blogKey, blogName: post.blogName, count: counts[post.blogKey] ?? 0 }))
    .sort((left, right) => right.count - left.count || left.blogName.localeCompare(right.blogName, 'ko'))
}

/** 블로그가 직접 매긴 값이라 태그와 달리 걸러내지 않는다. */
export function buildCategoryFacets(posts: Post[]): CategoryFacet[] {
  const counts = countBy(
    posts.filter((post) => post.category),
    (post) => post.category as string,
  )

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category, 'ko'))
}

/**
 * 걸러내는 것은 셋 — 한 글에만 붙은 태그, 의미 없는 태그,
 * 블로그가 자기 이름을 붙인 태그(블로그 필터가 이미 하는 일).
 */
export function buildTagFacets(posts: Post[], limit: number = TAG_FACET_LIMIT): TagFacet[] {
  // 한 글에 같은 태그가 두 번 있어도 한 번만 센다.
  const tags = posts.flatMap((post) =>
    [...new Set(post.tags)]
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag && !MEANINGLESS_TAGS.has(tag) && !isSelfLabel(tag, post)),
  )
  const counts = countBy(tags, (tag) => tag)

  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag, 'ko'))
    .slice(0, limit)
}

function isSelfLabel(tag: string, post: Post): boolean {
  if (tag === post.blogName.toLowerCase() || tag === post.blogKey.toLowerCase()) return true
  if (tag.length < SELF_LABEL_MIN_LENGTH) return false
  return post.blogKey.toLowerCase().includes(tag)
}

/** 글자 검색은 여기 없다 — Pagefind 색인을 쓰는 검색 모달이 맡는다. */
export function filterPosts(posts: Post[], filter: PostFilter): Post[] {
  return posts.filter((post) => {
    if (filter.blogKey && post.blogKey !== filter.blogKey) return false
    if (filter.category && post.category !== filter.category) return false
    if (filter.tag && !post.tags.some((tag) => tag.toLowerCase() === filter.tag)) return false
    return true
  })
}

/** 사이드바 키워드 목록과 같은 기준을 쓴다. */
export function visibleTags(post: Post): string[] {
  return post.tags.filter((tag) => {
    const normalized = tag.trim().toLowerCase()
    if (!normalized || MEANINGLESS_TAGS.has(normalized)) return false
    return !isSelfLabel(normalized, post)
  })
}
