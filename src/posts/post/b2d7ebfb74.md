안녕하세요. LY Corporation에서 인증·인가 기반 Athenz의 개발·운영을 담당하고 있는 김정우입니다. 이 글에서는 AI 에이전트가 다양한 서비스와 연동할 때 발생하는 토큰을 관리하는 문제와 그 해결 방법으로 주목받고 있는 [Identity Assertion JWT Authorization Grant](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)(이하 ID-JAG)를 소개합니다.

## AI 시대의 과제

2026년 현재, AI의 패러다임은 단순한 채팅을 넘어 실제 업무를 수행하는 실행 중심으로 변화하는 추세입니다. 이제 AI 에이전트는 검색, 데이터베이스 조회, 메신저로 메시지 전송, 티켓 생성 등 조직 내 다양한 서비스를 마치 자신의 도구처럼 자유롭게 다루며 에이전트로 활약하는 사례가 늘고 있습니다.

하지만 에이전트가 연결해야 할 서비스가 늘어날수록 시스템 이면에서는 인증·인가를 위한 운영 비용이 늘어나고 시스템이 복잡해질 가능성이 있습니다. 그 결과, 업무 효율을 높이기 위해 도입한 AI가 복잡한 연동과 권한 설정 탓에 오히려 병목(bottleneck)이 되는 역설적인 상황이 발생하기도 합니다.

이 문제를 해결할 기술로 주목받고 있는 것이 IETF(Internet Engineering Task Force, 국제 인터넷 표준화 기구)의 [OAuth 워킹 그룹](https://datatracker.ietf.org/wg/oauth/documents/)에서 표준화를 논의하고 있는 ID-JAG입니다.

## ID-JAG의 등장

ID-JAG는 현재 Okta사가 중심이 되어 제안하는 새로운 인가 표준 초안입니다. 2024년 3월에 [개별 초안(individual draft)](https://datatracker.ietf.org/doc/draft-parecki-oauth-identity-assertion-authz-grant/00/)으로 처음 공개된 후 논의하며 다듬는 과정을 거쳐 2025년 6월 23일에 Okta사가 공식적으로 지지하는 차세대 표준 후보로 발표됐습니다([참고](https://www.okta.com/newsroom/articles/understanding-the-ai-agent-identity-challenge/)). 현재는 단순한 초안을 넘어 업계가 주목하는 차세대 유망 프로토콜로 자리 잡으며 관련 생태계 논의가 활발히 진행 중입니다. 특히, 최근 AI 생태계에서 주목받고 있는 [Model Context Protocol(MCP)의 엔터프라이즈 권한 부여 문서](https://github.com/modelcontextprotocol/ext-auth/blob/main/specification/stable/enterprise-managed-authorization.mdx)에서도 기존 기업 IdP(identity provider)를 통한 중앙 집중형 접근 제어를 정리하는 방법으로 ID-JAG를 언급할 정도로 실제로 운영할 수 있는 생태계를 구축하려는 움직임이 보이고 있습니다.
> 참고: 이 글을 최초 발행한 시점에는 해당 MCP 문서가 드래프트 상태였으나, 2026년 6월 스테이블(stable) 버전으로 업데이트돼 링크와 문구를 수정했습니다.

이에 본 글에서는 ID-JAG의 개념부터 핵심 이점 및 주의 사항을 상세히 정리해 보겠습니다.

## ID-JAG란?

결론부터 말씀드리자면, ID-JAG는 싱글 사인온(SSO)의 신뢰 모델을 'API 접근' 영역으로 확장하는 사양입니다. IETF의 공식 드래프트에서는 ID-JAG의 목적을 다음과 같이 설명하고 있습니다.
> "\[ID-JAG\] can be used to extend the SSO relationship of multiple SaaS applications to include API access between these applications as well... The same enterprise IdP that is trusted by applications for SSO can be extended to broker access to APIs." --- [Appendix A.1. Enterprise Deployment - draft-ietf-oauth-identity-assertion-authz-grant-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

이를 한 마디로 요약하면 다음과 같습니다.

지금까지 SSO를 통해 확립해 온 IdP에 대한 신뢰를 앱 간, 또는 에이전트와 서비스 간의 API 접근에도 적용해 어떤 앱이 어떤 앱의 API에 어떤 권한으로 접근할 수 있는지를 IdP 측의 중앙 정책으로 일원화해 관리하는 것을 목표로 합니다.

기술 관점에서 살펴보면 아래 두 가지 기존 RFC 사양을 결합합니다.

* [OAuth 2.0 Token Exchange（RFC 8693）](https://datatracker.ietf.org/doc/html/rfc8693)
* [JWT Profile for OAuth 2.0 Authorization Grants（RFC 7523）](https://datatracker.ietf.org/doc/html/rfc7523)

즉, IdP가 서명한 검증 가능한 JWT를 일종의 '소개장'으로 발행하고, API 리소스 측이 이 소개장을 신뢰해 최종 액세스 토큰을 발행하는 흐름입니다.

### 등장 인물로 알아보는 ID-JAG 작동 원리

ID-JAG의 전체적인 작동 원리를 이해하기 위해 ID-JAG의 [Section 2.1. Roles의 정의](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)에 따라 작동 흐름에 등장하는 주체, 즉 등장 인물을 다음 네 가지로 정의해 보겠습니다.
![id_jag_characters](https://images.gogumang.com/b2d7ebfb74/01.png) ID-JAG 등장 인물(AI 생성 이미지)

* 요청 에이전트(Requesting Agent): 다른 앱의 API를 호출하려는 AI 에이전트 또는 애플리케이션
* 기업 IdP(Enterprise IdP): 사내 SSO를 제공하고 중앙 인가 정책을 보유한 기업의 IdP
* 인가 서버(Authorization Server): 호출 대상 앱의 인가 서버
* 리소스 서버(Resource Server): 실제로 호출되는 API

위와 같이 정의한 등장 인물의 역할에 기반해 이 넷이 서로 어떻게 연계해 안전하게 API를 호출하는지 구체적인 흐름을 살펴보겠습니다.

### ID-JAG의 기본 흐름

기본적으로 다음 그림과 같이 5단계로 진행됩니다.
![id_jag_flow](https://images.gogumang.com/b2d7ebfb74/02.png) ID-JAG 기본 흐름(일부 AI 생성 이미지)

1. SSO 로그인: 사용자가 요청 에이전트에 로그인하면 요청 에이전트가 IdP에서 ID 토큰을 획득합니다.
2. 토큰 교환 요청: 요청 에이전트가 IdP에 ID 토큰을 제시하고 토큰 교환을 요청하며 발급받을 토큰 타입으로 ID-JAG를 지정합니다(RFC 8693).
3. 정책 평가 및 응답: IdP가 조직의 관리자 정책을 평가해 허용하면 요청 에이전트에게 ID-JAG를 반환합니다.
4. 액세스 토큰 교환: 요청 에이전트가 발급받은 ID-JAG를 인가 서버에 제시하고 최종 액세스 토큰을 획득합니다(RFC 7523).
5. API 접근: 요청 에이전트는 발급받은 액세스 토큰을 사용해 리소스 서버를 호출합니다(RFC 6749).

여기서 주목할 부분은 허가 판단 시점이 요청 에이전트와 리소스 서버 간의 개별 관계가 아니라 조직이 관리하는 기업 IdP와 인가 서버 간의 관계로 이동했다는 점과, 그 결과물인 ID-JAG가 암호학으로 검증 가능한 JWT라는 점입니다.

## ID-JAG 도입이 조직에 가져올 이점

ID-JAG의 도입이 단순한 프로토콜 변화를 넘어 실제 기업 환경이나 엔지니어링 조직에 어떤 이점을 가져올 수 있는지 살펴보겠습니다.

### 사용자 경험 개선

먼저, 가장 이해하기 쉬운 이점은 사용자 경험 개선입니다. 기존에는 다음 그림과 같이 앱을 연동할 때 사용자가 동의 화면(consent screen)에서 직접 권한을 허용해야 하는 상황이 자주 발생했습니다.
![no_more_user_consent](https://images.gogumang.com/b2d7ebfb74/03.png) 사용자가 동의 화면에서 직접 권한을 허용해야 하는 기존 방식(일부 AI 생성 이미지)

하지만 ID-JAG 개념에서는 허가 판단 절차를 IdP의 관리자 정책에 통합할 수 있습니다. 특히 AI 에이전트 맥락에서는 도구가 늘어날수록 사용자 동의 팝업 화면도 함께 늘어나는 문제가 발생하기 쉬운데 이 문제를 완화할 수 있을 것으로 기대합니다.
> "\[The Resource Authorization Server\] does not need obtain user consent directly from the resource owner." --- [4.1. Overview - draft-ietf-oauth-identity-assertion-authz-grant-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

이와 같은 사용자 경험 측면의 이점에 더해 조직 전체로는 주로 다음 두 가지 관점에서 이점이 있을 것이라고 생각합니다.

### 보안 감사(audit)를 위한 가시성 확보

IdP가 발행하는 ID-JAG는 어떤 대상(audience)과 범위(scope)를 어떤 주체에게 허용했는지를 명확히 다룹니다. 따라서 조직 내 서비스 간 복잡한 연결이 IdP를 경유하는 구조라면 연결 관계가 IdP 측으로 집중됩니다. 이를 통해 복잡한 연결 관계를 흩어져 있는 각 서비스를 하나하나 살펴보며 파악하는 것이 아니라 IdP에서 ID-JAG 발급 로그를 확인해 파악할 수 있습니다. 또한, 단순히 어떤 앱이 토큰을 가지고 있는지를 넘어 누구를 대신해 어떤 에이전트가 어느 범위로 접근했는지 관련 컨텍스트를 토큰에 저장할 수 있습니다.

다음은 기업 IdP가 발행하는 ID-JAG 샘플입니다. 각 필드의 의미를 주석으로 기재했습니다.

    {
        "sub": "sample-human-user", // scp(Scope)에 대해 원래의 권한을 보유하고 있는 주체
        "client_id": "ai-agent", // 위를 대신하여 접근을 요청하는 요청 에이전트의 정보
        "aud": "https://authorization.sample.server/v1", // 어떤 인가 서버로
        "scp": "api-writers api-readers", // 어떤 범위·권한으로
        "iss": "https://enterprise.idp.sample.server/v1", // 기업 IdP 자신
        "exp": 1773839486, // 이 ID-JAG의 유효 기간
        "iat": 1773825086, // 이 ID-JAG의 발행 시각
        "jti": "abcabca-7dc6-42ab-b326-27eb23ecfd8b", // 이 ID-JAG의 고유 ID
        // ...
    }

ID-JAG 발행 이벤트가 기업 IdP를 중심으로 모이면, 보안 사고 발생 시 책임 소재를 파악하기도 쉬워집니다. 나아가 각종 컴플라이언스 요건을 충족하는지 감사하고 추적하기 위한 데이터를 IdP에서 비교적 쉽게 추출하고 증명할 수 있게 된다는 점도 중요합니다.
> The IdP can then issue tokens that contain the necessary context about both the human user and the AI agent, facilitating secure delegation and maintaining a clear audit trail across systems. --- [Cross App Access: Securing AI agent and app-to-app connections - Okta, Inc.](https://www.okta.com/identity-101/cross-app-access-securing-ai-agent-and-app-to-app-connections/)

### 리스크를 억제할 수 있는 중앙 통제 구조 수립

조직 내 사용자가 IT 부서의 승인을 받지 않은 AI 도구를 임의로 연동해 회사 데이터를 다루는 '섀도우 AI' 문제는 데이터 유출 리스크를 낳습니다. ID-JAG 체계에서는 IdP가 해당 도구의 승인 여부를 중간에서 판단하기 쉬워지기 때문에 그동안 파악하기 어려웠던 외부 AI에 연결하려는 시도를 정상 통제 프로세스 안으로 편입시켜 통제할 수 있을 것으로 기대됩니다.
> "\[As AI agents\] proliferate, organizations need clear visibility into their access rights and granular control of the authorization process to be able to trust that agents will operate without compromising security and compliance." --- [Okta Newsroom (Jun 23, 2025)](https://www.okta.com/newsroom/articles/understanding-the-ai-agent-identity-challenge/)

또한 기업 IdP로 토큰 교환 요청이 집중되기 때문에 이곳에서 각 토큰 교환 요청의 정책을 일관된 기준으로 평가하고, 최종적으로 허용할 범위를 결정할 수 있습니다. 즉, AI나 외부 앱이 요구하는 범위와 조직이 실제로 허용하는 범위를 분리해 조직의 보안 기준에 맞춰 권한을 덮어쓰고 통제할 수 있는 안전망이 생겨납니다.
> "If scope is present, the IdP MUST process it according to Section 3.3 of \[RFC6749\] and evaluate policy to determine the granted scopes." --- [4.3.2. Processing Rules - draft-ietf-oauth-identity-assertion-authz-grant-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

이러한 전제가 있기 때문에 부정 접근, 비용 문제, 컴플라이언스 위반 등 연결을 차단해야 하는 상황이 발생했을 때도 각 엔드포인트를 일일이 찾아다니며 제어하는 수고를 덜고, 신규 토큰 발행 판단을 IdP 측으로 일원화하기 쉬워집니다.

또한 AI 에이전트 도입 시 보안 팀을 괴롭히는 주요 골칫거리 중 하나는 API 키, 리프레시 토큰, 서비스 계정의 인증 정보가 증식하는 '토큰 스프롤(token sprawl)' 현상입니다. ID-JAG 사양에서는 리소스 서버가 별도의 리프레시 토큰을 발행하는 것이 아니라, 클라이언트가 ID-JAG를 다시 제출해 액세스 토큰을 갱신할 것을 권장하고 있습니다. 이를 통해 시스템 곳곳에 흩어져 있던 장기 인증 정보를 프로토콜 기반의 동적인 신뢰로 대체할 수 있습니다.
> The Resource Authorization Server SHOULD NOT return a Refresh Token when an Identity Assertion JWT Authorization is exchanged for an Access Token --- [4.4.3. Refresh Token - draft-ietf-oauth-identity-assertion-authz-grant-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

## ID-JAG 도입 시 주의 사항

현시점에서 ID-JAG는 아직 IETF의 인터넷 초안인 상태로 RFC로 최종 확정된 사양이 아닙니다. 향후 논의에 따라 작동 방식이 변경될 가능성이 있으므로, 현재 사양에 핵심 아키텍처를 강하게 결합(tightly coupled)하는 것은 위험합니다.

이런 상황을 염두에 두고 ID-JAG 도입 시 고려해야 할 사항을 살펴보겠습니다. 엔터프라이즈 배포 및 엔터프라이즈 도구를 활용하는 LLM 에이전트 사용 사례를 전제로, ID-JAG 사양에서 요구하는 전제 조건과 구현 및 운영 측면에서 고려해야 할 사항으로 나눠 정리하겠습니다.

### 사양에서 요구하는 전제 조건 확인

실제 시스템에 ID-JAG를 도입하려면 초안에 명시된 다음 전제 조건을 검토해야 합니다.

* 요청 에이전트는 기업 IdP와 인가 서버 양쪽에 OAuth 2.0 클라이언트로 등록되어 있어야 합니다.
* 기업 IdP와 요청 에이전트, 기업 IdP와 인가 서버 간에 명시적인 신뢰 관계를 사전에 확립해 두어야 합니다.
* 기업 IdP는 기업 정책에 따라 요청 에이전트에 대해 인가 서버에 접근하기 위한 범위를 사전에 부여해 두어야 합니다.

> "The Client has a registered OAuth 2.0 Client with the IdP Authorization Server. The Client has a registered OAuth 2.0 Client with the Resource Authorization Server. Enterprise has established a trust relationship between their IdP and the Client for SSO and Identity Assertion JWT Authorization Grant. Enterprise has established a trust relationship between their IdP and the Resource Authorization Server for SSO and Identity Assertion JWT Authorization Grant. Enterprise has granted the Client permission to act on behalf of users for the Resource Authorization Server with a set of scopes" --- [A.1.1. Preconditions - draft-ietf-oauth-identity-assertion-authz-grant-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

또한 ID-JAG를 이용하더라도 시스템 간의 논리적인 책임 경계는 유지해야 합니다. 권한이 의도치 않게 확대되는 것을 막기 위해서 적어도 기업 IdP가 스스로 발행한 ID-JAG에 대한 액세스 토큰을 발행하는 주체가 되도록 구성해서는 안 됩니다. 물리적 혹은 제품 관점에서 통합된 환경을 이용한다고 하더라도 자체 발행·자체 교환 흐름으로 구성하는 것은 ID-JAG 사양에서 안전성을 확보하기 위해 전제하는 기반과 어긋납니다.
> "Identity Provider MUST NOT issue access tokens in response to an ID-JAG it issued itself. Doing so could lead to unintentional broadening of the scope of authorization." --- [8.3 Cross-Domain Use - draft-ietf-oauth-identity-assertion-authz-grant-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

### 구현 및 운영 측면에서 고려해야 할 사항 확인

보안을 위해 시크릿 값을 안전하게 보관할 수 있는 기밀 클라이언트(confidential client)를 사용하는 것을 권장합니다. 모바일 단독 앱과 같은 공개 클라이언트(public client)에서는 기존과 같이 사용자와 상호작용하며 동의를 받는 인가 코드 승인(authorization code grant)을 이용하는 것을 권장합니다.
> "\[ID-JAG\] SHOULD only be supported for confidential clients. Public clients SHOULD use the existing authorization code grant and redirect the user to the Resource Authorization Server with an OAuth 2.0 Authorization Request where the user can interactively consent to the access delegation." --- [8.1 Client Authentication - draft-ietf-oauth-identity-assertion-authz-grant-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

실행 시에는 기업 IdP가 주체 토큰의 보안 컨텍스트를 분석한 뒤 정책에 따라 추가 인증을 요구하기도 합니다. 따라서 오류를 처리하고 사용자에게 다시 인증하라고 요구하는 제어 로직을 설계에 포함해야 할 수 있습니다.
> "The IdP may require step-up authentication for the subject if the authentication context in the subject's assertion does not meet policy requirements. An insufficient_user_authentication OAuth error response may be returned to convey the authentication requirements back to the client similar to OAuth 2.0 Step-up Authentication Challenge Protocol \[RFC9470\]." --- [8.2 Step-up Authentication - draft-ietf-oauth-identity-assertion-authz-grant-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

또한 운영할 때에는 시스템을 분리하는 구조의 특성을 고려할 필요가 있습니다. ID-JAG는 JWT 형식이므로 한 번 발행돼 네트워크에 전파된 토큰을 중앙에서 즉시 무효화하기는 어렵습니다. 효과적으로 차단하기 위해서는 ID-JAG의 유효 기간을 짧게 설정하고 자주 갱신하도록 유도하는 메커니즘을 도입하는 등의 방법을 토큰 수명 설계와 함께 검토해 나갈 필요가 있습니다.

## 마치며

IT 환경을 대폭 바꿔나가고 있는 AI 에이전트 도입은 '각 에이전트의 권한을 어떻게 안전하고 효율적으로 통제할 것인가'라는 새로운 과제를 남겼습니다. 인증·인가 패러다임은 엔드포인트마다 개별로 토큰을 관리하는 방식에서, 신뢰할 수 있는 연결을 판단하고 제어하는 작업을 IdP를 중심으로 중앙에서 수행하는 방식으로 이동하는 추세입니다. 이런 맥락에서 IETF의 초안으로 활발히 논의되고 있는 ID-JAG는 유효한 선택지가 될 수 있습니다.

최근에는 저희의 오픈소스 권한 관리 플랫폼인 [Athenz](https://www.athenz.io/)도 이 흐름에 맞춰 ID-JAG를 공식 지원하기 시작했습니다([참고](https://github.com/AthenZ/athenz/blob/master/docs/zts_token_exchange_requirements.md)). 물론 토큰의 수명 관리나 사전 설정 등 기술 관점에서 고려해야 할 제약 사항이 있지만, ID-JAG를 도입한 Athenz를 활용하면 서비스의 안정성을 유지하면서도 AI 생태계의 광대한 확장성을 온전히 수용하는 강력한 기반을 구축할 수 있을 것입니다. LY Corporation은 앞으로도 글로벌 표준화 동향과 오픈소스 생태계를 지속적으로 주시하며, 개발자 경험과 보안 양쪽을 모두 고려한 적절한 기반을 현장에 적용해 나가겠습니다.

[다음 블로그](https://techblog.lycorp.co.jp/ko/id-jag-the-hard-way-learning-ai-agent-authz-through-failure)에서는 Athenz와 오픈 소스 IdP를 사용해 ID-JAG를 발행하고, 실제로 AI와 어떻게 연동해 작동시킬지 핸즈온 기사를 전해드릴 예정입니다. 많은 기대 바랍니다.

이 저자의 다른 글 보기

* [Athenz 엔지니어는 왜 Kubestronaut에 도전했는가?](https://techblog.lycorp.co.jp/ko/why-did-an-athenz-engineer-take-on-the-kubestronaut-challenge)