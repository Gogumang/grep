import { describe, expect, test } from 'bun:test'
import type { TechEvent } from '../types'
import { formatEventPrice, formatEventSchedule, selectUpcomingEvents, toSeoulDate } from './eventDates'

function event(overrides: Partial<TechEvent>): TechEvent {
  return {
    id: 'event',
    title: '행사',
    url: 'https://ticketa.co/event/event',
    host: '주최',
    startDate: '2026-10-13',
    startTime: '10:00',
    endDate: '2026-10-13',
    place: null,
    isOnline: false,
    lowestPrice: null,
    highestPrice: null,
    ...overrides,
  }
}

describe('selectUpcomingEvents', () => {
  test('한국 날짜로 끝난 행사를 뺀다 — UTC로는 아직 전날이어도', () => {
    // Arrange — UTC 10월 14일 15:30은 한국 10월 15일 00:30
    const now = new Date('2026-10-14T15:30:00Z')
    const events = [
      event({ title: '어제 끝남', startDate: '2026-10-13', endDate: '2026-10-14' }),
      event({ title: '오늘 저녁', startDate: '2026-10-15', startTime: '19:00', endDate: '2026-10-15' }),
      event({ title: '오늘 오전', startDate: '2026-10-15', startTime: '09:30', endDate: '2026-10-15' }),
      event({ title: '진행 중', startDate: '2026-10-01', endDate: '2026-10-20' }),
    ]

    // Act
    const upcoming = selectUpcomingEvents(events, now)

    // Assert
    expect(toSeoulDate(now)).toBe('2026-10-15')
    expect(upcoming.map((item) => item.title)).toEqual(['진행 중', '오늘 오전', '오늘 저녁'])
  })
})

describe('formatEventSchedule', () => {
  test('하루짜리 행사는 날짜와 시작 시각을 적는다', () => {
    expect(formatEventSchedule(event({ startDate: '2026-11-07', startTime: '11:00', endDate: '2026-11-07' }))).toBe(
      '11월 7일(토) 11:00',
    )
  })

  test('같은 달이면 끝나는 날의 달을 생략한다', () => {
    expect(formatEventSchedule(event({ startDate: '2026-10-13', endDate: '2026-10-14' }))).toBe(
      '10월 13일(화) 10:00 – 14일(수)',
    )
  })

  test('달이 바뀌면 끝나는 날에도 달을 적는다', () => {
    expect(formatEventSchedule(event({ startDate: '2026-10-31', endDate: '2026-11-01' }))).toBe(
      '10월 31일(토) 10:00 – 11월 1일(일)',
    )
  })
})

describe('formatEventPrice', () => {
  test('0원은 무료, 범위가 있으면 범위로 적는다', () => {
    expect(formatEventPrice(event({ lowestPrice: 0, highestPrice: 0 }))).toBe('무료')
    expect(formatEventPrice(event({ lowestPrice: 10000, highestPrice: 10000 }))).toBe('10,000원')
    expect(formatEventPrice(event({ lowestPrice: 69000, highestPrice: 150000 }))).toBe('69,000원 ~ 150,000원')
    expect(formatEventPrice(event({ lowestPrice: 0, highestPrice: 11000 }))).toBe('무료 ~ 11,000원')
  })

  test('원문에 가격이 없으면 무료로 적지 않고 null이다', () => {
    expect(formatEventPrice(event({ lowestPrice: null, highestPrice: null }))).toBeNull()
  })
})
