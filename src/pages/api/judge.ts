import { getSecret } from 'astro:env/server'
import type { APIRoute } from 'astro'
import { readCollectorConfig, requestGrade } from '@/service/collectorGrading'

/**
 * 사이트에서 유일하게 서버에서 도는 라우트다. 채점은 collector가 하고 여기는 사이트 토큰을 붙여 넘기기만 한다 —
 * 토큰을 브라우저에 싣지 않으려고 이 라우트를 둔다.
 * 공개 전에 요청 수 제한을 붙인다 — 지금은 누구나 채점 서버 CPU를 쓸 수 있다.
 */
export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  // import.meta.env로 읽으면 빌드 때 값이 번들에 박힌다. 토큰은 실행 시점에 읽는다.
  const config = readCollectorConfig({
    COLLECTOR_BASE_URL: getSecret('COLLECTOR_BASE_URL'),
    COLLECTOR_SITE_TOKEN: getSecret('COLLECTOR_SITE_TOKEN'),
  })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { message: '요청 본문이 JSON이 아닙니다.' })
  }

  try {
    const { status, payload } = await requestGrade(config, body)
    return json(status, payload)
  } catch (error) {
    // collector 주소·내부 오류는 응답에 싣지 않는다.
    console.error('[judge] collector 채점 호출 실패', error)
    return json(502, { message: '채점 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요.' })
  }
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
}
