/**
 * 개발자 행사 하나. collector(grep-airflow)가 티켓타코·이벤터스·Meetup·Luma에서 개발 행사를, Dev-Event(개발자 행사 모음)에서 해커톤을
 * 골라 src/events/events.json 에 쓴다.
 * 행사 설명·포스터는 싣지 않는다 — 티켓타코 약관이 콘텐츠 복제를 막아 사실 정보만 옮기고, 신청은 원문에서 한다.
 * 이벤터스도 같은 기준을 따른다.
 *
 * 필드 이름은 collector 의 EventSiteJsonWriter 와의 계약이다 — 한쪽을 바꾸면 다른 쪽도 함께 고친다.
 */
export interface TechEvent {
  /** 티켓타코는 행사 코드(c9xsstcs), 이벤터스는 eventus-{번호}, Dev-Event 는 dev-event-{주소 해시 12자}, Meetup 은 meetup-{번호}, Luma 는 luma-{행사 id}. React key이자 featured.json 이 가리키는 값이다. */
  id: string
  title: string
  /** 판매처 행사 페이지(Dev-Event 는 행사 공식 사이트). 신청도 여기서 한다. */
  url: string
  host: string
  /** 한국 날짜 YYYY-MM-DD */
  startDate: string
  /** 한국 시각 HH:mm */
  startTime: string
  /** 한국 날짜 YYYY-MM-DD. 하루짜리 행사면 startDate와 같다. */
  endDate: string
  /** 장소 이름. 온라인 행사거나 원문에 없으면 null. */
  place: string | null
  isOnline: boolean
  /** 가장 싼 표(원). 원문에 가격이 없으면 null — 0(무료)과 다르다. */
  lowestPrice: number | null
  highestPrice: number | null
  /** 판매처 이름(티켓타코·이벤터스·Dev-Event·Meetup·Luma). 이 필드가 생기기 전의 파일은 티켓타코뿐이었다. */
  source: EventSource
}

export type EventSource = '티켓타코' | '이벤터스' | 'Dev-Event' | 'Meetup' | 'Luma'

/** 이벤트 페이지에 실제로 올리는 행사. 어드민에서 올린 행사에만 이미지가 붙는다(src/events/featured.json). */
export interface ListedEvent extends TechEvent {
  /** 사이트 기준 경로(/events/x.avif)나 https 전체 주소. */
  image: string
}
