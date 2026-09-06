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
  /** 원문이 밝힌 대표 이미지. 없는 글이 넷에 하나쯤 된다. */
  sourceThumbnail: string | null
  /**
   * 목록 카드용 400×220. 아래 wideImage와 함께 '화면에 실제로 거는 이미지'다 —
   * 원문 이미지가 없으면 collector가 그린 카드로 채운다. collector는 원문 이미지가
   * 없는 글에만 카드를 그리므로 두 경로가 겹치지 않는다.
   */
  cardImage: string
  /** 히어로·공유 미리보기용 1200×630. 400×220을 늘려 쓰면 글자가 뭉개져 따로 둔다. */
  wideImage: string
  tags: string[]
  /** 원문 블로그가 매긴 분류. RSS에 없어 원문 페이지에서 긁어와야 채워진다. */
  category: string | null
  /** 글쓴이. category와 같은 사정이라 없을 수 있다. */
  author: string | null
  /** true면 목록에 내보내지 않는다. 켜는 화면은 없고 frontmatter를 직접 고친다. */
  hidden: boolean
}
