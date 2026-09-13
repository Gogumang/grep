import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/post/Pagination'
import * as explorer from '@/components/post/PostExplorer.css'
import { PAGE_SIZE } from '@/components/post/paging'
import { FacetPanel } from '@/components/sidebar/FacetPanel'
import * as sidebar from '@/components/sidebar/Sidebar.css'
import { buildCompanyFacets, formatPostDate, type Job, selectOpenJobs } from '@/shared'
import { JobList } from './JobList'

/** 글자 검색은 여기 없다 — 헤더 돋보기의 검색 모달이 채용 공고를 찾는다(searchSources의 jobSearchSource). */
export function JobExplorer({ jobs, updatedAt }: { jobs: Job[]; updatedAt: string | null }) {
  /*
    빌드 뒤에 지난 마감을 화면에서 한 번 더 거른다 — 공고가 안 바뀌면 다음 배포가 없어서
    빌드 때 걸러둔 목록이 며칠씩 그대로 나간다. 첫 렌더는 빌드 결과와 같아야 hydration이
    어긋나지 않으므로 시각은 마운트한 뒤에 정한다.
  */
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])

  const [company, setCompany] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const openJobs = useMemo(() => (now ? selectOpenJobs(jobs, now) : jobs), [jobs, now])
  const companyFacets = useMemo(() => buildCompanyFacets(openJobs), [openJobs])
  const matched = useMemo(
    () => (company ? openJobs.filter((job) => job.company === company) : openJobs),
    [openJobs, company],
  )

  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE))
  const page = Math.min(currentPage, pageCount)
  const visibleJobs = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function selectCompany(nextCompany: string | null) {
    setCompany(nextCompany)
    setCurrentPage(1)
  }

  function goToPage(nextPage: number) {
    setCurrentPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={explorer.layout}>
      <div>
        <div className={explorer.toolbar}>
          <h1 className={explorer.heading}>채용 공고</h1>
        </div>

        <div className={explorer.resultLine}>
          <span>
            개발 직군 {matched.length}건{updatedAt && ` · ${formatPostDate(updatedAt)} 갱신`}
          </span>
          {company && (
            <button type="button" className={explorer.clearButton} onClick={() => selectCompany(null)}>
              필터 지우기
            </button>
          )}
        </div>

        {matched.length === 0 ? (
          <p className={explorer.emptyState}>지금 열려 있는 공고가 없습니다.</p>
        ) : (
          <JobList jobs={visibleJobs} />
        )}

        {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onChange={goToPage} />}
      </div>

      <aside className={sidebar.sidebar}>
        {companyFacets.length > 1 && (
          <FacetPanel
            title="회사"
            rows={companyFacets.map((facet) => ({ value: facet.company, label: facet.company, count: facet.count }))}
            selected={company}
            onSelect={selectCompany}
            collapsible
          />
        )}
      </aside>
    </div>
  )
}
