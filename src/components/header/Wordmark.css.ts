import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

/**
 * 로고 묶음. toss.tech 로고는 110×20으로 아주 작고 납작하다 —
 * 헤더에서 존재감을 주장하지 않고 내용에 자리를 내주는 크기다.
 */
export const wordmark = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: 20,
})

export const text = style({
  fontSize: vars.fontSize.xl,
  letterSpacing: '-0.04em',
  lineHeight: 1,
})

/** 토스가 'toss'를 굵고 진하게 쓰는 자리. */
export const brand = style({
  fontWeight: vars.fontWeight.bold,
  color: vars.color.inkStrong,
})
