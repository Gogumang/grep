import { describe, expect, test } from 'bun:test'
import { canPlace } from '@/shared/utils/deskLayout'
import { CATEGORY_LABELS, DEFAULT_LAYOUT, DESK_CATALOG } from './catalog'

describe('책상 카탈로그', () => {
  test('모든 크기가 짝수 cm라 가장자리 좌표가 정수로 떨어진다', () => {
    const sizes = [...DESK_CATALOG.items.values(), ...DESK_CATALOG.surfaces.values()].flatMap((entry) => [
      [entry.id, entry.width],
      [entry.id, entry.depth],
    ])
    const odd = sizes.filter(([, size]) => Number(size) % 2 !== 0)
    expect(odd, `odd sizes: ${JSON.stringify(odd)}`).toEqual([])
  })

  test('id는 공유 링크 형식(소문자·숫자·하이픈)만 쓴다', () => {
    const ids = [...DESK_CATALOG.items.keys(), ...DESK_CATALOG.surfaces.keys()]
    expect(ids.filter((id) => !/^[a-z0-9-]+$/.test(id))).toEqual([])
  })

  test('모든 물건의 분류에 탭 이름이 있다', () => {
    const categories = new Set([...DESK_CATALOG.items.values()].map((item) => item.category))
    expect([...categories].filter((category) => !(category in CATEGORY_LABELS))).toEqual([])
  })

  test('기본 배치는 겹치거나 상판을 벗어난 물건이 없다', () => {
    const invalid = DEFAULT_LAYOUT.items.filter((item) => !canPlace(DEFAULT_LAYOUT, item, DESK_CATALOG))
    expect(invalid.map((item) => item.key)).toEqual([])
  })
})
