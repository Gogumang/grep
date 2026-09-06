import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

/**
 * toss.tech 404 실측
 *   아이콘 140×140 원형 · 제목 24px/700/line-height 38.4px
 *   안내 17px/400/27.2px, margin 4px 0 24px · 버튼 40px 높이, radius 10px, padding 9px 12px
 * 아이콘은 원문의 3D 회전 일러스트를 APNG 원본 그대로 쓴다.
 * 변환하지 않는 이유 — 프레임마다 픽셀이 거의 다 바뀌어 프레임 간 압축이 먹지 않는다.
 * 실측: 원본 1,024KB · WebP 24fps 1,149KB · WebP 30fps 1,490KB 로 오히려 커졌다.
 * sharp(libvips)는 AVIF 애니메이션을 지원하지 않아 선택지가 APNG뿐이다.
 */
export const container = style({
  minHeight: '60vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.xxxl} ${vars.space.lg}`,
  textAlign: 'center',
})

export const icon = style({
  width: 140,
  height: 140,
  marginBottom: vars.space.xl,
})

export const title = style({
  margin: 0,
  fontSize: 24,
  fontWeight: vars.fontWeight.bold,
  lineHeight: 1.6,
  color: vars.color.inkSoft,
})

export const description = style({
  margin: '4px 0 24px',
  fontSize: vars.fontSize.lg,
  lineHeight: 1.6,
  color: vars.color.inkSoft,
})

export const homeButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '9px 12px',
  borderRadius: vars.radius.md,
  background: vars.color.accent,
  color: vars.color.onAccent,
  fontSize: 15,
  fontWeight: vars.fontWeight.semibold,
  selectors: { '&:hover': { background: vars.color.accentHover } },
})
