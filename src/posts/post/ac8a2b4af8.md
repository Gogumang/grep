## 린트 - 보다 아름다운 코드를 위하여

안녕하세요. LINE+의 Mobile Productive \& Research 팀에서 Android 관련 라이브러리 및 개발 환경 개선 맡아서 진행하고 있는 윤종민입니다.

지난 연말, [ktlint](https://github.com/pinterest/ktlint) 업데이트 작업(0.5.0 → 1.0.1)을 진행했습니다. 사내에서 Kotlin으로 개발하는 많은 분들이 코드를 새로 작성하거나 수정하면서 기존 코딩 규칙(ktlint 0.5.0)에 맞춰 저장소에 반영하려고 할 때 무결성 검증 과정에서 예상치 못한 오류 메시지가 발생해 당황하셨을 것 같습니다. 이전에는 아무런 문제 없이 진행됐던 과정인데 ktlint를 업데이트하고 난 후 오류로 지적돼 코딩 규칙 검증이 조금 더 엄격해진 것을 체감하셨으리라고 생각합니다.

일단, 여기서 언급되는 ktlint라는 도구가 생소한 분도 계실 텐데요. 이 도구의 역할인 '린트'가 무엇인지부터 알아보겠습니다.

### 린트란?

오래된 스웨터의 보풀 같은 것을 린트라고 합니다. 보풀이 많으면 옷이 보기 좋지 않은데요. 코드에도 이런 보풀이 있습니다. 들여쓰기를 맞추지 않은 경우나 선언한 변수를 사용하지 않은 경우 등이 그렇습니다. 보풀이 있는 옷이라도 일단 입을 수는 있듯이, 보풀이 있는 코드로 만든 애플리케이션도 작동 그 자체에는 문제가 없습니다. 하지만 그런 애플리케이션은 점차 코드의 가독성이 떨어지면서 유지 보수하기 어려운 애물단지가 되어 버리기 쉽습니다. 옷의 보풀을 제거하기 위한 보풀 제거기(lint roller)처럼, 코드의 오류나 버그 등을 점검하고 정해진 코딩 컨벤션을 잘 지켜 개발하고 있는지 확인하기 위한 [정적 분석](https://abseil.io/resources/swe-book/html/ch20.html) 소프트웨어가 있는데요. 이를 [린트](https://en.wikipedia.org/wiki/Lint_(software)) 또는 린터(linter)라고 부릅니다.

### 린트가 필요한 이유

소프트웨어 개발 회사에서는 하나의 프로젝트에 여러 명의 개발자가 투입돼 같은 코드를 함께 작업합니다. 이때 코딩 규칙을 정해 놓으면 코드의 가독성이 높아지고, 이를 통해 개발의 효율성을 높일 수 있습니다.

그런데 이런 규칙을 문서로만 정의하면 과연 잘 지켜질까요? 아마 그렇지 않을 것입니다. 규칙을 기억하지 못하거나 실수로 어기는 경우도 많을 것이고, 규칙을 잘못 이해하고 적용하는 상황이 발생할 수도 있습니다. 이를 방지하기 위해 코딩 컨벤션 오류를 지속적으로 확인해서 미리 알려주는 플러그인 또는 프로그램이 바로 린트입니다.

또한 린트는 구조적인 문제를 일으켜 안정성과 효율성에 영향을 미치거나 코드 관리에 지장을 줄 가능성이 있는 코드를 찾을 수 있습니다. 예를 들어 XML 리소스 파일에 사용되지 않는 네임스페이스가 있다면 쓸데없이 공간을 차지하고 불필요한 처리가 발생합니다. 또는 지원 중단된 요소나 타깃 API 버전에서 지원하지 않는 API 호출을 사용하는 등의 구조적 문제가 발생하는 경우 코드가 올바르게 실행되지 않을 수 있습니다. 린트를 사용하면 이런 문제를 해결할 수 있습니다.

### Kotlin 언어를 위한 린트 - ktlint

ktlint는 Kotlin 언어로 작성된 코드의 코드 스타일을 확인하고 싶을 때 이용하는 툴입니다. 코드 스타일에 맞지 않는 코드를 자동으로 수정해 주는 기능이 있어서 보다 손쉽게 코드 스타일을 수정할 수 있습니다.

다음은 ktlint의 help 페이지입니다. ktlint에 대한 간단한 설명과 옵션, 사용 방법과 예시 등을 확인할 수 있습니다.

```bash
> ktlint --help
 
An anti-bikeshedding Kotlin linter with built-in formatter.
(https://github.com/pinterest/ktlint).
 
Usage:
  ktlint <flags> [patterns]
  java -jar ktlint.jar <flags> [patterns]
 
Examples:
  # Check the style of all Kotlin files (ending with '.kt' or '.kts') inside the current dir (recursively).
  #
  # Hidden folders will be skipped.
  ktlint
 
  # Check only certain locations starting from the current directory.
  #
  # Prepend ! to negate the pattern, KtLint uses .gitignore pattern style syntax.
  # Globs are applied starting from the last one.
  #
  # Hidden folders will be skipped.
  # Check all '.kt' files in 'src/' directory, but ignore files ending with 'Test.kt':
  ktlint "src/**/*.kt" "!src/**/*Test.kt"
  # Check all '.kt' files in 'src/' directory, but ignore 'generated' directory and its subdirectories:
  ktlint "src/**/*.kt" "!src/**/generated/**"
 
  # Auto-correct style violations.
  ktlint -F "src/**/*.kt"
 
  # Using custom reporter jar and overriding report location
  ktlint --reporter=csv,artifact=/path/to/reporter/csv.jar,output=my-custom-report.csv
Flags:
 
      --code-style=<codeStyle>
                        Defines the code style (ktlint_official, intellij_idea or android_studio) to be used for formatting the code. This option is deprecated, and will be removed in Ktlint 1.1. The code style has to be defined as '.editorconfig' property 'ktlint_code_style'.
      --color           Make output colorful
      --color-name=<colorName>
                        Customize the output color
      --disabled_rules=<disabledRules>
                        Comma-separated list of rules to globally disable. This option is deprecated, and will be removed in Ktlint 1.1. The disabled rules have to be defined as '.editorconfig' properties. See https://pinterest.github.io/ktlint/1.0.0/faq/#how-do-i-enable-or-disable-a-rule
  -F, --format          Fix deviations from the code style when possible
      --limit=<limit>   Maximum number of errors to show (default: show all)
      --relative        Print files relative to the working directory (e.g. dir/file.kt instead of /home/user/project/dir/file.kt)
      --reporter=<reporterConfigurations>
                        A reporter to use (built-in: plain (default), plain?group_by_file, plain-summary, json, sarif, checkstyle, html). To use a third-party reporter specify a path to a JAR file on the filesystem via ',artifact=' option. To override reporter output, use ',output=' option.
  -R, --ruleset=<rulesetJarPaths>
                        A path to a JAR file containing additional ruleset(s)
      --stdin           Read file from stdin
      --patterns-from-stdin[=<stdinDelimiter>]
                        Read additional patterns to check/format from stdin. Patterns are delimited by the given argument. (default is newline) If the argument is an empty string, the NUL byte is used.
      --editorconfig=<editorConfigPath>
                        Path to the default '.editorconfig'. A property value from this file is used only when no '.editorconfig' file on the path to the source file specifies that property. Note: up until ktlint 0.46 the property value in this file used to override values found in '.
                          editorconfig' files on the path to the source file.
      --experimental    Enable experimental rules. This option is deprecated, and will be removed in Ktlint 1.1. The experimental flag has to be set as '.editorconfig' property 'ktlint_experimental'. See https://pinterest.github.io/ktlint/1.0.0/faq/#how-do-i-enable-or-disable-a-rule-set
      --baseline=<baselinePath>
                        Defines a baseline file to check against
  -l, --log-level=<minLogLevel>
                        Defines the minimum log level (trace, debug, info, warn, error) or none to suppress all logging
  -h, --help            Show this help message and exit.
  -V, --version         Print version information and exit.
Commands:
  installGitPreCommitHook  Install git hook to automatically check files for style violations on commit
  installGitPrePushHook    Install git hook to automatically check files for style violations before push
  generateEditorConfig     Generate kotlin style section for '.editorconfig' file.
```

다음은 ktlint의 `format` 기능으로 Kotlin 코드를 변환한 예시입니다. 변경된 내용을 확인하기 위해 Shell 명령어인 [`diff`](https://ko.wikipedia.org/wiki/Diff)를 사용했습니다(`diff`는 텍스트를 행 단위로 비교하며 -/+로 삭제 또는 추가된 부분을 표시합니다).

```kotlin
-    override fun getResponse(
-        response: T,
-        context: Context,
-    ): T? {
+    override fun getResponse(response: T, context: Context,): T? {
```

```kotlin
-            override fun getBindingAccessor():
-                BindingAccessor {
+            override fun getBindingAccessor(): BindingAccessor {
                 TODO("Not yet implemented")
```

## 린트 자동 적용 시 발생할 수 있는 문제

그런데 린트를 사용할 때 문제가 하나 있습니다. 많은 개발자들이 이미 만들어 놓은 코드에 린트를 처음 적용할 때, 혹은 린트의 버전이 올라가면서 많은 규칙이 추가됐을 때 문제가 발생합니다. 소스 규모가 작은 경우에는 직접 수정할 수 있겠지만 그렇지 않다면 코드의 많은 부분이 변경돼 난감한 상황이 발생할 수 있습니다. 물론 ktlint의 format 기능을 이용하면 많은 파일을 한 번에 규칙에 맞게 수정할 수 있지만, 모든 도구가 그렇듯 완벽하게 작동하지는 않습니다.

이 문제를 ktlint 최신 버전의 format 기능을 이용해 개정된 린트 규칙을 자동으로 적용한 예시와 함께 살펴보겠습니다. 아래 예시는 ktlint가 업데이트되면서 코드의 길이를 100자로 제한하는 [max-line-length](https://pinterest.github.io/ktlint/0.48.0/rules/standard/#max-line-length)가 [주석](https://pinterest.github.io/ktlint/0.48.0/faq/#disabling-for-one-specific-line-using-eol-comment)이 아닌 [어노테이션](https://pinterest.github.io/ktlint/1.0.1/faq/#how-do-i-suppress-errors-for-a-lineblockfile)을 사용하도록 변경됐을 때 이를 ktlint의 자동 수정 기능을 이용해 변경한 결과입니다.

##### 린트 포매터의 오동작 예제

```kotlin
-        @DimenRes size: Int = packege.commom.resources.R.dimension.middle_size_auto_complete_area_text // ktlint-disable max-line-length
+        @Suppress("ktlint:standard:max-line-length")
+        @DimenRes
+        size 
     ) = (view as? TextView)?.setTextSize(
         TypedValue.COMPLEX_UNIT_PX,
         view.resources.getDimensionPixelSize(size).toFloat()
     )
```

변경 사항을 보면 알 수 있듯, ktlint가 기존 코드에 자동 포매팅을 적용하는 과정에서 size 파라미터의 기본 설정값(default argument) 누락됐습니다.

자동 포매팅을 이용해 대량의 소스 코드에 새로운 규칙을 적용할 경우, 컴파일 과정에서 오류가 발생하지 않는다면 위와 같이 일부 소스 코드가 잘못 변경된 경우를 찾기는 쉽지 않습니다. 따라서 어떤 식으로든 린트를 적용하기 전과 후의 코드 동작(behavior)이 동일하다는 것을 검증하는 과정이 필요합니다.

## 린트 적용 후 코드 대량 변경 시 검증하는 방법

그렇다면 어떤 식으로 검증해야 할까요? 저는 린트 적용 전후 코드를 검증하기 위한 방법을 여러 방면으로 고민하다가 AST를 이용해 검증하는 방법을 고안했습니다.

### AST를 이용한 검증 방법

일반적으로 코드가 실행 가능한 형태의 바이너리로 변환되는 과정은 어휘 분석 및 구문 분석 과정으로 시작합니다. 여기서 어휘 분석은 아래와 같이 코드를 의미가 있는 최소 단위(토큰)로 쪼개는 과정을 이야기합니다(참고: [Lexical Analysis, Syntax Analysis, Parsing, Semantic Analysis / 어휘 분석, 구문 분석, 의미 분석, 파싱](http://www.ktword.co.kr/test/view/view.php?m_temp1=5787)).

![image](https://images.gogumang.com/ac8a2b4af8/01.png)

다음으로 구문 분석은 문법에 맞게 모인 토큰으로 구성된 문장을 분석하는 단계입니다. 문장을 분석할 때는 트리 구조를 이용하는데요. 이를 [추상 구문 트리 (AST, Abstract Syntax Tree)](https://ko.wikipedia.org/wiki/%EC%B6%94%EC%83%81_%EA%B5%AC%EB%AC%B8_%ED%8A%B8%EB%A6%AC)라고 합니다. 추상적이라고 하는 이유는 실제 구문에는 표현돼 있는 모든 세세한 정보를 다 표현하지 않는다는 것을 의미합니다.

![image](https://images.gogumang.com/ac8a2b4af8/02.png)

컴파일러에서 수행하는 이 과정을 이용해 린트를 적용하기 전과 후를 비교할 수 있습니다. 이때 공백이나 어노테이션, 주석과 같이 코드의 가독성을 높이거나 이해를 돕기 위해 추가된 것으로 실제 작동에는 관여하지 않는 코드는 제외하고, 실제 작동에 관여하는 코드의 AST가 동일한지 비교하면 변경된 코드를 검증할 수 있습니다. 즉, 코드의 표현 방식만 변경된 것인지 확인할 수 있습니다.

### 검증 방법 구현 및 적용

이제 위 개념을 실제로 어떻게 구현해 적용했는지 살펴보겠습니다.

#### AST를 생성하기 위해 `kotlin-compiler-embeddable` 사용

먼저 AST를 생성하기 위해 아래와 같이 build.gradle.kts에 `kotlin-compiler-embeddable`를 추가합니다.

##### build.gradle.kts

```kotlin
dependencies {
    // Use the Kotlin JUnit 5 integration.
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
  
    // Use the JUnit 5 integration.
    testImplementation("org.junit.jupiter:junit-jupiter-engine:5.9.2")
  
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
  
    // This dependency is used by the application.
    implementation("com.google.guava:guava:31.1-jre")
    implementation("org.jetbrains.kotlin:kotlin-compiler-embeddable:1.9.0")
}
```

#### AST 노드 생성

AST 노드를 생성합니다. 아래 코드는 ktlint에서 사용하는 AST 초기화 로직을 가져와 구현한 것입니다.

* <https://github.com/pinterest/ktlint/blob/bdc82f8/ktlint-rule-engine/src/main/kotlin/com/pinterest/ktlint/rule/engine/internal/RuleExecutionContext.kt#L147-L169>

##### AST 노드

```kotlin
private val KOTLIN_PSI_FILE_FACTORY_PROVIDER = KotlinPsiFileFactoryProvider()

val psiFileFactory = KOTLIN_PSI_FILE_FACTORY_PROVIDER.getKotlinPsiFileFactory()
val psiFile = psiFileFactory.createFileFromText(
    filename,
    KotlinLanguage.INSTANCE,
    fileContents
) as KtFile
```

위 코드의 [PSI(Program Struct Interface)](https://plugins.jetbrains.com/docs/intellij/psi.html)는 IntelliJ IDEA와 같은 IDE에서 사용하는 개념으로, 소스 코드의 구조를 표현하는 데 사용하는 인터페이스입니다. AST 기반으로 사용하는 언어(예: Kotlin)를 위한 IDE의 확장 기능을 추가합니다.

#### Iterator 구현

코드를 토큰화한 후, AST의 각 노드를 탐색하며 비교할 대상을 가지고 옵니다.

##### Iterator

```kotlin
class KtASTIterator(private val rootNode: ASTNode) : Iterator<ASTNode>, Iterable<ASTNode> {
    private var visiting = Stack<ASTNode>()
  
    init {
        visiting.push(rootNode)
    }
  
    // 다음 노드가 존재하는지 확인합니다
    override fun hasNext(): Boolean {
        return visiting.isNotEmpty()
    }
  
    override fun next(): ASTNode {
        val node = visiting.pop()
        visiting.addAll(
                node.children().asIterable().reversed().filter {
                     // (공백, 주석, Suppress 어노테이션과 같이 로직과 연관 없는 부분은 제외합니다.) 
                     when (it.psi) {
                        is PsiWhiteSpace -> false
                        is PsiComment -> false
                        is KtAnnotationEntry -> {
                            !it.text.startsWith("@Suppress")
                        }
                        else -> true
                    }
                }
        )
  
        if (node is CompositeElement) {
            // 최소단위의 ast node가 아니면, 건너뜁니다.
            // println("CompositeElement ${node.text}")
            return next()
        }
        
        // 다음 노드의 토큰 값이 유의미한 경우 그 값을 반환합니다.  
        return node
    }
  
    override fun iterator(): Iterator<ASTNode> {
        return this
    }
}
```

#### PSI 트리 비교

앞서 구현한 Iterator를 이용해 PSI 트리를 검색해서 해당 노드의 변경 전후 값이 같은지 비교해 보면, 코드가 정상적으로 변경됐는지 확인할 수 있습니다.

```kotlin
// rev1: 자동 포매팅 적용 전의 코드
// rev2: 자동 포매팅 적용 후의 코드

// 자동 포매팅 적용 전후의 변경 내역이 있는 파일을 대상으로 검증을 진행
for (filename in Utils.getDiffFiles(rev1, rev2)) {
        println(filename)
         
        val before = Utils.getFileContentFromRev(rev1, filename)
        val after = Utils.getFileContentFromRev(rev2, filename)
  
        // 변경 전/후의 AST 노드를 가지고 옵니다.
        val root1 = getIterator(filename, before)
        val root2 = getIterator(filename, after)
  
        for ((node1, node2) in root1.zip(root2)) {
            // 변경 전/후의 코드를 비교합니다. 
            if (node1.text != node2.text) {
                // 변경 전/후의 코드가 같지 않으면, 변경된 내용을 출력합니다.
                val output = Utils.getOutput(listOf("git", "diff", rev1, rev2))
                println(output)
                println("text1 = ${node1.text}, text2 = ${node2.text}") 
                break
            }
        }
    }
```

#### 실행 결과

다음은 앞서 과정을 통해 만든 프로그램을 이용해서 현재 커밋돼 있는 코드(`HEAD`)와 바로 전에 커밋된 코드(`HEAD~1`)를 비교한 실행 결과입니다.

```bash
❯ app HEAD~1 HEAD                                           
CameraViewController.kt // 변경된 파일 이름
diff --git a/CameraViewController.kt b/CameraViewController.kt 
index ce20e0853b2f..9f8acd5ceee6 100644 
--- a/CameraViewController.kt
+++ b/CameraViewController.kt
@@ -237,6 +237,6 @@ class CameraViewController(
  
     companion object {
         private const val NUM_OF_VIDEO_ITEM: Int = 1
-        private /*const*/ val NOT_ASSIGNED_LONG = VideoFragment.NOT_ASSIGNED.toLong()
+        private const val NOT_ASSIGNED_LONG = VideoFragment.NOT_ASSIGNED.toLong()
     }
 }

text1 = val, text2 = const
```

변경 전 코드에서는 `/*const*/`가 주석으로 처리돼 있었는데 자동 포매팅 적용 후 주석 처리가 누락돼 실제 적용되는 코드로 변경됐습니다. `text1`은 앞에 주석 처리된 `/*const*/`가 의미가 없는 구문으로 처리돼 `val`이 할당됐고, `text2`는 주석 처리가 누락돼 `const`를 유의미한 구문으로 인지해 `const`가 할당됐습니다. `text1`과 `text2`의 값이 서로 다르기 때문에 앞서 'PSI 트리 비교'에서 살펴본 검증하는 코드에서 이를 감지하고 메시지를 출력합니다.

#### 비교하기 전에 고려해야 할 것

아래와 같이 수정 전의 코드에 불필요한 괄호(`()`)가 들어가 있을 때 자동 포매팅 실행 과정에서 이 괄호가 제거되면, 단순 AST를 비교하는 과정에서는 구문이 달라진 것으로 인지합니다. 따라서 오토 포매팅을 적용하기 전에 이와 같은 부분은 모두 정리한 뒤 AST를 비교하는 것이 좋습니다.

##### 린트 포매터가 오동작을 일으킬 수 있는 예제

```kotlin
     fun readFrom(uri: Uri?) {
-        executeByCached() {
+        executeByCached {
             val image = convert(uri)
             if (image == null) {
                  
...
 
             if (data == null) return
-            executeByCached() {
+            executeByCached {
                 val image = convert(rawData, cameraParameter)
                     ?: return@executeByCached
                 val uri = convert(image) ?: return@executeByCached
```

### ktlint 실제 사용 사례

이제 다시 AST를 이용한 ktlint 실행 결과를 살펴보겠습니다. 이번에 ktlint를 업데이트한 후 아래와 같이 이전 버전에서는 발생하지 않았던 린트 오류가 300,000건 이상 발생했습니다.

##### ktlint를 이용해 발견한 오류 정보

```bash
Summary error count (descending) by rule:
  standard:indent: 115006
  standard:multiline-expression-wrapping: 77800
  standard:function-signature: 72940
  standard:wrapping: 21745
  standard:argument-list-wrapping: 14571
  standard:no-empty-first-line-in-class-body: 8324
  standard:blank-line-before-declaration: 4990
  standard:discouraged-comment-location: 4371
  standard:parameter-list-wrapping: 2829
  standard:comment-wrapping: 2824
  standard:string-template-indent: 2609
  standard:chain-wrapping: 2136
...
```

아래는 자동 포매터를 이용해 수정한 뒤 다시 ktlint를 실행한 결과입니다. 280,000건 이상을 자동으로 수정할 수 있었습니다. 만일 자동 포매터가 수정한 280,000건의 오류를 사람이 직접 수정해야 했다면, 분당 한 건씩 하루에 8시간을 쉬지 않고 수정한다고 가정해도 2년에 가까운 수정 시간이 필요합니다. 다시 말해 린트 프로그램의 업데이트 속도를 사람이 따라갈 수 없을 정도의 분량이었는데 자동 포매터를 이용해 단 몇 분만에 수정할 수 있었습니다.

##### 자동 포매터를 이용한 후 남은 오류의 개수

```bash
Summary error count (descending) by rule:
  standard:max-line-length: 9266
  standard:discouraged-comment-location: 7064
  standard:comment-wrapping: 2873
  standard:package-name: 1164
  standard:function-naming: 688
  standard:property-naming: 578
  standard:no-consecutive-comments: 541
 ...
```

또한 이때 AST 분석을 이용해 검증하지 않았다면 자동으로 변환된 280,000건을 모두 사람이 눈으로 일일이 확인하면서 검증해야 했는데요. 자동으로 코드의 구조를 비교해 문제가 있다고 확인된 부분만 따로 추출해서 검증 및 수정할 수 있게 돼 리뷰 및 검증에 소요되는 시간을 대폭 줄일 수 있었습니다.

## 마치며

이 글에서는 다음 두 가지 내용을 다뤘습니다.

* ktlint와 같은 린트를 이용한 코드 스타일 규격화
* 코드 스타일 변경으로 코드 대량 변경 발생 시 AST를 이용해 코드 변경 내역 검증

회사에서 업무를 진행할 때 혼자 힘으로만 결과물을 내는 경우는 흔치 않습니다. 대부분 여러 사람이 함께 작업하게 되는데요. 이때 각자 작성한 코드를 일정한 규칙을 적용해 규격화하지 않으면 작업한 코드에 문제가 생기거나 개선이 필요할 때, 작성자에게 물어보거나 코드 구조를 분석하기 위해 시간을 추가로 소비해야 합니다. 따라서 코드를 작성할 때 공통의 규칙을 설정하고 모두가 이를 준수하면서 작성해야 불필요한 시간 낭비를 막을 수 있습니다.

또한, 여러 사람이 여러 목적으로 코드를 추가하다 보면 코드의 양이 방대해지는데 이렇게 방대해진 코드를 앞서 정해진 규칙을 한 번에 적용하는 등의 이유로 대량으로 수정해야 할 때가 있습니다. 이때 각 코드를 일일이 리뷰하거나 검증하는 것은 매우 힘든 일입니다. 따라서 수정 작업 전에 검증 방안을 미리 고려해 두는 것이 좋습니다. 이 글에서 소개한 AST 분석을 이용한 검증은 대량의 코드 수정이 발생했을 때 어떻게 검증할 수 있을지 고민하다가 찾아낸 방법입니다.

간혹 업무를 진행하면서 바로 앞에 닥친 숙제나 문제를 해결하는 데에만 집중하느라 해결 이후 검증이나 전처리 과정에는 소홀해질 때가 있습니다. 하지만 이런 부분까지 꼼꼼히 챙겨야 더 나은 개발자로 한 걸음 나아갈 수 있다고 생각하며, 다른 동료와도 보다 유연하게 협업할 수 있을 것이라고 생각합니다.

### 참고 자료

* <https://en.wikipedia.org/wiki/Abstract_syntax_tree>
* <https://craftinginterpreters.com/a-map-of-the-territory.html#the-parts-of-a-language>
* <https://git.linecorp.com/ganachoco/ktlint-validator>
* <https://yceffort.kr/2021/05/ast-for-javascript>
* <https://astexplorer.net/>