안녕하세요, 토스 AI DX Team의 Server Developer 조민규입니다.

저는 AI DX Team에서 토스 서버의 하네스를 만들면서, 그 기능 중 하나로 사내 공용 Skill을 만들어 배포하고 있습니다. 여기서 다루는 Skill은 실제 서비스 런타임에서 동작하는 것이 아니라, 개발자가 코딩 에이전트로 개발할 때 이를 보조하는 개발 단계의 도구입니다.

토스 내부에서는 많은 Skill들이 만들어지고 공유되고 있는데요, 정성껏 만들어서 제공되는 Skill이 한 번도 호출되지 않는 경우도 많았습니다. 본문에 사용 케이스를 여러 개 적어두고 트리거 키워드도 깔아뒀는데도, 정작 스킬은 제대로 호출이 되지 않았죠.

근본적으로 Skill의 품질 문제라는 생각이 들었습니다. 이를 해결하기 위해 Skill의 품질을 관리하기 위한 6 섹션 30 항목의 Rubric을 만들게 되었는데, 이 과정에 대해 정리해 보려고 합니다.

## Skill 평가가 어려운 두 가지 이유

Skill은 본질적으로 'LLM이 호출하고 LLM이 읽는 산출물'입니다. 코드라면 컴파일러와 테스트가 1차 게이트가 되어 주지만, Skill에는 통과/실패를 딱 떨어지게 검증해 주는 도구가 없습니다.

그래서 결함이 호출되지 않거나, 호출돼도 효과가 없는 형태로 조용히 누적됩니다. 가장 자주 발견되는 Skill 관련 문제 두 가지를 먼저 짚어보겠습니다.

### 1. 트리거 실패

Skill의 설명 작성이 바람직하지 못해서 코딩 에이전트가 Skill을 올바른 타이밍에 호출하지 못하는 경우입니다. 본문에 아무리 좋은 가이드를 적어둬도 호출이 안 되면 무의미하죠.

대표적으로 작성자가 호출 조건을 Description이 아닌 Skill 본문에 적어두는 패턴이 있습니다. 본문에 "Use when ..." 같은 시점 정보를 넣어두면 충분할 거라 생각하기 쉽지만, 코딩 에이전트는 Skill을 호출할지 결정할 때 Description만 봅니다. 본문은 호출이 결정된 다음에야 읽힙니다. 작성자 입장에서는 분명히 트리거 조건을 명시했다고 생각하는데, 정작 코딩 에이전트에게는 보이지 않는 영역에 적어둔 셈이 되죠.

문제는 이 결함이 사람의 눈으로 잡히지 않는다는 점입니다. 코드처럼 빨간 줄이 그어지지도 않고, 작성자 본인은 자기 Skill이 호출되지 않는다는 사실 자체를 모릅니다.

### 2. 형식 위반으로 인한 호출 실패

name이 kebab-case가 아니거나, name과 폴더명이 일치하지 않으면 코딩 에이전트가 Skill의 존재 자체를 인식하지 못합니다. 트리거 실패와 결과는 비슷하지만, 원인이 형식적이라 정규식으로 즉시 잡아낼 수 있는 결함입니다.

작성자 입장에서는 본인 Skill이 호출되지 않는 이유를 본문에서 찾느라 시간을 낭비하기 쉽습니다. 정작 원인은 frontmatter 한 줄에 있는 경우인데도요.

이러한 사내 Skill의 문제들은 Rubric 설계의 출발점이 됐습니다.

## 결정적인 것은 규칙 기반으로, 의미적인 것은 모델 기반으로

두 결함의 검증 방식은 정반대였습니다. 첫 번째는 의미 판단이 본질이라 LLM 모델 판정이 필수이고, 두 번째는 형식 기반이라 정규식 한 줄로 결정적으로 잡히는 결함인 것입니다.

이러한 통찰을 바탕으로, 둘을 구분해서 관리해야 한다는 Rubric 전체를 관통하는 단 하나의 설계 원칙을 고안하게 되었습니다. 두 영역을 섞어 처리하면 양쪽 모두 망가지기 때문입니다. 결정적 결함을 LLM 에 맡기면 "거의 맞는 것 같은데..." 로 통과시키는 False Negative가 생기고, 반대로 의미적 판정을 정규식으로 처리하면 키워드 매칭의 한계 때문에 False Positive가 폭발합니다.

그래서 30개 항목을 17개 규칙 / 13개 모델 검사로 명시적으로 구분했습니다. 규칙 검사는 정규식·카운트·AST 파싱처럼 결정적인 도구만 쓰고, 모델 검사에는 LLM만 사용합니다. 두 단계의 책임 영역이 겹치지 않게 만드는 게 핵심입니다.

이 분리는 운영 비용 측면에서도 효과적입니다. 규칙 검사는 무료에 가깝고 매 PR 마다 돌아도 부담이 없습니다. 모델 판정은 비용이 들지만 규칙 검사가 통과한 케이스에만 호출되므로, BLOCKER 단계에서 막힌 Skill 에는 LLM 비용을 쓰지 않습니다.

## 6 섹션 30 항목 Rubric의 구조

Skill을 6개 섹션, 30개 항목으로 평가하도록 구조를 설계했습니다. 각 항목은 BLOCKER / MAJOR / MINOR 심각도를 가지고, 결과는 S\~F 5단계 등급으로 정리됩니다.

| 섹션  | 항목 수 | BLOCKER |          성격          |
|-----|------|---------|----------------------|
| 타당성 | 3    | 0       | 이 Skill이 존재할 가치가 있는가 |
| 구조  | 8    | 5       | Skill 파일 형식이 올바른가    |
| 트리거 | 6    | 1       | 코딩 에이전트가 잘 부를 수 있는가  |
| 콘텐츠 | 3    | 0       | 본문이 가치 있는가           |
| 리소스 | 8    | 0       | 파일 구조가 잘 짜여 있는가      |
| 안전성 | 2    | 2       | 배포해도 안전한가            |
| 합계  | 30   | 8       |                      |

### 등급 기준

| 등급 |          조건           |      의미      |
|----|-----------------------|--------------|
| S  | BLOCKER 0 + MAJOR 0   | 모범 Skill     |
| A  | BLOCKER 0 + MAJOR 1-2 | 사용 가능, 소폭 개선 |
| B  | BLOCKER 0 + MAJOR 3-4 | 개선 필요        |
| C  | BLOCKER 0 + MAJOR 5+  | 대폭 개선 필요     |
| F  | BLOCKER 1+            | 배포 불가, 재작성   |

핵심은 **BLOCKER 가 하나라도 있으면 무조건 F** 라는 점입니다. 등급은 작성자에게 보여주는 압축 신호이고, 실제 Merge 차단은 **F인지 아닌지** 한 비트로만 결정됩니다. 미세한 등급 차이로 줄다리기하지 않게 만드는 단순화죠.

## 섹션별 핵심 항목과 설계 의도

### 타당성 (3 / MAJOR)

이 Skill이 존재할 만한 이유가 있는지를 봅니다. 이때 세 가지 질문을 던집니다.

| ID  |            항목             | 측정 |  심각도  |
|-----|---------------------------|----|-------|
| 1-1 | 반복되는 워크플로우인가?             | 모델 | MAJOR |
| 1-2 | 프로젝트 한정이 아닌 범용성이 있는가?     | 모델 | MAJOR |
| 1-3 | 코딩 에이전트 기본 능력으로 대체 불가능한가? | 모델 | MAJOR |

하나라도 No라면 스킬의 존재 가치에 대한 확신에 의문 부호가 자동으로 붙습니다. 일회성 작업이거나 코딩 에이전트에게 그냥 시켜도 되는 일은 Skill로 만들 가치가 없기 때문입니다.

'만들지 말았어야 할 Skill'을 잡는 항목이라 다른 섹션과 결이 좀 다릅니다.

### 구조 (8 / BLOCKER 5)

파일이 형식적으로 올바른지를 봅니다. 8개 항목 중 다섯 가지가 BLOCKER 입니다.

| ID  |            항목             | 측정 |     심각도     |
|-----|---------------------------|----|-------------|
| 2-1 | YAML frontmatter 파싱 가능    | 규칙 | **BLOCKER** |
| 2-2 | name 이 kebab-case (≤ 64자) | 규칙 | **BLOCKER** |
| 2-3 | name 과 폴더명 일치             | 규칙 | **BLOCKER** |
| 2-4 | description 1-1024자       | 규칙 | **BLOCKER** |
| 2-5 | description 에 XML 태그 없음   | 규칙 | **BLOCKER** |
| 2-6 | 허용된 frontmatter 키만 사용     | 규칙 | MAJOR       |
| 2-7 | claude / anthropic 예약어 없음 | 규칙 | MAJOR       |
| 2-8 | Skill 폴더 내 README.md 없음   | 규칙 | MINOR       |

5개 BLOCKER 중 하나만 어겨도 F 등급입니다. 형식 위반은 결정적으로 잡히는 결함이라 100% 규칙 검사로 처리하고, 모델 판정은 들어가지 않습니다.

이 검사를 한 번에 모아서 처리하는 것은 의도된 설계입니다. 결함이 여러 개 있더라도 PR 코멘트 한 번으로 전부 받게 해주는 편이 작성자 입장에서 수정 비용이 가장 적기 때문입니다. frontmatter 파싱이 깨진 경우만 즉시 리턴하고, 그 외에는 끝까지 돌려 결과 리스트를 한 번에 반환합니다.

    import re
    from pathlib import Path
    import yaml

    NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")  # kebab-case
    DESC_LEN_RANGE = (1, 1024)

    def check_structure(Skill_md_path: str) -> list[str]:
        """구조 섹션의 BLOCKER 5개를 한 번에 검사."""
        content = Path(Skill_md_path).read_text(encoding="utf-8")
        folder_name = Path(Skill_md_path).parent.name

        m = re.match(r"^---\n(.*?)\n---\n(.*)", content, re.DOTALL)
        if not m:
            return ["BLOCKER: frontmatter 누락"]

        try:
            fm = yaml.safe_load(m.group(1)) or {}
        except yaml.YAMLError as e:
            return [f"BLOCKER: frontmatter 파싱 실패 - {e}"]

        body = m.group(2)
        failures = []
        name = fm.get("name", "")
        desc = fm.get("description", "")

        if not NAME_RE.match(name):
            failures.append(f"BLOCKER: name '{name}' 이 kebab-case 가 아님")
        if name != folder_name:
            failures.append(f"BLOCKER: name '{name}' 와 폴더명 '{folder_name}' 불일치")
        lo, hi = DESC_LEN_RANGE
        if not (lo <= len(desc) <= hi):
            failures.append(f"BLOCKER: description 길이 {len(desc)} 가 {lo}-{hi} 범위 밖")
        if re.search(r"<\w+[^>]*>", body):
            failures.append("BLOCKER: 본문에 XML 태그 포함")

        return failures or ["PASS"]

형식 결함은 검사가 정교한가보다 **누락 없이 매번 같은 결과가 나오는가**가 훨씬 중요한 영역입니다. 그래서 이 정도의 단순함이 오히려 적정 수준입니다. 전략 패턴을 이용해 확장성을 고려할 수도 있었지만, 이를 전략 패턴으로 바꾸는 것은 당장의 요구사항에 비해 복잡성을 불러 일으킨다고 판단하여 위의 형태를 유지하였습니다.

### 트리거 (6 / BLOCKER 1)

앞서 언급한 트리거 실패가 바로 이 BLOCKER 에 해당합니다. 이를 위한 6개 항목이 존재합니다.

| ID  |                   항목                    | 측정 |     심각도     |
|-----|-----------------------------------------|----|-------------|
| 3-1 | description 에 WHAT(기능) + WHEN(시점) 모두 포함 | 모델 | MAJOR       |
| 3-2 | 충분한 트리거 키워드가 있는가                        | 모델 | MAJOR       |
| 3-3 | description 과 body 의 의미가 일치하는가          | 모델 | MAJOR       |
| 3-4 | body-only trigger 안티패턴이 없는가             | 모델 | **BLOCKER** |
| 3-5 | 트리거 범위가 과도하게 넓지 않은가                     | 모델 | MAJOR       |
| 3-6 | argument-hint 존재 ($ARGUMENTS 사용 시)      | 규칙 | MINOR       |

코딩 에이전트는 자신의 컨텍스트에 모든 Skill을 이름과 description 부분만 들고 있습니다. 그러다보니 Skill 을 호출할지 결정할 때 description만 보게 되고, 본문은 호출이 결정된 다음에야 읽힙니다. 그래서 "이 Skill 이 무엇인지(WHAT)" 만 적고 "언제 써야 하는지(WHEN)" 를 본문에만 적어두면 영원히 호출되지 않습니다. 이를 모른다면 작성자 입장에서는 본문에 풍부한 트리거 가이드를 적어둔 셈이라 결함이 있다는 자각조차 없습니다.

트리거 판정은 처음에 규칙 검사(정규식)로 시도했습니다. description 에 시점 신호("when", "할 때" 등) 가 있는지 보고, 본문에만 시점 정보가 들어 있으면 BLOCKER 로 잡는 방식이었습니다.

    import re
    import yaml

    WHEN_SIGNALS_DESC = ["when", "트리거", "사용 시", "할 때", "use when"]
    WHEN_PATTERNS_BODY = [
        r"##\s*when\b",
        r"##\s*사용\s*시점",
        r"^use\s+when\b",
        r"^when\s*to\s+use",
    ]

    def check_body_only_trigger(Skill_md_path: str) -> list[str]:
        """description 의 WHEN 정보 누락 + body-only trigger 안티패턴 검출."""
        content = open(Skill_md_path, encoding="utf-8").read()

        m = re.match(r"^---\n(.*?)\n---\n(.*)", content, re.DOTALL)
        if not m:
            return ["FAIL: frontmatter 누락"]

        fm = yaml.safe_load(m.group(1)) or {}
        body = m.group(2)
        description = (fm.get("description") or "").lower()

        has_when_in_desc = any(sig in description for sig in WHEN_SIGNALS_DESC)
        has_when_in_body = any(
            re.search(p, body, re.MULTILINE | re.IGNORECASE)
            for p in WHEN_PATTERNS_BODY
        )

        if not has_when_in_desc and has_when_in_body:
            return ["BLOCKER: body-only trigger anti-pattern"]
        if not has_when_in_desc:
            return ["MAJOR: description 에 WHEN 정보 부족"]
        return ["PASS"]

WHEN_SIGNALS_DESC 리스트가 약간 임의적으로 보일 수 있는데, 처음에는 영어 "when" 만 봤습니다. 그런데 사내 Skill들은 한국어로 작성된 경우가 많아서 "할 때", "사용 시" 같은 표현으로 시점을 표현하는 경우가 잦았고, 영어만 보던 시점에는 이런 케이스가 죄다 BLOCKER 로 잡혀버렸습니다. 한국어 표현을 추가하면서 False Positive 는 줄었지만, 이번엔 반대로 누락이 보이기 시작했습니다.

이모지나 완곡한 동의 표현처럼 정규식 리스트로는 도저히 다 담을 수 없는 케이스가 계속 나왔습니다. 결국 트리거 판정은 "description 이 본문의 트리거 조건을 커버하는가?"를 모델에게 단독으로 맡기는 방식으로 전환했습니다. 표현의 다양성을 정규식으로 좇는 것보다, 의미를 보는 모델이 훨씬 안정적이었습니다.

#### ️ 트리거 BLOCKER --- description 에 "when" 정보가 없고 본문에만 "Use when..." 이 있으면 코딩 에이전트는 Skill 을 발견조차 못 한다.

<br />

### 콘텐츠 (3 / MAJOR)

본문이 실제 유용한 정보를 담고 있는지 봅니다.

| ID  |                항목                 | 측정 |  심각도  |
|-----|-----------------------------------|----|-------|
| 4-1 | 구체성 ≥ 1 (수치 / 코드 / Why / 시나리오)    | 모델 | MINOR |
| 4-2 | 코딩 에이전트 기본 지식만 나열하지 않음 (조직 고유 맥락) | 모델 | MAJOR |
| 4-3 | 본문 500줄 이하                        | 규칙 | MINOR |

코딩 에이전트가 이미 아는 일반론은 감점이고, 조직 내부 운영 룰이나 수치가 들어가야 가점입니다. 이 평가는 모델 판정이 담당합니다. 정규식으로는 '유용한 정보인지'를 알 수 없기 때문입니다.

    ✅ "N > 100 이면 SCAN 사용 필수 (응답시간 300ms → 5ms)"
       → 수치 포함된 조직 고유 지식

    ✅ "알파 토픽은 자동 생성, 라이브는 플랫폼 통해 신청"
       → 조직 운영 룰

    ✅ "사내 대시보드 링크 생성기는 내부 인스턴스 전용. 외부망에서는 동작하지 않음"
       → 도메인 한정 사실

    ❌ "Redis 는 인메모리 DB 입니다"
       → 코딩 에이전트가 이미 아는 정보

리뷰하다 보면 의외로 "Redis는 인메모리 DB" 류의 일반론을 길게 적어둔 Skill 이 자주 보입니다. 한 번은 어떤 Redis 관련 Skill 본문의 절반이 Redis 기초 지식으로 채워져 있어서, 모델 판정이 **"본문의 60% 이상이 코딩 에이전트가 이미 아는 정보로 채워져 있음"**이라는 코멘트로 잡아낸 적이 있습니다. Skill 본문이 호출 시점에 LLM 컨텍스트를 점유하는 비용이라는 사실을 잊기 쉽다는 신호이기도 합니다. 본문 길이 제한(500줄)이 단독 항목으로 들어가 있는 것도 같은 이유입니다.

### 리소스 (8 / MAJOR)

파일 구조가 잘 짜여 있는지 봅니다. 핵심 원칙은 **본문 / 참고 / 스크립트의 3단 분리**로, 다음 디렉토리 구조를 권장합니다.

    my-Skill/
    ├── Skill.md          # 호출 즉시 로드. 본문은 짧게.
    ├── references/
    │   ├── api-spec.md   # 무거운 참고 자료. 평평하게.
    │   └── examples.md
    └── scripts/
        └── deploy.sh     # 고정된 형태의 작업 스크립트

이 구조에서 8개 항목이 나옵니다. references/ 와 본문이 분리됐는가, references/ 가 중첩 없이 평평한가, 위험한 작업이 scripts/ 로 고정됐는가, 스크립트의 syntax가 유효한가 등입니다.

| ID  |                    항목                    | 측정 |  심각도  |
|-----|------------------------------------------|----|-------|
| 5-1 | 핵심은 Skill.md, 상세는 references/ 로 분리       | 모델 | MAJOR |
| 5-2 | references 링크에 "언제 읽는지" 조건 명시            | 모델 | MINOR |
| 5-3 | references 중첩 금지 (A→B→C 연쇄 참조 없음)        | 규칙 | MAJOR |
| 5-4 | 100줄 이상 reference 에 목차                   | 규칙 | MINOR |
| 5-5 | 실수 가능한 작업은 scripts/ 로 고정                 | 모델 | MAJOR |
| 5-6 | scripts syntax 유효 (py_compile / bash 문법) | 규칙 | MAJOR |
| 5-7 | scripts 경로가 Skill.md 에서 언급됨              | 규칙 | MINOR |
| 5-8 | placeholder / TODO 잔재 없음                 | 규칙 | MINOR |

3단 분리의 의도는 **컨텍스트 비용 관리**입니다. Skill.md 본문은 호출 즉시 로드되니 꼭 필요한 분량만 담고, 무거운 참고 자료는 references/ 로 빼서 LLM 이 필요할 때만 읽도록 만듭니다. 그리고 매번 LLM 호출마다 다르게 실행되면 안되는 작업은 scripts/ 에 고정해서, 누가 실행하든 같은 결과가 나오게 합니다.

운영하다 보면 references/ 분리를 안 한 Skill 이 호출 한 번으로 4-5천 토큰을 잡아먹는 케이스가 종종 보였습니다. 본문은 1-2천 토큰 안쪽으로 끊고 나머지는 reference로 빼면 평소 호출 비용은 1/3 이하로 줄어듭니다. 그래서 이 섹션은 BLOCKER 가 아니라 MAJOR 지만, 운영 효율 측면에서 무게가 가볍지 않은 영역입니다.

### 안전성 (2 / BLOCKER 모두)

배포해도 안전한지를 봅니다.

| ID  |                     항목                     |      측정       |     심각도     |
|-----|--------------------------------------------|---------------|-------------|
| 6-1 | body / scripts 에 평문 secret · credential 없음 | 규칙 (gitleaks) | **BLOCKER** |
| 6-2 | allowed-tools 에 destructive 패턴 없음          | 규칙            | **BLOCKER** |

둘 다 BLOCKER 입니다. 평문 비밀 키가 들어간 Skill 이 머지되면 그 자체로 사고이고, rm -rf 류 destructive 권한이 무방비로 허용돼 있어도 마찬가지입니다.

다른 결함은 작성자에게 돌려보내면 끝이지만, **secret 노출은 한 번 머지되면 회수가 사실상 불가능합니다**. 그래서 가장 강한 게이트가 걸려 있습니다.

보안 체크는 **외부 도구(gitleaks) + 자체 정규식 매칭**의 조합으로 처리합니다. secret 검출은 잘 만들어진 외부 도구를 끌어 쓰는 편이 자체 정규식보다 훨씬 안전하고, 운영 부담도 작습니다.

    import re
    import subprocess

    DESTRUCTIVE_PATTERNS = [
        r"\brm\s+-rf?\b",
        r"\bdd\s+if=",
        r"\bmkfs\b",
        r"\bchmod\s+-R\s+777\b",
        r":\(\)\s*\{\s*:\|:&\s*\};:",  # fork bomb
    ]

    def check_safety(Skill_md_path: str, allowed_tools: list[str]) -> list[str]:
        """평문 secret 노출 + destructive tool 허용을 검사."""
        failures = []

        result = subprocess.run(
            ["gitleaks", "detect", "--source", Skill_md_path, "--no-git"],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            failures.append("BLOCKER: 평문 secret 검출 (gitleaks)")

        for tool in allowed_tools:
            if any(re.search(p, tool) for p in DESTRUCTIVE_PATTERNS):
                failures.append(f"BLOCKER: destructive 패턴 허용 - {tool}")

        return failures or ["PASS"]

튜닝 방향이 다른 섹션과 정반대입니다. 다른 영역은 False Positive 를 줄이는 쪽으로 임계값을 잡지만, **안전성만큼은 False Positive 를 감수하더라도 False Negative 를 0에 가깝게** 만듭니다. 작성자가 한 번 더 확인하는 비용보다 secret이 Merge 되는 비용이 압도적으로 크기 때문입니다.

## 평가 결과를 어떻게 보여줄 것인가

Rubric만큼이나 중요한 것이 **출력 형식**입니다. 작성자가 결과를 보고 곧장 액션을 취할 수 있어야 게이트로 의미를 갖기 때문입니다.

따라서 스킬의 개선 사항을 "왜 문제인가 + 어떻게 고치는가"의 한 묶음으로 제시합니다. 결함만 지적하고 수정 방향이 비어 있으면 작성자가 다시 컨텍스트를 모아야 하기 때문입니다. TL;DR 한 줄에 Skill의 타입(Reference / Workflow / Knowledge 등) + 평가 요약 + 개선 포인트를 압축해 넣어서, 리뷰어가 펼쳐 보지 않아도 핵심을 잡고 들어갈 수 있게 했습니다. 그 외에도 펼치기(\<details\>) 영역을 통해 전반적인 평가 결과를 볼 수 있습니다.
![](/images/d5b2fa86bb/01.avif)

## GitHub Actions로 자동 평가하기

통상적으로 스킬들은 GitHub를 통해 관리 및 공유되고 있기 때문에, PR 마다 변경된 Skill.md 디렉토리만 자동으로 골라 평가하고, 결과를 Sticky Comment 로 남기는 Reusable Workflow 를 만들었습니다. caller 레포의 .github/workflows/Skill-review.yml 한 파일만 추가하면 이제 스킬의 품질 평가를 자동화된 시스템으로 구축할 수 있습니다.

    name: Skill Review
    on:
      pull_request:
        types: [opened, synchronize, ready_for_review, reopened]
      workflow_dispatch:
        inputs:
          Skill_paths:
            description: '평가할 Skill 경로 (쉼표/줄바꿈 구분). 비우면 전체 평가.'
            required: false
            default: ''

    jobs:
      Skill-review:
        if: ${{ github.event_name == 'workflow_dispatch'
              || (!github.event.pull_request.draft
                  && github.event.sender.type != 'Bot') }}
        uses: toss/github-actions/.github/SkillReview.yaml@master
        with:
          Skill_paths: ${{ inputs.Skill_paths }}

평가 스크립트, Rubric, LLM 지침이 모두 Reusable Workflow 측에 번들되어 있어서 caller 레포에 추가 파일이 필요 없습니다. 한 PR 에 여러 Skill 이 변경되면 한 번에 다 평가해서 Summary Table로 묶어 줍니다.

평가는 두 가지 트리거로 동작합니다. PR 이벤트에서는 변경된 Skill.md 디렉토리만 자동으로 평가해 PR Sticky Comment 로 결과를 남기고, 수동 dispatch (workflow_dispatch) 에서는 특정 Skill 또는 전체를 평가해 결과를 Slack DM으로 받습니다.

내부 처리는 두 단계입니다. 먼저 caller 레포 checkout 후 변경된 Skill.md 디렉토리를 식별하고 규칙 검사 17개를 실행해 결과 JSON을 만듭니다. 그 다음 모델 판정 13항목을 돌리는데, 이때 규칙 검사 결과 JSON 과 Rubric, 판정 지침을 Prompt에 함께 동봉합니다.

운영하면서 가장 자주 손댄 옵션은 Skill_path_filter 였습니다. 테스트 fixture나 문서 예제 같은 노이즈 Skill.md 가 많은 레포에서는 평가 스코프를 plugins/*/Skills/* 같은 글롭으로 좁혀줍니다. 그러면 불필요한 LLM 호출을 막아 비용도 줄어듭니다. 결과 채널을 PR comment 가 아닌 Slack DM 으로 분기하는 output_channel 옵션도 dispatch 모드 운영에 자주 쓰입니다.

## 로컬 Claude Code 에서 셀프 체크하기

위와 같은 Workflow를 GitHub Actions 시스템으로 제공하다 보니, 자연스레 개인적으로 활용하는 스킬들에 대한 평가 요구 역시 생겨났습니다. 따라서 PR을 열기 전에 빠르게 셀프 체크하거나, 특정 Skill만 따로 평가해보고 싶을 때를 위해 로컬 Claude Code 플러그인도 함께 만들었습니다. GitHub Actions 워크플로우와 동일한 평가 기준을 사용하므로, 로컬에서 통과되면 PR 에서도 통과됩니다.
![](/images/d5b2fa86bb/02.avif)

이 플러그인은 자기 자신에 17개 규칙 검사 스크립트(stdlib only) + 모델 판정 13항목 판정 지침 + 6섹션 30항목 Rubric을 모두 번들로 들고 있습니다. 외부 의존이나 추가 설치 없이 Python 3.10+ 만 있으면 동작합니다.

핵심은 **두 진입점이 동일한 평가 스크립트와 Rubric을 공유**하도록 만든 것입니다. 그래야 "로컬에서는 통과했는데 PR 에서는 떨어진다" 같은 혼란이 없습니다.

이 구조의 진짜 가치는 **작성자가 PR 을 여는 시점에 이미 1차 통과 상태**라는 점입니다. PR 이 게이트가 아니라 "이미 검증된 결과를 공유하는 자리" 가 되어, 리뷰어는 의미 품질에 집중하고 형식·트리거·secret 같은 결정적 결함은 도구가 끝냅니다.

## 마치며

Skill 품질 평가의 핵심 아이디어는 두 단계 분리에 있습니다. 결정적인 결함은 규칙 검사로 차단하고, 의미 품질은 모델 판정으로 보완합니다. 이 둘을 6섹션 30항목 Rubric으로 묶고 S\~F 5등급으로 압축해서 리뷰어 부담을 줄였습니다.

#### Skill 의 결함은 정교한 분석이 필요한 게 아니라, 결정적 게이트가 누락된 것에 가깝다. 평가 시스템을 만들면서 가장 크게 느낀 점입니다.

<br />

도입부에서 짚었던 트리거 실패 같은 결함은 리뷰어 눈에 띄지 않은 채 Merge되곤 하는데, 규칙 검사 한 줄로 즉시 잡힙니다. Skill 한 개의 오작성은 작은 사고처럼 보여도, 사내에 Skill이 수십 개 쌓이는 시점에는 시그널 대비 노이즈가 폭발적으로 커지는 문제로 번집니다. 이는 결국 LLM의 불필요한 컨텍스트 낭비와 혼란을 초래하므로 자동화된 시스템을 통해 바로잡을 필요가 있습니다.

현재는 6섹션 30항목 Rubric으로 결함을 차단하는 단계까지 와 있습니다. 다음 단계는 Skill 별 호출 빈도, 호출 후 작성자 만족도 같은 실제 사용 데이터를 평가 기준에 결합하는 일이라고 보고 있습니다. "이 Skill 은 BLOCKER 가 없지만 한 달 동안 한 번도 호출되지 않았다" 같은 신호까지 잡아낼 수 있게 되면, 작성자가 PR 코멘트 한 번으로 다음 개선 액션을 바로 짚을 수 있는 환경이 만들어질 거라고 기대하고 있습니다.

덧붙이자면 지금까지 이야기한 Skill과 평가 시스템은 모두 실제 서비스 런타임이 아니라 개발자가 코딩 에이전트로 개발하는 과정을 돕는 개발 단계의 도구라는 점을 다시 한번 강조하고 싶습니다.