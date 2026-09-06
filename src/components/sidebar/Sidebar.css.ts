import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

export const sidebar = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  position: 'sticky',
  top: 88,
  '@media': {
    '(max-width: 960px)': { position: 'static' },
  },
})

export const panel = style({
  background: vars.color.surfaceSunken,
  borderRadius: vars.radius.xl,
  padding: vars.space.lg,
})

// toss.tech 실측: '인기 있는 글' 17px / 700 / #6B7684
export const panelTitle = style({
  margin: `0 0 ${vars.space.md}`,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.inkMuted,
})

export const blogRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  border: 0,
  background: 'transparent',
  padding: `${vars.space.sm} 0`,
  // toss.tech 실측: 패널 안 목록 항목 15px / #333D4B. 본문색(#212529)은 가라앉은 패널 위에서 무겁다.
  fontSize: vars.fontSize.md,
  color: vars.color.inkSoft,
  textAlign: 'left',
  selectors: {
    '&:hover': { color: vars.color.accent },
  },
})

export const blogRowSelected = style({
  color: vars.color.accent,
  fontWeight: vars.fontWeight.semibold,
})

export const count = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.inkFaint,
  fontVariantNumeric: 'tabular-nums',
})

export const tagCloud = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
})

export const tagChip = style({
  border: `1px solid ${vars.color.border}`,
  background: vars.color.surface,
  color: vars.color.inkMuted,
  borderRadius: vars.radius.full,
  padding: `4px ${vars.space.md}`,
  fontSize: vars.fontSize.xs,
  selectors: {
    '&:hover': { borderColor: vars.color.borderStrong, color: vars.color.ink },
  },
})

export const tagChipSelected = style({
  borderColor: vars.color.accent,
  background: vars.color.accent,
  color: vars.color.onAccent,
})

export const moreButton = style({
  border: 0,
  background: 'transparent',
  color: vars.color.accent,
  fontSize: vars.fontSize.xs,
  padding: `${vars.space.sm} 0 0`,
})
