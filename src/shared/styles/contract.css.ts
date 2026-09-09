import { createThemeContract } from '@vanilla-extract/css'

/**
 * 디자인 토큰의 '계약'. 값은 여기 없고 이름만 있다.
 *
 * 라이트/다크 두 테마가 이 목록을 빠짐없이 채워야 하고, 하나라도 빠뜨리면
 * 컴파일이 실패한다 — 다크 모드에서만 색이 비는 사고를 타입으로 막는다.
 */
export const vars = createThemeContract({
  color: {
    canvas: null,
    surface: null,
    surfaceSunken: null,
    border: null,
    borderStrong: null,
    ink: null,
    inkStrong: null,
    inkSoft: null,
    inkSubtle: null,
    inkMuted: null,
    inkFaint: null,
    brand: null,
    accent: null,
    accentHover: null,
    onAccent: null,
    accentSoft: null,
  },
  space: { xs: null, sm: null, md: null, lg: null, xl: null, xxl: null, xxxl: null },
  radius: { sm: null, md: null, lg: null, xl: null, full: null },
  fontSize: { xs: null, sm: null, md: null, lg: null, xl: null, xxl: null, display: null },
  fontWeight: { regular: null, medium: null, semibold: null, bold: null },
  font: { sans: null, display: null },
})
