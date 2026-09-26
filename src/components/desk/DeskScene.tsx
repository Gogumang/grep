import { Environment, OrbitControls, useTexture } from '@react-three/drei'
import { Canvas, type ThreeEvent, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { Plane, RepeatWrapping, SRGBColorSpace, type Texture, Vector3 } from 'three'
import { HDRI_URL, textureUrlsOf } from '@/desk/assets'
import { DESK_CATALOG } from '@/desk/catalog'
import type { DeskLayout, DeskSurface, PlacedItem } from '@/shared/types'
import { footprintOf, snapToGrid } from '@/shared/utils/deskLayout'
import { ItemView } from './ItemView'

/** 상판 윗면 높이(cm). 일반 사무용 책상 높이다. */
const DESK_TOP_CM = 74
const DESK_THICKNESS_CM = 3
const CENTIMETERS_PER_METER = 100
/** 드래그할 때 포인터 광선을 맞히는 평면. 장면 전체를 0.01배(cm→m)로 줄였으니 여기는 미터다. */
const DESK_PLANE = new Plane(new Vector3(0, 1, 0), -DESK_TOP_CM / CENTIMETERS_PER_METER)
const SELECTION_COLOR = '#3182f6'
const FLOOR_SIZE_CM = 800
/** 텍스처 한 장이 덮는 실제 크기(cm). 베니어는 1m 판, 바닥은 널 서너 장이 한 장에 들어 있다. */
const WOOD_TILE_CM = 60
const FLOOR_TILE_CM = 160
/** 시점 회전의 중심(상판 조금 위)과, 거기서 카메라까지의 기본 거리·방향(m). */
const CAMERA_TARGET = new Vector3(0, 0.8, 0)
const CAMERA_OFFSET = new Vector3(0, 0.82, 1.62)
/**
 * 이 가로세로 비율(데스크톱 캔버스)에서 기본 거리로 책상 전체가 들어온다. 이보다 좁은 화면(폰 세로)은
 * 가로 시야가 비율만큼 줄어 책상 양 끝이 잘리므로 그만큼 카메라를 뒤로 뺀다.
 */
const WIDE_ASPECT = 1.3

interface Point {
  x: number
  z: number
}

interface DeskSceneProps {
  layout: DeskLayout
  selectedKey: string | null
  onSelect: (key: string | null) => void
  onMove: (key: string, target: Point) => void
  onCanvasReady: (canvas: HTMLCanvasElement) => void
}

export function DeskScene({ layout, selectedKey, onSelect, onMove, onCanvasReady }: DeskSceneProps) {
  const surface = DESK_CATALOG.surfaces.get(layout.surfaceId)
  if (!surface) return null

  return (
    <Canvas
      // 'percentage'(PCF) — 기본값인 PCFSoft는 three r18x에서 빠져 경고와 함께 PCF로 떨어진다.
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: CAMERA_TARGET.clone().add(CAMERA_OFFSET).toArray(), fov: 40, near: 0.05, far: 20 }}
      // 이미지 저장(toBlob)이 마지막 프레임을 읽을 수 있게 버퍼를 남긴다.
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => onCanvasReady(gl.domElement)}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={['#efe9e1']} />
      {/*
        실내 사진(HDRI)으로 간접광과 반사를 만든다. 금속·플라스틱·유리가 사진처럼 보이는 건 거의 이 덕이다.
        배경으로는 쓰지 않는다 — 방 벽과 바닥을 따로 그린다.
      */}
      <Suspense fallback={<hemisphereLight args={['#fffaf0', '#8c8173', 1.1]} />}>
        <Environment files={HDRI_URL} environmentIntensity={0.75} />
      </Suspense>
      <directionalLight
        castShadow
        position={[1.2, 2.8, 1.6]}
        intensity={1.6}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-1.3, 1.3, 1.3, -1.3, 0.1, 6]} />
      </directionalLight>

      <FitCamera />
      <group scale={1 / CENTIMETERS_PER_METER}>
        <Room surface={surface} />
        <Desk surface={surface} />
        {layout.items.map((placed) => (
          <PlacedItemView
            key={placed.key}
            placed={placed}
            isSelected={placed.key === selectedKey}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
      </group>

      <OrbitControls
        makeDefault
        target={CAMERA_TARGET.toArray()}
        enablePan={false}
        minDistance={0.7}
        maxDistance={3.6}
        // 책상 아래로 파고들지 않게 수평 조금 위에서 멈춘다.
        maxPolarAngle={1.35}
      />
    </Canvas>
  )
}

function FitCamera() {
  const camera = useThree((state) => state.camera)
  const aspect = useThree((state) => state.size.width / state.size.height)
  useEffect(() => {
    const distanceScale = Math.max(1, WIDE_ASPECT / aspect)
    camera.position.copy(CAMERA_TARGET).add(CAMERA_OFFSET.clone().multiplyScalar(distanceScale))
  }, [camera, aspect])
  return null
}

function Room({ surface }: { surface: DeskSurface }) {
  const wallZ = -(surface.depth / 2 + 20)
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_SIZE_CM, FLOOR_SIZE_CM]} />
        <Suspense fallback={<meshStandardMaterial color="#cdb99c" roughness={0.9} />}>
          <TexturedMaterial name="floor" repeat={[FLOOR_SIZE_CM / FLOOR_TILE_CM, FLOOR_SIZE_CM / FLOOR_TILE_CM]} />
        </Suspense>
      </mesh>
      <mesh position={[0, 150, wallZ]} receiveShadow>
        <planeGeometry args={[800, 300]} />
        <meshStandardMaterial color="#ebe6de" roughness={1} />
      </mesh>
    </group>
  )
}

/** Poly Haven 재질 한 벌(색·노멀·거칠기). repeat은 면 크기 ÷ 텍스처 한 장이 덮는 실제 크기다. */
function TexturedMaterial({ name, repeat }: { name: string; repeat: [number, number] }) {
  const textures = useTexture(textureUrlsOf(name), (loaded) => {
    for (const texture of Object.values(loaded as Record<string, Texture>)) {
      texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
      texture.anisotropy = 8
    }
  })
  textures.map.colorSpace = SRGBColorSpace
  for (const texture of [textures.map, textures.normalMap, textures.roughnessMap]) texture.repeat.set(...repeat)
  return <meshStandardMaterial {...textures} />
}

function Desk({ surface }: { surface: DeskSurface }) {
  const legHeight = DESK_TOP_CM - DESK_THICKNESS_CM
  const legInsetX = surface.width / 2 - 5
  const legInsetZ = surface.depth / 2 - 5
  const legPositions: [number, number][] = [
    [-legInsetX, -legInsetZ],
    [legInsetX, -legInsetZ],
    [-legInsetX, legInsetZ],
    [legInsetX, legInsetZ],
  ]
  return (
    <group>
      {/* 나뭇결이 윗면에 한 장으로 펴지도록 상자를 쓴다 — RoundedBox는 윗면 UV가 모서리 곡면과 섞인다. */}
      <mesh position={[0, DESK_TOP_CM - DESK_THICKNESS_CM / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[surface.width, DESK_THICKNESS_CM, surface.depth]} />
        {surface.texture ? (
          <Suspense fallback={<meshStandardMaterial color={surface.topColor} roughness={0.55} />}>
            <TexturedMaterial
              key={surface.texture}
              name={surface.texture}
              repeat={[surface.width / WOOD_TILE_CM, surface.depth / WOOD_TILE_CM]}
            />
          </Suspense>
        ) : (
          <meshStandardMaterial color={surface.topColor} roughness={0.45} />
        )}
      </mesh>
      {legPositions.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, legHeight / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[4, legHeight, 4]} />
          <meshStandardMaterial color={surface.legColor} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

interface PlacedItemViewProps {
  placed: PlacedItem
  isSelected: boolean
  onSelect: (key: string | null) => void
  onMove: (key: string, target: Point) => void
}

function PlacedItemView({ placed, isSelected, onSelect, onMove }: PlacedItemViewProps) {
  // 잡은 지점과 물건 중심의 차이. 가장자리를 잡고 끌어도 물건이 포인터 아래로 튀지 않는다.
  const grabOffset = useRef<Point | null>(null)
  const controls = useThree((state) => state.controls) as { enabled: boolean } | null
  const item = DESK_CATALOG.items.get(placed.itemId)
  if (!item) return null
  const footprint = footprintOf(item, 0)

  const pointOnDesk = (event: ThreeEvent<PointerEvent>): Point | null => {
    const hit = event.ray.intersectPlane(DESK_PLANE, new Vector3())
    return hit ? { x: hit.x * CENTIMETERS_PER_METER, z: hit.z * CENTIMETERS_PER_METER } : null
  }

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onSelect(placed.key)
    const point = pointOnDesk(event)
    if (!point) return
    grabOffset.current = { x: point.x - placed.x, z: point.z - placed.z }
    ;(event.target as Element).setPointerCapture(event.pointerId)
    // 상태로 끄면 다음 렌더까지 시점 회전이 같이 돌아간다. 컨트롤을 바로 끈다.
    if (controls) controls.enabled = false
    document.body.style.cursor = 'grabbing'
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const offset = grabOffset.current
    if (!offset) return
    event.stopPropagation()
    const point = pointOnDesk(event)
    if (!point) return
    onMove(placed.key, { x: snapToGrid(point.x - offset.x), z: snapToGrid(point.z - offset.z) })
  }

  const endDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!grabOffset.current) return
    grabOffset.current = null
    ;(event.target as Element).releasePointerCapture(event.pointerId)
    if (controls) controls.enabled = true
    document.body.style.cursor = 'grab'
  }

  return (
    <group
      position={[placed.x, DESK_TOP_CM, placed.z]}
      rotation={[0, (-placed.rotation * Math.PI) / 2, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (!grabOffset.current) document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!grabOffset.current) document.body.style.cursor = ''
      }}
    >
      <ItemView itemId={placed.itemId} width={item.width} depth={item.depth} />
      {isSelected && (
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[footprint.width + 2, footprint.depth + 2]} />
          <meshBasicMaterial color={SELECTION_COLOR} transparent opacity={0.28} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
