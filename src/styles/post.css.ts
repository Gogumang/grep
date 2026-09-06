import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from '@/shared/styles/contract.css'

export const container = style({
  // toss.tech 실측: 본문 줄 폭 700px. 좌우 패딩을 더해 컨테이너를 잡는다.
  maxWidth: `calc(700px + ${vars.space.lg} * 2)`,
  margin: '0 auto',
  padding: `${vars.space.xxl} ${vars.space.lg} ${vars.space.xxxl}`,
})

export const meta = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: vars.fontSize.sm,
  color: vars.color.inkFaint,
})

/** toss.tech 실측: 48px / 700 / line-height 60px / margin-top 36px */
export const title = style({
  marginTop: 36,
  marginBottom: 0,
  fontSize: 'clamp(30px, 4vw, 48px)',
  fontWeight: vars.fontWeight.bold,
  lineHeight: 1.25,
  letterSpacing: '-0.025em',
  color: vars.color.ink,
})

/**
 * 글쓴이 줄. toss.tech 실측: 17px / 600 / line-height 25.5px / #4e5968,
 * 제목에서 24px 아래. 색은 inkSubtle이 그 실측값을 그대로 가리킨다.
 */
export const byline = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  // 실측은 앞뒤 공백을 낀 ' · '. 17px에서 공백 하나가 약 5px이라 gap으로 옮겼다.
  gap: 5,
  // 실측 24px. space 토큰이 lg(20px)와 xl(32px)뿐이라 여기서만 숫자를 직접 쓴다.
  marginTop: 24,
  marginBottom: 0,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.semibold,
  lineHeight: 1.5,
  color: vars.color.inkSubtle,
})

/** 이름과 출처를 가르는 표식일 뿐이라 화면 낭독기에는 읽히지 않는다. */
export const bylineDot = style({
  color: vars.color.inkFaint,
})

/** 출처 블로그. 토스는 평문이지만 여기는 여러 블로그를 모으는 곳이라 홈으로 건다. */
export const bylineSource = style({
  color: 'inherit',
  selectors: {
    '&:hover': { textDecoration: 'underline', textUnderlineOffset: '3px' },
  },
})

/**
 * 발행일. toss.tech 실측: 14px / 400 / line-height 21px / #8b95a1,
 * 글쓴이 줄 바로 아래 2px. fontSize 토큰은 13px과 15px뿐이라 여기서만 숫자를 쓴다.
 */
export const publishedAt = style({
  marginTop: 2,
  marginBottom: 0,
  fontSize: 14,
  fontWeight: vars.fontWeight.regular,
  lineHeight: 1.5,
  color: vars.color.inkFaint,
})

/** 제목 아래 한 번만. 출처는 글쓴이 줄과 canonical로도 밝힌다. */
export const sourceLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  marginTop: vars.space.lg,
  padding: `10px ${vars.space.lg}`,
  borderRadius: vars.radius.md,
  background: vars.color.surfaceSunken,
  color: vars.color.ink,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  selectors: {
    '&:hover': { background: vars.color.borderStrong },
  },
})

export const body = style({
  marginTop: vars.space.xxl,
  paddingTop: vars.space.xxl,
  borderTop: `1px solid ${vars.color.border}`,
  // toss.tech 실측: 17px / line-height 27.2px(=1.6) / 색 rgb(51,61,75)
  fontSize: vars.fontSize.lg,
  lineHeight: 1.6,
  color: vars.color.ink,
  wordBreak: 'break-word',
})

// 본문은 남의 글을 마크다운으로 옮겨 온 것이라 어떤 요소가 들어올지 알 수 없다.
// 그래서 클래스가 아니라 자식 선택자로 한 번에 규칙을 건다.
globalStyle(`${body} h1, ${body} h2, ${body} h3, ${body} h4`, {
  color: vars.color.inkStrong,
  letterSpacing: '-0.02em',
})

/**
 * toss.tech 실측. 이전 값(h2 20px, h3 17px)은 본문 17px과 거의 같아
 * 소제목이 소제목으로 안 읽혔다.
 */
globalStyle(`${body} h2`, { fontSize: 30, lineHeight: '46.5px', margin: '40px 0 4px' })
globalStyle(`${body} h3`, { fontSize: 24, lineHeight: '38.4px', margin: '24px 0 4px' })
globalStyle(`${body} h1`, { fontSize: 36, lineHeight: 1.4, margin: '40px 0 4px' })
globalStyle(`${body} h4`, { fontSize: 20, lineHeight: 1.5, margin: '24px 0 4px' })

// toss.tech 실측: 문단 margin 24px 0 8px
globalStyle(`${body} p, ${body} ul, ${body} ol, ${body} blockquote`, {
  margin: '24px 0 8px',
})

// toss.tech 실측: 항목 사이 16px, 들여쓰기는 항목 쪽 padding-left 24px
globalStyle(`${body} li`, {
  marginBottom: 16,
  paddingLeft: 4,
})
globalStyle(`${body} ul, ${body} ol`, {
  paddingLeft: 24,
})

globalStyle(`${body} a`, {
  color: vars.color.accent,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
})

globalStyle(`${body} img`, {
  maxWidth: '100%',
  height: 'auto',
  borderRadius: vars.radius.lg,
  margin: `${vars.space.xl} 0`,
})

/**
 * toss.tech 실측. 블록은 테두리 1px #EFEFEF에 radius 4px,
 * 인라인은 배경 rgba(2,32,71,0.05)에 radius 3px.
 */
const MONO_FONT = 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

globalStyle(`${body} pre`, {
  background: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  // 실측 4px. radius 토큰의 가장 작은 값이 8px이라 여기서만 숫자를 직접 쓴다.
  borderRadius: 4,
  padding: vars.space.lg,
  // 긴 코드가 페이지 전체를 밀어내지 않도록 이 안에서만 가로로 흐르게 한다.
  overflowX: 'auto',
  fontFamily: MONO_FONT,
  fontSize: 13,
  lineHeight: 1.6,
})

/** 블록 안 code는 인라인 장식을 물려받지 않는다. */
globalStyle(`${body} pre code`, {
  background: 'none',
  border: 0,
  padding: 0,
  fontSize: 'inherit',
  fontFamily: 'inherit',
})

/** 구문 강조 색도 toss.tech 실측값이다. 테마 CSS를 통째로 들이지 않는다. */
globalStyle(`${body} .hljs-keyword, ${body} .hljs-built_in, ${body} .hljs-literal`, {
  color: 'rgb(124, 90, 227)',
})
globalStyle(`${body} .hljs-comment, ${body} .hljs-quote`, {
  color: 'rgb(153, 153, 153)',
  fontStyle: 'italic',
})
globalStyle(`${body} .hljs-title, ${body} .hljs-function, ${body} .hljs-title.function_`, {
  color: 'rgb(133, 166, 0)',
})
globalStyle(`${body} .hljs-string, ${body} .hljs-number, ${body} .hljs-regexp`, {
  color: 'rgb(28, 128, 108)',
})
globalStyle(`${body} .hljs-attr, ${body} .hljs-property, ${body} .hljs-variable`, {
  color: 'rgb(51, 61, 75)',
})

globalStyle(`${body} :not(pre) > code`, {
  background: 'rgba(2, 32, 71, 0.05)',
  border: '1px solid rgba(0, 27, 55, 0.1)',
  borderRadius: 3,
  padding: '0 3px',
  fontFamily: MONO_FONT,
  fontSize: '0.9em',
})

/** 원문의 <aside>가 인용문으로 옮겨 온다. toss.tech 실측: #F2F4F6 / radius 16px */
globalStyle(`${body} blockquote`, {
  background: vars.color.surfaceSunken,
  borderRadius: vars.radius.xl,
  padding: '16px 40px 32px',
  margin: '24px 0 8px',
  color: 'inherit',
})

globalStyle(`${body} table`, {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.fontSize.sm,
})
globalStyle(`${body} th, ${body} td`, {
  border: `1px solid ${vars.color.border}`,
  padding: vars.space.sm,
  textAlign: 'left',
})

export const missingBody = style({
  marginTop: vars.space.xxl,
  padding: `${vars.space.xxl} ${vars.space.lg}`,
  border: `1px dashed ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  textAlign: 'center',
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.sm,
})
