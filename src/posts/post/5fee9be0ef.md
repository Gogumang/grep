AI/데이터

# 컬리, IEEM 2022에서 물류센터 생산 계획 최적화 논문을 발표하다

A Fast Metaheuristic Optimizer for Large-scale Batch Fulfillment Planning
![](https://helloworld.kurly.com/_astro/ppt_front.BCx6rVBx_20EIfi.webp)
© 2022. Kurly. All rights reserved.

컬리는 지난 2022년 12월 7일부터 10일까지 말레이시아 쿠알라룸푸르에서 개최된 [IEEE IEEM 2022](https://www.ieem.org/public.asp?page=index.asp) 학회에서 물류 센터의 생산 계획 최적화에 관한 논문을 발표했습니다.

IEEE IEEM은 2007년부터 싱가폴 난양공대가 주도적으로 개최한 산업 공학 학술 대회입니다. 주로 동북, 동남 아시아 대학이 참여하며, 몇몇 제조 업체의 실무자와 중동, 유럽, 아프리카 등지에서 먼 길 날아온 박사 과정 학생들도 만날 수 있었습니다.

![](https://helloworld.kurly.com/_astro/conf_dinner.BFyMh9xr_1wJIBD.webp)
© 2022. Kurly. All rights reserved.

컬리가 발표한 논문은 [메타휴리스틱](https://en.wikipedia.org/wiki/Metaheuristic) 기법인 [유전 알고리즘](https://en.wikipedia.org/wiki/Genetic_algorithm) 을 사용해 최적의 물류 생산 계획을 찾는 방법을 다뤘습니다. 보통 학술 대회 논문은 실무와 다소 거리가 있을 때가 많은데, 컬리의 논문은 지극히 현실적인 문제를 풀어낸 사례를 소개했기에 독특했던 것 같습니다.

컬리의 생산 계획 최적화는 아래 두 장표로 요약할 수 있습니다. 물론 학술 대회니까 수학 공식으로 겉멋을 좀 내보았습니다. 😎

![](https://helloworld.kurly.com/_astro/ppt_math1.CuZLyDkE_26iUkJ.webp)
© 2022. Kurly. All rights reserved.

컬리의 생산은 [배치 피킹 방식](https://www.netsuite.com/portal/resource/articles/inventory-management/batch-picking.shtml) 으로 진행되기 때문에 고객의 주문을 잘 묶어서 최적의 배치로 만드는 게 중요합니다. 최적의 배치란 곧 최적의 생산 계획을 의미하며, 생산 계획을 최적화하면 결국 배치에서 처리할 상품 수가 줄어들고 피킹 작업과 분배 작업도 수월해 집니다.

![](https://helloworld.kurly.com/_astro/ppt_math2.Cmc5K-f4_2lt3jf.webp)
© 2022. Kurly. All rights reserved.

따라서 우리는 컬리의 생산 계획 최적화를 상품 수가 가장 적은 배치 계획을 찾아내는 문제로 정의했습니다. 위 그림과 같이 생산 계획을 유전자로 표현하고, 고유 상품 개수가 가장 적은 유전자를 찾아낼 수 있도록 유전 알고리즘을 구성했습니다.

컬리 데이터플랫폼팀은 이 유전 알고리즘을 바탕으로 최적화 서버를 개발했고, 물류 센터에 실제로 반영해 더 나은 생산 계획을 만들 수 있는지 확인하고 있습니다. 더 나은 생산 계획은 결국 생산성 증대로 이어지며, 더 많은 고객님들께 다양한 상품을 보내드릴 수 있게 될 겁니다.

내년에는 실질적인 사업 개선 성과를 업계와 학계에 보고할 수 있게 되길 희망하며 포스팅을 마치겠습니다. 감사합니다.
!\[\](../../assets/post-img/ieem2022/conf_poster.jpg) !\[\](../../assets/post-img/ieem2022/towers.jpg) © 2022. Kurly. All rights reserved.

*** ** * ** ***

컬리의 물류 최적화에 대한 보다 자세한 내용이 궁금하시다면, 다음 글들을 참고하시기 바랍니다.

* [컬리는 물류 최적화 문제를 어떻게 풀고 있을까? - 1부](https://helloworld.kurly.com/blog/logistics-optimization-1/)
* [컬리는 물류 최적화 문제를 어떻게 풀고 있을까? - 2부](https://helloworld.kurly.com/blog/logistics-optimization-2/)

*** ** * ** ***

같은 카테고리의 최신 글