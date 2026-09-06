import type { APIRoute } from 'astro'

/**
 * 정적 파일 대신 라우트로 두는 이유 — sitemap 주소에 astro.config의 site를 그대로 쓴다.
 * public/robots.txt에 도메인을 적어 두면 배포 도메인이 바뀔 때 조용히 어긋난다.
 *
 * AI 크롤러를 따로 적는 것은 정책을 분명히 하려는 것이다. `User-agent: *`에 이미
 * 포함되지만, 명시하지 않으면 허용인지 미처리인지 읽는 쪽이 알 수 없다.
 */
const AI_CRAWLERS = [
  'GPTBot', // OpenAI
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot', // Anthropic
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended', // Gemini 학습
  'Applebot-Extended',
  'CCBot', // Common Crawl
]

export const GET: APIRoute = ({ site }) => {
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    '# 옮겨 실은 글은 canonical이 원문을 가리킨다.',
    '# AI 검색이 인용해야 할 정본은 원문 블로그다.',
    ...AI_CRAWLERS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', '']),
    `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
  ]
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
