/**
 * 캐러셀 화살표.
 *
 * 텍스트 글리프(‹ ›)는 48px 버튼 안에서 잉크가 5.7×20px밖에 안 나온다.
 * toss.tech는 같은 버튼에 24×24 아이콘을 넣는다.
 */
export function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M14.5 5.5L8 12l6.5 6.5' : 'M9.5 5.5L16 12l-6.5 6.5'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
