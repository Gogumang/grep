import { globalStyle, style } from '@vanilla-extract/css'
import { IDE_COLORS } from '@/coding/ideColors'
import { vars } from '@/shared/styles/contract.css'

/** 이 폭 아래에서는 좌우 분할을 풀고 위아래로 쌓는다. 페이지 전체가 스크롤된다. */
const STACKED = 'screen and (max-width: 960px)'
const TOP_BAR_HEIGHT = 48
const TITLE_BAR_HEIGHT = 52

// ── 문제 목록(/coding) ─────────────────────────────────────────

export const listContainer = style({
  maxWidth: 760,
  margin: '0 auto',
  padding: `${vars.space.xxl} ${vars.space.lg} ${vars.space.xxxl}`,
})

export const pageTitle = style({
  margin: 0,
  fontSize: vars.fontSize.xxl,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.inkStrong,
})

export const pageLead = style({
  margin: `${vars.space.sm} 0 ${vars.space.xl}`,
  color: vars.color.inkMuted,
  lineHeight: 1.6,
})

export const problemList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  borderTop: `1px solid ${vars.color.border}`,
})

export const problemLink = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.md} ${vars.space.xs}`,
  borderBottom: `1px solid ${vars.color.border}`,
  color: vars.color.ink,
  textDecoration: 'none',
  selectors: { '&:hover': { background: vars.color.surfaceSunken } },
})

export const problemTitle = style({ fontWeight: vars.fontWeight.semibold })

export const problemTags = style({ marginLeft: 'auto', fontSize: vars.fontSize.xs, color: vars.color.inkSubtle })

// ── 풀이 화면(/coding/<id>) ────────────────────────────────────

/** 화면 전체를 쓰고 페이지는 스크롤하지 않는다. 문제·편집기·결과가 각자 스크롤된다. */
export const ide = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  background: IDE_COLORS.pane,
  color: IDE_COLORS.text,
  colorScheme: 'dark',
  '@media': { [STACKED]: { height: 'auto', minHeight: '100dvh' } },
})

export const topBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  flexShrink: 0,
  height: TOP_BAR_HEIGHT,
  padding: `0 ${vars.space.lg}`,
  background: IDE_COLORS.bar,
  fontSize: vars.fontSize.sm,
})

export const brand = style({
  color: IDE_COLORS.textStrong,
  fontWeight: vars.fontWeight.bold,
  letterSpacing: '0.02em',
  textDecoration: 'none',
})

export const breadcrumb = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minWidth: 0,
  color: IDE_COLORS.textMuted,
})

export const breadcrumbLink = style({
  color: IDE_COLORS.textMuted,
  textDecoration: 'none',
  selectors: { '&:hover': { color: IDE_COLORS.textStrong } },
})

export const breadcrumbCurrent = style({
  overflow: 'hidden',
  color: IDE_COLORS.textStrong,
  fontWeight: vars.fontWeight.semibold,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const titleBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexShrink: 0,
  height: TITLE_BAR_HEIGHT,
  padding: `0 ${vars.space.lg}`,
  borderBottom: `1px solid ${IDE_COLORS.border}`,
})

export const title = style({
  margin: 0,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.bold,
  color: IDE_COLORS.textStrong,
})

export const levelBadge = style({
  padding: '1px 8px',
  borderRadius: vars.radius.sm,
  background: 'rgba(49, 130, 246, 0.18)',
  color: '#7fb0ff',
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.semibold,
})

export const tags = style({ fontSize: vars.fontSize.xs, color: IDE_COLORS.textMuted })

/** 왼쪽 폭은 가운데 손잡이로 바꾼다(--left-width, 페이지 스크립트가 고친다). */
export const panes = style({
  display: 'grid',
  gridTemplateColumns: 'var(--left-width, 40%) 8px minmax(0, 1fr)',
  flex: 1,
  minHeight: 0,
  '@media': { [STACKED]: { display: 'flex', flexDirection: 'column' } },
})

export const statement = style({
  minWidth: 0,
  overflowY: 'auto',
  padding: `${vars.space.lg} ${vars.space.lg} ${vars.space.xxl}`,
  fontSize: 15,
  lineHeight: 1.7,
  scrollbarWidth: 'thin',
  scrollbarColor: `${IDE_COLORS.border} transparent`,
})

export const verticalHandle = style({
  position: 'relative',
  cursor: 'col-resize',
  borderLeft: `1px solid ${IDE_COLORS.border}`,
  touchAction: 'none',
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: 1,
      width: 3,
      height: 32,
      transform: 'translateY(-50%)',
      borderLeft: `1px solid ${IDE_COLORS.textMuted}`,
      borderRight: `1px solid ${IDE_COLORS.textMuted}`,
    },
    '&:hover, &[data-dragging]': { background: IDE_COLORS.paneRaised },
  },
  '@media': { [STACKED]: { display: 'none' } },
})

export const section = style({
  paddingBottom: vars.space.lg,
  marginBottom: vars.space.lg,
  borderBottom: `1px solid ${IDE_COLORS.border}`,
  selectors: { '&:last-child': { borderBottom: 0 } },
})

export const sectionTitle = style({
  margin: `0 0 ${vars.space.md}`,
  fontSize: vars.fontSize.md,
  fontWeight: vars.fontWeight.bold,
  color: IDE_COLORS.textStrong,
})

export const prose = style({ wordBreak: 'keep-all' })

globalStyle(`${prose} p`, { margin: `0 0 ${vars.space.sm}` })
globalStyle(`${prose} strong`, { color: IDE_COLORS.textStrong })
globalStyle(`${prose} code`, {
  padding: '2px 6px',
  borderRadius: vars.radius.sm,
  background: IDE_COLORS.block,
  color: IDE_COLORS.textStrong,
  fontSize: '0.88em',
})

export const limitList = style({ margin: 0, paddingLeft: 20 })

export const exampleLabel = style({
  margin: `${vars.space.md} 0 ${vars.space.sm}`,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  color: IDE_COLORS.text,
})

export const exampleBlock = style({
  margin: 0,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderRadius: vars.radius.md,
  background: IDE_COLORS.block,
  color: IDE_COLORS.textStrong,
  fontSize: 14,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
})

export const workspaceLoading = style({
  display: 'grid',
  placeItems: 'center',
  color: IDE_COLORS.textMuted,
  fontSize: vars.fontSize.sm,
})
