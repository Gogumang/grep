## 들어가며

LINE과 Yahoo Japan의 합병 이후, 구 Yahoo! 프리미엄에서 제공하던 혜택에 더해 새롭게 LINE 혜택까지 이용할 수 있는 구독형 멤버십 [LYP 프리미엄](https://info-premium.yahoo.co.jp/promo/lyp/teaser/202309/)이 출시됐습니다. 이 LYP 프리미엄의 한 기능으로 LINE 앱에 표시되는 글자의 폰트를 사용자가 원하는 폰트로 변경할 수 있는 '회원 한정 폰트' 기능이 추가됐는데요. 이 기능을 구현할 때 크게 아래와 같은 세 가지 요구 사항이 있었습니다.

1. 폰트 목록을 사용자에게 보여준다.
2. 사용자가 선택한 폰트를 동적으로 다운로드한다.
3. 다운로드한 폰트를 앱 전체에 적용한다.

이 글에서는 이 중 2번과 3번을 구현하는 과정에서 겪은 경험을 공유하려고 합니다.

## Android에서 폰트를 적용하는 방법

Android에서 폰트를 적용하는 방법을 파악하려면 먼저 아래 세 가지 용어의 정의와 차이를 알아야 합니다.

* 폰트 파일: 글자를 디스플레이에 표현할 때 사용하는 정보(`style`, `weight`, `size`)를 모아 놓은 파일입니다.
* [FontFamily](https://developer.android.com/reference/kotlin/androidx/glance/text/FontFamily): `style`과 `weight`에 따라 어떤 폰트로 보이는지 정의한 폰트 집합입니다.
* [Typeface](https://developer.android.com/reference/android/graphics/Typeface): 폰트를 메모리에 로드해 시스템 리소스로써 적용할 수 있는 클래스입니다.

위 용어를 사용해 앞서 말씀드린 요구 사항을 다시 정의하면, '서버에서 폰트 파일을 동적으로 다운로드해서' 이를 'Typeface 클래스로 로드해 뷰에 적용'하는 것이라고 할 수 있습니다.

그럼 이제 Android에서 폰트를 적용하는 정적 방법과 동적 방법을 알아보겠습니다.

### 정적 폰트 적용 방법

Android에서 폰트를 적용하는 가장 기본적인 방법은 폰트 파일을 [앱 리소스](https://developer.android.com/guide/topics/resources/providing-resources?hl=ko)에 추가하고, 이를 [스타일 리소스](https://developer.android.com/guide/topics/resources/style-resource?hl=ko)로 정의해 필요한 곳에서 활용하는 것입니다. 스타일로 정의한 폰트는 테마로 지정해서 앱 전체에 일괄적으로 적용할 수 있는데요. 이 방식은 아래와 같은 두 가지 단점이 있습니다.

* 모든 폰트 목록이 앱 번들에 포함돼 불필요하게 앱 크기가 커집니다.
* 앱 업데이트 전까지 폰트 업데이트가 불가능합니다.

### 동적 폰트 적용 방법 - 다운로드 가능한 글꼴

Android에서는 이런 정적 폰트 방식의 단점을 해결하기 위해 동적 폰트 시스템인 [다운로드 가능한 글꼴(Downloadable Fonts)](https://developer.android.com/guide/topics/ui/look-and-feel/downloadable-fonts?hl=ko) 기능을 제공합니다. 이를 이용하면 정적 방법과는 다르게 폰트 파일을 앱 리소스에 추가하지 않아도 되는데요. 이 기능의 작동 방식과 사용 방법을 살펴보겠습니다.

## 다운로드 가능한 글꼴 기능으로 사용자가 선택한 폰트를 동적으로 가져오기

Android의 동적 폰트 시스템인 다운로드 가능한 글꼴 기능이 어떻게 작동하는지 파악하기 위해 이 기능으로 [Google Fonts](https://fonts.google.com/)에서 폰트를 가져오는 방법을 살펴보겠습니다.

### 다운로드 가능한 글꼴 기능으로 Google Fonts에서 폰트 가져오기

아래 그림은 다운로드 가능한 글꼴 기능이 작동하는 모습을 나타낸 것입니다.

![image](https://images.gogumang.com/dca56dbc01/01.png)

*출처: [Android Developer Guide - Downloadable Fonts](https://developer.android.com/guide/topics/ui/look-and-feel/downloadable-fonts?hl=ko)*

App1에서 특정 폰트 파일을 사용하길 원한다고 가정해 보겠습니다. App1이 원하는 폰트 정보를 `FontsContract`을 통해 요청하면, `FontProvider`가 네트워크에서 폰트 파일을 다운로드하거나 캐시해 놓았던 파일을 반환해 줍니다. 한 번 다운로드한 글꼴은 OS 레벨에서 관리하며, 다른 앱에서 같은 폰트를 요청하면 앞서 다운로드했던 폰트 파일을 재사용합니다. 이를 통해 네트워크 사용량과 디스크 공간을 절약할 수 있습니다.

여기서는 `FontProvider`가 Goolge Fonts라는 글꼴 제공 업체에서 폰트 파일을 다운로드합니다. Google Fonts는 오픈소스 라이브러리로, API를 통해 폰트를 제공받을 수 있습니다. Android에서는 Google Fonts를 이용해 다양한 폰트를 한 기기의 다양한 앱에서 공유하며 사용할 수 있도록 제공합니다.

다운로드 가능한 글꼴 기능의 작동 방식을 조금 더 자세히 살펴보겠습니다.

![image](https://images.gogumang.com/dca56dbc01/02.png)

1. 새로운 폰트를 사용하길 원하는 클라이언트에서 `FontRequest` 클래스에 `ContentProvider`의 명세(`authority`, `pacakage`, `cert`)와 어떤 폰트를 원하는지(`query`)를 담아서 `FontsContractCompat`로 요청합니다.
2. `FontsContractCompat`는 클라이언트가 보낸 `FontRequest`를 `FontProvider`에게 전달합니다.
3. `FontProvider`는 명세와 일치하는 `ContentProvider`를 `PackageManager`를 통해 찾습니다(이 예시에서는 Google Fonts의 `ContentProvider`가 반환됩니다).
4. `FontProvider`가 `ContentProvider`에게 `FontRequest#Query`를 이용해 폰트를 요청합니다.
5. `ContentProvider`는 해당하는 폰트를 먼저 캐시에서 찾고, 없으면 서버에서 다운로드합니다.
6. `ContentProvider`에서 받은 폰트를 `FontInfo`에 넣어 반환합니다.
7. 최종적으로 `FontsContractCompat`에서 `FontInfo`를 `Typeface`로 로드해 반환합니다.

아래는 예시 코드입니다. 아래와 같이 `FontRequest`에 정보를 담아서 `FontsContractCompat`을 통해 프로그래매틱 방식으로 폰트를 요청해 `Typeface`를 반환받아 사용할 수 있습니다.

```kotlin
class FontRepository {
	fun getTypeFace(): TypeFace {
		val request = FontRequest(
			"com.google.android.gms.fonts",
			"com.google.android.gms",
			"ABeeZee",
			R.array.com_google_android_gms_fonts_certs"
		)
		return suspendCancellableCoroutine { continuation ->
			val callback = object : FontsContractCompat.FontRequestCallback() {
	            override fun onTypefaceRetrieved(typeface: Typeface?) {
    	            continuation.resume(typeface)
        	    }

            	override fun onTypefaceRequestFailed(reason: Int) {
                	continuation.resume(null)
	            }
    	    }
			FontsContractCompat.requestFont(context, request, callback, handler)
		}
	}
}
```

또한, XML로 폰트 리소스에 접근해 `TextView`의 `fontFamily`로 사용할 수도 있습니다.

```markup
[res/font/abeeZee.xml]
<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:app="http://schemas.android.com/apk/res-auto"
    app:fontProviderAuthority="com.google.android.gms.fonts"
    app:fontProviderPackage="com.google.android.gms"
    app:fontProviderQuery="ABeeZee" 
    app:fontProviderCerts="@array/com_google_android_gms_fonts_certs" />
---
[main_activity.xml]
<LinearLayout...>
	<TextView
		android:id="@+id/text_view"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:fontFamily="@font/abeezee" />
<LinearLayout/>
```

작동 방식 설명은 복잡했지만, 위 코드와 같이 실제로 사용할 때에는 `FontRequest`에 정보를 담아 제대로 요청하기만 하면 Google Fonts에서 원하는 폰트를 쉽게 받아올 수 있습니다.

그런데 LINE 앱에서 사용해야 하는 폰트는 LINE에서 계약해 별도로 라이선스를 획득한 폰트입니다. Google Fonts를 통해 얻어올 수 없고, 다른 앱과 공유해서도 안됩니다. 그렇다면 Google Fonts 대신 LINE 서버에서 폰트를 받아오려면 어떻게 해야 할까요?

### 다운로드 가능한 글꼴 기능으로 LINE 서버의 폰트 가져오기

앞서 살펴보았듯 `FontRequest`로 요청하면, 이 `FontRequest`가 `FontProvider`로 전달되고, `FontProvider`에서 `FontRequest`의 명세와 일치하는 `ContentProvider`를 찾습니다. 따라서 `ContentProvider`를 커스텀하고 이에 맞는 명세로 요청하면, LINE 앱에서 사용할 수 있는 폰트를 가져올 수 있겠다고 판단했습니다.

저희는 아래 그림처럼 LINE 서버에서 폰트를 가져오는 `ContentProvider`를 구성하고, 해당 `ContentProvider`의 명세에 맞춘 `FontRequest`를 전달하는 방식으로 구현했습니다.

![image](https://images.gogumang.com/dca56dbc01/03.png)

실제 코드로는 아래와 같은 형태가 됩니다.

* LineFontProvider

```kotlin
pakcage com.example.line.font

class LineFontProvider: ContentProvider() {
	override fun query(...): Cursor? {
		// 이 ContentProvider가 대응할 수 있는 URI인지 체크한다.
		if (uri is LineContentUri) return MatrixCursor(...)
		else return null
	}

	override fun openFile(uri: Uri, mode: Mode): ParcelFileDescriptor {
		// 폰트 파일을 LINE 서버 혹은 로컬 캐시에서 가져온다.
		val file = LineFontRepository.getFontFile(uri)
		return ParcelFileDescriptor.open(fontFile, MODE_READ_ONLY)
	}
}
```

* custom_font.xml

```markup
<font-family xmlns:app="http://schemas.android.com/apk/res-auto"
        app:fontProviderAuthority="com.example.line.font"
        app:fontProviderPackage="com.example.line"
        app:fontProviderQuery="LineFont"
        app:fontProviderCerts="@array/line_fonts_certs">
</font-family>
```

이렇게 구성해 `FontsContractCompat`에 요청하면, `FontProvider`는 LINE에서 구현한 `LineFontProvider`에 폰트를 요청한 뒤 `Typeface`로 반환합니다.

## 다운로드한 폰트를 동적으로 LINE 앱에 적용하기

앞서 다운로드 가능한 글꼴 기능을 이용해 LINE에서 원하는 폰트를 `TypeFace`로 가져오는 방법까지 확인했습니다. 이렇게 가져온 `TypeFace`를 LINE 앱 전체에 적용하는 방법에는 여러 가지가 있는데요. 어떤 방법이 효율적인지 알아보겠습니다.

### 각 뷰에 일일이 적용하는 방법

각 뷰에 적용하는 방법으로는 정적 방식과 프로그래매틱 방식, 폰트를 미리 적용한 커스텀 뷰 방식이 있습니다. 각 방식의 사용 방법과 장/단점을 살펴보겠습니다.

|        정적 방식        |                                                             ```markup <TextView android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginHorizontal="30dp" android:fontFamily="@font/custom_font" android:text="Apply line font in xml" /> ``` * 사용 방법: 위에서 정의한 `@font/custom_font` 리소스를 XML 레이아웃에서 `TextView`의 `fontFamily`로 할당합니다. * 단점 * XML 레이아웃에서는 사용자가 커스텀 폰트를 사용하는지 동적으로 판단해서 적용할 수 없습니다. * 각 서비스 담당자가 텍스트가 표시되는 뷰에 일일이 적용해야 하기 때문에 공수가 많이 필요합니다.                                                             |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 프로그래매틱 방식           | ```kotlin class MainActivity { override fun onCreate() { ... if (needToApplyCustomFont) { binding.textView.typeface = LineFontRepository.getTypeface() } } } ``` * 사용 방법: 폰트 사용 여부에 따라 적절한 폰트가 적용되도록 `onCreate()`에서 설정한다. * 장점: 이 방식은 동적으로 `Typeface`를 설정할 수 있기 때문에 커스텀 폰트 사용 여부에 따라 적용할 수 있습니다. * 단점: 각 서비스 담당자가 텍스트가 표시되는 뷰에 일일이 적용해야 하기 때문에 공수가 많이 필요합니다.                                                                                                                                                                                              |
| 폰트를 미리 적용한 커스텀 뷰 방식 | ```kotlin class FontedTextView( context: Context, attributeSet: AttributeSet ) : androidx.appcompat.widget.AppCompatTextView(context, attributeSet) { init { if (needToApplyCustomFont) { typeface = LineFontRepository.getTypeface() } } } ``` * 사용 방법: 폰트 사용 여부에 따라 적절한 폰트가 적용되는 커스텀 뷰를 만듭니다. * 장점: 각 서비스에서는 폰트 사용 여부를 고려할 필요가 없고 불필요한 코드를 줄일 수 있습니다. * 단점 * `TextView`뿐 아니라, 텍스트가 표시되는 `Button`, `Toast`, `Header` 등 다양한 뷰를 커스텀해야 합니다. * 모든 뷰를 `FontedCustomView`로 대체하려면 엄청난 공수가 필요합니다. * 새로운 레이아웃을 구현할 때 해당 커스텀 뷰를 이용하지 않으면 폰트가 적용되지 않는데 이를 놓치기 쉽습니다. |

LINE 앱은 너무나도 방대하기 때문에 위와 같은 뷰 단위 대응 방식을 사용하려면 공수가 너무나도 많이 필요했습니다. 이에 보다 효율적으로 문제를 해결할 수 있는 방법을 찾기 위해 더 조사했고, 글 처음에 말씀드린 폰트 스타일을 테마로 설정해서 적용하는 방식이 떠올랐습니다.

### 다운로드 가능한 글꼴 기능을 테마로 설정하는 방법

폰트 스타일을 테마로 설정하는 방식은 폰트 리소스를 XML로 사전에 정의할 수 있어야 스타일로 참조할 수 있기 때문에 배제했던 방법인데요. 다운로드 가능한 글꼴 기능을 사용하면서 폰트를 LINE 서버에서 동적으로 가져올 수 있다는 것을 알게 됐고, 또한 XML 레이아웃에서도 참조해 적용할 수 있다는 것도 확인했습니다. 따라서 충분히 사용할 수 있는 방법이라고 판단했습니다. 적용 방법은 다음과 같습니다.

1. `@font/custom_font` 리소스를 스타일 리소스로 지정합니다.

   ```markup
   <?xml version="1.0" encoding="utf-8"?>
   <resources>
       <style name="default_font">
           <item name="fontFamily" />
       </style>
       <style name="custom_font">
           <item name="fontFamily">@font/custom_font</item>
       </style>
   </resources>
   ```

2. 스타일 리소스를 `Application#ActivityLifecycleCallbacks`을 이용해 각 액티비티가 생성(`onCreate`)될 때 테마로 설정합니다.

   ```kotlin
   class CustomFontThemeApplier : Application.ActivityLifecycleCallbacks {

       override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
           if (needToApplyCustomFont) {
               activity.setTheme(customFontStyle)
           }
       }
   	...
   }
   ```

다운로드 가능한 글꼴 기능을 테마로 지정하는 방식을 이용함으로써 LINE 앱 내에서 텍스트가 표시되는 모든 곳에 원하는 폰트를 적용할 수 있게 됐습니다. 각 서비스는 폰트를 적용하기 위해 별도로 대응할 필요가 없고 의도에 따라 제외해야 하는 경우만 처리하면 되기 때문에 기능을 적용에 필요한 공수를 대폭 줄일 수 있었습니다.

## 마치며

회원 한정 폰트 기능을 구현하면서 동적으로 폰트를 가져와 테마로 적용하는 방식을 사용했고, 많은 이점을 얻을 수 있었습니다. 하지만 아직 더 개선하고 싶은 부분이 남아있습니다.

* 재시작 이슈: 적용해야 하는 폰트가 바뀌면 스타일 리소스를 다시 로드해야 하기 때문에 앱을 재시작해야 합니다.
* 로딩 지연 이슈: 일부 기기에서 동적으로 폰트를 로드하는 데 오래 걸리면서 잠시 기본 폰트가 노출되는 현상이 발생합니다.

위 이슈를 해결하기 위해 FontRequest의 query 방식을 바꿔보거나, 스플래시 화면(splash screen)에서 프리로드(preload)를 이용하는 등 다양한 방안을 시도하며 연구하고 있습니다.

### 참고 자료

* [Android Developers - Font Resource](https://developer.android.com/guide/topics/resources/font-resource?hl=ko)
* [Android Developers - Fonts in XML](https://developer.android.com/guide/topics/ui/look-and-feel/fonts-in-xml?hl=ko)
* [Android Developers - Downloadable Font](https://developer.android.com/guide/topics/ui/look-and-feel/downloadable-fonts?hl=ko)

> Portions of this page are reproduced from work created and [shared by the Android Open Source Project](https://source.android.com/) and used according to terms described in the [Creative Commons 2.5 Attribution License](http://creativecommons.org/licenses/by/2.5/).