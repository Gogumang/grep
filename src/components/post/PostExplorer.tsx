import { useMemo, useState } from 'react'
import { PostList } from '@/components/post/PostList'
import { Sidebar } from '@/components/sidebar/Sidebar'
import {
  buildBlogFacets,
  buildCategoryFacets,
  buildTagFacets,
  EMPTY_FILTER,
  filterPosts,
  type Post,
  type PostFilter,
} from '@/shared'
import { Pagination } from './Pagination'
import * as styles from './PostExplorer.css'
import { PAGE_SIZE } from './paging'

export function PostExplorer({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState<PostFilter>(EMPTY_FILTER)
  const [currentPage, setCurrentPage] = useState(1)

  const blogFacets = useMemo(() => buildBlogFacets(posts), [posts])
  const categoryFacets = useMemo(() => buildCategoryFacets(posts), [posts])
  const tagFacets = useMemo(() => buildTagFacets(posts), [posts])
  const matched = useMemo(() => filterPosts(posts, filter), [posts, filter])

  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE))
  const page = Math.min(currentPage, pageCount)
  const visiblePosts = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const isFiltered = filter.blogKey !== null || filter.tag !== null || filter.category !== null

  /** 필터가 바뀌면 1페이지부터 다시 본다 — 5페이지에 머문 채 결과가 바뀌면 혼란스럽다. */
  function updateFilter(changes: Partial<PostFilter>) {
    setFilter((previous) => ({ ...previous, ...changes }))
    setCurrentPage(1)
  }

  function goToPage(nextPage: number) {
    setCurrentPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.layout}>
      <div>
        <div className={styles.toolbar}>
          <h1 className={styles.heading}>전체 글</h1>
        </div>

        <div className={styles.resultLine}>
          {isFiltered && (
            <button type="button" className={styles.clearButton} onClick={() => updateFilter(EMPTY_FILTER)}>
              필터 지우기
            </button>
          )}
        </div>

        {matched.length === 0 ? (
          <p className={styles.emptyState}>조건에 맞는 글이 없습니다. 검색어를 줄이거나 필터를 지워보세요.</p>
        ) : (
          <PostList posts={visiblePosts} />
        )}

        {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onChange={goToPage} />}
      </div>

      <Sidebar
        blogFacets={blogFacets}
        categoryFacets={categoryFacets}
        tagFacets={tagFacets}
        selectedBlogKey={filter.blogKey}
        selectedCategory={filter.category}
        selectedTag={filter.tag}
        onSelectBlog={(blogKey) => updateFilter({ blogKey })}
        onSelectCategory={(category) => updateFilter({ category })}
        onSelectTag={(tag) => updateFilter({ tag })}
      />
    </div>
  )
}
