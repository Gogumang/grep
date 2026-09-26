import type { DeskCatalog, DeskLayout, DeskRotation, PlacedItem } from '../types'

/**
 * 책상 배치 ↔ 공유 링크 문자열.
 *
 *   v1.<상판id>.<물건id>:<x>:<z>:<회전>,<물건id>:<x>:<z>:<회전>,...
 *   예: v1.oak.monitor-27:0:-20:0,keyboard-tkl:0:15:0
 *
 * 서버가 없어서 배치 전체를 링크(#해시)에 싣는다. 버전 접두어는 카탈로그나 형식이 바뀌어도
 * 이미 퍼진 링크를 계속 열기 위해 둔다 — 형식을 바꾸면 v2를 추가하고 v1 해석은 남긴다.
 */
const VERSION_PREFIX = 'v1.'
const ENTRY_PATTERN = /^([a-z0-9-]+):(-?\d{1,4}):(-?\d{1,4}):([0-3])$/
/** 링크 하나로 브라우저를 멈추게 하지 못하게 한다. 카탈로그를 다 올려도 이보다 적다. */
const MAX_ITEMS = 60

export class DeskCodeError extends Error {}

export function encodeDeskCode(layout: DeskLayout): string {
  const entries = layout.items.map((item) => `${item.itemId}:${item.x}:${item.z}:${item.rotation}`)
  return `${VERSION_PREFIX}${layout.surfaceId}.${entries.join(',')}`
}

/**
 * 형식이 틀리면 DeskCodeError를 던진다 — 망가진 링크를 빈 책상으로 보여 주면
 * 받은 사람은 원래 빈 책상인 줄 안다.
 * 카탈로그에서 빠진 물건은 링크 전체를 버리지 않고 그 물건만 빼서 알린다.
 * 좌표가 상판을 벗어나거나 겹치는지는 여기서 보지 않는다(settleLayout이 맞춘다).
 */
export function decodeDeskCode(
  code: string,
  catalog: DeskCatalog,
): { surfaceId: string; items: PlacedItem[]; unknownItemIds: string[] } {
  const trimmed = code.trim()
  if (!trimmed.startsWith(VERSION_PREFIX)) {
    throw new DeskCodeError(`책상 코드는 ${VERSION_PREFIX}로 시작해야 합니다 (예: v1.oak.mug:0:0:0)`)
  }
  const body = trimmed.slice(VERSION_PREFIX.length)
  const separatorIndex = body.indexOf('.')
  if (separatorIndex < 0) throw new DeskCodeError('책상 코드에 상판 구분자(.)가 없습니다')

  const surfaceId = body.slice(0, separatorIndex)
  if (!catalog.surfaces.has(surfaceId)) throw new DeskCodeError(`모르는 상판입니다: ${surfaceId}`)

  const rawEntries = body.slice(separatorIndex + 1)
  const entries = rawEntries === '' ? [] : rawEntries.split(',')
  if (entries.length > MAX_ITEMS) throw new DeskCodeError(`물건은 ${MAX_ITEMS}개까지 올릴 수 있습니다`)

  const items: PlacedItem[] = []
  const unknownItemIds: string[] = []
  for (const [index, entry] of entries.entries()) {
    const match = ENTRY_PATTERN.exec(entry)
    if (!match) throw new DeskCodeError(`물건 형식은 id:x:z:회전 이어야 합니다 (예: mug:10:-5:0), 입력값: ${entry}`)
    const [, itemId = '', x = '0', z = '0', rotation = '0'] = match
    if (!catalog.items.has(itemId)) {
      unknownItemIds.push(itemId)
      continue
    }
    items.push({
      key: `${itemId}-${index}`,
      itemId,
      x: Number(x),
      z: Number(z),
      rotation: Number(rotation) as DeskRotation,
    })
  }
  return { surfaceId, items, unknownItemIds }
}
