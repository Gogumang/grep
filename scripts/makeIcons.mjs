import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * favicon.svg 하나에서 즐겨찾기·홈 화면용 래스터 아이콘을 만든다.
 *
 * SVG 파비콘만 두면 탭에는 뜨지만 즐겨찾기와 홈 화면에서는 빈다 — 즐겨찾기 UI와
 * iOS·안드로이드는 대부분 /favicon.ico 나 apple-touch-icon 같은 래스터를 찾고,
 * 없으면 글자 아이콘이나 화면 캡처로 대신한다. 실제로 그래서 안 떴다.
 *
 * 바탕을 흰색으로 깐다. 원본 SVG는 배경이 없어서 탭에서는 브라우저 테마를 타는데,
 * iOS 는 투명을 검게 합성하고 어두운 즐겨찾기 막대에서는 초록 획이 묻힌다.
 * 라이트 모드 탭에서 보이던 모습(흰 바탕 위 초록 꺾쇠)을 그대로 굳혀 둔다.
 *
 * 실행: bun run icons
 */
const PUBLIC_DIRECTORY = path.join(process.cwd(), 'public')
const SOURCE = path.join(PUBLIC_DIRECTORY, 'favicon.svg')

const BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 }

/** ICO 안에 넣을 크기. 32는 즐겨찾기 막대, 16은 좁은 탭이 쓴다. */
const ICO_SIZES = [16, 32, 48]
/** iOS 홈 화면이 요구하는 크기. 여기서 줄여 쓰므로 한 장이면 된다. */
const APPLE_TOUCH_SIZE = 180
/** 안드로이드 홈 화면(manifest)이 쓴다. 512는 스플래시에도 쓰인다. */
const MANIFEST_SIZES = [192, 512]

const renderPng = (size) =>
  sharp(SOURCE, { density: 384 })
    .resize(size, size, { fit: 'contain', background: BACKGROUND })
    .flatten({ background: BACKGROUND })
    .png()
    .toBuffer()

/**
 * PNG 여러 장을 ICO 한 장으로 묶는다.
 *
 * ICO 는 6바이트 머리 + 크기마다 16바이트 목차 + 그림 데이터다. PNG 를 그대로
 * 품을 수 있어서(비스타 이후) BMP 로 다시 굽지 않는다. 라이브러리를 하나 더 들이는
 * 것보다 이 표가 짧다.
 */
function toIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // 예약
  header.writeUInt16LE(1, 2) // 1 = 아이콘
  header.writeUInt16LE(images.length, 4)

  let offset = header.length + images.length * 16
  const entries = []
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16)
    // 256px 는 0으로 적는 것이 규격이다. 여기서는 48까지만 쓴다.
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // 팔레트 색 수 (트루컬러라 0)
    entry.writeUInt8(0, 3) // 예약
    entry.writeUInt16LE(1, 4) // 색 평면
    entry.writeUInt16LE(32, 6) // 비트 깊이
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)])
}

const icoImages = await Promise.all(ICO_SIZES.map(async (size) => ({ size, data: await renderPng(size) })))
await writeFile(path.join(PUBLIC_DIRECTORY, 'favicon.ico'), toIco(icoImages))

await writeFile(path.join(PUBLIC_DIRECTORY, 'apple-touch-icon.png'), await renderPng(APPLE_TOUCH_SIZE))

for (const size of MANIFEST_SIZES) {
  await writeFile(path.join(PUBLIC_DIRECTORY, `icon-${size}.png`), await renderPng(size))
}

console.log(
  `favicon.ico(${ICO_SIZES.join('·')}) · apple-touch-icon.png(${APPLE_TOUCH_SIZE}) · ` +
    MANIFEST_SIZES.map((size) => `icon-${size}.png`).join(' · '),
)
