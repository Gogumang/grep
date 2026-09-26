import { globalStyle, style } from '@vanilla-extract/css'
import * as badge from '@/shared/styles/badge.css'
import { vars } from '@/shared/styles/contract.css'

const HEADER_HEIGHT = 60
const PANEL_WIDTH = 340
const MOBILE = 'screen and (max-width: 860px)'

export const builder = style({
  display: 'grid',
  gridTemplateColumns: `1fr ${PANEL_WIDTH}px`,
  height: `calc(100dvh - ${HEADER_HEIGHT}px)`,
  minHeight: 520,
  borderTop: `1px solid ${vars.color.border}`,
  '@media': {
    [MOBILE]: { gridTemplateColumns: '1fr', height: 'auto' },
  },
})

export const stage = style({
  position: 'relative',
  minWidth: 0,
  '@media': {
    [MOBILE]: { height: '62dvh', minHeight: 360 },
  },
})

export const hint = style({
  position: 'absolute',
  left: vars.space.md,
  bottom: vars.space.md,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  background: 'rgba(20, 20, 24, 0.62)',
  color: '#fff',
  fontSize: vars.fontSize.xs,
  pointerEvents: 'none',
  '@media': {
    [MOBILE]: { display: 'none' },
  },
})

/** 캔버스 위 안내 자리. 공유받은 책상 안내와 잠깐 뜨는 알림이 위아래로 쌓인다. */
export const notices = style({
  position: 'absolute',
  top: vars.space.md,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  width: 'max-content',
  maxWidth: 'calc(100% - 32px)',
})

export const notice = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  background: vars.color.inkStrong,
  color: vars.color.canvas,
  fontSize: vars.fontSize.sm,
  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.18)',
})

export const noticeAction = style({
  border: 0,
  background: 'transparent',
  padding: 0,
  color: 'inherit',
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  textDecoration: 'underline',
})

export const messageClose = style({
  border: 0,
  background: 'transparent',
  color: 'inherit',
  opacity: 0.7,
  fontSize: vars.fontSize.md,
  lineHeight: 1,
  selectors: { '&:hover': { opacity: 1 } },
})

/*
 * 패널은 사이트의 다른 화면과 같은 부품을 쓴다(toss.tech 실측 기준).
 * - 묶음: 사이드바 FacetPanel과 같은 가라앉은 카드(surfaceSunken · radius.xl · 17px 굵은 회색 제목)
 * - 고르기: badge.css의 뱃지 — 고른 것은 파란 뱃지, 나머지는 회색 뱃지
 * - 목록: 사이드바 필터 행처럼 테두리 없는 글자 행, 오른쪽에 보조 숫자
 * - 버튼: 404 페이지의 파란 버튼(radius.md), 보조 동작은 글자 버튼(clearButton)
 */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  overflowY: 'auto',
  background: vars.color.canvas,
  borderLeft: `1px solid ${vars.color.border}`,
  '@media': {
    [MOBILE]: { borderLeft: 'none', borderTop: `1px solid ${vars.color.border}` },
  },
})

export const section = style({
  background: vars.color.surfaceSunken,
  borderRadius: vars.radius.xl,
  padding: vars.space.lg,
})

export const sectionTitle = style({
  margin: `0 0 ${vars.space.md}`,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.inkMuted,
})

export const selectedName = style({
  margin: `0 0 ${vars.space.md}`,
  fontSize: vars.fontSize.md,
  fontWeight: vars.fontWeight.semibold,
  color: vars.color.inkStrong,
})

export const placeholder = style({
  margin: 0,
  fontSize: vars.fontSize.sm,
  color: vars.color.inkMuted,
  lineHeight: 1.6,
})

export const badges = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
  marginBottom: vars.space.sm,
})

const badgeButton = style({ border: 0 })
export const badgeOption = style([badge.secondary, badgeButton])
export const badgeOptionSelected = style([badge.category, badgeButton])

export const itemRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: vars.space.sm,
  width: '100%',
  border: 0,
  background: 'transparent',
  padding: `${vars.space.sm} 0`,
  fontSize: vars.fontSize.md,
  color: vars.color.inkSoft,
  textAlign: 'left',
  selectors: {
    '&:hover:not(:disabled)': { color: vars.color.accent },
    '&:disabled': { color: vars.color.inkFaint, cursor: 'default' },
  },
})

export const itemMeta = style({
  flexShrink: 0,
  fontSize: vars.fontSize.xs,
  color: vars.color.inkFaint,
  fontVariantNumeric: 'tabular-nums',
})

export const actions = style({
  display: 'flex',
  gap: vars.space.md,
  alignItems: 'center',
})

export const primaryButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '9px 12px',
  border: 0,
  borderRadius: vars.radius.md,
  background: vars.color.accent,
  color: vars.color.onAccent,
  fontSize: vars.fontSize.md,
  fontWeight: vars.fontWeight.semibold,
  selectors: { '&:hover': { background: vars.color.accentHover } },
})

export const textButton = style({
  border: 0,
  background: 'transparent',
  padding: 0,
  color: vars.color.accent,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
})

export const note = style({
  margin: `${vars.space.md} 0 0`,
  fontSize: vars.fontSize.xs,
  color: vars.color.inkSubtle,
  lineHeight: 1.6,
})

export const creditsSummary = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  color: vars.color.inkMuted,
  cursor: 'pointer',
})

export const creditList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  margin: `${vars.space.sm} 0 0`,
  padding: 0,
  listStyle: 'none',
  fontSize: vars.fontSize.xs,
  color: vars.color.inkSubtle,
  lineHeight: 1.5,
})

globalStyle(`${creditList} a`, { color: vars.color.inkMuted, textDecoration: 'underline' })

// 캔버스 위에서 끄는 동작이 페이지 스크롤로 새지 않게 한다(모바일).
globalStyle(`${stage} canvas`, { touchAction: 'none' })
