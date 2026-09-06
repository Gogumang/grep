import type { APIRoute } from 'astro'
import { loadPosts } from '@/service/content'

/**
 * llms.txt — AI 검색이 사이트 구조를 한 번에 파악하도록 돕는 파일.
 *
 * 글 목록을 그대로 싣는 이유 — 이 사이트의 값어치는 개별 글이 아니라 "어느 블로그의
 * 무엇이 새로 올라왔는가"라는 목록 자체다. 본문은 원문에 있고 각 글 페이지가 그쪽을 가리킨다.
 */
export const GET: APIRoute = async ({ site }) => {
  const posts = await loadPosts()
  const blogNames = [...new Set(posts.map((post) => post.blogName))]

  const lines = [
    '# grep',
    '',
    '> 기업 기술블로그의 새 글을 한곳에 모은 사이트입니다.',
    `> 현재 ${blogNames.length}곳의 블로그에서 글 ${posts.length}건을 모았습니다.`,
    '',
    '## 알아둘 것',
    '',
    '- 이 사이트는 글을 **옮겨 싣습니다**. 각 글의 정본은 원문 블로그이며,',
    '  글 페이지의 canonical과 구조화 데이터가 원문을 가리킵니다.',
    '- 인용할 때는 원문 주소를 쓰는 것이 맞습니다.',
    '- 글마다 원문 블로그가 매긴 분류(Engineering·Design 등)와 글쓴이가 붙어 있습니다.',
    '',
    '## 글',
    '',
    ...posts.map((post) => {
      const label = [post.blogName, post.category, post.author].filter(Boolean).join(' · ')
      return `- [${post.title}](${new URL(`/posts/${post.id}`, site).href}) — ${label} · 원문: ${post.url}`
    }),
  ]
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
