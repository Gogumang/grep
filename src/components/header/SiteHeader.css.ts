import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

export const header = style({
  position: 'sticky',
  top: 0,
  zIndex: 20,
  background: vars.color.canvas,
})

export const inner = style({
  maxWidth: 1100,
  margin: '0 auto',
  padding: `0 ${vars.space.lg}`,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.lg,
})

export const spacer = style({ flex: 1 })

export const themeToggle = style({
  border: `1px solid ${vars.color.border}`,
  background: vars.color.surface,
  color: vars.color.inkMuted,
  borderRadius: vars.radius.full,
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  fontSize: vars.fontSize.md,
  selectors: {
    '&:hover': { borderColor: vars.color.borderStrong, color: vars.color.ink },
  },
})
