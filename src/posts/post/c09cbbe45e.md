안녕하세요. FE플랫폼팀에서 전사 에디터 및 웹용 사진 편집기를 개발하고 있는 darcy입니다.

최근에 웹용 사진 편집기(이하 포토스)의 성능 개선을 위해 Web worker1를 도입할 수 있는 방안을 조사하고 팀 내 공유하는 자리를 가졌습니다.

![](https://images.gogumang.com/c09cbbe45e/01.png)

포토스는 다음 카페, 티스토리 등에서 사용하고 있는 웹용 사진 편집기입니다. 사용자가 글을 작성할 때 사진을 첨부한 후, 해당 사진에 효과를 주고 사이즈를 조절하는 등 다양한 이미지 편집 기능을 제공하고 있는데요, 스마트폰이 발달하고 카메라의 성능이 진화하면서 사용자가 카페와 블로그에 고화질의 이미지를 업로드하는 경우가 많아졌고, 이로 인해 브라우저에서 동작하는 포토스도 고화질 이미지를 처리하기 위한 성능 개선의 필요성이 제기되었습니다.

관련 기술을 조사하면서 MDN의 Web API2 중 OffscreenCanvas3를 사용해서 Worker를 도입하면 성능 향상에 도움이 될 것 같아 이를 적용해 보았습니다. 이번 글을 통해 OffscreenCanvas를 포토스에 적용한 경험을 공유합니다.
> *1웹 워커(Web Worker): 스크립트 실행을 메인 스레드가 아니라 백그라운드 스레드에서 실행할 수 있도록 해주는 기술입니다. 이를 통해 무거운 작업을 분리된 스레드에서 처리할 수 있으며, 메인 스레드(일반적으로 UI 스레드)는 멈춤이나 속도 저하 없이 동작할 수 있습니다.*
>
> *2<https://developer.mozilla.org/ko/docs/Web/API>*
>
> *3<https://developer.mozilla.org/ko/docs/Web/API/OffscreenCanvas>*

## **개요**

포토스는 웹에서 2D 그래픽을 렌더링 할 때 보편적으로 사용하는 캔버스(canvas)4를 사용해서 이미지 편집 기능을 제공하고 있습니다. 포토스에서 제공하는 이미지 편집 기능으로는 필터, 이펙트(밝기, 대비 등) 조절, 블러, 모자이크, 자르기, 사이즈 조절 등이 있는데요, 이런 복잡한 그래픽 처리가 메인 스레드(Main thread)에서 처리되고 있기 때문에 고화질의 이미지에 여러 효과를 적용한 이미지를 추출하는 작업을 할 때에는 Main thread에 부하가 발생하기도 합니다. 그래서 일정 사이즈 이상의 이미지에 대해서 리사이즈 후 편집 기능을 제공하고 화면 밖(off screen)에서 캔버스 처리를 한 후 캔버스에 이미지를 그려 넣는 등의 방법을 통해 성능을 개선시키고 있습니다. 하지만 이 방법도 캔버스를 처리하는 로직은 Main thread에서 동작합니다.

* 기존의 캔버스 최적화 방법 참고: [MDN - Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

이러한 기존 canvas의 성능 개선을 위해 [OffscreenCanvas Web API](https://developer.mozilla.org/ko/docs/Web/API/OffscreenCanvas) 기술이 등장했습니다. canvas를 처리하는 로직을 이름처럼 화면 밖(off screen)에서 처리할 수 있도록 하는 API입니다. 이 API를 이용하면, DOM 엘리먼트인 canvas를 떼어내서(detach) Web Worker에서 처리함으로써 Main thread에서 동작하던 캔버스 코드를 Worker thread에서 실행해서 성능을 향상시킬 수 있습니다.
> *4<https://developer.mozilla.org/ko/docs/Web/API/Canvas_API>, <https://developer.mozilla.org/ko/docs/Web/HTML/Element/canvas>*

## **데모 페이지 개발**

MDN의 설명 내용만으로는 파악하기에 아쉬움이 있고, OffscreenCanvas API 예제도 많지 않았습니다. 그래서 실제로 어떻게 기존 이미지 필터 프로젝트에 적용시킬 수 있는지를 알아보고 기존 canvas 대비 실행 동작, 퍼포먼스 등의 차이를 브라우저에서 확인해보고 싶어 데모 페이지를 개발했습니다.

### 데모 페이지 목표

* canvas와 OffscreenCanvas를 한 페이지에서 비교할 수 있다.
* 캔버스 내부에 동작하는 코드(Web, Canvas Animation)는 동일한 코드를 활용할 수 있다. (재사용성 확인)
* Main thread를 임의로 블록 시키는 동작을 추가해서 실제로 Worker 내부에서 동작하는 코드가 영향을 받지 않고 실행이 되는지 확인할 수 있다.

위와 같이 데모 페이지에서 구현해 보고자 하는 목표를 잡고 데모 페이지를 개발했습니다.

데모 페이지는 익숙한 예제인 Canvas Animation을 넣은 페이지와 이 프로젝트의 목표인 WebGL Image Filter를 적용한 페이지의 두 페이지로 구현했습니다. WebGL Image Filter 페이지의 경우 실제로 이미지 필터 프로젝트에서 사용하고 있는 쉐이더 코드를 가져와서 적용했습니다.

### Canvas Animation 데모

![](https://images.gogumang.com/c09cbbe45e/02.gif)

Canvas Animation은 OffscreenCanvas를 소개하는 글에서 한 번씩 볼 수 있는 보편화된 예제이고, OffscreenCanvas의 장점이 시각적으로 잘 표현되는 예제이기 때문에 데모 페이지에도 추가했습니다.

랜덤 한 위치에 원을 만들고 해당 원의 위치를 이동시키는 예제입니다. 동일한 캔버스 애니메이션 코드를 좌측의 canvas 예제에서는 Main thread에서 애니메이션을 실행시키고 우측에서는 OffscreenCanvas Web API를 사용해서 구현했습니다. 캔버스 내 원을 이동시키는 애니메이션 로직은 동일한 함수(Animate)를 활용했습니다.

*Main thread에서 애니메이션이 실행되는 canvas 예제* :

```
// canvasLoader.js
import Animate from './animate';
const CanvasLoader = () => {
  const canvas = document.querySelector('.normal-canvas');
  const init = () => Animate(canvas);
  return {
    init,
  }
}
export default CanvasLoader;
```

*Worker thread에서 애니메이션이 실행되는 OffscreenCanvas 예제* :

```
// workerLoader.js
import Worker from '../worker/canvas.worker';
const WorkerLoader = () => {
  const canvas = document.querySelector('.offscreen-canvas');
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker();
  const init = () => {
    worker.postMessage({canvas: offscreen}, [offscreen]);
  };
  return {
    init,
  }
}
export default WorkerLoader;
// canvas.worker.js
import Animate from '../canvas/animate';
const worker = self;
worker.onmessage = (e) => {
  const { canvas } = e.data;
  Animate(canvas);
}
```

‘Block the main thread’ 버튼을 클릭하면 약 3초간 Main thread에 부하를 주는 함수를 실행합니다.

```
const blockMainThread = (ms) => {
    let time = new Date();
    while ((new Date()) - time <= ms) { }
  }
```

일정 시간 동안 조건에 부합하지 않은 경우 while 문을 실행시키는 실제 개발 환경에서는 사용하기 드문 비효율적인 함수죠 ?

그래서 해당 함수를 실행했을 때 Main thread에서 실행 중인 canvas는 그 영향을 받아 일시적으로 애니메이션이 멈추었지만, Worker thread에서 실행 중인 OffscreenCanvas는 영향을 받지 않고 끊김 없이 애니메이션이 동작하는 것을 확인할 수 있었습니다.

![](https://images.gogumang.com/c09cbbe45e/03.png)

퍼포먼스 탭으로 확인해 보면 더 명확하게 확인할 수 있는데요, Main thread 중간에 빨간색으로 길게 보이는 구간이 Main thread에 영향을 주는 함수를 실행한 부분입니다. 해당 텀 동안 Main thread 애니메이션은 영향을 받아 애니메이션 실행이 멈췄지만 아래의 Worker thread에서는 끊김 없이 애니메이션 동작 함수가 실행되었습니다.

### WebGL Image Filter

![](https://images.gogumang.com/c09cbbe45e/04.gif)

다음으로 이미지 처리를 테스트하기 위해 WebGL에 OffscreenCanvas를 적용해 보았습니다. WebGL Image Filter 페이지에서는 이미지를 로딩하고 해당 이미지에 필터(BT01\~BT10)를 적용해 볼 수 있습니다. ‘Load Image’ 버튼은 WebGL로 이미지를 그리는 처리를 하고, 그 외 필터 버튼은 이미지에 해당 필터 쉐이더를 적용시키는 동작을 합니다.

![](https://images.gogumang.com/c09cbbe45e/05.png)

퍼포먼스 탭에서 record를 클릭한 후에 Canvas의 ‘Load Image’, OffscreenCanvas의 ‘Load Image’ 버튼을 클릭해서 확인해 보면 각각 어떤 방식으로 동작하는지 확인할 수 있습니다. Canvas의 경우 Main Thread와 WebGL 처리 로직이 동작한 것을 확인할 수 있고, OffscreenCanvas의 경우 WebGL로 이미지를 그리는 부분을 Worker에서 처리한 것을 확인할 수 있습니다.

이미지 필터의 경우 보통 사용자가 각각의 필터를 선택해서 필터를 적용시키기 때문에 canvas animation 예제처럼 캔버스 내부에서 연속으로 동작할 일은 거의 없습니다. 하지만 데모 페이지에서 이미지 필터링하는 부분도 Main thread에서 block 되었을 때 멈추는 상황을 재현해 보고 싶었습니다.

그래서 임의로 ‘Apply All Filters’ 버튼을 만들어서 각 필터를 순차 적용시키는 기능을 하나 추가했습니다.

![](https://images.gogumang.com/c09cbbe45e/06.gif)

Main thread를 block 시켰을 때 Worker에서 동작하는 필터링 함수는 끊김 없이 동작한 반면, main thread에서 동작 중인 필터링 함수의 경우 block된 시간 동안 멈췄다가 block이 풀렸을 때 쌓여 있던 콜백 함수들이 실행되는 것을 확인할 수 있습니다.

![](https://images.gogumang.com/c09cbbe45e/07.png)

## **이슈**

### An OffscreenCanvas could not be cloned because it was detached.

처음 이미지 필터를 적용하는 데모를 만들었을 때, 필터를 변경할 때마다 Worker를 생성해서 OffscreenCanvas로 캔버스를 넘기는 방식으로 구현을 했는데요, 이 경우 필터를 변경할 때 아래와 같은 에러 메시지가 표시되었습니다.

![](https://images.gogumang.com/c09cbbe45e/08.png)

이 원인은 OffscreenCanvas를 생성한 후 이후 다른 필터 실행 시, 이미 해당 캔버스에 대한 OffscreenCanvas가 선언되어 있는데 재할당을 해서 생긴 문제였습니다. 그래서 OffscreenCanvas를 한 번 생성한 후에는 postMessage를 호출 시 canvas를 보내지 않도록 수정해서 해결했습니다.

### 스타일 값 설정 필요

일반 canvas 엘리먼트의 경우 width, height 속성이 있지만 OffscreenCanvas의 경우 속성값 중 width, height 속성이 없습니다. 그래서 기존 코드 로직 중 canvas.style.width, canvas.style.height를 사용하는 경우 OffscreenCanvas로 전환했을 때 에러가 발생할 수 있습니다. 이 경우 width, height를 명시적으로 정의해 주는 과정이 필요합니다.

### 이미지를 이미지 데이터로 변환 후 로딩

OffScreenCanvas를 사용할 프로젝트가 이미지 필터 프로젝트이다 보니 이미지 사용이 필수적입니다. 하지만 기존 코드에 OffscreenCanvas를 적용해보니 이미지를 제대로 불러오지 못해서 에러가 발생했습니다. 기존에는 캔버스에 이미지를 불러와서(Image Web API 사용) 처리하는데 Worker 스레드에서는 DOM의 Image API를 사용할 수 없습니다. 이 때문에, fetch API를 사용해서 이미지를 가져온 후 createImageBitmap 메서드를 사용해서 이미지 비트맵을 만들어서 처리했습니다.

* 참고: [Loading Images with Web Workers](https://dev.to/trezy/loading-images-with-web-workers-49ap)

## **브라우저 지원**

아쉽지만 아직 브라우저 지원 범위가 넓지 않습니다. 크롬과 엣지 브라우저에서 사용할 수 있고 파이어폭스는 아직 개발 중입니다. 사파리와 IE가 지원되지 않습니다. 호환성의 범위가 넓어지지 않을 경우 분기 처리를 통해 지원하지 않는 브라우저에 대해서는 기존 canvas를 사용할 수 있도록 처리가 필요합니다.

![](https://images.gogumang.com/c09cbbe45e/09.png)

[Can I use](https://caniuse.com/?search=offscreencanvas)

## **느낀점**

OffscreenCanvas 기술에 대해 조사해본 후 느낀 점을 정리해 봤습니다.

먼저 이미지 필터 서비스를 사용하고 있는 포토스(웹용 사진 편집기)의 경우를 예로 들면 이미지 필터는 포토스의 기능 중 하나로 Main thread에서 동작하고 있는 작업이 있기 때문에 필터 처리에 OffscreenCanvas를 도입하면 기존 Main thread의 부하를 줄이는 데 도움이 될 것이라고 생각합니다. 추후 이미지 필터 서비스를 개선하는 작업을 한다면 OffscreenCanvas 도입을 통해 성능을 개선하는 부분도 생각하고 있습니다.

그 외에도…

* 기존 캔버스 코드에서의 전환이 쉽다.
  * Worker 파일 또한 자바스크립트로 작성하기 때문에 기존에 캔버스를 조작하던 코드(WebGL) 코드를 Worker 코드 내에서도 동일하게 활용할 수 있습니다.
  * 데모 페이지를 작업하면서 실제로 코드 재사용을 해보니, 어렵지 않게 양쪽 다 적용이 가능했습니다.(개인적으로는 앞으로 캔버스를 조작하는 프로젝트를 진행한다면 OffscreenCanvas를 도입해서 개발해 보려고 합니다.)
* 낮은 러닝 커브
  * 자바스크립트에 익숙하다면 Worker에 대한 학습 후 비교적 쉽게 적용 및 전환을 할 수 있습니다.

현재 브라우저 지원 범위가 넓지 않기 때문에 IE10과 사파리 등을 지원하기 위해서는 OffscreenCanvas를 사용할 수 없는 환경에 대한 대응이 필요합니다. 하지만 기존 캔버스를 조작하는 코드는 동일하게 사용이 가능하기 때문에 모듈 단위로 분리 후 분기 처리를 통해 지원되지 않는 브라우저와 지원하는 곳 두 곳에 적용이 쉽다는 점이 매력적입니다.

일반적으로 웹사이트에 캔버스가 적용되어 있는 것을 보면 게임 등과 같이 캔버스가 주된 동작인 것을 제외하고는 웹사이트의 인터렉티브한 효과 등을 주기 위해 사용된 경우가 많습니다.

이 경우 OffscreenCanvas 도입을 통해 캔버스를 Worker에서 실행되도록 한다면 Main thread에 영향을 받지 않는(끊기지 않고 매끄러운) 캔버스를 구현할 수 있습니다. 서비스에 캔버스를 사용하고 있다면 OffscreenCanvas 도입을 고려해보시는 것은 어떨까요?

*** ** * ** ***

**참고**

* [OffscreenCanvas Web API](https://developer.mozilla.org/ko/docs/Web/API/OffscreenCanvas)
* [MDN - Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
* [OffscreenCanvas — Speed up Your Canvas Operations with a Web Worker](https://developers.google.com/web/updates/2018/08/offscreen-canvas)
* [Loading Images with Web Workers](https://dev.to/trezy/loading-images-with-web-workers-49ap)