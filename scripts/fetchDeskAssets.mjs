import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'

/**
 * 책상 꾸미기(/desk)의 3D 에셋을 Poly Haven(CC0)에서 받아 public/desk 아래에 굽고,
 * 출처를 src/desk/assets.json에 적는다. 페이지의 "3D 모델·재질 출처"가 이 파일을 그대로 보여 준다.
 *
 * 모델은 텍스처를 1024px WebP로, 메시를 meshopt로 줄여 GLB 하나로 만든다. Draco는 쓰지 않는다 —
 * 디코더를 브라우저가 구글 CDN에서 따로 받아 오는데, meshopt 디코더는 three 번들 안에 있다.
 * 스캔 모델이 없는 물건(모니터·키보드 등)은 components/desk/itemModels.tsx의 도형 모델로 그린다.
 *
 * 실행: bun run desk-assets
 */
const PUBLIC_DIRECTORY = path.join(process.cwd(), 'public', 'desk')
const MANIFEST_PATH = path.join(process.cwd(), 'src', 'desk', 'assets.json')
const REQUEST_TIMEOUT_MS = 30_000
const TEXTURE_SIZE = 1024
const WEBP_QUALITY = 80

/** 카탈로그 물건 id ← Poly Haven 모델 id. */
const POLY_HAVEN_MODELS = [
  { itemId: 'plant-monstera', source: 'potted_plant_02' },
  { itemId: 'cactus', source: 'potted_plant_04' },
  { itemId: 'rubber-duck', source: 'rubber_duck_toy' },
  { itemId: 'desk-lamp', source: 'desk_lamp_arm_01' },
  { itemId: 'books', source: 'book_encyclopedia_set_01' },
  { itemId: 'alarm-clock', source: 'alarm_clock_01' },
]

/** 책상 상판·바닥 재질. 이름이 곧 public/desk/textures/<name>_{diff,nor,rough}.webp 다. */
const POLY_HAVEN_TEXTURES = [
  { name: 'oak', source: 'oak_veneer_01' },
  { name: 'walnut', source: 'american_walnut_veneer' },
  { name: 'floor', source: 'laminate_floor_02' },
]

/** 반사·간접광을 만드는 실내 조명. 배경으로는 쓰지 않는다(방 벽이 따로 있다). */
const POLY_HAVEN_HDRI = { name: 'room', source: 'lythwood_lounge' }

async function fetchBytes(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'grep-desk-assets' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`${url} 응답 ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function fetchJson(url) {
  return JSON.parse((await fetchBytes(url)).toString('utf8'))
}

async function polyHavenCredit(source) {
  const info = await fetchJson(`https://api.polyhaven.com/info/${source}`)
  return {
    title: info.name,
    author: Object.keys(info.authors ?? {}).join(', '),
    sourceUrl: `https://polyhaven.com/a/${source}`,
    license: 'CC0-1.0',
  }
}

async function createIo() {
  await MeshoptEncoder.ready
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
}

async function bakeModel(io, inputPath, outputPath) {
  const document = await io.read(inputPath)
  await document.transform(
    dedup(),
    prune(),
    weld(),
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [TEXTURE_SIZE, TEXTURE_SIZE],
      quality: WEBP_QUALITY,
    }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(outputPath, document)
}

async function downloadPolyHavenModel(source, workDirectory) {
  const files = await fetchJson(`https://api.polyhaven.com/files/${source}`)
  const gltf = files.gltf?.['1k']?.gltf
  if (!gltf) throw new Error(`${source}에 glTF 파일이 없습니다`)
  const directory = path.join(workDirectory, source)
  await mkdir(directory, { recursive: true })
  const gltfPath = path.join(directory, `${source}.gltf`)
  await writeFile(gltfPath, await fetchBytes(gltf.url))
  for (const [relativePath, entry] of Object.entries(gltf.include ?? {})) {
    const target = path.join(directory, relativePath)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, await fetchBytes(entry.url))
  }
  return gltfPath
}

async function fetchTexture({ name, source }) {
  const files = await fetchJson(`https://api.polyhaven.com/files/${source}`)
  const maps = { diff: files.Diffuse, nor: files.nor_gl, rough: files.Rough }
  for (const [suffix, map] of Object.entries(maps)) {
    const url = map?.['1k']?.jpg?.url
    if (!url) throw new Error(`${source}에 ${suffix} 1k jpg가 없습니다`)
    const webp = await sharp(await fetchBytes(url))
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
    await writeFile(path.join(PUBLIC_DIRECTORY, 'textures', `${name}_${suffix}.webp`), webp)
  }
  return { file: `/desk/textures/${name}_{diff,nor,rough}.webp`, ...(await polyHavenCredit(source)) }
}

async function fetchHdri({ name, source }) {
  const files = await fetchJson(`https://api.polyhaven.com/files/${source}`)
  const url = files.hdri?.['1k']?.hdr?.url
  if (!url) throw new Error(`${source}에 1k hdr이 없습니다`)
  await writeFile(path.join(PUBLIC_DIRECTORY, 'hdri', `${name}.hdr`), await fetchBytes(url))
  return { file: `/desk/hdri/${name}.hdr`, ...(await polyHavenCredit(source)) }
}

async function main() {
  for (const directory of ['models', 'textures', 'hdri']) {
    await mkdir(path.join(PUBLIC_DIRECTORY, directory), { recursive: true })
  }
  const io = await createIo()
  const workDirectory = path.join(tmpdir(), `grep-desk-assets-${process.pid}`)
  const manifest = { models: {}, textures: {}, hdri: null }
  const modelPathOf = (itemId) => path.join(PUBLIC_DIRECTORY, 'models', `${itemId}.glb`)

  try {
    for (const { itemId, source } of POLY_HAVEN_MODELS) {
      const gltfPath = await downloadPolyHavenModel(source, workDirectory)
      await bakeModel(io, gltfPath, modelPathOf(itemId))
      manifest.models[itemId] = { file: `/desk/models/${itemId}.glb`, ...(await polyHavenCredit(source)) }
      console.log(`모델 ${itemId} ← Poly Haven ${source}`)
    }

    for (const texture of POLY_HAVEN_TEXTURES) {
      manifest.textures[texture.name] = await fetchTexture(texture)
      console.log(`텍스처 ${texture.name} ← Poly Haven ${texture.source}`)
    }

    manifest.hdri = await fetchHdri(POLY_HAVEN_HDRI)
    console.log(`HDRI ${POLY_HAVEN_HDRI.name} ← Poly Haven ${POLY_HAVEN_HDRI.source}`)
  } finally {
    await rm(workDirectory, { recursive: true, force: true })
  }

  const previous = await readFile(MANIFEST_PATH, 'utf8').catch(() => '')
  const next = `${JSON.stringify(manifest, null, 2)}\n`
  if (previous !== next) await writeFile(MANIFEST_PATH, next)
  console.log(`출처 기록: ${path.relative(process.cwd(), MANIFEST_PATH)}`)
}

await main()
