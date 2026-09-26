import { describe, expect, test } from 'bun:test'
import type { DeskCatalog, DeskItem, DeskLayout, DeskSurface, PlacedItem } from '../types'
import { addItem, canPlace, moveItem, planAddition, rotateItem, settleLayout, snapToGrid, swapItem } from './deskLayout'

const SURFACES: DeskSurface[] = [
  { id: 'wide', label: '넓은', width: 100, depth: 60, topColor: '#fff', legColor: '#000' },
  { id: 'tiny', label: '작은', width: 40, depth: 30, topColor: '#fff', legColor: '#000' },
]
const ITEMS: DeskItem[] = [
  { id: 'box', category: 'decor', label: '상자', icon: '📦', width: 20, depth: 10 },
  { id: 'big-box', category: 'decor', label: '큰 상자', icon: '📦', width: 40, depth: 20 },
  { id: 'long', category: 'monitor', label: '긴 막대', icon: '📏', width: 80, depth: 10 },
]
const catalog: DeskCatalog = {
  items: new Map(ITEMS.map((item) => [item.id, item])),
  surfaces: new Map(SURFACES.map((surface) => [surface.id, surface])),
  categoryLimits: { monitor: 2, keyboard: 1, mouse: 1, drink: 2, plant: 3, lamp: 1, audio: 2, decor: 4 },
}

function placed(overrides: Partial<PlacedItem>): PlacedItem {
  return { key: 'a', itemId: 'box', x: 0, z: 0, rotation: 0, ...overrides }
}

function layoutOf(...items: PlacedItem[]): DeskLayout {
  return { surfaceId: 'wide', items }
}

describe('snapToGrid', () => {
  test('5cm 격자로 반올림하고 -0을 내지 않는다', () => {
    expect(snapToGrid(12)).toBe(10)
    expect(snapToGrid(13)).toBe(15)
    expect(Object.is(snapToGrid(-2), 0)).toBe(true)
  })
})

describe('moveItem', () => {
  test('상판 밖으로 끌면 가장자리에 붙어 멈춘다', () => {
    // Arrange
    const layout = layoutOf(placed({}))

    // Act
    const moved = moveItem(layout, 'a', { x: 500, z: -500 }, catalog)

    // Assert — 상판 100×60, 상자 20×10 이면 중심은 x ±40, z ±25 까지
    expect(moved.items[0]).toMatchObject({ x: 40, z: -25 })
  })

  test('대각선 목적지가 막히면 막히지 않은 축으로만 미끄러진다', () => {
    // Arrange — 오른쪽(x 25)에 다른 상자가 있다
    const layout = layoutOf(placed({ key: 'a', x: 0, z: 0 }), placed({ key: 'b', x: 25, z: 0 }))

    // Act — 오른쪽 아래로 끈다. (10, 3)은 b와 겹친다
    const moved = moveItem(layout, 'a', { x: 10, z: 3 }, catalog)

    // Assert — x는 막히고 z만 움직인다
    expect(moved.items[0]).toMatchObject({ x: 0, z: 3 })
  })

  test('어느 쪽으로도 못 가면 같은 배치 객체를 그대로 돌려준다', () => {
    const layout = layoutOf(placed({ key: 'a', x: 0, z: 0 }), placed({ key: 'b', x: 10, z: 5 }))
    // 이미 겹친 상태에서 겹친 쪽으로 더 끌어도 새 배치를 만들지 않는다
    expect(moveItem(layout, 'a', { x: 5, z: 5 }, catalog)).toBe(layout)
  })
})

describe('rotateItem', () => {
  test('돌리면 좌우·앞뒤 폭이 바뀌어 옆 물건과의 겹침 판정도 바뀐다', () => {
    // Arrange — 20×10 상자 둘이 앞뒤로 맞닿아 있다
    const layout = layoutOf(placed({ key: 'a', x: 0, z: 0 }), placed({ key: 'b', x: 0, z: 10 }))

    // Act — a를 돌리면 10×20이 되어 제자리에서는 b와 겹친다
    const rotated = rotateItem(layout, 'a', catalog)

    // Assert — 겹치지 않는 가장 가까운 자리로 옮겨 앉는다
    expect(rotated).not.toBeNull()
    const [a] = rotated?.items ?? []
    expect(a?.rotation).toBe(1)
    expect(rotated && a ? canPlace(rotated, a, catalog) : false).toBe(true)
  })

  test('돌린 폭이 상판보다 길면 돌리지 않는다', () => {
    const layout = layoutOf(placed({ key: 'a', itemId: 'long' }))
    // 80cm 막대를 세우면 앞뒤 80cm — 깊이 60cm 상판에 안 들어간다
    expect(rotateItem(layout, 'a', catalog)).toBeNull()
  })
})

describe('swapItem', () => {
  test('같은 자리에서 바꾸고, 커져서 겹치면 가장 가까운 빈자리로 옮긴다', () => {
    // Arrange
    const layout = layoutOf(placed({ key: 'a', x: 0, z: 0 }), placed({ key: 'b', x: 30, z: 0 }))

    // Act — 40×20 상자는 x 0에서 b(20..40)와 겹친다
    const swapped = swapItem(layout, 'a', 'big-box', catalog)

    // Assert
    const [a] = swapped?.items ?? []
    expect(a?.itemId).toBe('big-box')
    expect(swapped && a ? canPlace(swapped, a, catalog) : false).toBe(true)
  })
})

describe('addItem', () => {
  test('가운데가 차 있으면 가장 가까운 빈자리에 올린다', () => {
    const layout = layoutOf(placed({ key: 'a', x: 0, z: 0 }))
    const added = addItem(layout, 'box', 'b', catalog)
    const b = added?.items.find((item) => item.key === 'b')
    expect(b).toBeDefined()
    expect(added && b ? canPlace(added, b, catalog) : false).toBe(true)
  })

  test('자리가 없으면 null — 겹쳐서 올리지 않는다', () => {
    const full: DeskLayout = { surfaceId: 'tiny', items: [placed({ key: 'a', itemId: 'big-box', x: 0, z: 0 })] }
    // 40×30 상판을 40×20 상자가 차지하면 남은 앞뒤 10cm에 20×10 상자는 들어가지만, 큰 상자는 못 들어간다
    expect(addItem(full, 'big-box', 'b', catalog)).toBeNull()
  })
})

describe('settleLayout', () => {
  test('작은 상판으로 바꾸면 들어가는 만큼만 앉히고 뺀 개수를 알린다', () => {
    // Arrange — 넓은 상판에 큰 상자 셋
    const items = [
      placed({ key: 'a', itemId: 'big-box', x: -30, z: 0 }),
      placed({ key: 'b', itemId: 'big-box', x: 30, z: 0 }),
      placed({ key: 'c', itemId: 'long', x: 0, z: 25 }),
    ]

    // Act — 40×30 상판에는 큰 상자 하나만 들어가고 80cm 막대는 아예 안 들어간다
    const { layout, removedCount } = settleLayout('tiny', items, catalog)

    // Assert
    expect(layout.items.map((item) => item.key)).toEqual(['a'])
    expect(removedCount).toBe(2)
  })

  test('상판 밖 좌표로 들어온 물건은 안쪽으로 당겨 앉힌다', () => {
    const { layout } = settleLayout('wide', [placed({ x: 999, z: -999 })], catalog)
    expect(layout.items[0]).toMatchObject({ x: 40, z: -25 })
  })
})

describe('planAddition', () => {
  const limited: DeskCatalog = { ...catalog, categoryLimits: { ...catalog.categoryLimits, decor: 1, monitor: 2 } }

  test('상한이 1인 분류에 이미 있으면 새로 올리지 않고 있던 것을 바꾼다', () => {
    const layout = layoutOf(placed({ key: 'a', itemId: 'box' }))
    expect(planAddition(layout, 'big-box', limited)).toEqual({ kind: 'replace', key: 'a' })
  })

  test('상한이 여럿인 분류는 상한까지 올리고 그다음은 막는다', () => {
    const one = layoutOf(placed({ key: 'a', itemId: 'long', x: 0, z: -20 }))
    const two = layoutOf(
      placed({ key: 'a', itemId: 'long', x: 0, z: -20 }),
      placed({ key: 'b', itemId: 'long', x: 0, z: 0 }),
    )
    expect(planAddition(one, 'long', limited)).toEqual({ kind: 'add' })
    expect(planAddition(two, 'long', limited)).toEqual({ kind: 'full', limit: 2 })
  })

  test('링크로 상한을 넘겨 들어온 물건은 settleLayout이 빼고 개수를 센다', () => {
    const items = [placed({ key: 'a', itemId: 'box', x: -20 }), placed({ key: 'b', itemId: 'box', x: 20 })]
    const { layout, removedCount } = settleLayout('wide', items, limited)
    expect(layout.items.map((item) => item.key)).toEqual(['a'])
    expect(removedCount).toBe(1)
  })
})
