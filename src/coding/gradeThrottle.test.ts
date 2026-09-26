import { describe, expect, test } from 'bun:test'
import {
  COOLDOWN_MS,
  MAX_GRADES_PER_WINDOW,
  nextAllowedAt,
  parseHistory,
  recordGrade,
  WINDOW_MS,
} from './gradeThrottle'

const NOW = 1_000_000

describe('nextAllowedAt', () => {
  test('기록이 없으면 바로 채점할 수 있다', () => {
    expect(nextAllowedAt([], NOW)).toBe(NOW)
  })

  test('방금 채점했으면 대기 시간이 지나야 다시 할 수 있다', () => {
    expect(nextAllowedAt([NOW - 1_000], NOW)).toBe(NOW - 1_000 + COOLDOWN_MS)
    expect(nextAllowedAt([NOW - COOLDOWN_MS], NOW)).toBe(NOW)
  })

  test('1분에 정해진 횟수를 채우면 가장 오래된 채점이 1분을 벗어날 때까지 막는다', () => {
    // Arrange — 대기 시간보다 넉넉한 간격으로 1분 안에 꽉 채운다
    const oldest = NOW - 50_000
    const history = Array.from({ length: MAX_GRADES_PER_WINDOW }, (_, index) => oldest + index * 100)

    // Act
    const allowedAt = nextAllowedAt(history, NOW + COOLDOWN_MS)

    // Assert
    expect(allowedAt).toBe(oldest + WINDOW_MS)
  })

  test('1분이 지난 기록은 세지 않는다', () => {
    const history = Array.from({ length: MAX_GRADES_PER_WINDOW }, () => NOW - WINDOW_MS - 1)
    expect(nextAllowedAt(history, NOW)).toBe(NOW)
  })
})

test('기록할 때 1분 지난 기록은 버린다', () => {
  expect(recordGrade([NOW - WINDOW_MS - 1, NOW - 10], NOW)).toEqual([NOW - 10, NOW])
})

test('저장소 값이 깨져 있어도 숫자 기록만 남긴다', () => {
  expect(parseHistory(null)).toEqual([])
  expect(parseHistory('not json')).toEqual([])
  expect(parseHistory('{"a":1}')).toEqual([])
  expect(parseHistory('[1, "2", null, 3]')).toEqual([1, 3])
})
