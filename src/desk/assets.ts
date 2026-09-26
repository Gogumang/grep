import manifest from './assets.json'

/**
 * scripts/fetchDeskAssets.mjs가 구워 둔 3D 에셋과 출처. assets.json은 그 스크립트만 고친다.
 * 모델이 없는 물건은 itemModels.tsx의 기본 도형 모델로 그린다.
 */
export interface AssetCredit {
  file: string
  title: string
  author: string
  sourceUrl: string
  license: string
}

const MODELS: Record<string, AssetCredit> = manifest.models

export function modelUrlOf(itemId: string): string | undefined {
  return MODELS[itemId]?.file
}

/** 텍스처 이름(oak·walnut·floor)의 diff·nor·rough 세 장. */
export function textureUrlsOf(name: string): { map: string; normalMap: string; roughnessMap: string } {
  const base = `/desk/textures/${name}`
  return { map: `${base}_diff.webp`, normalMap: `${base}_nor.webp`, roughnessMap: `${base}_rough.webp` }
}

export const HDRI_URL = manifest.hdri.file

/** 페이지에 출처로 싣는 목록. CC0은 표기 의무가 없지만 만든 사람을 밝혀 둔다. */
export const ASSET_CREDITS: AssetCredit[] = [
  ...Object.values(MODELS),
  ...Object.values(manifest.textures),
  manifest.hdri,
]
