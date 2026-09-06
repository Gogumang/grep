import type { Post } from '../shared/types'

const PICK_COUNT = 5

const PICK_WINDOW_DAYS = 7

/**
 * 블로그가 겹치지 않게 고르는 것이 1순위다. 다만 그 규칙만 쓰면 수집된 블로그가
 * 하나뿐일 때 픽이 한 개로 줄어 슬라이더가 사라진다 — 모자라면 차례로 채운다.
 */
export function selectTodayPicks(posts: Post[], manualPickUrls: string[], now: Date = new Date()): Post[] {
  if (manualPickUrls.length > 0) {
    const byUrl = new Map(posts.map((post) => [post.url, post]))
    const manualPicks = manualPickUrls.map((url) => byUrl.get(url)).filter((post): post is Post => post !== undefined)
    if (manualPicks.length > 0) return manualPicks.slice(0, PICK_COUNT)
  }

  const windowStart = new Date(now.getTime() - PICK_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const recent = posts.filter((post) => new Date(post.publishedAt) >= windowStart)

  const picks: Post[] = []
  const chosenIds = new Set<string>()

  const take = (candidates: Post[], requireNewBlog: boolean) => {
    const seenBlogKeys = new Set(picks.map((post) => post.blogKey))
    for (const post of candidates) {
      if (picks.length >= PICK_COUNT) return
      if (chosenIds.has(post.id)) continue
      if (requireNewBlog && seenBlogKeys.has(post.blogKey)) continue

      seenBlogKeys.add(post.blogKey)
      chosenIds.add(post.id)
      picks.push(post)
    }
  }

  take(recent, true) // 1순위: 최근 글, 블로그 안 겹치게
  take(recent, false) // 2순위: 최근 글이면 같은 블로그라도
  take(posts, false) // 3순위: 기간 밖이라도 최신순으로
  return picks
}

export function parsePicksTable(markdown: string): string[] {
  const urls: string[] = []

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue

    const firstCell = trimmed.replace(/^\|/, '').split('|')[0]?.trim() ?? ''
    if (/^https?:\/\/\S+$/.test(firstCell)) urls.push(firstCell)
  }
  return urls
}
