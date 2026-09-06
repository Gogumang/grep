### 부제: CloudFront를 동적 콘텐츠에도 사용해보세요\~!

### CloudFront에 대한 고정관념

CloudFront에 대해 흔히 가지고 있는 두 가지 오해가 있습니다:

1. **정적 콘텐츠만의 영역**이라고 생각 하는점.

* HTML, CSS, JavaScript, 이미지, 미디어 파일과 같은 **정적 자원**을 빠르게 전송하기 위한 도구로만 인식
* 동적 콘텐츠 처리에는 부적합 하다는 편견

2. **캐싱**이 CloudFront의 주요 목적?

* CloudFront 사용의 주된 이유가 캐싱이라고 잘못 인식
* 캐싱을 사용하지 않으면 큰 이점이 없다고 생각

원티드 서비스 전반에 Cloudfront 적용하고 있습니다.
동적웹페이지, API 같은 동적 콘텐츠에도 사용하고 있습니다.
캐싱을 사용하지 않지만, 유의미한 성능/비용 개선을 이루었습니다.
원티드 서비스에 CloudFront를 적용한 내용을 시리즈로 글을 작성해 보려고 합니다.

이 글에서는 CloudFront를 사용했을때 자동으로 주어지는 장점에 대해서 소개 합니다.

### 1. 접속지점(PoP 또는 Edge)을 활용한 최적화

사용자와 서버는 **지리적으로** 가까울수록 속도는 빨라집니다.

#### ❌ Cloudfront 사용하지 않았을때:

![](https://cdn-images-1.medium.com/max/1024/1*SmpYJe-FQqLbanp-5oMLxQ.jpeg)

부산 사용자는 서울 사용자와 비교하여 **지리적으로 불리** 합니다.
부산 사용자는 서울 리전까지 요청이 가야 합니다.

#### ✅ Cloudfront 사용 했을때:

![](https://cdn-images-1.medium.com/max/1024/1*ElMkf_Z3iNP769uSuJN0zQ.png)

사용자와 가장 가까운 **접속지점(PoP / Edge)에 연결**이 됩니다.

그 다음, **Amazon Global Network (= AWS 전용 네트워크망)**를 통해 이동하는데, 이는 일반 인터넷에 비해 속도가 빠르고 성능이 뛰어납니다.

또한, **Connection 과정이 가까운 접속지점(PoP / Edge)에서 일어나기 때문에**, Connection 시간이 크게 단축 됩니다.

### 한국에 접속지점(PoP / Edge)가 몇개가 있을까?

AWS의 한국 내 엣지 로케이션(Edge Location)은 꾸준히 확장되어 왔습니다.
흥미로운 점은 공식 발표된 것보다 실제 운영되고 있는 엣지 로케이션이 더 많다는 사실입니다.
![](https://cdn-images-1.medium.com/max/1024/1*jRYIkkFuxXMvEvGqd4bdUQ.png)[*https://aws.amazon.com/ko/about-aws/whats-new/2018/02/amazon-cloudfront-launches-fourth-edge-location-in-seoul-south-korea/*](https://aws.amazon.com/ko/about-aws/whats-new/2018/02/amazon-cloudfront-launches-fourth-edge-location-in-seoul-south-korea/)

* 2018년: 네 번째 엣지 로케이션 추가 공지
* 이후 추가 확장에 대한 공식 발표는 없었음

"AWS Edge 스페셜리스트와의 미팅에서 확인한 결과, 현재 한국에는 **총 8개의 접속 지점(PoP/Edge)**이 운영되고 있습니다." (2024년 6월 기준)

AWS가 한국 시장에서 콘텐츠 전송 네트워크(CDN) 서비스의 품질 향상을 위해 지속적으로 투자하고 있음을 보여주는 좋은 예시입니다.

### 2. Amazon Global Network

사용자와 가장 가까운 접속지점(PoP / Edge)에 연결이 되면, **AWS Global Network를 이용하여 빠르게 오리진 원본서버로 요청을 전달**합니다.
![](https://cdn-images-1.medium.com/max/1024/1*0viga1st49PmNQ1kAac-eg.png)

#### ❌ Cloudfront 사용하지 않을때:

공용 인터넷 네트워크 사용하여 라우팅이 일어나게 됩니다.
경로가 변경될 수 있으며 여기저기서**패킷 손실과 혼잡**이 발생할 수 있습니다.

#### ✅ Cloudfront 사용할때:

공용 인터넷 대신**AWS 글로벌 네트워크**를 통한 트래픽 라우팅이 일어나며, 아래와 같은 성능 최적화가 일어납니다.

* 네트워크 지터 2배 감소
* 네트워크 대기 시간 30% 단축

> ***네트워크 지터*** *(Network Jitter)* ***란?*** *네트워크에서 데이터 패킷이* ***도착하는 시간의 불규칙성이나 변동*** *을 말합니다.*
> *예를 들어
> 버스를 기다리는 상황을 생각해 볼 수 있습니다.
> - 이상적인 상황: 버스가 정확히 10분 간격으로 도착
> - 지터가 있는 상황: 버스가 때로는 5분 일찍, 때로는 15분 늦게 도착*
> *네트워크에서도 이와 비슷합니다.
> - 패킷(데이터)이 불규칙한 시간 간격으로 도착
> - 이로 인해 통화 품질 저하, 비디오 끊김, 게임 지연 등이 발생*

### 지속적인 연결 (Persistent Connection Reuse)

접속지점(PoP / Edge)에서 오리진 서버로 지속적인 연결 유지되고, **한 번 만든 연결을 여러 사용자가 재사용** 할 수 있습니다. 새로운 연결 수립에 드는 시간과 비용 절감 되고, 전체 네트워크 성능 향상 도움이 됩니다.

### 3. HTTP Connection 과정 최적화

![](https://cdn-images-1.medium.com/max/1024/1*nNe33oeRlZxm33ilhL5W0Q.png)크롬 개발자도구 \> 네트워크 \> timing 탭

크롬 개발자도구에서 볼수 있는 HTTP Connection 과정에 정보입니다.

1. DNS Lookup: 클라이언트가 DNS 쿼리를 DNS서버로 보내고, IP주소를 응답 받습니다.
2. Connection: 클라이언트가 IP주소로 연결을 설정합니다.
3. SSL: 클라이언트와 서버가 안전한 암호화 연결을 위해 암호화 방식을 협상하는 과정 입니다.

### CloudFront 도입 후,

HTTP Connection전체 과정이 481ms에서 319ms로 단축되어**33.5%**성능이 개선 되었습니다.
![](https://cdn-images-1.medium.com/max/1024/1*ZJXVq-VxwtSH2dR88WjrIw.png)HTTP connection 성능 비교

세부 성능 분석 결과:

* **DNS Lookup** : 38.6ms에서 225ms로 변화했으며, 이는 사용자와 **가장 가까운 접속 지점(PoP 또는 엣지)**을 탐색하는 과정에서 발생한 지연으로 분석됩니다.
* **Connection**: 206ms에서 31.3ms로 획기적으로 개선되었습니다.
* **SSL Negotiation**: 236.6ms에서 63ms로 대폭 단축되었습니다.

특히 Connection과 SSL Negotiation 시간의 개선은 **지리적으로 가까운 접속 지점(PoP / Edge)과 HTTP/3**기술이 결합되어 달성된 결과로 보입니다.

### 4. HTTP/3: 최신 프로토콜 성능

![](https://cdn-images-1.medium.com/max/1024/1*Muc5bCpF4AJ867wfOakWJw.png)<https://aws.amazon.com/ko/blogs/korea/new-http-3-support-for-amazon-cloudfront/>

HTTP/3를 사용하면 위에서언급했던, HTTP Connection과정에서 **Connection** 과 **SSL Negotiation** 단계를 이 두 단계 과정을 최적화 할 수 있습니다.
![](https://cdn-images-1.medium.com/max/1024/1*ubHFjxoaCBHAWEF6dpvovw.png)CloudFront에서 HTTP/3 활성화 방법

### HTTP/3 + TLS1.3

CloudFront에서 HTTP/3를 활성화하면**TLS 1.3이 자동으로 적용**되어, 네트워크 통신의 성능과 보안을 동시에 강화할 수 있습니다.
![](https://cdn-images-1.medium.com/max/1024/1*eTNwOqMo-OhVIgPxdWq2UQ.png)http/3는 intial connection 과정을 최적화하고, TLS1.3은 SSL 과정을 최적화 합니다.

### Connection 과정의 왕복(RTT) 최적화

클라이언트와 서버 간 통신에서 연결 설정은 전통적으로 **여러 번의 왕복(Round Trip Time, RTT)을 필요** 로 했습니다. 이 **왕복 횟수를 줄이는 것**이 바로 네트워크 성능 최적화의 핵심입니다.

### 프로토콜별 연결 왕복 비교

![](https://cdn-images-1.medium.com/max/1024/1*Bsmd9iIAY0h3AJ80_Z-I6g.png)

* HTTP/2 + TLS 1.2 → 3회 (3 RTT)
* **HTTP/3 + TLS 1.3 → 1회 (1 RTT)**

HTTP/3와 TLS 1.3의 조합은 기존 HTTP/2와 TLS 1.2에 비해 연결 설정 시간을 크게 단축 시킵니다.

#### **HTTP/2의 Head-of-line Blocking 문제 극복**

> *Head-of-Line Blocking 이란?
> 한 줄로 선 사람들이 앞사람 때문에 뒷사람이 멈춰서야 하는 것과 비슷합니다. HTTP/2에서는 여러 요청을 하나의 TCP 연결을 통해 전송하는데, TCP 레벨에서 패킷 손실이 발생하면 모든 스트림이 영향을 받게 되는 현상을 말합니다.*
![](https://cdn-images-1.medium.com/max/1024/1*C1AvSeTLyGvIeMWl5mwKxA.png)

HTTP/3 해결책
- UDP 기반의 QUIC 프로토콜 사용
- 각 스트림이 독립적으로 처리
- 하나의 스트림에 문제가 생겨도 다른 스트림은 정상적으로 동작

### HTTP/3 Connection ID 연결유지 기능

![](https://cdn-images-1.medium.com/max/1016/1*bkzZJ0ENECPedZDxKUcpuQ.gif)[https://youtu.be/UMwQjFzTQXw?si=8_41A9mVvCvj58kp\&t=388](https://youtu.be/UMwQjFzTQXw?si=8_41A9mVvCvj58kp&t=388)

HTTP/2는 **사용자가 4G, 5G, Wi-Fi 등 서로 다른 네트워크가 전환 할때** 연결이 끊어집니다. 새 연결을 설정하려면 새로운 TCP(및 TLS) 핸드셰이크가 실행됩니다. 이때 일시적으로 지연이 발생하는 이유가 이 이유 때문입니다.

HTTP/3에서는 Connection ID를 사용하여 서버와 연결을 생성합니다.
Connection ID는 IP 주소에 의존하지 않아서 **사용자가 4G, 5G, Wi-Fi 등 서로 다른 네트워크가 전환 하더라도 연결을 유지** 합니다. IP 주소가 자주 변경되는 **모바일 환경에서 특히 유용**합니다.

자세한 내용은 아래 컨텐츠를 참고하세요.
[https://youtu.be/UMwQjFzTQXw?si=8_41A9mVvCvj58kp\&t=388](https://youtu.be/UMwQjFzTQXw?si=8_41A9mVvCvj58kp&t=388)

### 5. 비용 최적화

#### 오리진 전송비용 무료

Cloufront와 AWS 오리진(EC2, ELB, S3)사이에 발생된 트래픽 비용을 **기본적으로 면제**해줍니다.
![](https://cdn-images-1.medium.com/max/1024/1*9vcBURSJDrBtvkXe25ITgA.png)

### AWS MSP 파트너사와 함께하면 얻을 수 있는 혜택

AWS MSP(Managed Service Provider) 파트너사와 계약을 맺으면 다양한 혜택을 받을 수 있습니다.

#### 비용 절감 혜택

MSP 파트너사를 통해 AWS 서비스를 이용하면 다양한 요금 할인 혜택을 받을 수 있습니다. 특히 주목할 만한 것은 **CloudFront의 데이터 전송 비용 할인**입니다.

### CloudFront 데이터 전송 비용 할인

* AWS 공식 가격표에 **명시된 금액보다 더 큰 폭의 할인**을 받을 수 있습니다
* 트래픽이 많은 서비스를 운영하는 경우 상당한 비용 절감 효과를 기대할 수 있습니다

### 마무리

CloudFront, 더 이상 정적 콘텐츠만의 전유물이 아닙니다
지금까지 살펴본 내용을 통해, CloudFront가 단순히 정적 콘텐츠를 위한 CDN이 아닌,
동적 콘텐츠에서도 뛰어난 성능을 발휘할 수 있는 강력한 도구임을 확인했습니다.

1. **선입견 탈피**: CloudFront를 정적 콘텐츠용으로만 한정 짓지 마세요
2. **적극적 도입 검토**: 동적 콘텐츠에도 CloudFront 적용을 고려해보세요.
3. **최신 기능 활용**: HTTP/3 활성화로 추가 성능 개선을 도모해보세요.

CloudFront는 캐싱 유무와 관계없이, 모든 유형의 콘텐츠에서 성능과 비용 효율성을 제공할 수 있는 강력한 도구입니다. 여러분의 서비스에도 CloudFront를 적극적으로 도입해보시기를 추천드립니다.
![](https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=44f66701d1eb)

*** ** * ** ***

[CloudFront의 숨은 힘: 캐싱 없이도 극대화 되는 성능과 비용 효율성](https://medium.com/wantedjobs/cloudfront%EC%9D%98-%EC%88%A8%EC%9D%80-%ED%9E%98-%EC%BA%90%EC%8B%B1-%EC%97%86%EC%9D%B4%EB%8F%84-%EA%B7%B9%EB%8C%80%ED%99%94-%EB%90%98%EB%8A%94-%EC%84%B1%EB%8A%A5%EA%B3%BC-%EB%B9%84%EC%9A%A9-%ED%9A%A8%EC%9C%A8%EC%84%B1-44f66701d1eb) was originally published in [원티드랩 기술 블로그](https://medium.com/wantedjobs) on Medium, where people are continuing the conversation by highlighting and responding to this story.