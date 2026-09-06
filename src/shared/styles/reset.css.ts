import { globalStyle } from '@vanilla-extract/css'
import { vars } from './contract.css'
import './theme.css'

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })

// 라이트/다크 어느 쪽이든 브라우저 기본 UI(스크롤바 등)가 함께 따라오도록.
globalStyle('html', { colorScheme: 'light dark' })

globalStyle('body', {
  margin: 0,
  background: vars.color.canvas,
  color: vars.color.ink,
  fontFamily: vars.font.sans,
  WebkitFontSmoothing: 'antialiased',
})

globalStyle('a', { color: 'inherit', textDecoration: 'none' })
globalStyle('button', { font: 'inherit', cursor: 'pointer' })
globalStyle('img', { maxWidth: '100%', display: 'block' })

globalStyle('::selection', { background: vars.color.accent, color: vars.color.onAccent })

globalStyle('*:focus-visible', {
  outline: `2px solid ${vars.color.accent}`,
  outlineOffset: '2px',
  borderRadius: vars.radius.sm,
})
