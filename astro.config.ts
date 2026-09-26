import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'astro/config'
import pagefind from 'astro-pagefind'

/**
 * 모든 페이지가 빌드 때 구워진다. 예외는 코딩테스트 채점 API(/api/judge) 하나뿐이다 —
 * 채점 서버 토큰을 브라우저에 싣지 않으려고 그 라우트만 `prerender = false`로 Vercel Function에서 돈다.
 * 그래서 Vercel 어댑터를 둔다. 나머지 페이지는 그대로 정적 파일이다.
 *
 * sitemap은 src/pages/sitemap.xml.ts에서 직접 만든다 — @astrojs/sitemap은 파일
 * 이름을 sitemap-index.xml로 고정해서 /sitemap.xml을 내줄 수 없다.
 *
 * site는 sitemap·canonical·og:url이 절대 주소를 만들 때 쓴다. 반드시 실제 서비스
 * 도메인이어야 한다 — vercel.app 주소로 두면 서비스 도메인이 스스로 "정본은 저기"라고
 * canonical을 넘기고, sitemap도 남의 도메인 URL만 나열한다. 그러면 Search Console이
 * 속성 밖 URL이라며 사이트맵을 받지 않는다(실제로 이 상태로 색인이 0건이었다).
 */
export default defineConfig({
  site: 'https://grep.gogumang.com',
  adapter: vercel(),
  integrations: [react(), pagefind()],
  vite: {
    plugins: [vanillaExtractPlugin()],
    /*
     * 책상 꾸미기(/desk)의 3D 라이브러리를 개발 서버가 뜰 때 React와 한 번에 미리 묶는다.
     * 빼 두면 /desk를 처음 열 때에야 발견해서 다시 묶는데, 그 사이 브라우저가 immutable로 캐시한
     * 이전 React와 새로 묶은 React가 섞여 두 벌이 된다 — "Cannot read properties of null
     * (reading 'useState')"로 책상이 뜨지 않았다(개발 서버에서만, 빌드는 무관).
     */
    optimizeDeps: {
      include: ['three', '@react-three/fiber', '@react-three/drei'],
    },
  },
})
