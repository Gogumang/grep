import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { TechEvent } from '../shared/types'
import { selectUpcomingEvents } from '../shared/utils/eventDates'
import { parseMarkdownTableRows } from './markdownTable'

const EVENTS_FILE = path.join(process.cwd(), 'src', 'events', 'config', 'events.md')

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * 표가 틀리면 빌드를 멈춘다. 손으로 쓰는 파일이라 오타가 흔한데, 틀린 행을 조용히 빼면
 * 행사가 왜 안 보이는지 아무도 모른다.
 */
export function parseEventsTable(markdown: string): TechEvent[] {
  return parseMarkdownTableRows(markdown).map((cells, index) => {
    const [title = '', url = '', host = '', startDate = '', endDate = '', place = '', deadline = '', price = ''] = cells
    const rowLabel = `events.md ${index + 1}번째 행(${title || '행사명 없음'})`

    if (!title) throw new Error(`${rowLabel}: 행사명이 비어 있습니다`)
    if (!/^https?:\/\/\S+$/.test(url)) {
      throw new Error(`${rowLabel}: 주소는 http(s)로 시작해야 합니다 (예: https://if.kakao.com/2026), 입력값: ${url}`)
    }
    if (!host) throw new Error(`${rowLabel}: 주최가 비어 있습니다`)

    const resolvedEndDate = endDate || startDate
    requireDate(rowLabel, '시작일', startDate)
    requireDate(rowLabel, '종료일', resolvedEndDate)
    if (deadline) requireDate(rowLabel, '신청 마감', deadline)
    if (resolvedEndDate < startDate) {
      throw new Error(`${rowLabel}: 종료일(${resolvedEndDate})이 시작일(${startDate})보다 앞섭니다`)
    }

    return {
      title,
      url,
      host,
      startDate,
      endDate: resolvedEndDate,
      place: place || null,
      registrationDeadline: deadline || null,
      price: price || null,
    }
  })
}

function requireDate(rowLabel: string, label: string, value: string): void {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`${rowLabel}: ${label}은 YYYY-MM-DD 형식이어야 합니다 (예: 2026-10-13), 입력값: ${value}`)
  }
}

export async function loadEvents(now: Date = new Date()): Promise<TechEvent[]> {
  return selectUpcomingEvents(parseEventsTable(await readFile(EVENTS_FILE, 'utf8')), now)
}
