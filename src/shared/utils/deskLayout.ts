import { clamp } from 'es-toolkit'
import type { DeskCatalog, DeskItem, DeskLayout, DeskRotation, DeskSurface, PlacedItem } from '../types'

/** 물건을 새로 고를 때 할 일. add — 빈자리에 올린다, replace — 같은 분류의 있던 것을 바꾼다, full — 상한이라 못 올린다. */
export type AdditionPlan = { kind: 'add' } | { kind: 'replace'; key: string } | { kind: 'full'; limit: number }

/**
 * 드래그·방향키가 움직이는 최소 단위(cm). 블록을 끼우듯 딱딱 맞아떨어지는 손맛을 내면서도
 * 키캡 두세 개 폭보다 거칠지 않다.
 */
export const GRID_CM = 5

interface Point {
  x: number
  z: number
}

interface Footprint {
  width: number
  depth: number
}

interface Rect extends Point, Footprint {}

export function footprintOf(item: DeskItem, rotation: DeskRotation): Footprint {
  return rotation % 2 === 0 ? { width: item.width, depth: item.depth } : { width: item.depth, depth: item.width }
}

export function snapToGrid(value: number): number {
  // `|| 0` — Math.round(-0.4)가 -0을 내서 링크 비교·테스트에서 0과 다르게 취급된다.
  return Math.round(value / GRID_CM) * GRID_CM || 0
}

/** 물건이 상판 밖으로 나가지 않게 좌표를 당긴다. 상판보다 큰 물건(돌린 울트라와이드 등)은 null. */
function clampToSurface(point: Point, footprint: Footprint, surface: DeskSurface): Point | null {
  const maxX = (surface.width - footprint.width) / 2
  const maxZ = (surface.depth - footprint.depth) / 2
  if (maxX < 0 || maxZ < 0) return null
  return { x: clamp(point.x, -maxX, maxX), z: clamp(point.z, -maxZ, maxZ) }
}

/** 상판 안에 있고 다른 물건과 겹치지 않는가. 모서리가 맞닿는 것은 겹침이 아니다. */
export function canPlace(layout: DeskLayout, candidate: PlacedItem, catalog: DeskCatalog): boolean {
  const surface = surfaceOf(catalog, layout.surfaceId)
  const rect = rectOf(candidate, catalog)
  const isInside =
    Math.abs(rect.x) * 2 + rect.width <= surface.width && Math.abs(rect.z) * 2 + rect.depth <= surface.depth
  if (!isInside) return false
  return layout.items.every((other) => other.key === candidate.key || !overlaps(rect, rectOf(other, catalog)))
}

/** candidate 위치에서 가장 가까운 빈자리. 상판 어디에도 안 들어가면 null. */
function findFreeSpot(layout: DeskLayout, candidate: PlacedItem, catalog: DeskCatalog): Point | null {
  const surface = surfaceOf(catalog, layout.surfaceId)
  const footprint = footprintOf(itemOf(catalog, candidate.itemId), candidate.rotation)
  const maxX = (surface.width - footprint.width) / 2
  const maxZ = (surface.depth - footprint.depth) / 2
  if (maxX < 0 || maxZ < 0) return null

  const distance = (spot: Point) => (spot.x - candidate.x) ** 2 + (spot.z - candidate.z) ** 2
  const spots = gridAxis(maxX)
    .flatMap((x) => gridAxis(maxZ).map((z) => ({ x, z })))
    .sort((a, b) => distance(a) - distance(b))
  return spots.find((spot) => canPlace(layout, { ...candidate, ...spot }, catalog)) ?? null
}

/**
 * 드래그·방향키 이동. 막히면 막힌 축만 멈추고 나머지 축으로는 미끄러진다 —
 * 대각선으로 끌다가 옆 물건에 닿았다고 통째로 멈추면 손에 걸리는 느낌이 난다.
 * 어느 쪽으로도 못 가면 원래 배치를 그대로(같은 참조로) 돌려준다.
 */
export function moveItem(layout: DeskLayout, key: string, target: Point, catalog: DeskCatalog): DeskLayout {
  const placed = layout.items.find((item) => item.key === key)
  if (!placed) return layout
  const surface = surfaceOf(catalog, layout.surfaceId)
  const footprint = footprintOf(itemOf(catalog, placed.itemId), placed.rotation)
  const clamped = clampToSurface(target, footprint, surface)
  if (!clamped) return layout

  const attempts = [clamped, { x: clamped.x, z: placed.z }, { x: placed.x, z: clamped.z }]
  const reachable = attempts.find((point) => canPlace(layout, { ...placed, ...point }, catalog))
  if (!reachable || (reachable.x === placed.x && reachable.z === placed.z)) return layout
  return replaceItem(layout, { ...placed, ...reachable })
}

/** 90° 돌린다. 제자리에서 겹치면 가장 가까운 빈자리로 옮기고, 둘 곳이 없으면 null. */
export function rotateItem(layout: DeskLayout, key: string, catalog: DeskCatalog): DeskLayout | null {
  const placed = layout.items.find((item) => item.key === key)
  if (!placed) return null
  const rotation = ((placed.rotation + 1) % 4) as DeskRotation
  const settled = placeNear(layout, { ...placed, rotation }, catalog)
  return settled ? replaceItem(layout, settled) : null
}

/** 같은 자리에서 다른 물건으로 바꾼다. 커져서 겹치면 가장 가까운 빈자리로, 둘 곳이 없으면 null. */
export function swapItem(layout: DeskLayout, key: string, itemId: string, catalog: DeskCatalog): DeskLayout | null {
  const placed = layout.items.find((item) => item.key === key)
  if (!placed) return null
  const settled = placeNear(layout, { ...placed, itemId }, catalog)
  return settled ? replaceItem(layout, settled) : null
}

/**
 * 분류 상한(catalog.categoryLimits)을 보고 새 물건을 어떻게 올릴지 정한다.
 * 상한이 1인 분류(키보드 등)는 막지 않고 있던 것을 바꾼다 — "하나만 된다"보다 "바꿨다"가 덜 막힌다.
 */
export function planAddition(layout: DeskLayout, itemId: string, catalog: DeskCatalog): AdditionPlan {
  const category = itemOf(catalog, itemId).category
  const limit = catalog.categoryLimits[category]
  const sameCategory = layout.items.filter((placed) => itemOf(catalog, placed.itemId).category === category)
  if (sameCategory.length < limit) return { kind: 'add' }
  const latest = sameCategory.at(-1)
  if (limit === 1 && latest) return { kind: 'replace', key: latest.key }
  return { kind: 'full', limit }
}

/** 상판 가운데에서 가장 가까운 빈자리에 올린다. 자리가 없으면 null. 분류 상한은 planAddition이 먼저 본다. */
export function addItem(layout: DeskLayout, itemId: string, key: string, catalog: DeskCatalog): DeskLayout | null {
  const settled = placeNear(layout, { key, itemId, x: 0, z: 0, rotation: 0 }, catalog)
  return settled ? { ...layout, items: [...layout.items, settled] } : null
}

export function removeItem(layout: DeskLayout, key: string): DeskLayout {
  return { ...layout, items: layout.items.filter((item) => item.key !== key) }
}

/**
 * 물건들을 순서대로 상판에 다시 앉힌다. 상판을 바꿀 때와 링크로 연 배치를 믿을 수 없을 때 쓴다.
 * 끝내 자리가 없는 물건은 빼고 그 개수를 알린다 — 조용히 사라지면 사용자는 왜 없는지 모른다.
 */
export function settleLayout(
  surfaceId: string,
  items: readonly PlacedItem[],
  catalog: DeskCatalog,
): { layout: DeskLayout; removedCount: number } {
  let layout: DeskLayout = { surfaceId, items: [] }
  for (const item of items) {
    // 링크로 들어온 배치는 상한을 넘을 수 있다(손으로 고친 링크, 상한을 줄이기 전의 링크).
    if (planAddition(layout, item.itemId, catalog).kind !== 'add') continue
    const settled = placeNear(layout, item, catalog)
    if (settled) layout = { ...layout, items: [...layout.items, settled] }
  }
  return { layout, removedCount: items.length - layout.items.length }
}

function placeNear(layout: DeskLayout, candidate: PlacedItem, catalog: DeskCatalog): PlacedItem | null {
  const surface = surfaceOf(catalog, layout.surfaceId)
  const footprint = footprintOf(itemOf(catalog, candidate.itemId), candidate.rotation)
  const clamped = clampToSurface(candidate, footprint, surface)
  if (!clamped) return null
  const clampedCandidate = { ...candidate, ...clamped }
  if (canPlace(layout, clampedCandidate, catalog)) return clampedCandidate
  const spot = findFreeSpot(layout, clampedCandidate, catalog)
  return spot ? { ...clampedCandidate, ...spot } : null
}

function replaceItem(layout: DeskLayout, next: PlacedItem): DeskLayout {
  return { ...layout, items: layout.items.map((item) => (item.key === next.key ? next : item)) }
}

/** -max..max 사이의 격자점과 양 끝. 끝을 넣어야 가장자리에 딱 붙는 자리도 후보가 된다. */
function gridAxis(max: number): number[] {
  const steps = Math.floor(max / GRID_CM)
  const values = [-max, max]
  for (let step = -steps; step <= steps; step++) values.push(step * GRID_CM || 0)
  return [...new Set(values)]
}

function overlaps(a: Rect, b: Rect): boolean {
  return Math.abs(a.x - b.x) * 2 < a.width + b.width && Math.abs(a.z - b.z) * 2 < a.depth + b.depth
}

function rectOf(placed: PlacedItem, catalog: DeskCatalog): Rect {
  return { x: placed.x, z: placed.z, ...footprintOf(itemOf(catalog, placed.itemId), placed.rotation) }
}

// 레이아웃은 링크를 풀 때(deskCode) 카탈로그와 대조를 마친 뒤에만 들어온다. 여기서 모르는 id는 코드 버그다.
function itemOf(catalog: DeskCatalog, itemId: string): DeskItem {
  const item = catalog.items.get(itemId)
  if (!item) throw new Error(`카탈로그에 없는 물건입니다: ${itemId}`)
  return item
}

function surfaceOf(catalog: DeskCatalog, surfaceId: string): DeskSurface {
  const surface = catalog.surfaces.get(surfaceId)
  if (!surface) throw new Error(`카탈로그에 없는 상판입니다: ${surfaceId}`)
  return surface
}
