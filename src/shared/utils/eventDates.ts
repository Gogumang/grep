import type { TechEvent } from '../types'

const SEOUL_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export interface EventMonth {
  /** '2026년 10월' */
  label: string
  events: TechEvent[]
}

/**
 * 한국 날짜 YYYY-MM-DD. 빌드 서버(UTC)와 방문자 기기가 어느 시간대든 같은 날로 본다 —
 * UTC 날짜로 비교하면 한국 아침 9시까지 어제 끝난 행사가 남는다.
 */
export function toSeoulDate(now: Date): string {
  return SEOUL_DATE.format(now)
}

/** 끝난 행사를 빼고 시작일 순으로 늘어놓는다. 진행 중인 행사는 남긴다. */
export function selectUpcomingEvents(events: TechEvent[], now: Date = new Date()): TechEvent[] {
  const today = toSeoulDate(now)
  return events
    .filter((event) => event.endDate >= today)
    .sort((left, right) => left.startDate.localeCompare(right.startDate) || left.title.localeCompare(right.title, 'ko'))
}

/** 시작일이 속한 달로 묶는다. 이미 시작일 순으로 정렬된 목록을 받는다. */
export function groupEventsByMonth(events: TechEvent[]): EventMonth[] {
  const months = new Map<string, TechEvent[]>()
  for (const event of events) {
    const key = event.startDate.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), event])
  }

  return [...months.entries()].map(([key, monthEvents]) => {
    const [year, month] = key.split('-')
    return { label: `${year}년 ${Number(month)}월`, events: monthEvents }
  })
}

/** '10월 13일(화) – 14일(수)'. 같은 달이면 끝나는 날의 달을 생략한다. */
export function formatEventPeriod(event: TechEvent): string {
  const start = describeDay(event.startDate, true)
  if (event.endDate === event.startDate) return start

  const isSameMonth = event.startDate.slice(0, 7) === event.endDate.slice(0, 7)
  return `${start} – ${describeDay(event.endDate, !isSameMonth)}`
}

/** '9월 28일(월)' */
export function formatEventDay(date: string): string {
  return describeDay(date, true)
}

function describeDay(date: string, isMonthShown: boolean): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  // 날짜만 있는 값이라 UTC로 만들어야 기기 시간대에 따라 요일이 밀리지 않는다.
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${isMonthShown ? `${month}월 ` : ''}${day}일(${weekday})`
}
