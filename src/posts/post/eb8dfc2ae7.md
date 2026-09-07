**[지난 1부](https://helloworld.kurly.com/blog/logistics-optimization-1/)** 에서는 유전 알고리즘을 통한 최적화로 주문 그룹 내 상품 가짓수를 효과적으로 줄였던 과정을 소개했습니다. 그러나 이는 어디까지나 과거 데이터에 적용해본 결과일 뿐, 실제 물류 환경에서는 어떤 변수가 작용할지 알 수 없기 때문에 알고리즘에 대해 좀 더 엄밀한 사전 검증이 필요합니다. 따라서 이번 2부에서는 실제와 최대한 닮은 **가상의 물류 센터**를 구축하고 그 안에서의 실험을 통해 유전 알고리즘의 실효성을 검증한 과정을 소개하겠습니다.

\* 앞으로 가상의 물류 센터 = Digital Twin이라고 하겠습니다

## Stochastic or Non-stochastic

Digital Twin을 구축할 때 **정해진 규칙이나 규격** 이 있어서 실제와 똑같이 구현하면 되는 부분(non-stochastic)이 있는 반면, 뭔가 **확률적으로** 결정되는 듯한 부분(stochastic)도 있습니다. 1부에서 설명한 주문 처리 과정을 다시 한번 떠올려 보겠습니다.

![](https://helloworld.kurly.com/_astro/img1.0e9BUeOB_1KzguF.webp)
© 2022. Kurly. All right reserved. 2번의 피킹은 시스템으로부터 지시를 받은 작업자들이 적재 공간을 돌아다니며 바구니에 상품을 채워나가는 공정입니다. 여기서 'A구역에서 사과를 3개 담으세요'와 같은 지시가 만들어지는 데는 **명확한 규칙** (예: 같은 구역에 있는 상품만 담도록 한다)이 있고, Digital Twin에서는 이 규칙을 그대로 구현하면 됩니다.

그렇다면 작업자는 바구니를 '얼마나' 채워야 할까요? 바구니에 상품을 담을 순서는 앞의 지시에 따라 정해지지만, 얼마나 채울지는 전적으로 **작업자의 판단**에 달려 있습니다. 누군가는 바구니가 넘치도록 담을 것이고, 또 다른 누군가는 적당히 담고 다음 바구니를 꺼낼 것이기 때문입니다.

Digital Twin을 실제 센터와 유사하게 만들기 위해서는 이처럼 명확한 규칙 없이 확률적으로 결정되는 부분을 잘 추정해 내야 합니다.

## 바구니를 얼마나 채워야 할까?

먼저 이 질문에 답하기 위해서는 어떤 정보가 필요할까요? 다시 말해 작업자는 언제 '바구니가 다 찼다'는 판단을 내릴까요? 아마 바구니가 매우 무겁거나(**무게** ) 혹은 시각적으로 충분히 채워졌을 때(**부피**)일 것입니다. 컬리가 취급하는 상품들은 대체로 가벼운 데다, 피킹 작업자는 바구니를 들지 않고 카트에 얹어 끌고 다닌다는 사실을 종합하면 무게보다 부피가 좀 더 중요한 정보라고 생각해 볼 수 있습니다. 이렇게 부피만 고려한다고 하면 다음 과정을 통해 '가상의 꽉 찬 바구니'들을 만들어낼 수 있습니다.

1. 임의의 부피 값 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 정합니다
2. 부피의 총합이 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 초과하기 전까지 바구니에 상품을 넣습니다
3. 1\~2번을 반복합니다

### 부피 값의 분포를 추정해보자 (MLE)

이제 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 매번 잘 정해주기만 하면 됩니다. 앞서 언급했듯 누군가는 바구니가 넘칠 정도로, 누군가는 적당히 채울 것이므로 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y가 **확률변수** 라는 사실은 자명해 보입니다. 모든 확률변수는 반드시 어떠한 **분포** 를 따르므로, 이를 알아낸다면 매번 적절한 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 정해줄 수 있습니다.

하지만 안타깝게도 저희는 Y에 대해 전부 알지는 못합니다. 과거 데이터를 통해 실제 부피 값( <math xmlns="http://www.w3.org/1998/Math/MathML"> XX </math> X라고 하겠습니다)들을 얻을 수 있지만, 이는 나올 수 있는 모든 값 중 일부에 불과합니다. 따라서 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 온전히 알기 위해서는, 즉 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y의 분포를 알아내기 위해서는 이미 알려진 <math xmlns="http://www.w3.org/1998/Math/MathML"> XX </math> X를 통해 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 추정해야 합니다. Digital Twin을 통해 실제 센터 내 현상을 짐작해 보려는 의도와 일맥상통합니다. 먼저 <math xmlns="http://www.w3.org/1998/Math/MathML"> XX </math> X에 대한 확률밀도함수를 그려보겠습니다.

![](https://helloworld.kurly.com/_astro/img8-1.C-t3QADn_ZL8dqo.webp)
© 2022. Kurly. All right reserved. **왼쪽 그래프** 는 '바구니 안 상품들의 총 부피', 즉 $$ X $$의 분포를 히스토그램으로 표현한 것입니다. 특정 구간에 밀집되어 있고 오른쪽으로 긴 꼬리를 보이고 있네요.

**오른쪽 그래프** 는 임의의 parameter를 갖는 [Weibull](https://en.wikipedia.org/wiki/Weibull_distribution) 분포이며, 모양만 봤을 때 왼쪽과 꽤나 유사해 보입니다. 그렇다면 <math xmlns="http://www.w3.org/1998/Math/MathML"> XX </math> X들의 모집단(= <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y의 집합)은 'Weibull 분포를 따르는 것이 아닐까?'라는 합리적인 의심을 해볼 수 있겠습니다. 이와 같이 모집단의 분포에 대한 의심이 가능한 상황에서는 [MLE(Maximum Likelihood Estimation)](https://en.wikipedia.org/wiki/Maximum_likelihood_estimation)를 활용할 수 있습니다. 쉽게 말하면 어떤 샘플이 나왔을 가능성(likelihood)이 가장 큰 분포를 찾는 것이며, 일반적으로 이런 상황에서 쓸 수 있는 가장 우월하고 기초적인 방법입니다.

MLE로 <math xmlns="http://www.w3.org/1998/Math/MathML"> XX </math> X의 모분포(= <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y의 분포)를 추정한 결과는 다음과 같습니다.

![](https://helloworld.kurly.com/_astro/img9.D-3GnaVU_d7tIa.webp)
© 2022. Kurly. All right reserved.

**왼쪽 그래프** 는 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y가 Weibull 분포를 따른다고 가정했을 때의 적합(fitting) 결과입니다. 직선은 임의의 parameter를 갖는 Weibull 분포 함수를, 검은 점들은 실제 값( <math xmlns="http://www.w3.org/1998/Math/MathML"> XX </math> X)을 의미합니다. 당연히 검은 점들이 직선에 붙어있을수록 좋은데, 아래의 일부 어긋난 부분을 제외하면 대체로 잘 맞는 것으로 보입니다.

만약 어긋난 부분까지 고려하고 싶다면 Weibull과 다른 분포를 혼합(mixture)해볼 수 있습니다. 초록 물감으로 연두색을 대강 표현할 수 있지만 노란 물감과 섞으면 더 완벽하게 표현할 수 있는 것과 같은 이치입니다. **오른쪽 그래프** 는 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y가 Weibull Mixture 분포(Weibull + Weibull)를 따른다고 가정했을 때로, 거의 모든 점을 포함하는 이상적인 결과처럼 보입니다.

물론 이런 결과는 한 번쯤 의심해 볼 필요가 있습니다. 저희는 당장 보이는 저 검은 점들뿐만 아니라 그 너머에 있는 모든 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 최대한 표현해야 하기 때문입니다. 즉, 복잡한 분포는 일부 데이터만 설명 가능한 편협한 결과일 수 있으므로 항상 주의해야 합니다.

이번 케이스에서는 이상치(outlier)를 제거한 다음, 임의의 Mixture 분포(Weibull + Continuous uniform)로 왼쪽의 어긋난 부분까지 일부 보정하기로 했습니다.

### 추정된 바구니 수 vs 실제 바구니 수

위에서 추정된 분포로부터 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 랜덤으로 뽑고, 부피의 누적합이 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 초과하기 전까지 바구니에 상품을 넣음으로써 작업자가 다 찼다고 판단한 바구니들을 가상으로 만들어낼 수 있습니다. 만약 저희가 잘 추정했다면 이렇게 만들어진 바구니 수가 실제 '작업자의 판단으로 만들어진 바구니 수'와 비슷해야 하겠죠. 그럼 두 값을 비교해 보겠습니다.

![](https://helloworld.kurly.com/_astro/img10.DYejzi4V_5tW0r.webp)
© 2022. Kurly. All right reserved.

위 그래프의 x축은 날짜, y축은 해당 날짜에 생성된 바구니 수입니다 (\* 보안을 위해 임의의 연산을 수행하였음). 초록 선이 추정된 바구니 수인데, 빨간 선(실제 바구니 수)과 큰 차이가 없는 데다 변동 또한 잘 포착하고 있음을 알 수 있습니다.

이렇게 가상의 바구니를 만들어내는데 성공했습니다.

## 바구니를 얼마나 빠르게 처리해야 할까?

[1부](https://helloworld.kurly.com/blog/logistics-optimization-1/)에서 설명한 바와 같이, 완성된 바구니들은 컨베이어를 타고 QPS 내 정해진 작업대로 이동하고, 대기하던 작업자가 상품 분배를 마치면 다음 작업대로 이동합니다. 여기서 '작업자가 어떤 바구니를 처리하는 속도'는 명확한 규칙 없이 담당 작업자의 숙련도나, 바구니 내 상품들의 구성 등 여러 변수로부터 영향을 받으므로 앞서 추정한 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y와 같은 확률변수라고 할 수 있습니다.

### 처리 속도에 영향을 주는 변수들

이 처리 속도(새로운 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y라고 하겠습니다)를 잘 정해주기 위해서는 어떤 변수가 얼마나 영향을 주는지를 파악해야 합니다. 각 변수를 소개하기 위해 1부에 첨부했던 회귀식을 가져왔습니다.

![](https://helloworld.kurly.com/_astro/img3-1.CEUg0-iD_7J9LK.webp)
© 2022. Kurly. All right reserved.

우선 바구니 안에 해당 작업자가 처리해야 하는 상품이 총 몇 개고( <math xmlns="http://www.w3.org/1998/Math/MathML"> X1 X_1 </math> X1), 몇 가지 종류가 들어있는지( <math xmlns="http://www.w3.org/1998/Math/MathML"> X2 X_2 </math> X2)에 따라 분배 속도가 달라질 것은 명백합니다. 또한 처리 당시가 얼마나 바쁜 상황이었는지도 속도에 영향을 줄 수 있습니다. 실제로 주문이 많이 몰려 전반적인 작업량(**<math xmlns="http://www.w3.org/1998/Math/MathML"> X3 X_3 </math> X3** )이 증가할수록 바구니를 빨리빨리 처리하는 경향이 짙습니다. 마지막으로 숙련된 작업자일수록(\*\* <math xmlns="http://www.w3.org/1998/Math/MathML"> X4 X_4 </math> X4\*\*) 작업 과정을 잘 이해하고 있기 때문에 처리 속도가 빠를 것입니다.

저희는 이 모든 변수를 사용하지 않고, Digital Twin의 설계 방식에 따라 몇 가지를 통제하기로 했습니다. 우선, 늘 바쁜 시간대를 가정하고 실험할 것이므로 <math xmlns="http://www.w3.org/1998/Math/MathML"> X3 X_3 </math> X3는 어느 정도 통제됩니다. 또한 Digital Twin 내 작업자는 평균적인 숙련도를 가지도록 할 것이므로 <math xmlns="http://www.w3.org/1998/Math/MathML"> X4 X_4 </math> X4또한 통제 가능합니다.

이제 남은 <math xmlns="http://www.w3.org/1998/Math/MathML"> X1 X_1 </math> X1, <math xmlns="http://www.w3.org/1998/Math/MathML"> X2 X_2 </math> X2로 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y에 대한 회귀분석을 수행한 결과는 다음과 같습니다.

![](https://helloworld.kurly.com/_astro/img11.B2fo_9aN_Z1E3XGU.webp)
© 2022. Kurly. All right reserved.

약 7만 5천 건의 실제 데이터로 연산한 결과 특히 **R-squared** 가 0.8이상으로, <math xmlns="http://www.w3.org/1998/Math/MathML"> X3 X_3 </math> X3와 <math xmlns="http://www.w3.org/1998/Math/MathML"> X4 X_4 </math> X4를 잘 통제한 상태에서 바구니 내 상품 구성을 알 수 있다면 처리 속도를 꽤나 성공적으로 계산해낼 수 있는 것처럼 보입니다.

이제 바구니 처리 속도 또한 성공적으로 추정할 수 있습니다. 좀 더 첨언하자면, 앞서 소개한 두 가지 예시는 사실 분포 추론이라는 큰 맥락에서 같다고 볼 수 있습니다. 추정량을 계산하는 방식이 MLE VS OLS 일뿐, 결국 회귀분석도 각 <math xmlns="http://www.w3.org/1998/Math/MathML"> XX </math> X에 대한 조건부 분포를 구함으로써 <math xmlns="http://www.w3.org/1998/Math/MathML"> YY </math> Y를 추론하는 과정이기 때문입니다 (심지어 정규분포를 가정한다면 MLE와 OLS의 결과는 같습니다).

## Digital Twin

위 정보들로 가상의 물류 센터를 만들 차례입니다. 저희는 [AnyLogic](https://www.anylogic.com)이라는 유료 소프트웨어를 사용해서 다음과 같은 실측 사이즈의 QPS를 구현했습니다.

![](https://helloworld.kurly.com/post-img/logistics-optimization/img15.gif)
© 2022. Kurly. All right reserved.

위쪽 컨베이어를 보면 앞서 가상으로 구성한 바구니들이 차례로 들어오고 있습니다. 이들이 오른쪽 위 분기점(=QPS입구)에 도착하는 순간 어떤 규칙에 따라 방문할 작업대의 목록과 순서가 정해지게 됩니다. 그 순서대로 작업대에 도착하면 바구니 내 상품 구성에 따라 처리 속도가 결정되고, 그 시간만큼 머무르다 다음 작업대로 이동합니다. 그렇게 모든 바구니의 분배 작업이 끝나면 시뮬레이션이 종료되고, 총 처리 시간을 기록합니다. 이처럼 저희가 구현한 Digital Twin은 현실을 많이 닮아 있습니다.

### 유전 알고리즘을 검증해 보자

1부에서는 유전 알고리즘과 기존 알고리즘 간 '주문 그룹 내 상품 가짓수'만 비교해 볼 수 있었습니다. 하지만 이제는 Digital Twin에서 마음껏 실험하면서 다양한 지표를 계산할 수 있습니다. 저희는 그중에서 특히 '동일한 주문 그룹에 대한 총 처리 시간'이 얼마나 차이날 지가 가장 궁금했습니다.

![](https://helloworld.kurly.com/_astro/img13.Di2K6cp6_Z2HBce.webp)
© 2022. Kurly. All right reserved.

위 그래프의 파란 막대는 기존 알고리즘으로, 빨간 막대는 유전 알고리즘으로 각각 최적화 한 경우의 일일 총 처리 시간을 나타냅니다 (\* 보안을 위해 임의의 연산을 수행하였음). 물론 Digital Twin에서는 편의상 주문 그룹 하나씩 직렬로 처리하는 것을 가정했지만, 실제 QPS에서는 여러 주문 그룹이 거의 병렬적으로 처리됩니다. 따라서 일일 총 처리 시간을 실제로 비교하기는 어렵겠지만, 하나의 동일한 그룹에 대해서만이라도 일관되게 약 3%씩 감소했다는 사실은 꽤나 고무적입니다.

### 실제 결과는 어땠을까?

글을 쓰는 지금, 컬리 물류 센터 중 한 곳에는 마침 유전 알고리즘을 활용한 최적화 프로그램이 적용되어 있습니다. 해당 센터 특성상 주문 그룹 내 상품 가짓수가 감소하면 전반적인 작업 효율 및 기타 부대 비용이 감소하게 됩니다. 이 관점에서 유전 알고리즘은 다음과 같이 효과를 톡톡히 보여주고 있습니다.

![](https://helloworld.kurly.com/_astro/img14.DNXpav8R_192SS9.webp)
© 2022. Kurly. All right reserved.

위 그래프의 빨간 점과 파란 점은 각각 유전 알고리즘이 적용되기 전과 후의 주문 그룹 내 상품 가짓수를 나타냅니다. 보시다시피 사이즈가 동일한 주문 그룹에 대해서, 기존 알고리즘 대비 상품 가짓수가 거의 일관되게 낮습니다. 센터 작업자 분들께 피드백을 받아본 결과 실제 현장에서도 체감될 정도의 변화라고 하시니, 다른 센터에 적용했을 때의 결과도 기대됩니다.

지금까지 물류 센터 최적화에 대한 컬리의 고민 및 해결 과정을 2부에 걸쳐 소개했습니다.

저희 데이터 플랫폼에서는 센터 내의 수많은 최적화 과제를 발굴하고 해결하기 위해 다양한 분석과 실험을 진행하고 있습니다. 다음에 다른 좋은 주제로 다시 찾아뵙도록 하겠습니다. 감사합니다.