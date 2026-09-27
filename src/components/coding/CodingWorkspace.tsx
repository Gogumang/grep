import { type CSSProperties, type PointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_LANGUAGE, functionLanguageOptions, LANGUAGE_OPTIONS } from '@/coding/languages'
import type { GradeReport, GradeScope, JudgeLanguage, ProblemFunction, TestCase } from '@/shared/types'
import { CodeEditor } from './CodeEditor'
import * as styles from './CodingWorkspace.css'
import { type GradeState, ResultPanel } from './ResultPanel'
import { useGradeThrottle } from './useGradeThrottle'

/** 마지막으로 고른 언어와 편집기 높이는 문제를 옮겨 다녀도 유지한다. 코드는 문제·언어마다 따로 둔다. */
const LANGUAGE_STORAGE_KEY = 'grep-coding-language'
const EDITOR_SHARE_STORAGE_KEY = 'grep-coding-editor-share'

/**
 * 함수 방식 문제는 키 끝에 :function 을 붙인다 — 같은 문제가 표준입출력에서 함수 방식으로 바뀌면
 * 예전에 저장한 main 코드가 뼈대 대신 떠서 채점이 전부 틀린다.
 */
const codeStorageKey = (problemId: string, language: JudgeLanguage, isFunction: boolean) =>
  `grep-coding:${problemId}:${language}${isFunction ? ':function' : ''}`

/** 편집기가 오른쪽 칸에서 차지하는 비율(%). 나머지는 실행 결과 칸이다. */
const DEFAULT_EDITOR_SHARE = 62
const MIN_EDITOR_SHARE = 25
const MAX_EDITOR_SHARE = 88

interface CodingWorkspaceProps {
  problemId: string
  examples: TestCase[]
  /** 함수 방식 문제면 채울 함수. 뼈대가 있는 언어만 고를 수 있고, 편집기는 뼈대로 시작한다. */
  problemFunction?: ProblemFunction | null
}

export function CodingWorkspace({ problemId, examples, problemFunction = null }: CodingWorkspaceProps) {
  const isFunction = problemFunction !== null
  const [options] = useState(() => (problemFunction ? functionLanguageOptions(problemFunction) : LANGUAGE_OPTIONS))
  const optionFor = (id: JudgeLanguage) =>
    options.find((option) => option.id === id) ?? (options[0] as (typeof options)[number])
  const [language, setLanguage] = useState<JudgeLanguage>(() => readLanguage(options.map((option) => option.id)))
  const [code, setCode] = useState(() =>
    readCode(codeStorageKey(problemId, language, isFunction), optionFor(language).template),
  )
  const [gradeState, setGradeState] = useState<GradeState>({ kind: 'idle' })
  const [editorShare, setEditorShare] = useState(() => readEditorShare())
  const isRunning = gradeState.kind === 'running'
  const throttle = useGradeThrottle()
  const isGradeDisabled = isRunning || throttle.isBlocked
  const waitSuffix = throttle.isBlocked ? ` (${throttle.waitSeconds})` : ''
  const languageOption = optionFor(language)

  const changeLanguage = (next: JudgeLanguage) => {
    setLanguage(next)
    setCode(readCode(codeStorageKey(problemId, next, isFunction), optionFor(next).template))
    setGradeState({ kind: 'idle' })
    writeStorage(LANGUAGE_STORAGE_KEY, next)
  }

  const changeCode = (next: string) => {
    setCode(next)
    writeStorage(codeStorageKey(problemId, language, isFunction), next)
  }

  const resetCode = () => {
    removeStorage(codeStorageKey(problemId, language, isFunction))
    setCode(languageOption.template)
    setGradeState({ kind: 'idle' })
  }

  const grade = useCallback(
    async (scope: GradeScope) => {
      if (throttle.isBlocked) {
        setGradeState({
          kind: 'failed',
          message: `너무 자주 채점했습니다. ${throttle.waitSeconds}초 뒤 다시 시도해주세요.`,
        })
        return
      }
      setGradeState({ kind: 'running', scope })
      try {
        const response = await fetch('/api/judge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId, language, code, scope }),
        })
        const payload = (await response.json()) as GradeReport | { message: string }
        if (!response.ok || 'message' in payload) {
          setGradeState({ kind: 'failed', message: 'message' in payload ? payload.message : '채점하지 못했습니다.' })
          return
        }
        setGradeState({ kind: 'done', scope, report: payload })
      } catch {
        setGradeState({ kind: 'failed', message: '채점 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요.' })
      } finally {
        // 끝난 뒤에 센다 — 결과를 읽기 전에 연달아 누르는 것을 막는 대기 시간이 채점이 끝난 때부터 흐른다.
        throttle.record()
      }
    },
    [problemId, language, code, throttle],
  )

  // ⌘/Ctrl + Enter로 코드 실행. 편집기 안에서 눌러도 동작한다.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey) || isGradeDisabled) return
      event.preventDefault()
      void grade('examples')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [grade, isGradeDisabled])

  const workspaceRef = useRef<HTMLElement>(null)
  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    const workspace = workspaceRef.current
    if (!workspace) return
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    handle.dataset.dragging = ''
    const bounds = workspace.getBoundingClientRect()
    let share = editorShare
    const onMove = (move: globalThis.PointerEvent) => {
      share = clampEditorShare(((move.clientY - bounds.top) / bounds.height) * 100)
      setEditorShare(share)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener(
      'pointerup',
      () => {
        delete handle.dataset.dragging
        handle.removeEventListener('pointermove', onMove)
        writeStorage(EDITOR_SHARE_STORAGE_KEY, String(Math.round(share)))
      },
      { once: true },
    )
  }

  return (
    <section
      ref={workspaceRef}
      className={styles.workspace}
      style={{ '--editor-share': editorShare } as CSSProperties}
      aria-label="풀이"
    >
      <div className={styles.editorHeader}>
        <span className={styles.fileName}>{languageOption.fileName}</span>
        <span className={styles.languageNote}>{languageOption.note}</span>
        <select
          className={styles.select}
          value={language}
          onChange={(event) => changeLanguage(event.target.value as JudgeLanguage)}
          aria-label="언어"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.editor}>
        <CodeEditor language={language} value={code} onChange={changeCode} />
      </div>
      <div className={styles.horizontalHandle} onPointerDown={startResize} aria-hidden="true" />

      <div className={styles.resultPane}>
        <div className={styles.resultHeader}>실행 결과</div>
        <div className={styles.resultBody} aria-live="polite">
          <ResultPanel state={gradeState} examples={examples} isFunction={isFunction} />
        </div>
      </div>

      <div className={styles.actionBar}>
        <span className={styles.shortcut}>⌘ Enter 코드 실행 · 코드는 이 브라우저에 저장됩니다</span>
        <button type="button" className={styles.ghostButton} disabled={isRunning} onClick={resetCode}>
          초기화
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isGradeDisabled}
          onClick={() => grade('examples')}
        >
          코드 실행{waitSuffix}
        </button>
        <button type="button" className={styles.primaryButton} disabled={isGradeDisabled} onClick={() => grade('all')}>
          제출 후 채점하기{waitSuffix}
        </button>
      </div>
    </section>
  )
}

function clampEditorShare(share: number): number {
  return Math.min(MAX_EDITOR_SHARE, Math.max(MIN_EDITOR_SHARE, share))
}

function readEditorShare(): number {
  const stored = Number(readStorage(EDITOR_SHARE_STORAGE_KEY))
  return stored ? clampEditorShare(stored) : DEFAULT_EDITOR_SHARE
}

/** 지난번 고른 언어. 이 문제에서 고를 수 없는 언어면(함수 방식 문제의 Go 등) 기본 언어, 그것도 없으면 첫 언어. */
function readLanguage(available: JudgeLanguage[]): JudgeLanguage {
  const stored = readStorage(LANGUAGE_STORAGE_KEY) as JudgeLanguage | null
  if (stored && available.includes(stored)) return stored
  return available.includes(DEFAULT_LANGUAGE) ? DEFAULT_LANGUAGE : (available[0] ?? DEFAULT_LANGUAGE)
}

function readCode(key: string, template: string): string {
  return readStorage(key) ?? template
}

// 저장은 편의 기능이다. 사생활 보호 모드처럼 저장소가 막혀도 풀이는 그대로 된다.
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장 실패는 무시한다 — 위 주석 참고.
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // 저장 실패는 무시한다 — 위 주석 참고.
  }
}
