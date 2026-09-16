/**
 * 개발자 행사 하나. collector(grep-airflow)가 티켓타코에서 개발 행사만 골라 src/events/events.json 에 쓴다.
 * 행사 설명·포스터는 싣지 않는다 — 티켓타코 약관이 콘텐츠 복제를 막아 사실 정보만 옮기고, 신청은 원문에서 한다.
 *
 * 필드 이름은 collector 의 EventSiteJsonWriter 와의 계약이다 — 한쪽을 바꾸면 다른 쪽도 함께 고친다.
 */
export interface TechEvent {
  /** 티켓타코 행사 코드. React key다. */
  id: string
  title: string
  /** 티켓타코 행사 페이지. 신청도 여기서 한다. */
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
}

/** 이벤트 페이지에 실제로 올리는 행사. 손으로 고른 행사에만 이미지가 붙는다(src/events/config/featured.ts). */
export interface ListedEvent extends TechEvent {
  /** public 아래 이미지 경로. */
  image: string
}
