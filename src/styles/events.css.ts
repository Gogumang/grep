import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

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

export const month = style({
  marginBottom: vars.space.xxl,
})

export const monthHeading = style({
  margin: `0 0 ${vars.space.sm}`,
  fontSize: vars.fontSize.md,
  fontWeight: vars.fontWeight.semibold,
  color: vars.color.inkFaint,
})

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const item = style({
  display: 'grid',
  // 날짜 칸 폭을 고정해 제목의 왼쪽 줄을 맞춘다. 달이 바뀌는 기간('10월 31일(토) – 11월 1일(일)')은 두 줄로 접힌다.
  gridTemplateColumns: '150px 1fr',
  gap: vars.space.lg,
  padding: `${vars.space.lg} 0`,
  borderBottom: `1px solid ${vars.color.border}`,
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: '1fr', gap: vars.space.xs },
  },
})

export const period = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  color: vars.color.accent,
  fontVariantNumeric: 'tabular-nums',
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minWidth: 0,
})

export const title = style({
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.bold,
  lineHeight: 1.45,
  color: vars.color.inkStrong,
  selectors: {
    'a:hover &': { color: vars.color.accent },
  },
})

export const meta = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.inkMuted,
})

export const deadline = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.inkFaint,
})
