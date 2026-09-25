import type { Job, TechEvent } from '../../shared/types'
import { searchEvents } from './eventSearch'
import { searchJobs } from './jobSearch'
import { searchPosts } from './pagefind'

/** 모달에 그리는 결과 한 건. 소스마다 모양이 달라 모달이 그리는 모양으로 맞춘다. */
export interface SearchResult {
  url: string
  title: string
  meta: string
  /** Pagefind가 이스케이프한 본문에 <mark> 강조만 붙인 HTML. 채용 공고는 본문이 없어 비운다. */
  excerptHtml: string
  /** 이 사이트 밖(행사 판매처)으로 가는 결과. 목록 화면처럼 새 탭에서 연다. */
  isExternal?: boolean
}

/**
 * 검색 모달이 무엇을 찾는지. 모달은 하나이고, 페이지가 소스를 고른다(BaseLayout의 searchScope).
 * 채용·이벤트 페이지에서 돋보기를 눌러 아티클이 뜨면 엉뚱해서 나눴다.
 */
export interface SearchSource {
  dialogLabel: string
  placeholder: string
  hintMessage: string
  minimumQueryLength: number
  unavailableMessage: string
  noMatchMessage: (query: string) => string
  /** 찾을 수 없는 상태(색인·목록 없음)면 null. 결과가 없는 것과 구분한다. */
  search: (query: string, maxResults: number) => Promise<SearchResult[] | null>
}

export const postSearchSource: SearchSource = {
  dialogLabel: '글 검색',
  placeholder: '제목과 본문에서 찾기',
  hintMessage: '두 글자 이상 입력하면 찾기 시작합니다.',
  minimumQueryLength: 2,
  unavailableMessage: '검색 색인이 없습니다. `bun run build`를 한 번 돌리면 만들어집니다.',
  noMatchMessage: (query) => `“${query}”에 맞는 글이 없습니다.`,
  async search(query, maxResults) {
    const hits = await searchPosts(query, maxResults)
    return (
      hits?.map((hit) => ({
        url: hit.url,
        title: hit.title,
        meta: [hit.blogName, hit.publishedAt.slice(0, 10)].filter(Boolean).join(' · '),
        excerptHtml: hit.excerpt,
      })) ?? null
    )
  },
}

/**
 * 빌드 때 구운 목록(/jobs.json, /events.json)은 그 페이지에서 처음 검색할 때만 받는다.
 * 실패는 기억하지 않는다 — 한 번 끊겼다고 페이지를 새로 열 때까지 검색이 죽으면 안 된다.
 */
function createListLoader<T>(fileName: string): () => Promise<T[] | null> {
  let request: Promise<T[] | null> | null = null
  return () => {
    request ??= fetch(`${import.meta.env.BASE_URL}${fileName}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`${fileName} 응답 ${response.status}`)
        return (await response.json()) as T[]
      })
      .catch(() => {
        request = null
        return null
      })
    return request
  }
}

const loadJobs = createListLoader<Job>('jobs.json')
const loadEvents = createListLoader<TechEvent>('events.json')

export const jobSearchSource: SearchSource = {
  dialogLabel: '채용 공고 검색',
  placeholder: '직무·회사로 찾기 (예: 백엔드, 토스 iOS)',
  hintMessage: '직무나 회사 이름을 입력하세요. 낱말을 여러 개 쓰면 모두 들어간 공고만 찾습니다.',
  minimumQueryLength: 1,
  unavailableMessage: '공고 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
  noMatchMessage: (query) => `“${query}”에 맞는 공고가 없습니다.`,
  async search(query, maxResults) {
    const jobs = await loadJobs()
    if (!jobs) return null
    return searchJobs(jobs, query, new Date(), maxResults).map((result) => ({ ...result, excerptHtml: '' }))
  },
}

export const eventSearchSource: SearchSource = {
  dialogLabel: '이벤트 검색',
  placeholder: '행사·주최·장소로 찾기 (예: 카카오, 온라인)',
  hintMessage: '행사 이름이나 주최, 장소를 입력하세요. 낱말을 여러 개 쓰면 모두 들어간 행사만 찾습니다.',
  minimumQueryLength: 1,
  unavailableMessage: '행사 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
  noMatchMessage: (query) => `“${query}”에 맞는 행사가 없습니다.`,
  async search(query, maxResults) {
    const events = await loadEvents()
    if (!events) return null
    return searchEvents(events, query, new Date(), maxResults).map((result) => ({
      ...result,
      excerptHtml: '',
      isExternal: true,
    }))
  },
}
