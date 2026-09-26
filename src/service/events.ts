import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { EventSource, ListedEvent, TechEvent } from '../shared/types'
import { selectUpcomingEvents } from '../shared/utils/eventDates'

/** collector(grep-airflow)가 커밋하는 자리다. 옮기면 그쪽 GitHubProperties.eventsPath·LocalContentProperties.eventsFile 도 함께 고친다. */
const EVENTS_FILE = path.join(process.cwd(), 'src', 'events', 'events.json')

/**
 * 이벤트 페이지에 올린 행사. 어드민 행사 화면에서 올리고 내리면 collector 가 이 파일을 커밋한다
 * (그쪽 GitHubProperties.featuredEventsPath). events.json 에서 **여기 적힌 행사만** 보이고, 끝난 행사는 알아서 빠진다.
 *
 * 이미지는 주최 측 공식 사이트 것을 쓴다 — 티켓타코 약관 제11조가 서비스 콘텐츠 복제를 막는다.
 * 어드민에서 올린 행사는 R2 전체 주소(https://images.gogumang.com/events/{id}.avif),
 * 예전에 손으로 올린 세 건은 public/events 아래 사이트 경로다.
 */
const FEATURED_FILE = path.join(process.cwd(), 'src', 'events', 'featured.json')

export interface FeaturedEvent {
  /** events.json 의 id 와 같다(티켓타코 행사 코드, 이벤터스는 eventus-{번호}). */
  id: string
  /** 사이트 기준 경로(/events/x.avif)나 https 전체 주소. */
  image: string
}

const IMAGE_PATTERN = /^(\/|https:\/\/)\S+$/

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/
const URL_PATTERN = /^https:\/\/\S+$/

const EVENT_SOURCES: readonly EventSource[] = ['티켓타코', '이벤터스', 'Dev-Event', 'Meetup', 'Luma']

/**
 * 모양이 틀리면 빌드를 멈춘다. collector 와의 계약이 어긋난 채 배포되면 행사가 조용히 빠지거나
 * 'undefined일'이 찍힌다 — 그보다 빌드 실패가 낫다.
 */
export function parseEventsFile(json: string): TechEvent[] {
  const events = (JSON.parse(json) as { events?: unknown }).events
  if (!Array.isArray(events)) {
    throw new Error('events.json 에 events 배열이 없습니다 (예: {"source":"티켓타코·이벤터스","events":[]})')
  }
  return events.map((raw, index) => toEvent(raw, index))
}

function toEvent(raw: unknown, index: number): TechEvent {
  const value = (raw ?? {}) as Record<string, unknown>
  const label = `events.json ${index + 1}번째 행사(${typeof value.title === 'string' ? value.title : '제목 없음'})`

  const text = (field: string, pattern?: RegExp, example?: string): string => {
    const found = value[field]
    if (typeof found !== 'string' || found === '') throw new Error(`${label}: ${field} 값이 비어 있습니다`)
    if (pattern && !pattern.test(found)) {
      throw new Error(`${label}: ${field} 값은 ${example} 같은 형식이어야 합니다, 입력값: ${found}`)
    }
    return found
  }
  const nullableNumber = (field: string): number | null => {
    const found = value[field]
    if (found === null || found === undefined) return null
    if (typeof found !== 'number')
      throw new Error(`${label}: ${field} 값은 숫자(원)나 null 이어야 합니다, 입력값: ${String(found)}`)
    return found
  }
  // 출처가 없는 파일은 이벤터스를 붙이기 전 것이라 티켓타코다. 모르는 값은 계약이 어긋난 것이라 멈춘다.
  const source = value.source === undefined ? '티켓타코' : value.source
  if (!EVENT_SOURCES.includes(source as EventSource)) {
    throw new Error(`${label}: source 값은 ${EVENT_SOURCES.join('·')} 중 하나여야 합니다, 입력값: ${String(source)}`)
  }
  if (typeof value.isOnline !== 'boolean') {
    throw new Error(`${label}: isOnline 값은 true 나 false 여야 합니다, 입력값: ${String(value.isOnline)}`)
  }

  return {
    id: text('id'),
    title: text('title'),
    url: text('url', URL_PATTERN, 'https://ticketa.co/event/c9xsstcs'),
    host: text('host'),
    startDate: text('startDate', DATE_PATTERN, '2026-10-13'),
    startTime: text('startTime', TIME_PATTERN, '19:00'),
    endDate: text('endDate', DATE_PATTERN, '2026-10-13'),
    place: value.place === null || value.place === undefined ? null : text('place'),
    isOnline: value.isOnline,
    lowestPrice: nullableNumber('lowestPrice'),
    highestPrice: nullableNumber('highestPrice'),
    source: source as EventSource,
  }
}

/** 모양이 틀리면 빌드를 멈춘다. 조용히 빈 목록으로 읽으면 올린 행사가 전부 사라진 채 배포된다. */
export function parseFeaturedFile(json: string): FeaturedEvent[] {
  const events = (JSON.parse(json) as { events?: unknown }).events
  if (!Array.isArray(events)) {
    throw new Error(
      'featured.json 에 events 배열이 없습니다 (예: {"events":[{"id":"lyohvjgz","image":"/events/lyohvjgz.avif"}]})',
    )
  }
  return events.map((raw, index) => {
    const value = (raw ?? {}) as Record<string, unknown>
    const { id, image } = value
    if (typeof id !== 'string' || id === '')
      throw new Error(`featured.json ${index + 1}번째 행사: id 값이 비어 있습니다`)
    if (typeof image !== 'string' || !IMAGE_PATTERN.test(image)) {
      throw new Error(
        `featured.json ${index + 1}번째 행사(${id}): image 는 /events/x.avif 나 https:// 주소여야 합니다, 입력값: ${String(image)}`,
      )
    }
    return { id, image }
  })
}

/** 고른 행사만 남기고 이미지를 붙인다. 순서는 받은 목록(시작 순)을 따른다. */
export function pickFeaturedEvents(events: TechEvent[], featured: FeaturedEvent[]): ListedEvent[] {
  const imageById = new Map(featured.map((item) => [item.id, item.image]))
  return events.flatMap((event) => {
    const image = imageById.get(event.id)
    return image ? [{ ...event, image }] : []
  })
}

export async function loadEvents(now: Date = new Date()): Promise<ListedEvent[]> {
  const [eventsFile, featuredFile] = await Promise.all([readFile(EVENTS_FILE, 'utf8'), readFile(FEATURED_FILE, 'utf8')])
  const events = selectUpcomingEvents(parseEventsFile(eventsFile), now)
  return pickFeaturedEvents(events, parseFeaturedFile(featuredFile))
}
