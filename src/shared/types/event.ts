/** 개발자 행사 하나. src/events/config/events.md 표의 한 행이다. */
export interface TechEvent {
  title: string
  /** 행사 공식 페이지. 신청도 여기서 한다. */
  url: string
  host: string
  /** 한국 날짜 YYYY-MM-DD */
  startDate: string
  /** 한국 날짜 YYYY-MM-DD. 하루짜리 행사면 startDate와 같다. */
  endDate: string
  /** '온라인', '서울 강남구'처럼 표에 적힌 그대로. */
  place: string | null
  /** 한국 날짜 YYYY-MM-DD. 모르면 null. */
  registrationDeadline: string | null
  /** '무료', '유료'처럼 표에 적힌 그대로. */
  price: string | null
}
