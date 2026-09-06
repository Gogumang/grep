/** 검색 결과 한 건. Pagefind 응답에서 화면에 필요한 것만 추린다. */
export interface SearchHit {
  url: string
  title: string
  excerpt: string
  blogName: string
  publishedAt: string
}

/** Pagefind가 타입을 주지 않아 쓰는 만큼만 좁게 적는다. */
interface PagefindData {
  url: string
  excerpt: string
  meta?: Record<string, string | undefined>
}

interface PagefindApi {
  options(options: { excerptLength?: number }): Promise<void>
  search(query: string): Promise<{ results: { data(): Promise<PagefindData> }[] }>
}

/** 발췌 길이(단어 수). 늘리면 결과마다 받아오는 양이 함께 늘어난다. */
const EXCERPT_LENGTH = 24

/** 색인은 빌드 산출물이라 번들에 못 넣는다. 처음 검색할 때만 불러온다. */
let pagefindPromise: Promise<PagefindApi | null> | null = null

function loadPagefind(): Promise<PagefindApi | null> {
  if (!pagefindPromise) {
    pagefindPromise = import(/* @vite-ignore */ `${import.meta.env.BASE_URL}pagefind/pagefind.js`)
      .then(async (module: PagefindApi) => {
        await module.options({ excerptLength: EXCERPT_LENGTH })
        return module
      })
      // 색인이 없으면(빌드 전 dev 서버) 검색만 죽고 페이지는 살아 있어야 한다.
      .catch(() => null)
  }
  return pagefindPromise
}

/** 색인이 없으면 null. 호출자가 "빌드가 필요하다"고 안내할 수 있게 빈 배열과 구분한다. */
export async function searchPosts(query: string, maxResults: number): Promise<SearchHit[] | null> {
  const pagefind = await loadPagefind()
  if (!pagefind) return null

  const search = await pagefind.search(query)
  // 결과 본체는 따로 받아와야 한다 — Pagefind가 목록과 상세를 갈라 두었다.
  const loaded = await Promise.all(search.results.slice(0, maxResults).map((result) => result.data()))

  return loaded.map((data) => ({
    url: data.url.replace(/\.html$/, ''),
    title: data.meta?.title ?? '(제목 없음)',
    excerpt: data.excerpt ?? '',
    blogName: data.meta?.blogName ?? '',
    publishedAt: data.meta?.publishedAt ?? '',
  }))
}
