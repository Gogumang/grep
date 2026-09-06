/** 페이지 번호를 한 번에 보여주는 개수. 56페이지를 전부 늘어놓을 수는 없다. */
const PAGE_WINDOW = 5

/** 한 페이지에 놓는 글 수. 무한 스크롤이 아니라 숫자 페이지로 끊는다. */
export const PAGE_SIZE = 12

/**
 * 창에 띄울 페이지 번호들.
 * 현재 페이지를 가운데 두되, 앞뒤 끝에서는 창이 밖으로 나가지 않게 밀어 넣는다.
 */
export function visiblePageNumbers(page: number, pageCount: number): number[] {
  const half = Math.floor(PAGE_WINDOW / 2)
  const start = Math.max(1, Math.min(page - half, pageCount - PAGE_WINDOW + 1))
  return Array.from({ length: Math.min(PAGE_WINDOW, pageCount) }, (_, index) => start + index)
}
