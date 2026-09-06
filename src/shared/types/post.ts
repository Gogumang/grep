/** src/posts/*.md 파일 하나에 대응하는 글. */
export interface Post {
  /** 원문 주소의 해시. 파일 이름이자 React key다. */
  id: string
  title: string
  url: string
  blogName: string
  blogKey: string
  blogHomepage: string
  /** ISO-8601 */
  publishedAt: string
  summary: string
  sourceThumbnail: string | null
  tags: string[]
  /** 원문 블로그가 매긴 분류. RSS에 없어 원문 페이지에서 긁어와야 채워진다. */
  category: string | null
  /** 글쓴이. category와 같은 사정이라 없을 수 있다. */
  author: string | null
  /** true면 목록에 내보내지 않는다. 켜는 화면은 없고 frontmatter를 직접 고친다. */
  hidden: boolean
}
