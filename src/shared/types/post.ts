import categoryFile from '../../posts/config/categories.json'

/**
 * 사이트가 쓰는 분류 셋이자 사이드바 순서. 글마다 하나다 — 원문 블로그가 매긴 분류(토스만 준다)가 아니라
 * 글의 주제로 직접 매긴다(2026-09-27, 글 1,082개).
 *
 * 목록은 코드가 아니라 src/posts/config/categories.json 에 있다. 어드민 '블로그 → 분류' 화면에서 고치면 collector 가
 * 이 파일(과 이름이 바뀐 글 파일)을 커밋한다 — 여기를 손으로 고치지 않는다. 분류를 아직 매기지 않은 글은 Engineering 이다.
 */
export const POST_CATEGORIES: readonly string[] = categoryFile.categories

/** POST_CATEGORIES 중 하나. 목록이 코드 밖(categories.json)에 있어 문자열이다. */
export type PostCategory = string

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
