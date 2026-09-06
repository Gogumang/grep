import type { APIRoute } from 'astro'
import { loadPosts } from '@/service/content'

/**
 * @astrojs/sitemap을 쓰지 않고 직접 만든다 — 그 통합은 파일 이름을
 * sitemap-index.xml + sitemap-0.xml로 고정하는데, 검색엔진도 사람도 먼저
 * 찾아보는 주소는 /sitemap.xml이다. 글이 21건이라 나눌 이유도 없다
 * (sitemaps.org 상한은 파일 하나에 50,000건).
 *
 * lastmod를 함께 적는다. 없으면 크롤러가 모든 URL을 매번 똑같이 취급해서
 * 어느 페이지를 다시 읽어야 하는지 구분하지 못한다.
 */
export const GET: APIRoute = async ({ site }) => {
  const posts = await loadPosts()

  // loadPosts는 최신 글이 앞이다. 홈은 새 글이 실릴 때마다 바뀌므로
  // 가장 최근 글의 발행 시각을 홈의 lastmod로 쓴다.
  const entries = [
    { path: '/', lastmod: posts[0]?.publishedAt },
    ...posts.map((post) => ({ path: `/posts/${post.id}/`, lastmod: post.publishedAt })),
  ]

  const urls = entries.map(({ path, lastmod }) => {
    const loc = new URL(path, site).href
    // publishedAt은 ISO-8601이고 lastmod도 같은 형식을 받는다 — 변환이 필요 없다.
    const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : ''
    return `<url><loc>${loc}</loc>${lastmodTag}</url>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
