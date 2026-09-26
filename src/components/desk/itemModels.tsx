import { Instance, Instances, RoundedBox } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { createScreenTexture, type ScreenName } from './codeScreen'

/**
 * 카탈로그(src/desk/catalog.ts) 물건의 3D 모델. 외부 모델 파일 없이 기본 도형으로 짓는다 —
 * 라이선스를 따질 에셋이 없고, 페이지가 모델 파일을 따로 받지 않는다.
 *
 * 단위는 cm, 원점은 물건 바닥 중심, 앞(앉은 사람 쪽)은 +z다. 크기는 카탈로그의 width·depth 안에
 * 들어가게 맞춘다(스탠드 조명 갓처럼 공중에서 삐져나오는 부분만 예외).
 */
export function ItemModel({ itemId }: { itemId: string }) {
  switch (itemId) {
    case 'monitor-24':
      return <Monitor width={54} aspect={0.58} standDepth={18} screen="code" />
    case 'monitor-studio':
      return <Monitor width={62} aspect={0.57} standDepth={18} screen="scene" bodyColor="#c7c9cc" />
    case 'monitor-27':
      return <Monitor width={62} aspect={0.58} standDepth={20} screen="layout" />
    case 'monitor-ultrawide':
      return <Monitor width={82} aspect={0.42} standDepth={22} screen="scene" />
    case 'laptop':
      return <Laptop />
    case 'keyboard-full':
      return <Keyboard width={46} depth={14} rows={6} caseColor="#2b2d31" keyColor="#3b3e44" accentColor="#e8e8e8" />
    case 'keyboard-tkl':
      return <Keyboard width={36} depth={12} rows={6} caseColor="#2f3136" keyColor="#43464d" accentColor="#e8663c" />
    case 'keyboard-keychron-v2':
      return <Keyboard width={32} depth={12} rows={5} caseColor="#8f959c" keyColor="#dde0e4" accentColor="#4f7fe8" />
    case 'keyboard-65':
      return <Keyboard width={30} depth={12} rows={5} caseColor="#e6e1d6" keyColor="#f7f4ee" accentColor="#8c8f94" />
    case 'keyboard-magic':
      return <Keyboard width={42} depth={12} rows={6} caseColor="#d9dbde" keyColor="#fbfbfb" accentColor="#fbfbfb" />
    case 'keyboard-split':
      return <SplitKeyboard />
    case 'mouse':
      return <Mouse />
    case 'mouse-magic':
      return <Mouse color="#f1f1f1" />
    case 'headphones-xm5':
      return <Headphones />
    case 'stream-deck':
      return <StreamDeck />
    case 'trackpad':
      return <Trackpad />
    case 'mug-coffee':
      return <Mug />
    case 'can-energy':
      return <EnergyCan />
    case 'tumbler':
      return <Tumbler />
    case 'plant-monstera':
      return <Monstera />
    case 'cactus':
      return <Cactus />
    case 'desk-lamp':
      return <DeskLamp />
    case 'lamp-orb':
      return <OrbLamp />
    case 'headphone-stand':
      return <HeadphoneStand />
    case 'speaker':
      return <Speaker />
    case 'rubber-duck':
      return <RubberDuck />
    case 'books':
      return <Books />
    case 'sticky-notes':
      return <StickyNotes />
    default:
      // 카탈로그에 추가하고 모델을 잊은 물건. 안 보이면 드래그도 못 하니 회색 상자로라도 드러낸다.
      return <Part size={[8, 8, 8]} position={[0, 4, 0]} color="#9ca3af" />
  }
}

type Vector = [number, number, number]

interface PartProps {
  size: Vector
  position?: Vector
  rotation?: Vector
  color: string
  roughness?: number
  metalness?: number
}

function Part({ size, position, rotation, color, roughness = 0.6, metalness = 0 }: PartProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

interface CylinderProps {
  radius: number
  bottomRadius?: number
  height: number
  position?: Vector
  rotation?: Vector
  color: string
  roughness?: number
  metalness?: number
}

function Cylinder({
  radius,
  bottomRadius,
  height,
  position,
  rotation,
  color,
  roughness = 0.5,
  metalness = 0,
}: CylinderProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radius, bottomRadius ?? radius, height, 32]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

interface ScreenProps {
  name: ScreenName
  width: number
  height: number
  position: Vector
}

function Screen({ name, width, height, position }: ScreenProps) {
  const texture = useMemo(() => createScreenTexture(name, height / width), [name, width, height])
  // 물건을 빼거나 바꾸면 화면 텍스처(2048px 캔버스)를 GPU에서 내린다.
  useEffect(() => () => texture?.dispose(), [texture])
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      {/* 화면은 스스로 빛난다 — 조명·톤 매핑을 받으면 그늘진 쪽에서 꺼진 모니터처럼 보인다. */}
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

interface MonitorProps {
  width: number
  aspect: number
  standDepth: number
  screen: ScreenName
  /** 받침·베젤 색. Studio Display처럼 은색인 제품이 있다. */
  bodyColor?: string
}

function Monitor({ width, aspect, standDepth, screen, bodyColor = '#2c2d30' }: MonitorProps) {
  const height = width * aspect
  const panelCenterY = 10 + height / 2
  const panelZ = -standDepth * 0.2
  return (
    <group>
      <RoundedBox args={[24, 1.2, standDepth * 0.8]} radius={0.5} position={[0, 0.6, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.4} />
      </RoundedBox>
      <Part
        size={[5, panelCenterY, 2]}
        position={[0, panelCenterY / 2, -standDepth * 0.3]}
        color={bodyColor}
        metalness={0.4}
        roughness={0.4}
      />
      <RoundedBox
        args={[width, height, 2.4]}
        radius={0.8}
        position={[0, panelCenterY, panelZ]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={bodyColor === '#2c2d30' ? '#17181b' : bodyColor}
          metalness={0.5}
          roughness={0.35}
        />
      </RoundedBox>
      <Screen width={width - 1.6} height={height - 1.6} position={[0, panelCenterY, panelZ + 1.21]} name={screen} />
    </group>
  )
}

function Laptop() {
  // 힌지(뒤쪽 모서리)를 축으로 약 105° 펼친 화면. rotation.x가 음수면 화면 윗변이 뒤(-z)로 넘어간다.
  const lidTilt = -0.26
  return (
    <group>
      <RoundedBox args={[32, 1.6, 22]} radius={0.6} position={[0, 0.8, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#b9bcc2" metalness={0.7} roughness={0.35} />
      </RoundedBox>
      <Part size={[28, 0.2, 10]} position={[0, 1.65, -3]} color="#26272b" />
      <Part size={[11, 0.15, 6.5]} position={[0, 1.62, 6.5]} color="#a9adb3" metalness={0.6} roughness={0.3} />
      <group position={[0, 1.6, -11]} rotation={[lidTilt, 0, 0]}>
        <RoundedBox args={[32, 21, 0.8]} radius={0.35} position={[0, 10.5, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#b9bcc2" metalness={0.7} roughness={0.35} />
        </RoundedBox>
        <Screen name="terminal" width={29.5} height={18.5} position={[0, 10.8, 0.41]} />
      </group>
    </group>
  )
}

interface KeyboardProps {
  width: number
  depth: number
  rows: number
  caseColor: string
  keyColor: string
  accentColor: string
}

const KEY_PITCH = 1.9

function Keyboard({ width, depth, rows, caseColor, keyColor, accentColor }: KeyboardProps) {
  return (
    <group>
      <RoundedBox args={[width, 2.6, depth]} radius={0.6} position={[0, 1.3, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={caseColor} roughness={0.55} />
      </RoundedBox>
      <KeyGrid width={width - 1.6} depth={depth - 1.6} rows={rows} keyColor={keyColor} accentColor={accentColor} />
    </group>
  )
}

interface KeyGridProps {
  width: number
  depth: number
  rows: number
  keyColor: string
  accentColor: string
}

/** 키캡. 키가 수십~백 개라 메시 하나를 인스턴스로 찍는다 — 따로 만들면 드로우 콜이 키 수만큼 는다. */
function KeyGrid({ width, depth, rows, keyColor, accentColor }: KeyGridProps) {
  const rowPitch = depth / rows
  const keys = useMemo(() => {
    const columns = Math.floor(width / KEY_PITCH)
    const startX = -((columns - 1) * KEY_PITCH) / 2
    const startZ = -((rows - 1) * rowPitch) / 2
    return Array.from({ length: rows * columns }, (_, index) => {
      const row = Math.floor(index / columns)
      const column = index % columns
      // Esc와 Enter 자리만 강조 색으로 — 커스텀 키캡 느낌이 난다.
      const isAccent = (row === 0 && column === 0) || (row === rows - 3 && column === columns - 1)
      return { position: [startX + column * KEY_PITCH, 3, startZ + row * rowPitch] as Vector, isAccent }
    })
  }, [width, rows, rowPitch])

  return (
    <Instances limit={keys.length} castShadow receiveShadow>
      <boxGeometry args={[1.6, 1, Math.min(1.6, rowPitch * 0.85)]} />
      <meshStandardMaterial roughness={0.7} />
      {keys.map((key) => (
        <Instance key={key.position.join()} position={key.position} color={key.isAccent ? accentColor : keyColor} />
      ))}
    </Instances>
  )
}

const SPLIT_HALF: KeyboardProps = {
  width: 20,
  depth: 14,
  rows: 5,
  caseColor: '#1f2023',
  keyColor: '#30333a',
  accentColor: '#7ee787',
}

function SplitKeyboard() {
  return (
    <group>
      <group position={[-12, 0, 0]} rotation={[0, 0.12, 0]}>
        <Keyboard {...SPLIT_HALF} />
      </group>
      <group position={[12, 0, 0]} rotation={[0, -0.12, 0]}>
        <Keyboard {...SPLIT_HALF} />
      </group>
    </group>
  )
}

function Mouse({ color = '#2a2b2e' }: { color?: string }) {
  return (
    <group>
      <mesh scale={[2.9, 3.4, 5.6]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <Cylinder radius={0.45} height={0.5} position={[0, 3.2, -1.8]} rotation={[0, 0, Math.PI / 2]} color="#6b6f76" />
    </group>
  )
}

function Trackpad() {
  return (
    <RoundedBox args={[16, 0.8, 12]} radius={0.35} position={[0, 0.4, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#c9ccd1" metalness={0.6} roughness={0.35} />
    </RoundedBox>
  )
}

function Mug() {
  return (
    <group position={[-1, 0, 0]}>
      <Cylinder radius={4} height={9} position={[0, 4.5, 0]} color="#f3efe7" roughness={0.25} />
      <Cylinder radius={3.6} height={0.2} position={[0, 8.2, 0]} color="#3b2317" roughness={0.2} />
      <mesh position={[4.1, 4.6, 0]} castShadow>
        <torusGeometry args={[2.1, 0.55, 16, 32]} />
        <meshStandardMaterial color="#f3efe7" roughness={0.25} />
      </mesh>
    </group>
  )
}

function EnergyCan() {
  return (
    <group>
      <Cylinder radius={2.9} height={15.5} position={[0, 7.75, 0]} color="#18181b" metalness={0.6} roughness={0.3} />
      <Cylinder radius={2.95} height={5} position={[0, 8.5, 0]} color="#5de04f" metalness={0.5} roughness={0.3} />
      <Cylinder radius={2.4} height={0.3} position={[0, 15.6, 0]} color="#c8cbd0" metalness={0.8} roughness={0.25} />
    </group>
  )
}

function Tumbler() {
  return (
    <group>
      <Cylinder
        radius={3.8}
        bottomRadius={3.3}
        height={19}
        position={[0, 9.5, 0]}
        color="#7d9f89"
        metalness={0.3}
        roughness={0.35}
      />
      <Cylinder radius={3.9} height={2.4} position={[0, 20.2, 0]} color="#2c2c2c" roughness={0.5} />
    </group>
  )
}

const MONSTERA_LEAVES = Array.from({ length: 8 }, (_, index) => ({
  angle: (index / 8) * Math.PI * 2 + (index % 2) * 0.3,
  height: 20 + (index % 3) * 5,
  reach: 5 + (index % 2) * 2,
}))

function Monstera() {
  return (
    <group>
      <Cylinder radius={8} bottomRadius={6.5} height={14} position={[0, 7, 0]} color="#ebe5da" roughness={0.8} />
      <Cylinder radius={7.4} height={0.4} position={[0, 13.4, 0]} color="#4a3627" roughness={1} />
      {MONSTERA_LEAVES.map((leaf) => (
        <group key={leaf.angle} rotation={[0, leaf.angle, 0]}>
          <Cylinder
            radius={0.3}
            height={leaf.height - 12}
            position={[leaf.reach / 2, 12 + (leaf.height - 12) / 2, 0]}
            rotation={[0, 0, -0.35]}
            color="#3f6b35"
          />
          <mesh
            position={[leaf.reach + 2, leaf.height, 0]}
            rotation={[0, 0, -0.5]}
            scale={[5.5, 0.35, 4]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[1, 20, 12]} />
            <meshStandardMaterial color="#2f7a3a" roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Cactus() {
  return (
    <group>
      <Cylinder radius={3.6} bottomRadius={2.8} height={5} position={[0, 2.5, 0]} color="#c56a47" roughness={0.9} />
      <mesh position={[0, 9, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[2, 5, 8, 16]} />
        <meshStandardMaterial color="#5b8f4e" roughness={0.7} />
      </mesh>
      <mesh position={[2.3, 10, 0]} rotation={[0, 0, -0.6]} castShadow>
        <capsuleGeometry args={[0.9, 1.8, 6, 12]} />
        <meshStandardMaterial color="#5b8f4e" roughness={0.7} />
      </mesh>
    </group>
  )
}

const LAMP_METAL = { color: '#2b2c30', metalness: 0.6, roughness: 0.3 }

function DeskLamp() {
  // 아래 팔은 뒤로 기울고(-0.35), 위 팔은 앞으로 꺾인다(누적 1.9rad). 갓은 누적 회전을 되돌려 바닥을 향한다.
  const lowerTilt = -0.35
  const upperBend = 2.25
  return (
    <group>
      <Cylinder radius={7} height={1.6} position={[0, 0.8, 0]} {...LAMP_METAL} />
      <group position={[0, 1.6, 3]} rotation={[lowerTilt, 0, 0]}>
        <Cylinder radius={0.5} height={24} position={[0, 12, 0]} {...LAMP_METAL} />
        <group position={[0, 24, 0]} rotation={[upperBend, 0, 0]}>
          <Cylinder radius={0.45} height={15} position={[0, 7.5, 0]} {...LAMP_METAL} />
          <group position={[0, 15, 0]} rotation={[-(lowerTilt + upperBend), 0, 0]}>
            <Cylinder radius={1.6} bottomRadius={5} height={6} position={[0, -2, 0]} {...LAMP_METAL} />
            <mesh position={[0, -5.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[4.6, 32]} />
              <meshStandardMaterial color="#fff4d6" emissive="#ffe7b0" emissiveIntensity={2.5} />
            </mesh>
            <pointLight position={[0, -8, 0]} color="#ffdca8" intensity={0.12} distance={0.9} decay={2} />
          </group>
        </group>
      </group>
    </group>
  )
}

function OrbLamp() {
  return (
    <group>
      <Cylinder radius={5} bottomRadius={5.6} height={2.4} position={[0, 1.2, 0]} color="#9b7653" roughness={0.6} />
      <mesh position={[0, 7.4, 0]} castShadow>
        <sphereGeometry args={[5, 32, 24]} />
        <meshStandardMaterial color="#fff1dc" emissive="#ffc98a" emissiveIntensity={1.4} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 8, 0]} color="#ffbf80" intensity={0.08} distance={0.7} decay={2} />
    </group>
  )
}

const STAND_METAL = { color: '#2a2a2d', metalness: 0.5, roughness: 0.35 }

function HeadphoneStand() {
  return (
    <group>
      <Cylinder radius={6.5} height={1.2} position={[0, 0.6, 0]} {...STAND_METAL} />
      <Cylinder radius={0.7} height={24} position={[0, 12, 0]} {...STAND_METAL} />
      <Part size={[8, 1, 2.4]} position={[0, 24.5, 0]} {...STAND_METAL} />
      <mesh position={[0, 17, 0]} castShadow>
        <torusGeometry args={[8.5, 1, 16, 48, Math.PI]} />
        <meshStandardMaterial color="#e9e6e1" roughness={0.5} />
      </mesh>
      {[-8.5, 8.5].map((x) => (
        <Cylinder
          key={x}
          radius={3.6}
          height={2.6}
          position={[x, 15.5, 0]}
          rotation={[0, 0, Math.PI / 2]}
          color="#d9d5ce"
          roughness={0.6}
        />
      ))}
    </group>
  )
}

function Speaker() {
  return (
    <group>
      <RoundedBox args={[12, 20, 14]} radius={0.5} position={[0, 10, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8a5b3c" roughness={0.55} />
      </RoundedBox>
      <Part size={[11, 19, 0.3]} position={[0, 10, 7]} color="#1d1d1f" roughness={0.8} />
      <Cylinder
        radius={4}
        height={0.6}
        position={[0, 7, 7.3]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#0f0f10"
        roughness={0.4}
      />
      <Cylinder
        radius={1.5}
        height={0.6}
        position={[0, 15.5, 7.3]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#3a3a3d"
        metalness={0.6}
        roughness={0.3}
      />
    </group>
  )
}

function RubberDuck() {
  return (
    <group>
      <mesh position={[0, 2.9, -0.3]} scale={[1, 0.8, 1.12]} castShadow receiveShadow>
        <sphereGeometry args={[3.6, 32, 24]} />
        <meshStandardMaterial color="#ffd23f" roughness={0.35} />
      </mesh>
      <mesh position={[0, 6.8, 1.2]} castShadow>
        <sphereGeometry args={[2.2, 32, 24]} />
        <meshStandardMaterial color="#ffd23f" roughness={0.35} />
      </mesh>
      <mesh position={[0, 6.4, 3.3]} scale={[1.1, 0.45, 1]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#ff8a1f" roughness={0.4} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 7.4, 3.1]}>
          <sphereGeometry args={[0.3, 12, 8]} />
          <meshStandardMaterial color="#111" roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function Books() {
  return (
    <group>
      <Part size={[22, 3.2, 16]} position={[0, 1.6, 0]} color="#2f5d8a" />
      <Part size={[21, 2.6, 15]} position={[0.5, 4.5, 0.4]} rotation={[0, 0.08, 0]} color="#b8452f" />
      <Part size={[20, 3, 15.5]} position={[-0.4, 7.3, -0.2]} rotation={[0, -0.05, 0]} color="#e2c044" />
    </group>
  )
}

function StickyNotes() {
  return (
    <group>
      <Part size={[7.6, 1.2, 7.6]} position={[0, 0.6, 0]} color="#ffe45c" roughness={0.9} />
      <Part size={[7.6, 0.05, 7.6]} position={[0, 1.23, 0]} rotation={[0, 0.12, 0]} color="#ffd83a" roughness={0.9} />
    </group>
  )
}

/** 책상에 눕혀 둔 헤드폰. 스캔 모델을 받기 전까지 자리를 지킨다. */
function Headphones() {
  return (
    <group>
      <mesh position={[0, 1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[7, 0.9, 16, 48, Math.PI]} />
        <meshStandardMaterial color="#2b2b2d" roughness={0.6} />
      </mesh>
      {[-7, 7].map((x) => (
        <Cylinder key={x} radius={3.6} height={2.4} position={[x, 1.2, 0]} color="#2b2b2d" roughness={0.6} />
      ))}
    </group>
  )
}

const STREAM_DECK_KEYS = Array.from({ length: 15 }, (_, index) => ({
  x: -4 + (index % 5) * 2,
  z: -2 + Math.floor(index / 5) * 2,
}))

function StreamDeck() {
  return (
    <group rotation={[-0.35, 0, 0]} position={[0, 2.4, 0]}>
      <RoundedBox args={[12, 1.6, 7.6]} radius={0.4} castShadow receiveShadow>
        <meshStandardMaterial color="#1b1c1f" roughness={0.5} />
      </RoundedBox>
      {STREAM_DECK_KEYS.map((key) => (
        <mesh key={`${key.x}:${key.z}`} position={[key.x, 0.85, key.z]}>
          <boxGeometry args={[1.6, 0.2, 1.6]} />
          <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}
