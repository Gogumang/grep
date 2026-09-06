import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

export const container = style({
  maxWidth: 1100,
  margin: '0 auto',
  padding: `0 ${vars.space.lg} ${vars.space.xxxl}`,
})
