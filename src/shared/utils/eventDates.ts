import type { TechEvent } from '../types'

const SEOUL_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const WON = new Intl.NumberFormat('ko-KR')

/**
 * 한국 날짜 YYYY-MM-DD. 빌드 서버(UTC)와 방문자 기기가 어느 시간대든 같은 날로 본다 —
 * UTC 날짜로 비교하면 한국 아침 9시까지 어제 끝난 행사가 남는다.
 */
export function toSeoulDate(now: Date): string {
  return SEOUL_DATE.format(now)
}

/** 끝난 행사를 빼고 시작 순으로 늘어놓는다. 진행 중인 행사는 남긴다. */
export function selectUpcomingEvents(events: TechEvent[], now: Date = new Date()): TechEvent[] {
  const today = toSeoulDate(now)
  return events
    .filter((event) => event.endDate >= today)
    .sort(
      (left, right) =>
        left.startDate.localeCompare(right.startDate) ||
        left.startTime.localeCompare(right.startTime) ||
        left.title.localeCompare(right.title, 'ko'),
    )
}

/** '11월 7일(토) 11:00', 여러 날이면 '10월 13일(화) 10:00 – 14일(수)'. 같은 달이면 끝나는 날의 달을 생략한다. */
export function formatEventSchedule(event: TechEvent): string {
  const start = `${describeDay(event.startDate, true)} ${event.startTime}`
  if (event.endDate === event.startDate) return start

  const isSameMonth = event.startDate.slice(0, 7) === event.endDate.slice(0, 7)
  return `${start} – ${describeDay(event.endDate, !isSameMonth)}`
}

/**
 * '무료' · '10,000원' · '10,000원 ~ 20,000원' · '무료 ~ 11,000원'.
 * 원문에 가격이 없으면 null — 모르는 가격을 무료로 적지 않는다.
 */
export function formatEventPrice(event: TechEvent): string | null {
  const { lowestPrice, highestPrice } = event
  if (lowestPrice === null) return null

  const lowest = describePrice(lowestPrice)
  if (highestPrice === null || highestPrice <= lowestPrice) return lowest
  return `${lowest} ~ ${describePrice(highestPrice)}`
}

function describePrice(price: number): string {
  return price === 0 ? '무료' : `${WON.format(price)}원`
}

function describeDay(date: string, isMonthShown: boolean): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  return `${isMonthShown ? `${month}월 ` : ''}${day}일(${weekdayOf(year, month, day)})`
}

// 날짜만 있는 값이라 UTC로 만들어야 기기 시간대에 따라 요일이 밀리지 않는다.
function weekdayOf(year: number, month: number, day: number): string {
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? ''
}
