/**
 * astra-1.1.0.min.js 의 별 나선 팔 개수를 늘린다 (배포본 5개 → ARM_COUNT).
 *
 * 왜: OpenAI GPT-6 Astra 원본 페이지는 stars.count = 12, turns = 2.35 로 돌지만
 * 우리가 받은 배포본은 이 둘이 옵션이 아니라 모듈 상수로 박혀 있다 (팔 5개, 1.05바퀴).
 * particles.density 는 라이브러리가 [0.25, 4] 로 클램프하므로 최대치를 줘도
 * 팔 5개 × ~800개 ≈ 4,000개가 상한이다. 팔 개수가 유일한 레버다.
 *
 * 별 수 ≈ 팔 개수 × round((strong ? 220 : 170) × density). strong/일반이 교대이므로
 * density 4에서 팔 하나당 평균 780개다. tier 3의 입자 상한은 40,000.
 *
 * 멱등이고, **이미 패치된 파일에 다시 적용할 수 있다** — 상수를 정규식으로 찾기 때문에
 * ARM_COUNT만 바꿔 다시 돌리면 된다. 벤더 파일을 새로 받은 뒤에도 그대로 실행한다:
 *   node scripts/patchAstraArms.mjs
 * 자세한 배경은 public/vendor/astra/PATCHES.md 참고.
 */
import { readFile, writeFile } from 'node:fs/promises'

const TARGET = new URL('../public/vendor/astra/astra-1.1.0.min.js', import.meta.url)

const ARM_COUNT = 20
// 원본의 turns: 2.35 → 라디안 스윕 2 * 2.35 = 4.7π
const SWEEP_PI = 4.7

/**
 * 곡선 descriptor를 만든다. 배포본 원본 5개의 성격을 그대로 따른다:
 * strong 교대, depth 부호 교대에 |depth| .42~.78, |speed| .016~.03, phase 0~1.
 * 서로 다른 주기(11, 25, 8)로 훑어 팔마다 깊이·위상·속도가 겹치지 않게 한다.
 */
const buildCurves = (count) =>
  Array.from({ length: count }, (_, index) => {
    const strong = index % 2 === 0
    const sign = strong ? 1 : -1
    return {
      depth: round(sign * (0.42 + (0.36 * ((index * 7) % 11)) / 10)),
      phase: round(((index * 13) % 25) / 25),
      speed: round(sign * (0.016 + (0.014 * ((index * 5) % 8)) / 7)),
      strong,
    }
  })

const round = (value) => Math.round(value * 1000) / 1000
/** 배포본의 압축 표기(선행 0 없는 소수, !0/!1)를 그대로 흉내낸다. */
const num = (value) => String(value).replace(/^(-?)0\./, '$1.')

const curveLiteral = `Q=[${buildCurves(ARM_COUNT)
  .map((c) => `{depth:${num(c.depth)},phase:${num(c.phase)},speed:${num(c.speed)},strong:${c.strong ? '!0' : '!1'}}`)
  .join(',')}]`

/**
 * 팔마다 색을 정하는 표 `D`. 배포본은 `D=[.08,.58,.22,.68,.44]`로 5개뿐이고,
 * 팔 인덱스로 조회한 뒤 `D[i] ?? .08`로 폴백한다 — 팔만 늘리면 6번째부터 전부
 * 같은 하늘색이 되어 색이 단조로워진다. 그래서 팔 개수에 맞춰 같이 늘려야 한다.
 *
 * 값은 팔레트를 5구간으로 나누는 경계로만 쓰인다 (구간 안에서는 색이 같다):
 *   [0,.36) 하늘 #6DCBF4 · [.36,.52) 파랑 #7AB1FE · [.52,.64) 주황 #F87915
 *   [.64,.74) 연주황 #FA994C · [.74,1] 흰색 #F5F6FB
 * 앞 5개는 배포본 값을 그대로 두어 기존 색감을 유지하고, 이후로는 이웃한 팔끼리
 * 색이 겹치지 않도록 구간을 번갈아 돈다.
 */
const BAND_CYCLE = [0, 2, 0, 3, 1, 0, 4, 1, 0, 2, 0, 3, 1, 0, 4, 2, 0, 3, 1, 0]
const BAND_RANGE = [
  [0.06, 0.34],
  [0.38, 0.5],
  [0.54, 0.62],
  [0.66, 0.72],
  [0.8, 0.94],
]
const STOCK_COLOR_TABLE = [0.08, 0.58, 0.22, 0.68, 0.44]

const colorTable = Array.from({ length: ARM_COUNT }, (_, index) => {
  if (index < STOCK_COLOR_TABLE.length) return STOCK_COLOR_TABLE[index]
  const [low, high] = BAND_RANGE[BAND_CYCLE[index % BAND_CYCLE.length]]
  return round(low + ((high - low) * ((index * 3) % 7)) / 6)
})
const colorLiteral = `D=[${colorTable.map(num).join(',')}]`

const edits = [
  {
    name: '팔 개수',
    find: /Array\.from\(\{length:(\d+)\},\(v,x\)=>/,
    to: `Array.from({length:${ARM_COUNT}},(v,x)=>`,
  },
  {
    name: '팔 간격·감김',
    find: /x\*Math\.PI\*2\/(\d+)\+z\*Math\.PI\*([\d.]+)/,
    to: `x*Math.PI*2/${ARM_COUNT}+z*Math.PI*${SWEEP_PI}`,
  },
  {
    name: '곡선 descriptor',
    find: /Q=\[\{depth:-?[\d.]+,phase:[\d.]+,speed:-?[\d.]+,strong:!\d\}(?:,\{depth:-?[\d.]+,phase:[\d.]+,speed:-?[\d.]+,strong:!\d\})*\]/,
    to: curveLiteral,
  },
  {
    name: '팔별 색 표',
    find: /D=\[\d*\.\d+(?:,\d*\.\d+)*\]/,
    to: colorLiteral,
  },
]

const source = await readFile(TARGET, 'utf8')
let patched = source
const applied = []

for (const edit of edits) {
  const hits = patched.match(new RegExp(edit.find.source, 'g')) ?? []
  if (hits.length !== 1) {
    throw new Error(
      `${edit.name}: 기대한 패턴이 정확히 1번 나와야 하는데 ${hits.length}번 나왔다. ` +
        '벤더 버전이 올라갔을 수 있으니 PATCHES.md를 보고 패턴을 다시 맞춰라.',
    )
  }
  if (hits[0] === edit.to) {
    applied.push(`${edit.name}: 이미 적용됨`)
    continue
  }
  patched = patched.replace(edit.find, edit.to)
  applied.push(`${edit.name}: 적용`)
}

if (patched !== source) await writeFile(TARGET, patched)
console.log(applied.join('\n'))
const perArm = Math.round((220 + 170) / 2) * 4
console.log(
  patched === source
    ? '변경 없음'
    : `패치 완료 — 팔 ${ARM_COUNT}개, ${SWEEP_PI / 2}바퀴, density 4에서 별 약 ${(ARM_COUNT * perArm).toLocaleString()}개`,
)
