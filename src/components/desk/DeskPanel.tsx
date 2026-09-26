import { ASSET_CREDITS } from '@/desk/assets'
import { CATEGORY_LABELS, DESK_CATALOG } from '@/desk/catalog'
import type { DeskCategory, DeskItem, DeskLayout, PlacedItem } from '@/shared/types'
import { planAddition } from '@/shared/utils/deskLayout'
import * as styles from './DeskBuilder.css'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DeskCategory[]
const ITEMS = [...DESK_CATALOG.items.values()]
const SURFACES = [...DESK_CATALOG.surfaces.values()]

interface DeskPanelProps {
  layout: DeskLayout
  selected: PlacedItem | null
  category: DeskCategory
  onCategoryChange: (category: DeskCategory) => void
  onAdd: (itemId: string) => void
  onSwap: (itemId: string) => void
  onRotate: () => void
  onRemove: () => void
  onSurfaceChange: (surfaceId: string) => void
  onCopyLink: () => void
  onSaveImage: () => void
}

/** 책상 옆 조작 패널. 상태는 없고 DeskBuilder가 넘겨준 것만 그린다. */
export function DeskPanel(props: DeskPanelProps) {
  const { layout, category, onCategoryChange, onSurfaceChange } = props
  return (
    <aside className={styles.panel} aria-label="책상 꾸미기 도구">
      <SelectedSection {...props} />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>물건 올리기</h2>
        <div className={styles.badges}>
          {CATEGORIES.map((entry) => (
            <BadgeOption
              key={entry}
              label={CATEGORY_LABELS[entry]}
              isSelected={entry === category}
              onClick={() => onCategoryChange(entry)}
            />
          ))}
        </div>
        {ITEMS.filter((item) => item.category === category).map((item) => (
          <AddRow key={item.id} item={item} layout={layout} onAdd={props.onAdd} />
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>책상</h2>
        <div className={styles.badges}>
          {SURFACES.map((surface) => (
            <BadgeOption
              key={surface.id}
              label={surface.label}
              isSelected={surface.id === layout.surfaceId}
              onClick={() => onSurfaceChange(surface.id)}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>자랑하기</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={props.onCopyLink}>
            링크 복사
          </button>
          <button type="button" className={styles.textButton} onClick={props.onSaveImage}>
            이미지로 저장
          </button>
        </div>
        <p className={styles.note}>링크에 배치가 통째로 담겨서, 받은 사람도 같은 책상을 그대로 봅니다.</p>
      </section>

      <details>
        <summary className={styles.creditsSummary}>3D 모델·재질 출처</summary>
        <ul className={styles.creditList}>
          {ASSET_CREDITS.map((credit) => (
            <li key={credit.file}>
              <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">
                {credit.title}
              </a>{' '}
              · {credit.author} · {credit.license}
            </li>
          ))}
        </ul>
      </details>
    </aside>
  )
}

function BadgeOption({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={isSelected ? styles.badgeOptionSelected : styles.badgeOption}
      aria-pressed={isSelected}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

/** 올리기 행. 분류 상한 때문에 무엇이 일어날지(바꾸기·최대 N개)를 누르기 전에 보여 준다. */
function AddRow({ item, layout, onAdd }: { item: DeskItem; layout: DeskLayout; onAdd: (itemId: string) => void }) {
  const plan = planAddition(layout, item.id, DESK_CATALOG)
  const isPlaced = layout.items.some((placed) => placed.itemId === item.id)
  const meta =
    plan.kind === 'full'
      ? `최대 ${plan.limit}개`
      : plan.kind === 'replace'
        ? isPlaced
          ? '올라가 있음'
          : '바꾸기'
        : `${item.width}×${item.depth}cm`
  return (
    <button
      type="button"
      className={styles.itemRow}
      disabled={plan.kind === 'full' || (plan.kind === 'replace' && isPlaced)}
      onClick={() => onAdd(item.id)}
    >
      <span>
        {item.icon} {item.label}
      </span>
      <span className={styles.itemMeta}>{meta}</span>
    </button>
  )
}

function SelectedSection({ selected, onSwap, onRotate, onRemove }: DeskPanelProps) {
  const item = selected ? DESK_CATALOG.items.get(selected.itemId) : undefined
  if (!selected || !item) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>선택한 물건</h2>
        <p className={styles.placeholder}>
          책상 위 물건을 누르면 여기서 다른 걸로 바꿔 볼 수 있어요. 끌어서 옮기고, 빈 곳을 끌면 시점이 돌아갑니다.
        </p>
      </section>
    )
  }

  const alternatives = ITEMS.filter((candidate) => candidate.category === item.category)
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>선택한 물건</h2>
      <p className={styles.selectedName}>
        {item.icon} {item.label}
      </p>
      <div className={styles.badges}>
        {alternatives.map((candidate) => (
          <BadgeOption
            key={candidate.id}
            label={candidate.label}
            isSelected={candidate.id === item.id}
            onClick={() => onSwap(candidate.id)}
          />
        ))}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.textButton} onClick={onRotate}>
          돌리기 (R)
        </button>
        <button type="button" className={styles.textButton} onClick={onRemove}>
          빼기 (Delete)
        </button>
      </div>
      <p className={styles.note}>방향키로 5cm씩(Shift는 20cm) 옮깁니다.</p>
    </section>
  )
}
