import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
const riseIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-8px) scale(0.99)' },
  to: { opacity: 1, transform: 'none' },
})

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(15, 19, 25, 0.45)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  justifyContent: 'center',
  // stretch면 결과가 하나여도 패널이 화면 높이만큼 늘어난다 — 내용만큼만 차지하게 한다.
  alignItems: 'flex-start',
  // 화면 한가운데가 아니라 위쪽에 둔다 — 결과가 늘어날 때 상자가 위아래로 뛰지 않는다.
  paddingTop: '10vh',
  paddingInline: vars.space.lg,
  animation: `${fadeIn} 120ms ease-out`,
})

export const panel = style({
  width: '100%',
  maxWidth: 640,
  maxHeight: '76vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.surface,
  borderRadius: vars.radius.lg,
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.24)',
  overflow: 'hidden',
  animation: `${riseIn} 140ms ease-out`,
})

export const inputRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.lg} ${vars.space.xl}`,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const inputIcon = style({ color: vars.color.inkMuted, flexShrink: 0 })

export const input = style({
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: vars.color.ink,
  fontSize: vars.fontSize.lg,
  '::placeholder': { color: vars.color.inkMuted },
})

export const hint = style({
  flexShrink: 0,
  padding: `2px ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  border: `1px solid ${vars.color.border}`,
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.xs,
})

export const results = style({ overflowY: 'auto', padding: vars.space.sm })

export const item = style({
  display: 'block',
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderRadius: vars.radius.md,
  selectors: { '&:hover, &:focus-visible': { background: vars.color.surfaceSunken } },
})

export const itemSelected = style({ background: vars.color.surfaceSunken })

export const itemTitle = style({
  margin: 0,
  fontSize: vars.fontSize.md,
  fontWeight: vars.fontWeight.semibold,
  color: vars.color.inkStrong,
})

export const itemMeta = style({
  margin: `${vars.space.xs} 0 0`,
  fontSize: vars.fontSize.xs,
  color: vars.color.inkMuted,
})

export const excerpt = style({
  margin: `${vars.space.xs} 0 0`,
  fontSize: vars.fontSize.sm,
  color: vars.color.inkSoft,
  lineHeight: 1.5,
})

/**
 * Pagefind가 검색어를 <mark>로 감싸 준다. 그 마크업은 우리가 쓰는 게 아니라
 * 라이브러리가 넣는 것이라 자식 선택자로 잡아야 한다 — style()로는 안 되고 globalStyle이다.
 */
globalStyle(`${excerpt} mark`, {
  background: 'transparent',
  color: vars.color.brand,
  fontWeight: vars.fontWeight.semibold,
})

export const status = style({
  padding: `${vars.space.xl} ${vars.space.lg}`,
  textAlign: 'center',
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.sm,
})
