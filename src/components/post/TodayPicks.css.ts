import { keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

export const section = style({
  padding: `${vars.space.xxl} 0`,
})

export const slide = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 460px)',
  gap: vars.space.xxl,
  alignItems: 'start',
  '@media': {
    '(max-width: 860px)': {
      gridTemplateColumns: '1fr',
      gap: vars.space.lg,
    },
  },
})

/**
 * 글 하나가 차지하는 최소 높이.
 *
 * 제목이 한 줄이든 두 줄이든 아래 화살표가 같은 자리에 있어야 한다 —
 * 슬라이드를 넘길 때마다 버튼이 위아래로 튀면 누르기 어렵다.
 */
/**
 * 나가는 글과 들어오는 글을 같은 칸에 겹쳐 둔다.
 *
 * absolute를 쓰지 않고 grid 한 칸에 둘 다 놓는 이유 — absolute면 칸이 내용 높이를
 * 잃어서 높이를 px로 박아야 하는데, 제목 크기가 clamp()라 화면 폭마다 달라진다.
 * grid 겹치기는 가장 높은 자식만큼 칸이 늘어나므로 그 문제가 없다.
 */
export const textStack = style({
  display: 'grid',
})

export const textLayer = style({
  gridArea: '1 / 1',
})

/**
 * 크로스페이드. toss.tech 실측값(400ms linear)을 그대로 쓴다.
 * 라이브러리 없이 CSS로 하는 이유 — 이 효과 하나에 motion 40KB(gzip)를 쓰던 것을 걷어냈다.
 */
const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
const fadeOut = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } })

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export const entering = style({
  // forwards 로 끝값을 못 박는다 — 없으면 애니메이션이 끝난 뒤 계산값이 흔들린다.
  animation: `${fadeIn} 400ms linear forwards`,
  '@media': { [REDUCED_MOTION]: { animation: 'none' } },
})

export const leaving = style({
  animation: `${fadeOut} 400ms linear forwards`,
  // 나가는 글은 클릭을 받지 않는다 — 위에 겹쳐 있어도 새 글이 눌려야 한다.
  pointerEvents: 'none',
  '@media': { [REDUCED_MOTION]: { animation: 'none', opacity: 0 } },
})

/** 텍스트와 같은 방식으로 두 장을 한 칸에 겹친다. 칸은 가장 높은 자식만큼 늘어난다. */
export const imageStack = style({
  display: 'grid',
})

export const imageLayer = style({
  gridArea: '1 / 1',
  display: 'block',
})

export const textColumn = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 241,
  '@media': {
    '(max-width: 860px)': { minHeight: 0 },
  },
})

export const title = style({
  margin: 0,
  // 화면 폭에 따라 자연스럽게 줄어들되, 히어로다운 크기는 유지한다.
  // toss.tech 실측: 히어로 제목 40px. 좁은 화면에서만 줄인다.
  fontSize: 'clamp(24px, 3.2vw, 40px)',
  fontWeight: vars.fontWeight.bold,
  color: vars.color.inkStrong,
  lineHeight: 1.32,
  letterSpacing: '-0.025em',
  // 제목이 한 줄이든 두 줄이든 자리를 두 줄로 잡아 둔다.
  // 그러지 않으면 슬라이드를 넘길 때마다 아래 화살표가 위아래로 튀어 누르기 어렵다.
  minHeight: 'calc(1.32em * 2)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  selectors: {
    '&:hover': { color: vars.color.accent },
  },
})

export const summary = style({
  margin: `${vars.space.md} 0 0`,
  fontSize: vars.fontSize.md,
  lineHeight: 1.65,
  color: vars.color.inkMuted,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  // 제목과 같은 이유로 두 줄 자리를 잡아 둔다. 제목만 잡아 두었더니 요약이 한 줄인
  // 슬라이드에서 히어로가 25px 낮아져 화살표가 그만큼 위로 튀었다.
  minHeight: 'calc(1.65em * 2)',
})

export const meta = style({
  margin: `${vars.space.md} 0 0`,
  fontSize: vars.fontSize.xs,
  color: vars.color.inkFaint,
})

/** 화살표를 아래쪽에 붙여 제목 길이와 무관하게 같은 자리에 두게 한다. */
export const controls = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  marginTop: 'auto',
  paddingTop: vars.space.xl,
})

// toss.tech 실측: 48×48 원형, 배경 #F2F4F6, 안쪽 아이콘 24×24, 아이콘 색 rgb(33,37,41)
export const arrow = style({
  width: 48,
  height: 48,
  borderRadius: vars.radius.full,
  border: 0,
  background: vars.color.surfaceSunken,
  color: vars.color.inkStrong,
  display: 'grid',
  placeItems: 'center',
  selectors: {
    '&:hover': { background: vars.color.borderStrong, color: vars.color.ink },
  },
})

export const image = style({
  width: '100%',
  height: 'auto',
  // OG용 썸네일(1200×630)을 그대로 쓴다 — 비율이 같아 잘리는 곳이 없다.
  aspectRatio: '1200 / 630',
  objectFit: 'cover',
  borderRadius: vars.radius.lg,
  background: vars.color.surfaceSunken,
})

export const divider = style({
  border: 0,
  borderTop: `1px solid ${vars.color.border}`,
  margin: 0,
})
