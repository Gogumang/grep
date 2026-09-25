import type { TechEvent } from '../../shared/types'
import { formatEventSchedule, selectUpcomingEvents } from '../../shared/utils/eventDates'

export interface EventSearchResult {
  url: string
  title: string
  /** 'Flutter Seoul · 아마존 코리아 · 11월 7일(토) 11:00' */
  meta: string
}

/**
 * 공백으로 나눈 낱말이 모두 들어 있는 행사만 남긴다 — 채용 검색과 같은 규칙이다.
 * 설명은 싣지 않으니 제목·주최·장소에서 찾고, 온라인 행사는 '온라인'으로도 찾힌다.
 */
function filterEventsByQuery(events: TechEvent[], query: string): TechEvent[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return events

  return events.filter((event) => {
    const searchable = [event.title, event.host, event.place, event.isOnline ? '온라인' : null]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return terms.every((term) => searchable.includes(term))
  })
}

/**
 * 검색 모달에 띄울 행사. 받아 둔 목록은 빌드 시점 것이라 끝난 행사를 한 번 더 거른다.
 * 결과는 이 사이트가 아니라 판매처 행사 페이지로 간다 — 행사 상세 페이지를 따로 두지 않는다.
 */
export function searchEvents(events: TechEvent[], query: string, now: Date, maxResults: number): EventSearchResult[] {
  return filterEventsByQuery(selectUpcomingEvents(events, now), query)
    .slice(0, maxResults)
    .map((event) => ({
      url: event.url,
      title: event.title,
      meta: [event.host, event.isOnline ? '온라인' : event.place, formatEventSchedule(event)]
        .filter(Boolean)
        .join(' · '),
    }))
}
