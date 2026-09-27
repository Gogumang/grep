안녕하세요, ABC Studio에서 Demaecan(出前館, 이하 데마에칸) 앱을 개발하고 있는 김종식입니다. 데마에칸은 2000년부터 서비스를 시작한 일본 최대 규모의 음식 배달 서비스로 ABC Studio는 2021년 봄부터 프로덕트 개선에 참여하고 있습니다.

한 팀에서 문법 작성 규칙을 일관되게 유지하는 방법으로 린트(lint)를 활용하는 방법이 있습니다. 이번 글에서는 Flutter에서 기본으로 제공하는 린트 외에 팀에서 필요한 규칙을 새로 만들고 IDE(통합 개발 환경)에서 활용한 사례를 소개하겠습니다. 이 방법을 사용하면 팀 전체가 동일한 코딩 스타일로 개발하도록 유도할 수 있습니다.

## Flutter에 커스텀 린트를 도입한 배경

그동안에는 기획과 디자인, QA뿐 아니라 유관 부서 관계자분들까지 빌드한 앱을 모두 설치해서 확인해야 했습니다. 이때 특정 버전을 정확히 설치해서 확인해야 했기 때문에 잘못된 버전을 설치하면서 오해가 발생하기도 했습니다. 그런데 Flutter는 웹으로도 빌드가 가능합니다. 따라서 제가 담당하고 있는 앱을 웹으로 빌드하면 매번 디바이스에 설치할 필요 없이 즉시 최신 버전으로 확인할 수 있겠다고 생각했습니다.

하지만 막상 웹 타깃으로 빌드를 실행해 보니 몇 가지 문제가 있었는데요. 특히 가장 먼저 어떤 플랫폼에서 실행되는지 확인하는 코드를 수정해야 했습니다.

Flutter 프로젝트에서 플랫폼을 확인하는 방법에는 몇 가지가 있습니다. 여러 방법 중 `Platform.isAndroid`와 `Platform.isIOS`를 활용하는 방법이 가장 간단할 텐데요. 이 방법을 활용할 경우 웹에서는 아래와 같은 오류가 발생하며 정상적으로 작동하지 않습니다.

```bash
Error: Unsupported operation: Platform._operatingSystem 
```

이에 저희 팀에서는 `dart:io` 패키지의 `Platform`을 참조하는 대신, `flutter` 패키지의 `defaultTargetPlatform`을 활용해 플랫폼 확인 코드를 래핑한 형태로 `Platform`과 유사한 구현체를 작성한 뒤, 기존 코드에 사용하고 있는 코드를 변경하는 리팩토링 작업을 수행했습니다. `defaultTargetPlatform`을 활용하면 또 다른 이점도 있는데요. 각 플랫폼별로 작성해야 하는 로직에 대해서, `debugDefaultTargetPlatformOverride`을 이용해 플랫폼별 테스트 코드를 작성할 때도 이점이 있습니다.

리팩토링 결과는 아래 코드와 같습니다. 이제 프로젝트에서 `Platform.isAndroid`와 `Platform.isIOS`를 더 이상 사용하지 않게 수정했습니다.

```dart
/// Platform.*** Wrapping class, use PlatformHelper.*** instead.
class PlatformHelper {
  static bool get isAndroid => defaultTargetPlatform == TargetPlatform.android;
  static bool get isIOS => defaultTargetPlatform == TargetPlatform.IOS;
  ...
}

// AS-IS
if (Platform.isAndroid) { ... } 

// TO-BE
 if (PlatformHelper.isAndroid) { ... } 
```

이 작업에 대한 코드 리뷰를 진행하면서 앞으로 `Platform.isAndroid`와 `Platform.isIOS` 사용에 제약을 두는 린트 규칙을 추가하는 것을 논의했는데요. 이 논의가 Flutter 커스텀 린트 도입의 시작입니다.

## Flutter 린트 사용 방법

먼저 린트를 사용하는 방법을 알아봅시다. Flutter는 Dart 언어로 작성합니다. Dart 공식 문서에서는 [Effective Dart](https://dart.dev/tools/linter-rules)를 통해 코드 작성의 모범 사례를 소개하고 있습니다(Flutter 개발을 하신다면 반드시 한 번 읽어보는 것을 추천합니다 🙂). 이 문서에서는 좋은 코드를 작성하는 여러 규칙을 소개하고 있으며, [Dart tools \> Linter rules](https://dart.dev/tools/linter-rules) 목록에서 각 규칙의 자세한 내용과 대응 방법을 확인할 수 있는데요. 개인적으로 모든 린트 규칙을 활성화해서 활용하는 것만으로도 팀에서 관리하는 프로젝트의 코드 품질을 충분히 좋은 수준으로 유지할 수 있을 것이라고 생각합니다.

Flutter는 앞서 말한 Dart에서의 모범 사례들을 모아서 [flutter_lints](https://pub.dev/packages/flutter_lints) 패키지로 제공합니다. Dart를 사용할 수 있는 IDE에서는 분석기(analyzer)에서 분석한 결과가 IDE UI로 표시되며, `flutter analyze`를 이용해 수동으로 검사할 수도 있습니다.

Flutter 프로젝트에서 flutter_lint를 설정하는 방법은 아래와 같습니다.

1. 린트 패키지 추가하기: pubspec.yaml 파일에 flutter_lints 패키지를 추가하고 flutter pub get 명령을 실행합니다.

   ```yaml
   dev_dependencies:
     flutter_lints: ^3.0.2
   ```

2. 린트 규칙 설정하기: 프로젝트 루트 디렉터리에 analysis_options.yaml 파일을 만들고 필요한 린트 규칙을 설정합니다(보통 파일이 이미 생성돼 있습니다).

   ```yaml
   include: package:flutter_lints/flutter.yaml 
   linter:
     rules:
       avoid_empty_else: true
       prefer_is_not_empty: true
       # Add additional lint rules (https://dart.dev/tools/linter-rules)
   ```

## Flutter에서 커스텀 린트를 추가하는 방법

### 커스텀 린트 만드는 방법

커스텀 린트 규칙을 추가할 수 있도록 공식적으로 지원해 달라는 요청은 오래전부터 꾸준히 있었는데요. 아직 지원되지 않고 있습니다(이와 관련된 이슈는 이 [링크](https://github.com/dart-lang/linter/issues/697)를 참조하세요). 현재 사용할 수 있는 방법 중 정석적인 방법으로는 [analyze_server](https://github.com/dart-lang/sdk/tree/master/pkg/analysis_server)를 이용해 분석 결과를 다른 도구와 연계하도록 구성하고 직접 만드는 방법이 있고, [analyzer_plugin](https://pub.dev/packages/analyzer_plugin)을 활용하는 방법도 알려져 있습니다. 하지만 이와 같은 방법들은 기본적으로 커스텀 린트를 만들고 관리하는 사용자, 즉 엔지니어에게 친화적이지 않습니다.

그 대신 커스텀 린트를 쉽게 작성하고 관리하는 데 사용할 만한 방법으로 [custom_lint](https://pub.dev/packages/custom_lint) 패키지를 이용하는 방법이 있습니다. 이 방법의 장점은 다음과 같습니다.

* 작성한 목록을 별도로 확인하기 위한 CLI 커맨드를 만들 필요가 없습니다.
* 프로젝트 설정이 단순합니다. analyzer 서버의 오류를 대응하지 않아도 custom_lint가 알아서 대응하므로 린트 규칙 작성에만 집중할 수 있습니다.
* 핫 리로드(hot-reload)와 핫 리스타트(hot-restart)를 지원합니다. 플러그인 소스 코드를 업데이트하면 IDE와 analyzer_server가 자동으로 재시작됩니다.
* 단일 코드 라인 혹은 파일 전체에 린트 규칙 예외를 지정할 수 있는 `// ignore:`와 `// ignore_for_files:`을 지원합니다.
* 린트 규칙 구성 과정을 위해 `print` 함수와 `exception` 발생을 지원합니다. 사용자가 출력한 메시지나 오류 출력이 필요하다면 로그 파일(custom_lint.log 파일)을 생성합니다.

### 커스텀 린트 패키지 만드는 방법

먼저 `Platform.isAndroid`와 `Platform.isIOS`를 사용하는 경우 린트 오류를 표시하는 규칙(`use_platformhelper_instead`)을 커스텀 린트 패키지로 만드는 것부터 시작합니다(참고로, 이 글은 `custom_lint: 0.6.4`와 `analyzer: 5.13.0` 기준으로 정리했습니다).

1. Dart 프로젝트를 하나 생성해서 pubspec.yaml에 다음과 같이 `analyzer`와 `custom_lint_builder` 패키지를 참조하도록 설정한 후 `dart pub get` 명령을 실행합니다.

   ```yaml
   # pubspec.yaml
   name: use_platformhelper_instead
   description: A starting point for Dart libraries or applications.
   version: 1.0.0
    
   environment:
     sdk: ^3.0.3
    
   # Add regular dependencies here.
   dependencies:
     # we will use an analyzer for inspecting Dart files
     analyzer: ^5.13.0
     # custom_lint_builder will give us tools for writing lints
     custom_lint_builder: ^0.5.11
   ```

2. 생성한 패키지에서 lib/{package_name}.dart 또는 bin/{package_name}.dart 파일을 생성하고 커스텀 린트 규칙을 작성합니다. custom_lint 패키지가 실행되면 `createPlugin()` 함수를 자동으로 실행하도록 돼 있습니다. 이때 대상 파일 이름과 패키지 이름이 동일하게 설정돼 있어야 `createPlugin()` 함수가 정상적으로 호출됩니다. 제대로 설정되지 않은 경우 정상적으로 호출되지 않으며, custom_lint.log 파일에서 오류 상세 내용을 확인할 수 있습니다.
   **use_platformhelper_instead.dart**

   ```dart
   import 'package:analyzer/error/error.dart';
   import 'package:analyzer/error/listener.dart';
   import 'package:custom_lint_builder/custom_lint_builder.dart';

   // This is the entrypoint of our custom linter
   PluginBase createPlugin() => _ExampleLinter();
    
   /// A plugin class is used to list all the assists/lints defined by a plugin.
   class _ExampleLinter extends PluginBase {
     /// We list all the custom warnings/infos/errors
     @override
     List<LintRule> getLintRules(CustomLintConfigs configs) => [
           _UsePlatformHelperLintRules(),
         ];
   }   

   class _UsePlatformHelperLintRules extends DartLintRule {
     const _UsePlatformHelperLintRules() : super(code: _code);

     /// Metadata about the warning that will show-up in the IDE.
     /// This is used for `// ignore: code` and enabling/disabling the lint
     static const _code = LintCode(
       name: 'use_platformhelper_instead',
       problemMessage: "'Platform.{0}' should not be used",
       correctionMessage: "Use 'PlatformHelper.{0}' instead",
       errorSeverity: ErrorSeverity.ERROR,
     );

     @override
     void run(
       CustomLintResolver resolver,
       ErrorReporter reporter,
       CustomLintContext context,
     ) {
       /// The addPrefixedIdentifier checks the grammar of the [xxx].[xxx] format to forward the callback as node.
       context.registry.addPrefixedIdentifier((node) {
         final beginToken = node.beginToken;
         final endToken = node.endToken;
         if (beginToken.value().toString() == 'Platform' && endToken.value().toString() == 'isAndroid' ||
             beginToken.value().toString() == 'Platform' && endToken.value().toString() == 'isIOS') {
           /// Report a lint error.
   		reporter.reportErrorForNode(code, node, [endToken.value().toString()]);
         }
       });
     }
   }
   ```

   여기까지 진행하면 커스텀 린트 규칙을 구현하는 패키지 준비가 완료됩니다.
3. Flutter 앱에서는 다음과 같이 analysis_options.yaml 파일에 플러그인을 추가합니다. analysis_options.yaml에서 flutter_lint 설정 방법과 유사하게 린트 옵션을 켜거나 끌 수 있습니다([참조](https://github.com/invertase/dart_custom_lint/tree/main?tab=readme-ov-file#enablingdisabling-and-configuring-lints)).

   ```yaml
   # analysis_options.yaml 
   analyzer:   
     plugins:
       - custom_lint
   ```

4. Flutter 앱에서 pubspec.yaml에 dev_dependencies를 업데이트합니다.

   ```yaml
   # The pubspec.yaml of an application using our lints
   name: example_app:
     sdk: ">=3.0.0 <4.0.0"

   dev_dependencies:
     custom_lint:   
     use_platformhelper_instead:
       path: // package path
   ```

이제 IDE UI에 'use_platformhelper_instead' 오류가 표시됩니다. 만약 바로 표시되지 않는다면 Flutter 프로젝트에서 flutter pub get 명령을 실행해 보세요.

## 커스텀 린트 조금 더 살펴보기

### 기본 사용 방법

[PluginBase](https://github.com/invertase/dart_custom_lint/blob/main/packages/custom_lint_core/lib/src/plugin_base.dart) 코드에서는 Lint Rule과 Assists, 두 가지 규칙을 정의할 수 있으며, 여러 가지 린트 규칙을 작성해 한 번에 등록할 수도 있습니다. LintRule를 이용해 상세 린트 규칙을 정의할 수 있고, Assists를 통해 리팩토링에 도움 되도록 구성할 수 있습니다(Assists는 필수 구현 대상은 아닙니다).

구체적으로는 커스텀 린트의 오류 코드 정의, 기본 동작 여부, 분석 대상 파일 등을 메서드 오버라이드를 이용해 설정할 수 있습니다(커스텀 린트 작성 샘플은 [링크](https://github.com/invertase/dart_custom_lint/tree/main/packages/custom_lint/example)를 참조하세요).

```dart
import 'package:custom_lint_builder/custom_lint_builder.dart';

// Entrypoint of plugin
PluginBase createPlugin() => _MyLintPlugin();

// The class listing all the [LintRule]s and [Assist]s defined by our plugin
class _MyLintPlugin extends PluginBase {
  // Lint rules
  @override
  List<LintRule> getLintRules(CustomLintConfigs configs) => [];

  // Assists
  @override
  List<Assist> getAssists() => [];
}
```

아래는 [VS Code](https://code.visualstudio.com/) 화면을 캡처한 것으로 Lint Rules와 Assists는 IDE에서 다음과 같이 나타납니다. Fix와 Assist에 대해서는 아래에서 별도로 설명하겠습니다.

![image](https://images.gogumang.com/bdabd6de78/01.png)

### Dart 문법 감지

`NodeListRegistry`에서 제공하는 `add`로 시작하는 여러 함수에서 규칙으로 만들고 싶은 구체적인 Dart 문법에 대한 콜백을 받을 수 있습니다. 각 규칙이 실제 어떤 형식과 값을 가지고 있는지는 콜백으로 전달되는 노드의 타입을 보고 확인할 수 있는데요. 이 노드 타입은 `analyzer` 패키지에 선언돼 있습니다(`NodeListRegistry`에서 제공하는 전체 함수 목록은 이 [링크](https://github.com/invertase/dart_custom_lint/blob/e9b8af34b737ed6130236ccd28391943fc68a905/packages/custom_lint_core/lib/src/node_lint_visitor.g.dart#L1241)를, Dart 문법의 상세 정의는 이 [링크](https://github.com/dart-lang/sdk/blob/main/pkg/analyzer/lib/src/dart/ast/ast.dart)를 참조하세요).

IDE에서 어떤 콜백인지, 어떤 문법을 참조하고 있는지는 손쉽게 확인할 수 있습니다. 각 문법 형식에 대해 `add`로 시작하는 함수를 등록한 뒤 `reportErrorForNode` 함수를 활용하면 구체적으로 노드가 어떤 형태인지를 감지한 것인지 확인이 가능합니다. 노드에 대한 보다 자세한 정보나 부가 정보 확인이 필요하다면 `print` 함수를 이용해 custom_lint.log 파일에 정보를 출력해서 이를 확인해 가며 린트 규칙을 작성할 수 있습니다.

아래는 `NodeListRegistry`에서 제공하는 함수와 콜백으로 전달되는 노드 타입 정의 목록의 일부입니다.

| **NodeListRegistry 함수(custom_lint 패키지)** |  **매칭 패턴(analyzer 패키지)**  |                                                                                                                                                                                                       **문법 요약**                                                                                                                                                                                                       |
|------------------------------------------|---------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `addPrefixedIdentifier`                  | `PrefiedIdentifier`       | `/// An identifier that is prefixed or an access to an object property where the` `/// target of the property access is a simple identifier.` `///` `/// prefixedIdentifier ::=` `/// [SimpleIdentifier] '.' [SimpleIdentifier]` `///` `/// Clients may not extend, implement or mix-in this class.`                                                                                                                  |
| `addDeclarredVariablePattern`            | `DeclaredVariablePattern` | `/// A variable pattern that declares a variable.` `///` `/// variablePattern ::=` `/// ( 'var' | 'final' | 'final'? [TypeAnnotation])? [Identifier]` `///` `/// Clients may not extend, implement or mix-in this class.`                                                                                                                                                                                             |
| `addClassDeclaration`                    | `ClassDeclaration`        | `/// The declaration of a class.` `///` `/// classDeclaration ::=` `/// classModifiers 'class' name [TypeParameterList]?` `/// [ExtendsClause]? [WithClause]? [ImplementsClause]?` `/// '{' [ClassMember]* '}'` `///` `/// classModifiers ::= 'sealed'` `/// | 'abstract'? ('base' | 'interface' | 'final')?` `/// | 'abstract'? 'base'? 'mixin'` `///` `/// Clients may not extend, implement or mix-in this class.` |
| `addBooleanLiteral`                      | `BooleanLiteral`          | `/// A boolean literal expression.` `///` `/// booleanLiteral ::=` `/// 'false' | 'true'` `///` `/// Clients may not extend, implement or mix-in this class.`                                                                                                                                                                                                                                                         |
| ...                                      | ...                       | ...                                                                                                                                                                                                                                                                                                                                                                                                                   |

### Fix와 Assist 추가하기

Fix와 Assist는 아래 예시 영상과 같이 코드 레벨에서 직접 수정해 주는 기능입니다.

두 가지 모두 반드시 구현할 필요는 없습니다만 완성도를 높이기 위해 시도해 보겠습니다.

* PluginBase에서 구현한 LintRule에서 리포트하는 오류에 대해 Fix 구현체를 생성해 정의합니다.
* PluginBase에서 원하는 수정 지원 코드를 Assist로 생성해 정의합니다.

Fix와 Assist 모두 실제 코드를 수정한다는 점에서 비슷하지만, Fix는 린트 오류가 발생해야 이후 동작을 정의할 수 있다는 차이가 있습니다. `reportError`로 시작하는 함수의 `data` 파라미터를 이용하면 오류 케이스에 대해 개발자가 원하는 형태로 출력 메시지, 수정 방법을 커스터마이징할 수 있습니다.

아래 코드는 앞서 소개한 `use_platformhelper_instead` 린트 오류가 발생했을 때 Fix를 통해 수정하는 기능을 제공하는 코드입니다.

```dart
class _UsePlatformHelperLintRules extends DartLintRule {
  @override
  void run(
    CustomLintResolver resolver,
    ErrorReporter reporter,
    CustomLintContext context,
  ) {
    context.registry.addPrefixedIdentifier((node) {
      final beginToken = node.beginToken;
      final endToken = node.endToken;
      if (beginToken.value().toString() == 'Platform' && endToken.value().toString() == 'isAndroid' ||
          beginToken.value().toString() == 'Platform' && endToken.value().toString() == 'isIOS') {
        final token = endToken.value().toString();
        // Report additional information includes that caused the error. (at data param)
        reporter.reportErrorForNode(code, node, [token], [], token);
      }
    });
  }  

  @override
  List<Fix> getFixes() => [_UsePlatformHelperLintFix()];
}

class _UsePlatformHelperLintFix extends DartFix {
  @override
  void run(
    CustomLintResolver resolver,
    ChangeReporter reporter,
    CustomLintContext context,
    AnalysisError analysisError,
    List<AnalysisError> others,
  ) {
    context.registry.addPrefixedIdentifier((node) {
      // Verify that the error target that you want to fix is the part that was received from error report.
      if (!analysisError.sourceRange.intersects(node.sourceRange)) {
        return;
      }
      // Check for additional data passed to the error report.
      final token = analysisError.data;
      if (token == null) {
        return;
      }
      // Creates a fix proposal item.
      final changeBuilder = reporter.createChangeBuilder(
        message: 'Change to PlatformHelper.$token',
        priority: 1,
      );
      // Proceed actual code fix at the code level
      changeBuilder.addDartFileEdit((builder) {
        builder.importLibraryElement(Uri.parse(_importPath));
        builder.addSimpleReplacement(node.sourceRange, 'PlatformHelper.$token');
      });
    });
  }
}
```

위 코드는 `import` 구문도 자동으로 추가하도록 구현돼 있는데요. 커스텀 린트 구현 패키지 관점에서는 `PlatformHelper`의 파일 위치를 알 수 없는 외부 의존 정보 참조 이슈가 발생합니다. 이 아래와 같이 패키지 구성 방식을 변경해 대응할 수 있습니다.

앱과 관련된 의존 정보를 제공하는 별도 패키지를 분리하고, 앱과 Flutter 린트 패키지가 각각 리소스 정보를 제공하는 패키지를 참조하도록 구성합니다.

`PlatformHelper` 기능을 제공하는 패키지를 별도로 분리하고 이 패키지에서 커스텀 린트를 제공하도록 구성합니다.

## 커스텀 린트 참조 정보

### Dart run custom_lint

Flutter 프로젝트에서는 `flutter analyze` 혹은 `dart analyze` 명령어를 이용해 린트 오류를 체크할 수 있지만, custom_lint 패키지로 작성한 린트는 해당 명령어와 별개로 작동합니다. 따라서 린트 표시 옵션으로 `Error`를 설정하고 IDE에서 빌드 및 실행 버튼을 클릭하거나 터미널에서 `flutter build (run)` 명령어를 실행한 뒤 커스텀 린트 위반 사항이 발생해도 정상적으로 작동합니다.

IDE나 CI/CD 환경 등에서 커스텀 린트 위반 사항을 확인하기 위해서는 아래 명령어를 실행해 커스텀 린트 규칙 위반 사항을 확인하기 위한 별도 작업을 진행해야 합니다. 단, 이 경우 빌드 및 실행 과정에서 추가로 시간이 필요한데요. IDE UI에서 `Warning`이나 `Error`가 표현되는 것만으로도 괜찮다면 별도 작업을 진행하지 않아도 좋습니다.

```bash
$flutter pub run custom_lint
// 또는 
$dart run custom_lint
```

### Android Studio에서 실행하기

Flutter 개발이 가능한 IDE로 알려져 있는 [Android Studio](https://docs.flutter.dev/tools/android-studio)에서도 잘 작동합니다.

![image](https://images.gogumang.com/bdabd6de78/02.png)

Android Studio에서 custom_lint 패키지가 작동하려면 Android Studio에 열려 있는 프로젝트(최상위 폴더)가 Flutter 또는 Dart 프로젝트로 인식돼야 합니다. 그렇지 않으면 정상 작동하지 않습니다.

## 마치며

팀에서 커스텀 린트를 만들어 활용한다고 하면 비용 부담이 걱정될 수도 있습니다. 하지만 custom_lint 패키지를 활용할 경우 크게 부담이 없었고, 그 결과로 얻을 수 있는 이점은 매우 컸습니다. 개인적으로는 프로젝트 코드 레벨에서 좀 더 손쉽게 뉴비의 온보딩을 도와줄 수 있고, 팀에 딱 맞는 스타일로 구성할 수 있으므로 팀원 모두 보다 효율적으로 협업할 수 있으며, 휴먼 에러를 방지하기에 아주 좋은 방법이라고 생각합니다.

이 글을 통해 Flutter 프로젝트에서 커스텀 린트를 활용하고, 팀 차원에서 더 나은 코드를 유지할 수 있는 몇 가지 힌트를 얻으시면 좋겠습니다. 긴 글 읽어주셔서 감사합니다.

### 참조 링크

* [Custom Linter Rule for Dart Analyzer - Flutter Global Summit'23 talk by Oleksandr Leushchenko](https://www.youtube.com/watch?v=g9NAgb3KyaU)
* [Custom lints for your Dart/Flutter project](https://coder-with-a-bushido.medium.com/custom-lints-for-your-dart-flutter-project-9447a596c1f0)
* [Announcing the Dart Custom Lint package](https://invertase.io/blog/announcing-dart-custom-lint)
* [Custom Linter Rules](https://invertase.io/blog/custom-linter-rules)