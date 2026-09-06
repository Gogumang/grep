/** 올해 글은 연도를 빼서 최신 글이 짧게 보이게 한다. */
export function formatPostDate(isoDate: string): string {
  const published = new Date(isoDate)
  const isThisYear = published.getFullYear() === new Date().getFullYear()

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: isThisYear ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(published)
}

/**
 * 글 페이지의 발행일. 목록과 달리 연도를 늘 붙인다 — 읽는 화면에서는 몇 년 글인지가
 * 글을 어떻게 받아들일지를 바꾼다(3년 전 성능 글과 지난달 글은 무게가 다르다).
 * toss.tech도 글 페이지에서는 '2026년 8월 21일'처럼 연도를 적는다.
 */
export function formatArticleDate(isoDate: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoDate))
}
