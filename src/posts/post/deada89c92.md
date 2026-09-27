## 소개 및 주제

안녕하세요. PAYCO 앱기술개발팀 유상현입니다.

지난 편에 이어 안드로이드 런처와 위젯에 관한 주제로 공유를 하고 있습니다. 생각보다 많은 분들이 1편을 재밌게 봐주셔서 이번 편은 재미가 없으면 어쩌나 시작부터 걱정이 되기 시작했는데요.

\~\~(1편부터 짤주머니를 너무 많이 소진해버렸습니다.)\~\~

![1.png](https://images.gogumang.com/deada89c92/01.png)

그래도 초심을 잃지않고 도움이 된 분이 생기면 좋겠다는 마음가짐으로 열심히 작성해보겠습니다!

또한 본문의 내용은 1편을 읽지 않으셔도 큰 지장이 없지만, 이전 내용을 궁금해하실 분이 계시길 바라면서 1편의 링크를 투척하겠습니다.

[안드로이드 런처와 위젯 톺아보기 (1) - 홈 화면도 앱이었다?](https://meetup.toast.com/posts/304)

위 1편에서는 모든 안드로이드 사용자가 핸드폰을 켜면 마주하는 홈 화면, 즉 런처(Launcher)의 실행 과정에 대해 안드로이드 시스템 부팅 과정과 함께 간단히(?) 작성하였습니다.

지난 편을 마치면서 페이코의 가상인물 인기스타 1위 배익호 씨는 드디어 핸드폰을 켜게 되었는데요. 이번 편에서는 런처의 수많은 기능 중 홈 화면에 어떻게 설치된 앱이 노출될 수 있는지에 대해 TMI 를 발휘해보려 합니다.

## 런처의 앱 노출

![2.png](https://images.gogumang.com/deada89c92/02.png)

안드로이드 폰은 수많은 종류가 있지만, 가장 대중적인 갤럭시 시리즈를 기준으로 위와 같이 설치된 앱들이 좌라락 노출됩니다. 더불어 각 아이콘을 클릭하면 해당 앱이 실행되는데, 어떻게 이것이 가능한 것인지 궁금하지 않으신가요?

![3.png](https://images.gogumang.com/deada89c92/03.png)

(ㅠㅠ)

... 앞서 1편에서 런처 역시 하나의 앱이라고 말씀드렸는데요, 이러한 서드파티 앱 입장에서 기기에 설치된 앱 정보들을 얻으려면 자력으로는 너무 힘들 것입니다. (설치된 앱이 어디 경로에 있으며.. 어떤 정보를 어떻게 파싱 해야 하는지... 등등)

자력으로는 얻기 힘들기 때문에 시스템 단에서 지원해주면 좋을 듯한데, 역시 다 계획이 있는 구글은 이를 안드로이드 프레임워크 단에서 지원해줍니다.

간단히 프레임워크에서 설치된 앱 정보들을 획득하는 방식을 도식화해보면 아래와 같습니다.

![4.png](https://images.gogumang.com/deada89c92/04.png)

엄청 복잡해 보이지만, 간단히 말해 안드로이드 시스템은 여러 개의 파티션으로 이루어져 있습니다. PackageManagerService 가 실행되면, **시스템 단에서 설치된 앱 정보를 제공하기 위해** 곧바로 이 파티션 별로 디렉터리를 순회하며 각 디렉터리 하위에 설치된 앱/시스템 파일을 파싱 하는 과정을 거칩니다.

파싱 순서는 아래와 같습니다.

1. 파티션별 필수 오버레이 /vendor/overlay /product/overlay /system_ext/overlay /odm/overlay /oem/overlay

2. 안드로이드 프레임워크 /system/framework

3. system 파티션 (privileged system -\> ordinary system) /system/priv-app /system/app

4. vendor 파티션 (privileged vendor -\> ordinary vendor) /vendor/priv-app /vendor/app

5. ODM 파티션 (privileged odm -\> ordinary odm) /odm/priv-app /odm/app

6. OEM 파티션 /oem/app

7. product 파티션 (privileged product -\> ordinary product) /product/priv-app /product/app

8. system_ext (privileged system_ext -\> ordinary system_ext) /system_ext/priv-app /system_ext/app

**9. 설치된 앱 (install directory)** **/data/app**

위 순서는 AOSP(Android Open Source Project) PackageManagerService.java 파일 생성자 부분에 공개되어있습니다. <https://android.googlesource.com/platform/frameworks/base/+/master/services/core/java/com/android/server/pm/PackageManagerService.java>

(소스코드가 약 25,000줄인 것은 함정)

이번 공유에서는 각 파티션이 어떤 역할을 수행하는지는 작성하지 않으려 합니다. (대신 주요 파티션 별 역할이 정리되어있는 링크를 첨부합니다.) <https://www.cnblogs.com/shangdawei/p/4513604.html>

이렇듯 매우 매우 복잡한 과정을 거쳐, 시스템은 **설치된 서드파티 앱**들을 파싱 해냅니다. 위에도 볼드체로 작성하였지만, 이 앱들은 일반적으로 /data/app 폴더에 자동으로 저장이 되는데요. 좀 더 쉽게 얘기하면 구글 가라사대.. 플레이스토어에서 앱을 다운로드하면 일반적으로 /data/app 폴더 하위에 apk 가 저장된다고 합니다.

정말 그런지 adb의 힘을 빌려 페이코 앱의 설치 경로를 알아보았습니다.

![5.png](https://images.gogumang.com/deada89c92/05.png) ![6.png](https://images.gogumang.com/deada89c92/06.png)

터미널에서 페이코 앱의 패키지명을 이용하여 확인 결과 /data/app 폴더 하위에 apk 가 저장되어있는 것이 보입니다. PackageManagerService는 **이 /data/app 폴더 하위의 apk 들을 전부 파싱 하여, 유의미한 정보들을 추출해냅니다.**

## apk 에서 런처에 활용할 정보를 추출하기까지

이쯤에서 런처에 노출되는 앱의 형태를 다시 한번 보겠습니다.

![7.png](https://images.gogumang.com/deada89c92/07.png)

런처 입장에서 위 형태로 노출하기 위해서는,

**1. 앱 이름** **2. 앱 아이콘** **3. 클릭 시 실행할 앱 정보**

위 3가지 정보를 시스템으로부터 얻을 수 있어야 합니다. 이 정보는 apk의 어디에 저장되어 있을까요?

![8.png](https://images.gogumang.com/deada89c92/08.png)

(아직 그만할 수 없습니다)

안드로이드 개발을 한 번이라도 해보셨다면, **AndroidManifest.xml** 의 존재를 알고 계실 것이라 생각합니다. 이 파일이야 말로 앱의 모든 기본 정보가 담긴 앱의 청사진이라고 할 수 있고, PackageManagerService는 apk에서 이 AndroidManifest.xml을 파싱 하여 정보를 획득합니다.

파싱 하는 부분 역시 AOSP에 코드가 공개되어있으니 (PackageParser.java) 이번엔 먼저 첨부합니다. <https://android.googlesource.com/platform/frameworks/base/+/0e2d281/core/java/android/content/pm/PackageParser.java>

(이번엔 단 4,000라인!)

약속된 규격에 의해, 런처에서 노출되는 앱 이름(label), 앱 아이콘(icon)은 **AndroidManifest.xml의 application 태그를 통해 획득합니다.**

![9.png](https://images.gogumang.com/deada89c92/09.png)

클릭 시 실행할 앱 정보는 역시 약속된 규격에 의해 intent-filter에 아래의 action, category 가 둘 다 지정되어있는 activity를 통해 획득합니다.

![10.png](https://images.gogumang.com/deada89c92/10.png)

## 드디어!

PackageManagerService는 위 과정을 통해 /data/app 하위에 설치된 모든 앱의 AndroidManifest.xml을 파싱 하여 이름(label), 아이콘(icon), 클릭 시 실행할 activity 정보(intent filter action MAIN, category LAUNCHER)를 획득하게 되었습니다.

이제부터는 서드파티 앱인 런처의 역할로 넘어가게 됩니다. 샘플로 간단히 서드파티 런처를 구현해본다면, 아래와 같이 PackageManager를 이용하여 시스템 PackageManagerService 가 미리 파싱 해둔 정보를 바로 획득할 수 있습니다.

![11.png](https://images.gogumang.com/deada89c92/11.png)

획득한 앱 리스트들은 아래와 같이 순회하면서, 각 앱의 아이콘, 이름, 클릭 시 실행할 앱 정보 등을 획득할 수 있습니다.

![12.png](https://images.gogumang.com/deada89c92/12.png)

위의 변수명과 런처에서 보이는 앱의 형태를 연계해보면 아래와 같이 표현할 수 있습니다.

![13.png](https://images.gogumang.com/deada89c92/13.png)

마지막으로 클릭 이벤트는 패키지명 + Activity 명을 바탕으로 설정 가능합니다.

![14.png](https://images.gogumang.com/deada89c92/14.png)

## 마무리

지난 편과 이번 편에 걸쳐 런처에서 설치된 앱을 노출할 수 있기까지의 과정을 도식화하면 아래와 같습니다.

![15.png](https://images.gogumang.com/deada89c92/15.png)

길고 긴 과정이었지만, 도식화하니 \~\~그래도 기네요.\~\~ 런처로 지친 심신을 달래기 위해, 다음 편에서는 런처의 또 다른 기능 중 하나인 위젯(feat. 숏컷)을 중심으로 이번 편과의 상관관계, 관련하여 공간이 남는다면 페이코에서 겪었던 흥미로운(?) 이슈에 관해서도 작성할 예정입니다.

![16.png](https://images.gogumang.com/deada89c92/16.png)

긴 글 읽어주셔서 감사드리며 다음 편에서 뵙겠습니다. 감사합니다. (_ _)

(이미지 출처)

* https://www.pinterest.co.kr/pin/633037291361634357/
* https://analogcity.tistory.com/9
* http://www.etoland.co.kr/plugin/mobile/board.php?bo_table=zzal\&wr_id=617
* https://jjalbot.com/jjals/vqKgZs80P - https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true\&blogId=j23486\&logNo=220668485414