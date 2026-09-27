Java 11

2018년 09월 25일에 final release된 신규 버전의 jdk 입니다. 신규 features는 아래의 JEPS에서 살펴보실 수 있습니다.

http://openjdk.java.net/projects/jdk/11/

jdk 11 버전에는 약 90개의 신규 feature들이 공개되었는데요, 그 중 몇 가지를 예시와 함께 살펴보도록 하겠습니다.

# Big features

## (JEP 323) Local-Variable Syntax for Lambda Parameters

```java
list.stream()
    .map((var s) -> s.toLowerCase())
    .collect(Collectors.toList());
```

jdk 10 버전에서 지역변수로써 사용할 수 있는 `var`가 새로운 feature로 추가되었었는데요. jdk 11 버전에서는 `var`를 람다 표현식을 쓰는 경우에, 전달되는 parameter들의 타입을 추론할 수 있는 feature가 추가되었습니다.

```java
list.stream()
    .map(s -> s.toLowerCase())
    .collect(Collectors.toList());
```

물론 기존의 람다 표현식에서는 더욱더 간단하게 타입을 추론할 수 있었습니다. 위처럼 타입을 생략하면, 컴파일러가 컴파일 시에 s의 타입을 String으로 추론합니다. 그렇다면, jdk 8의 추론 방법이 더 간단한데 왜 이런 feature가 추가되었을까요?
> Align the syntax of a formal parameter declaration in an implicitly typed lambda expression with the syntax of a local variable declaration.

[JEP 323](http://openjdk.java.net/jeps/323)의 Goals를 보면, 위와 같이 명시되어있는데요. jdk 10에서 명시적으로 선언되던 구문을 `var`로 선언할 수 있게 되었고, 이런 특징을 람다 표현식에도 적용하여, 암시적으로 선언되던 형태를 `var`로 선언하여 표현식을 통일할 수 있도록 하였습니다.

```java
list.stream()
    .map((@NotNull var s) -> s.toLowerCase())
    .collect(Collectors.toList());
```

또한, 이렇게 명시적으로 선언하면, 람다표현식에서 어노테이션을 사용하는 경우에 조금 더 간단하게 코드를 작성할 수 있게 됩니다.

```java
(var x, y) -> x.process(y)  //not allowed
(var x, int y) -> x.process(y) //not allowed
```

참고로, 람다 표현식에서 var를 사용하는 경우에는 모든 파라미터가 같은 형태로 선언되어야 합니다. 위와 같이 두 개 이상의 파라미터가 람다 표현식으로 제공되는 경우, `var`를 사용하기 위해서는 모든 지역변수를 `var`로 추론하도록 코드를 작성해야 합니다.

## (JEP 321) HTTP Client (Standard)

jdk 9에서 추가되고 jdk 10에서 업데이트 된 `java.incubator.http` 패키지가 인큐베이터에서 나와 `java.net.http` 패키지로 표준화되었습니다. 이 패키지가 개발된 이유는 아래와 같습니다.

* 베이스가 되는 URLConnection API가 현재는 거의 사용되지 않는 프로토콜을 염두에 두고 설계되었음
* HTTP/1.1 보다 너무 추상적임
* 문서화가 잘 되어있지 않아 사용하기 어려움
* Blocking 형태로만 작동
* 유지보수의 어려움

`java.net.http`로 옮겨진 패키지의 기능은 아래와 같습니다.

* Non-Blocking request and response 지원 (with CompletableFuture)
* Backpressure 지원(`java.util.concurrent.Flow` 패키지를 통해 RX Flow를 구현체에 적용)
* HTTP/2 지원
* Factory method 형태로 지원

### Examples

##### *HttpClient*

```java
public void get(String uri) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(uri))
          .build();

    HttpResponse<String> response = client.send(request, BodyHandlers.ofString());

    System.out.println(response.body());
}
```

인스턴스를 생성하기 위해서 Factory method 형태를 제공합니다. 따라서 `HttpClient.newHttpClient();`와 같은 형태로 일반적인 형태의 *HttpClient* 를 제공받을 수도 있고, 아래와 같이 *HttpClientBuilder*를 통해서 HTTP 버전 및 Redirect 여부, Proxy, Authenticator 등을 설정하여 인스턴스를 생성할 수 있습니다.

```java
HttpClient client = HttpClient.newBuilder()
      .version(Version.HTTP_2)
      .followRedirects(Redirect.SAME_PROTOCOL)
      .proxy(ProxySelector.of(new InetSocketAddress("www-proxy.com", 8080)))
      .authenticator(Authenticator.getDefault())
      .build();
```

##### *HttpRequest*

요청을 보내기 위한 *HttpRequest*도 Builder를 통해 제공됩니다. Builder를 통해서는 아래의 내용들을 설정할 수 있습니다.

* URI
* Method (GET, POST, PUT...)
* Body
* timeout
* headers

```java
HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create("http://openjdk.java.net/"))
      .timeout(Duration.ofMinutes(1))
      .header("Content-Type", "application/json")
      .POST(BodyPublishers.ofFile(Paths.get("file.json")))
      .build()
```

이렇게 생성한 *HttpRequest*는 Immutable하고 한 번 생성하여 여러 번 사용할 수 있습니다.

##### Synchronous or Asynchronous

```java
//Synchronous
HttpResponse<String> response = client.send(request, BodyHandlers.ofString());
System.out.println(response.statusCode());
System.out.println(response.body());

//Asynchronous
client.sendAsync(request, BodyHandlers.ofString())
    .thenApply(response -> { 
        System.out.println(response.statusCode());
        return response; 
    })
    .thenApply(HttpResponse::body)
    .thenAccept(System.out::println);
```

send 함수를 통해서 Synchronous하게 요청을 보내고, 응답을 받을 수 있고, sendAsync 함수를 통해 반환되는 CompletableFuture를 합성하거나 조작하여 Asynchronous하게 요청을 보내고, 응답을 받을 수 있습니다.

더 많은 예시를 참고하시려면 아래의 링크를 확인해주세요.

https://openjdk.java.net/groups/net/httpclient/recipes.html

## (JEP 333) ZGC: A Scalable Low-Latency Garbage Collector (Experimental)

jdk 11에서 등장한 가비지 콜렉터입니다. ZGC라고도 불리는 이 가비지 콜렉터는 아래의 몇 가지 목표를 가지고 개발되었습니다.

* GC 일시 중지 시간은 10ms를 초과하지 않는다.
* 작은 크기(수백 메가) \~ 매우 큰 크기(수 테라) 범위의 힙을 처리한다.
* G1에 비해 애플리케이션 처리량이 15%이상 감소하지 않는다.
* 향후 GC 최적화를 위한 기반 마련.
* 처음에는 Linux / x64을 지원 (향후 추가 플랫폼 지원 가능).

아시다시피, JVM으로 구동되는 애플리케이션의 경우, GC가 동작할 때 애플리케이션이 멈추는 현상(Stop-The-World)은 성능에서 큰 영향을 끼쳐왔습니다. 이러한 정지시간을 줄이거나 없앰으로써 애플리케이션의 성능향상에 기여할 수 있습니다.

ZGC의 주요 원리는 Load barrier와 Colored object pointer를 함께 사용하는 것입니다. 이를 통해 Java의 애플리케이션 스레드가 동작하는 중간에, ZGC가 객체 재배치 같은 작업을 수행할 수 있게 해줍니다.

## (JEP 330) Launch Single-File Source-Code Programs

```
java HelloWorld.java
```

단일 실행 파일로 제공되는 프로그램을 실행할 수 있도록, Java Launcher를 개선하는 feature입니다. `shebang` 파일(유닉스 계열 OS에서, 프로그램으로 실행되는 스크립트 파일임을 나타내는 구문)을 인식할 수 있도록 하는 것인데요, 이 파일을 인식하기 위해서 `JLS`(Java Launguage Specification) 또는, `javac`를 변경하거나 Java를 범용 스크립팅 언어로 개발하는 것이 목표는 아닙니다.

단일 파일 프로그램은 일반적으로, 처음 Java를 학습하는 과정이나 소규모 유틸리티가 필요한 경우에 사용될 수 있지만, 단일 소스파일이 여러 클래스 파일로 컴파일될 수 있으므로, "run this program." 이라는 단순한 목표에 패키징이라는 오버헤드가 추가될 수 있습니다.

Java Launcher는 class file, main class of jar file 그리고 main class of module을 실행하는 세 가지 모드를 가지고 있는데요. 여기에 아래 두 항목에 의해 결정되는 네 번째 모드가 추가됩니다.

* 명령줄의 첫 번째 항목이 클래스 이름인 경우
* `--source version` 옵션이 있는 경우 (version은 java의 버전을 의미)

만약, 파일에 `.java` 확장자가 없는 경우에는 `--source` 옵션을 사용하여 소스 파일 모드를 강제로 적용해야 하는데요. 이는, 대상 소스파일이 "스크립트"이고 파일 이름이 일반적인 Naming convention을 따르지 않는 경우에 해당합니다(*소스파일 모드를 적용해야하는 파일이 "스크립트"라는 말은, 확장자가 .sh라는 말은 아닙니다.* 확장자가 없는 파일도 소스파일모드 적용 시, 실행가능합니다.)

### 실행

```
java HelloWorld.java 3 4 5
```

소스파일 모드로 실행시키는 경우에 첫 번째 파라미터는 파일이름을, 두 번째부터는 클래스에 전달할 파라미터를 의미합니다. 위 명령줄은 아래의 명령줄과 같은 동작을 합니다.

```
javac -d <memory> HelloWorld.java
java -cp <memory> HelloWorld 3 4 5
```

실행 시에는 아래와 같은, 추가적인 옵션들이 존재합니다.

* 실행하는 파일 이름 이전에 --class-path, --module-path, --add-exports, --limit-module, --upgrade-module-path, --enable-preview 등과 같은 실행옵션을 줄 수 있습니다.
* 전달하는 Argument들이 너무 많은 경우, `@filename`으로 Argument 목록을 전달할 수 있습니다.

두 번째 옵션의 경우, arguments를 전달할 파일을 생성하고, `java @{filename}`과 같은 형식으로 파일의 이름을 전달하면 하나의 CommandLine에 모든 Arugments를 적지 않고도 동일하게 실행할 수 있습니다. 굉장히 단순한 아래의 예시를 참고해주세요.

```
$ cat HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        for (int i=0; i<args.length; i++) {
                System.out.print(args[i] + " ");
        }
    }
}
$ cat args
HelloWorld.java 3 4 5
$ java @args
Hello, World!
3 4 5 
```

보다 자세한 내용은 [문서](http://openjdk.java.net/jeps/330#Description)를 참고해주세요.

### "Shebang" files

```sh
#!/path/to/java --source 11

public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
```

shebang 파일을 작성하는 방법은, 다른 스크립트 파일에 작성하는 방법과 유사합니다. 이렇게 첫 줄을 작성한 후에 밑에 실행할 내용을 Java로 작성해주면 됩니다. 그리고 이렇게 작성한 file은 아래와 같은 방법으로 실행할 수 있습니다.

```
$ ./helloWorld
Hello World
```

## References

* https://openjdk.java.net/projects/jdk/11/
* https://openjdk.java.net/groups/net/httpclient/intro.html
* https://www.azul.com/90-new-features-and-apis-in-jdk-11/