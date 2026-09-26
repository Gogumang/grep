/**
 * 메인 별 입자가 모이는 "Astra를 올려다보는 Claude Code" 윤곽선 SVG를 만든다.
 *   node scripts/makeClaudeAstraShape.mjs
 *
 * 왼쪽 아래에 Claude Code 캐릭터(팔 뭉툭하고 다리 넷 달린 네모 몸통), 오른쪽 위에 OpenAI Astra
 * 메인의 나선 은하. 라이브러리 내장 `spiral`은 다른 SVG와 한 화면에 같이 그릴 수 없어 나선도 선으로 그린다.
 * 캐릭터는 바깥 윤곽 하나 + 눈 둘뿐이다 — 선이 늘면 선마다 별이 성겨져 윤곽이 뭉개진다.
 * 눈을 몸통 오른쪽 위로 몰아 은하 쪽을 보는 것처럼 만든다.
 */
import { arc, never, visibleRuns, writeShapeSvg } from './particleShape.mjs'

const TARGET = new URL('../public/images/particle-shapes/claude-code-astra.svg', import.meta.url)

const BODY = { left: 60, right: 260, top: 200, bottom: 310 }
// 팔은 몸통 양옆에 붙은 네모다
const ARM = { width: 24, top: 238, bottom: 268 }
const LEG = { width: 18, bottom: 350, lefts: [74, 114, 188, 228] }
const EYES = [
  { left: 186, top: 218, width: 14, height: 30 },
  { left: 228, top: 218, width: 14, height: 30 },
]

const GALAXY = { x: 440, y: 135, radius: 120, squash: 0.72, tilt: -0.35 }
const GALAXY_CORE_RADIUS = 14
const ARM_COUNT = 3
// 팔이 중심에서 바깥까지 감기는 바퀴 수
const ARM_TURNS = 1.15

const CROP = { x: 20, y: 0, width: 560, height: 370 }

const rectangle = ({ left, top, width, height }) => [
  [left, top],
  [left + width, top],
  [left + width, top + height],
  [left, top + height],
  [left, top],
]

function characterOutline() {
  const { left, right, top, bottom } = BODY
  const legs = [...LEG.lefts].reverse().flatMap((legLeft) => [
    [legLeft + LEG.width, bottom],
    [legLeft + LEG.width, LEG.bottom],
    [legLeft, LEG.bottom],
    [legLeft, bottom],
  ])
  return [
    [left, top],
    [right, top],
    [right, ARM.top],
    [right + ARM.width, ARM.top],
    [right + ARM.width, ARM.bottom],
    [right, ARM.bottom],
    [right, bottom],
    ...legs,
    [left, bottom],
    [left, ARM.bottom],
    [left - ARM.width, ARM.bottom],
    [left - ARM.width, ARM.top],
    [left, ARM.top],
    [left, top],
  ]
}

// 원반을 납작하게 눌러 기울여야 정면 원이 아니라 비스듬히 본 은하로 보인다
function toGalaxyPlane(x, y) {
  const squashedY = y * GALAXY.squash
  const cos = Math.cos(GALAXY.tilt)
  const sin = Math.sin(GALAXY.tilt)
  return [GALAXY.x + x * cos - squashedY * sin, GALAXY.y + x * sin + squashedY * cos]
}

function spiralArm(armIndex) {
  const segments = 220
  const startAngle = (armIndex * Math.PI * 2) / ARM_COUNT
  const innerRadius = GALAXY_CORE_RADIUS * 1.6
  return Array.from({ length: segments + 1 }, (_, index) => {
    const progress = index / segments
    const angle = startAngle + progress * ARM_TURNS * Math.PI * 2
    const radius = innerRadius + (GALAXY.radius - innerRadius) * progress ** 0.85
    return toGalaxyPlane(radius * Math.cos(angle), radius * Math.sin(angle))
  })
}

function buildRuns() {
  const core = arc(0, 0, GALAXY_CORE_RADIUS, GALAXY_CORE_RADIUS, 0, Math.PI * 2, 60).map(([x, y]) => toGalaxyPlane(x, y))
  return [
    ...visibleRuns(characterOutline(), never),
    ...EYES.flatMap((eye) => visibleRuns(rectangle(eye), never)),
    ...visibleRuns(core, never),
    ...Array.from({ length: ARM_COUNT }, (_, armIndex) => visibleRuns(spiralArm(armIndex), never)).flat(),
  ]
}

writeShapeSvg(TARGET, buildRuns(), CROP)
