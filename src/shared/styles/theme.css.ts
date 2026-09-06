import { assignVars, globalStyle } from '@vanilla-extract/css'
import { darkTheme, lightTheme } from '../tokens/themes'
import { vars } from './contract.css'

// [data-theme]가 prefers-color-scheme보다 뒤에 와야 토글이 양방향으로 동작한다.
globalStyle(':root', { vars: assignVars(vars, lightTheme) })

globalStyle(':root', {
  '@media': { '(prefers-color-scheme: dark)': { vars: assignVars(vars, darkTheme) } },
})

globalStyle(':root[data-theme="light"]', { vars: assignVars(vars, lightTheme) })
globalStyle(':root[data-theme="dark"]', { vars: assignVars(vars, darkTheme) })
