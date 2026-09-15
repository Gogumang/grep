import { describe, expect, test } from 'bun:test'
import { classifyCategory, parsePostFile } from './postFile'

function postFile(extraLine: string): string {
  return [
    '---',
    'title: "제목"',
    'url: "https://example.com/a"',
    'publishedAt: "2026-09-01T00:00:00Z"',
    extraLine,
    '---',
    '요약',
    '',
  ].join('\n')
}

describe('classifyCategory', () => {
  test('원문 분류 이름을 사이트 분류 셋으로 맞춘다', () => {
    // Arrange
    const sourceCategories = ['Engineering', 'Design', '프로덕트', ' product ']

    // Act
    const categories = sourceCategories.map(classifyCategory)

    // Assert
    expect(categories).toEqual(['Engineering', 'Design', 'Product', 'Product'])
  })

  test('분류가 없거나 모르는 이름이면 Engineering이다', () => {
    // Arrange
    const sourceCategories = ['', '회고']

    // Act
    const categories = sourceCategories.map(classifyCategory)

    // Assert
    expect(categories).toEqual(['Engineering', 'Engineering'])
  })
})

describe('parsePostFile', () => {
  test('frontmatter의 분류를 맞춘 값으로 싣는다', () => {
    // Arrange
    const contents = postFile('category: "프로덕트"')

    // Act
    const post = parsePostFile(contents)

    // Assert
    expect(post?.category).toBe('Product')
  })

  test('category 줄이 없는 글도 분류가 붙는다', () => {
    // Arrange
    const contents = postFile('author: "누군가"')

    // Act
    const post = parsePostFile(contents)

    // Assert
    expect(post?.category).toBe('Engineering')
  })
})
