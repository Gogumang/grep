import { style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

/**
 * 로고 묶음. toss.tech 로고는 110×20으로 아주 작고 납작하다 —
 * 헤더에서 존재감을 주장하지 않고 내용에 자리를 내주는 크기다.
 */
export const wordmark = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: 20,
})

export const text = style({
  fontSize: vars.fontSize.xl,
  lineHeight: 1,
})

/**
 * 토스가 'toss'를 굵고 진하게 쓰는 자리. 우리는 글꼴을 바꿔 세운다 —
 * 여기어때 잘난체는 네모틀에 꽉 찬 제목용 서체라, 본문과 같은 Pretendard를 굵게 쓰는 것과 달리
 * 글자 자체가 로고처럼 읽힌다.
 *
 * 대문자로 세운다. 잘난체의 라틴 대문자는 높이가 고르게 맞아 네 글자가 한 덩어리로 보이는데,
 * 소문자는 g·p의 내려긋기가 20px 상자 밖으로 삐져나와 헤더 아래 선에 닿는다.
 * DOM에는 'grep'을 그대로 둔다 — 복사하거나 읽어 주는 쪽에는 이름이 소문자다.
 *
 * letterSpacing을 text에서 걷어내고 여기서 다시 준다. -0.04em은 Pretendard 기준으로 잡은 값이라
 * 이미 자간이 좁은 잘난체에 그대로 얹으면 글자끼리 붙는다.
 */
export const brand = style({
  fontFamily: vars.font.display,
  textTransform: 'uppercase',
  letterSpacing: '0.01em',
  color: vars.color.inkStrong,
})
