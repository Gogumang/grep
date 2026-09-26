import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

/** 3D 번들을 받는 동안 캔버스 자리를 지킨다. 높이는 DeskBuilder 캔버스와 같다(헤더 60px 제외). */
export const loading = style({
  display: 'grid',
  placeItems: 'center',
  height: 'calc(100dvh - 60px)',
  color: vars.color.inkSubtle,
  fontSize: vars.fontSize.sm,
})

export const visuallyHidden = style({
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
})
