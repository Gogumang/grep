\*이 글은 연구 개발망에서 진행된 내용을 바탕으로 합니다.

안녕하세요. 토스 Security Researcher 표상영입니다.

[지난 글](https://toss.tech/article/vulnerability-analysis-automation-1)에서는 LLM을 이용해 서비스 취약점 분석을 자동화하면서 마주했던 문제점과 그에 대한 해결책들을 간단히 소개드렸습니다. 이전 글을 작성한 시점부터 벌써 3개월이 지났는데요. 불과 몇 달 사이에 AI의 취약점 분석 능력은 정말 높은 수준으로 올라왔습니다. 이렇게 가파른 기술 발전 속도에 따라, AI를 대하는 저의 자세와 생각도 많이 바뀌게 되었어요.

이번 글에서는 지난 글에서 소개드린 내용들을 실제로 어떻게 구현했는지 기술적으로 다루고, 기업 보안 관점에서 AI를 어떻게 바라보고 있는지에 대한 개인적인 견해를 공유해 보겠습니다.

## 첫 번째 벽: 대용량 소스코드를 어떻게 '효율적으로' 전달할까?

먼저 이게 왜 고민인지 의문을 갖는 분들도 있을 것 같아요.
> **Cursor나 Claude Code 쓰면 큰 프로젝트에서도 알아서 잘 찾아서 분석하지 않나요?**

### MCP로 자유롭게 소스코드 탐색하기

물론 Cursor나 Claude Code에서도 코드를 잘 찾아주지만 **단순 패턴 매칭(Ripgrep)만 사용**합니다. 사전에 인덱싱된 정보가 없기 때문에, 찾고자 하는 것을 정확히 못찾거나, 불필요한 탐색에 토큰이 낭비되는 경우가 발생하더라구요.

이를 개선하기 위해 **ctags로 심볼 정의를 사전 인덱싱**하고, **tree-sitter로 함수 범위를 구조적으로 파싱**해두는 MCP 서버를 개발했습니다.

MCP에서는 AI가 "이 함수의 정의를 보여줘"라고 하면, grep으로 전체를 뒤지는 게 아니라 인덱스에서 즉시 정확한 위치를 반환해요. AI에게 IDE의 "Go to Definition / Find References"와 유사한 코드 탐색 능력을 부여하는 것과 같습니다. 또, 로컬이 아닌 서버 환경에서의 자동화가 목표였기에 AI가 원격에서 코드를 참조할 수 있게 하는 무언가가 필요했어요.

### SourceCode Browse MCP 구성

MCP 서버의 도구는 다음 4가지로 구성했어요.

**1. find_references() --- ripgrep 기반 심볼/패턴 검색**

    @mcp.tool()
    def find_references(
        symbol_or_pattern: str,
        dir: Optional[str] = None,
        max_results: int = 50
    ) -> FindReferencesResponse:
        """심볼이나 패턴의 참조를 ripgrep으로 검색"""
        refs, total = find_references_with_ripgrep(
            symbol_or_pattern, dir, max_results
        )

        return {
            "references": [
                {"file": r.file, "line": r.line, "snippet": r.snippet}
                for r in refs
            ],
            "total": total,
            "truncated": total > len(refs)
        }

**2. read_definition() --- ctags 인덱스에서 심볼 정의 찾기 + tree-sitter로 함수 범위 감지**

    @mcp.tool()
    def read_definition(
        symbol: str,
        file: Optional[str] = None,
        language: Optional[str] = None,
        include_body: bool = True
    ) -> DefinitionResponse:
        """심볼의 정의를 ctags 인덱스에서 찾아 반환"""
        entries = ctags_index.find_definitions(
            symbol, file=file, language=language
        )

        results = []
        for e in entries[:10]:
            item = {
                "file": e.file,
                "line": e.line,
                "kind": e.kind,
                "language": e.language,
                "signature": e.signature,
                "scope": e.scope
            }

            if include_body:
                bounds = detect_function_bounds(p, e.line)  # tree-sitter
                if bounds:
                    item["body"] = "\\n".join(lines[bounds[0]-1:bounds[1]])

            results.append(item)

        return {"symbol"

**3. read_source() --- 특정 라인 주변 소스코드 읽기**

    @mcp.tool()
    def read_source(
        path: str,
        line: int,
        before: int = 40,
        after: int = 40
    ) -> ReadSourceResponse:
        """지정된 라인 주변의 소스 코드를 읽어옴"""
        p = _find_file_in_repo(path)
        lines = p.read_text(errors="ignore").splitlines()

        start = max(1, line - before)
        end = min(len(lines), line + after)
        text = "\\n".join(lines[start-1:end])

        return {
            "path"

**4. get_project_structure() --- 프로젝트 디렉터리 구조 반환**

    @mcp.tool()
    def get_project_structure(
        max_depth: int = 5,
        include_file_sizes: bool = False
    ) -> ProjectStructureResponse:
        """인덱싱된 프로젝트의 디렉터리 구조 정보를 반환"""
        structure = _build_directory_structure(REPO_ROOT, max_depth)

        return {
            "total_files"

MCP는 ` `find_references()` `와 read_definition()으로 분석이 필요한 심볼/함수를 정확히 찾아내고, read_source()로 그 주변의 코드를 필요한 만큼 참조하는 식으로 동작합니다. get_project_structure()는 나중에 추가한 도구인데요. 원격 환경이기 때문에 AI가 로컬에서처럼 프로젝트 구조를 확인할 수 없는 상황을 개선하기 위해 만들었어요.

**프로젝트 구조는 AI가 프로젝트를 이해하기 위한 청사진 같은 역할이기에, 아주 중요한 Context로 작동합니다.**이렇게 운영하면서 필요한 도구를 추가하거나 기존 도구를 개선하는 식으로 고도화 작업을 이어가고 있어요.

#### 지난 글에서 이 MCP를 Smithery 같은 마켓플레이스에 공개할 계획이 있을지 질문을 주셨었는데요. AI를 활용해 한 번 직접 만들어 보세요! 저도 논문이나 오픈소스에서 따온 개념들을 AI에게 이해시키고, 같은 동작을 하는 MCP를 만들어달라고 해서 나온 결과예요. 이 글을 참고해서 만들면 잘 만들어주지 않을까 싶네요.

<br />

## 두 번째 벽: 일관성 없는 결과와 정확도

두 번째로 마주한 문제는 **'일관성 없는 분석 결과와 정확도'**였습니다. 취약점을 잘 찾아주긴 하는데 일관성이 없었어요. XSS 취약점이 총 10개 있으면, 어떨 때는 10개를 찾기도 하고, 8개를 찾기도 하고.. 신뢰할 수 없는 결과가 나와서 개선이 필요했습니다.

이를 개선하기 위해 **SAST(Static Application Security Testing) 도구와 결합**했어요.

### SAST 도구 활용 --- 모든 입력 경로를 빠짐없이 분석하기

여기서 SAST 도구를 좀 특별하게 사용했어요. **SAST를 취약점을 찾는 데 사용하지 않았거든요.**

보통의 활용 방식을 보면, SAST로 찾은 '취약점 결과'를 AI에게 전달하는 식으로 많이 사용합니다. 이렇게 되면 AI가 분석할 수 있는 취약점 Coverage가 SAST 도구만큼으로 한정되기 때문에 AI의 이점을 최대한 활용하지 못한다고 생각했어요. 그냥 SAST 도구 리뷰어 수준이 되는 거죠.

그래서 취약점을 찾는 게 아니라 **'AI가 반드시 검토해야 하는 모든 후보군을 추출'**하는 보조 도구로 사용했습니다.

AI가 검토해야 하는 후보군은 **Untrusted Input이 발생하는 지점**이고, 이 지점들을 모두 추출하도록 했어요. 아래와 같은 룰 형태가 되고, 모든 **Source(입력)→Sink(함수)** 도달 경로를 추출해낼 수 있습니다.

    # Semgrep Rule - kotlin-anycall-taint.yaml
    rules:
      - id: kt-spring-anycall-taint
        languages: [kotlin]
        severity: INFO
        message: Tainted Spring input flows into a call
        mode: taint

        pattern-sources:
          # @RequestParam / @PathVariable / @RequestHeader
          - patterns:
              - pattern-inside: |
                  fun $F(..., @RequestParam $X: $T, ...) { ... }
              - pattern: $X

          - patterns:
              - pattern-inside: |
                  fun $F(..., @PathVariable $X: $T, ...) { ... }
              - pattern: $X

          - patterns:
              - pattern-inside: |
                  fun $F(..., @RequestHeader($H) $X: $T, ...) { ... }
              - pattern: $X

          # @RequestBody --- DTO 필드 읽기를 source로 간주
          - patterns:
              - pattern-inside: |
                  fun $F(..., @RequestBody $DTO: $T, ...) { ... }
              - pattern: $DTO.$FIELD

          # @RequestPart / @ModelAttribute / @RequestAttribute
          - patterns:
              - pattern-inside: |
                  fun $F(..., @RequestPart $X: $T, ...) { ... }
              - pattern: $X

          - patterns:
              - pattern-inside: |
                  fun $F(..., @ModelAttribute $X: $T, ...) { ... }
              - pattern: $X

          - patterns:
              - pattern-inside: |
                  fun $F(..., @RequestAttribute $X: $T, ...) { ... }
              - pattern: $X

        pattern-sinks:
          - pattern: $F(...)
          - pattern: $OBJ.$M(...)

이렇게 사용하는 이유는 한 가지였는데요. 생각해보면 취약한 코드의 패턴은 그렇게 복잡하지 않아요. 생각보다 되게 명확하죠.

과연 AI가 취약점을 누락하고 일관성 없는 결과를 도출하는 이유가 그 취약점을 이해 못 했기 때문일까요? 저는 아니라고 생각했어요. **그냥 거기에 취약한 코드가 있었는지 몰랐고, 그 코드를 '못 봤기' 때문에 못 찾았을 가능성이 더 크다는 가설**이었어요.

semgrep을 이용한 SAST 분석은 아래 명령어를 통해 진행할 수 있어요.

    $ cd target-kotlin-project
    $ semgrep scan --config kotlin-anycall-taint.yaml . \\
        --timeout=60 --sarif --output kotlin-semgrep-output.sarif

결과 형식은 **SARIF(Static Analysis Results Interchange Format)**로 지정했어요. SARIF 포맷은 SAST 분석 결과를 구조화된 JSON 형식으로 출력할 수 있는 국제 표준 형식이에요.

결과를 보면 아래와 같이 JSON 형식의 분석 정보를 확인할 수 있습니다.

    {
      "version": "2.1.0",
      "runs": [
        {
          "invocations": [...],
          "results": [
            {
              "locations": [
                {
                  "physicalLocation": {
                    "artifactLocation": {
                      "uri": "src/main/kotlin/com/example/demo/UserController.kt",
                      "uriBaseId": "%SRCROOT%"
                    },
                    "region": {
                      "endColumn": 40,
                      "endLine": 16,
                      "snippet": {
                        "text": " return userService.findUser(id)"
                      },
                      "startColumn": 16,
                      "startLine": 16
                    }
                  }
                }
              ],
              "message": {
                "text": "Tainted Spring input flows into a call"
              },
              "properties": {},
              "ruleId": "kt-spring-anycall-taint"
            },
            ...
          ],
          ...
        }
      ],
      "$schema": "<https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json>"
    }

결과를 보면, 파일 위치와 해당 코드 스니펫을 얻을 수 있고, 정확한 코드 위치 정보도 얻을 수 있습니다. 하지만, 이 SARIF 결과를 그대로 사용할 수는 없었어요.

### 분석 결과 다이어트 시키기

어찌보면 무식하게 모든 입력 경로를 다 뽑아내는 방법이다 보니, 큰 프로젝트에서는 파일 사이즈가 MB 단위까지 커졌거든요. (15MB까지 봤던 것 같네요.) 텍스트 데이터를 MB 단위로 전달해 버리면 분석을 하기도 전에 대부분의 Context를 낭비하고 시작하는 거라 개선이 필요했어요.

분석 결과에서 **파일 경로, 정확한 코드 위치, 코드 스니펫**만 필요했기 때문에 나머지는 다 날려버리기로 했습니다. 필요한 정보만 따로 모아서 아래와 같이 **JSONL(Json-Lines)** 형식의 파일로 만들어줬어요.

    [
      {
        "id": 1,
        "file_path": "src/main/kotlin/com/example/demo/BrandStorePublicController.kt",
        "line_num": 38,
        "code_snippet": "val result = fileUploadApplication.createPresignedUploadUrl(\\n "
      },
      {
        "id": 2,
        "file_path": "src/main/kotlin/com/example/demo/ProductBrandAdminController.kt",
        "line_num": 39,
        "code_snippet": "val brand = productBrandService.findById(brandId)\\n"
      },
      {
        "id": 3,
        "file_path": "src/main/kotlin/com/example/demo/ProductBrandInternalController.kt",
        "line_num": 40,
        "code_snippet": "val productBrand = productBrandService.getOrCreateByName(request.brandName)\\n"
      },
      {
        "id": 4,
        "file_path": "src/main/kotlin/com/example/demo/ProductCategoryInternalController.kt",
        "line_num": 85,
        "code_snippet": "val result = productCategoryApplication.findCategoryPathsByIdIn(ids)\\n"
      },
      {
        "id": 5,
        "file_path": "src/main/kotlin/com/example/demo/ProductCategoryInternalController.kt",
        "line_num": 86,
        "code_snippet": "val result = productCategoryApplication.findCategoryPathByGroupId(tacaId)\\n"
      },
      ...
    ]

이렇게 해서 어느 정도 다이어트는 성공했습니다. 근데 한 가지 개선이 더 필요했어요.

SARIF 결과가 각 라인별로만 출력되다 보니 38, 39, 40 이렇게 연속된 라인도 따로따로 구분되어서 토큰 낭비가 발생했어요. ID별로 AI에게 분석시키고 있었기 때문에 ID 개수가 적을수록 시간과 토큰 효율화가 가능한 구조였죠.

그래서 아래와 같이 **연속되는 line들을 merge하는 후처리**도 같이 넣어줬어요. 파일 사이즈도 더 작아지고, 분석 시간과 토큰도 더 효율적으로 사용할 수 있었습니다.

    [
      {
        "id": 1,
        "file_path": "src/main/kotlin/com/example/demo/BrandStorePublicController.kt",
        "line_num": "38-40",
        "code_snippet": "val result = fileUploadApplication.createPresignedUploadUrl(\\n val brand = productBrandService.findById(brandId)\\n val productBrand = productBrandService.getOrCreateByName(request.brandName)\\n"
      },
      {
        "id": 2,
        "file_path": "src/main/kotlin/com/example/demo/ProductCategoryInternalController.kt",
        "line_num": "85-86",
        "code_snippet": "val result = productCategoryApplication.findCategoryPathsByIdIn(ids)\\n val result = productCategoryApplication.findCategoryPathByGroupId(tacaId)\\n"
      },
      ...
    ]

## 세 번째 벽: 비효율적인 분석

이렇게 구성하니 분석 정확도와 일관성은 해결되었지만, 모든 경로를 다 분석하다 보니 비용의 문제가 커졌습니다. 예를 들어, 총 100개의 경로가 있으면 XSS가 발생할 수 있는 경로는 10개인데, 나머지 90개의 의미 없는 경로도 분석하면서 발생하는 문제였어요.

이에 대한 해결 방법은 **Multi-Agent로 구성하고, Discovery 에이전트를 추가**하는 방법으로 해결할 수 있었어요.

### Multi-Agent 구조로 변경 후, Discovery 에이전트 구성

Multi-Agent 구조는 다음과 같고, Discovery, Analysis 에이전트만 SourceCode-Browse MCP를 사용해서 소스코드를 참조할 수 있도록 했습니다.
* **Supervisor**: Discovery와 Analysis 에이전트에게 상황에 맞는 적절한 지시를 내리는 감독관
* **Discovery**: 수집된 모든 경로 중 취약점 발생 가능성이 높은 경로만 선별하는 필터 역할
* **Analysis**: Discovery가 선별한 경로에 대해서만 실제 취약점 분석 수행
![](/images/c7ca36bcd2/01.png) [xbow.com](http://xbow.com/)

이 아이디어는 예전부터 지켜봐 온 [XBOW](https://xbow.com/) 프로젝트에서 차용하게 되었는데요, 인간의 개입 없이 AI 에이전트로만 취약점을 찾는 것이 목표인 프로젝트예요. 굵직한 CVE를 찾거나, 글로벌 해커 플랫폼인 HackerOne에서 USA 1위를 달성하는 등 성능이 검증된 프로젝트입니다.

XBOW 아키텍처에서 Discovery Agents와 비슷한 역할을 해요. 수집된 정보에서 취약점 발생 가능성이 높은 경로만 선별해서 Attack Agents에게 전달하는 역할을 해주죠.

### Discovery 에이전트 구성

근데 생각보다 Discovery 에이전트 구성이 까다로웠어요.
![](/images/c7ca36bcd2/02.png)

이전 글에서 이 내용을 짚어주신 분이 계셔서 조금 더 자세하게 준비했습니다.

지금 이 구조는 Discovery 에이전트가 **"어? 여기 XSS 취약점 있을 것 같은데?"**라고 판단해야만 Analysis 에이전트가 분석하기 진행하는 구조예요. Discovery 성능이 전체 분석 퀄리티에 영향을 줄 수 있는 구조인 것이죠.

그렇다고 성능을 끌어올리기 위해 Discovery 에이전트가 소스코드를 깊게 참조하게 만들면, 토큰이 두 배로 들게 됩니다.

* Discovery가 확실한 취약점 발생 가능성을 판단하기 위해 소스코드 참조
* Analysis가 전달된 취약점 경로를 검증하기 위해 소스코드 참조

이 방식으로는 토큰 비용이 너무 많이 발생하게 되어 에이전트를 둘로 나눈 의미가 옅어지게 됩니다.

### 해결 방안: trade-off

결국에는 어느 정도의 **trade-off가 필요**했습니다. Discovery 에이전트 System Prompt에는 아래와 같이 명시했어요.

    # GUIDE_LINE
    1. 가능한 SourceCode-Browse MCP를 사용하지 말고, 주어진 코드 스니펫을 보고 판단할 것
    2. 취약점 가능성을 너무 엄격하게 평가하지 말고, 어느 정도의 발생 가능성이 있으면 분석 경로에 추가할 것

이렇게 하면 Discovery 에이전트가 선별한 경로 개수가 많아지기는 하지만, **미탐률보다 과탐률이 높은 게 더 낫다**는 판단이었어요.

Discovery 에이전트를 차용한 이유는 Analysis 에이전트가 모든 경로를 분석하지 않도록 하는 데에 있기 때문이었습니다. 의미 없는 경로가 어느 정도 포함되어 있더라도 기존보다는 현저히 줄긴 했으니 충분히 유의미하다는 생각이었죠.

### Multi-Agent 구성 후 분석 결과

![](/images/c7ca36bcd2/03.png)

프로젝트가 분석된 모습을 시각적으로 표현한 결과입니다. 각 의미는 다음과 같아요.
* **Seeds**: Semgrep으로 수집한 모든 Untrusted Input 경로
* **Include (초록색 박스)**: Discovery 에이전트가 **분석 필요**로 판단한 경로
* **Exclude (회색 박스)**: Discovery 에이전트가 **분석 필요 없음**으로 판단한 경로

전체 286개의 경로에서 144개의 경로가 선별되었고, 선별된 경로에서 27개의 취약점이 발견된 모습이에요. **50% 가까운 경로 최적화를 달성**하였고, 오탐이 좀 포함되어 있긴 하지만 모든 취약점을 다 찾아낸 **100%의 정확도**를 달성할 수 있었습니다.

## 네 번째이자 가장 큰 벽: 지속 가능성

아무리 토큰 효율화를 해도 Cloud Model을 사용하면서 지속 가능한 비용을 달성할 수는 없었어요. 토스에는 수백 개의 서비스가 있기 때문에, 매일 모든 서비스를 한 번씩 분석한다고 했을 때 한 달에 수백만 원의 비용이 예상되었습니다.

### Open Model로의 전환

이 문제를 해결하기 위해선 **Open Model을 사용**해야 했어요. 직접 LLM 모델을 호스팅해서 사용하면 비용이 거의 발생하지 않기 때문이죠. 물론 Claude, Codex보다는 성능과 안정성이 떨어지기 때문에 추가적인 노력이 필요합니다.

취약점 분석에 적합하고 MCP 사용이 가능한 모델을 찾아본 결과, 아래 3개 모델로 좁힐 수 있었고 이 중 가장 적합한 모델을 선택해야 했습니다.

* **Qwen3:30B**
* **gpt-oss:20B**
* **llama3.1:8B**

### 모델 선별 과정: 변인 통제와 샘플 프로젝트

정확하고 측정 가능한 결과를 얻어내기 위해 **샘플 웹 프로젝트**를 만들었어요. XSS, IDOR, Deserialize, Path Traversal 취약점이 포함된 웹 서버를 만들었습니다. 그리고 분석 메모리, 캐시 등이 철저히 통제된 독립된 환경에서 분석을 진행했어요. 이렇게 테스트해서 **분석률, 정탐률, 오탐률** 3개 항목의 정량적인 결과를 얻어낼 수 있었습니다.
* **분석률**: 모든 컴포넌트를 분석했는지
* **정탐률**: 실제 취약점을 정확히 찾았는지
* **오탐률**: False Positive, 취약점이 아닌 것을 취약점으로 판단했는지

### 모델 선별 과정: 토큰 비용 및 MCP Tool Calling 안정성

제가 구성한 아키텍처에서는 MCP 사용이 필수적이었기 때문에 **MCP Tool 호출이 얼마나 안정적이냐**도 중요한 지표 중에 하나였어요. 또, 할루시네이션 가능성을 줄이기 위해 토큰을 효율적으로 사용하는 모델에게 높은 점수를 주었습니다.

**LangSmith**나 **LangGraph** 같은 LLM Observability 도구를 사용하면 토큰 비용과 멀티턴 대화를 쉽게 디버깅할 수 있어요.

* **LangSmith**는 SaaS 제품으로 간편하게 사용할 수 있지만, 일정 규모 이상부터는 비용을 지불해야 합니다.
* **LangGraph**는 오픈소스 프로젝트로 LangSmith와 같은 기능을 제공하지만 직접 구축해야 한다는 번거로움이 있어요.

![](/images/c7ca36bcd2/04.png) langsmith

여기에서는 간단한 테스트였기에 빠르게 사용해볼 수 있는 LangSmith를 사용했습니다. 그림처럼 모델의 멀티턴 대화, 도구 호출 결과, Input/Output 토큰 모니터링이 가능해요.

이렇게 모델들에 대한 토큰 비용과 MCP 안정성을 측정하였고, **Qwen3:30B**모델이 가장 좋은 성능을 보여서 채택하게 되었습니다.

## 성능 보완 작업

Open Model을 Cloud Model처럼 성능 좋고 안정성 있게 사용하려면 많은 연구가 필요합니다. 다만, 모델 파워가 절대적이기 때문에 **높은 수준의 모델을 사용하는 게 성능을 끌어올리는 데 가장 확실하고 좋은 방법**인데요.

토스에서는 **Qwen3.5 122B A10B 모델**을 사용할 수 있기 때문에 GPT-4o급 성능을 가용할 수 있는 상황이었어요.

### 비결정적인 응답 포맷 보완하기

Cloud Model은 System Prompt에 가이드라인만 잘 잡아주면 툴을 사용하거나 응답 타입이나 포맷을 잘 지키는 편입니다. 그에 반해 Open Model은 응답을 제멋대로 출력하거나 가이드라인을 지키지 않는 경우가 자주 발생해요.

파이썬의 Pydantic, Instructor 라이브러리를 사용하면 이런 경우를 보완할 수 있습니다.

먼저 아래와 같이 **Pydantic 라이브러리**를 사용해서 LLM 응답 포맷에 대한 타입 힌트와 검증을 강화했습니다. 만약 응답 포맷과 일치하지 않으면 에러가 발생해요.

    from pydantic import BaseModel, Field
    from typing import Union, List

    class PathItem(BaseModel):
        """Individual path item structure"""
        id: int = Field(description="PAYLOAD의 id와 동일한 값 (primary key)")
        file_path: str = Field(description="파일 경로")
        line_num: Union[int, str] = Field(description="줄 번호 (정수 또는 'A-B' 형식의 범위)")
        code_snippet: str = Field(description="코드 조각")
        reason: str = Field(description="분류 이유")

    class DiscoveryResult(BaseModel):
        """Discovery result structure"""
        include_path: List[PathItem] = Field(
            default_factory=list,
            description="분석이 필요한 엔드포인트 목록 (취약점 발생 가능성이 높음)"
        )

        exclude_path: List[PathItem] = Field(
            default_factory=list,
            description="분석을 건너뛸 수 있는 엔드포인트 목록 (취약점 발생 가능성이 낮음)"
        )

LLM이 잘못된 응답을 반환해서 에러가 발생하면, **Instructor 라이브러리**로 응답 포맷을 알아서 보정할 수 있도록 유도할 수 있어요.

    import instructor

    payload = [
        {"id": 1, "file_path": "app/routes/user.py", "line_num": 42, "code": "..."},
        {"id": 2, "file_path": "app/routes/auth.py", "line_num": "10-20", "code": "..."},
    ]

    client = instructor.from_openai(
        OpenAI(base_url="<http://localhost:11434/v1>", api_key="ollama"),
        mode=instructor.Mode.JSON,
    )

    result: DiscoveryResult = client.chat.completions.create(
        model="qwen3:30b",
        response_model=DiscoveryResult,
        max_retries=3,  # 최대 3번 retry
        messages=[
            {
                "role": "system",
                "content": "당신은 보안 분석가입니다. 주어진 코드 경로를 취약점 가능성에 따라 분류하세요."
            },
            {
                "role": "user",
                "content": f"다음 경로들을 분석하세요:\\n{payload}"
            }
        ]
    )

이렇게 구성하면 에러 내용을 LLM에 다시 전달해서 자동 보정된 응답을 반환하게 할 수 있습니다. 이 외에도 task를 더 잘게 쪼개서 여러 에이전트에게 분산 작업시키는 방식으로도 안정성과 성능을 개선해 볼 수 있어요.

## AI 발전 속도에 따른 개인적 견해

사실 저는 요즘 AI 성능을 향상시키는 연구는 멈춘 상태입니다. 제가 고민하고 시행착오를 겪어서 무언가를 만드는 것보다 **AI 기술 발전 속도가 훨씬 빠르기 때문**인데요.

'LLM으로 취약점 분석 자동화'를 주제로 첫 번째 글을 쓴 게 12월 25일, 불과 3개월 밖에 지나지 않았습니다.

그로부터 2개월이 채 되지 않는 2월 5일 Anthropic에서 ClaudeCode subAgent를 발표하고, 얼마 전 3월 6일 OpenAI에서는 Codex-Security를 발표했습니다. 사용해 보니, 성능도 굉장히 훌륭하더라구요. 앞으로 더 발전될 것을 생각하면 무섭기까지 합니다. 취약점 분석 영역의 Endgame이 코앞까지 다가온 느낌이거든요.

물론 이번 프로젝트를 진행하면서 깊은 부분까지 고민하고, 직접 구현해 본 경험은 정말 큰 도움이 되었습니다. '왜' 필요한지에 대한 이해를 하고 사용하는 것과 그냥 사용하는 것은 확연히 다르니까요.

그럼에도 저는 앞으로 기술 발전에 편승하려고 합니다. 리소스는 언제나 부족하고 한정되어 있기에 더 큰 꿈을 꾸기 위해 선택과 집중이 필요한 시점이라고 생각해요.

### 앞으로의 방향: 소스코드 인덱싱 서버

그래서 지금은 분석 기술 자체를 개발하는 대신, 어떤 기술이 들어와도 바로 시스템에 적용할 수 있는 확장 가능한 인프라를 만드는 데 집중하고 있습니다.

그중 하나가 **소스코드 인덱싱 서버를 만드는 것**입니다.

모든 서비스의 소스코드를 중앙 서버에 모아두고, 미리 인덱싱해 두는 거예요. 이렇게 구성하면 AI 에이전트는 소스코드를 따로 받을 필요 없이, 항상 최신 상태의 코드를 어디서든 효율적으로 참조할 수 있습니다. 추가로 참조가 필요한 정보는 MCP(Model Context Protocol)를 통해 도구로 제공하는 형태고요.
![](/images/c7ca36bcd2/05.png) \*이 이미지는 생성형 AI로 제작되었습니다.

이 구조에서 중요하게 생각하는 점은, **분석의 주체를 특정 기술에 종속시키지 않는 것**입니다.

MCP라는 표준 프로토콜 위에 인프라를 구성해 두면, Claude가 붙든 Codex가 붙든, 혹은 아직 등장하지 않은 새로운 에이전트가 나오더라도 인프라 변경 없이 바로 연결할 수 있어요. 앞서 말씀드린 '기술 발전에 편승하겠다'는 전략이 바로 이런 형태입니다.

물론 컴플라이언스, 안정성, 유지보수 관점에서 고려해야 할 부분이 아직 많습니다. 쉽지 않은 과제이지만, 언젠가 이 주제로 다시 공유드릴 수 있으면 좋겠습니다.

긴 글 읽어주셔서 감사합니다.

\*이 글은 연구 개발망에서 진행된 내용을 바탕으로 합니다.