import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

/**
 * 글 목록(PostList)보다 촘촘하게 둔다. 공고는 썸네일도 요약도 없이 제목 한 줄이라,
 * 글 목록의 64px 간격을 쓰면 한 화면에 서너 건밖에 안 들어온다.
 */
export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const item = style({
  display: 'block',
  padding: `${vars.space.lg} 0`,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.sm,
  marginBottom: vars.space.sm,
})

export const title = style({
  margin: 0,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.bold,
  lineHeight: 1.45,
  color: vars.color.inkStrong,
  selectors: {
    'a:hover &': { color: vars.color.accent },
  },
})

export const deadline = style({
  margin: `${vars.space.xs} 0 0`,
  fontSize: vars.fontSize.sm,
  color: vars.color.inkFaint,
})
