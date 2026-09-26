import type { CaseReport, CaseVerdict, GradeReport, GradeScope, TestCase } from '@/shared/types'
import * as styles from './CodingWorkspace.css'

const VERDICT_LABELS: Record<CaseVerdict, string> = {
  accepted: '통과',
  'wrong-answer': '실패',
  'time-limit': '실패 (시간 초과)',
  'memory-limit': '실패 (메모리 초과)',
  'output-limit': '실패 (출력 초과)',
  'runtime-error': '실패 (런타임 에러)',
  'judge-error': '실패 (채점 오류)',
}

const KILOBYTES_PER_MEGABYTE = 1024

export type GradeState =
  | { kind: 'idle' }
  | { kind: 'running'; scope: GradeScope }
  | { kind: 'failed'; message: string }
  | { kind: 'done'; scope: GradeScope; report: GradeReport }

interface ResultPanelProps {
  state: GradeState
  examples: TestCase[]
}

/** 실행 결과 칸. 터미널 출력처럼 고정폭 글자로 줄줄이 적는다. */
export function ResultPanel({ state, examples }: ResultPanelProps) {
  if (state.kind === 'idle') return <p className={styles.placeholder}>실행 결과가 여기에 표시됩니다.</p>
  if (state.kind === 'running') {
    return (
      <p className={styles.placeholder}>
        {state.scope === 'all' ? '채점 중입니다…' : '실행 중입니다…'} (Kotlin·Go·C++는 컴파일에 몇 초 걸립니다)
      </p>
    )
  }
  if (state.kind === 'failed') return <p className={`${styles.resultLine} ${styles.failed}`}>{state.message}</p>

  const { report, scope } = state
  if (report.kind === 'compile-error') {
    return (
      <>
        <p className={`${styles.resultLine} ${styles.failed}`}>컴파일 에러</p>
        <p className={styles.resultLine}>{report.message}</p>
      </>
    )
  }

  const passedCount = report.cases.filter((entry) => entry.verdict === 'accepted').length
  return (
    <>
      {scope === 'examples'
        ? report.cases.map((entry, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 케이스에는 id가 없고 서버가 순서를 고정해 돌려준다
            <ExampleResult key={index} entry={entry} index={index} example={examples[index]} />
          ))
        : report.cases.map((entry, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 위와 같다
            <p key={index} className={styles.resultLine}>
              {entry.isHidden ? `숨은 테스트 ${index - examples.length + 1}` : `테스트 ${index + 1}`} 〉{' '}
              <Verdict entry={entry} />
            </p>
          ))}
      <p className={`${styles.resultLine} ${styles.summary} ${report.isAccepted ? styles.passed : styles.failed}`}>
        {scope === 'all'
          ? report.isAccepted
            ? `정답입니다! ${report.cases.length}개 테스트를 모두 통과했습니다.`
            : `${report.cases.length}개 중 ${passedCount}개 통과 — 다시 도전해 보세요.`
          : `예시 ${report.cases.length}개 중 ${passedCount}개 통과`}
      </p>
    </>
  )
}

function ExampleResult({ entry, index, example }: { entry: CaseReport; index: number; example?: TestCase }) {
  return (
    <div className={styles.resultGroup}>
      <p className={styles.resultLine}>
        테스트 {index + 1} 〉 <Verdict entry={entry} />
      </p>
      <div className={styles.ioGrid}>
        <IoValue label="입력값" value={example?.input ?? ''} />
        <IoValue label="기댓값" value={example?.output ?? ''} />
        <IoValue label="실행 결과" value={entry.stdout ?? ''} />
      </div>
      {entry.stderr && <IoValue label="표준 에러" value={entry.stderr} />}
    </div>
  )
}

function IoValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className={styles.resultLabel}>{label} 〉</span>
      <pre className={styles.ioValue}>{value.replace(/\n+$/, '') || '(출력 없음)'}</pre>
    </div>
  )
}

function Verdict({ entry }: { entry: CaseReport }) {
  const isAccepted = entry.verdict === 'accepted'
  return (
    <span className={isAccepted ? styles.passed : styles.failed}>
      {VERDICT_LABELS[entry.verdict]} ({entry.timeMs}ms, {(entry.memoryKb / KILOBYTES_PER_MEGABYTE).toFixed(1)}MB)
    </span>
  )
}
