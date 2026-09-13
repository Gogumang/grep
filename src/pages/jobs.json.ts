import type { APIRoute } from 'astro'
import { loadJobs } from '@/service/jobs'

/**
 * 채용 페이지의 검색 모달이 읽는 공고 목록. 빌드 때 정적 파일(/jobs.json)로 구워진다.
 * 페이지 HTML에 싣지 않고 따로 두는 이유 — 검색을 안 쓰는 방문자는 받지 않게.
 */
export const GET: APIRoute = async () => {
  const { jobs } = await loadJobs()
  return new Response(JSON.stringify(jobs), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
