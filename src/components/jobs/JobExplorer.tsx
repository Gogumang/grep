import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/post/Pagination'
import * as explorer from '@/components/post/PostExplorer.css'
import { PAGE_SIZE } from '@/components/post/paging'
import { FacetPanel } from '@/components/sidebar/FacetPanel'
import * as sidebar from '@/components/sidebar/Sidebar.css'
import {
  buildCompanyFacets,
  type CompanyFilter,
  EMPTY_COMPANY_FILTER,
  filterJobsByCompany,
  formatPostDate,
  type Job,
  selectOpenJobs,
} from '@/shared'
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

  const [filter, setFilter] = useState<CompanyFilter>(EMPTY_COMPANY_FILTER)
  const [currentPage, setCurrentPage] = useState(1)

  const openJobs = useMemo(() => (now ? selectOpenJobs(jobs, now) : jobs), [jobs, now])
  const companyFacets = useMemo(() => buildCompanyFacets(openJobs), [openJobs])
  const matched = useMemo(() => filterJobsByCompany(openJobs, filter), [openJobs, filter])

  // 모회사가 하나뿐이면 회사 패널이 숨으므로 소분류는 그 회사 기준으로 바로 보인다.
  const affiliateParent =
    companyFacets.find((facet) => facet.companyKey === filter.companyKey) ??
    (companyFacets.length === 1 ? companyFacets[0] : undefined)

  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE))
  const page = Math.min(currentPage, pageCount)
  const visibleJobs = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const isFiltered = filter.companyKey !== null || filter.company !== null

  /** 모회사를 바꾸면 계열사 선택은 풀린다 — 토스증권을 고른 채 카카오로 옮기면 결과가 비기 때문이다. */
  function selectCompanyKey(companyKey: string | null) {
    setFilter({ companyKey, company: null })
    setCurrentPage(1)
  }

  function selectAffiliate(company: string | null) {
    setFilter((previous) => ({ companyKey: affiliateParent?.companyKey ?? previous.companyKey, company }))
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
          {isFiltered && (
            <button type="button" className={explorer.clearButton} onClick={() => selectCompanyKey(null)}>
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
            rows={companyFacets.map((facet) => ({
              value: facet.companyKey,
              label: facet.companyName,
              count: facet.count,
            }))}
            selected={filter.companyKey}
            onSelect={selectCompanyKey}
            collapsible
          />
        )}

        {/* 계열사가 모회사 하나뿐이면(쿠팡·당근) '전체 99 / 쿠팡 99'만 보여주는 고를 것 없는 필터가 된다. */}
        {affiliateParent && affiliateParent.affiliates.length > 1 && (
          <FacetPanel
            title={`${affiliateParent.companyName} 계열사`}
            rows={affiliateParent.affiliates.map((facet) => ({
              value: facet.company,
              label: facet.company,
              count: facet.count,
            }))}
            selected={filter.company}
            onSelect={selectAffiliate}
            collapsible
          />
        )}
      </aside>
    </div>
  )
}
