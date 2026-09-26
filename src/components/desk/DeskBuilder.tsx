import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_LAYOUT, DESK_CATALOG } from '@/desk/catalog'
import type { DeskCategory, DeskLayout } from '@/shared/types'
import { DeskCodeError, decodeDeskCode, encodeDeskCode } from '@/shared/utils/deskCode'
import {
  addItem,
  GRID_CM,
  moveItem,
  planAddition,
  removeItem,
  rotateItem,
  settleLayout,
  swapItem,
} from '@/shared/utils/deskLayout'
import * as styles from './DeskBuilder.css'
import { DeskPanel } from './DeskPanel'
import { DeskScene } from './DeskScene'

const STORAGE_KEY = 'grep-desk'
/** 드래그 중에는 배치가 초당 수십 번 바뀐다. 멈춘 뒤 한 번만 저장한다. */
const PERSIST_DELAY_MS = 400
const MESSAGE_DURATION_MS = 5000
const FAST_NUDGE_MULTIPLIER = 4

interface Point {
  x: number
  z: number
}

type SharedDesk = { kind: 'shared'; layout: DeskLayout; message: string | null } | { kind: 'broken'; message: string }

/**
 * 주소창의 공유 링크(#코드). 편집 중인 책상은 React 상태가 들고 이 브라우저(localStorage)에 저장하고,
 * 주소창은 공유 링크로 들어왔을 때만 읽는다. 망가진 링크는 조용히 넘기지 않고 알린다.
 */
function readSharedDesk(hash: string): SharedDesk | null {
  const code = hash.replace(/^#/, '')
  if (!code) return null
  try {
    return { kind: 'shared', ...restore(decodeURIComponent(code)) }
  } catch (error) {
    // URIError — 메신저가 링크 끝을 잘라 %가 반쪽만 남은 경우.
    if (!(error instanceof DeskCodeError || error instanceof URIError)) throw error
    const reason = error instanceof DeskCodeError ? ` (${error.message})` : ''
    return { kind: 'broken', message: `공유 링크를 읽지 못했어요.${reason}` }
  }
}

/** 공유 링크로 들어왔으면 그 책상을 둘러보는 상태로, 아니면 내 책상으로 시작한다. */
function loadInitialState(): { layout: DeskLayout; message: string | null; isViewingShared: boolean } {
  const shared = readSharedDesk(window.location.hash)
  if (shared?.kind === 'shared') return { layout: shared.layout, message: shared.message, isViewingShared: true }
  const mine = loadMyDesk()
  return { layout: mine.layout, message: shared?.message ?? mine.message, isViewingShared: false }
}

function clearHash() {
  if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

/** 이 브라우저에 저장된 내 책상. 없거나 읽을 수 없으면 기본 책상이다. */
function loadMyDesk(): { layout: DeskLayout; message: string | null } {
  const storedCode = readStoredCode()
  if (storedCode) {
    try {
      return restore(storedCode)
    } catch (error) {
      // 저장본은 이 브라우저가 직접 쓴 값이라 망가졌어도 사용자에게 알릴 게 없다. 새로 시작한다.
      if (!(error instanceof DeskCodeError)) throw error
    }
  }
  return { layout: DEFAULT_LAYOUT, message: null }
}

function restore(code: string): { layout: DeskLayout; message: string | null } {
  const decoded = decodeDeskCode(code, DESK_CATALOG)
  const { layout, removedCount } = settleLayout(decoded.surfaceId, decoded.items, DESK_CATALOG)
  const notes = [
    decoded.unknownItemIds.length > 0 && `더 이상 없는 물건 ${decoded.unknownItemIds.length}개를 뺐어요.`,
    removedCount > 0 && `자리가 모자라거나 개수를 넘은 물건 ${removedCount}개를 뺐어요.`,
  ].filter(Boolean)
  return { layout, message: notes.length > 0 ? notes.join(' ') : null }
}

function readStoredCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function shareUrlOf(layout: DeskLayout): string {
  return `${window.location.origin}${window.location.pathname}#${encodeDeskCode(layout)}`
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export function DeskBuilder() {
  const [initial] = useState(loadInitialState)
  const [layout, setLayout] = useState(initial.layout)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [category, setCategory] = useState<DeskCategory>('monitor')
  const [message, setMessage] = useState(initial.message)
  const [isViewingShared, setIsViewingShared] = useState(initial.isViewingShared)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const selected = layout.items.find((item) => item.key === selectedKey) ?? null

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), MESSAGE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [message])

  /*
   * 공유 링크는 한 번 읽고 주소창에서 지운다. 새로고침하면 내 책상으로 돌아오고, 주소가 배치로 길어지지 않는다.
   * 책상 페이지를 열어 둔 탭에 링크를 붙여 넣으면 페이지가 다시 뜨지 않고 해시만 바뀐다 — 그것도 받는다.
   * 이때 링크가 망가졌으면 편집 중인 책상은 그대로 두고 알리기만 한다.
   */
  useEffect(() => {
    clearHash()
    const handleHashChange = () => {
      const shared = readSharedDesk(window.location.hash)
      clearHash()
      if (!shared) return
      setMessage(shared.message)
      if (shared.kind === 'broken') return
      setLayout(shared.layout)
      setSelectedKey(null)
      setIsViewingShared(true)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // 내 책상만 저장한다. 공유받은 책상을 둘러보는 동안에는 저장본을 그대로 둔다.
  useEffect(() => {
    if (isViewingShared) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, encodeDeskCode(layout))
      } catch {
        // 저장 공간이 막힌 브라우저(사생활 보호 모드 등). 이번 방문 동안은 상태로 남아 있다.
      }
    }, PERSIST_DELAY_MS)
    return () => clearTimeout(timer)
  }, [layout, isViewingShared])

  const handleBackToMine = () => {
    setLayout(loadMyDesk().layout)
    setSelectedKey(null)
    setIsViewingShared(false)
  }

  const handleMove = useCallback((key: string, target: Point) => {
    setLayout((current) => moveItem(current, key, target, DESK_CATALOG))
  }, [])

  const handleAdd = (itemId: string) => {
    const plan = planAddition(layout, itemId, DESK_CATALOG)
    if (plan.kind === 'full') {
      setMessage(`이 종류는 ${plan.limit}개까지 올릴 수 있어요. 하나를 빼거나 바꿔 보세요.`)
      return
    }
    if (plan.kind === 'replace') {
      const swapped = swapItem(layout, plan.key, itemId, DESK_CATALOG)
      if (!swapped) {
        setMessage('바꿀 물건이 들어갈 자리가 없어요.')
        return
      }
      setLayout(swapped)
      setSelectedKey(plan.key)
      return
    }
    const key = `${itemId}-${crypto.randomUUID().slice(0, 8)}`
    const next = addItem(layout, itemId, key, DESK_CATALOG)
    if (!next) {
      setMessage('책상에 빈자리가 없어요. 물건을 빼거나 더 큰 책상으로 바꿔 보세요.')
      return
    }
    setLayout(next)
    setSelectedKey(key)
  }

  const handleSwap = (itemId: string) => {
    if (!selectedKey) return
    const next = swapItem(layout, selectedKey, itemId, DESK_CATALOG)
    if (!next) {
      setMessage('바꿀 물건이 들어갈 자리가 없어요.')
      return
    }
    setLayout(next)
  }

  const handleRotate = useCallback(() => {
    if (!selectedKey) return
    const next = rotateItem(layout, selectedKey, DESK_CATALOG)
    if (!next) {
      setMessage('돌리면 책상에 들어갈 자리가 없어요.')
      return
    }
    setLayout(next)
  }, [layout, selectedKey])

  const handleRemove = useCallback(() => {
    if (!selectedKey) return
    setLayout((current) => removeItem(current, selectedKey))
    setSelectedKey(null)
  }, [selectedKey])

  const handleSurfaceChange = (surfaceId: string) => {
    const { layout: next, removedCount } = settleLayout(surfaceId, layout.items, DESK_CATALOG)
    setLayout(next)
    if (removedCount > 0) setMessage(`책상이 작아져서 물건 ${removedCount}개를 뺐어요.`)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrlOf(layout))
      setMessage('링크를 복사했어요. 붙여 넣으면 이 책상이 그대로 열려요.')
    } catch {
      setMessage('클립보드를 쓸 수 없어요. 주소창의 주소를 그대로 복사해 주세요.')
    }
  }

  const handleSaveImage = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) {
        setMessage('이미지를 만들지 못했어요.')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'grep-desk.png'
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedKey || isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      const step = GRID_CM * (event.shiftKey ? FAST_NUDGE_MULTIPLIER : 1)
      const nudges: Record<string, Point> = {
        ArrowLeft: { x: -step, z: 0 },
        ArrowRight: { x: step, z: 0 },
        ArrowUp: { x: 0, z: -step },
        ArrowDown: { x: 0, z: step },
      }
      const nudge = nudges[event.key]
      if (nudge) {
        event.preventDefault()
        setLayout((current) => {
          const placed = current.items.find((item) => item.key === selectedKey)
          if (!placed) return current
          return moveItem(current, selectedKey, { x: placed.x + nudge.x, z: placed.z + nudge.z }, DESK_CATALOG)
        })
      } else if (event.key === 'r' || event.key === 'R') {
        handleRotate()
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        handleRemove()
      } else if (event.key === 'Escape') {
        setSelectedKey(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedKey, handleRotate, handleRemove])

  return (
    <div className={styles.builder}>
      <div className={styles.stage}>
        <DeskScene
          layout={layout}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onMove={handleMove}
          onCanvasReady={(canvas) => {
            canvasRef.current = canvas
          }}
        />
        <p className={styles.hint}>끌어서 옮기기 · 빈 곳 끌어 시점 돌리기 · 방향키 5cm · R 회전 · Delete 빼기</p>
        <div className={styles.notices}>
          {isViewingShared && (
            <div className={styles.notice} role="status">
              <span>공유받은 책상이에요. 고쳐도 내 책상에는 저장되지 않아요.</span>
              <button type="button" className={styles.noticeAction} onClick={() => setIsViewingShared(false)}>
                이 책상으로 시작
              </button>
              <button type="button" className={styles.noticeAction} onClick={handleBackToMine}>
                내 책상으로
              </button>
            </div>
          )}
          {message && (
            <div className={styles.notice} role="status">
              <span>{message}</span>
              <button
                type="button"
                className={styles.messageClose}
                aria-label="알림 닫기"
                onClick={() => setMessage(null)}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
      <DeskPanel
        layout={layout}
        selected={selected}
        category={category}
        onCategoryChange={setCategory}
        onAdd={handleAdd}
        onSwap={handleSwap}
        onRotate={handleRotate}
        onRemove={handleRemove}
        onSurfaceChange={handleSurfaceChange}
        onCopyLink={handleCopyLink}
        onSaveImage={handleSaveImage}
      />
    </div>
  )
}
