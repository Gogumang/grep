import { useGLTF } from '@react-three/drei'
import { Component, type ReactNode, Suspense, useMemo } from 'react'
import { Box3, type Mesh, Vector3 } from 'three'
import { modelUrlOf } from '@/desk/assets'
import { ItemModel } from './itemModels'

interface ItemViewProps {
  itemId: string
  /** 회전 0 기준 칸 크기(cm). 스캔 모델을 이 안에 맞춰 줄인다. */
  width: number
  depth: number
}

/**
 * 물건 하나를 그린다. 스캔 모델(public/desk/models)이 있으면 그것을, 없으면 기본 도형 모델을 쓴다.
 * 모델 파일은 보조 데이터다 — 받는 동안이나 받지 못했을 때는 도형 모델로 자리를 지켜
 * 책상이 비거나 페이지 전체가 깨지지 않게 한다.
 */
export function ItemView({ itemId, width, depth }: ItemViewProps) {
  const url = modelUrlOf(itemId)
  const fallback = <ItemModel itemId={itemId} />
  if (!url) return fallback
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <FittedScan url={url} width={width} depth={depth} />
      </Suspense>
    </ModelErrorBoundary>
  )
}

/**
 * 모델을 칸(width×depth)에 맞춰 균일하게 줄이고 바닥 중심을 원점에 둔다.
 * 원본 단위(m·cm)와 크기가 모델마다 달라서 비율로 맞춘다 — 원본이 칸보다 작아도 칸만큼 키운다.
 */
function FittedScan({ url, width, depth }: { url: string; width: number; depth: number }) {
  // Draco는 끈다. 켜 두면 디코더를 구글 CDN에서 받는데, 우리 모델은 meshopt로만 압축했다.
  const { scene } = useGLTF(url, false, true)
  const fitted = useMemo(() => {
    // useGLTF는 같은 주소의 장면을 하나만 캐시한다. 같은 물건을 두 개 올리면 복제해야 둘 다 보인다.
    const object = scene.clone(true)
    object.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    const bounds = new Box3().setFromObject(object)
    const size = bounds.getSize(new Vector3())
    const center = bounds.getCenter(new Vector3())
    const scale = Math.min(width / size.x, depth / size.z)
    return { object, scale, offset: [-center.x, -bounds.min.y, -center.z] as const }
  }, [scene, width, depth])

  return (
    <group scale={fitted.scale}>
      <primitive object={fitted.object} position={fitted.offset} />
    </group>
  )
}

interface ModelErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, { hasFailed: boolean }> {
  state = { hasFailed: false }

  static getDerivedStateFromError() {
    return { hasFailed: true }
  }

  render() {
    return this.state.hasFailed ? this.props.fallback : this.props.children
  }
}
