import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { StreamLanguage } from '@codemirror/language'
import { kotlin } from '@codemirror/legacy-modes/mode/clike'
import { go } from '@codemirror/legacy-modes/mode/go'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { githubDarkInit } from '@uiw/codemirror-theme-github'
import CodeMirror, { type Extension } from '@uiw/react-codemirror'
import { useMemo } from 'react'
import { IDE_COLORS } from '@/coding/ideColors'
import type { JudgeLanguage } from '@/shared/types'

const LANGUAGE_EXTENSIONS: Record<JudgeLanguage, () => Extension> = {
  c: () => cpp(),
  cpp: () => cpp(),
  java: () => java(),
  kotlin: () => StreamLanguage.define(kotlin),
  go: () => StreamLanguage.define(go),
  python: () => python(),
  ruby: () => StreamLanguage.define(ruby),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
}

/** 풀이 화면은 늘 어둡다(ideColors). 편집기 바탕을 주변 칸과 같은 색으로 맞춰 경계가 뜨지 않게 한다. */
const IDE_THEME = githubDarkInit({
  settings: {
    background: IDE_COLORS.pane,
    gutterBackground: IDE_COLORS.pane,
    gutterForeground: IDE_COLORS.textMuted,
    lineHighlight: IDE_COLORS.paneRaised,
  },
})

interface CodeEditorProps {
  language: JudgeLanguage
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  const extensions = useMemo(() => [LANGUAGE_EXTENSIONS[language]()], [language])
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={IDE_THEME}
      height="100%"
      basicSetup={{ tabSize: 4, foldGutter: false }}
      aria-label="코드 편집기"
    />
  )
}
