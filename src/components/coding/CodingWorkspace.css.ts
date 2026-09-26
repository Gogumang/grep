import { globalStyle, style } from '@vanilla-extract/css'
import { IDE_COLORS } from '@/coding/ideColors'
import { vars } from '@/shared/styles/contract.css'

const STACKED = 'screen and (max-width: 960px)'
const MONOSPACE = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

/** 오른쪽 칸: 편집기 탭 → 편집기 → 손잡이 → 실행 결과 → 버튼 줄. 편집기 높이는 --editor-share가 정한다. */
export const workspace = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  '@media': { [STACKED]: { borderTop: `1px solid ${IDE_COLORS.border}` } },
})

export const editorHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  flexShrink: 0,
  height: 44,
  padding: `0 ${vars.space.md} 0 ${vars.space.lg}`,
  borderBottom: `1px solid ${IDE_COLORS.border}`,
})

export const fileName = style({
  marginRight: 'auto',
  color: IDE_COLORS.textStrong,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
})

export const languageNote = style({
  fontSize: vars.fontSize.xs,
  color: IDE_COLORS.textMuted,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const select = style({
  padding: '5px 8px',
  border: `1px solid ${IDE_COLORS.border}`,
  borderRadius: vars.radius.sm,
  background: IDE_COLORS.paneRaised,
  color: IDE_COLORS.textStrong,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
})

export const editor = style({
  flex: 'var(--editor-share, 62) 1 0',
  minHeight: 120,
  overflow: 'hidden',
  '@media': { [STACKED]: { flex: 'none', height: '60dvh' } },
})

globalStyle(`${editor} .cm-editor`, { height: '100%', fontSize: 14 })
globalStyle(`${editor} .cm-scroller`, { fontFamily: MONOSPACE, lineHeight: 1.6 })
globalStyle(`${editor} .cm-editor.cm-focused`, { outline: 'none' })

export const horizontalHandle = style({
  position: 'relative',
  flexShrink: 0,
  height: 8,
  borderTop: `1px solid ${IDE_COLORS.border}`,
  cursor: 'row-resize',
  touchAction: 'none',
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '50%',
      top: 1,
      width: 32,
      height: 3,
      transform: 'translateX(-50%)',
      borderTop: `1px solid ${IDE_COLORS.textMuted}`,
      borderBottom: `1px solid ${IDE_COLORS.textMuted}`,
    },
    '&:hover, &[data-dragging]': { background: IDE_COLORS.paneRaised },
  },
  '@media': { [STACKED]: { display: 'none' } },
})

export const resultPane = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 'calc(100 - var(--editor-share, 62)) 1 0',
  minHeight: 80,
  '@media': { [STACKED]: { flex: 'none', minHeight: 200 } },
})

export const resultHeader = style({
  flexShrink: 0,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  borderBottom: `1px solid ${IDE_COLORS.border}`,
  color: IDE_COLORS.textMuted,
  fontSize: vars.fontSize.sm,
})

export const resultBody = style({
  flex: 1,
  overflowY: 'auto',
  padding: `${vars.space.md} ${vars.space.lg}`,
  fontFamily: MONOSPACE,
  fontSize: 13,
  lineHeight: 1.7,
  color: IDE_COLORS.text,
})

export const placeholder = style({ margin: 0, color: IDE_COLORS.textMuted })

export const resultLine = style({ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' })

export const resultGroup = style({ margin: `0 0 ${vars.space.md}` })

export const resultLabel = style({ color: IDE_COLORS.textMuted })

/** 표준 입출력 문제는 입력·기댓값·실행 결과가 여러 줄이다. 세로로 늘어놓으면 결과 칸이 금방 넘쳐 나란히 둔다. */
export const ioGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: vars.space.sm,
  marginTop: vars.space.xs,
  '@media': { 'screen and (max-width: 640px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
})

export const ioValue = style({
  margin: `${vars.space.xs} 0 0`,
  maxHeight: 160,
  overflow: 'auto',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  background: IDE_COLORS.block,
  color: IDE_COLORS.textStrong,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
})

export const passed = style({ color: IDE_COLORS.success })

export const failed = style({ color: IDE_COLORS.failure })

export const summary = style({
  margin: `${vars.space.md} 0 0`,
  paddingTop: vars.space.md,
  borderTop: `1px dashed ${IDE_COLORS.border}`,
  fontWeight: vars.fontWeight.bold,
})

export const actionBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexShrink: 0,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  borderTop: `1px solid ${IDE_COLORS.border}`,
  background: IDE_COLORS.bar,
})

export const shortcut = style({
  marginRight: 'auto',
  fontSize: vars.fontSize.xs,
  color: IDE_COLORS.textMuted,
  '@media': { [STACKED]: { display: 'none' } },
})

// 브라우저 기본 버튼 모양(appearance: auto)은 배경을 투명으로 줘도 흰 버튼으로 그려진다 — 끄고 색을 직접 준다.
const buttonBase = style({
  appearance: 'none',
  padding: '8px 16px',
  borderRadius: vars.radius.sm,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  cursor: 'pointer',
  selectors: { '&:disabled': { opacity: 0.5, cursor: 'wait' } },
})

export const ghostButton = style([
  buttonBase,
  {
    border: `1px solid ${IDE_COLORS.border}`,
    background: IDE_COLORS.bar,
    color: IDE_COLORS.text,
    selectors: { '&:hover:not(:disabled)': { background: IDE_COLORS.paneRaised } },
  },
])

export const secondaryButton = style([
  buttonBase,
  {
    border: 0,
    background: '#3a4656',
    color: IDE_COLORS.textStrong,
    selectors: { '&:hover:not(:disabled)': { background: '#465467' } },
  },
])

export const primaryButton = style([
  buttonBase,
  {
    border: 0,
    background: IDE_COLORS.accent,
    color: '#fff',
    selectors: { '&:hover:not(:disabled)': { background: IDE_COLORS.accentHover } },
  },
])
