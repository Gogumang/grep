import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

export const layout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 280px',
  gap: vars.space.xxl,
  paddingTop: vars.space.xxl,
  '@media': {
    '(max-width: 960px)': { gridTemplateColumns: '1fr' },
  },
})

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
})

// toss.tech 실측: '전체 아티클' 32px / 700 / #333D4B / letter-spacing normal
// 목록 카드 제목(inkStrong)보다 여린 색이다 — 크기로 이미 위계가 서서 색까지 올리면 무겁다.
export const heading = style({
  margin: 0,
  fontSize: vars.fontSize.xxl,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.inkSoft,
})

export const resultLine = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: vars.space.xl,
  fontSize: vars.fontSize.sm,
  color: vars.color.inkFaint,
})

export const clearButton = style({
  border: 0,
  background: 'transparent',
  color: vars.color.accent,
  fontSize: vars.fontSize.sm,
})

export const emptyState = style({
  border: `1px dashed ${vars.color.border}`,
  borderRadius: vars.radius.xl,
  padding: `${vars.space.xxl} ${vars.space.lg}`,
  textAlign: 'center',
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.sm,
})

export const pagination = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: vars.space.xs,
  marginTop: vars.space.xxl,
})

export const pageButton = style({
  minWidth: 34,
  height: 34,
  border: 0,
  background: 'transparent',
  color: vars.color.inkMuted,
  borderRadius: vars.radius.full,
  fontSize: vars.fontSize.sm,
  fontVariantNumeric: 'tabular-nums',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.surfaceSunken, color: vars.color.ink },
    '&:disabled': { opacity: 0.35, cursor: 'default' },
  },
})

export const pageButtonCurrent = style({
  background: vars.color.accent,
  color: vars.color.onAccent,
  fontWeight: vars.fontWeight.semibold,
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.accentHover, color: vars.color.onAccent },
  },
})
