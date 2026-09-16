import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

/** 이 폭 아래에서는 썸네일을 작은 정사각형으로 줄인다. PostList와 같은 경계다. */
const NARROW = '(max-width: 720px)'

export const intro = style({
  paddingTop: vars.space.xxl,
  marginBottom: vars.space.xxl,
})

// '전체 글'(PostExplorer.heading)과 같은 크기·색이다 — 목록 페이지끼리 제목 무게를 맞춘다.
export const heading = style({
  margin: 0,
  fontSize: vars.fontSize.xxl,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.inkSoft,
})

// toss.im/career/article 의 '토스 커리어 콘텐츠 356'처럼 제목 옆에 개수를 파란색으로 붙인다.
export const count = style({
  color: vars.color.accent,
  fontVariantNumeric: 'tabular-nums',
})

export const lead = style({
  margin: `${vars.space.sm} 0 0`,
  fontSize: vars.fontSize.md,
  color: vars.color.inkMuted,
})

export const empty = style({
  border: `1px dashed ${vars.color.border}`,
  borderRadius: vars.radius.xl,
  padding: `${vars.space.xxl} ${vars.space.lg}`,
  textAlign: 'center',
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.sm,
})

// 글 목록(PostList)과 같은 리듬 — 테두리 없이 넓은 여백으로만 항목을 나눈다.
export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxxl,
})

export const item = style({
  display: 'grid',
  gridTemplateColumns: '1fr 228px',
  gap: vars.space.xl,
  alignItems: 'center',
  '@media': {
    [NARROW]: { gridTemplateColumns: '1fr 88px', gap: vars.space.md },
  },
})

export const body = style({
  minWidth: 0,
})

export const title = style({
  margin: 0,
  fontSize: vars.fontSize.xl,
  fontWeight: vars.fontWeight.bold,
  lineHeight: 1.45,
  color: vars.color.inkStrong,
  selectors: {
    'a:hover &': { color: vars.color.accent },
  },
  '@media': {
    [NARROW]: { fontSize: vars.fontSize.lg },
  },
})

export const summary = style({
  margin: `${vars.space.sm} 0 0`,
  fontSize: vars.fontSize.lg,
  lineHeight: 1.6,
  color: vars.color.inkMuted,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  '@media': {
    [NARROW]: { fontSize: vars.fontSize.md },
  },
})

export const schedule = style({
  margin: `${vars.space.md} 0 0`,
  fontSize: vars.fontSize.sm,
  color: vars.color.inkFaint,
  fontVariantNumeric: 'tabular-nums',
})

export const thumbnail = style({
  width: '100%',
  // width·height 속성은 레이아웃 밀림을 막으려고 두고, 실제 높이는 비율이 정한다.
  height: 'auto',
  aspectRatio: '228 / 128',
  objectFit: 'cover',
  borderRadius: vars.radius.lg,
  background: vars.color.surfaceSunken,
  '@media': {
    [NARROW]: { aspectRatio: '1' },
  },
})

export const source = style({
  margin: `${vars.space.xxxl} 0 0`,
  fontSize: vars.fontSize.sm,
  color: vars.color.inkFaint,
})

export const sourceLink = style({
  color: vars.color.inkMuted,
  textDecoration: 'underline',
})
