import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * 글에 실린 남의 서버 이미지를 받아 public/images 아래에 두고, 마크다운의 주소를
 * 로컬 경로로 바꾼다. 목록 썸네일(list/*.md의 sourceThumbnail)과 본문 이미지
 * (post/*.md의 ![](...)) 둘 다 대상이다.
 *
 * 원격 주소를 그대로 쓰면 세 가지가 걸린다 — 원문이 이미지를 지우면 글이 비고,
 * 토스 CDN은 Accept 협상을 하지 않아 PNG만 주며(홈에서 PNG 13장 약 1.5MB),
 * 읽는 사람의 브라우저가 원문 서버로 직접 요청을 보낸다(핫링크).
 *
 * collector(grep-airflow의 AvifTranscoder)도 공개 시점에 같은 일을 한다. 여기는
 * 그쪽이 놓친 것을 메우는 자리다 — avifenc가 없거나 실패하면 원본 PNG·JPEG가
 * 그대로 들어오는데, 그걸 여기서 다시 구워 AVIF로 바꾸고 원본을 지운다.
 * 이미 AVIF인 이미지는 건드리지 않으므로 몇 번을 돌려도 같은 결과가 된다.
 *
 * 최대 폭(1200·1400)과 품질(50)은 collector와 맞춰 둔 값이다. 한쪽만 고치면
 * 같은 그림이 두 크기로 갈린다.
 *
 * 실행: bun run images
 */
const LIST_DIRECTORY = path.join(process.cwd(), 'src', 'posts', 'list')
const POST_DIRECTORY = path.join(process.cwd(), 'src', 'posts', 'post')
const IMAGE_DIRECTORY = path.join(process.cwd(), 'public', 'images')
const PUBLIC_DIRECTORY = path.join(process.cwd(), 'public')
const IMAGE_URL_PREFIX = '/images'

/**
 * 이미 우리 저장소에 있지만 다시 구워야 하는 형식. collector가 원문에서 받은 바이트를
 * 그대로 넣기 때문에(grep-airflow e75532d) 새 글은 PNG·JPEG로 들어온다.
 * AVIF·WebP는 이미 줄어든 것이거나 움직이는 이미지라 손대지 않는다.
 *
 * GIF도 넣는다 — 마흔 장이 198MB였다(한 장이 27.8MB). 움직이는 것은 아래에서
 * WebP로 가므로 프레임이 살아 있다.
 */
const REBAKE_PATTERN = /\.(png|jpe?g|gif)$/i

const REQUEST_TIMEOUT_MS = 20_000
const CONCURRENCY = 4
/** 토스 CDN은 연속 요청에 403을 돌려줄 때가 있다 — 한 번 실패했다고 포기하지 않는다. */
const RETRY_LIMIT = 3
const RETRY_BACKOFF_MS = 2_000

/** 카드가 400px, 히어로가 1200px로 쓰인다. 그보다 크게 받아둘 이유가 없다. */
const THUMBNAIL_MAX_WIDTH = 1200
/** 본문 폭이 700px이다(post.css.ts). 고해상도 화면을 감안해 2배까지만 받는다. */
const BODY_MAX_WIDTH = 1400
/**
 * 실측: PNG 879KB → AVIF q50 23KB (97% 감소). WebP q80은 44KB였다.
 * 인코딩이 WebP보다 5~10배 느리지만 이미지가 수백 장이라 아직 감당된다.
 */
const AVIF_QUALITY = 50
/** 움직이는 이미지는 AVIF 인코딩이 지나치게 느려 WebP로 남긴다(APNG는 아래에서 원본 그대로 둔다). */
const ANIMATED_WEBP_QUALITY = 50

/**
 * Medium이 RSS 본문에 끼워 보내는 조회수 추적 픽셀. 이미지가 아니라 받아둘 것도 없고,
 * 남겨두면 읽는 사람의 브라우저가 Medium으로 조회 신호를 보낸다 — 통째로 지운다.
 */
const TRACKING_PIXEL_PATTERN = /^https:\/\/medium\.com\/_\/stat\b/

/**
 * 마크다운 이미지. 주소에 괄호가 들어가면 `\(`처럼 이스케이프되어 오므로
 * (toss CDN의 `..._(3).png`) `\\.`를 먼저 두어 닫는 괄호로 오인하지 않게 한다.
 */
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(((?:\\.|[^()\s])+)\)/g

/** 추적 픽셀을 지운 자리에 빈 줄이 세 개씩 남는다. */
const tidyBlankLines = (contents) => contents.replace(/\n{3,}/g, '\n\n')

const isRemote = (value) => value.startsWith('http://') || value.startsWith('https://')
const isLocalImage = (value) => value.startsWith(`${IMAGE_URL_PREFIX}/`)
/** 원격이면 받아야 하고, 로컬 PNG·JPEG면 다시 구워야 한다. 그 밖에는 할 일이 없다. */
const needsWork = (value) => isRemote(value) || (isLocalImage(value) && REBAKE_PATTERN.test(value))
const unescapeUrl = (value) => value.replace(/\\([()])/g, '$1')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const toKb = (bytes) => Math.round(bytes / 1024)

async function download(url) {
  let lastError
  for (let attempt = 0; attempt < RETRY_LIMIT; attempt += 1) {
    if (attempt > 0) await sleep(RETRY_BACKOFF_MS * attempt)
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * APNG(움직이는 PNG)인지 본다. acTL 청크가 있고 첫 IDAT보다 앞서면 APNG다.
 *
 * sharp(libvips)는 APNG 프레임을 읽지 못해 metadata().pages를 1로 돌려준다 —
 * 그 값만 믿고 변환하면 첫 프레임만 남는다. 404 아이콘(120프레임)을 그렇게 날릴 뻔했다.
 */
function isAnimatedPng(buffer) {
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return false
  const animationControl = buffer.indexOf('acTL')
  if (animationControl < 0) return false
  const firstImageData = buffer.indexOf('IDAT')
  return firstImageData < 0 || animationControl < firstImageData
}

/**
 * 받거나 읽어서 줄인 뒤 저장하고, 새로 가리켜야 할 `/images/...` 주소를 돌려준다.
 * 움직이는 이미지를 정지 변환하면 첫 프레임만 남으므로 프레임 수를 먼저 본다.
 *
 * 주소를 부르는 쪽에서 조립하지 않고 여기서 돌려주는 이유 — 로컬 파일은 제 경로를
 * 지키고 원격만 fallbackBase를 쓴다. 두 규칙을 호출부마다 되풀이하면 어긋난다.
 */
/**
 * 원격이면 받아 오고, 우리 저장소 안의 경로면 파일에서 읽는다.
 * 로컬은 확장자를 뺀 경로를 그대로 목적지로 쓴다 — 번호를 다시 매기면
 * collector가 붙인 번호와 어긋나서 다른 그림을 가리키게 된다.
 */
/** public 아래의 실제 파일 경로를 브라우저가 부르는 주소로 되돌린다. */
const toPublicUrl = (filePath) => `/${path.relative(PUBLIC_DIRECTORY, filePath).split(path.sep).join('/')}`

const loadSource = (source) => (isRemote(source) ? download(source) : readFile(path.join(PUBLIC_DIRECTORY, source)))

async function saveConverted(source, fallbackBase, maxWidth) {
  const original = await loadSource(source)
  const targetBase = isRemote(source) ? fallbackBase : path.join(PUBLIC_DIRECTORY, source).replace(/\.[^./]+$/, '')

  /**
   * APNG는 다시 굽지 않고 원본 그대로 둔다 — 프레임마다 픽셀이 거의 다 바뀌어
   * 프레임 간 압축이 먹지 않는다. 404 아이콘 실측: 원본 1,024KB인데
   * WebP 24fps 1,149KB, 30fps 1,490KB로 오히려 커졌다.
   */
  if (isAnimatedPng(original)) {
    await writeFile(`${targetBase}.png`, original)
    return { before: original.length, after: original.length, url: toPublicUrl(`${targetBase}.png`) }
  }

  /**
   * sharp는 기본적으로 268MP가 넘는 입력을 거부한다(압축 폭탄 방어). 움직이는 이미지는
   * 프레임을 세로로 이어 붙인 한 장으로 읽혀서, 긴 GIF는 그 상한에 쉽게 닿는다 —
   * 실제로 열두 장이 여기서 막혀 원본 109MB로 남았다. 우리가 방금 받아둔 파일만
   * 다루므로 상한을 푼다.
   */
  const readOptions = { limitInputPixels: false }
  const isAnimated = ((await sharp(original, { ...readOptions, animated: true }).metadata()).pages ?? 1) > 1

  const resized = sharp(original, { ...readOptions, animated: isAnimated }).resize({
    width: maxWidth,
    withoutEnlargement: true,
  })
  const extension = isAnimated ? 'webp' : 'avif'
  const converted = await (isAnimated
    ? resized.webp({ quality: ANIMATED_WEBP_QUALITY })
    : resized.avif({ quality: AVIF_QUALITY })
  ).toBuffer()

  const targetPath = `${targetBase}.${extension}`
  await writeFile(targetPath, converted)

  // 다시 구운 로컬 파일의 원본은 지운다 — 남겨두면 아무도 안 보는 채로 저장소만 무거워진다.
  if (!isRemote(source)) {
    const originalPath = path.join(PUBLIC_DIRECTORY, source)
    if (originalPath !== targetPath) await unlink(originalPath)
  }

  return { before: original.length, after: converted.length, url: toPublicUrl(targetPath) }
}

const markdownFileNames = async (directory) => (await readdir(directory)).filter((name) => name.endsWith('.md')).sort()

/** 파일 목록을 CONCURRENCY만큼씩 끊어 처리한다 — 한 번에 다 열면 CDN이 403을 준다. */
async function inBatches(items, handle) {
  for (let index = 0; index < items.length; index += CONCURRENCY) {
    await Promise.all(items.slice(index, index + CONCURRENCY).map(handle))
  }
}

const totals = { count: 0, before: 0, after: 0 }
const failures = []

function recordSaved({ before, after }) {
  totals.count += 1
  totals.before += before
  totals.after += after
}

async function fetchThumbnail(fileName) {
  const filePath = path.join(LIST_DIRECTORY, fileName)
  const contents = await readFile(filePath, 'utf8')
  const url = /^sourceThumbnail: "(.*)"$/m.exec(contents)?.[1]
  if (!url || !needsWork(url)) return

  const id = fileName.replace(/\.md$/, '')
  try {
    const saved = await saveConverted(url, path.join(IMAGE_DIRECTORY, id), THUMBNAIL_MAX_WIDTH)
    recordSaved(saved)
    await writeFile(filePath, contents.replace(url, saved.url), 'utf8')
  } catch (error) {
    // 이미지는 보조 데이터다 — 한 장이 실패해도 나머지를 멈추지 않는다.
    // 주소는 원격 그대로 두어 다음 실행이 다시 시도할 수 있게 한다.
    failures.push(`${fileName} 썸네일: ${error.message}`)
  }
}

async function fetchBodyImages(fileName) {
  const filePath = path.join(POST_DIRECTORY, fileName)
  const id = fileName.replace(/\.md$/, '')
  const original = await readFile(filePath, 'utf8')

  const withoutPixels = original.replace(MARKDOWN_IMAGE_PATTERN, (match, _alt, rawUrl) =>
    TRACKING_PIXEL_PATTERN.test(unescapeUrl(rawUrl)) ? '' : match,
  )

  /**
   * 번호는 남은 이미지 전체에서의 순서로 매긴다 — 처리 대상만 세면 한 장이 실패했다가
   * 다음 실행에서 성공할 때 이미 저장된 파일과 번호가 어긋난다.
   * 이미 로컬에 있는 파일은 이 번호를 쓰지 않고 제 경로를 그대로 지킨다(saveConverted).
   */
  const images = [...withoutPixels.matchAll(MARKDOWN_IMAGE_PATTERN)].map((match, index) => ({
    markdown: match[0],
    alt: match[1],
    url: unescapeUrl(match[2]),
    number: String(index + 1).padStart(2, '0'),
  }))
  const pending = images.filter((image) => needsWork(image.url))
  if (pending.length === 0) {
    if (withoutPixels !== original) await writeFile(filePath, tidyBlankLines(withoutPixels), 'utf8')
    return
  }

  const postImageDirectory = path.join(IMAGE_DIRECTORY, id)
  await mkdir(postImageDirectory, { recursive: true })

  let contents = withoutPixels
  for (const image of pending) {
    try {
      const saved = await saveConverted(image.url, path.join(postImageDirectory, image.number), BODY_MAX_WIDTH)
      recordSaved(saved)
      // 치환문을 함수로 준다 — alt에 `$&` 같은 글자가 있어도 그대로 남는다.
      contents = contents.replace(image.markdown, () => `![${image.alt}](${saved.url})`)
    } catch (error) {
      failures.push(`${fileName} ${image.number}번: ${error.message}`)
    }
  }

  await writeFile(filePath, tidyBlankLines(contents), 'utf8')
}

await mkdir(IMAGE_DIRECTORY, { recursive: true })

const listFileNames = await markdownFileNames(LIST_DIRECTORY)
await inBatches(listFileNames, fetchThumbnail)
console.log(`썸네일 ${totals.count}장`)

const thumbnailCount = totals.count
const postFileNames = await markdownFileNames(POST_DIRECTORY)
await inBatches(postFileNames, fetchBodyImages)
console.log(`본문 ${totals.count - thumbnailCount}장`)

for (const failure of failures) console.warn(`  ! ${failure}`)
// 받을 게 없으면 감소율이 0/0이 된다 — 그때는 비율을 빼고 적는다.
const reduction = totals.before > 0 ? ` (${Math.round((1 - totals.after / totals.before) * 100)}% 감소)` : ''
console.log(
  `이미지 ${totals.count}장 · ${toKb(totals.before)}KB → ${toKb(totals.after)}KB${reduction}` +
    ` · 실패 ${failures.length}건`,
)
