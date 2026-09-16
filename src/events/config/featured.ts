/**
 * 이벤트 페이지에 올릴 행사. collector 가 매일 쓰는 events.json 에서 **여기 적은 행사만** 보인다.
 * 끝난 행사는 적어 둬도 알아서 빠진다.
 *
 * 이미지는 public/events/{id}.avif 에 912×512(목록 썸네일 228:128의 4배)로 구워 둔다.
 * 가능하면 주최 측 공식 사이트 이미지를 쓴다 — 티켓타코 약관 제11조가 서비스 콘텐츠 복제를 막는다.
 *
 * - if(kakao)26: if.kakao.com/2026 의 공유 이미지(og:image)
 * - 드로이드나이츠 2026: droidknights.dev 의 배너 (og:image 주소가 404라 배너를 썼다)
 * - 2026 당근 Builder Meetup: 공식 행사 페이지가 없어 티켓타코에 주최(당근)가 올린 포스터
 */
export interface FeaturedEvent {
  /** 티켓타코 행사 코드. events.json 의 id 와 같다. */
  id: string
  /** public 아래 경로. */
  image: string
}

export const FEATURED_EVENTS: FeaturedEvent[] = [
  { id: 'x0u2znh1', image: '/events/x0u2znh1.avif' },
  { id: 'lyohvjgz', image: '/events/lyohvjgz.avif' },
  { id: '2o8rdpls', image: '/events/2o8rdpls.avif' },
]
