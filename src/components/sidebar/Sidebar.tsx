import type { BlogFacet, CategoryFacet } from '@/shared'
import { FacetPanel } from './FacetPanel'
import * as styles from './Sidebar.css'

interface SidebarProps {
  blogFacets: BlogFacet[]
  categoryFacets: CategoryFacet[]
  selectedBlogKey: string | null
  selectedCategory: string | null
  onSelectBlog: (blogKey: string | null) => void
  onSelectCategory: (category: string | null) => void
}

export function Sidebar({
  blogFacets,
  categoryFacets,
  selectedBlogKey,
  selectedCategory,
  onSelectBlog,
  onSelectCategory,
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
    </aside>
  )
}
