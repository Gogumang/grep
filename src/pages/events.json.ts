import type { APIRoute } from 'astro'
import { loadEvents } from '@/service/events'

/**
 * 이벤트 페이지의 검색 모달이 읽는 행사 목록. 빌드 때 정적 파일(/events.json)로 구워진다.
 * 이미지는 검색 결과에 안 쓰니 뺀다.
 */
export const GET: APIRoute = async () => {
  const events = (await loadEvents()).map(({ image: _image, ...event }) => event)
  return new Response(JSON.stringify(events), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
