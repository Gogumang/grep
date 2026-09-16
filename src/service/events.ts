import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { FEATURED_EVENTS, type FeaturedEvent } from '../events/config/featured'
import type { ListedEvent, TechEvent } from '../shared/types'
import { selectUpcomingEvents } from '../shared/utils/eventDates'

/** collector(grep-airflow)가 커밋하는 자리다. 옮기면 그쪽 GitHubProperties.eventsPath·LocalContentProperties.eventsFile 도 함께 고친다. */
const EVENTS_FILE = path.join(process.cwd(), 'src', 'events', 'events.json')

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/
const URL_PATTERN = /^https:\/\/\S+$/

/**
 * 모양이 틀리면 빌드를 멈춘다. collector 와의 계약이 어긋난 채 배포되면 행사가 조용히 빠지거나
 * 'undefined일'이 찍힌다 — 그보다 빌드 실패가 낫다.
 */
export function parseEventsFile(json: string): TechEvent[] {
  const events = (JSON.parse(json) as { events?: unknown }).events
  if (!Array.isArray(events)) {
    throw new Error('events.json 에 events 배열이 없습니다 (예: {"source":"티켓타코","events":[]})')
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
  }
}

/** 손으로 고른 행사만 남기고 이미지를 붙인다. 순서는 받은 목록(시작 순)을 따른다. */
export function pickFeaturedEvents(events: TechEvent[], featured: FeaturedEvent[]): ListedEvent[] {
  const imageById = new Map(featured.map((item) => [item.id, item.image]))
  return events.flatMap((event) => {
    const image = imageById.get(event.id)
    return image ? [{ ...event, image }] : []
  })
}

export async function loadEvents(now: Date = new Date()): Promise<ListedEvent[]> {
  const events = selectUpcomingEvents(parseEventsFile(await readFile(EVENTS_FILE, 'utf8')), now)
  return pickFeaturedEvents(events, FEATURED_EVENTS)
}
