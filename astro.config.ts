import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'astro/config'
import pagefind from 'astro-pagefind'

/**
 * 모든 페이지가 빌드 때 구워진다. 서버가 필요한 라우트가 하나도 없어서
 * 어댑터를 두지 않는다 — 결과물은 dist/의 정적 파일뿐이라 Vercel·Netlify·
 * Cloudflare Pages·GitHub Pages 어디에도 그대로 올릴 수 있다.
 *
 * site는 sitemap·canonical·og:url이 절대 주소를 만들 때 쓴다. 반드시 실제 서비스
 * 도메인이어야 한다 — vercel.app 주소로 두면 서비스 도메인이 스스로 "정본은 저기"라고
 * canonical을 넘기고, sitemap도 남의 도메인 URL만 나열한다. 그러면 Search Console이
 * 속성 밖 URL이라며 사이트맵을 받지 않는다(실제로 이 상태로 색인이 0건이었다).
 */
export default defineConfig({
  site: 'https://grep.gogumang.com',
  integrations: [react(), sitemap(), pagefind()],
  vite: {
    plugins: [vanillaExtractPlugin()],
  },
})
