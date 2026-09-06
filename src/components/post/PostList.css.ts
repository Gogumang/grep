import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  // 토스처럼 카드 테두리 없이 여백만으로 항목을 나눈다.
  display: 'flex',
  flexDirection: 'column',
  // 항목 사이 64px — toss.tech 실측값이다. 밀도를 일부러 낮춘 간격이라 줄이면 인상이 달라진다.
  gap: vars.space.xxxl,
})

export const item = style({
  display: 'grid',
  // 썸네일 228px — toss.tech 실측값
  gridTemplateColumns: '1fr 228px',
  gap: vars.space.lg,
  alignItems: 'start',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
      gap: vars.space.md,
    },
  },
})

export const meta = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  marginBottom: vars.space.sm,
})

export const title = style({
  margin: 0,
  // toss.tech 실측: 20px / 700 / line-height 29px / 색은 본문보다 한 단계 진하다
  fontSize: vars.fontSize.xl,
  fontWeight: vars.fontWeight.bold,
  lineHeight: 1.45,
  color: vars.color.inkStrong,
  selectors: {
    'a:hover &': { color: vars.color.accent },
  },
})

export const summary = style({
  margin: `${vars.space.sm} 0 0`,
  // toss.tech 실측: 17px / line-height 27.2px
  fontSize: vars.fontSize.lg,
  lineHeight: 1.6,
  color: vars.color.inkMuted,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
})

export const thumbnail = style({
  width: '100%',
  // height 속성(220)이 붙으면 두 치수가 확정되어 aspect-ratio가 무시된다.
  // 속성은 레이아웃 밀림을 막아주므로 남기고, 높이만 auto로 되돌린다.
  height: 'auto',
  aspectRatio: '228 / 128',
  objectFit: 'cover',
  // toss.tech 실측: 썸네일을 감싼 상자에 radius 12px
  borderRadius: vars.radius.lg,
  background: vars.color.surfaceSunken,
  '@media': {
    '(max-width: 720px)': { order: -1 },
  },
})

export const tagRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
  marginTop: vars.space.md,
})

// 사이드바의 tagChip과 같은 색을 쓴다 — 같은 태그가 자리에 따라 다른 무게로 보이면 안 된다.
export const tag = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.inkMuted,
  background: vars.color.surfaceSunken,
  padding: `2px ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
})
