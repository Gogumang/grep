LY Corporation의 기술 컨퍼런스인 [Tech-Verse 2026](https://tech-verse.lycorp.co.jp/2026/ko/)의 공식 기사입니다.

안녕하세요. LY Corporation에서 머신러닝 플랫폼을 개발하고 있는 Kenta Kihara와 Yifan Yuan입니다. 이 글에서는 LINE Part Time Jobs(LINEバイト)의 검색 리랭킹(reranking)에서 직면했던 cold start problem을 임베딩 처리 방식을 개선하여 간단히 해결한 사례를 소개합니다.

## LINE Part Time Jobs의 검색 리랭킹 소개

LINE Part Time Jobs는 아르바이트 구인을 검색하고 지원할 수 있는 서비스입니다. 그동안 저희는 LINE Part Time Jobs의 검색 결과 목록 화면에서 사용자의 행동 이력을 기반으로 정렬을 개인화해, 사업 KPI와 사용자 경험을 개선해 왔습니다.

검색은 사용자가 지정한 쿼리에 적합한 후보를 가져오는 검색(retrieval) 단계와, 가져온 후보들의 상위를 재정렬하는 리랭킹 단계, 이렇게 두 단계로 나뉩니다. 각 요청마다 사용자의 쿼리가 달라지는 검색의 특성상 사전에 배치로 계산해 두는 것은 현실적이지 않기 때문에 이 처리는 실시간으로 수행해야 합니다.

시스템이 복잡하고 연산량이 많았기 때문에 기존 LINE Part Time Jobs의 검색 리랭킹에서는 별도 파이프라인의 배치로 생성한 사용자-아이템 추천(user-to-item recommendation)의 2타워 임베딩(two-tower embedding)을 전용해 코사인 유사도(cosine similarity) 순으로 정렬하는 단순한 방식을 채택하고 있었습니다. 다음은 기존의 유사도 기반 검색 리랭킹 구조를 간단히 표현한 것입니다.

![기존 유사도 기반 LINE바이트 검색 정렬 개념도](https://vos.line-scdn.net/landpress-content-v2-vcfc68aynwenkh3bno0ixfx8/093227e1f8ce4bb6ab73dbd7f08fa3a7.png?updatedAt=1780633171000)

그러나 이 방식에는 몇 가지 개선 여지가 있었습니다.

첫째, 검색 화면의 정보를 충분히 활용하지 못한다는 점입니다. 임베딩에는 쿼리 정보가 포함되어 있지 않아 사용자가 입력한 의도를 충분히 반영할 수 없었습니다. 예를 들어 역(station)을 지정했을 때 역과의 거리가 고려되지 않아 오히려 수백 미터를 걸어야 하는 인접 역의 구직 공고가 상위에 노출되는 경우도 있었습니다.

또한 임베딩에는 검색 화면 이외의 정보도 포함됩니다. 유사한 구직 공고를 보여주는 모듈이나 LINE 공식 계정을 통한 추천 등 모든 측면에서의 행동이 포함돼 있기 때문에 사용자의 선호 경향을 포착하는 데는 유용했지만 검색 화면에서는 추가 개선 여지가 있었습니다.

이처럼 화면 및 모듈별 특성을 활용하기 위해 팀에서는 전용 리랭킹 모델을 사용한 2단계 방식의 추천([참고(일본어)](https://speakerdeck.com/lycorptech_jp/case-study-introduction-of-a-2-stage-system-for-stamp-sticker-recommendation-quotas))을 추진하고 있으며, LINE Part Time Jobs의 검색에도 동일하게 전용 모델 도입에 기반한 실시간 리랭킹 적용을 검토하고 있었습니다.
![전용 리랭킹 모델을 사용한 2단계 추천 이미지](https://vos.line-scdn.net/landpress-content-v2-vcfc68aynwenkh3bno0ixfx8/2d19a81fab8c4e06a5c9f8ab52177a32.png?updatedAt=1780633185000) 전용 리랭킹 모델을 사용한 2단계 추천

## 리랭킹 모델 도입 시 마주친 문제

전용 리랭킹 모델을 도입하기 위한 테스트를 진행하는 과정에서 다음 두 가지 과제에 직면했습니다.

### 1. 콜드 스타트 문제

LINE Part Time Jobs에서 다루는 알바 공고는 월초에 대부분 교체됩니다. 따라서 검색 리랭킹을 위한 충분한 학습 데이터가 확보될 때까지 모델 성능이 크게 저하되는 콜드 스타트 문제가 발생한다는 것을 확인했습니다.

### 2. 임베딩 공간의 비정상성

앞서 언급한 것처럼 임베딩에는 사용자의 선호 경향이 반영돼 있어 이를 특징으로 활용하면 리랭킹 모델의 성능을 크게 향상시킬 수 있다는 것을 오프라인 테스트에서 확인했습니다. 그러나 이를 온라인(실시간) 시스템에 적용하려면 의존하는 모델의 특성도 고려해야 합니다.

일반적으로 2타워 모델은 성능 저하를 피하기 위해 정기적으로 랜덤 가중치에서 처음부터 학습하지만, 학습할 때마다 임베딩 공간이 바뀌게 됩니다. 따라서 다운스트림 작업에서 임베딩을 피처(feature)로 사용하면 학습 시와 추론 시 데이터가 불일치하는 문제가 발생합니다.

## 문제 해결 접근 방법: 임베딩 안정화

이 문제를 해결하기 위해 우리는 임베딩을 후처리로 안정화(stabilization)하는 방법을 채택했습니다. 먼저 저희가 채택한 논문([Zielnicki \& Hsiao. Orthogonal Low Rank Embedding Stabilization (RecSys '25)](https://doi.org/10.1145/3705328.3748141)) 내용을 자세히 설명한 뒤 LINE Part Time Jobs에 어떻게 적용했는지 소개하겠습니다.

### 기본 아이디어

각 날짜의 임베딩을 전날의 안정화된 임베딩(첫날은 안정화 없이 그대로 사용)에 맞춰 정렬(alignment)하는 방법으로 임베딩 공간을 순차적으로 안정화합니다. 전날에 변환한 임베딩을 다음 날의 기준으로 사용하므로 특정 기준일을 고정적으로 계속 참조할 필요가 없습니다.

이를 통해 일 단위로 모델을 재학습하더라도 임베딩 공간의 연속성을 유지할 수 있어 시간에 걸쳐 비교 가능한 피처로 활용할 수 있습니다. 예를 들어 어제 생성한 임베딩 피처를 오늘의 피처로 학습한 다운스트림 모델에 입력해도 문제없이 작동합니다. 반대의 경우도 마찬가지입니다. 즉 임베딩 피처와 다운스트림 모델의 업데이트 타이밍을 엄격히 맞출 필요가 없어 모델과 피처 간 버전 불일치를 신경 쓰지 않고 운영할 수 있습니다.

### 방법

안정화 절차는 저차원 SVD(low-rank SVD(singular value decomposition))와 [직교 Procrustes](https://en.wikipedia.org/wiki/Orthogonal_Procrustes_problem)의 두 단계로 구성됩니다.

#### 알고리즘 1. 저차원 SVD

저차원 SVD의 목적은 각 학습에서 생성된 임베딩 공간을 보다 표준화된 저차원(low-rank) 표현으로 변환하는 것입니다.

임베딩 차원을 <math xmlns="http://www.w3.org/1998/Math/MathML"> ee </math> e, 아이템 수를 <math xmlns="http://www.w3.org/1998/Math/MathML"> tt </math> t, 사용자 수를 <math xmlns="http://www.w3.org/1998/Math/MathML"> ww </math> w ( <math xmlns="http://www.w3.org/1998/Math/MathML"> e\<te \< t </math> e\<t, <math xmlns="http://www.w3.org/1998/Math/MathML"> e\<we \< w </math> e\<w)라고 할 때, 아이템 및 사용자 임베딩을 나란히 배치한 행렬은 각각 <math xmlns="http://www.w3.org/1998/Math/MathML"> T∈Rt×eT \\in \\mathbb{R}\^{t \\times e} </math> T∈Rt×e, <math xmlns="http://www.w3.org/1998/Math/MathML"> W∈Rw×eW \\in \\mathbb{R}\^{w \\times e} </math> W∈Rw×e로 표현할 수 있습니다。

2타워 모델은 아이템 임베딩과 사용자 임베딩의 내적을 통해 점수를 계산하므로, 점수 공간은 <math xmlns="http://www.w3.org/1998/Math/MathML"> TW⊤∈Rt×wTW\^\\top \\in \\mathbb{R}\^{t \\times w} </math> TW⊤∈Rt×w와 같은 큰 행렬이 됩니다. 이 전체 행렬을 직접 분해하는 대신 저차원 SVD를 이용해 <math xmlns="http://www.w3.org/1998/Math/MathML"> TT </math> T, <math xmlns="http://www.w3.org/1998/Math/MathML"> WW </math> W로부터 효율적으로 변환 행렬 <math xmlns="http://www.w3.org/1998/Math/MathML"> MT M_T </math> MT, <math xmlns="http://www.w3.org/1998/Math/MathML"> MW M_W </math> MW를 구합니다. 이를 적용하면 보다 표준화된 저차원 표현 <math xmlns="http://www.w3.org/1998/Math/MathML"> T′=TMT T' = T M_T </math> T′=TMT, <math xmlns="http://www.w3.org/1998/Math/MathML"> W′=WMW W' = W M_W </math> W′=WMW를 얻을 수 있습니다.

![Low Rank SVD 의사 코드](https://vos.line-scdn.net/landpress-content-v2-vcfc68aynwenkh3bno0ixfx8/f06844060b4a4bc08684ad0e8847a33d.png?updatedAt=1781662173000)

#### 알고리즘 2. 직교 Procrustes

다음은 직교 Procrustes를 사용한 공간 정렬입니다. 이 방법은 당일 임베딩과 기준 임베딩(전일의 안정화된 임베딩)이 최대한 일치하도록 만드는 직교 변환을 찾는 방법입니다. 직교 변환은 공간을 회전·반전시킬 뿐이므로 임베딩의 거리 관계나 내적 구조를 보존하기 쉽다는 장점이 있습니다. 이를 통해 2타워 모델의 점수 계산 특성을 유지한 채로 일별 임베딩 공간을 연속적으로 맞출 수 있습니다.

![Orthogonal Procrustes 의사 코드](https://vos.line-scdn.net/landpress-content-v2-vcfc68aynwenkh3bno0ixfx8/63c1b5115a0a4d0ba550987a9b089096.png?updatedAt=1781662187000)

### 구현할 때 고려해야 할 사항

LINE Part Time Jobs는 데이터 규모가 크므로 공간 계산량을 고려해 구현해야 합니다. 이번 작업에서는 분산 처리로 확장 가능한 계산을 지원하는 Apache Spark로 이 알고리즘을 구현했습니다.

#### **저차원 SVD의 효율화**

원 논문의 저차원 SVD는 [QR 분해](https://ko.wikipedia.org/wiki/QR_%EB%B6%84%ED%95%B4)를 사용했지만, 실제로 필요한 것은 상삼각 행렬 <math xmlns="http://www.w3.org/1998/Math/MathML"> RR </math> R뿐이므로 계산을 효율화하기 위해 [숄레스키 분해](https://ko.wikipedia.org/wiki/%EC%88%84%EB%A0%88%EC%8A%A4%ED%82%A4_%EB%B6%84%ED%95%B4)로 구현했습니다. 절차는 다음과 같습니다.

1. [Gramian 행렬](https://en.wikipedia.org/wiki/Gram_matrix?utm_source=chatgpt.com) <math xmlns="http://www.w3.org/1998/Math/MathML"> G=A⊤AG = A\^\\top A </math> G=A⊤A 를 계산합니다
2. <math xmlns="http://www.w3.org/1998/Math/MathML"> GG </math> G를 숄레스키 분해하여 QR의 <math xmlns="http://www.w3.org/1998/Math/MathML"> RR </math> R을 구합니다

위 방법은 QR 분해와 동치입니다.

* <math xmlns="http://www.w3.org/1998/Math/MathML"> A=QRA=QR </math> A=QR
  * <math xmlns="http://www.w3.org/1998/Math/MathML"> QQ </math> Q: 직교 열 벡터(orthogonal column vectors)
  * <math xmlns="http://www.w3.org/1998/Math/MathML"> RR </math> R: 상삼각행렬(upper-triangular matrix)
* <math xmlns="http://www.w3.org/1998/Math/MathML"> G=A⊤A=(QR)⊤QR=R⊤Q⊤QR=R⊤RG = A\^\\top A = (QR)\^\\top QR = R\^\\top Q\^\\top QR = R\^\\top R </math> G=A⊤A=(QR)⊤QR=R⊤Q⊤QR=R⊤R
  * <math xmlns="http://www.w3.org/1998/Math/MathML"> QQ </math> Q 는 열 직교 행렬, 즉 <math xmlns="http://www.w3.org/1998/Math/MathML"> Q⊤Q=IQ\^\\top Q = I </math> Q⊤Q=I가 되므로 소거할 수 있습니다.

따라서 숄레스키 분해( <math xmlns="http://www.w3.org/1998/Math/MathML"> G=R⊤RG = R\^\\top R </math> G=R⊤R)로 구한 <math xmlns="http://www.w3.org/1998/Math/MathML"> RR </math> R과 QR 분해의 <math xmlns="http://www.w3.org/1998/Math/MathML"> RR </math> R이 일치한다는 것이 증명되어 더 효율적으로 계산할 수 있습니다.

#### **직교 Procrustes의 분산 처리**

1. <math xmlns="http://www.w3.org/1998/Math/MathML"> M=B⊤AM = B\^\\top A </math> M=B⊤A를 계산합니다.
   * 이 행렬 곱은 매우 크므로 Spark를 이용한 분산 병렬 처리로 계산합니다
2. <math xmlns="http://www.w3.org/1998/Math/MathML"> MM </math> M를 SVD 분해합니다.
   * <math xmlns="http://www.w3.org/1998/Math/MathML"> MM </math> M는 <math xmlns="http://www.w3.org/1998/Math/MathML"> e×ee \\times e </math> e×e의 매우 작은 행렬이므로 직접 NumPy로 계산해도 무방합니다. 단일 노드의 메모리에 충분히 들어옵니다.

## 평가 및 고찰

### 안정화 효과

안정화 이전에는 임의의 이틀간 생성된 임베딩 간 상관관계가 매우 약해 거의 0에 가까운 상태였습니다.
![안정화 전 1주일 분량 임베딩의 분산·공분산 행렬](https://vos.line-scdn.net/landpress-content-v2-vcfc68aynwenkh3bno0ixfx8/bca06d4861f34db08790ffa7b19bf253.png?updatedAt=1780633401000) 안정화 전 1주일 분량 임베딩의 분산·공분산 행렬

안정화를 도입하자 사용자 측과 아이템 측 모두에서 일주일 후에도 유사도 약 0.88 정도를 유지할 수 있음을 확인했습니다.
![안정화 후 1주일 분량 임베딩의 분산·공분산 행렬 및 코사인 유사도 그래프(왼쪽부터 아이템, 사용자, 두 공간을 합친 결과).](https://vos.line-scdn.net/landpress-content-v2-vcfc68aynwenkh3bno0ixfx8/24c233ecab9e480e9d73172985059387.png?updatedAt=1780634916000) 안정화 후 일주일 분량 임베딩의 분산·공분산 행렬 및 코사인 유사도 그래프(왼쪽부터 아이템, 사용자, 두 공간을 합친 결과)

또한 장기간 검증 결과 1개월 후에도 벡터 유사도가 약 0.87 전후를 유지하는 것을 확인했습니다.
![안정화 후 1개월 분량 임베딩의 분산·공분산 행렬](https://vos.line-scdn.net/landpress-content-v2-vcfc68aynwenkh3bno0ixfx8/a8bf1d63101244dbb4c32a01fb72e0dc.png?updatedAt=1780635192000) 안정화 후 1개월 분량 임베딩의 분산·공분산 행렬

이 결과는 추론 시 사용하는 데이터가 학습 시의 데이터와 완전히 일치하지 않더라도 임베딩 공간의 드리프트(drift)로 인한 모델 성능의 큰 저하를 억제할 수 있다는 것을 시사합니다.

### 오프라인 평가

안정화 전후의 임베딩을 피처로 사용해 학습한 모델을 이용해 클릭이나 전환(conversion) 등 다양한 사용자 행동을 실측 정보(ground truth)로 삼아 오프라인 평가를 수행했습니다. 신경망 기반의 기준(baseline) 모델에 학습과 추론을 다른 날에 한 2타워 임베딩을 직접 피처로 추가했습니다.

안정화 전의 임베딩을 모델에 추가하면 공간 불일치로 인해 nDCG가 약 1\~5% 정도 저하됐습니다. 그러나 안정화된 임베딩을 사용하면 전환 nDCG가 약 9.0%, 클릭 nDCG는 약 4.5% 향상했습니다.

**표. 임베딩 안정화의 오프라인 평가 결과**

|      모델       |  클릭 nDCG   |  전환 nDCG   |
|---------------|------------|------------|
| 기본            | 0.4898     | 0.4601     |
| 안정화 전         | 0.4777     | 0.4540     |
| 안정화 전 + 차원 축소 | 0.4799     | 0.4533     |
| 안정화 후         | **0.5120** | **0.5017** |

### A/B 테스트를 통한 온라인 평가

안정화를 적용한 임베딩 피처와 추가 콜드 스타트 대응을 결합한 모델을 A/B 테스트로 평가했습니다. 그 결과 검색 화면 단독 KPI에서는 유의미한 개선이 관찰되지 않았지만 서비스 전체에서는 KPI가 4.7%, 매출이 6.5% 향상해 기존 A/B 테스트 중에서도 큰 폭의 향상을 달성했습니다。

### 고찰

A/B 테스트 결과와 2타 워 임베딩이 서비스 전체의 사용자 행동을 기반으로 학습되고 있다는 점을 고려하면, 검색 리랭킹 모델이 임베딩 피처에 포함된 '장기적 사용자 선호'를 잘 포착해 검색 화면을 기점으로 한 이후의 사용자 행동(사이트 내 이동이나 다른 모듈에서의 지원 등)에 긍정적 영향을 미친 것으로 판단합니다. 또한 초기 리랭킹 모델 적용 시 직면했던 콜드 스타트 문제도 임베딩 특성을 추가한 A/B 실험군에서 극복된 것으로 확인되었습니다。

또 하나 이 방법의 큰 장점은 2타워 모델 자체는 변경하지 않고, 모델이 출력한 임베딩에 후처리로 공간 정렬을 수행한다는 점입니다. 즉 기존 학습 파이프라인이나 모델 구조를 크게 변경할 필요가 없어 도입하기 쉽습니다. 기존 시스템에 미치는 영향이 적다는 점은 실제 머신러닝 시스템 운영할 때 매우 중요한 포인트입니다.
![임베딩 안정화 도입 시 데이터 흐름](https://vos.line-scdn.net/landpress-content-v2-vcfc68aynwenkh3bno0ixfx8/b3e8deb17cc54cfc9e402ff9708bb622.png?updatedAt=1780633443000) 임베딩 안정화 도입 시 데이터 흐름

## 향후 전망

LINE Part Time Jobs는 기존의 구인 게시처에 더해 신규 게시처를 확대하는 정책을 추진하고 있으며, 이로 인해 구인 정보의 범위가 넓어지고 있습니다. 이처럼 역동적인 상황에서도 이 방법이 여전히 유용한지 계속 검증해 나가고자 합니다.

또한, LY Corporation이 보유한 다양한 서비스에서 얻은 이러한 지식을 다른 서비스에서도 활용할 수 있도록 전사적으로 사용할 수 있는 머신러닝 기반 플랫폼을 더욱 확충해 사용자 경험 향상에 기여하고자 합니  다. 이번에 적용한 실시간 리랭킹 모델은 온라인 머신러닝 기반의 사내 개발 프로덕트([참고(일본어)](https://speakerdeck.com/lycorptech_jp/development-and-application-of-an-online-machine-learning-platform))를 활용해 구축했으며, 앞으로도 이 기반을 더욱 강화해 나갈 예정입니다.

## Tech-Verse 2026 개최 안내 --- 6월 29일

![image](https://tech-verse.lycorp.co.jp/2026/images/ogp-tech-verse-2026-en-ko.png)

이 글은 이벤트의 공식 기사로 공개되었습니다.

Tech-Verse 2026은 LY Corporation가 개최하는 기술 컨퍼런스입니다.

혁신적인 기술적 도전 과정과 현장의 생생한 인사이트를 공유합니다.

YouTube LIVE를 통한 생중계도 꼭 시청해 주세요.

<https://tech-verse.lycorp.co.jp/2026/ko/>