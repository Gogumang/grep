![firefox-logo.jpg](https://images.gogumang.com/53e1dbabc5/01.jpg)

### 파이어폭스에서는 input박스에서 한글 조합 중일 때에는 'keydown' 이벤트가 발생하지 않습니다. ([참고링크](https://bugzilla.mozilla.org/show_bug.cgi?id=354358))

* 참고로 W3C표준에는 다음과 같이 명시되어 있습니다.
* **During the composition session, all keydown and keyup events may be suppressed.**
* 하지만 컴포지션시에 파이어폭스만 'keydown'과 'keyup'을 막고 있고, 다른 브라우저들은 막지 않고 있습니다.

그래서 다른 방법을 이용해야 자동완성기능을 만들 수 있습니다.

그 방법이 'keypress'이벤트를 이용하는 것입니다.

```
element.bind("keypress", function (event) {
	var keyCode = event.which || event.keyCode;
		if(keyCode === 13 || keyCode === 9) { // 13: enter, 9: tab
	// code
	}
}
```

제 경우에는 angular-js의 ui-bootstrap의 라이브러리를 사용했고, 이 라이브러리는 keydown이벤트만 바인딩이 되어있어서 문제가 있었습니다.

그래서 keypress 이벤트가 호출될 때에 해당 라이브러리의 이벤트를 발생시켜서 해결했습니다.

*** ** * ** ***

### 또한 이 코드는 Firefox에서만 실행되어야 합니다.(다른 브라우저에서 이상작동할 수 있습니다.)

그래서 아래와 같이 firefox에서만 실행되게 하였습니다.

```
if(isFireFox()) {
	element.bind("keypress", function (event) {
		var keyCode = event.which || event.keyCode;
		if(keyCode === 13 || keyCode === 9) { // 13: enter, 9: tab
		// code
		}
	}
}
```