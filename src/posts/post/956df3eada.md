[![NHN Cloud_meetup banner_designSystem_202603_rv.png](https://images.gogumang.com/956df3eada/01.png)](https://www.nhncloud.com/kr)

안녕하세요. 제로 트러스트 보안 모델을 기반으로 NHN Cloud 리소스에 안전하게 접속할 수 있도록 지원하는 [Cloud Access](https://www.nhncloud.com/kr/service/security/cloud-access)의 Windows 클라이언트를 개발하고 있는 앱서비스보안팀 정원희입니다.

Cloud Access Windows 클라이언트는 [WTL](https://wtl.sourceforge.io/)/Win32 기반 C++ 네이티브 UI로 개발되어 있습니다. 네이티브 UI는 OS 수준의 성능과 낮은 리소스 사용량, 시스템 API와의 직접적인 연동 등의 이점이 있어 보안 제품 특성에 적합하지만, 웹 프론트엔드처럼 디자인 토큰을 관리하는 성숙한 생태계가 갖춰져 있지 않아 디자인 시스템 적용에 별도의 접근이 필요했습니다.

이번 글에서는 이 문제를 해결하기 위해 Figma 디자인 가이드 PDF를 Claude Code에 전달하여 C++ 디자인 시스템 코드를 자동 생성한 경험을 공유하려고 합니다.

## 디자인 시스템이 왜 필요했나

본격적으로 들어가기 전에 디자인 시스템이 무엇인지 간단히 짚고 넘어가겠습니다. 디자인 시스템은 제품이나 서비스에서 일관된 UI/UX를 만들기 위해 색상, 타이포그래피, 컴포넌트 같은 구성 요소를 정의한 규칙 모음입니다. 웹 프론트엔드에서는 익숙한 개념이지만, C++ 네이티브 UI 개발에서는 다소 생소할 수 있습니다. 실제로 Windows C++ 개발 환경에서는 색상값, 폰트 크기 등 디자인 관련 값들을 `#define`으로 하나의 헤더 파일에 모아두는 경우가 많습니다.

디자인 시스템이 없으면 개발자가 UI를 구현할 때 매번 디자이너에게 "이 버튼 색상이 뭐였죠?"라고 물어보거나, Figma 화면을 열어서 색상값을 직접 확인해야 합니다. 개발자마다 조금씩 다르게 구현하게 되고, 나중에 디자인이 바뀌면 코드 전체를 수정해야 합니다. 아래는 디자인 시스템이 없을 때 발생할 수 있는 전형적인 사례입니다.

```cpp
// MainView.cpp
color = RGB(18, 93, 230);

// SettingsView.cpp
color = RGB(18, 92, 230);  // 오타 - 93이 아닌 92

// LoginView.cpp
color = 0xE65D12;          // BGR 순서로 작성
```

각 소스 파일에서 같은 색상을 개별적으로 정의하면 불일치와 오타가 발생하기 쉽습니다. 디자인 시스템이 코드로 정의되어 있으면 한 곳에서 정의하고 전체에서 참조하므로 이런 문제가 해결됩니다.

```cpp
// 모든 곳에서 동일하게
color = primary::_7;  // #125DE6
```

"Accent 버튼 스타일로 적용해 주세요."라는 요청이 오면 `ApplyAccent()` 한 줄이면 되고, 색상이 바뀌더라도 토큰값만 수정하면 전체 앱에 반영됩니다. 디자이너와 개발자 사이의 커뮤니케이션도 훨씬 단순해집니다.

참고로 저희가 따르고 있는 디자인 시스템은 NHN Cloud Console 디자인 시스템으로, Figma에서 관리되고 있습니다.

### 디자인 토큰의 계층 구조

디자인 시스템에서 핵심이 되는 개념이 디자인 토큰입니다. 토큰은 보통 세 단계로 나뉩니다.

![CC_designsystem_1_900.png](https://images.gogumang.com/956df3eada/02.png)

**프리미티브 토큰** 은 `#125DE6` 같은 색상값 자체이고, **시맨틱 토큰** 은 그 색상이 어디에 쓰이는지를 정의하며, **컴포넌트 프리셋**은 버튼 하나에 필요한 스타일을 한 번에 적용하는 역할입니다. 이렇게 계층을 나누면 Accent 버튼 색상이 변경되더라도 프리미티브 토큰 하나만 수정하면 나머지에 자동으로 반영됩니다.

## 수작업의 한계

문제는 이 토큰들을 코드로 옮기는 과정이었습니다.

Figma에 정의된 색상값을 하나씩 확인하고 직접 코드로 옮겨야 했으며, 이 과정에서 오류가 발생하기 쉬웠습니다. 실제로 코드베이스에는 개발자마다 같은 색상을 다르게 정의한 경우가 존재했습니다.

```cpp
#define COLOR_ACCENT RGB(0x12, 0x5D, 0xE6)
#define BLUE_BTN_BG RGB(18, 93, 230)
const COLORREF accent = 0xE65D12; // BGR 순서 혼동
```

같은 색상임에도 이름이 다르고, 표기 방식이 다르고, 심지어 RGB와 BGR이 혼재하는 경우도 있었습니다. Win32 API의 `COLORREF`는 내부적으로 BGR 순서를 사용하기 때문에 이런 혼동이 종종 발생합니다. 토큰 수가 상당하므로 수작업으로 옮기는 과정에서 이런 실수가 생기는 것은 불가피한 일이었습니다.

디자인 변경이 있을 때도 문제였습니다. Figma에서 색상이 바뀌면 코드를 일일이 찾아서 수정해야 했고, 어디를 빠뜨렸는지 확인하기도 어려웠습니다.

## PDF를 선택한 이유

이 문제를 해결하려고 몇 가지 방법을 검토했습니다.

가장 먼저 떠오르는 것은 Figma API를 직접 연동하는 방법이었으나, 저희 개발팀에는 Figma Dev Seat이나 Full Seat이 없었습니다. Figma에서 공식 MCP 서버를 제공하기는 하지만, Dev Seat 이상이 있어야 제대로 사용할 수 있고, View Seat의 경우 API call 횟수에 제한이 있는 등 실질적으로 활용하기 어려운 상황이었습니다.

저희는 이미 디자인 부서로부터 디자인 가이드와 디자인 시스템을 Figma로 전달받아 협업하고 있었습니다. 이 가이드에는 색상 코드, 토큰 이름, 폰트 사이즈 같은 정보가 테이블 형태로 잘 정리되어 있었고, Figma에서 PDF로 export할 수 있었습니다.

![CC_designsystem_2.png](https://images.gogumang.com/956df3eada/03.png)

[Claude Code가 PDF를 읽고 분석할 수 있다는 점](https://platform.claude.com/docs/ko/build-with-claude/pdf-support)에 착안하여, 이 PDF를 Claude Code에 전달하는 방식을 선택했습니다.

이 방식의 가장 큰 장점은 진입 장벽이 낮다는 것입니다. Figma에서 PDF export만 하면 되므로 개발자 모드 권한이나 별도의 도구 설치가 필요 없고, 누구나 바로 사용할 수 있습니다.

한 가지 유의할 점이 있습니다. Claude Code는 PDF를 페이지 단위로 렌더링된 이미지와 추출된 텍스트를 함께 활용하여 분석합니다. 따라서 디자인 가이드 PDF에 색상 코드(`#125DE6`), 토큰 이름(`primary.7`), 폰트 사이즈 등의 정보가 **이미지가 아닌 텍스트 형태**로 포함되어 있어야 정확한 추출이 가능합니다. NHN Cloud Console 디자인 시스템 가이드의 경우 이러한 정보가 테이블 형태의 텍스트로 정리되어 있었기 때문에 Claude Code가 높은 정확도로 파싱할 수 있었습니다.

## Claude Code에 맡기기

Figma에서 Color, Typography, Button 가이드 페이지를 각각 PDF로 export한 뒤, Claude Code에 이렇게 요청했습니다.
> "Docs/design-system의 PDF들을 분석해서 C++ 디자인 시스템 코드를 만들어줘. namespace는 `cloudaccess::design`, NHN Cloud Console 디자인 시스템 토큰과 매핑해줘."

Claude Code는 PDF 세 개를 순서대로 분석하기 시작했습니다. Color.pdf에서 색상 토큰을, Typography.pdf에서 weight와 size를, Button.pdf에서 버튼 타입과 상태별 스타일을 추출했습니다. 그리고 이 정보를 바탕으로 C++ 코드를 생성하고, 사용 가이드 문서까지 자동으로 생성했습니다.

생성된 파일 구조는 아래와 같았습니다.

```
design/
├── DesignTokens.h      // 원시 색상 토큰
├── SemanticTokens.h    // 용도별 시맨틱 토큰
├── Typography.h        // 타이포그래피
├── ButtonStyles.h      // 버튼 프리셋
└── DesignSystem.h      // 통합 헤더
```

색상 토큰, 시맨틱 토큰, 타이포그래피, 버튼 프리셋을 포함한 전체 코드와 문서가 단시간 내에 생성되었습니다. 수작업이었다면 Figma 화면에서 색상값을 일일이 확인하고 코드로 옮기는 데 상당한 시간이 소요되었을 것입니다.

## 생성된 코드 살펴보기

생성된 코드 중 일부를 발췌하여 살펴보겠습니다.

### 원시 색상 토큰(DesignTokens.h)

PDF Color 가이드에서 추출한 모든 색상값이 `constexpr`로 정의되어 있습니다. 컴파일 타임에 확정되므로 런타임 오버헤드가 없고, 값이 잘못되면 컴파일 단계에서 검출할 수 있습니다.

```cpp
namespace primary {
    inline constexpr COLORREF _1 = RGB(0xE9, 0xF1, 0xFF);  // #E9F1FF - Select/Hover/Table
    inline constexpr COLORREF _2 = RGB(0xC8, 0xDC, 0xFF);  // #C8DCFF - Progressbar bg
    inline constexpr COLORREF _7 = RGB(0x12, 0x5D, 0xE6);  // #125DE6 - Accent Button/Link
    inline constexpr COLORREF _8 = RGB(0x14, 0x46, 0xC8);  // #1446C8 - Accent Button Hover
}

namespace neutral {
    inline constexpr COLORREF _0   = RGB(0xFF, 0xFF, 0xFF);  // #FFFFFF - White
    inline constexpr COLORREF _1   = RGB(0xF9, 0xF9, 0xF9);  // #F9F9F9 - Bg/Button hover
    inline constexpr COLORREF _5   = RGB(0xDD, 0xDD, 0xDD);  // #DDDDDD - Border/Divider
    inline constexpr COLORREF _9   = RGB(0x77, 0x77, 0x77);  // #777777 - Secondary text
    inline constexpr COLORREF _100 = RGB(0x22, 0x22, 0x22);  // #222222 - Title text
}
```

여기서 눈여겨볼 점은 네이밍입니다. Figma에서 `color.primary.7`로 정의된 토큰이 C++ 코드에서는 `primary::_7`로 매핑됩니다. NHN Cloud Console 디자인 시스템의 네이밍 규칙을 거의 그대로 유지한 덕분에 나중에 Figma에서 디자인이 변경되더라도 어떤 토큰을 수정해야 하는지 바로 찾을 수 있습니다.

다음은 Figma 토큰이 C++ 코드로 어떻게 1:1 매핑되는지를 보여주는 예시입니다.

| Figma (NHN Cloud Console 디자인 시스템) |    PDF 표기     |            C++ 코드             |
|-----------------------------------|---------------|-------------------------------|
| color.primary.7                   | #125DE6       | `primary::_7`                 |
| color.neutral.100                 | #222222       | `neutral::_100`               |
| Accent Button                     | bg: primary.7 | `ButtonStyles::ApplyAccent()` |
| Body SM Medium                    | 13px, 500     | `typography::BodySmMedium()`  |

디자이너가 "primary.7을 사용해 주세요."라고 전달하면, 개발자는 코드에서 `primary::_7`을 그대로 사용하면 됩니다. 디자인과 코드가 동일한 체계를 공유하므로 커뮤니케이션 비용이 줄어듭니다.

### 시맨틱 토큰(SemanticTokens.h)

원시 토큰을 직접 사용하기보다는 용도에 맞는 의미를 부여한 시맨틱 토큰을 사용하도록 구성했습니다. 이렇게 하면 해당 색상이 어디에 사용되는지 코드만으로 파악할 수 있습니다.

```cpp
namespace text {
    inline constexpr COLORREF primary     = neutral::_100;  // #222222 - Main text
    inline constexpr COLORREF secondary   = neutral::_9;    // #777777 - Secondary text
    inline constexpr COLORREF link        = primary::_7;    // #125DE6 - Link text
    inline constexpr COLORREF error       = negative::_3;   // #DA1E28 - Error text
}

namespace button::accent {
    inline constexpr COLORREF background      = primary::_7;   // #125DE6
    inline constexpr COLORREF hoverBackground = primary::_8;   // #1446C8
    inline constexpr COLORREF textColor       = neutral::_0;   // #FFFFFF

    // Disabled state (40% opacity - blended with white)
    inline constexpr COLORREF disabledBackground =
        BlendWithWhite(0x12, 0x5D, 0xE6, 0.4f);
}
```

디자인 가이드에서 비활성(disabled) 버튼은 배경색의 opacity를 40%로 낮추도록 정의되어 있는데, Claude Code가 이를 인식하고 흰색과의 블렌딩 계산 코드까지 자동으로 생성한 점이 주목할 만합니다.

### 타이포그래피(Typography.h)

PDF Typography 가이드에서 추출한 폰트 크기, Weight, Line Height도 체계적으로 정의되었습니다.

```cpp
namespace sizePx {
    inline constexpr int heading_lg  = 16;   // Modal title
    inline constexpr int body_sm     = 13;   // Button S/M, general text
    inline constexpr int caption_md  = 12;   // Footer, Tooltip
}

namespace weight {
    inline constexpr DWORD regular   = 400;  // FW_NORMAL
    inline constexpr DWORD medium    = 500;
    inline constexpr DWORD bold      = 700;  // FW_BOLD
}

struct TextStyle {
    int sizePx;
    DWORD weight;
    int lineHeightPx;
};
```

## 실제로 얻은 것

가장 직접적인 효과는 시간 절약과 정확성이었습니다. PDF 분석부터 코드 생성까지 단시간에 완료되었으며, 사람이 다수의 색상값을 하나씩 옮길 때 발생하기 쉬운 오타나 RGB/BGR 혼동 같은 실수 없이 NHN Cloud Console 디자인 시스템의 네이밍 규칙이 일관되게 유지되었습니다.

코드 품질 면에서도 `constexpr` 키워드를 활용한 컴파일 타임 오류 검출, 새로 합류한 개발자에게 "이 함수만 사용하면 됩니다"라고 안내할 수 있는 온보딩 편의성 등의 부수적인 이점도 얻을 수 있었습니다. 디자인 시스템이 업데이트될 경우에도 PDF를 다시 export하여 Claude Code에 전달하면 동일한 과정을 반복할 수 있으므로 유지보수 부담도 낮습니다.

## 마치며

핵심은 단순합니다. Figma API 연동이나 복잡한 파싱 코드 없이, PDF로 export한 디자인 가이드를 Claude Code가 직접 읽고 분석하여 코드로 변환할 수 있다는 것입니다.

![CC_designsystem_3_900.png](https://images.gogumang.com/956df3eada/04.png)

Claude Code가 PDF 내 텍스트와 테이블 데이터를 파싱할 수 있다는 점이 이 워크플로우를 가능하게 한 핵심이었습니다. 같은 방식으로 아이콘 가이드 PDF에서 아이콘 상수를 추출하거나, 스페이싱 가이드에서 레이아웃 상수를 생성하거나, 컴포넌트 스펙에서 UI 기본 설정을 만드는 등 다양한 디자인 문서에도 적용할 수 있습니다.

기술적으로 복잡하거나 대단한 작업은 아닙니다. PDF를 읽어서 코드로 변환하는, 어찌 보면 단순한 작업입니다. 그러나 "AI 도구에 PDF를 전달하면 코드를 생성할 수 있지 않을까?"라는 작은 아이디어 하나가 실무의 생산성을 실질적으로 향상시켰습니다.

**AI 코딩 도구의 활용에 반드시 고도화된 기술이 수반되어야 하는 것은 아닙니다. 일상적인 업무에서 반복되는 수작업을 발견하고 이를 자동화하려는 시도만으로도 충분한 가치를 만들어낼 수 있다고 생각합니다.**

웹뿐만 아니라 네이티브 환경에서 디자인 시스템을 적용해야 하는 분들, 혹은 반복적인 수작업을 자동화할 방법을 고민하고 계신 분들에게 이 경험이 참고가 되기를 바랍니다.

긴 글 읽어주셔서 감사합니다. 😀

### 참고 자료

* [Windows Template Library](https://wtl.sourceforge.io/)
* [NHN Cloud, Cloud Access](https://www.nhncloud.com/kr/service/security/cloud-access)
* [Claude API Docs, 모델 기능-PDF 지원](https://platform.claude.com/docs/ko/build-with-claude/pdf-support)

[![NHN Cloud_meetup banner_footer_blue_202509.png](https://images.gogumang.com/956df3eada/05.png)](https://www.nhncloud.com/kr)