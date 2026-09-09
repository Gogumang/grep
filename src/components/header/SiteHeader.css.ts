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
 * 검색 자리. 돋보기 하나만 세운다.
 *
 * 알약 배경도, "/를 눌러 검색하세요"라는 안내문도 걷어냈다. 배경은 헤더에 셋뿐인 자리
 * 하나만 무겁게 만들었고, 안내문은 옆의 테마 토글까지 세 덩어리를 한 줄에 늘어놓아
 * 오른쪽이 왼쪽 워드마크보다 시끄러웠다. 돋보기는 설명 없이도 읽히는 그림이다.
 *
 * '/'와 ⌘K 단축키는 그대로 산다 — BaseLayout이 계속 받는다. 적어 두지 않을 뿐이다.
 */
export const searchField = style({
  display: 'grid',
  placeItems: 'center',
  width: 36,
  height: 36,
  padding: 0,
  border: 'none',
  background: 'none',
  color: vars.color.inkMuted,
  /* 색 이모지는 currentColor를 따르지 않는다 — 글자 쪽이 짙어지는 것으로 반응을 준다. */
  selectors: {
    '&:hover': { color: vars.color.ink },
  },
})

/**
 * 돋보기. 토스가 공개한 이모지 폰트가 그린다 — 본문 이모지와 같은 손이라
 * 헤더만 다른 그림체로 겉돌지 않는다(폰트 스택에서 시스템 폰트보다 앞이다).
 *
 * 24px. 안내문이 사라져 이제 옆의 테마 토글(28px)하고만 크기를 겨룬다 —
 * 안내문과 나란할 때 쓰던 22px로는 혼자 남으니 작아 보인다.
 * 다크에서는 렌즈가 밝게 그려져 더 작으면 손잡이가 묻히고 그냥 동그라미로 읽힌다.
 */
export const searchIcon = style({
  fontSize: 24,
  lineHeight: 1,
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
