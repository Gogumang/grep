import * as styles from './PostExplorer.css'
import { visiblePageNumbers } from './paging'

interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const pages = visiblePageNumbers(page, pageCount)

  return (
    <nav className={styles.pagination} aria-label="페이지">
      <button type="button" className={styles.pageButton} onClick={() => onChange(page - 1)} disabled={page === 1}>
        ‹
      </button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={`${styles.pageButton} ${pageNumber === page ? styles.pageButtonCurrent : ''}`}
          aria-current={pageNumber === page ? 'page' : undefined}
          onClick={() => onChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        className={styles.pageButton}
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
      >
        ›
      </button>
    </nav>
  )
}
