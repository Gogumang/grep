/**
 * 책상 꾸미기(/desk)의 도메인 타입.
 *
 * 길이는 전부 cm 정수다. 격자 스냅·충돌 판정·공유 링크가 같은 값을 쓰므로
 * 소수 오차가 끼면 "링크로 열었더니 한 칸 밀려 있다" 같은 일이 생긴다.
 * 미터로 바꾸는 건 3D로 그리는 순간에만 한다.
 */

export type DeskCategory = 'monitor' | 'keyboard' | 'mouse' | 'drink' | 'plant' | 'lamp' | 'audio' | 'decor'

/** 책상 위에 올릴 수 있는 물건. width는 회전 0일 때의 좌우(x), depth는 앞뒤(z) 폭이다. */
export interface DeskItem {
  id: string
  category: DeskCategory
  label: string
  /** 카탈로그 버튼에 붙는 이모지. 3D 모델과 별개로 목록에서 알아보기 쉽게 한다. */
  icon: string
  width: number
  depth: number
}

/** 책상 상판. 크기가 다르면 올라가 있던 물건의 배치를 다시 맞춘다. */
export interface DeskSurface {
  id: string
  label: string
  width: number
  depth: number
  topColor: string
  legColor: string
  /** 상판 나뭇결(public/desk/textures/<texture>_*.webp). 없으면 topColor 단색이다. */
  texture?: string
}

/** 90° 단위 회전. 1·3이면 좌우·앞뒤 폭이 뒤바뀐다. */
export type DeskRotation = 0 | 1 | 2 | 3

export interface PlacedItem {
  /** 같은 물건을 두 개 올릴 수 있어서 itemId와 별개로 인스턴스를 구분한다. */
  key: string
  itemId: string
  /** 상판 중심 기준 물건 중심의 좌표(cm). z가 클수록 앉은 사람 쪽이다. */
  x: number
  z: number
  rotation: DeskRotation
}

export interface DeskLayout {
  surfaceId: string
  items: PlacedItem[]
}

export interface DeskCatalog {
  items: ReadonlyMap<string, DeskItem>
  surfaces: ReadonlyMap<string, DeskSurface>
  /** 분류마다 책상에 올릴 수 있는 개수. 1이면 새로 고를 때 있던 것을 바꾼다(키보드 두 개는 어색하다). */
  categoryLimits: Readonly<Record<DeskCategory, number>>
}
