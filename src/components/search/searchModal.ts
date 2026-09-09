import { type SearchHit, searchPosts } from './pagefind'
import * as styles from './SearchModal.css'

/** 타자를 칠 때마다 색인을 훑지 않도록 잠깐 기다린다. */
const TYPING_PAUSE_MILLISECONDS = 200
const MAX_RESULTS = 8

/**
 * 검색 모달. React 없이 DOM을 직접 만든다.
 *
 * 헤더에 React를 쓰던 시절에는 글 상세 페이지에서 테마 토글과 검색 버튼 때문에
 * React 런타임 194KB가 통째로 내려갔다. 읽기만 하는 페이지에 그건 과했다.
 */
export function createSearchModal() {
  let overlay: HTMLDivElement | null = null
  let hits: SearchHit[] = []
  let selected = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let requestId = 0

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string) => {
    const node = document.createElement(tag)
    if (className) node.className = className
    return node
  }

  function renderResults(container: HTMLElement, message?: string) {
    container.replaceChildren()
    if (message) {
      const status = el('p', styles.status)
      status.textContent = message
      container.append(status)
      return
    }

    hits.forEach((hit, index) => {
      const link = el('a', `${styles.item} ${index === selected ? styles.itemSelected : ''}`)
      link.href = hit.url
      link.addEventListener('mouseenter', () => {
        selected = index
        renderResults(container)
      })

      const title = el('h3', styles.itemTitle)
      title.textContent = hit.title
      link.append(title)

      const meta = [hit.blogName, hit.publishedAt.slice(0, 10)].filter(Boolean).join(' · ')
      if (meta) {
        const metaNode = el('p', styles.itemMeta)
        metaNode.textContent = meta
        link.append(metaNode)
      }

      // 발췌의 <mark>는 Pagefind가 이스케이프한 본문에 붙인 강조뿐이다.
      const excerpt = el('p', styles.excerpt)
      excerpt.innerHTML = hit.excerpt
      link.append(excerpt)

      container.append(link)
    })
  }

  function close() {
    overlay?.remove()
    overlay = null
    document.body.style.overflow = ''
    clearTimeout(timer)
  }

  function open() {
    if (overlay) return close()

    overlay = el('div', styles.overlay)
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', '글 검색')
    overlay.addEventListener('mousedown', (event) => {
      if (event.target === overlay) close()
    })

    const panel = el('div', styles.panel)
    const inputRow = el('div', styles.inputRow)
    const input = el('input', styles.input)
    input.type = 'search'
    input.placeholder = '제목과 본문에서 찾기'
    input.setAttribute('aria-label', '검색어')

    /*
      닫기. 좁은 화면에서는 패널이 화면을 다 덮어 바깥을 누를 배경이 없고,
      폰에는 ESC 키도 없다 — 누를 수 있는 자리를 반드시 남긴다.
      넓은 화면에서는 그대로 'ESC'라고 알려준다(CSS가 둘 중 하나만 보여준다).
    */
    const closeButton = el('button', styles.closeButton)
    closeButton.type = 'button'
    closeButton.setAttribute('aria-label', '검색 닫기')
    const closeKeyLabel = el('span', styles.closeKeyLabel)
    closeKeyLabel.textContent = 'ESC'
    const closeIcon = el('span', styles.closeIcon)
    closeIcon.textContent = '✕'
    closeIcon.setAttribute('aria-hidden', 'true')
    closeButton.append(closeKeyLabel, closeIcon)
    closeButton.addEventListener('click', close)

    const results = el('div', styles.results)
    renderResults(results, '두 글자 이상 입력하면 찾기 시작합니다.')

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') return close()
      if (hits.length === 0) return

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        selected = (selected + step + hits.length) % hits.length
        renderResults(results)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const hit = hits[selected]
        if (hit) window.location.href = hit.url
      }
    })

    input.addEventListener('input', () => {
      const query = input.value.trim()
      clearTimeout(timer)
      if (query.length < 2) {
        hits = []
        return renderResults(results, '두 글자 이상 입력하면 찾기 시작합니다.')
      }

      renderResults(results, '찾는 중…')
      const current = ++requestId
      timer = setTimeout(async () => {
        try {
          const found = await searchPosts(query, MAX_RESULTS)
          // 타자를 계속 치면 앞선 요청 결과는 버린다.
          if (current !== requestId || !overlay) return

          if (found === null) {
            return renderResults(results, '검색 색인이 없습니다. `bun run build`를 한 번 돌리면 만들어집니다.')
          }
          hits = found
          selected = 0
          renderResults(results, found.length === 0 ? `“${query}”에 맞는 글이 없습니다.` : undefined)
        } catch {
          /*
            색인 조각을 내려받다 끊기는 경우가 있다. 여기서 받지 않으면 거절된 약속이
            그대로 떠돌고 화면은 '찾는 중…'에 멎는다 — 무엇이 잘못됐는지도 알 수 없다.
          */
          if (current !== requestId || !overlay) return
          hits = []
          renderResults(results, '검색을 마치지 못했습니다. 잠시 뒤 다시 시도해 주세요.')
        }
      }, TYPING_PAUSE_MILLISECONDS)
    })

    inputRow.append(input, closeButton)
    panel.append(inputRow, results)
    overlay.append(panel)
    document.body.append(overlay)
    document.body.style.overflow = 'hidden'
    input.focus()
  }

  return { open, close }
}
