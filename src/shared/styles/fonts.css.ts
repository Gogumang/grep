import { globalFontFace } from '@vanilla-extract/css'

/**
 * 여기어때 잘난체 2 (https://gccompany.co.kr/font).
 * 폰트 안의 라이선스 항목이 수정·재배포를 허용한다 — 라틴 95자만 남긴 서브셋을 직접 싣는다.
 * 원본은 한글 11,172자까지 들어 2.7MB다. 우리가 이 폰트로 그리는 건 워드마크 넉 자뿐이라
 * ASCII(U+0020-007E)만 잘라 7KB로 만들었다. 다시 만들려면:
 *   pyftsubset Jalnan2.otf --unicodes="U+0020-007E" --layout-features="" \
 *     --no-hinting --desubroutinize --flavor=woff2 --output-file=jalnan2-latin.woff2
 *
 * unicode-range를 적어 두면 브라우저가 한글만 있는 화면에서는 아예 받지 않는다.
 * 라틴만 든 서브셋이라 범위를 넘겨도 그릴 글자가 없다 — 범위를 명시해 헛된 요청을 막는다.
 */
globalFontFace('Jalnan2', {
  src: 'url("/fonts/jalnan2-latin.woff2") format("woff2")',
  fontWeight: 400,
  fontStyle: 'normal',
  /* 워드마크는 첫 화면 맨 왼쪽이다 — 폰트를 기다리며 비어 있는 것보다 대체 글꼴로 먼저 뜨는 게 낫다. */
  fontDisplay: 'swap',
  unicodeRange: 'U+0020-007E',
})
