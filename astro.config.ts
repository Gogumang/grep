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
 * site는 sitemap이 절대 주소를 만들 때 쓴다 — 실제 배포 도메인으로 바꿔야
 * sitemap-index.xml이 올바른 주소를 갖는다.
 */
export default defineConfig({
  site: 'https://grep-alpha.vercel.app',
  integrations: [react(), sitemap(), pagefind()],
  vite: {
    plugins: [vanillaExtractPlugin()],
  },
})
