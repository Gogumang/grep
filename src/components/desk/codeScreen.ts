import { CanvasTexture, SRGBColorSpace } from 'three'
import deskCodeSource from '@/shared/utils/deskCode.ts?raw'
import deskLayoutSource from '@/shared/utils/deskLayout.ts?raw'
import { type CodeToken, highlightLines, type TokenKind } from './codeHighlight'
import deskSceneSource from './DeskScene.tsx?raw'

/**
 * 모니터·노트북 화면. 이 책상 꾸미기 페이지를 만든 실제 소스를 에디터처럼 그린다 —
 * 가짜 막대로 흉내 내면 개발자 눈에는 바로 티가 난다. 소스는 빌드 때 ?raw로 문자열이 되어 따라온다.
 */
export type ScreenName = 'layout' | 'code' | 'scene' | 'terminal'

interface EditorFile {
  path: string
  source: string
  /** 화면 맨 위 근처에 올 줄. 파일 첫머리의 import보다 로직이 보이는 곳을 연다. */
  focus: string
}

const EDITOR_FILES: Record<Exclude<ScreenName, 'terminal'>, EditorFile> = {
  layout: { path: 'src/shared/utils/deskLayout.ts', source: deskLayoutSource, focus: 'export function moveItem' },
  code: { path: 'src/shared/utils/deskCode.ts', source: deskCodeSource, focus: 'export function decodeDeskCode' },
  scene: { path: 'src/components/desk/DeskScene.tsx', source: deskSceneSource, focus: 'function PlacedItemView' },
}

const FILE_TREE = [
  { depth: 0, name: 'src' },
  { depth: 1, name: 'components' },
  { depth: 2, name: 'desk' },
  { depth: 3, name: 'DeskBuilder.tsx' },
  { depth: 3, name: 'DeskScene.tsx' },
  { depth: 3, name: 'itemModels.tsx' },
  { depth: 1, name: 'desk' },
  { depth: 2, name: 'catalog.ts' },
  { depth: 1, name: 'shared' },
  { depth: 2, name: 'utils' },
  { depth: 3, name: 'deskCode.ts' },
  { depth: 3, name: 'deskLayout.ts' },
  { depth: 1, name: 'pages' },
  { depth: 2, name: 'desk.astro' },
]

/** VS Code Dark+ 색. 개발자에게 가장 익숙한 배색이라 멀리서도 "코드 화면"으로 읽힌다. */
const TOKEN_COLORS: Record<TokenKind, string> = {
  plain: '#d4d4d4',
  comment: '#6a9955',
  string: '#ce9178',
  keyword: '#569cd6',
  number: '#b5cea8',
  type: '#4ec9b0',
  function: '#dcdcaa',
}

const CANVAS_WIDTH = 2048
const MONOSPACE = '"SF Mono", Menlo, Consolas, "D2Coding", monospace'
const FONT_SIZE = 26
const LINE_HEIGHT = 38
const ACTIVITY_BAR_WIDTH = 64
const SIDEBAR_WIDTH = 340
const TAB_BAR_HEIGHT = 58
const STATUS_BAR_HEIGHT = 38
const GUTTER_WIDTH = 86
const LINES_BEFORE_FOCUS = 2
const TAB_SIZE = 2

/** aspect = 화면 세로 ÷ 가로. 모니터 모델의 패널 비율과 맞춰야 글자가 눌리지 않는다. */
export function createScreenTexture(name: ScreenName, aspect: number): CanvasTexture | null {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = Math.round(CANVAS_WIDTH * aspect)
  const context = canvas.getContext('2d')
  if (!context) return null

  if (name === 'terminal') drawTerminal(context, canvas.width, canvas.height)
  else drawEditor(context, canvas.width, canvas.height, EDITOR_FILES[name])

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function drawEditor(context: CanvasRenderingContext2D, width: number, height: number, file: EditorFile) {
  const fileName = file.path.split('/').at(-1) ?? file.path
  context.fillStyle = '#1e1e1e'
  context.fillRect(0, 0, width, height)

  // 왼쪽 막대와 파일 탐색기
  context.fillStyle = '#333333'
  context.fillRect(0, 0, ACTIVITY_BAR_WIDTH, height)
  context.fillStyle = '#252526'
  context.fillRect(ACTIVITY_BAR_WIDTH, 0, SIDEBAR_WIDTH, height)
  context.font = `600 20px ${MONOSPACE}`
  context.fillStyle = '#bbbbbb'
  context.fillText('EXPLORER', ACTIVITY_BAR_WIDTH + 22, 40)
  context.font = `22px ${MONOSPACE}`
  FILE_TREE.forEach((entry, index) => {
    const y = 84 + index * 36
    if (entry.name === fileName) {
      context.fillStyle = '#37373d'
      context.fillRect(ACTIVITY_BAR_WIDTH, y - 26, SIDEBAR_WIDTH, 36)
    }
    const isFolder = !entry.name.includes('.')
    context.fillStyle = isFolder ? '#c5c5c5' : '#9cdcfe'
    context.fillText(`${isFolder ? '▾ ' : '  '}${entry.name}`, ACTIVITY_BAR_WIDTH + 18 + entry.depth * 22, y)
  })

  // 탭
  const editorLeft = ACTIVITY_BAR_WIDTH + SIDEBAR_WIDTH
  context.fillStyle = '#252526'
  context.fillRect(editorLeft, 0, width - editorLeft, TAB_BAR_HEIGHT)
  context.fillStyle = '#1e1e1e'
  const tabWidth = 36 + fileName.length * 14
  context.fillRect(editorLeft, 0, tabWidth, TAB_BAR_HEIGHT)
  context.fillStyle = '#ffffff'
  context.font = `22px ${MONOSPACE}`
  context.fillText(fileName, editorLeft + 20, 37)

  // 코드
  const lines = highlightLines(file.source)
  const focusIndex = Math.max(
    0,
    lines.findIndex((line) => joinTokens(line).includes(file.focus)),
  )
  const firstLine = Math.max(0, focusIndex - LINES_BEFORE_FOCUS)
  const visibleLineCount = Math.floor((height - TAB_BAR_HEIGHT - STATUS_BAR_HEIGHT - 16) / LINE_HEIGHT)
  const codeLeft = editorLeft + GUTTER_WIDTH
  const baselineOf = (row: number) => TAB_BAR_HEIGHT + 12 + (row + 1) * LINE_HEIGHT - 10
  context.font = `${FONT_SIZE}px ${MONOSPACE}`
  const characterWidth = context.measureText('M').width

  lines.slice(firstLine, firstLine + visibleLineCount).forEach((line, row) => {
    const lineNumber = firstLine + row + 1
    const isFocusLine = lineNumber === focusIndex + 1
    const baseline = baselineOf(row)
    if (isFocusLine) {
      context.fillStyle = '#2a2d2e'
      context.fillRect(editorLeft, baseline - LINE_HEIGHT + 10, width - editorLeft, LINE_HEIGHT)
    }
    context.fillStyle = isFocusLine ? '#c6c6c6' : '#6e7681'
    context.textAlign = 'right'
    context.fillText(String(lineNumber), codeLeft - 28, baseline)
    context.textAlign = 'left'
    let x = codeLeft
    for (const token of line) {
      const text = token.text.replaceAll('\t', ' '.repeat(TAB_SIZE))
      context.fillStyle = TOKEN_COLORS[token.kind]
      context.fillText(text, x, baseline)
      x += context.measureText(text).width
    }
  })

  // 커서 — 포커스한 선언 이름 끝
  context.fillStyle = '#aeafad'
  const cursorX = codeLeft + characterWidth * file.focus.length
  context.fillRect(cursorX, baselineOf(focusIndex - firstLine) - FONT_SIZE, 3, FONT_SIZE + 6)

  drawStatusBar(context, width, height, 'TypeScript')
}

function drawStatusBar(context: CanvasRenderingContext2D, width: number, height: number, language: string) {
  context.fillStyle = '#007acc'
  context.fillRect(0, height - STATUS_BAR_HEIGHT, width, STATUS_BAR_HEIGHT)
  context.fillStyle = '#ffffff'
  context.font = `20px ${MONOSPACE}`
  context.fillText('⎇ feat/desk-builder', 20, height - 12)
  context.textAlign = 'right'
  context.fillText(`UTF-8   LF   ${language}`, width - 24, height - 12)
  context.textAlign = 'left'
}

/** 이 페이지를 만들며 실제로 돌린 명령과 그 출력. */
const TERMINAL_LINES: { text: string; color: string }[] = [
  { text: '~/code/grep on ⎇ feat/desk-builder', color: '#4ec9b0' },
  { text: '❯ bun test', color: '#e5e5e5' },
  { text: 'bun test v1.3.14', color: '#9da5b4' },
  { text: '', color: '#e5e5e5' },
  { text: 'src/shared/utils/deskLayout.test.ts:', color: '#e5e5e5' },
  { text: '✓ moveItem > 상판 밖으로 끌면 가장자리에 붙어 멈춘다', color: '#89d185' },
  { text: '✓ moveItem > 대각선 목적지가 막히면 막히지 않은 축으로만 미끄러진다', color: '#89d185' },
  { text: '✓ rotateItem > 돌린 폭이 상판보다 길면 돌리지 않는다', color: '#89d185' },
  { text: '✓ swapItem > 커져서 겹치면 가장 가까운 빈자리로 옮긴다', color: '#89d185' },
  { text: 'src/shared/utils/deskCode.test.ts:', color: '#e5e5e5' },
  { text: '✓ 인코딩한 배치를 다시 풀면 물건·좌표·회전이 그대로다', color: '#89d185' },
  { text: '✓ 형식이 틀리면(모르는 상판) 빈 책상 대신 DeskCodeError를 던진다', color: '#89d185' },
  { text: '', color: '#e5e5e5' },
  { text: ' 69 pass', color: '#89d185' },
  { text: ' 0 fail', color: '#e5e5e5' },
  { text: 'Ran 69 tests across 11 files.', color: '#9da5b4' },
  { text: '', color: '#e5e5e5' },
  { text: '❯ bun run build', color: '#e5e5e5' },
  { text: '[build] 1428 page(s) built', color: '#9da5b4' },
  { text: '[build] Complete!', color: '#89d185' },
  { text: '❯ ▌', color: '#e5e5e5' },
]

function drawTerminal(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = '#16181d'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#23262e'
  context.fillRect(0, 0, width, TAB_BAR_HEIGHT)
  for (const [index, color] of ['#ff5f57', '#febc2e', '#28c840'].entries()) {
    context.fillStyle = color
    context.beginPath()
    context.arc(34 + index * 34, TAB_BAR_HEIGHT / 2, 10, 0, Math.PI * 2)
    context.fill()
  }
  context.fillStyle = '#9da5b4'
  context.font = `22px ${MONOSPACE}`
  context.textAlign = 'center'
  context.fillText('zsh — grep', width / 2, 37)
  context.textAlign = 'left'

  const lineHeight = (height - TAB_BAR_HEIGHT - 30) / TERMINAL_LINES.length
  context.font = `${Math.min(FONT_SIZE + 6, lineHeight * 0.72)}px ${MONOSPACE}`
  TERMINAL_LINES.forEach((line, index) => {
    context.fillStyle = line.color
    context.fillText(line.text, 30, TAB_BAR_HEIGHT + 16 + (index + 1) * lineHeight - 8)
  })
}

function joinTokens(line: CodeToken[]): string {
  return line.map((token) => token.text).join('')
}
