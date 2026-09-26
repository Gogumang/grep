import { describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { ASSET_CREDITS, HDRI_URL, modelUrlOf, textureUrlsOf } from './assets'
import { DESK_CATALOG } from './catalog'

const publicPathOf = (url: string) => path.join(process.cwd(), 'public', url)

describe('책상 3D 에셋', () => {
  test('모델이 있는 물건은 모두 카탈로그에 있고 파일도 있다', () => {
    const itemIds = [...DESK_CATALOG.items.keys()].filter((itemId) => modelUrlOf(itemId))
    const missing = itemIds.map((itemId) => modelUrlOf(itemId) ?? '').filter((url) => !existsSync(publicPathOf(url)))
    expect(itemIds.length).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })

  test('상판 재질과 HDRI 파일이 있다', () => {
    const textureNames = [...DESK_CATALOG.surfaces.values()].flatMap((surface) => surface.texture ?? [])
    const urls = [...textureNames.flatMap((name) => Object.values(textureUrlsOf(name))), HDRI_URL]
    expect(urls.filter((url) => !existsSync(publicPathOf(url)))).toEqual([])
  })

  test('모든 에셋에 출처(작가·원본 주소·라이선스)가 있다', () => {
    const incomplete = ASSET_CREDITS.filter((credit) => !credit.author || !credit.sourceUrl || !credit.license)
    expect(incomplete.map((credit) => credit.file)).toEqual([])
  })
})
