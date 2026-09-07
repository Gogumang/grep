안녕하세요, 뱅크샐러드 웹 프론트엔드 챕터의 민찬기입니다.

gRPC는 마이크로서비스간 호출에 많이 사용되는 통신 프로토콜로, 개발자 생산성 향상 및 빠른 통신 속도를 지원하여 많은 어플리케이션에서 사용하고 있습니다. 뱅크샐러드도 마이크로서비스 아키텍쳐로 전환하여 서비스 간 통신에 gRPC를 적극적으로 사용하고 있습니다.

뱅크샐러드는 프론트엔드 (web, android, ios) 플랫폼에서 서비스를 호출할 수 있도록 gRPC의 각 메시지를 HTTP 핸들러로 변환하여 외부에 노출할 수 있는 grpc-gateway를 쓰고 있으며, 프론트엔드 플랫폼에서는 HTTP 호출을 통해 간접적으로 gRPC 메시지를 소비하고 있습니다.

gRPC-Gateway는 protobuf compiler (protoc) 위에서 동작하는 플러그인으로, `.proto` 파일에 HTTP proxy에 대한 추가 내용을 작성하면 자동으로 reverse-proxy 역할을 하는 서버 코드를 생산해 줍니다. HTTP를 사용하는 곳에는 reverse proxy 서버에 HTTP 호출을 하면 json으로 포멧팅된 결과를 받을 수 있습니다.
![gRPC-Gateway 아키텍처](https://blog.banksalad.com/35fd5aded1ca4948bbfe05fd463f02a7/architecture_introduction_gprc-gateway.svg) Figure 1 \| [gRPC-gateway 다이어그램](https://github.com/grpc-ecosystem/grpc-gateway)

따라서 개발자가 IDL 레포지토리에 `.proto` 파일을 선언할 때, gRPC-Gateway가 활용 가능한 정보를 같이 추가하여 RESTful 호출을 지원하고 있습니다.

    syntax = "proto3";
    package your.service.v1;
    option go_package = "github.com/yourorg/yourprotos/gen/go/your/service/v1";

    import "google/api/annotations.proto";

    message StringMessage {
      string value = 1;
    }

    service YourService {
      rpc Echo(StringMessage) returns (StringMessage) {
        option (google.api.http) = {
          get: "/v1/example/echo" // k8s inter-cluster 에서 호출 가능한 엔드포인트
          additional_bindings: {
            get: "/external/example/echo" // k9s cluster 밖 (사용자 기기 등)에서 호출 가능한 엔드포인트
          }
        };
      }
    }

> 뱅크샐러드의 gRPC 인프라에 대한 내용은 이 블로그의 [프로덕션 환경에서 사용하는 golang과 gRPC](https://blog.banksalad.com/tech/production-ready-grpc-in-golang) 아티클을 참고해 주세요!

## 점점 늘어나는 유지비용

이리하여 gRPC 서비스에 대한 HTTP API 호환이 가능했고, 웹 개발자는 axios 등 다양한 HTTP 클라이언트 라이브러리를 사용하여 마이크로서비스를 활용해 왔습니다. 하지만 점점 프론트엔드 어플리케이션이 많아지고 마이크로 서비스와 각 서비스의 메시지가 늘어나면서 아래와 같은 문제점들이 생겼습니다.

### HTTP 클라이언트 코드가 너무 많이 중복되고, 반복적인 작업이 되어감

프론트엔드 개발자는 서비스를 호출하기 위해 아래와 같이 HTTP 클라이언트를 작성해야 했습니다.

    const ECHO_SERVICE_PATHS = {
      ECHO: '/example/echo',
    } as const;

    const enum NamespaceEnv {
      PRODUCTION = 'production',
      STAGING = 'staging',
    }

    const isNamespaceProduction = () =>
      process.env.NEXT_PUBLIC_현재_환경 === NamespaceEnv.PRODUCTION;

    const API_BASE_URL = isNamespaceProduction()
      ? '프로덕션 api 도메인' as const
      : '스테이징 api 도메인' as const;

    export const echo = async () => {
      const data = await fetch(`${API_BASE_URL}${ECHO_SERVICE_PATHS.ECHO}`, {
        headers: {

        },
      }).then(res => res.json());

      return data;
    };

호출해야 하는 서비스가 많아지고, 프론트엔드 챕터에서도 마이크로 프론트엔드 아키텍쳐를 적용하게 되면서 중복되는 API 호출 코드가 레포지토리 여기저기에 흩어지게 되었습니다. 이 문제를 해결하기 위해 [ts-proto](https://github.com/stephenh/ts-proto)를 활용하여 API 요청/응답 타입 생성을 자동화했습니다.

추가로 api 호출부를 별도 npm 패키지로 분리하려 했지만 개발자가 신규 API를 사용하기 위해서 라이브러리를 수정하고, 코드 리뷰를 받고, 배포된 라이브러리를 서비스 개발 브랜치에 설치해서 작업해야 하는 비효율이 예상되어 실현하기 어려웠습니다.

### External endpoint 호출 시 IPS 성능 부하 및 비용 증가

external domain인 `~~~.banksalad.com` 을 사용하도록 클라이언트 코드를 작성하면 browser 및 Next.js 서버에 양 측에서 간편하게 사용할 수 있었기 때문에 모든 클라이언트 코드에서 `~~~.banksalad.com`을 호출하게 작성하는 경우가 많았습니다. 또한 토큰 관리의 어려움 및 빠른 개발을 위해 server side render를 활용하지 않고 사용자 브라우저에서 필요한 모든 API 호출을 하는 서비스가 많았습니다.

뱅크샐러드는 사용자 여러분들의 데이터를 안전하게 지키기 위해 external 호출은 모두 IPS(침입 차단 시스템)을 거치도록 인프라 구성이 되어 있습니다. 따라서 웹 페이지를 제공하기 위해 external domain을 사용했기 때문에 IPS에 많은 부하가 발생하는 결과를 낳았습니다. 이를 해결하기 위해 server side render를 활용하더라도 IPS를 거쳐가는 network hop이 발생했으며, 이로 인해 server side render의 장점 중 하나인 `호출할 서비스, DB와 가까운 네트워크에 있음`을 전혀 활용하지 못하게 되었습니다.
![Opentrace Flame Graph](https://blog.banksalad.com/static/a6ee69f8266ec28bef7e3ad64d297dcf/663f3/k8s-service-discovery-diagram.png "Opentrace Flame Graph") Figure 2 \| k8s pod 상호간 통신시 dns별 네트워크 호핑

> 위 도식은 이해를 돕기 위해 매우 단순화되었습니다. kubernetes의 dns lookup에 대한 더 자세한 설명은 [공식 문서](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/) 및 [dns resolve 동작을 설명하는 블로그](https://www.nslookup.io/learning/the-life-of-a-dns-query-in-kubernetes/)를 참고해 주세요

## 요구사항 정리 및 계획

이러한 문제를 해결하기 위해 아래와 같이 요구 사항을 정리했습니다.

1. proto file을 기반으로 gRPC-Gateway proxy를 호출하는 HTTP 클라이언트 코드가 자동 생성된다. (이때 최소한 [Unary RPC](https://grpc.io/docs/what-is-grpc/core-concepts/?ref=breezymind.com#unary-rpc) 를 지원한다.)
2. 자동 생성된 코드는 Type-Safty가 보장되어야 한다.
3. 코드 생성기 구현/유지 보수가 간편해야 한다.
4. 호출자가 클러스터 내부에 있다면 internal domain으로 호출할 수 있어야 한다.

이러한 요구 사항을 만족하기 위해 [@bufbuild/protoplugin](https://www.npmjs.com/package/@bufbuild/protoplugin)으로 코드 생성기를 구현하여 [buf cli](https://github.com/bufbuild/buf)로 빌드하기로 결정하였습니다.

### buf가 뭔가요?

buf는 한 `.proto` 파일을 여러 플랫폼 및 형식으로 변환하는 과정을 쉽게 만들어주는 도구입니다. `.proto` 파일은 서버-클라이언트 간 주고 받을 메시지의 명세만 적혀 있고, 이 명세를 어떻게 사용하는지에 대한 구현이 들어가 있지는 않은데요. `.proto` 파일을 런타임에서 사용하기 위해서는 컴파일을 거쳐 Stub과 Runtime을 생산해야 합니다.

이를 위해서는 `protoc` cli를 사용해서 아래와 같이 쉘 스크립트를 작성할 수 있습니다.

    protoc -I=$SRC_DIR --go_out=$DST_DIR $SRC_DIR/addressbook.proto

하지만 다양한 플랫폼에서 gRPC를 사용하고, lint와 breaking change를 잡아내려 하다 보면 쉘 스크립트만으로는 관리가 어려워지게 됩니다. `buf cli`는 이런 상황을 해결하기 위해 나온 툴체인으로, 아래와 같이 `.yaml` 파일을 통해 간편히 설정을 관리할 수 있고, `protoc-gen-*` plugin를 포함한 다양한 plugin을 쉽게 사용할 수 있도록 도와줍니다.

    version: v1
    plugins:
      - name: go
        out: gen/go
      - name: go-grpc
        out: gen/go
      - name: grpc-gateway
        out: gen/go
      - name: java
        out: gen/java
      - name: grpc-java
        out: gen/java
      - name: swift
        out: gen/swift
      - name: python
        out: gen/python

위 `yaml` 파일과 같이 뱅크샐러드에서는 이미 다양한 런타임을 지원하기 위해 buf를 활용하고 있었습니다. 따라서 요구사항을 만족하는 플러그인을 직접 구현한 다음에 기존 buf generate 파이프라인에 포함하기로 결정했습니다.

    version: v1
    plugins:

      - name: protoc-gen-banksalad-http-client

        path: ./scripts/typescript/src/protoc-gen-banksalad-http-client.ts
        out: gen/typescript/http-client

        opt: target=ts

        ...기존 플러그인들

### @bufbuild/protoplugin 은 뭔가요?

`@bufbuild/protoplugin` 은 buf cli에서 `.protobuf` 파일을 처리할 코드 생성기 (plugin)을 쉽게 만들게 도와주는 도구입니다. plugin을 구현하려면 아래와 같은 작업이 필요합니다.

1. `.proto` 파일마다 어떤 소스 코드가 생성되어야 하는지 디자인합니다.
2. `.proto` 파일을 파싱해서 활용할 수 있는 데이터로 가공합니다 (nested object 등)
3. (2)에서 구성한 데이터를 순회하면서 (1)의 코드 문자열을 생성합니다.
4. 코드 문자열을 약속된 파일로 저장합니다.
5. 생성한 코드 문자열이 해당 언어의 문법과 맞는지 검증합니다

이 과정에서 (2)의 파싱 과정은 구현하는데 많은 시간이 필요하고, `.proto`의 스펙 변경이 일어날 때마다 유지 보수가 필요합니다. `@bufbuild/protoplugin`은 이러한 문제를 해결하기 위해 아래와 같은 기능을 제공합니다

* `.proto` 파일을 파싱하여 js object로 만들어 줍니다.
* 코드 문자열 출력 및 파일 관리 유틸리티를 제공합니다.
* 중복된 `import` 선언을 하나로 합쳐주는 등 javascript 코드를 생성하기 위한 다양한 유틸리티를 제공합니다.

예를 들어 아래와 같은 `.proto` 파일이 있다고 가정했을 때.

    service EchoService {
      rpc Echo(StringMessage) returns (StringMessage) {
        option (google.api.http) = {
          get: "/v1/example/echo" // k8s cluster 에서 호출 가능한 엔드포인트
          additional_bindings: {
            get: "/external/example/echo" // k8s cluster 밖 (사용자 기기 등)에서 호출 가능한 엔드포인트
          }
        };
      }
    }

이를 `@bufbuild/protoplugin`로 작성한 플러그인에 인자로 넣게 되면 아래와 같은 객체를 인자로 받는 함수를 실행하게 됩니다.

    interface Schema {
      files: [{
        services: [{
          kind: "service";
          name: 'Echo',
          methods: [{
            name: 'Echo',
            ...
          }]
        }]
      }]
    }

    function generateTsFile(schema: Schema) {
      for (const file of schema.files) {


        for (const enumeration of file.enums) {

        }

        for (const message of file.messages) {

        }

        for (const service of file.services) {


          for (const method of service.methods) {

          }
        }
      }
    }

인자로 받는 함수에서 제공하는 파일 유틸리티를 통해 `.ts` 파일을 생성하고, 객체를 순회하면서 원하는 코드를 간편하게 생성할 수 있습니다.

    function generateTs(schema: Schema) {
     for (const file of schema.files) {
       for (const service of file.services) {
          f.print`export class ${service.name}Client {`;
          for (const method of service.methods) {
              f.print`public async ${method.name}() {`;
              f.print`  console.log(\`implement this function\`)`
              f.print`}`;
          }
          f.print`}`;
       }
     }
    }

## 뱅크샐러드 gRPC 런타임 만들기

요구사항을 만족하기 위해, 각 gRPC microservice마다 같은 네트워크 리전에 있는 경우 (이하 내부망), 외부 네트워크에 있는 경우(이하 외부방)에 사용할 수 있는 Class를 자동 생성하기로 하였고, 아래와 같은 코드를 출력할 수 있도록 코드 생성기를 구현하였습니다.

내부망/외부망 코드를 한 클래스에 모두 구현하도록 작성할 수 있지만, 임의 사용자에게 다운로드되는 자바스크립트 특성상 내부 전용 RPC가 외부에 노출되지 않도록 별도 코드로 분리했습니다. 다른 방법으로 Webpack에서 [string-replace-loader](https://www.npmjs.com/package/string-replace-loader)등 전처리기를 사용해 클라이언트 청크에서 코드를 제거할 수도 있지만, 런타임에 문제가 생길 수도 있으므로 고려하지 않았습니다.

    import type {
      BaseExternalClient, BaseInternalClient,
      ClientConstructorParams, ExtendInterfaceFunctionParameter,
      ExternalClientOption
    } from "뱅크샐러드_내부_타입_패키지";
    import type { EchoService, StringMessage } from "뱅크샐러드_내부_gRPC_타입_패키지";
    import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

    export type IEchoServiceClient = ExtendInterfaceFunctionParameter<EchoService, AxiosRequestConfig | undefined>;
    export type IEchoServiceClientWithExternalRpcOnly = Pick<IEchoServiceClient, 'Echo'>

    export class EchoServiceExternalClient implements IEchoServiceClientWithExternalRpcOnly, BaseExternalClient {
      protected axiosInstance: AxiosInstance
      constructor (option: ExternalClientOption) {
        this.axiosInstance = option.axiosInstance;
        return;
      }

      public async Echo<ReturnType = StringMessage>(request: StringMessage, config?: AxiosRequestConfig): Promise<AxiosResponse<ReturnType>> {
        const {

        } = request;

        return this.axiosInstance<ReturnType>({
          method: 'get',
          url: `/example/echo`,
          data: undefined,
          params: undefined,
          ...config
        });
      }
      static EchoQueryKey = 'EchoService.Echo' as const
    }

    export class EchoServiceInternalClient implements IEchoServiceClient, BaseInternalClient {

      static baseUrl = 'http://echoservice.운영계.svc.cluster.local:80' as const
      static stagingBaseUrl = 'http://echoservice.개발계.svc.cluster.local:80' as const

      static proxyBaseUrl = 'http://127.0.0.1:8001/api/v1/namespaces/개발계/services/echoservice:80/proxy/' as const
      protected axiosInstance: AxiosInstance
      protected namespace: 'local' | '개발계' | '운영계'

      constructor (option: ClientConstructorParams) {
        if(typeof window !== 'undefined') {
          throw new Error('뱅크샐러드_클라이언트에서_내부망호출시_경고_에러');
        }

        this.axiosInstance = option.axiosInstance;
        return;
      }

      public async Echo<ReturnType = StringMessage>(request: StringMessage, config?: AxiosRequestConfig): Promise<AxiosResponse<ReturnType>> {
        const {

        } = request;

        return this.axiosInstance<ReturnType>({
          method: 'get',
          url: `/v1/example/echo`,
          data: undefined,
          params: undefined,
          ...config
        });
      }

      static EchoQueryKey = 'EchoService.Echo' as const
    }

proto file이 모여있는 사내 레포지토리 master branch가 업데이트되면 CI workflow를 통해 자동으로 코드가 생성되도록 구성했고, 생성된 파일은 [copybara](https://github.com/google/copybara)를 사용해 프론트엔드 Nx monorepo에 공용 라이브러리에 병합되어 monorepo 내부에서 사용할 수 있게 했습니다.

## Next.js 어플리케이션에서 사용 및 효과

이렇게 자동 생성된 2가지의 Class를 통해 내부방/외부망 환경에서 별도의 API 코드 작성 없이 편리하게 마이크로서비스를 호출할 수 있었습니다.

    import { ExternalClientFactory, InternalClientFactory } from '뱅크샐러드_모노레포_클레스_팩토리_라이브러리'
    import { EchoServiceInternalClient, EchoServiceExternalClient } from '뱅크샐러드_모노레포_자동생성_클라이언트_라이브러리'

    export const getServerSideProps = async () => {

      const client = new InternalClientFactory(EchoServiceInternalClient).getClass();

      const res = await client.Echo();

      return {
        props: {
          ssrEcho: res
        }
      }
    }

    const Page = ({ssrEcho}) => {
      const [csrEcho, setCsrEcho] = useState(null);

      useAsyncEffect(async () => {
        const externalClient = new ExternalClientFactory(EchoServiceExternalClient).getClass();

        setCsrEcho(await externalClient.Echo());
      })

      return (
        <div>
          ssr: {ssrEcho}
          <br/>
          csr: {csrEcho ?? '대기중...'}
        </div>
      )
    }

    export default Page;

이를 통해 아래와 같은 효과가 있었습니다.

1. 동일한 RPC 호출시 기존 외부망 호출 (200ms 수준) 대비 응답 속도가 90% 감소되었습니다. (20ms 수준)

![Opentrace Flame Graph](https://blog.banksalad.com/static/fda6f8d7e8fa0e5fb338403e578f2684/663f3/ssr-flame-graph.png "Opentrace Flame Graph") Figure 3 \| k8s svc dns 사용후 OpenTelemetry flame graph

<br />

<br />

2. 프론트엔드 개발자가 일일이 API 코드를 적지 않아도 되어 개발 생산성이 좋아졌습니다.

3. SSR에서 방화벽을 거치지 않게 되어 인프라 부하가 감소되었습니다.

## 더 편리하게 만들 수 없을까?

API 코드는 자동화 되었지만 대부분 웹 서비는 react-query 등, 비동기 상태를 관리하는 라이브러리를 사용하고 있습니다. 따라서 `use...Query` 등의 hooks는 여진히 손으로 적어야 하는 문제가 남아 있습니다. 이것도 자동화할 수는 없을까요?

이를 뱅크샐러드 웹 팀에서는 [connect-query](https://github.com/connectrpc/connect-query-es)에 영감을 받아 react-query의 QueryOption 인터페이스를 자동 생성하는 코드를 만들고 있습니다. 이를 통해 프론트엔드 개발자의 생산성이 더욱 올라갈 것으로 기대합니다.

    const EchoQueryOption = {
      queryKey: ['EchoService', 'Echo']
      queryFn = async () => {
        const client = ...

      }
    }

    export const useEchoQuery = (options) => {
      useQuery({
        ...EchoQueryOption,
        ...options
      })
    }

## 마치며

이 방식은 gRPC-web 대비 몇가지 제약점이 있지만, gRPC-gateway를 사용하는 환경에서 추가적인 비용 없이 코드 자동 생성을 통해 많은 효과를 보았습니다. 뱅크샐러드 웹 챕터는 개발자 생산성을 위해 이 외에도 많은 작업들을 하고 있습니다. 관심 있으신 개발자 여러분들을 기다리고 있습니다.

코드를 자동 생성하고 라이브러리에 편입시키는 과정에서 사용한 라이브러리들을 소개하면서 글을 마치려 합니다. 긴 글 읽어주셔서 감사합니다.

* 코드 자동 생성: [@bufbuild/protoplugin](https://www.npmjs.com/package/@bufbuild/protoplugin)
* 타입 자동 생성: [ts-proto](https://github.com/stephenh/ts-proto)
* barrel file 생성: [ctix](https://www.npmjs.com/package/ctix)
* Git repository간 커밋 동기화: [copybara](https://github.com/google/copybara)
* 프론트엔드 프로젝트 관리 [Nx](https://nx.dev/)