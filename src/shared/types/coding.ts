/** 채점 서버에 설치된 언어. 늘리려면 collector(채점)와 채점 서버 이미지에도 더한다. */
export type JudgeLanguage = 'c' | 'cpp' | 'java' | 'kotlin' | 'go' | 'python' | 'ruby' | 'javascript' | 'typescript'

/** 1이 가장 쉽다. */
type ProblemLevel = 1 | 2 | 3

export interface TestCase {
  input: string
  output: string
}

/**
 * 사이트에 실리는 문제. collector가 공개할 때 src/coding/problems.json으로 커밋한다.
 * 이 저장소는 공개라 숨은 테스트는 여기 없다 — collector가 채점할 때만 쓴다.
 */
export interface CodingProblem {
  /** 주소(/coding/<id>)와 브라우저에 저장한 코드의 키로 쓴다. 한 번 퍼진 뒤엔 바꾸지 않는다. */
  id: string
  title: string
  level: ProblemLevel
  tags: string[]
  /** 마크다운. 입출력 예시는 examples로 따로 그린다. */
  statement: string
  inputFormat: string
  outputFormat: string
  /** C·C++·Go 기준. 다른 언어는 채점할 때 언어별로 늘려 준다. */
  timeLimitMs: number
  memoryLimitMb: number
  examples: TestCase[]
  hiddenCaseCount: number
}

export interface CodingProblemsSnapshot {
  updatedAt: string | null
  problems: CodingProblem[]
}

export type CaseVerdict =
  | 'accepted'
  | 'wrong-answer'
  | 'time-limit'
  | 'memory-limit'
  | 'output-limit'
  | 'runtime-error'
  | 'judge-error'

export interface CaseReport {
  verdict: CaseVerdict
  isHidden: boolean
  timeMs: number
  memoryKb: number
  /** 예시 케이스만 채운다 — 숨은 케이스의 입출력은 보여 주지 않는다. */
  stdout?: string
  stderr?: string
}

export type GradeScope = 'examples' | 'all'

export type GradeReport =
  | { kind: 'compile-error'; message: string }
  | { kind: 'graded'; isAccepted: boolean; cases: CaseReport[] }
