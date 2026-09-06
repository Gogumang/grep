![](https://cdn-images-1.medium.com/max/1024/1*GtXAeZtKf0gEFGScZkef9g.png)

안녕하세요 직방 DataManagement팀 DBA James 입니다.

AWS RDS 모니터링을 위한 다양한 솔루션들이 존재하지만 그중 가장 기본이라고 할 수 있는 CloudWatch를 활용한 모니터링 이야기를 해보려 합니다.
(aurora RDS의 경우로 이야기하겠습니다)

AWS RDS Console에서 RDS의 Status 모니터링을 해오셨던 분이라면 Monitoring 탭에서 제공하는 CloudWatch의 지표들을 많이 접해오셨을 것이라고 생각합니다.

일반적으로 RDS Monitoring에서 기본적으로 제공되는 CloudWatch 지표는 다음과 같습니다.
![](https://cdn-images-1.medium.com/max/1024/1*Z3k38Hi8Iw3l2RV6P5UrJA.png)***AbortedClients*** 부터 ***WriteThroughput***까지 알파벳 순으로 정렬된 100개의 지표

다양한 지표들을 제공해 주지만 모니터링을 하면서 우리는 이렇게 많은 지표를 모두 볼 수도 없고, 항상 필요하지는 않습니다.

다양한 지표의 홍수 속에서 ***필요한 정보를 선별*** 하고 ***선택과 집중***이 필요한 부분이죠.
> ChatGPT에게 Aurora RDS를 모니터링하는데 중요한 지표를 물어보았습니다.
![](https://cdn-images-1.medium.com/max/850/1*NfUkXSX_nkWZAVHAFRCB5g.png)10여 가지의 지표를 추천.ai

100가지 지표 중 내가 원하는 중요한 지표를 보기 위해서는 열심히 마우스 휠을 굴리거나 지표명을 검색하여 원하는 정보의 확인이 가능합니다.
![](https://cdn-images-1.medium.com/max/1024/1*MP-EwAKBlMu85bmfEpBlXQ.png)CPUUtilization 지표를 확인! CPUUtilization 지표만 확인..

DB 모니터링 시, 대부분의 문제는 복합적인 원인으로 인해 발생하는 경우가 많기 때문에 하나의 지표로는 상태 파악이 쉽지 않습니다.

하지만 안타깝게도 AWS RDS Console에서 제공하는 CloudWatch에서는 내가 원하는 지표들을 한눈에 확인이 불가능하고 레이아웃 편집이 불가능하기 때문에 모니터링으로서의 기능은 떨어진다고 할 수 있습니다.

그렇다면 내가 필요한 지표의 정보만 한눈에 볼 수 있는 조금 더 간편하게 모니터링을 할 수 있게 만들어주는 나만의 Dashboard를 만들어 보겠습니다.

#### 나만의 Dashboard 만들기

CloudWatch Dashboard 자체를 만드는 법은 어렵지 않습니다.
> 다시 한번 ChatGPT에게 물어보았습니다.
![](https://cdn-images-1.medium.com/max/816/1*FN2TEvmnXjrMOWeAUxf8_g.png)참 쉽죠..?

위 방법을 따라서 Dashboard를 생성하고 ChatGPT가 추천해 준 중요 지표를 추가해 보겠습니다.
![](https://cdn-images-1.medium.com/max/1024/1*YrUslbOwAYcfv6t77WRZgg.png)다수의 DB 모니터링이 가능합니다.

다수의 DB를 한눈에 모니터링이 가능한 나만의 Dashboard 가 완성되었습니다.

**끝! 이라고 하기에는 지표의 그래프만 봐서 현재 상태가 정상인지 혹은 주의 깊게 지켜봐야 하는 상태인지 파악이 어렵지 않으신가요?**

이제는 좀 더 멀리서 봐도 상태를 파악할 수 있는 Dashboard를 만들기 위한 추가 설정을 진행해 보겠습니다.

#### ***첫 번째, Horizontal thresholds(가로 주석/임계값)* 추가입니다.**

Horizontal thresholds 추가는 가로주석을 통해 멀리서 Dashboard를 확인할 때 에도 경고 또는 위험 수준에 근접한 지 확인을 용이하게 하기 위한 기능입니다.

설정을 위한 방법은 대상 지표의 **\[Edit graph\]** 화면으로 이동 후**\[Options\]** 탭에서 **\[Add Horizontal annotations\]**버튼을 클릭하여 항목을 추가/설정해줍니다.
![](https://cdn-images-1.medium.com/max/1024/1*riueZVS9pIlpwyEyqit-ng.png)Label과 색상, Value를 지표에 맞게 입력해 줍니다.![](https://cdn-images-1.medium.com/max/1024/1*LlIvUQoJHwS4LXwou-99Ag.png)Warning과 Error 주석을 추가한 후의 Dashboard

지표의 변화가 현재 정상적인지, 가로 주석에 근접한 주의가 필요한 상황인지 파악이 용이해진 것을 확인할 수 있습니다.

#### 두 번째, Anomaly detection(이상 탐지) 추가입니다.

CloudWatch Anomaly detection(이상 탐지)이란?
> 지표에 대해 '이상 탐지'를 사용 설정하면 CloudWatch는 통계 및 기계 학습 알고리즘을 적용합니다. 이러한 알고리즘은 시스템 및 애플리케이션의 지표를 지속적으로 분석하고, 정상 기준을 결정하며, 최소한의 사용자 개입으로 이상을 나타냅니다.
> 알고리즘은 이상 탐지 모델을 생성합니다. 모델은 정상 지표 동작을 나타내는 예상 값의 범위를 생성합니다.
> *AWS Document 내용 발췌*

간단하게 얘기하면, 지표의 CloudWatch 지표를 분석하여 예상 값의 범위를 밴드로 표시하고, 지표의 실제 값이 이 밴드를 초과하면 빨간색으로 표시해주는 기능입니다.

적용을 통해 확인해 보겠습니다. 적용 순서를 이미지로 나열해 보겠습니다.
![](https://cdn-images-1.medium.com/max/1024/1*erNymkdFQ5Zjnyp8EljmGw.png)1. 적용 지표의 View in metrics를 선택합니다.![](https://cdn-images-1.medium.com/max/1024/1*a5gvwxFlYFlpDOp5L74MOQ.png)2. 대상 지표의 anomaly detection을 활성화 합니다.![](https://cdn-images-1.medium.com/max/1024/1*q2r8Jt7MmHN_YeiDP3iWjA.png)3. 2개 DB의 DatabaseConnection 지표에 anomaly detection 적용이 완료되었습니다.![](https://cdn-images-1.medium.com/max/1024/1*kijPLmoZEBSCzeOxEnJcqw.png)3--2. anomaly detection이 적용된 상세 지표화면 입니다.\\

여기까지가 지표에 anomaly detection을 적용 완료한 상태로 이어서 Dashboard에도 적용 완료된 지표를 등록하면 작업이 완료됩니다.
![](https://cdn-images-1.medium.com/max/1024/1*OkDU_gPyzhxAO8x4ddiXlw.png)1. \[Actions\]-\[Add to dashboard\] 기능을 사용하여 등록![](https://cdn-images-1.medium.com/max/1024/1*BMjqqDWS7prnnXDxs7WATg.png)2. Dashboard를 선택 후 Add to dashboard를 클릭![](https://cdn-images-1.medium.com/max/1024/1*oQdQKL_N1gO3aoLL1QuLLg.png)3. Dashboard에 적용 완료!

#### 마치며

지금까지 나만의 Dashboard의 생성과 조금 더 편안한 모니터링을 위한 가로 주석과 이상탐지 두 가지 모니터링 보조 설정을 적용해 보았습니다.

물론 다양한 모니터링 솔루션이 많이 나와있지만, 자주 이용하는 AWS Console에서 제공하는 기능을 활용한 모니터링이 필요하신 분들에게 조금이라도 도움이 되었기를 바라며 글을 마치도록 하겠습니다.
긴 글을 읽어주셔서 감사합니다.

#### 참고

* <https://chat.openai.com/>
* <https://docs.aws.amazon.com/ko_kr/AmazonCloudWatch/latest/monitoring/CloudWatch_Anomaly_Detection.html>

![](https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=f1960e10f7b3)

*** ** * ** ***

[RDS 모니터링을 위한 나만의 CloudWatch Dashboard 만들기](https://medium.com/zigbang/rds-%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81%EC%9D%84-%EC%9C%84%ED%95%9C-%EB%82%98%EB%A7%8C%EC%9D%98-cloudwatch-dashboard-%EB%A7%8C%EB%93%A4%EA%B8%B0-f1960e10f7b3) was originally published in [직방 기술 블로그](https://medium.com/zigbang) on Medium, where people are continuing the conversation by highlighting and responding to this story.