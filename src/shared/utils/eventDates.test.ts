import { describe, expect, test } from 'bun:test'
import type { TechEvent } from '../types'
import { formatEventPeriod, groupEventsByMonth, selectUpcomingEvents, toSeoulDate } from './eventDates'

function event(overrides: Partial<TechEvent>): TechEvent {
  return {
    title: '행사',
    url: 'https://example.com',
    host: '주최',
    startDate: '2026-10-13',
    endDate: '2026-10-13',
    place: null,
    registrationDeadline: null,
    price: null,
    ...overrides,
  }
}

describe('selectUpcomingEvents', () => {
  test('한국 날짜로 끝난 행사를 뺀다 — UTC로는 아직 전날이어도', () => {
    // Arrange — UTC 10월 14일 15:30은 한국 10월 15일 00:30
    const now = new Date('2026-10-14T15:30:00Z')
    const events = [
      event({ title: '어제 끝남', startDate: '2026-10-13', endDate: '2026-10-14' }),
      event({ title: '오늘 끝남', startDate: '2026-10-15', endDate: '2026-10-15' }),
      event({ title: '진행 중', startDate: '2026-10-01', endDate: '2026-10-20' }),
    ]

    // Act
    const upcoming = selectUpcomingEvents(events, now)

    // Assert
    expect(toSeoulDate(now)).toBe('2026-10-15')
    expect(upcoming.map((item) => item.title)).toEqual(['진행 중', '오늘 끝남'])
  })
})

describe('formatEventPeriod', () => {
  test('같은 달이면 끝나는 날의 달을 생략한다', () => {
    expect(formatEventPeriod(event({ startDate: '2026-10-13', endDate: '2026-10-14' }))).toBe(
      '10월 13일(화) – 14일(수)',
    )
  })

  test('달이 바뀌면 끝나는 날에도 달을 적는다', () => {
    expect(formatEventPeriod(event({ startDate: '2026-10-31', endDate: '2026-11-01' }))).toBe(
      '10월 31일(토) – 11월 1일(일)',
    )
  })

  test('하루짜리 행사는 날짜 하나만 적는다', () => {
    expect(formatEventPeriod(event({ startDate: '2026-09-28', endDate: '2026-09-28' }))).toBe('9월 28일(월)')
  })
})

describe('groupEventsByMonth', () => {
  test('시작일의 달로 묶는다', () => {
    // Arrange
    const events = [
      event({ title: 'A', startDate: '2026-10-13' }),
      event({ title: 'B', startDate: '2026-10-20' }),
      event({ title: 'C', startDate: '2027-01-05' }),
    ]

    // Act
    const months = groupEventsByMonth(events)

    // Assert
    expect(months.map((month) => [month.label, month.events.map((item) => item.title)])).toEqual([
      ['2026년 10월', ['A', 'B']],
      ['2027년 1월', ['C']],
    ])
  })
})
