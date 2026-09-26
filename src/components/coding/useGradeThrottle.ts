import { useCallback, useEffect, useState } from 'react'
import { nextAllowedAt, parseHistory, recordGrade } from '@/coding/gradeThrottle'

/** 문제·탭을 옮겨 다녀도 같은 기록을 본다 — 다른 문제 탭을 열어 두고 번갈아 누르는 것도 한 사람의 채점이다. */
const STORAGE_KEY = 'grep-coding-grade-times'
const TICK_MS = 1_000
const MILLISECONDS_PER_SECOND = 1_000

/** 채점 버튼을 막을지와 남은 초. 채점이 끝날 때마다 record()로 기록한다. */
export function useGradeThrottle() {
  const [history, setHistory] = useState<number[]>(() => parseHistory(readStorage()))
  const [now, setNow] = useState(() => Date.now())
  const waitMs = Math.max(0, nextAllowedAt(history, now) - now)
  const isBlocked = waitMs > 0

  // 막혀 있는 동안만 1초마다 다시 그린다 — 남은 초를 버튼에 보여 주고, 풀리면 버튼을 연다.
  useEffect(() => {
    if (!isBlocked) return
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [isBlocked])

  // 다른 탭에서 채점한 기록도 반영한다.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      setHistory(parseHistory(event.newValue))
      setNow(Date.now())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const record = useCallback(() => {
    const recordedAt = Date.now()
    setHistory((previous) => {
      // 다른 탭이 방금 쓴 기록과 합친다 — 이 탭의 state만 믿으면 탭마다 따로 센다.
      const merged = [...new Set([...previous, ...parseHistory(readStorage())])]
      const next = recordGrade(merged, recordedAt)
      writeStorage(JSON.stringify(next))
      return next
    })
    setNow(recordedAt)
  }, [])

  return { isBlocked, waitSeconds: Math.ceil(waitMs / MILLISECONDS_PER_SECOND), record }
}

// 기록은 편의 장치다. 저장소가 막혀도 이 탭 안에서는 state로 센다.
function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStorage(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // 위 주석 참고.
  }
}
