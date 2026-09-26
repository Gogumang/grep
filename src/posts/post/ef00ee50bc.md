[![NHN Cloud_meetup banner_fontAlign_202511.png](https://images.gogumang.com/ef00ee50bc/01.png)](https://www.nhncloud.com/kr)

혹시 어떤 요소에 넣은 텍스트를 예쁘게 보이려 수직 중앙 정렬 스타일을 적용했는데 조금 치우쳐 보였던 경험이 있으신가요? 화면을 보다 보니 다양한 텍스트들이 조금 삐뚤빼뚤해 보였던 적이 있으신가요? 혹시 아래 문장도 조금 치우쳐져 보이시나요? 🤔

그렇다면 이건 기분 탓이 아니라 진짜 치우쳐 표시되기 때문입니다.

폰트 메트릭, 브라우저 렌더링, 픽셀 밀도의 상호작용이 만들어 내는 미묘한 차이 때문이죠. 이번 글에서는 폰트가 왜 그렇게 보이는지, 그리고 우리가 어떻게 좀 더 자연스럽게 정렬을 맞춰줄 수 있는지 함께 알아봅니다.

## [여기](https://codepen.io/jajugoguma/full/LEVEyEm) 알파벳 대문자 M이 있습니다.

> 대문자 M을 선택한 이유는 폰트 디자인에서 M이 대문자 기준 높이(Cap height)를 측정할 때 사용되는 대표적인 문자이기 때문입니다. M은 위아래 경계가 명확한 직선으로 이루어져 있어 높이 측정이 용이하고, 상하 정렬 상태를 명확히 관찰할 수 있습니다. 또한 대부분의 폰트에서 M은 일관된 특성을 보여 폰트 간 비교에도 적합합니다.

![text1.png](https://images.gogumang.com/ef00ee50bc/02.png)
> 위 이미지는 `devicePixelRatio`가 2인 화면(2x 스케일링), Chrome 136에서 캡처된 이미지로, 다른 환경에서는 다르게 표시될 수 있습니다.

위 이미지는 `font-family: Pretendard, font-size: 50px`이 적용된 알파벳 대문자 `M`이 화면에 표시되는 실제 크기를 측정한 이미지입니다. `font-size`로 설정한 값(`50px`)과 달리 `59.5px`의 높이를 갖는 것을 확인할 수 있습니다. 내가 지정한 크기로 표시되지 않는다니, 잘못 표시되는 것일까요?

결론부터 말씀드리자면, 아닙니다. 이것은 폰트와 `font-size`, 그리고 브라우저가 이렇게 나타나도록 만들어져 있기 때문입니다.

## 폰트는 어떻게 만들어져 있을까?

폰트는 수학적으로 정의된 **좌표 공간** 안에서 만들어집니다. 이 공간 안에서 문자들의 상대적 크기, 간격, 기준선 등(메트릭)이 정해지며, **글자 모양과 메트릭이 결합되어 렌더링**됩니다.

즉, 폰트의 모양과 메트릭을 결정짓기 전에 폰트가 만들어질 좌표 공간을 정해야 하고 이를 **Em-square** 라고 합니다. 그리고 이 사각형의 크기를 **EM 크기**라고 합니다. EM 크기는 상대적 단위의 크기로 일반적으로 1000 또는 2048 단위로 설정됩니다.

좌표 공간을 지정했으면 폰트 메트릭을 결정할 차례입니다. 폰트 메트릭은 **폰트 모양이 좌표 내에 어디에 표시될지**를 결정하는 아주 중요한 지표입니다. 메트릭이 없으면 글자가 좌표 공간 내에서 멋대로 배치되어 글자가 삐뚤빼뚤하게 표시될 수 있습니다. 아래는 주요 폰트 메트릭에 대한 설명과 이해를 돕기 위한 그림입니다.

![text2.png](https://images.gogumang.com/ef00ee50bc/03.png)

|       요소       |                              설명                              |
|----------------|--------------------------------------------------------------|
| **EM Square**  | 글꼴의 모든 문자가 설계되는 가상의 좌표 공간 모든 글자는 이 가상의 정사각형 안에서 상대 좌표로 설계된다. |
| **Baseline**   | 글자가 놓이는 기준 선                                                 |
| **x-height**   | 소문자 ‘x’의 높이(소문자 기준 높이)                                       |
| **Cap height** | 대문자 기준 높이(‘M’, ‘H’ 등)                                        |
| **Ascender**   | ‘b’, ‘d’, ‘k’처럼 위로 튀어나온 부분의 최대 높이                            |
| **Descender**  | ‘g’, ‘p’, ‘y’처럼 아래로 내려가는 부분의 깊이                              |

즉, 폰트의 모든 글자는 Baseline을 기준으로 Descender 만큼 아래로 나타날 수 있고, Ascender 만큼 위로 나타날 수 있습니다. 또한 EM 크기는 기준이 되는 상대적 단위의 크기이므로 Ascender와 Descender의 합이 EM 크기보다 작거나 클 수 있습니다.

이제 폰트 메트릭까지 설정했으니, 폰트의 각 글자의 모양만 만들면 폰트가 만들어집니다. 아래는 예제에서 사용한 폰트 Pretendard의 메트릭 정보입니다.

![text3.png](https://images.gogumang.com/ef00ee50bc/04.png)

## 그래서 폰트 크기는 어떻게 결정되는데?

앞서 우리가 `font-size`로 설정한 값이 실제 폰트 크기로 설정되지 않는 이유 중 하나는 `font-size`가 이렇게 나타나도록 만들어져 있기 때문이라고 했습니다. 이에 대해 결론부터 말하자면 `font-size`는 폰트의 문자 그 자체의 높이가 아닌 **폰트의 `em-square`의 크기를 결정** 짓는 속성입니다.[^🔗^](https://www.w3.org/TR/CSS2/fonts.html#font-size-props)

이제 Pretendard 폰트가 `font-size`값에 따라 크기가 어떻게 결정되는지 알아봅시다. Pretendard 폰트는 2048 단위의 EM 크기에서 1949(Ascender)+494(Descender) 단위를 사용합니다. 이는 EM 크기가 `2048px`로 결정되면 폰트의 크기는 `2443(=1949+494)px`이 된다는 의미입니다.[^🔗^](https://iamvdo.me/en/blog/css-font-metrics-line-height-and-vertical-align?utm_source=CSS-Weekly&utm_campaign=Issue-253&utm_medium=web)

그러면 예제의 높이를 계산해 볼까요? `font-size: 50px`이라는 뜻은 EM 크기가 `50px`로 결정되었다는 뜻이고, 이에 따라 폰트의 크기는 `59.5(≈ 2443 / 2048 * 50)px`(2x 스케일링으로 `0.5px`까지 표현 가능)로 계산됩니다. 이 값은 예제가 갖는 값과 동일하다는 것을 알 수 있습니다.

이제 우리는 메트릭 정보와 `font-size`를 이용해 실제로 폰트가 몇 픽셀로 나타날지 계산할 수 있습니다!

```
폰트 크기 = (${Ascender} + ${Descender}) / ${EM 크기} \* ${font-size}
```

## 내가 궁금한 건 폰트가 왜 치우치냐예요.

지금까지 폰트가 왜 치우쳐 나타나는지 알기 위해 폰트의 크기가 어떻게 결정되는지를 알아봤습니다. 폰트가 치우치는 것은 이렇게 결정된 폰트 크기 내에 문자가 어떻게 배치되는지에 따라 결정되는 것입니다. 우리는 폰트 메트릭에서 문자가 놓일 기준선과 문자의 기준 높이, 그리고 위/아래 최대 높이를 알 수 있었습니다. 이를 활용하면 문자가 위/아래에 얼마 만큼의 여백을 두고 나타날지(수직으로 어디에 정렬될지) 알 수 있습니다.

먼저 글자의 높이와 여백을 쉽게 측정하기 위해 예제의 `font-size`를 `51px`로 조정해서 폰트의 크기가 정수(`61px`)로 결정되도록 조정하겠습니다.[^🔗^](https://codepen.io/jajugoguma/full/OPVPqax)

![text4.png](https://images.gogumang.com/ef00ee50bc/05.png)

이제 대문자 M의 크기와 위/아래 여백의 크기를 계산해 봅시다. 앞서 수식에서 `(${Ascender} + ${Descender})`을 계산하고자 하는 메트릭 값으로 치환하면 원하는 계산 결과를 얻을 수 있습니다.

```js
// 대문자 M의 크기 ≈ ${Cap height} / ${EM 크기} * ${font-size}
1448 / 2048 * 51 = 36.05859375(px)
// 아래 여백의 크기 ≈ ${Descender} / ${EM 크기} * ${font-size}
494 / 2048 * 51 = 12.30175781(px)
// 위 여백의 크기 ≈(${Ascender} - ${Cap height}) / ${EM 크기} _ ${font-size}
(1949 - 1448) / 2048 _ 51 = 12.47607422(px)
```

아래는 실제 화면에 나타나는 대문자 M의 크기과 위/아래 여백의 크기를 확인할 수 있는 그림입니다.(2x 환경의 `pt` 단위는 스케일링된 픽셀 크기입니다.)

|                                         Chrome                                         |                                         Chrome(2x)                                         |                                         Safari                                         |                                        Safari(2x)                                        |                                         FireFox                                          |                                        Firefox(2x)                                         |
|----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| ![text5_chrome.png](https://images.gogumang.com/ef00ee50bc/06.png) | ![text5_chrome2x.png](https://images.gogumang.com/ef00ee50bc/07.png) | ![text5_safari.png](https://images.gogumang.com/ef00ee50bc/08.png) | ![text5_safari2.png](https://images.gogumang.com/ef00ee50bc/09.png) | ![text5_firefox.png](https://images.gogumang.com/ef00ee50bc/10.png) | ![text5_firefox2.png](https://images.gogumang.com/ef00ee50bc/11.png) |

위 그림에 따라 세 브라우저 모두 환경 무관하게 폰트 크기가 `61px`, 대문자 M의 크기는 1x 환경에서 `37px`, 2x 환경에서 `36.5px`로 동일하게 계산된 것을 볼 수 있습니다. 그러나 브라우저마다 각 환경에 따른 위/아래 여백 계산 결과에 차이를 보여 동일한 폰트에 동일한 문자라 할지라도 환경에 따라 텍스트가 시각적으로 중앙에 정렬되어 보일 수도, 그렇지 않을 수도 있음을 알 수 있습니다.

이번 예제는 그래도 폰트의 크기도, 대문자 M의 크기도 홀수로 계산되고 위/아래 여백으로 사용될 너비가 짝수여서 어떻게든 중앙에 나타날 수 있는 형태였습니다. 하지만, 위/아래 여백으로 사용될 너비가 홀수라면 어떻게 될까요?

이번에는 `font-size`를 `11px`로 설정해서 폰트 크기는 홀수(`13px`), 대문자 M의 크기는 짝수(`8px`)로 나타내 보도록 하겠습니다.[^🔗^](https://codepen.io/jajugoguma/full/azOOKEE) 먼저, 변경된 값과 폰트 메트릭에 따른 크기를 다시 계산해 봅시다.

```js
// 대문자 M의 크기 ≈ ${Cap height} / ${EM 크기} * ${font-size}
1448 / 2048 * 11 = 7.77734375(px)
// 아래 여백의 크기 ≈ ${Descender} / ${EM 크기} * ${font-size}
494 / 2048 * 11 = 2.65332031(px)
// 위 여백의 크기 ≈(${Ascender} - ${Cap height}) / ${EM 크기} _ ${font-size}
(1949 - 1448) / 2048 _ 11 = 2.69091797(px)
```

|                                         Chrome                                         |                                        Chrome(2x)                                        |
|----------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| ![text6_chrome.png](https://images.gogumang.com/ef00ee50bc/12.png) | ![text6_chrome2.png](https://images.gogumang.com/ef00ee50bc/13.png) |
| ![text7_chrome.png](https://images.gogumang.com/ef00ee50bc/14.png) | ![text7_chrome2.png](https://images.gogumang.com/ef00ee50bc/15.png) |

대문자 M의 크기가 짝수(`8px`)로 결정됨에 따라 위/아래 여백으로 사용 가능한 크기가 홀수(`5px`)로 결정됩니다. 그러나 2x 환경에서는 `.5px`까지 렌더링할 수 있어서 중앙 정렬이 잘 되어 보이지만, 1x 환경에서는 픽셀을 반으로 나누는 게 불가능해 한 쪽으로 `1px` 치우쳐 보일 수밖에 없습니다.

지금까지 확인한 바와 같이 텍스트는 텍스트를 보는 환경에 따라 폰트 크기 내에서 수직 중앙 정렬이 될 수도, 아닐 수도 있다는 사실을 알았습니다. 다양한 CSS 수직 정렬 속성(`vertical-align`, `align-items`, `justify-content` 등)은 폰트 크기 내 텍스트를 정렬하는 것이 아니고 일정한 기준에 따라 폰트 자체의 위치를 조정하는 것으로 앞서 설명 드렸던 **치우쳐 보이는 이유**에서 벗어날 수 없습니다. 따라서 이것이 진정 수직 중앙 정렬한 텍스트가 치우쳐 보이는 이유입니다.

## 우리는 아무것도 할 수 없나요?

텍스트는 환경에 따라 정렬되어 보인다는 점이 다르다 해도 작게는 0.5px에서 크게는 2px 정도 치우쳐 보이게 됩니다. 이 정도 차이가 일반적으로 큰 문제를 일으키지는 않지만, 이 차이가 굉장히 중요한 문제를 일으키는 때가 있을 수 있습니다. 그러면 우리는 아무것도 할 수 없는 것 일까요?

꼭 그렇지만은 않습니다. **보편적인 환경에 대해 모든 문제를 해결하는 것은 어렵지만, 필요한 때에 필요한 곳에서는 제한적으로 대응할 수 있습니다.**

### **실용적인 대응 방법**

1. **CSS transform 활용하기** [^🔗^](https://codepen.io/jajugoguma/pen/OPVVwgR?editors=1100) 텍스트가 시각적으로 정확히 중앙에 보이도록 미세하게 조정이 필요한 경우 `transform` 속성을 사용하여 텍스트 위치를 조정할 수 있습니다.

   ```css
   .vertically-centered-text {
   display: flex;
   align-items: center;
   transform: translateY(-0.5px); /_ 상황에 따라 값 조정 _/
   }
   ```

2. **폰트별 보정 값 적용하기** [^🔗^](https://codepen.io/jajugoguma/pen/WbvvKzZ?editors=1400) 특정 폰트와 크기에서 반복적으로 발생하는 정렬 문제가 있다면, 해당 조합에 대한 보정 값을 미리 계산하여 적용할 수 있습니다.

   ```css
   .apple-sd-gothic-neo {
   font-family: 'Apple SD Gothic Neo';
   transform: translateY(-1.5px);
   }

   .segoe-ui {
   font-family: SegoeUI;
   transform: translateY(-3px);
   }
   ```

3. **텍스트 대신 아이콘이나 SVG 사용하기** 정확한 수직 정렬이 매우 중요한 UI 요소(예: 버튼의 아이콘)의 경우, 텍스트 대신 SVG나 아이콘 폰트를 사용하면 더 정확한 배치가 가능합니다.

4. **텍스트 박스에 패딩/마진 추가하기** [^🔗^](https://codepen.io/jajugoguma/pen/pvJJZQK?editors=1400%3C/sup%3E) 텍스트를 담은 요소에 적절한 패딩/마진을 추가하면 미세한 정렬 차이를 눈에 덜 띄게 할 수 있습니다.

   ```css
   /_ margin을 이용한 정렬 보정 _/
   .align-with-margin {
   margin-top: -3px;
   }

   /_ padding을 이용한 정렬 보정 _/
   .align-with-padding {
   padding-bottom: 3px;
   }
   ```

5. **브라우저 환경 감지 및 조건부 스타일 적용하기** [^🔗^](https://codepen.io/jajugoguma/pen/EajjpJB) 특정 브라우저나 픽셀 밀도에 따라 다른 보정 값을 적용할 수 있습니다.

   ```js
   // 브라우저와 픽셀 밀도에 따른 보정 클래스 추가
   const element = document.querySelector('.text');

   if (navigator.userAgent.includes('Chrome')) {
   element.classList.add('chrome-adjustment');
   } else if (navigator.userAgent.includes('Safari')) {
   element.classList.add('safari-adjustment');
   } else if (navigator.userAgent.includes('Firefox')) {
   element.classList.add('firefox-adjustment');
   }

   element.classList.add(`pixelratio-${window.devicePixelRatio}x-adjustment`);
   ```

   ```css
   .chrome-adjustment.pixelratio-1x-adjustment {
   transform: translateY(-1px);
   }
   .chrome-adjustment.pixelratio-2x-adjustment {
   transform: translateY(-1.5px);
   }
   .safari-adjustment.pixelratio-1x-adjustment {
   transform: translateY(-1px);
   }
   .safari-adjustment.pixelratio-2x-adjustment {
   transform: translateY(-1px);
   }
   .firefox-adjustment.pixelratio-1x-adjustment {
   transform: translateY(-1.5px);
   }
   .firefox-adjustment.pixelratio-2x-adjustment {
   transform: translateY(-2px);
   }
   ```

## 결론

폰트는 디자인적인 이유와 기술적인 제약으로 인해 완벽하게 수직 중앙 정렬되어 보이지 않을 수 있습니다. 이는 폰트 메트릭의 특성, 브라우저의 렌더링 방식, 픽셀 밀도 등 여러 요인이 복합적으로 작용한 결과입니다.

완벽한 수직 중앙 정렬을 위한 마법 같은 해결책은 없지만, 폰트의 동작 방식을 이해하고 특정 상황에 맞는 보정을 적용한다면 시각적으로 더 만족스러운 결과를 얻을 수 있습니다.

무엇보다 중요한 것은 이러한 차이가 '오류'가 아니라 폰트와 텍스트 렌더링의 본질적인 특성임을 이해하는 것입니다. 보통의 경우 이 미세한 차이는 사용자 경험에 큰 영향을 주지 않으므로, 지나친 완벽주의보다는 전체적인 디자인 일관성과 사용성에 집중하는 것이 바람직합니다.

NHN Cloud의 NCUI개발팀은 NCUI 컴포넌트 라이브러리를 통해 NHN Cloud 콘솔 구현 시 더 쉽고 빠르게 UI를 구현할 수 있도록 돕고 있습니다. 이번 글은 그 과정에서 얻은 고민과 작은 팁을 공유한 것으로, 많은 분들이 앞으로 개발하시는 데 참고가 되었으면 좋겠습니다. 긴 글을 읽어 주셔서 감사합니다! 😀

[![NHN Cloud_meetup banner_footer_202511.png](https://images.gogumang.com/ef00ee50bc/16.png)](https://www.nhncloud.com/kr)