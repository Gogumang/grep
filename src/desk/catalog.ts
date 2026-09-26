import type { DeskCatalog, DeskCategory, DeskItem, DeskLayout, DeskSurface } from '@/shared/types'

/**
 * 책상 꾸미기 카탈로그. 3D 모델은 components/desk/itemModels.tsx가 같은 id로 그린다.
 *
 * 크기는 책상 위에서 차지할 칸(cm)으로, 실제 제품 치수에 가깝게 잡았다. 스캔 모델(assets.json)은 원본 크기와
 * 상관없이 이 칸에 맞춰 줄여 그린다 — 받은 모델의 단위(cm·m)나 원래 크기(바닥용 화분 등)가 제각각이다.
 * 전부 짝수다 — 가장자리에 붙일 때 중심 좌표가 (상판 폭 - 물건 폭) / 2 로 계산되는데,
 * 홀수면 x.5가 나와 링크(정수 좌표)에 담기지 않는다.
 *
 * id는 공유 링크에 그대로 들어간다. 이미 퍼진 링크가 깨지므로 바꾸거나 지우지 않는다.
 */
const SURFACES: DeskSurface[] = [
  { id: 'oak', label: '오크 140', width: 140, depth: 70, topColor: '#c9a47c', legColor: '#2a2a2a', texture: 'oak' },
  {
    id: 'walnut',
    label: '월넛 160',
    width: 160,
    depth: 80,
    topColor: '#6e4b33',
    legColor: '#1c1c1c',
    texture: 'walnut',
  },
  { id: 'white', label: '화이트 120', width: 120, depth: 60, topColor: '#efebe5', legColor: '#d6d6d6' },
]

/**
 * 개발자들이 많이 쓰는 실제 제품. 크기는 제조사 공식 치수(가로×세로)를 짝수 cm로 반올림했다.
 * 제품명은 알아보라고 쓰는 것이고 로고·상표 이미지는 싣지 않는다.
 * 스캔 모델(assets.json)이 없는 물건은 itemModels.tsx의 도형 모델로 그린다 — 모니터·노트북은 일부러 도형이다
 * (실제 코드 화면을 띄워야 해서).
 */
const ITEMS: DeskItem[] = [
  { id: 'monitor-27', category: 'monitor', label: 'LG 27UP850 4K', icon: '🖥️', width: 62, depth: 22 },
  { id: 'monitor-24', category: 'monitor', label: 'Dell UltraSharp 24 (U2424H)', icon: '🖥️', width: 54, depth: 18 },
  { id: 'monitor-studio', category: 'monitor', label: 'Apple Studio Display', icon: '🖥️', width: 62, depth: 18 },
  { id: 'monitor-ultrawide', category: 'monitor', label: 'LG 34WN80C 울트라와이드', icon: '🖥️', width: 82, depth: 24 },
  { id: 'laptop', category: 'monitor', label: 'MacBook Pro 14', icon: '💻', width: 32, depth: 22 },

  { id: 'keyboard-65', category: 'keyboard', label: 'HHKB Professional', icon: '⌨️', width: 30, depth: 12 },
  { id: 'keyboard-tkl', category: 'keyboard', label: 'Keychron K8', icon: '⌨️', width: 36, depth: 12 },
  { id: 'keyboard-keychron-v2', category: 'keyboard', label: 'Keychron V2', icon: '⌨️', width: 32, depth: 12 },
  { id: 'keyboard-full', category: 'keyboard', label: 'Keychron Q6 Max', icon: '⌨️', width: 46, depth: 14 },
  { id: 'keyboard-magic', category: 'keyboard', label: 'Apple Magic Keyboard', icon: '⌨️', width: 42, depth: 12 },
  { id: 'keyboard-split', category: 'keyboard', label: 'ZSA Moonlander', icon: '⌨️', width: 46, depth: 16 },

  { id: 'mouse', category: 'mouse', label: 'Logitech MX Master 3S', icon: '🖱️', width: 8, depth: 12 },
  { id: 'mouse-magic', category: 'mouse', label: 'Apple Magic Mouse', icon: '🖱️', width: 6, depth: 12 },
  { id: 'trackpad', category: 'mouse', label: 'Apple Magic Trackpad', icon: '🖱️', width: 16, depth: 12 },

  { id: 'mug-coffee', category: 'drink', label: '커피 머그', icon: '☕', width: 12, depth: 10 },
  { id: 'can-energy', category: 'drink', label: '에너지 드링크', icon: '🥫', width: 6, depth: 6 },
  { id: 'tumbler', category: 'drink', label: '텀블러', icon: '🥤', width: 8, depth: 8 },

  { id: 'plant-monstera', category: 'plant', label: '관엽 화분', icon: '🪴', width: 20, depth: 20 },
  { id: 'cactus', category: 'plant', label: '다육 화분', icon: '🌵', width: 10, depth: 10 },

  { id: 'desk-lamp', category: 'lamp', label: '암 스탠드', icon: '💡', width: 12, depth: 30 },
  { id: 'lamp-orb', category: 'lamp', label: '무드등', icon: '🔮', width: 12, depth: 12 },

  { id: 'headphones-xm5', category: 'audio', label: 'Sony WH-1000XM5', icon: '🎧', width: 18, depth: 10 },
  { id: 'headphone-stand', category: 'audio', label: '헤드폰 거치대', icon: '🎧', width: 14, depth: 14 },
  { id: 'speaker', category: 'audio', label: '북쉘프 스피커', icon: '🔊', width: 12, depth: 14 },

  { id: 'stream-deck', category: 'decor', label: 'Elgato Stream Deck MK.2', icon: '🎛️', width: 12, depth: 8 },
  { id: 'rubber-duck', category: 'decor', label: '러버덕', icon: '🦆', width: 8, depth: 8 },
  { id: 'books', category: 'decor', label: '책 세트', icon: '📚', width: 34, depth: 10 },
  { id: 'sticky-notes', category: 'decor', label: '포스트잇', icon: '📝', width: 8, depth: 8 },
  { id: 'alarm-clock', category: 'decor', label: '탁상시계', icon: '⏰', width: 10, depth: 6 },
]

export const DESK_CATALOG: DeskCatalog = {
  items: new Map(ITEMS.map((item) => [item.id, item])),
  surfaces: new Map(SURFACES.map((surface) => [surface.id, surface])),
  // 실제 책상 기준. 듀얼 모니터·스피커 한 쌍은 흔하지만 키보드·마우스·스탠드가 여럿이면 어색하다.
  categoryLimits: { monitor: 2, keyboard: 1, mouse: 1, drink: 2, plant: 3, lamp: 1, audio: 2, decor: 4 },
}

/** 카탈로그 탭 순서이자 이름. */
export const CATEGORY_LABELS: Record<DeskCategory, string> = {
  monitor: '모니터',
  keyboard: '키보드',
  mouse: '마우스',
  drink: '음료',
  plant: '식물',
  lamp: '조명',
  audio: '오디오',
  decor: '소품',
}

/** 링크도 저장된 배치도 없을 때 처음 보여 주는 책상. 빈 상판보다 "이렇게 꾸미는 거구나"가 먼저 보인다. */
export const DEFAULT_LAYOUT: DeskLayout = {
  surfaceId: 'oak',
  items: [
    { key: 'monitor-27-0', itemId: 'monitor-27', x: 0, z: -20, rotation: 0 },
    { key: 'keyboard-tkl-1', itemId: 'keyboard-tkl', x: -5, z: 15, rotation: 0 },
    { key: 'mouse-2', itemId: 'mouse', x: 25, z: 15, rotation: 0 },
    { key: 'mug-coffee-3', itemId: 'mug-coffee', x: -45, z: 15, rotation: 0 },
    { key: 'plant-monstera-4', itemId: 'plant-monstera', x: -55, z: -20, rotation: 0 },
    { key: 'desk-lamp-5', itemId: 'desk-lamp', x: 58, z: -15, rotation: 0 },
    { key: 'rubber-duck-6', itemId: 'rubber-duck', x: 40, z: -5, rotation: 0 },
  ],
}
