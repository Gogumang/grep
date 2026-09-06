import { useState } from 'react'
import * as styles from './Sidebar.css'

/** 접어둔 상태에서 보여줄 항목 수. 26개를 다 펼치면 사이드바가 화면을 넘긴다. */
const COLLAPSED_COUNT = 8

interface FacetRow {
  /** 고를 때 위로 넘길 값. null이면 '전체'다. */
  value: string
  label: string
  count: number
}

interface FacetPanelProps {
  title: string
  rows: FacetRow[]
  selected: string | null
  onSelect: (value: string | null) => void
  /** 항목이 많은 목록만 접는다. 분류처럼 서너 개뿐이면 접을 이유가 없다. */
  collapsible?: boolean
}

export function FacetPanel({ title, rows, selected, onSelect, collapsible = false }: FacetPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shown = collapsible && !isExpanded ? rows.slice(0, COLLAPSED_COUNT) : rows
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>

      <button
        type="button"
        className={`${styles.blogRow} ${selected === null ? styles.blogRowSelected : ''}`}
        onClick={() => onSelect(null)}
      >
        <span>전체</span>
        <span className={styles.count}>{total}</span>
      </button>

      {shown.map((row) => (
        <button
          key={row.value}
          type="button"
          className={`${styles.blogRow} ${selected === row.value ? styles.blogRowSelected : ''}`}
          onClick={() => onSelect(selected === row.value ? null : row.value)}
        >
          <span>{row.label}</span>
          <span className={styles.count}>{row.count}</span>
        </button>
      ))}

      {collapsible && rows.length > COLLAPSED_COUNT && (
        <button type="button" className={styles.moreButton} onClick={() => setIsExpanded((open) => !open)}>
          {isExpanded ? '접기' : `${rows.length - COLLAPSED_COUNT}개 더 보기`}
        </button>
      )}
    </section>
  )
}
