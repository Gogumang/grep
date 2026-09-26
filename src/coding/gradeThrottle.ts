/**
 * 풀이 화면에서 채점을 너무 자주 누르지 못하게 하는 규칙. 채점 서버(collector)는 따로 막지 않는다 —
 * 버튼을 누르는 보통 사용자를 위한 장치라, /api/judge 를 직접 부르는 요청까지 막지는 못한다.
 */

/** 채점 한 번이 끝난 뒤 다시 누를 수 있기까지. 결과를 읽기 전에 연달아 누르는 것을 막는다. */
export const COOLDOWN_MS = 5_000
/** 최근 1분 안에 채점할 수 있는 횟수. Kotlin·Go 컴파일은 한 번에 몇 초씩 서버 CPU를 쓴다. */
export const MAX_GRADES_PER_WINDOW = 10
export const WINDOW_MS = 60_000

/** 이 시각까지 채점할 수 없다(에포크 밀리초). 지금 채점할 수 있으면 now 이하를 돌려준다. */
export function nextAllowedAt(history: number[], now: number): number {
  const recent = history.filter((time) => time > now - WINDOW_MS).sort((left, right) => left - right)
  const latest = recent.at(-1)
  const afterCooldown = latest === undefined ? now : latest + COOLDOWN_MS
  const oldest = recent[0]
  // 1분 창이 꽉 찼으면 가장 오래된 채점이 창을 벗어날 때까지 기다린다.
  const afterWindow = recent.length >= MAX_GRADES_PER_WINDOW && oldest !== undefined ? oldest + WINDOW_MS : now
  return Math.max(afterCooldown, afterWindow)
}

/** 채점을 하나 더 기록한다. 1분이 지난 기록은 버려 저장소가 자라지 않게 한다. */
export function recordGrade(history: number[], now: number): number[] {
  return [...history.filter((time) => time > now - WINDOW_MS), now]
}

/** 저장소에서 읽은 값을 믿지 않는다 — 다른 탭·옛 형식·손으로 고친 값이어도 숫자 배열만 남긴다. */
export function parseHistory(raw: string | null): number[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((time): time is number => Number.isFinite(time)) : []
  } catch {
    return []
  }
}
