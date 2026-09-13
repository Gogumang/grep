import { describe, expect, test } from 'bun:test'
import { parseEventsTable } from './events'

const HEADER =
  '| 행사명 | 주소 | 주최 | 시작일 | 종료일 | 장소 | 신청 마감 | 참가비 |\n| --- | --- | --- | --- | --- | --- | --- | --- |'

describe('parseEventsTable', () => {
  test('표의 행을 행사로 읽고 빈 칸은 null로 둔다', () => {
    // Arrange
    const markdown = [
      '# 이벤트',
      '',
      '설명 문단',
      '',
      HEADER,
      '| if(kakao)26 | https://if.kakao.com/2026 | 카카오 | 2026-10-13 | 2026-10-14 | Kakao AI Campus | 2026-09-28 | 무료 |',
      '| 밋업 | https://example.com | 커뮤니티 | 2026-11-02 | | | | |',
    ].join('\n')

    // Act
    const events = parseEventsTable(markdown)

    // Assert
    expect(events).toEqual([
      {
        title: 'if(kakao)26',
        url: 'https://if.kakao.com/2026',
        host: '카카오',
        startDate: '2026-10-13',
        endDate: '2026-10-14',
        place: 'Kakao AI Campus',
        registrationDeadline: '2026-09-28',
        price: '무료',
      },
      {
        title: '밋업',
        url: 'https://example.com',
        host: '커뮤니티',
        startDate: '2026-11-02',
        // 종료일을 비우면 하루짜리 행사
        endDate: '2026-11-02',
        place: null,
        registrationDeadline: null,
        price: null,
      },
    ])
  })

  test('날짜 형식이 틀리면 몇 번째 행인지와 예시를 담아 실패한다', () => {
    const markdown = `${HEADER}\n| 밋업 | https://example.com | 커뮤니티 | 2026.11.02 | | | | |`

    expect(() => parseEventsTable(markdown)).toThrow(
      'events.md 1번째 행(밋업): 시작일은 YYYY-MM-DD 형식이어야 합니다 (예: 2026-10-13), 입력값: 2026.11.02',
    )
  })

  test('종료일이 시작일보다 앞서면 실패한다', () => {
    const markdown = `${HEADER}\n| 밋업 | https://example.com | 커뮤니티 | 2026-11-02 | 2026-11-01 | | | |`

    expect(() => parseEventsTable(markdown)).toThrow('종료일(2026-11-01)이 시작일(2026-11-02)보다 앞섭니다')
  })

  test('주소가 http(s)가 아니면 실패한다', () => {
    const markdown = `${HEADER}\n| 밋업 | if.kakao.com | 커뮤니티 | 2026-11-02 | | | | |`

    expect(() => parseEventsTable(markdown)).toThrow('주소는 http(s)로 시작해야 합니다')
  })
})
