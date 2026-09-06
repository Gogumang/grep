import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Post } from '../shared/types'
import { parsePicksTable } from './picks'
import { type ParsedPostFile, parsePostFile } from './postFile'

/**
 * 글 메타와 본문을 갈라 둔 것은 성능 결정이다 — 목록은 md만 읽고 본문은 상세에서만 읽는다.
 *
 * 이 아래 구조는 collector(Kotlin)와의 계약이다. collector가 같은 자리에 커밋한다:
 *   GitHubProperties.postsPath / bodiesPath / feedsPath / picksPath
 * 경로나 파일 이름 규칙을 옮기면 그쪽도 함께 고쳐야 한다.
 */
const POSTS_ROOT = path.join(process.cwd(), 'src', 'posts')
/** 글 메타. 목록 화면이 이것만 읽는다 — 본문은 상세에서 한 건씩 읽는다. */
const LIST_DIRECTORY = path.join(POSTS_ROOT, 'list')
const POST_DIRECTORY = path.join(POSTS_ROOT, 'post')
/** 운영자가 손으로 관리하는 파일. 수집 대상과 손으로 고른 픽. */
const PICKS_FILE = path.join(POSTS_ROOT, 'config', 'picks.md')

/** list/{id}.md 와 post/{id}.md 가 같은 id로 짝지어진다. */
const POST_ID_IN_FILE_NAME = /^([0-9a-f]{10})\.md$/

async function listPostFileNames(): Promise<string[]> {
  try {
    return (await readdir(LIST_DIRECTORY)).filter((entry) => POST_ID_IN_FILE_NAME.test(entry))
  } catch (error) {
    // 아직 한 번도 수집하지 않았으면 디렉터리가 없다 — 빈 목록으로 다룬다.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

/**
 * 화면에 걸 이미지를 정한다.
 *
 * 원문이 준 이미지를 먼저 쓰고, 없으면 collector가 그려 public/thumbnails 에 넣어 둔
 * 카드로 채운다. 원문 이미지가 있는 글에는 카드를 그리지 않으므로 두 경로가 겹치지 않는다.
 * 크기가 다른 두 장을 쓰는 이유 — 400×220을 1200×630 자리에 늘리면 글자가 뭉개진다.
 */
function withImages(post: ParsedPostFile, id: string): Post {
  return {
    ...post,
    id,
    cardImage: post.sourceThumbnail ?? `/thumbnails/${id}.png`,
    wideImage: post.sourceThumbnail ?? `/thumbnails/${id}-og.png`,
  }
}

/** 숨긴 글까지 포함한 전부. 최신순. */
async function loadAllPosts(): Promise<Post[]> {
  const fileNames = await listPostFileNames()

  const posts = await Promise.all(
    fileNames.map(async (fileName) => {
      const post = parsePostFile(await readFile(path.join(LIST_DIRECTORY, fileName), 'utf8'))
      if (!post) return null

      // id는 frontmatter가 아니라 파일 이름에 있다 — 썸네일을 찾으려면 이게 필요하다.
      const id = POST_ID_IN_FILE_NAME.exec(fileName)?.[1]
      return id ? withImages(post, id) : null
    }),
  )

  return posts
    .filter((post): post is Post => post !== null)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
}

export async function loadPosts(): Promise<Post[]> {
  return (await loadAllPosts()).filter((post) => !post.hidden)
}

/** 손으로 고른 픽. 비어 있으면 자동 선정이 대신한다. */
export async function loadManualPickUrls(): Promise<string[]> {
  try {
    return parsePicksTable(await readFile(PICKS_FILE, 'utf8'))
  } catch {
    return []
  }
}

/** 상세 페이지가 전체 본문을 메모리에 올리지 않게 한 건씩 읽는다. */
export async function loadBody(postId: string): Promise<string | null> {
  try {
    return await readFile(path.join(POST_DIRECTORY, `${postId}.md`), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}
