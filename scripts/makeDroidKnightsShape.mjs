/**
 * 메인 별 입자가 모이는 "빼꼼 안드로이드" 윤곽선 SVG를 만든다.
 *   node scripts/makeDroidKnightsShape.mjs
 *
 * 원본: 드로이드나이츠 2026 메인 배너 https://droidknights.dev/2026/banner.png (1200×563).
 * PNG를 자동 벡터화할 도구가 없어, 배너에 50px 격자를 씌워 부위별 좌표를 눈으로 읽었다.
 * 모든 부위가 원·타원·캡슐이라 아래 상수만 고치면 모양을 조정할 수 있다 (배너 픽셀 좌표).
 * 가려진 선을 지우는 방식은 particleShape.mjs 참고.
 */
import { arc, capsule, ellipse, isInsideEllipse, never, visibleRuns, writeShapeSvg } from './particleShape.mjs'

const TARGET = new URL('../public/images/particle-shapes/droidknights-android.svg', import.meta.url)

const HEAD = { x: 900, y: 304, radius: 200 }
const EYES = [
  { x: 810, y: 245, radius: 32 },
  { x: 974, y: 260, radius: 34 },
]
const EYE_SHINES = [
  { x: 811, y: 231, radius: 10 },
  { x: 978, y: 246, radius: 10 },
]
const PAWS = [
  { x: 747, y: 312, radiusX: 41, radiusY: 31 },
  { x: 1046, y: 346, radiusX: 42, radiusY: 33 },
]
// 안테나는 양 끝점을 반원으로 감싼 캡슐이다 (아래 끝은 머리 속에 묻혀 가려진다)
const ANTENNAS = [
  { top: [782, 67], bottom: [812, 150], radius: 19 },
  { top: [1080, 105], bottom: [1030, 175], radius: 18 },
]
// 행성은 수평선 위 세 점을 지나는 원으로 복원한다
const PLANET = circleThroughPoints([600, 372], [890, 310], [1120, 385])
const HORIZON_FROM = [560, 430]
const HORIZON_TO = [1150, 420]
// 몸통 옆면은 이 높이까지 내려 그린 뒤 행성에 가려진 부분을 지운다
const BODY_BOTTOM_Y = 420

// 출력 viewBox: 배너에서 캐릭터 주변만 잘라낸다
const CROP = { x: 545, y: 40, width: 610, height: 390 }

function circleThroughPoints([x1, y1], [x2, y2], [x3, y3]) {
  const determinant = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2))
  const x =
    ((x1 ** 2 + y1 ** 2) * (y2 - y3) + (x2 ** 2 + y2 ** 2) * (y3 - y1) + (x3 ** 2 + y3 ** 2) * (y1 - y2)) / determinant
  const y =
    ((x1 ** 2 + y1 ** 2) * (x3 - x2) + (x2 ** 2 + y2 ** 2) * (x1 - x3) + (x3 ** 2 + y3 ** 2) * (x2 - x1)) / determinant
  return { x, y, radius: Math.hypot(x1 - x, y1 - y) }
}

const isInsidePlanet = (x, y) => Math.hypot(x - PLANET.x, y - PLANET.y) < PLANET.radius
const isInsidePaw = (x, y) => PAWS.some((paw) => isInsideEllipse(x, y, paw))
// 머리는 위쪽 반원 + 그 아래로 곧게 내려가는 옆면이다
const isInsideHead = (x, y) =>
  y <= HEAD.y ? Math.hypot(x - HEAD.x, y - HEAD.y) < HEAD.radius : Math.abs(x - HEAD.x) < HEAD.radius

function buildRuns() {
  const headOutline = [
    [HEAD.x - HEAD.radius, BODY_BOTTOM_Y],
    ...arc(HEAD.x, HEAD.y, HEAD.radius, HEAD.radius, Math.PI, Math.PI * 2, 200),
    [HEAD.x + HEAD.radius, BODY_BOTTOM_Y],
  ]
  const horizonFrom = Math.atan2(HORIZON_FROM[1] - PLANET.y, HORIZON_FROM[0] - PLANET.x)
  const horizonTo = Math.atan2(HORIZON_TO[1] - PLANET.y, HORIZON_TO[0] - PLANET.x)
  const horizon = arc(PLANET.x, PLANET.y, PLANET.radius, PLANET.radius, horizonFrom, horizonTo, 400)

  // 앞뒤 순서: 앞발 > 수평선 > 머리(눈 포함) > 안테나
  return [
    ...visibleRuns(headOutline, (x, y) => isInsidePlanet(x, y) || isInsidePaw(x, y)),
    ...ANTENNAS.flatMap((antenna) => visibleRuns(capsule(antenna), isInsideHead)),
    ...[...EYES, ...EYE_SHINES].flatMap((eye) => visibleRuns(ellipse(eye.x, eye.y, eye.radius, eye.radius), never)),
    ...PAWS.flatMap((paw) => visibleRuns(ellipse(paw.x, paw.y, paw.radiusX, paw.radiusY), never)),
    ...visibleRuns(horizon, (x, y) => isInsidePaw(x, y) || y > CROP.y + CROP.height - 5),
  ]
}

writeShapeSvg(TARGET, buildRuns(), CROP)
