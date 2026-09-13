const SEPARATOR_CELL = /^:?-{3,}:?$/

/**
 * 운영자가 손으로 관리하는 md 표를 행마다 칸 배열로 읽는다.
 * 표마다 첫 행은 머리행이라 빼고, `| --- |` 구분행도 뺀다.
 * 설명 문단에 표를 하나 더 두면 그 행도 읽히니, 설정 파일에는 표를 하나만 둔다.
 */
export function parseMarkdownTableRows(markdown: string): string[][] {
  const rows: string[][] = []
  let isInsideTable = false

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) {
      isInsideTable = false
      continue
    }

    const cells = trimmed
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())
    if (cells.every((cell) => SEPARATOR_CELL.test(cell))) continue

    if (!isInsideTable) {
      isInsideTable = true
      continue
    }
    rows.push(cells)
  }
  return rows
}
