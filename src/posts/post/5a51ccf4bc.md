안녕하세요. 저는 데브시스터즈 플랫폼셀에서 백엔드 엔지니어로 일하고 있는 이창희입니다. 저는 그동안 쌓은 대부분의 경력이 백엔드와 프론트엔드 개발을 같이하는, 흔히 말하는 풀 스택 엔지니어였는데요 오늘은 그 중 프론트엔드 개발 경험을 살려 흥미로운 이야기를 해볼까 합니다.

프론트엔드 개발을 하다 보면 폼을 통해 사용자에게 값을 입력받고, 검증하고 서버로 전송해야 하는 경우가 있습니다. 얼마 전에 새로 단장한 [데브시스터즈 채용 홈페이지](https://careers.devsisters.com/)의 채용 지원 폼도 그러한데요. 이 글에서는 채용 홈페이지를 새로 만들며 입력이 많고 복잡한 폼을 함수형 라이브러리인 [fp-ts](https://gcanti.github.io/fp-ts/)를 사용하여 폼 데이터 상태 관리를 우아하게 처리한 경험에 대해 소개합니다.

## 기본적인 폼 상태 관리

데브시스터즈 채용 홈페이지는 React를 사용하여 개발했습니다. React에서 기본적인 상태 관리는 `React.useState` 를 사용하는데요. 예를 들어 `React.useState` 를 사용해 채용 지원 폼에 있는 휴대폰 번호가 올바른 휴대폰 번호인지(적어도 아주 이상한 번호는 아닌지) 검증을 한다면 아래와 같이 명령형 코드로 작성할 수 있을 것입니다.

    const [mobileNumber, setMobileNumber] = React.useState<string>('');
    const [mobileNumberError, setMobileNumberError] = React.useState<string>('');

    const validateMobileNumber = (value: string): boolean => {
      if (value == '') {
        setMobileNumberError('휴대폰 번호를 입력해주세요.');
    	  return false;
      }

    	if (!mobileNumberRegex.test(value)
          || !value.startsWith('01')
          || value.length < 10
          || value.length > 11
      ) {
    	  setMobileNumberError('휴대폰 번호가 올바르지 않습니다.');
    	  return false;
    	}

    	return true;
    }

    const handleMobileNumberChange = (e) => {
    	const { value } = e.target;
    	validateMobileNumber(value);
    	setMobileNumber(value);
    }

    const onSubmit = () => {
    	const validations = [validateMobileNumber(mobileNumber), ...];
    	if (validations.some((valid) => !valid)) {
    		return;
    	}

    }

    return (
    	...
    	<input onChange={handleMobileNumberChange} value={mobileNumber} />
    	<span className="error">{mobileNumberError}</span>
    	...
    )

위의 코드만 보면 딱히 문제는 없습니다. 하지만, 검증해야 할 값들이 더 늘어난다면 어떻게 될까요? 원래는 한 입력에 대해 값과 오류 상태를 관리하기 위해 2개의 `React.useState`가 필요했으니 만약 3개의 입력을 관리해야 한다면 아래와 같이 관리해야 할 상태와 작성해야 할 함수들이 비례해서 늘어나게 됩니다.

하지만 3개가 아닌 4개, 5개 혹은 그보다 더 늘어난다면 어떨까요? 하나의 폼을 검증하기 위해 작성해야 하는 코드가 너무 많아질 것 같습니다. 게다가 '값이 필수적으로 입력되어 있어야 한다' 같은 규칙들은 여러 필드가 공통으로 사용할 텐데, 이를 각 필드에서 매번 확인한다면 코드 중복도 높아질 것입니다. 그렇다면 이 문제는 어떻게 해결해야 할까요?

    const [mobileNumber, setMobileNumber] = React.useState<string>('');
    const [mobileNumberError, setMobileNumberError] = React.useState<string>('');
    const [name, setName] = React.useState<string>('');
    const [nameError, setNameError] = React.useState<string>('');
    const [email, setEmail] = React.useState<string>('');
    const [emailError, setEmailError] = React.useState<string>('');

    const validateMobileNumber = (value: string): boolean => {  }
    const validateName = (value: string): boolean => {  }
    const validateEmail = (value: string): boolean => {  }

    const handleMobileNumberChange = (e) => {  }
    const handleNameChange = (e) => {  }
    const handleEmailChange = (e) => {  }

    const onSubmit = () => {
    	const validations = [
    		validateMobileNumber(mobileNumber),
    		validateName(name),
    		validateEmail(email),
    	];
    	if (validations.some((valid) => !valid)) {
    		return;
    	}

    }

    return (
    	...
    	<input onChange={handleMobileNumberChange} value={mobileNumber} />
    	<span className="error">{mobileNumberError}</span>

    	<input onChange={handleNameChange} value={name} />
    	<span className="error">{nameError}</span>

    	<input onChange={handleEmailChange} value={email} />
    	<span className="error">{emailError}</span>
    	...
    )

## 조금 더 간결하게

이런 문제를 만난다면 보통은 [react-hook-form](https://react-hook-form.com/) 같은 라이브러리를 사용하여 해결합니다. 하지만 저희는 조금 다르게 이 문제를 해결해보고 싶었고, 프로젝트에서 이미 사용 중이던 fp-ts를 사용하여 함수형 프로그래밍으로 이 문제를 해결해보기로 하였습니다.

문제를 간결하게 정의하기 위해서는 공통 부분 문제와 그렇지 않은 문제를 파악해야합니다. 앞에서 예로 들었던 이름, 휴대폰 번호, 이메일에 대해 입력 상태 흐름을 일반화하면 아래와 같이 표현할 수 있습니다.

* 입력값과 오류 메시지를 관리하는 두 개의 상태가 있습니다.
* 사용자가 값을 입력하면 상태를 갱신합니다.
* 검증 함수를 통해 사용자가 입력한 값이 올바른지 검증합니다.
* 검증에 오류가 있다면 오류 메시지 상태를 갱신합니다.

여기서 **입력값** 과 **검증 함수**가 공통적이지 않고 나머지는 공통적입니다. 즉, 입력값과 검증 함수만 외부에서 주입받으면, 나머지 부분은 공통 함수에서 처리할 수 있습니다.

### 함수형 검증 함수

검증 함수를 작성하기에 앞서 공통 함수를 구현합니다. 아래 `validate<T>` 함수는 검증 함수 배열과 오류 메시지를 인자로 입력받고, 검증 함수 배열에 있는 모든 함수에 입력값을 주고 실행하고, 하나라도 검증에 실패하면 오류 메시지를, 모두 성공했다면 다시 입력값을 되돌려주는 함수입니다. 이제 우리는 하나의 오류에 대해 여러 개의 검증 규칙을 묶어 사용할 수 있게 되었습니다.

fp-ts에 익숙하지 않으신 분들을 위해 fp-ts의 함수와 타입에 대해 간단한 설명을 적어놓았습니다.
`pipe`

`pipe` 함수는 이름 그대로 함수들을 파이프처럼 쭉 이어주는 역할을 합니다. 예를 들어 `pipe(foo, bar)(value)`는 `bar(foo(value))`와 같습니다.

예를 들어 아래 `pipe` 함수를 호출하는 코드는

    pipe(addOne, multiplyByTen)(10);

이런 흐름으로 실행됩니다.

![mermaid-diagram-20220519021844.svg](https://images.gogumang.com/5a51ccf4bc/01.svg)
`Either<E, A>`

`Either<E, A>` 타입은 분리 합집합 혹은 서로소 합집합을 나타내는 타입으로 `Left<E>` 혹은 `Right<A>` 타입 중 하나만을 가집니다. `T | None` 을 표현하는 `Option<T>`와 달리 `Either<E, A>`는 `Left<E>`와 `Right<A>` 모두 null이 아닌 값을 가질 수 있어, falsy한 경우에도 값을 표현해야 하는 경우에 사용됩니다.

일반적으로 Falsy한 경우를 `Left`로, Truly한 경우를 `Right`로 표현합니다.
`Predicate<T>`

`Predicate<T>` 는 `(a: T) => boolean` 을 뜻합니다. 즉, 어떤 값에 대해서 참이냐 거짓이냐를 판별하는 제네릭 함수 타입입니다.
`Either.fromPredicate`

`Either.fromPredicate` 는 `((predicate, onFalse) => ((a: A) => Either)` 시그니처를 갖는 함수로 `predicate` 의 실행 결과에 따라 `Left` 혹은 `Right` 타입을 변환시켜줍니다.

만약 `predicate`의 실행 결과가 `false`라면 `onFalse`의 실행 결과를 `Left` 객체에 담아 반환하고, `true`라면 `Right` 객체에 `value`를 담아 반환해 줍니다.

    import { fromPredicate } from 'fp-ts/Either';
    import { pipe, type Predicate } from 'fp-ts/function';
    import { every, map } from 'fp-ts/Array';

    const validate =
      <T,>(validators: Array<Predicate<T>>, errorMessage: string) =>
      (value: T) =>
        pipe(
          value,
          fromPredicate(
            (val) =>
              pipe(
                validators,
                map((fn) => fn(val)),
                every(Boolean)
              ),
            () => errorMessage
          )
        );

### 검증기 만들기

이제 검증에 사용할 공통 함수를 만들었으니, 각 입력 필드에서 사용할 검증기를 만들어봅시다. 하지만 모두 적기에는 지루해질 것 같으니 간단하게 휴대폰 번호 필드에 대한 검증기를 만들어 보면서 앞에서 정의했던 `validate` 함수를 어떻게 사용하고 어떻게 오류 메시지를 처리하는지 알아봅시다.

먼저 검증 규칙 함수들을 선언합니다. 어떤 규칙들은 한 필드에서만 사용되지만, 많은 규칙들을 여러 필드에서 사용하기에 작은 단위로 선언하면 재사용성이 높아집니다. 이렇게 검증 규칙 함수들을 공통적으로 사용할 수 있게 정의해놓으면, 다른 값에 대한 검증기를 만들 때 편리합니다.

    const startsWith =
      (search: string): Predicate<string> =>
      (text: string) =>
        text.startsWith(search);

    const minLength =
      (limit: number): Predicate<string> =>
      (text: string) =>
        text.length >= limit;

    const maxLength =
      (limit: number): Predicate<string> =>
      (text: string) =>
        text.length <= limit;

    const testPhoneNumberPattern = (text: string) => !/[^0-9\\s\\-]/gi.test(text);

그리고 원하는 규칙에 맞게 휴대폰 검증 함수를 정의합니다. 여기서 구현하려는 검증 규칙은 아래와 같습니다.

* 휴대폰 번호가 한 글자라도 입력이 되지 않았으면 필수 항목이라는 오류 메시지를 반환합니다.
* 아래 함수들을 실행해 모두 조건을 만족하는지 확인합니다.
  * 숫자 외에 다른 문자가 있는지 확인합니다.
  * 휴대폰 번호가 '01'로 시작하는지 확인합니다.
  * 번호 길이가 10자 이상인지 확인합니다.
  * 번호 길이가 11자 이하인지 확인합니다.
* 모든 조건을 만족한다면 휴대폰 번호를 `Right<string>` 타입으로 반환합니다.
* 하나라도 만족하지 못한다면 올바르지 않은 번호 형식이라는 오류 메시지를 `Left<string>` 타입으로 반환합니다.

`Either.chain`

`Either`와 함께 `Either`를 입력받는 콜백 함수를 입력받습니다. 입력받은 `Either`가 `Left`냐 `Right`냐에 따라 함수를 실행할지 말지 결정하는 함수입니다. 만약 입력받은 `Either`가 `Left`라면 그대로 `Left`를 반환하고 `Right`라면 `Right`에 담긴 값을 실행할 함수의 인자로 넘깁니다.

아래의 예시를 보시면 이해에 도움이 되실 것 같습니다.

    import { chain, left, right, type Either } from 'fp-ts/lib/Either';

    const multiplyByTen = (n: number): Either<string, number> => right(n * 10);
    const func = (e: Either<string, number>) => {
      return chain(multiplyByTen)(e);
    };

    console.log(func(left('CookieRun!')));
    console.log(func(right(10)));

    export const validatePhoneNumber = (
      phoneNumber: string
    ): Either<string, string> =>
      pipe(
        validate([minLength(1)], '필수항목입니다.')(phoneNumber),
        chain(
          validate(
            [
              testPhoneNumberPattern,
              startsWith('01'),
              minLength(10),
              maxLength(11),
            ],
            '올바르지 않은 번호형식입니다.'
          )
        )
      );

### 커스텀 훅 만들기

공통 `validate` 함수와 휴대폰 번호를 검증할 때 쓸 검증 함수까지 작성했으니, 값과 오류에 관한 상태를 아래와 같이 처리하던 것을 커스텀 훅을 만들어 간결하게 만들어봅시다.

    const [mobileNumber, setMobileNumber] = React.useState<string>('');
    const [mobileNumberError, setMobileNumberError] = React.useState<string>('');

먼저, 실제로 폼을 렌더링할 때 필요한 것을 생각해보면 아래와 같습니다.

* `React.useState`처럼 입력값의 상태를 관리할 수 있어야 합니다.
* 값을 검증하고 오류 메시지를 가져올 수 있어야 합니다.
* 검증 함수를 직접 호출할 수 있어야 합니다.

여기서 검증 함수를 직접 호출할 수 있어야 하는 이유는 사용자가 폼에 어떠한 입력을 하지 않고 바로 폼을 제출하는 경우가 있기 때문에 폼을 제출하기 전 검증을 해야 하기 때문입니다.

이러한 조건을 바탕으로 커스텀 훅을 만들면 아래와 같은 모양이 됩니다. 입력값과 오류에 대한 상태를 내부에서 관리하고 있으며, 넘겨받은 검증 함수를 호출하며 결과에 따라 상태를 업데이트합니다.
`Either.match`

`Either` 타입에 대해 패턴 매칭을 수행합니다. `Either`와 콜백 함수 두 개를 인자로 받는데 첫 번째 인자로 들어오는 함수는 `Left` 타입일 경우에, 두 번째 인자로 들어오는 함수는 `Right` 타입일 경우에 실행됩니다.
`function.identity`

`(a: A) => A`

인자로 입력받은 값을 그대로 다시 반환하는 함수입니다.
`string.isEmpty`

빈 문자열인지 확인합니다.
`string.empty`

빈 문자열입니다. `''`과 같습니다.

    import { match, type Either } from 'fp-ts/Either';
    import { identity, pipe } from 'fp-ts/function';
    import { isEmpty, empty } from 'fp-ts/string';

    type StateValidator = {
      validate: () => boolean;
      error: string;
    };

    const useStateWithValidator = <T,>(
      initialState: T,
      validator: (v: T) => Either<string, T>
    ): [T, (v: T, t?: boolean) => void, StateValidator] => {
      const [value, setValue] = useState<T>(initialState);
      const [error, setError] = useState('');

      const changeError = (e: string) => {
        setError(e);
        return e;
      };

      const changeValue = (v: T) => {
        pipe(
          validator(v),
          match(
            (error) => error,
            () => pipe(v, setValue, () => empty)
          ),
          changeError
        );
      };

      const stateValidator: StateValidator = {
        validate(): boolean {
          return pipe(
            validator(value),
            match(identity, () => empty),
            changeError,
            isEmpty
          );
        },

        get error(): string {
          return error;
        },
      };

      return [value, changeValue, stateValidator];
    };

이 훅을 기존 코드에 적용하면 아래와 같아집니다. 많은 구현이 숨겨져 이제 컴포넌트에서 폼 상태 관리와 검증을 위해 작성해야 하는 코드가 줄었습니다. 또한 작게 나누어진 검증 규칙들을 조합해 원하는 대로 사용할 수 있고, 여기서 더 확장하면 하나의 필드에서 발생한 오류 한 가지만 보여주는 것에서 모든 오류를 보여줄 수 있습니다. (아무짝에도 쓸모없는 수 많은 사이트의 비밀번호 필드 규칙들을 생각해보세요)

    const [phoneNumber, setPhoneNumber, phoneNumberValidator] = useStateWithValidator<string>('', validatePhoneNumber);

    const onPhoneNumberChange = (e) => setPhoneNumber(e.target.value);

    const onSubmit = () => {
        const validators = [phoneNumberValidator, ...];
        const isNotValid = validators
            .map((validator) => validator.validate())
            .some((valid) => !valid);

    	if (isNotValid) {
    		return;
    	}

    }

    return (
    	...
    	<input onChange={onPhoneNumberChange} value={phoneNumber} />
    	<span className="error">{phoneNumberValidator.error}</span>
        ...
    )

    const [mobileNumber, setMobileNumber] = React.useState<string>('');
    const [mobileNumberError, setMobileNumberError] = React.useState<string>('');

    const validateMobileNumber = (value: string): boolean => {
    	if (!mobileNumberRegex.test(value)) {
    	  setMobileNumberError('휴대폰 번호가 올바르지 않습니다.');
    	  return false;
    	}

    	if (!value.startsWith('01')) {
    	  setMobileNumberError('휴대폰 번호가 올바르지 않습니다.');
    	  return false;
    	}

    	if (value.length < 10 || value.length > 11) {
    	  setMobileNumberError('휴대폰 번호가 올바르지 않습니다.');
    	  return false;
    	}
    	return true;
    }

    const handleMobileNumberChange = (e) => {
    	const { value } = e.target;
    	validateMobileNumber(value);
    	setMobileNumber(value);
    }

    const onSubmit = () => {
    	const validations = [validateMobileNumber(mobileNumber), ...];
    	if (validations.some((valid) => !valid)) {
    		return;
    	}

    }

    return (
    	...
    	<input onChange={handleMobileNumberChange} value={mobileNumber} />
    	<span className="error">{mobileNumberError}</span>
    	...
    )

## 정리

따라오느라 고생하셨습니다. 이 글에서 어떤 것들을 했는지 다시 한번 돌아봅시다.

* `fp-ts`를 사용해 공통으로 사용할 검증 유틸 함수를 만들었습니다.
* 검증에 사용할 검증 규칙들을 재사용성이 높은 작은 함수로 만들었습니다.
* 검증 유틸 함수와 검증 규칙을 조합하여 입력 필드에 사용할 검증 함수를 만들었습니다.
* 검증 함수를 쉽게 사용하기 위하여 커스텀 훅을 만들었습니다.

단순히 폼 관련 라이브러리를 사용해도 되지만, 함수형 프로그래밍과 타입으로 같은 문제를 해결하는 과정을 지켜보시면서 어떠셨나요? 프론트엔드 개발을 하다 보면 상태 관리와 전쟁하는 것이 부지기수이지만, 함수형 프로그래밍이라는 무기를 사용하면 그 전쟁을 조금 더 수월하게 이끌어나갈 수 있는 것 같습니다. 이 글을 읽고 흥미가 생기셨다면 여러분의 프로젝트에 함수형 프로그래밍을 적용해보시는 건 어떨까요?

긴 글 읽어주셔서 감사합니다.

데브시스터즈에서는 다양한 문제들을 적절한 기술로 탁월하게 같이 해결할 분들을 모집하고 있습니다.
![deco cookie](https://images.gogumang.com/5a51ccf4bc/02.png)

## 데브시스터즈는 최고의 인재를 찾고 있습니다.

자세한 내용은 채용 사이트를 확인해 주세요!