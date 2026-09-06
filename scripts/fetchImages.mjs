import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * 글 이미지를 원문 서버에서 받아 AVIF로 바꿔 public/images 아래에 둔다.
 *
 * 원격 주소를 그대로 쓰면 두 가지가 걸린다 — 원문이 이미지를 지우면 카드가 비고,
 * 토스 CDN은 Accept 협상을 하지 않아 PNG만 준다(홈에서 PNG 13장 약 1.5MB).
 *
 * 받은 뒤에는 frontmatter의 sourceThumbnail을 로컬 경로로 바꿔 둔다.
 * collector가 파일을 덮어쓰면 원격 주소로 되돌아가므로 그때 다시 돌려야 한다.
 *
 * 실행: node scripts/fetchImages.mjs
 */
const LIST_DIRECTORY = path.join(process.cwd(), 'src', 'posts', 'list')
const IMAGE_DIRECTORY = path.join(process.cwd(), 'public', 'images')

const REQUEST_TIMEOUT_MS = 20_000
const CONCURRENCY = 4

/** 카드가 400px, 히어로가 1200px로 쓰인다. 그보다 크게 받아둘 이유가 없다. */
const MAX_WIDTH = 1200
/**
 * 실측: PNG 879KB → AVIF q50 23KB (97% 감소). WebP q80은 44KB였다.
 * 인코딩이 WebP보다 5~10배 느리지만 이미지가 20장이라 감당된다 —
 * 수백 장으로 늘면 AVIF + WebP 폴백(<picture>)을 고려해야 한다.
 */
const AVIF_QUALITY = 50

const isRemote = (value) => value.startsWith('http://') || value.startsWith('https://')

async function toAvif(url, targetPath) {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const original = Buffer.from(await response.arrayBuffer())
  const converted = await sharp(original)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .avif({ quality: AVIF_QUALITY })
    .toBuffer()

  await writeFile(targetPath, converted)
  return { before: original.length, after: converted.length }
}

await mkdir(IMAGE_DIRECTORY, { recursive: true })
const fileNames = (await readdir(LIST_DIRECTORY)).filter((name) => name.endsWith('.md'))

let saved = 0
let before = 0
let after = 0
const failures = []

for (let i = 0; i < fileNames.length; i += CONCURRENCY) {
  await Promise.all(
    fileNames.slice(i, i + CONCURRENCY).map(async (fileName) => {
      const filePath = path.join(LIST_DIRECTORY, fileName)
      const contents = await readFile(filePath, 'utf8')
      const url = /^sourceThumbnail: "(.*)"$/m.exec(contents)?.[1]
      if (!url || !isRemote(url)) return

      const id = fileName.replace(/\.md$/, '')
      try {
        const size = await toAvif(url, path.join(IMAGE_DIRECTORY, `${id}.avif`))
        before += size.before
        after += size.after
        saved += 1
        await writeFile(filePath, contents.replace(url, `/images/${id}.avif`), 'utf8')
      } catch (error) {
        // 이미지는 보조 데이터다 — 한 장이 실패해도 나머지를 멈추지 않는다.
        failures.push(`${fileName}: ${error.message}`)
      }
    }),
  )
}

for (const failure of failures) console.warn(`  ! ${failure}`)
const toKb = (bytes) => Math.round(bytes / 1024)
console.log(
  `이미지 ${saved}장 · ${toKb(before)}KB → ${toKb(after)}KB (${Math.round((1 - after / before) * 100)}% 감소) · 실패 ${failures.length}건`,
)
