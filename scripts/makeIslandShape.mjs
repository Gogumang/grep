/**
 * 메인 별 입자가 모이는 "무인도(야자수 + 비치 의자)" 윤곽선 SVG를 만든다.
 *   node scripts/makeIslandShape.mjs
 *
 * 원본: 사용자가 준 3D 이모지풍 무인도 그림 (447×447, 구글 이미지 썸네일).
 * 50px 격자를 씌워 부위별 좌표를 눈으로 읽었다. 좌표는 모두 원본 픽셀 기준이다.
 * 잎은 밑동–끝을 잇는 두 곡선 사이의 렌즈 모양, 물결·언덕은 손으로 읽은 점을 매끈하게 이은 곡선.
 * 잎맥·줄기 마디·천 줄무늬 같은 안쪽 선은 일부러 뺐다 — 별 수는 정해져 있어 선이 늘면 선마다 별이
 * 성겨져 윤곽이 뭉개진다 (넣어 봤더니 실루엣까지 흐려졌다).
 * 가려진 선을 지우는 방식은 particleShape.mjs 참고.
 */
import {
  capsule,
  isInsideCapsule,
  isInsidePolygon,
  never,
  smoothCurve,
  visibleRuns,
  writeShapeSvg,
} from './particleShape.mjs'

const TARGET = new URL('../public/images/particle-shapes/island.svg', import.meta.url)

// 잎이 모이는 줄기 꼭대기
const CROWN = [148, 92]
// tip: 잎 끝, width: 가운데 폭의 절반,
// arch: 잎 중심선이 휘는 정도 — 밑동→끝 방향의 오른쪽(화면 기준)이 +다. 야자 잎은 우산처럼
// 바깥·위로 부풀어야 하므로 잎마다 부호가 다르다 (왼쪽으로 뻗는 잎은 +, 오른쪽으로 뻗는 잎은 -)
const LEAVES = [
  { tip: [68, 52], arch: 18, width: 24 },
  { tip: [50, 163], arch: 30, width: 32 },
  { tip: [103, 188], arch: 16, width: 24 },
  { tip: [200, 28], arch: -16, width: 22 },
  { tip: [256, 110], arch: -26, width: 30 },
  { tip: [228, 166], arch: -22, width: 28 },
]
// 줄기는 위에서 아래로 살짝 휘며 밑동이 넓어진다
const TRUNK_LEFT = [
  [145, 100],
  [140, 150],
  [136, 190],
  [135, 230],
  [138, 262],
  [132, 280],
]
const TRUNK_RIGHT = [
  [160, 104],
  [158, 150],
  [160, 190],
  [165, 225],
  [173, 255],
  [186, 276],
]
const MOUND_TOP = [
  [58, 330],
  [90, 305],
  [130, 285],
  [175, 272],
  [220, 265],
  [270, 270],
  [320, 290],
  [370, 315],
  [408, 342],
]
// 물은 앞쪽 띠 전체를 한 바퀴 도는 닫힌 윤곽이다 (왼쪽 끝에서 시작해 위쪽 → 오른쪽 끝 → 아래쪽)
const WATER_OUTLINE = [
  [12, 352],
  [40, 338],
  [90, 327],
  [140, 326],
  [190, 334],
  [240, 350],
  [290, 362],
  [340, 360],
  [385, 348],
  [412, 344],
  [418, 356],
  [405, 370],
  [365, 387],
  [320, 402],
  [270, 413],
  [220, 418],
  [170, 415],
  [120, 405],
  [70, 390],
  [30, 376],
  [14, 364],
  [12, 352],
]
const WAVE_LINE = [
  [22, 364],
  [70, 352],
  [120, 350],
  [170, 358],
  [220, 375],
  [270, 385],
  [320, 382],
  [370, 368],
  [410, 357],
]
// 의자: 앞쪽 레일이 뒤쪽 레일·다리를 가린다
const FRONT_RAIL = { top: [195, 207], bottom: [255, 303], radius: 6 }
const BACK_RAIL = { top: [247, 200], bottom: [318, 298], radius: 6 }
const BACK_LEG = { top: [224, 243], bottom: [192, 286], radius: 5 }
const SEAT_BAR = { top: [286, 263], bottom: [323, 252], radius: 7 }

// 출력 viewBox: 원본에서 그림 주변만 잘라낸다
const CROP = { x: 5, y: 20, width: 420, height: 405 }
const LEAF_SEGMENTS = 40

/** 밑동에서 끝까지 두 곡선으로 감싼 잎 윤곽 */
function leaf({ tip, arch, width }) {
  const [baseX, baseY] = CROWN
  const [tipX, tipY] = tip
  const length = Math.hypot(tipX - baseX, tipY - baseY)
  const normal = [-(tipY - baseY) / length, (tipX - baseX) / length]
  const middle = [(baseX + tipX) / 2, (baseY + tipY) / 2]
  const quadratic = (offset) => {
    const control = [middle[0] + normal[0] * offset, middle[1] + normal[1] * offset]
    return Array.from({ length: LEAF_SEGMENTS + 1 }, (_, index) => {
      const t = index / LEAF_SEGMENTS
      return [0, 1].map((axis) => (1 - t) ** 2 * CROWN[axis] + 2 * (1 - t) * t * control[axis] + t ** 2 * tip[axis])
    })
  }
  const upper = quadratic(arch + width)
  const lower = quadratic(arch - width)
  return [...upper, ...lower.reverse()]
}

function buildRuns() {
  const leaves = LEAVES.map(leaf)
  const isInsideLeaf = (x, y) => leaves.some((outline) => isInsidePolygon(x, y, outline))
  const moundCurve = smoothCurve(MOUND_TOP)
  const moundArea = [...moundCurve, [MOUND_TOP.at(-1)[0], 430], [MOUND_TOP[0][0], 430]]
  const waterOutline = smoothCurve(WATER_OUTLINE)
  const isInsideWater = (x, y) => isInsidePolygon(x, y, waterOutline)
  const isInsideMound = (x, y) => isInsidePolygon(x, y, moundArea)
  const isInsideChairFront = (x, y) => isInsideCapsule(x, y, FRONT_RAIL) || isInsideCapsule(x, y, SEAT_BAR)
  const trunkOutline = [...smoothCurve(TRUNK_LEFT), ...smoothCurve(TRUNK_RIGHT).reverse()]

  // 앞뒤 순서: 물 > 의자(앞 레일 > 좌석 바 > 뒤 레일·다리) > 언덕 > 줄기, 잎은 줄기 위를 덮는다
  return [
    ...visibleRuns(waterOutline, never),
    ...visibleRuns(smoothCurve(WAVE_LINE), never),
    ...visibleRuns(capsule(FRONT_RAIL), never),
    ...visibleRuns(capsule(SEAT_BAR), (x, y) => isInsideCapsule(x, y, FRONT_RAIL)),
    ...visibleRuns(capsule(BACK_RAIL), isInsideChairFront),
    ...visibleRuns(capsule(BACK_LEG), isInsideChairFront),
    ...visibleRuns(
      moundCurve,
      (x, y) => isInsideWater(x, y) || isInsideChairFront(x, y) || isInsideCapsule(x, y, BACK_LEG),
    ),
    ...visibleRuns(trunkOutline, (x, y) => isInsideMound(x, y) || isInsideLeaf(x, y)),
    ...leaves.flatMap((outline) => visibleRuns(outline, never)),
  ]
}

writeShapeSvg(TARGET, buildRuns(), CROP)
