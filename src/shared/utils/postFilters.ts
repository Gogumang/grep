import { countBy, uniqBy } from 'es-toolkit'
import type { Post, PostCategory } from '../types'

export interface BlogFacet {
  blogKey: string
  blogName: string
  count: number
}

export interface CategoryFacet {
  category: PostCategory
  count: number
}

export interface PostFilter {
  blogKey: string | null
  category: string | null
}

export const EMPTY_FILTER: PostFilter = { blogKey: null, category: null }

/** 사이드바에 보이는 순서. 글 수로 정렬하면 수집 때마다 순서가 흔들린다. */
const CATEGORY_ORDER: PostCategory[] = ['Engineering', 'Design', 'Product']

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

/** 글이 하나도 없는 분류는 고를 것 없는 필터라 뺀다. */
export function buildCategoryFacets(posts: Post[]): CategoryFacet[] {
  const counts = countBy(posts, (post) => post.category)

  return CATEGORY_ORDER.map((category) => ({ category, count: counts[category] ?? 0 })).filter(
    (facet) => facet.count > 0,
  )
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
    return true
  })
}

/** 의미 없는 태그와 블로그가 자기 이름을 붙인 태그(블로그 표시가 이미 하는 일)는 카드에서 뺀다. */
export function visibleTags(post: Post): string[] {
  return post.tags.filter((tag) => {
    const normalized = tag.trim().toLowerCase()
    if (!normalized || MEANINGLESS_TAGS.has(normalized)) return false
    return !isSelfLabel(normalized, post)
  })
}
