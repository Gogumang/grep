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
