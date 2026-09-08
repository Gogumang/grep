import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

export const header = style({
  position: 'sticky',
  top: 0,
  zIndex: 20,
  background: vars.color.canvas,
})

export const inner = style({
  maxWidth: 1100,
  margin: '0 auto',
  padding: `0 ${vars.space.lg}`,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.lg,
})

export const spacer = style({ flex: 1 })

/**
 * 검색 자리. 토스증권 헤더 실측(2026-09-09):
 *   버튼 200×32 · 배경 rgba(2,32,71,0.05)(흰 바탕에서 #f2f4f6) · radius 8px
 *   돋보기 14px · 키 칩 20×20 radius 5px · 안내문 14px/500 #6b7684
 *
 * 동그란 아이콘 하나만 두면 "찾을 수 있는 곳"이라는 걸 아이콘 뜻으로만 알려주게 된다.
 * 눌러야 할 자리를 글로 적어 두면 처음 온 사람도 읽고, 단축키까지 같이 배운다.
 */
export const searchField = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  width: 200,
  height: 32,
  padding: `0 ${vars.space.md}`,
  borderRadius: vars.radius.sm,
  border: 'none',
  background: vars.color.surfaceSunken,
  color: vars.color.inkMuted,
  selectors: {
    '&:hover': { background: vars.color.border },
  },
  '@media': {
    /*
      좁은 화면에서는 안내문과 키 칩을 접고 돋보기만 남긴다 —
      워드마크·검색·테마가 한 줄에 들어가야 하고, 폰에는 누를 단축키도 없다.
    */
    'screen and (max-width: 640px)': {
      width: 36,
      height: 36,
      padding: 0,
      borderRadius: vars.radius.full,
      justifyContent: 'center',
    },
  },
})

/** 돋보기. 안내문(14px)과 나란히 서므로 그보다 한 단계 작게 둔다. */
export const searchIcon = style({
  flexShrink: 0,
  width: 14,
  height: 14,
  '@media': {
    'screen and (max-width: 640px)': { width: 16, height: 16 },
  },
})

const foldOnNarrowScreen = {
  '@media': {
    'screen and (max-width: 640px)': { display: 'none' },
  },
} as const

/** 단축키 칩. 배경을 한 단계 더 얹어 눌리는 키처럼 보이게 한다. */
export const searchKey = style({
  ...foldOnNarrowScreen,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  width: 20,
  height: 20,
  borderRadius: 5,
  background: vars.color.border,
  color: vars.color.inkSubtle,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
})

export const searchHint = style({
  ...foldOnNarrowScreen,
  whiteSpace: 'nowrap',
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
})

/**
 * 테마 토글. 이쪽은 테두리를 두르지 않고 그림 자체를 키운다 —
 * Tossface의 달·해는 이미 면으로 꽉 찬 그림이라, 동그라미로 한 번 더 감싸면
 * 테두리 안에 그림이 갇혀 작아 보인다. 검색은 선 아이콘이라 테두리가 필요하지만
 * 이건 그 자체로 버튼처럼 읽힌다.
 *
 * 누르는 영역은 36px로 남긴다 — 그림만 커지고 손가락이 닿을 곳이 줄면 안 된다.
 */
export const themeToggle = style({
  border: 'none',
  background: 'none',
  padding: 0,
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  /*
    36px 자리에 28px. 옆의 검색 버튼(36px 원)과 존재감이 맞는 크기다 —
    24px 이하면 다시 작아 보이고, 30px을 넘기면 글자가 자리 끝에 닿는다.
  */
  fontSize: 28,
  lineHeight: 1,
  /* 색 이모지는 currentColor를 따르지 않는다 — 눌리는 느낌은 크기로 준다. */
  transition: 'transform 120ms ease',
  selectors: {
    '&:hover': { transform: 'scale(1.12)' },
    '&:active': { transform: 'scale(0.94)' },
  },
})

/**
 * 테마 토글의 달·해를 CSS로 그린다.
 *
 * head의 인라인 스크립트가 페인트 전에 data-theme을 정해 두므로, 글자도 그것만 보면
 * 자바스크립트 모듈을 기다릴 필요가 없다. textContent로 칠하면 모듈이 도착할 때까지
 * HTML에 박힌 달이 먼저 보였다가 해로 바뀐다 — 다크 모드로 들어온 사람에게 깜빡임이다.
 *
 * 누르면 무엇이 되는지를 보여준다 — 밝을 때 달, 어두울 때 해.
 * 그리는 건 토스가 공개한 이모지 폰트다(폰트 스택에서 시스템 폰트보다 앞이다).
 */
export const themeGlyph = style({
  selectors: {
    '&::before': { content: '"🌙"' },
    '[data-theme="dark"] &::before': { content: '"☀️"' },
  },
})
