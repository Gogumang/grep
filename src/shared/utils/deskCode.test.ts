import { describe, expect, test } from 'bun:test'
import type { DeskCatalog, DeskLayout } from '../types'
import { DeskCodeError, decodeDeskCode, encodeDeskCode } from './deskCode'

const catalog: DeskCatalog = {
  items: new Map([
    ['mug', { id: 'mug', category: 'drink', label: '머그', icon: '☕', width: 10, depth: 10 }],
    ['monitor-27', { id: 'monitor-27', category: 'monitor', label: '모니터', icon: '🖥️', width: 60, depth: 20 }],
  ]),
  surfaces: new Map([['oak', { id: 'oak', label: '오크', width: 140, depth: 70, topColor: '#fff', legColor: '#000' }]]),
  categoryLimits: { monitor: 2, keyboard: 1, mouse: 1, drink: 2, plant: 3, lamp: 1, audio: 2, decor: 4 },
}

describe('encodeDeskCode / decodeDeskCode', () => {
  test('인코딩한 배치를 다시 풀면 물건·좌표·회전이 그대로다', () => {
    // Arrange
    const layout: DeskLayout = {
      surfaceId: 'oak',
      items: [
        { key: 'x', itemId: 'monitor-27', x: 0, z: -20, rotation: 0 },
        { key: 'y', itemId: 'mug', x: -45, z: 15, rotation: 3 },
      ],
    }

    // Act
    const code = encodeDeskCode(layout)
    const decoded = decodeDeskCode(code, catalog)

    // Assert
    expect(code).toBe('v1.oak.monitor-27:0:-20:0,mug:-45:15:3')
    expect(decoded.surfaceId).toBe('oak')
    expect(decoded.items.map(({ itemId, x, z, rotation }) => ({ itemId, x, z, rotation }))).toEqual([
      { itemId: 'monitor-27', x: 0, z: -20, rotation: 0 },
      { itemId: 'mug', x: -45, z: 15, rotation: 3 },
    ])
    expect(decoded.unknownItemIds).toEqual([])
  })

  test('빈 책상도 오간다', () => {
    const decoded = decodeDeskCode(encodeDeskCode({ surfaceId: 'oak', items: [] }), catalog)
    expect(decoded.items).toEqual([])
  })

  test('같은 물건 두 개는 서로 다른 key를 받는다', () => {
    const decoded = decodeDeskCode('v1.oak.mug:0:0:0,mug:20:0:0', catalog)
    const keys = decoded.items.map((item) => item.key)
    expect(new Set(keys).size).toBe(2)
  })

  test('카탈로그에서 빠진 물건은 그 물건만 빼고 id를 알린다', () => {
    const decoded = decodeDeskCode('v1.oak.mug:0:0:0,retired-thing:5:5:0', catalog)
    expect(decoded.items.map((item) => item.itemId)).toEqual(['mug'])
    expect(decoded.unknownItemIds).toEqual(['retired-thing'])
  })

  test.each([
    ['버전 접두어 없음', 'oak.mug:0:0:0'],
    ['상판 구분자 없음', 'v1.oak'],
    ['모르는 상판', 'v1.glass.mug:0:0:0'],
    ['숫자가 아닌 좌표', 'v1.oak.mug:a:0:0'],
    ['범위 밖 회전', 'v1.oak.mug:0:0:4'],
    ['필드 부족', 'v1.oak.mug:0:0'],
  ])('형식이 틀리면(%s) 빈 책상 대신 DeskCodeError를 던진다', (_, code) => {
    expect(() => decodeDeskCode(code, catalog)).toThrow(DeskCodeError)
  })

  test('물건이 너무 많은 링크는 거절한다', () => {
    const code = `v1.oak.${Array.from({ length: 61 }, () => 'mug:0:0:0').join(',')}`
    expect(() => decodeDeskCode(code, catalog)).toThrow(DeskCodeError)
  })
})
