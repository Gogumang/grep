import { style } from '@vanilla-extract/css'
import { vars } from './contract.css'

// toss.tech 실측. line-height를 명시해야 높이가 25px로 맞는다(normal이면 20px).

const base = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  lineHeight: 1.6,
  padding: '2px 10px',
  borderRadius: vars.radius.sm,
})

/** 분류. toss.tech 실측: #3182F6 / 배경 #E8F3FF */
export const category = style([base, { color: vars.color.accent, background: vars.color.accentSoft }])

/** 글쓴이·출처. 실측 디자인에 보조 배지가 한 벌뿐이라 둘이 같은 회색이다. */
export const secondary = style([base, { color: vars.color.inkMuted, background: vars.color.surfaceSunken }])
