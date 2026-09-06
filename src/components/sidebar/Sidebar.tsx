import type { BlogFacet, CategoryFacet, TagFacet } from '@/shared'
import { FacetPanel } from './FacetPanel'
import * as styles from './Sidebar.css'

interface SidebarProps {
  blogFacets: BlogFacet[]
  categoryFacets: CategoryFacet[]
  tagFacets: TagFacet[]
  selectedBlogKey: string | null
  selectedCategory: string | null
  selectedTag: string | null
  onSelectBlog: (blogKey: string | null) => void
  onSelectCategory: (category: string | null) => void
  onSelectTag: (tag: string | null) => void
}

export function Sidebar({
  blogFacets,
  categoryFacets,
  tagFacets,
  selectedBlogKey,
  selectedCategory,
  selectedTag,
  onSelectBlog,
  onSelectCategory,
  onSelectTag,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      {categoryFacets.length > 0 && (
        <FacetPanel
          title="분류"
          rows={categoryFacets.map((facet) => ({ value: facet.category, label: facet.category, count: facet.count }))}
          selected={selectedCategory}
          onSelect={onSelectCategory}
        />
      )}

      {/* 블로그가 하나뿐이면 '전체 20 / 토스 20'만 보여주는 고를 것 없는 필터가 된다. */}
      {blogFacets.length > 1 && (
        <FacetPanel
          title="블로그"
          rows={blogFacets.map((facet) => ({ value: facet.blogKey, label: facet.blogName, count: facet.count }))}
          selected={selectedBlogKey}
          onSelect={onSelectBlog}
          collapsible
        />
      )}

      {tagFacets.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>이번 주 키워드</h2>
          <div className={styles.tagCloud}>
            {tagFacets.map((facet) => (
              <button
                key={facet.tag}
                type="button"
                className={`${styles.tagChip} ${selectedTag === facet.tag ? styles.tagChipSelected : ''}`}
                onClick={() => onSelectTag(selectedTag === facet.tag ? null : facet.tag)}
              >
                #{facet.tag}
              </button>
            ))}
          </div>
        </section>
      )}
    </aside>
  )
}
