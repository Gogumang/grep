/**
 * 풀이 화면(IDE)의 색. 사이트 라이트/다크 테마와 상관없이 늘 어둡게 고정한다 —
 * 오래 코드를 보는 화면이고, 편집기·실행 결과·문제 설명이 한 색 안에 있어야 경계가 덜 튄다.
 * 페이지 스타일(styles/coding.css.ts)과 편집기 테마(CodeEditor)가 함께 쓴다.
 */
export const IDE_COLORS = {
  bar: '#0f141a',
  pane: '#1a212b',
  paneRaised: '#202834',
  block: '#121820',
  border: '#2c3643',
  text: '#d5dce5',
  textStrong: '#f2f5f8',
  textMuted: '#8a97a8',
  accent: '#3182f6',
  accentHover: '#1b64da',
  success: '#3fb96f',
  failure: '#f0655b',
} as const
