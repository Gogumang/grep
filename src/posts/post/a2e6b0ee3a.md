안녕하세요. 오픈소스기술파트의 sean.gold입니다.

저는, 오픈소스기술파트에서 오픈소스 라이선스 검토와 OLIVE 개발을 담당하고 있습니다. 주로 백엔드 개발에서 의존성 분석 등의 업무를 수행하고 있습니다.

여기에서는 MIT, GPL 등 많이 알려져 있는 오픈소스 라이선스부터 최근 등장한 Elastic License까지의 변화의 흐름에 대해서 이야기하려고 합니다.

조금 더 자세하게는, 먼저 오픈소스기술파트 소개 및 오픈소스기술파트에서 오픈소스 라이선스를 검토하는 방법에 대해 사례를 중심으로 소개하겠습니다. 이후, 새롭게 등장한 Server Side Public License 및 Elastics License에 대한 설명 및 사용 시 주의사항에 대해 공유합니다. 마지막으로, 오픈소스 라이선스가 어떻게 변화하고 있는지에 대해 간략하게 소개하려고 합니다.

*** ** * ** ***

## **오픈소스기술파트**

먼저 제가 속한 오픈소스기술파트에 대해 소개하겠습니다.

![](https://images.gogumang.com/a2e6b0ee3a/01.png)

오픈소스기술파트는 카카오의 배포 프로젝트에 대한 오픈소스 검증 및 관리를 기본 업무로 합니다. 이를 위해 오픈소스 검증을 보다 쉽고 효율적으로 하기 위한 서비스인 OLIVE를 개발 및 관리하고 있습니다.

이외에도, 사내외 오픈소스 교육 및 외부 협업과 카카오에서 공개 중인 오픈소스 프로젝트에 대한 지원 및 관리를 담당하고 있습니다.

지난 6월 말에는 OLIVE를 정식 서비스로 출시했습니다. 이를 통해 GitHub 프로젝트를 가지고 있으면 누구나 오픈소스 라이선스 검증을 할 수 있습니다.
> ***OLIVE 플랫폼 ?*** [***https://olive.kakao.com***](https://olive.kakao.com)
>
> *“오픈소스 관리, 더 쉽고, 빠르고, 정확하게” 실시간 오픈소스 자동화 관리 서비스,*
>
> *OLIVE 플랫폼(Olive Platform)은 6월 30일 정식 출시되었습니다. 지난 11월 베타 버전으로 선보인 지 7개월 만입니다.*
>
> *OLIVE 플랫폼은 개발자가 등록한 깃허브(GitHub) 프로젝트를 분석해, 사용된 오픈소스의 라이선스, 의무사항을 확인하고 리포트를 제공해 주는 오픈소스 관리 서비스입니다. 카카오 계정으로 로그인하여 누구나 오픈소스 데이터를 등록해 무료로 사용할 수 있습니다.*

## **오픈소스기술파트에서 오픈소스 라이선스를 검토하는 방법**

오픈소스기술파트에서 어떻게 오픈소스 라이선스를 검토하고, 가이드를 제공하는지에 대해 사례를 중심으로 설명드리겠습니다.

### 사례 1: 이 오픈소스를 사용하고 싶어요. 사용해도 될까요?

개발자들이 사용하고자 하는 오픈소스의 이름, 출처, 라이선스, 유형, 수정 여부, 사용 방식, 배포 방식 등을 기재해 검토를 요청합니다.

예를 들어, WaterfallLayout이라는 오픈소스의 코드 일부를 가져와서 앱에서 사용해도 되는지에 대한 문의가 들어왔습니다. 이 오픈소스의 라이선스는 MIT입니다.

#### 라이선스 고지문 확인하기

라이선스를 확인했으면, 다음으로 해당 라이선스의 고지문을 확인해야 합니다. 오픈소스 라이선스 고지문은 보통 영어로 쓰여 있습니다. 한글 등 번역본은 법률적 해석에 있어 의미가 다를 수 있기 때문에 참고 용도로만 사용합니다.

MIT 라이선스의 경우, 다음과 같이 고지문 내용이 짧고, 영어 원문이 어렵지 않습니다.

**\[영어 원문\]**
> *Copyright*
>
> *Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:*
>
> *The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.*
>
> *THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*

**\[한글 번역본\]**
> *Copyright © \<연도\> \<저작권자\>*
>
> *이 소프트웨어의 복제본과 관련된 문서화 파일(“소프트웨어”)을 획득하는 사람은 누구라도 소프트웨어를 별다른 제한 없이 무상으로 사용할 수 있는 권한을 부여받는다. 여기에는 소프트웨어의 복제본을 무제한으로 사용, 복제, 수정, 병합, 공표, 배포, 서브라이선스 설정 및 판매할 수 있는 권리와 이상의 행위를 소프트웨어를 제공받은 다른 수취인들에게 허용할 수 있는 권리가 포함되며, 다음과 같은 조건을 충족시키는 것을 전제로 한다.*
>
> *위와 같은 저작권 안내 문구와 본 허용 문구가 소프트웨어의 모든 복제본 및 중요 부분에 포함되어야 한다.*
>
> *이 소프트웨어는 상품성, 특정 목적 적합성, 그리고 비침해에 대한 보증을 포함한 어떠한 형태의 보증도 명시적이나 묵시적으로 설정되지 않은 “있는 그대로의” 상태로 제공된다.*
>
> *소프트웨어를 개발한 프로그래머나 저작권자는 어떠한 경우에도 소프트웨어나 소프트웨어의 사용 등의 행위와 관련하여 일어나는 어떤 요구사항이나 손해 및 기타 책임에 대해 계약상, 불법행위 또는 기타 이유로 인한 책임을 지지 않는다.*
>
> 출처: <https://opensource.org/licenses/MIT>

MIT는 무료 사용이 가능하고, 복사, 수정, 배포가 자유로운 라이선스입니다. 또한, 소스 공개는 필요 없습니다. 다만, 사용 시에는 저작권 표시가 필수입니다. 저작권 표시는 라이선스 고지문 상단에 Copyright으로 표시하면 됩니다.

#### 추가 정보 확인하기

고지문을 통해 라이선스에 대한 의무사항이 확인되면, OLIS(한국저작권위원회, <https://www.olis.or.kr/>) 등을 통해 파악한 내용에서 다른 점은 없는지 또는 놓친 부분은 없는지를 한 번 더 확인합니다.

OLIS는 오픈소스 라이선스에 대한 다양한 자료 및 사례 등을 제공하고 있기 때문에 많은 도움을 받을 수 있습니다.

OLIS에서 MIT 라이선스에 대해 검색해 보면, 다음과 같이 다양한 의무 사항에 대해 알 수 있습니다.

![](https://images.gogumang.com/a2e6b0ee3a/02.png)

*출처: [https://olis.or.kr/license/Detailselect.do?lType=spdx\&lId=1006](https://olis.or.kr/license/Detailselect.do?lType=spdx&lId=1006)*

앞서 파악했던 복제, 배포, 수정의 권한 등이 허용되고, 저작권 고지 의무가 있는 것을 확인할 수 있습니다.

#### 가이드 제공하기

최종적으로 라이선스에 대한 의무사항이 확인되면, 오픈소스에 대한 사용 가이드를 제공하게 됩니다.

MIT의 경우 저작권 표시에 대한 의무만 있기 때문에 코드 등을 수정해 사용해도 됨을 안내했습니다.

이처럼 초기에는 MIT, BSD 등에 대한 오픈소스 사용 문의가 많았습니다. 그리고, 이러한 라이선스들에 대해서는 이미 라이선스 의무사항에 대한 검토가 충분히 됐고, 사용에 위험이 없는 라이선스로 확인되었습니다. 그래서 요즘에는 “MIT, BSD, Apache 등의 라이선스는 자유롭게 사용하고 배포 시 검증 요청”만 해도 된다고 안내하고 있습니다.

### 사례 2: 사용하려는 오픈소스가 GPL 같습니다. 사용해도 될까요?

오픈소스 사용 문의가 항상 MIT처럼 간단한 것만 들어오지는 않습니다. 가끔은 GPL 계열 라이선스가 적용된 오픈소스에 대한 사용 문의가 오기도 합니다. 예를 들면, libgnustl 라이브러리에 대한 사용 문의입니다.

#### 고지문 확인하기

libgnustl 라이브러리의 라이선스는 GPL v3로 추정됩니다. GPL 계열 라이선스는 GPL을 사용한 전체 서비스 및 앱의 소스코드를 모두 공개해야 하는 의무사항이 있습니다. 그래서 일단 문의 요청이 들어오면 긴장하게 됩니다.

GPL 라이선스도 MIT와 같이 라이선스 고지문을 먼저 확인합니다. 다만, GPL 라이선스의 고지문은 한 장, 두 장, 세 장 …… 아직도 더 남았습니다.

![](https://images.gogumang.com/a2e6b0ee3a/03.png)

*출처: <https://www.gnu.org/licenses/gpl-3.0.html>*

보시는 것처럼 고지문 내용이 매우 길고 조항도 많습니다. 고지문 내용도 법 관련 용어가 많아 해석이 쉽지 않습니다. 최선을 다해 읽어 봅니다.

#### 추가 정보 확인하기

그리고, 이럴 때 역시 OLIS가 많은 도움을 줍니다. OLIS에 정리되어 있는 의무사항을 기준으로 다시 전체 고지문에 대한 검토를 수행하고, 파트 내에서 라이선스 스터디도 진행합니다. 또한, 앞의 MIT 요청처럼 고지문을 확인하고, OLIS, GNU FAQ 등을 참고해 의무사항을 확인합니다.

#### 가이드 제공하기

libgnustl은 libstdc++로 확인이 되었고, GPL v3 GCC Runtime Library Exception 라이선스가 적용된 오픈소스였습니다. 이 라이선스 의무사항에는 Runtime Library Exception 예외 조항이 있습니다. 이 예외 조항에 의해, GPL이 아닌 프로그램과 라이브러리를 컴파일해서 사용이 가능했고, 이에 대한 사용 가이드를 제공했습니다.

오픈소스기술파트는 이러한 과정을 통해 라이선스 검토 문의에 대응하고 있습니다. 또한, 다양한 라이선스 검토와 스터디를 통해 계속해서 내부 역량을 향상시키고 있습니다.

## **새로운 라이선스의 등장**

최근에는 MIT, GPL 등 널리 알려진 라이선스가 아닌 새로운 라이선스들이 등장하고 있습니다. 기존에는 앱 개발자들이 오픈소스 라이선스에 대해 주로 문의했다면, 최근에는 인프라 개발자들로 바뀌고 있습니다. 라이선스 이슈가 더 이상 앱 개발자만의 문제가 아니라, 인프라 서비스에도 영향을 주고 있는 것입니다.

이처럼 새롭게 등장하는 라이선스들을 소개하고, 사용 시 주의사항에 대해서 설명드리겠습니다.

### 새로운 라이선스로의 변경 이력

먼저, 새로운 라이선스들의 변경 이력에 대해서 살펴보겠습니다.

![](https://images.gogumang.com/a2e6b0ee3a/04.png)

2018년 10월에 MongoDB가 AGPL v3.0 라이선스를 SSPL v1.0으로 변경했습니다. 이어서 2019년 11월에는 Sentry가 BSD 3-Clause에서 BUSL v1.1로 변경했습니다. 2021년 1월에는 Elasticsearch가 Apache v2.0에서 SSPL v1.1 또는 Elastic License v2.0으로 변경했습니다. 마지막으로 올해 4월에는 Grafana가 Apache v2.0에서 AGPL v3.0으로 변경했습니다.

#### 1. Grafana 라이선스 변경(Apache-\> AGPL)

AGPL 라이선스는, 기존 GPL 라이선스 의무사항에 더해, 네트워크로 서비스를 연결하는 클라이언트에게 소스코드를 공개해야 하는 의무사항이 추가된 라이선스입니다. 그렇기 때문에, GPL 라이선스보다 더 사용에 주의를 기울여야 합니다.

GLP의 경우, 다음 그림과 같이, 서버에서 GPL 라이선스가 적용된 오픈소스를 사용하고 이를 SaaS 등으로 서비스하는 경우에는 배포로 보지 않기 때문에 소스 공개 의무가 없습니다.

![](https://images.gogumang.com/a2e6b0ee3a/05.png)

AGPL은 이러한 GPL의 한계를 개선하기 위해, 네트워크로 클라이언트가 접근하는 경우 클라이언트에게 소스코드를 공개하는 의무사항을 추가했습니다. 즉, 서버에서 AGPL이 적용된 오픈소스를 사용해서 SaaS 등으로 서비스를 하게 되면 서버 쪽 소스 코드를 공개해야 합니다.

**- 고지문 확인하기**

AGPL이라는 새로운 라이선스가 등장했습니다. 앞서 설명한 라이선스 검토 절차에 따라 고지문 등을 검토하고 의무사항을 확인합니다. 또한, 라이선스가 변경된 배경에 대해서도 함께 확인하고 어떻게 대응해야 할지 대응 방안을 마련합니다.

**- 라이선스 변경 이유 확인하기**

Grafana는 2021년 4월에 라이선스를 변경한다고 공지했습니다.

라이선스가 변경 대상 프로젝트는 Grafana, Loki, Temp이고, 기존 Apache v2.0에서 AGPL v3.0으로 변경했습니다. 기존 플러그인 등 일부는 Apache v2.0을 그대로 유지하기로 했습니다.

Grafana에서 말한 라이선스 변경 이유를 요약하면 다음과 같습니다.

* 오픈소스 커뮤니티의 자유를 유지하면서, 소프트웨어를 수정해서 사용하는 다른 프로젝트에서도 기여를 장려하기 위함이다.

  **\[영어 원문\]**

  *Ensuring we maintain these freedoms for our community is a big priority for us. (중략) and we believe that adopting AGPLv3 allows our community and users to by and large have the same freedoms that they have enjoyed since our inception. (중략) Those conditions are designed to encourage third parties looking to modify the software to also contribute back to the project and the community. We think this is a fairer way forward, and one that we believe will help us build a stronger community.*

> 출처: <https://grafana.com/blog/2021/04/20/grafana-loki-tempo-relicensing-to-agplv3/>

기존에 적용된 Apache 라이선스의 경우 소스 코드 공개 의무가 없기 때문에 코드 수정을 해서 사용해도 수정된 코드를 공개할 의무가 없었습니다. 이를 AGPL로 변경하면서 자유로운 사용은 보장하고, 수정 사항 등에 대해서는 프로젝트에 다시 기여하게 하고자 했습니다.

**요약**

* Apache v2.0 적용 버전은 사용해도 이슈가 없다.
* AGPL v3.0이 적용된 버전을 사용해서 외부(제3자)에 서비스로 제공하면 소스 공개 등의 의무사항을 준수해야 한다.

#### 2. MongoDB 라이선스 변경(AGPL -\> SSPL)

**- 라이선스 변경 이유 확인하기**

MongoDB는 AGPL 라이선스로 배포되고 있었는데, 2018년 10월에 SSPL v1.0 라이선스로 변경하게 됩니다. 이와 관련해 MongoDB 블로그에 변경 사유가 기재되어 있었습니다. 내용을 간단히 요약하면 다음과 같습니다.

* AGPL 라이선스는 배포에 해당되면 서버 쪽 소스를 공개해야 하는 의무 사항이 있는데, 클라우드 서비스에서의 제공이 배포인지 아닌지가 논란의 소지가 있어, 이를 명확하게 하고자 함이다.

또한, 클라우드 서비스 업체가 오픈소스 커뮤니티에 기여는 하지 않고 대부분의 이익을 창출하고 있다고도 비판했습니다.
> 출처: <https://www.mongodb.com/blog/post/mongodb-now-released-under-the-server-side-public-license>

라이선스 변경 사유와 관련해서 MariaDB CEO는 클라우드 서비스가 Strip-Mining을 하고 있다는 표현을 사용했습니다. Strip-Mining은 땅을 파서 석탄 등 광물을 캐내기 위해 주변에 아무것도 남기지 않는 것을 의미합니다. 왜 MariaDB CEO는 Strip-Mining이라고 했을까요?

Strip-Mining에 대해 설명한 내용을 정리해 보면 다음과 같습니다.

* 첫 번째, AWS 등의 클라우드 서비스 제공자가 MongoDB와 같은 오픈소스를 가져다 플러그앤 플레이 형태로 제공하며 이를 통해 수익을 창출했습니다.
* 두 번째, MongoDB의 경우도 클라우드 서비스를 제공했지만, 클라우드 서비스에서는 MongoDB 이외에 다른 서비스들도 함께 제공했기 때문에 개발자들은 클라우드 서비스를 더 사용하게 되었습니다.
* 마지막으로 AGPL의 경우 소스코드 공개 등의 의무가 있지만, 이를 통해서 MongoDB의 수익 악화를 막을 수는 없었습니다. 클라우드 서비스에서 오픈소스를 사용하고 수정사항을 공개하면 되었기 때문입니다.

즉, Strip-Mining은 클라우드 서비스가 오픈소스 제품을 무료로 가져다 쉽게 사용하고 수익을 창출하지만, 오픈소스에는 기여를 하지 않는 것을 표현한 의미라고 볼 수 있습니다.
> 출처: <https://www.itweb.co.za/content/Kjlyrvwdrx47k6am>

그렇다면 MongoDB에서 변경한 SSPL v1.0 라이선스는 어떤 형태로 Strip-Mining을 막고자 했을까요?

**- 고지문 확인하기**

SSPL 라이선스의 특징을 살펴 보면 13조항에 다음과 같은 내용이 있습니다

* 서비스 코드를 실행하는데 필요한 모든 것에 대한 소스를 공개해야 한다.

  ***\[영어 원문\]***

  *13. Offering the Program as a Service.*

  *If you make the functionality of the Program or a modified version available to third parties as a service, you must make the Service Source Code available via network download to everyone at no charge, under the terms of this License. Making the functionality of the Program or modified version available to third parties as a service includes, without limitation, enabling third parties to interact with the functionality of the Program or modified version remotely through a computer network, offering a service the value of which entirely or primarily derives from the value of the Program or modified version, or offering a service that accomplishes for users the primary purpose of the Program or modified version.*

  *“Service Source Code” means the Corresponding Source for the Program or the modified version, and the Corresponding Source for all programs that you use to make the Program or modified version available as a service, including, without limitation, management software, user interfaces, application program interfaces, automation software, monitoring software, backup software, storage software and hosting software, all such that a user could run an instance of the service using the Service Source Code you make available.*

> 출처: <https://www.mongodb.com/licensing/server-side-public-license>

여기서 서비스 소스 코드는 프로그램뿐만 아니라 이를 관리하는데 필요한 모든 소프트웨어를 말합니다. 이는 MongoDB를 관리하기 위한 모니터링이나 백업용 관리 소프트웨어의 소스코드도 포함됩니다. 이를 통해서 클라우드 서비스에서 MongoDB를 서비스 시에는 원치 않는 부분에 대한 소스 코드도 공개하도록 강제화했습니다.
> 출처: <https://www.mongodb.com/licensing/server-side-public-license/faq>

**요약**

* MongoDB는 회사 내부에서만 사용하면 문제가 없다.
* MongoDB를 외부(제 3자)에 서비스로 제공하는 경우, 서비스 소스코드 전부를 공개해야 한다.

서비스 소스코드는 프로그램을 관리하기 위한 모든 소프트웨어를 포함합니다.

#### 3. Elasticsearch 라이선스 변경(Apache -\> SSPL, Elastic 듀얼)

**- 라이선스 변경 이유 확인하기**

2021년 1월 Elasticsearch와 Kibana의 라이선스가 기존 Apache v2.0에서 SSPL 또는 Elastic License의 듀얼 라이선스로 전환된다는 공지가 나왔습니다. 라이선스 변경 이유에 대해서는 블로그에 다음과 같이 설명했습니다.

* 기업들이 SaaS로 전환하고 클라우드 서비스들이 오픈소스를 사용하기만 하고 투자는 하지 않고 있다.

이는 앞서 Sentry나 MongoDB의 라이선스 변경 사유와 비슷하다고 볼 수 있습니다.
> 출처: <https://www.elastic.co/kr/blog/licensing-change>

**- 고지문 확인하기**

Elastic License는 SSPL과는 달리 매우 간단하게 작성이 되었습니다. 먼저 기존 오픈소스 라이선스가 가지는 소스 코드 수정, 사용, 배포 등에 대해서는 거의 모든 자유를 허용했습니다.

그리고 다음의 두가지 제약만 추가했습니다.

* 호스팅 등 서비스로 제3자에게 제공을 금지한다.

* 라이선스 키 등으로 보호되는 S/W 기능에 대한 변경을 금지한다.

  *\[영어 원문\]*

  *Limitations*

  *You may not provide the software to third parties as a hosted or managed service, where the service provides users with access to any substantial set of the features or functionality of the software.*

  *You may not move, change, disable, or circumvent the license key functionality in the software, and you may not remove or obscure any functionality in the software that is protected by the license key.*

  *You may not alter, remove, or obscure any licensing, copyright, or other notices of the licensor in the software. Any use of the licensor’s trademarks is subject to applicable law.*

  출처: <https://www.elastic.co/kr/licensing/elastic-license>

결과적으로, 일반 개발자들에게는 기존 오픈소스 라이선스 모델과 유사하게 제공하고, 클라우드 서비스 등 업체에서의 사용은 금지하는 효과를 만들었습니다.
> 출처: <https://sktelecom.github.io/blog/2021/20210328-elasticlicense/>

다음은 Elasticsearch의 라이선싱 정책입니다.

![](https://images.gogumang.com/a2e6b0ee3a/06.png)

7.10 이전 버전의 경우에는 Apache v2.0 라이선스가 유지됩니다. 하지만 7.11버전부터는 요금제에 따라 라이선스가 달라집니다. Free 요금제의 경우 SSPL 또는 Elastic 라이선스가 적용되고, Basic 요금제는 Elastic 라이선스만 사용 가능합니다.

**요약**

* Elasticsearch를 회사 내부에서만 사용하면 문제가 없다.
* Elasticsearch를 외부(제3자)에 서비스하는 경우 법무팀의 추가 검토가 필요하다.

#### 4. Sentry 라이선스 변경(BSD -\> BUSL)

Sentry는 2019년 11월에 BSD 3-Clause에서 BUSL v1.1로 라이선스를 변경했습니다. 라이선스 변경에 대해서 확인해 보니, 초기 Sentry 개발 시 라이선스에 대한 이해가 없어 단순히 BSD 3-Clause로 정했다고 합니다. 하지만 처음 시작과 달리, 지금은 100명 이상의 개발자를 고용해서 오픈소스 프로젝트를 진행하고 있어 수익 창출이 필요한 상황이었습니다. 그래서 Sentry는 다음과 같은 라이선스 변경 목표를 설정합니다.

* 누구나 자유롭게 Sentry를 실행할 수 있어야 하고, 클라우드 서비스와 오픈소스 제품 간의 차이가 없어야 한다.
* 코드는 최소한의 제한을 두고 누구나 자유롭게 사용해야 한다.
* 그리고 마지막으로 Sentry를 판매하는 다른 회사로부터 보호가 가능해야 한다.

결국 이 목표에 적합한 BUSL v1.1로 변경하게 됩니다.
> 출처: <http://monty-says.blogspot.com/2016/08/applying-business-source-licensing-bsl.html>

**- 고지문 확인하기**

BUSL v1.1 라이선스는 2016년에 MariaDB에서 만들어서 적용한 라이선스입니다. 소프트웨어 산업 전반의 자유와 혁신을 증가시키고, 기부에 의존하지 않는 지속적인 소프트웨어 개발을 위해서 만들어졌습니다.

BUSL v1.1 라이선스의 특징은 다음과 같습니다.

* 사용자는 자유롭게 소스를 수정하거나, 배포 및 컴파일이 가능하다.

* 상용 서비스 목적의 사용을 금지하고, 배포 후 특정한 시점이 지나면 Apache v2.0, GPL, AGPL 등의 라이선스로 변경된다.

  *\[영어 원문\]*

  *The Licensor hereby grants you the right to copy, modify, create derivative works, redistribute, and make non-production use of the Licensed Work. The Licensor may make an Additional Use Grant, above, permitting limited production use.*

  *Effective on the Change Date, or the fourth anniversary of the first publicly available distribution of a specific version of the Licensed Work under this License, whichever comes first, the Licensor hereby grants you rights under the terms of the Change License, and the rights granted in the paragraph above terminate.*

  *If your use of the Licensed Work does not comply with the requirements currently in effect as described in this License, you must purchase a commercial license from the Licensor, its affiliated entities, or authorized resellers, or you must refrain from using the Licensed Work.*

  출처: <https://mariadb.com/bsl11/>

예를 들어 Sentry v1.0 버전이 2021년 1월에 BUSL 라이선스로 배포되었다면, 3년 후인 2024년 1월부터는 Sentry v1.0 버전이 Apache v2.0 라이선스로 변경되어 상용 서비스를 할 수 있게 됩니다.

**요약**

* 10.0.0 버전은 BUSL이 적용되어 상용 서비스가 불가하다
* 9.1.2 버전은 BSD 3-Clause 라이선스이며 서비스 가능하다.

## **오픈소스 이후: 변화의 흐름**

오픈소스는 Free Software의 시작, 그리고 이어서 등장한 오픈소스 소프트웨어, 마지막으로 최근 이슈가 되고 있는 Shared Source Software의 등장으로 흐름이 변하고 있습니다.

Free Software는 1980년대 리처드 스톨만의 자유 소프트웨어 운동으로 만들어진 것으로, GNU 프로젝트가 여기에 해당됩니다. GNU 프로젝트에는 모두 GPL 계열 라이선스가 적용됩니다.

다음으로, 오픈소스 소프트웨어(Open Source Software)는 2000년경 등장했습니다. 오픈소스 소프트웨어는 Free 소프트웨어와 달리 소스코드 공개 등의 의무를 완화해서 자유롭게 사용하고 저작권 고지만 하면 되는 MIT 등의 라이선스를 채택했습니다. 이로 인해 오픈소스가 다양한 회사에서 채택됐고, 오픈소스 비즈니스로 빠르게 성장했습니다.

오픈소스 소프트웨어는 사용자에게 많은 자유를 주었지만, 오픈소스 프로젝트를 만들고 운영하는 오픈소스 커뮤니티에는 많은 이점을 제공하지 않았습니다. 또한, 앞서 설명드린 Strip-Mining 등에 의해 프로젝트 유지에 대한 위협도 받게 되었습니다.

이러한 부분을 개선하기 위해 2020년 경부 터는 Shared Source Software가 등장하게 되었습니다. 앞서 설명드린 MongoDB와 Elastic 등이 여기에 해당됩니다.

Shared Source Software는 오픈소스 프로젝트의 지적재산권은 보호하면서, 사용자가 소스코드를 자유롭게 사용할 수 있도록 제공하는 형태입니다. 여기에, 지적 재산권 보호 방식으로 상용 서비스를 제한하는 조항을 추가하였습니다.

이러한 차이로 인해 Shared Source Software는 오픈소스 소프트웨어와는 구별됩니다. 즉, Shared Source Software에 적용된 라이선스는 상용 서비스 금지와 같은 차별 조항으로 인해 오픈소스 라이선스로는 인정되지 않습니다.

앞으로 오픈소스 소프트웨어와 Shared Source Software는 계속해서 성장하게 될 것으로 예상됩니다. 또한, 기존의 오픈소스 소프트웨어가 경쟁자의 위협 등을 받게 되는 경우, Shared Source Software로 전환되는 사례가 계속해서 생겨날 것으로 보입니다.
> 출처: <https://monetize.substack.com/p/open-source-eras>