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
    '> 개발자의 발견과 배움, 만드는 여정을 돕는 사이트입니다. 기술 아티클과 개발 학습 리소스를 연결합니다.',
    `> 현재 ${blogNames.length}곳의 블로그에서 글 ${posts.length}건을 모았습니다.`,
    '',
    `- [기술 아티클](${new URL('/explore/', site).href})`,
    `- [채용](${new URL('/jobs/', site).href}) — 기술 블로그를 운영하는 회사들의 개발 직군 공고. 지원은 각 회사 채용 페이지에서 합니다.`,
    `- [이벤트](${new URL('/events/', site).href}) — 개발자 컨퍼런스·밋업·해커톤 일정. 티켓타코·이벤터스·Dev-Event에서 모았고 신청은 각 행사 페이지에서 합니다.`,
    '',
    '## 알아둘 것',
    '',
    '- 이 사이트는 글을 **옮겨 싣습니다**. 각 글의 정본은 원문 블로그이며,',
    '  글 페이지의 canonical과 구조화 데이터가 원문을 가리킵니다.',
    '- 인용할 때는 원문 주소를 쓰는 것이 맞습니다.',
    '- 글마다 분류(Engineering·Design·Product 중 하나)와 글쓴이가 붙어 있습니다.',
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
