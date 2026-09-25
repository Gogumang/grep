import { describe, expect, test } from 'bun:test'
import type { TechEvent } from '../shared/types'
import { parseEventsFile, parseFeaturedFile, pickFeaturedEvents } from './events'

const FLUTTER_KOREA: TechEvent = {
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
}

function file(events: unknown[]): string {
  return JSON.stringify({ source: '티켓타코', events })
}

describe('parseEventsFile', () => {
  test('collector가 쓴 파일을 행사로 읽고, 온라인 행사의 빈 장소와 없는 가격은 null로 둔다', () => {
    // Arrange
    const online = { ...FLUTTER_KOREA, id: 'qa', place: null, isOnline: true, lowestPrice: null, highestPrice: null }

    // Act
    const events = parseEventsFile(file([FLUTTER_KOREA, online]))

    // Assert
    expect(events).toEqual([FLUTTER_KOREA, online])
  })

  test('날짜 형식이 틀리면 몇 번째 행사인지와 예시를 담아 실패한다', () => {
    const json = file([{ ...FLUTTER_KOREA, startDate: '2026.11.07' }])

    expect(() => parseEventsFile(json)).toThrow(
      'events.json 1번째 행사(Flutter Korea 2026): startDate 값은 2026-10-13 같은 형식이어야 합니다, 입력값: 2026.11.07',
    )
  })

  test('가격이 숫자가 아니면 실패한다 — "무료" 같은 글자를 조용히 받지 않는다', () => {
    const json = file([{ ...FLUTTER_KOREA, lowestPrice: '무료' }])

    expect(() => parseEventsFile(json)).toThrow('lowestPrice 값은 숫자(원)나 null 이어야 합니다, 입력값: 무료')
  })

  test('source 가 없는 옛 파일의 행사는 티켓타코로 읽고, 이벤터스 행사는 이벤터스로 읽는다', () => {
    // Arrange — 이벤터스를 붙이기 전 파일에는 행사마다의 source 가 없다
    const { source: _omitted, ...withoutSource } = FLUTTER_KOREA
    const fromEventus = {
      ...FLUTTER_KOREA,
      id: 'eventus-133741',
      url: 'https://event-us.kr/lablup/event/133741',
      source: '이벤터스',
    }

    // Act
    const events = parseEventsFile(file([withoutSource, fromEventus]))

    // Assert
    expect(events.map((event) => event.source)).toEqual(['티켓타코', '이벤터스'])
  })

  test('모르는 source 는 실패한다 — collector 와 계약이 어긋난 채 배포되지 않게', () => {
    const json = file([{ ...FLUTTER_KOREA, source: 'Meetup' }])

    expect(() => parseEventsFile(json)).toThrow('source 값은 티켓타코·이벤터스 중 하나여야 합니다, 입력값: Meetup')
  })

  test('events 배열이 없으면 실패한다', () => {
    expect(() => parseEventsFile('{"source":"티켓타코"}')).toThrow('events.json 에 events 배열이 없습니다')
  })
})

describe('pickFeaturedEvents', () => {
  test('고른 행사만 받은 순서대로 남기고 이미지를 붙인다 — 목록에 없는 행사(끝남)는 조용히 빠진다', () => {
    // Arrange
    const kakao = { ...FLUTTER_KOREA, id: 'lyohvjgz', title: 'if(kakao)26', startDate: '2026-10-13' }
    const droidKnights = { ...FLUTTER_KOREA, id: '2o8rdpls', title: '드로이드나이츠 2026', startDate: '2026-11-02' }
    const featured = [
      { id: '2o8rdpls', image: '/events/2o8rdpls.avif' },
      { id: 'lyohvjgz', image: '/events/lyohvjgz.avif' },
      { id: 'ended', image: '/events/ended.avif' },
    ]

    // Act
    const picked = pickFeaturedEvents([kakao, FLUTTER_KOREA, droidKnights], featured)

    // Assert
    expect(picked.map((event) => [event.title, event.image])).toEqual([
      ['if(kakao)26', '/events/lyohvjgz.avif'],
      ['드로이드나이츠 2026', '/events/2o8rdpls.avif'],
    ])
  })
})

describe('parseFeaturedFile', () => {
  test('collector가 쓴 파일을 읽는다 — 손으로 올린 사이트 경로와 어드민에서 올린 R2 주소가 섞여 있어도 된다', () => {
    // Arrange
    const json = JSON.stringify({
      events: [
        { id: 'lyohvjgz', image: '/events/lyohvjgz.avif' },
        { id: 'new1', image: 'https://images.gogumang.com/events/new1.avif' },
      ],
    })

    // Act
    const featured = parseFeaturedFile(json)

    // Assert
    expect(featured.map((event) => event.id)).toEqual(['lyohvjgz', 'new1'])
  })

  test('events 배열이 없으면 실패한다 — 빈 목록으로 읽으면 올린 행사가 전부 사라진 채 배포된다', () => {
    expect(() => parseFeaturedFile('{"featured":[]}')).toThrow('featured.json 에 events 배열이 없습니다')
  })

  test('이미지가 사이트 경로도 https 주소도 아니면 몇 번째 행사인지 담아 실패한다', () => {
    expect(() => parseFeaturedFile('{"events":[{"id":"a","image":"http://example.com/a.png"}]}')).toThrow(
      'featured.json 1번째 행사(a)',
    )
  })
})
