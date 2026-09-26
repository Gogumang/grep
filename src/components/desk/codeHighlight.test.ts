import { describe, expect, test } from 'bun:test'
import { highlightLines } from './codeHighlight'

const kindsOf = (source: string) =>
  highlightLines(source).map((line) => line.map(({ text, kind }) => `${kind}:${text}`))

describe('highlightLines', () => {
  test('키워드·함수 호출·문자열·숫자·타입을 나눈다', () => {
    // Act
    const [line] = kindsOf("const layout: DeskLayout = moveItem(current, 'mouse', 5)")

    // Assert
    expect(line).toEqual([
      'keyword:const',
      'plain: layout: ',
      'type:DeskLayout',
      'plain: = ',
      'function:moveItem',
      'plain:(current, ',
      "string:'mouse'",
      'plain:, ',
      'number:5',
      'plain:)',
    ])
  })

  test('줄 끝 주석은 나머지 전체가 주석이다', () => {
    const [line] = kindsOf("return layout // 막히면 'x' 그대로")
    expect(line).toEqual(['keyword:return', 'plain: layout ', "comment:// 막히면 'x' 그대로"])
  })

  test('블록 주석은 여러 줄에 걸쳐 이어지고 닫힌 뒤에는 다시 코드다', () => {
    const lines = kindsOf('/**\n * 설명\n */ export const GRID_CM = 5')
    expect(lines[0]).toEqual(['comment:/**'])
    expect(lines[1]).toEqual(['comment: * 설명'])
    expect(lines[2]).toEqual([
      'comment: */',
      'plain: ',
      'keyword:export',
      'plain: ',
      'keyword:const',
      'plain: ',
      'type:GRID_CM',
      'plain: = ',
      'number:5',
    ])
  })

  test('이스케이프된 따옴표에서 문자열이 끝나지 않는다', () => {
    const [line] = kindsOf("const text = 'it\\'s'")
    expect(line?.at(-1)).toBe("string:'it\\'s'")
  })
})
