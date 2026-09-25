import { describe, expect, test } from 'bun:test'
import type { TechEvent } from '../../shared/types'
import { searchEvents } from './eventSearch'

function event(overrides: Partial<TechEvent>): TechEvent {
  return {
    id: 'c9xsstcs',
    title: 'Flutter Korea 2026',
    url: 'https://ticketa.co/event/c9xsstcs',
    host: 'Flutter Seoul',
    startDate: '2026-11-07',
    startTime: '11:00',
    endDate: '2026-11-07',
    place: '아마존 코리아',
    isOnline: false,
    lowestPrice: 10000,
    highestPrice: 20000,
    source: '티켓타코',
    ...overrides,
  }
}

describe('searchEvents', () => {
  test('끝난 행사는 빼고 주최·장소·일정을 한 줄로 붙여 판매처 페이지로 보낸다', () => {
    // Arrange — UTC 16:00은 한국 다음 날 01:00. 9월 25일에 끝난 행사는 한국 기준으로 이미 끝났다.
    const now = new Date('2026-09-25T16:00:00Z')
    const events = [
      event({ id: 'ended', url: 'https://ticketa.co/event/ended', startDate: '2026-09-25', endDate: '2026-09-25' }),
      event({}),
    ]

    // Act
    const results = searchEvents(events, 'flutter 아마존', now, 8)

    // Assert
    expect(results.map((result) => result.url)).toEqual(['https://ticketa.co/event/c9xsstcs'])
    expect(results[0]?.meta).toBe('Flutter Seoul · 아마존 코리아 · 11월 7일(토) 11:00')
  })

  test('온라인 행사는 장소 대신 온라인으로 보이고 온라인으로도 찾힌다', () => {
    const now = new Date('2026-09-25T00:00:00Z')
    const online = event({ id: 'online', url: 'https://ticketa.co/event/online', place: null, isOnline: true })

    const results = searchEvents([online, event({})], '온라인', now, 8)

    expect(results.map((result) => result.url)).toEqual(['https://ticketa.co/event/online'])
    expect(results[0]?.meta).toBe('Flutter Seoul · 온라인 · 11월 7일(토) 11:00')
  })

  test('낱말이 하나라도 없으면 빠진다 — 블로그 글이나 다른 행사가 섞이지 않는다', () => {
    const now = new Date('2026-09-25T00:00:00Z')
    const kakao = event({ id: 'kakao', title: 'if(kakao)26', host: '카카오', url: 'https://ticketa.co/event/kakao' })

    expect(searchEvents([kakao, event({})], 'kakao flutter', now, 8)).toEqual([])
    expect(searchEvents([kakao, event({})], 'KAKAO', now, 8).map((result) => result.url)).toEqual([
      'https://ticketa.co/event/kakao',
    ])
  })

  test('결과는 상한만큼만 돌려준다', () => {
    const events = Array.from({ length: 12 }, (_, index) => event({ id: `event-${index}` }))

    expect(searchEvents(events, 'flutter', new Date('2026-09-25T00:00:00Z'), 8)).toHaveLength(8)
  })
})
