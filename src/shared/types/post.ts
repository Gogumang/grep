/**
 * 사이트가 쓰는 분류 셋이자 사이드바 순서. 글마다 하나다 — 원문 블로그가 매긴 분류(토스만 준다)가 아니라
 * 글의 주제로 직접 매긴다(2026-09-27, 글 1,082개). Engineering 은 어디에도 딱 맞지 않는 일반 개발 글이다
 * (언어·패러다임·아키텍처·개발 도구·게임). 모바일은 Android·iOS 로 나누고, React Native·Flutter·KMP 와 두 플랫폼 공통 앱 글은
 * Cross-platform 이다.
 */
export const POST_CATEGORIES = [
  'Frontend',
  'Backend',
  'Android',
  'iOS',
  'Cross-platform',
  'DevOps',
  'Data',
  'AI/ML',
  'Security',
  'QA',
  'Engineering',
  'Design',
  'Product',
  'Culture',
] as const

export type PostCategory = (typeof POST_CATEGORIES)[number]

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
  /** POST_CATEGORIES 중 하나. 분류를 아직 매기지 않은 글(새로 들어온 글 등)은 Engineering이다. */
  category: PostCategory
  /** 글쓴이. RSS에 없어 원문 페이지에서 긁어와야 채워지므로 없을 수 있다. */
  author: string | null
  /** true면 목록에 내보내지 않는다. 켜는 화면은 없고 frontmatter를 직접 고친다. */
  hidden: boolean
}
