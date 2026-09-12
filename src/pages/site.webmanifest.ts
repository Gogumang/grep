import type { APIRoute } from 'astro'

/**
 * 안드로이드·데스크톱의 '홈 화면에 추가'가 읽는 파일.
 *
 * 없으면 브라우저가 글자 아이콘(g)을 만들어 붙인다 — 즐겨찾기에 아이콘이 안 뜨던
 * 원인 중 하나다. robots.txt와 같은 이유로 정적 파일 대신 라우트로 둔다.
 *
 * display를 standalone이 아니라 browser로 둔다. 여기는 읽고 나가서 원문으로 가는
 * 곳이라 주소창이 사라지면 오히려 불편하다 — 앱인 척할 이유가 없다.
 */
export const GET: APIRoute = () => {
  const manifest = {
    name: 'grep — 당신의 별이 빛나는 곳',
    short_name: 'grep',
    description: '개발자의 발견과 배움, 만드는 여정을 함께합니다.',
    start_url: '/',
    display: 'browser',
    lang: 'ko',
    background_color: '#ffffff',
    // 브랜드 초록(palette.brand.500). BaseLayout의 theme-color와 같은 값이다.
    theme_color: '#079743',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      // maskable은 안드로이드가 원·사각 등 제 모양으로 잘라 쓸 때 고른다.
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  })
}
