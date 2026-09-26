/**
 * 별 입자용 윤곽선 SVG를 만드는 공용 도구 (make*Shape.mjs 스크립트들이 쓴다).
 *
 * 별 라이브러리는 SVG 선 길이를 따라 입자를 뿌릴 뿐 앞뒤를 모른다. 그래서 그림에서 가려진 선도
 * 별로 그려진다. 여기서는 모든 선을 촘촘한 점으로 쪼개 가려진 점을 빼고, 남은 구간만 path로 잇는다.
 */
import { writeFile } from 'node:fs/promises'

// 가림 판정용 점 간격(px). 너무 크면 짧은 가림 구간을 건너뛰어 선이 새어 나온다
const SAMPLE_STEP = 2
// 판정용 점을 출력에서 몇 개마다 하나씩 남길지. 곡률이 완만해 3이면 모양이 그대로다
const OUTPUT_EVERY = 3

export const never = () => false

export const arc = (centerX, centerY, radiusX, radiusY, fromAngle, toAngle, segments) =>
  Array.from({ length: segments + 1 }, (_, index) => {
    const angle = fromAngle + ((toAngle - fromAngle) * index) / segments
    return [centerX + radiusX * Math.cos(angle), centerY + radiusY * Math.sin(angle)]
  })

export const ellipse = (centerX, centerY, radiusX, radiusY) =>
  arc(centerX, centerY, radiusX, radiusY, 0, Math.PI * 2, 160)

export const isInsideEllipse = (x, y, { x: centerX, y: centerY, radiusX, radiusY }) =>
  ((x - centerX) / radiusX) ** 2 + ((y - centerY) / radiusY) ** 2 < 1

/** 두 끝점을 반원으로 감싼 막대 (안테나, 의자 다리 같은 것) */
export function capsule({ top, bottom, radius }) {
  const angle = Math.atan2(bottom[1] - top[1], bottom[0] - top[0])
  const topCap = arc(top[0], top[1], radius, radius, angle + Math.PI / 2, angle + Math.PI * 1.5, 40)
  const bottomCap = arc(bottom[0], bottom[1], radius, radius, angle - Math.PI / 2, angle + Math.PI / 2, 40)
  return [...topCap, ...bottomCap, topCap[0]]
}

/** 점에서 선분(top–bottom)까지 거리가 radius 미만이면 캡슐 안이다 */
export function isInsideCapsule(x, y, { top, bottom, radius }) {
  const [x1, y1] = top
  const [x2, y2] = bottom
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2
  const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared))
  return Math.hypot(x - (x1 + t * (x2 - x1)), y - (y1 + t * (y2 - y1))) < radius
}

/** 제어점들을 지나는 매끈한 곡선 (Catmull-Rom). 손으로 읽은 점 몇 개로 물결·언덕을 그린다 */
export function smoothCurve(points, segmentsPerSpan = 24) {
  const extended = [points[0], ...points, points.at(-1)]
  const curve = []
  for (let index = 1; index < extended.length - 2; index++) {
    const [p0, p1, p2, p3] = extended.slice(index - 1, index + 3)
    for (let step = 0; step < segmentsPerSpan; step++) {
      const t = step / segmentsPerSpan
      const t2 = t * t
      const t3 = t2 * t
      curve.push(
        [0, 1].map(
          (axis) =>
            0.5 *
            (2 * p1[axis] +
              (-p0[axis] + p2[axis]) * t +
              (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 +
              (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3),
        ),
      )
    }
  }
  curve.push(points.at(-1))
  return curve
}

/** 닫힌 다각형 안인지 (ray casting) */
export function isInsidePolygon(x, y, polygon) {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index]
    const [xj, yj] = polygon[previous]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// 꼭짓점 사이를 SAMPLE_STEP 간격으로 채운다. 긴 직선(캡슐 옆면)이 점 두 개뿐이면
// 한쪽 끝만 가려져도 선 전체가 사라진다 — 첫 시도에서 안드로이드 안테나 옆선이 그렇게 빠졌다.
function densify(points) {
  const dense = []
  for (let index = 0; index < points.length - 1; index++) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[index + 1]
    const steps = Math.max(1, Math.floor(Math.hypot(x2 - x1, y2 - y1) / SAMPLE_STEP))
    for (let step = 0; step < steps; step++) {
      dense.push([x1 + ((x2 - x1) * step) / steps, y1 + ((y2 - y1) * step) / steps])
    }
  }
  dense.push(points.at(-1))
  return dense
}

/** 가려진 점에서 선을 끊어, 보이는 구간들만 돌려준다 */
export function visibleRuns(points, isHidden) {
  const runs = []
  let current = []
  for (const point of densify(points)) {
    if (isHidden(...point)) {
      if (current.length > 1) runs.push(current)
      current = []
    } else {
      current.push(point)
    }
  }
  if (current.length > 1) runs.push(current)
  return runs
}

const formatNumber = (value) => String(Math.round(value * 10) / 10)

function toPathData(run, crop) {
  const kept = run.filter((_, index) => index % OUTPUT_EVERY === 0)
  if ((run.length - 1) % OUTPUT_EVERY !== 0) kept.push(run.at(-1))
  return `M${kept.map(([x, y]) => `${formatNumber(x - crop.x)} ${formatNumber(y - crop.y)}`).join('L')}`
}

/** 보이는 구간들을 crop 영역 기준 SVG로 써서 저장한다. 선 스타일은 hello-world-character.svg와 맞춘다 */
export async function writeShapeSvg(target, runs, crop) {
  const svg = `<svg viewBox="0 0 ${crop.width} ${crop.height}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2">${runs
    .map((run) => `<path d="${toPathData(run, crop)}"/>`)
    .join('')}</svg>\n`
  await writeFile(target, svg)
  console.log(`${runs.length}개 path, ${svg.length} bytes → ${target.pathname}`)
}
