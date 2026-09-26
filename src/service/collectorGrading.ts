/**
 * 채점은 collector(grep-airflow)가 한다. 숨은 테스트와 채점 서버(go-judge)가 모두 그쪽에 있어서
 * 이 저장소(공개)에는 둘 다 없다 — 여기는 요청을 사이트 토큰과 함께 넘기고 답을 돌려줄 뿐이다.
 */

/** Kotlin·Go 컴파일(약 8초)에 숨은 케이스까지 돌아도 넉넉하고, Vercel 함수 제한(300초)보다 짧다. */
const REQUEST_TIMEOUT_MS = 90_000

export interface CollectorConfig {
  baseUrl: string
  siteToken: string
}

/** 둘 다 필수다. 빠지면 첫 요청에서 바로 실패시킨다 — 토큰 없이 collector를 부르지 않는다. */
export function readCollectorConfig(env: Record<string, string | undefined>): CollectorConfig {
  const baseUrl = env.COLLECTOR_BASE_URL
  const siteToken = env.COLLECTOR_SITE_TOKEN
  if (!baseUrl || !siteToken) {
    throw new Error(
      'COLLECTOR_BASE_URL·COLLECTOR_SITE_TOKEN 환경 변수가 필요합니다 (예: COLLECTOR_BASE_URL=https://airflow.gogumang.com/collector)',
    )
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), siteToken }
}

/**
 * 화면이 보내는 필드만 골라 넘긴다. 검증은 collector가 한다 — 두 곳에서 같은 규칙을 따로 들고 있으면
 * 한쪽만 바뀌는 날 화면과 채점이 어긋난다.
 */
export function pickGradeRequest(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null) return {}
  const { problemId, language, code, scope } = body as Record<string, unknown>
  return { problemId, language, code, scope }
}

export interface ClientResponse {
  status: number
  payload: unknown
}

/**
 * collector의 답을 화면이 읽을 모양으로 바꾼다. 화면은 성공이면 채점 결과를, 아니면 `message`만 읽는다.
 * 요청이 잘못된 경우(4xx)는 collector의 메시지를 그대로 보여 주고, 서버 쪽 문제(5xx)는 내부 사정을 싣지 않는다.
 */
export function toClientResponse(status: number, payload: unknown): ClientResponse {
  if (status >= 200 && status < 300) return { status: 200, payload }
  const message = (payload as { message?: unknown } | null)?.message
  if (status >= 400 && status < 500 && status !== 401 && status !== 403 && typeof message === 'string') {
    return { status, payload: { message } }
  }
  return { status: 502, payload: { message: '채점 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요.' } }
}

export async function requestGrade(config: CollectorConfig, body: unknown): Promise<ClientResponse> {
  const response = await fetch(`${config.baseUrl}/api/coding/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Collector-Token': config.siteToken },
    body: JSON.stringify(pickGradeRequest(body)),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const payload: unknown = await response.json().catch(() => null)
  return toClientResponse(response.status, payload)
}
