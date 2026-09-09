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
  '@media': {
    /* 좁은 화면에서는 화면을 다 쓴다 — 여백을 남기면 결과 몇 줄 보려고 스크롤하게 된다. */
    'screen and (max-width: 640px)': { padding: 0 },
  },
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
  '@media': {
    'screen and (max-width: 640px)': {
      maxWidth: 'none',
      height: '100%',
      maxHeight: 'none',
      borderRadius: 0,
      boxShadow: 'none',
    },
  },
})

export const inputRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.lg} ${vars.space.xl}`,
  borderBottom: `1px solid ${vars.color.border}`,
  '@media': {
    'screen and (max-width: 640px)': {
      /* 노치·상태바 아래로 내려 준다. 지원하지 않는 브라우저는 앞의 값을 그대로 쓴다. */
      paddingTop: `calc(${vars.space.lg} + env(safe-area-inset-top))`,
      paddingInline: vars.space.lg,
    },
  },
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

/**
 * 닫는 자리. 넓은 화면에서는 누를 키(ESC)를 알려주고, 좁은 화면에서는 ✕를 보여준다.
 *
 * 전체 화면이 되면 바깥을 눌러 닫을 배경이 사라지는데 폰에는 ESC 키도 없다 —
 * 글로만 'ESC'라고 적어 두면 닫을 방법이 없어진다. 그래서 눌러도 닫히는 버튼이다.
 */
export const closeButton = style({
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  minWidth: 32,
  height: 32,
  padding: `0 ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  border: `1px solid ${vars.color.border}`,
  background: 'none',
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.xs,
  selectors: {
    '&:hover': { borderColor: vars.color.borderStrong, color: vars.color.ink },
  },
})

/** 키 이름은 키보드가 있는 화면에서만 뜻이 있다. */
export const closeKeyLabel = style({
  '@media': { 'screen and (max-width: 640px)': { display: 'none' } },
})

export const closeIcon = style({
  fontSize: vars.fontSize.md,
  lineHeight: 1,
  '@media': { 'screen and (min-width: 641px)': { display: 'none' } },
})

export const results = style({
  overflowY: 'auto',
  padding: vars.space.sm,
  '@media': {
    /* 전체 화면에서는 남는 높이를 결과가 다 쓴다. 홈 인디케이터 밑으로 내용이 깔리지 않게 둔다. */
    'screen and (max-width: 640px)': {
      flex: 1,
      paddingBottom: `calc(${vars.space.sm} + env(safe-area-inset-bottom))`,
    },
  },
})

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
