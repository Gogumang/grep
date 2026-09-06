![](https://cdn-images-1.medium.com/max/1024/1*ongyUh_0YrRPaEd5v7ZmoQ.png)

코드의 가독성은 매우 중요한 문제입니다.

클린코드로 대표되는 코드 작성 지침에는 다양한 제안이 있습니다. 변수 이름을 어떻게 짓는 것이 좋은가부터 시작해서, 전체적인 코드의 구성과 분리등의 컨벤션까지 커버합니다. 이 모든것이 **읽기좋은**코드를 작성하기 위한 제안이고, 그것만으로도 책 한권은 우스울정도로 얘기를 쏟아낼 수 있습니다

하지만 이러한 클린코드는 어디까지나 텍스트 그 자체에만 집중합니다. IDE가 지원하는 여러 강력한 개인화는 다루지 않죠. 때문에 클린코드 지침과 별개로, 각자의 개발환경에서 코드의 가독성을 높이기 위한 다양한 개인화 시도는 해 볼 가치가 있습니다.

사람의 눈은 패턴인식기입니다. 때문에 텍스트 그 자체보다, 색과 모양등의 패턴 등의 다양한 시각 효과를 코드에 적용하면 전체적인 가독성이 훨씬 좋아집니다.

코드 작성과 코드 읽기의 비중은 1:10정도입니다. 개발자들은 대부분의 시간을 코드를 읽는데 보냅니다. 가독성에 신경쓰는건 당연한 일이죠.

### 에디터 설정

ide가 지원하는 여러가지 에디터 설정을 바꾸어서, 가독성을 끌어올리는 방법을 알아보겠습니다.

#### 찾기 결과 하이라이트

특정 단어 찾기시 눈에 띄게 좀 더 밝기를 올리거나, 사각박스를 치거나 하는 것을 저는 좀 더 선호합니다. 별다른 설정 없이도 부분의 컬러 스킴들이 이러한 텍스트 찾기 결과를 눈에 띄게 하이라이트 하지만, 코드를 읽는게 아니라 빠르게 눈으로 훑어가면서 단번에 눈에 뜨이게 하는편이 저는 더 좋더라구요.

코드 읽기의 대부분은 텍스트 또는 변수를 찾아가면서 뇌내 디버깅 내지는 변수 변화 흐름 추적이니, 이런식으로 밝게 시각적 꼬리표를 달아두는 것이 여러가지로 편리합니다.
![](https://cdn-images-1.medium.com/max/1024/1*CGq4XVnqBgqrlnsVs6JKiA.png)const 를 찾아보았습니다.![](https://cdn-images-1.medium.com/max/1024/1*7EIaI2Bm7VrOOMj_9-GBZg.png)설정 경로![](https://cdn-images-1.medium.com/max/1024/1*n_-klSX6eXGKq8szDuaeOQ.png)기본 Dracula 컬러 스킴의 경우 저채도의 녹색

#### 커서가 위치한 변수 하이라이트

매번 텍스트 찾기를 할 수만은 없는 노릇입니다. 요즈음의 ide는 커서가 위치한 변수를 하이라이트해주는 기능이 있죠. 그 하이라이트를 좀 더 하이라이트답게 바꾸어 봅시다.
![](https://cdn-images-1.medium.com/max/1024/1*zt52ImKwb_aU9NNry6O-Kw.png)employee에 커서를 올렸을때

위와 같이 설정하면, 커서를 올린것만으로도 변수의 흐름이 확연이 눈에 보이게 됩니다. 특히 쓰기가 일어나는 경우는 다른 색으로 표현가능해서 어떤 시점에 읽기쓰기가 일어나는지 단번에 알 수 있죠. 스크롤이 넘어가도 커서는 해당 변수 밑에 계속 있기에, 드륵드륵 코드를 내려가면서 전체 흐름을 보기에도 편합니다.
![](https://cdn-images-1.medium.com/max/607/1*iBToQmgklLMJDNdEMR0-hw.png)기본 dracula의 경우![](https://cdn-images-1.medium.com/max/1024/1*SEGzoPaz_tx9ENJ4ekDHvg.png)설정 경로. 변수 읽기의 경우![](https://cdn-images-1.medium.com/max/1024/1*dNCZAeeNwIg3u8uqQpR8cA.png)설정 경로. 변수 쓰기의 경우

저같은 경우에는 위와같이 파스텔톤 형광 계열 빨강과 노랑으로 해두었습니다. 각자의 컬러 스킴에 맞추어 눈에 잘 띄게 해두면 코드 읽기가 한결 쉬워질겁니다.

#### 커서가 위치한 라인 하이라이트

가끔은 변수가 아니라 라인 바이 라인으로 모든 코드를 읽어내려나가야 할 때가 있습니다.

기본적으로도 커서가 위치한 라인이 하이라이트가 되긴하지만...
![](https://cdn-images-1.medium.com/max/966/1*EZ3bIBUV5319OdnsTzjhYg.png)기본 커서가 위치한 라인 하이라이트

조금 더 눈에 띄면 좋겠단 생각을 지울수가 없죠.
![](https://cdn-images-1.medium.com/max/966/1*e_Jd0gG2l0IjF-bppHYTwQ.png)커서가 위치한 라인 하이라이트 설정 후

위와같이 테마에서 자주 쓰이는 색에서 좀 벗어난 색으로 포인트를 주면, 내가 지금 어디를 읽고 있었는지 한번에 화면내에서 볼 수 있습니다.
![](https://cdn-images-1.medium.com/max/1024/1*CheLAEZDh3dcmmKcpBALZw.png)커서가 위치한 라인의 색 설정 경로

#### 함수 분리선

이상적으로는, 한 파일안에 손으로 셀 수 있을정도의 갯수의 함수가 있고, 많아야 1000 라인정도의 코드만 있으면 좋겠지만, 실제로는 그러지 않을때가 많습니다.

인덴트가 들쭉날쭉하면서 어디서부터 어디까지가 이전 함수의 범위였는지 한번에 알기도 어려울때가 많죠.

ide가 감지하는 범위 내에서긴하지만, 함수 사이마다 분리선을 그어줄 수 있습니다.
![](https://cdn-images-1.medium.com/max/966/1*_QQm13Zv1jlOQOFhbnq8jg.png)함수 분리선(흰색 줄)이 그어진 모습![](https://cdn-images-1.medium.com/max/1024/1*f-qHK1CZscwsIWljnLFoTQ.png)show method separators 옵션을 킨다.![](https://cdn-images-1.medium.com/max/1024/1*jlA7CTYxovY_yhRXXs7VTA.png)해당 구분선의 색상은 methd separator color 옵션에서 설정 가능

수없이 많은 함수들 사이를 공백으로 다다다다 구별하는것도 좋지만, 그 전에 ide가 지원하는 구분선을 먼저 시도해보는것도 좋을거 같습니다.

#### 시맨틱 하이라이팅

이 기능은 제가 제일 좋아하는 기능중 하나입니다. 변수마다 서로 다른 임의의 색상을 부여하는 기능이죠.

기본적으로는 이 기능이 off 상태일텐데... 그렇게되면 아래처럼 보입니다.
![](https://cdn-images-1.medium.com/max/966/1*rMyXHf26khs-cMh7W7YJsg.png)semantic highlighting 이 꺼져 있을때

코드들이 다소 플랫해보이죠. 여기서... 해당 옵션을 키게 되면 각 변수별로 색상이 부여됩니다. 이제 여기서 취향에 따라서 색상을 더 부여주면 아래처럼 좀 더 구별이 쉬워집니다.
![](https://cdn-images-1.medium.com/max/1024/1*haYJPbjAKfukWhdV_uwiCA.png)semantic highlighing 설정![](https://cdn-images-1.medium.com/max/966/1*kTsK93xPVqHCcjrOD4hzkg.png)semantic highlighting 이 적용된 코드

위와 같이 ide의 설정만으로도 코드의 시각적 패턴화가 상당히 이루어집니다. 하지만 아래의 플러그인까지 설치하면 훨씬 더 코드 읽기가 쾌적해지는걸 경험했습니다.

### 플러그인

#### 인덴트 레인보우

코드 작업을 하다보면, 그러지 않으려고 해도 들여쓰기 단계가 깊어지는 경우가 있습니다.
![](https://cdn-images-1.medium.com/max/1024/1*2D7FxXGO6hmH2sjpFOKqvg.png)typeorm 코드의 15단계 들여쓰기

ide 의 기본 지원 기능으로, 들여쓰기 단계마다 수직선을 그어주지만, 아무래도 역부족인점이 있습니다. 특히 동일 들여쓰기 단계가 길어지는 코드의 경우, 까딱하다가는 눈으로 쫓던 코드 스코프를 놓치기 십상이죠.
![](https://cdn-images-1.medium.com/max/1024/1*ZAamkv1SFHqh8UdBfGgLmA.png)인덴트 레인보우 플러그인 활성화시

하지만 이처럼 시각적으로 강조를 하게되면, 훨씬 보기 편해지는걸 느낍니다.

[Indent Rainbow - IntelliJ IDEs Plugin \| Marketplace](https://plugins.jetbrains.com/plugin/13308-indent-rainbow)

여러가지 방법을 동원해서 코드의 가독성뿐만 아니라, 시각적 강조와 효과로 코드를 패턴처럼 눈에 보이게끔 하는 방법들을 알아보았습니다. 익숙해지면 코드를 변수와 선언의 연속인 글자들이 아니라, 색과 도형으로, 읽는게 아니라 흘깃 보고 바로 알아챌 수 있게 되어 훨씬 생산성이 높아지는걸 경험할 수 있습니다.
![](https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=b51b9e87f221)

*** ** * ** ***

[코드 가독성을 높이는 젯브레인 계열 IDE 에디터 세팅과 플러그인 추천](https://medium.com/zigbang/%EC%BD%94%EB%93%9C-%EA%B0%80%EB%8F%85%EC%84%B1%EC%9D%84-%EB%86%92%EC%9D%B4%EB%8A%94-%EC%A0%AF%EB%B8%8C%EB%A0%88%EC%9D%B8-%EA%B3%84%EC%97%B4-ide-%EC%97%90%EB%94%94%ED%84%B0-%EC%84%B8%ED%8C%85%EA%B3%BC-%ED%94%8C%EB%9F%AC%EA%B7%B8%EC%9D%B8-%EC%B6%94%EC%B2%9C-b51b9e87f221) was originally published in [직방 기술 블로그](https://medium.com/zigbang) on Medium, where people are continuing the conversation by highlighting and responding to this story.