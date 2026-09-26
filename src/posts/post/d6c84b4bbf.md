글. 오카무라 카에(Kylie) / 파트너웹개발팀

![](https://cdn-images-1.medium.com/max/1024/1*XGvHNu7Vgw-dLLVzjdQvgw.png)

안녕하세요. 파트너웹개발팀 카일리입니다.

AI 에이전트에게 Figma 디자인을 주면 코드를 작성해주는 시대가 왔습니다. Figma MCP를 연동하면 에이전트가 Figma 디자인을 이해하고, 이를 바탕으로 화면 코드까지 생성합니다. 우리 팀도 화면 개발에 AI 에이전트를 적극 활용하고 있습니다.

하지만 이렇게 일을 하다 보면 에이전트가 디자인 시스템 컴포넌트를 “제대로” 사용하지 못하는 경우를 자주 마주하게 됩니다. `Button`처럼 단순한 컴포넌트는 비교적 잘 활용합니다. 하지만 사용 방법이 복잡하거나 여러 컴포넌트를 조합해야 하는 경우에는 엉뚱한 코드를 생성하는 경우가 많고, 디자인 시스템을 사용하지 않고 직접 구현해버릴 때도 있습니다. 같은 입력을 해도 확률적으로 결과가 달라지는 에이전틱 코딩의 특성상 결과물도 일관적이지 못하고요.

이런 문제점 때문에 뭔가 좋은 방법이 없을까 고민하고 있던 차에 마침 사내 디자인 시스템을 처음부터 새로 만들 기회가 생겼습니다. 그래서 에이전트 친화적 디자인 시스템의 설계를 목표로 삼고 작업을 진행 중입니다. 이 글에서는 그 과정에서 찾은 에이전트가 더 잘 일할 수 있도록 돕는 방법에 대해 이야기하려고 합니다.

### 에이전트가 일관성있게 정확하게 작업을 하려면

Figma 디자인을 전달하면 에이전트는 Figma MCP를 통해 디자인을 분석하고 코드를 생성합니다. 하지만 앞서 말씀드렸듯이, 이 방식만으로는 일관성과 정확성을 보장하기 어려웠습니다.

문제의 핵심은 에이전트에게 제공되는 정보가 부족하다는 점이었습니다. 에이전트가 올바른 컴포넌트를 선택하고 정확하게 사용하도록 하려면 그에 맞는 정보들을 올바르게 제공해야 했습니다.

이 글에서는 이를 위해 어떤 정보를 제공했고 그 결과로 어떤 효과를 얻었는지 소개하겠습니다.

### 에이전트가 참고하는 정보와 에이전트를 위한 정보

```
┌─────────────────────────────────────────┐
│  Agent Docs (agent/*.md + README.md)    │  ← 조합 패턴, 규칙, 상황별 예제 등의 사용법
├─────────────────────────────────────────┤
│  Code Connect                           │  ← Figma 속성과 코드 props의 매핑 정보
└─────────────────────────────────────────┘
```

**에이전트가 참고하는 정보: Code Connect**

Code Connect는 Figma의 디자인 속성과 실제 코드의 props를 매핑해줍니다. 단순한 컴포넌트는 이 매핑 정보만으로도 에이전트가 올바른 코드를 생성할 수 있습니다.

**에이전트를 위한 정보: Agent Docs**

Code Connect만으로 전달하기 어려운 사용법을 마크다운 문서로 제공합니다. 컴포넌트 조합 패턴, 공통 규칙, 상황별 예제 등을 담고 있습니다.

이제 위의 요소들이 각각 어떤 역할을 하는지 자세히 살펴보겠습니다.

### Code Connect

Code Connect는 Figma에서 제공하는 기능으로, Figma Dev Mode에서 컴포넌트를 선택하면 개발자가 작성한 실제 코드 스니펫을 바로 확인할 수 있게 해줍니다. 원래는 디자이너와 개발자 사이의 소통을 돕기 위한 도구이지만, 에이전트에게도 매우 유용한 정보를 제공합니다.

Figma에서 디자이너가 설정하는 속성 이름과 코드에서 사용하는 `prop` 값은 다른 경우가 많습니다. 예를 들어 Figma에서는 `Size = Large`이지만 코드에서는 `size="lg"`를 사용합니다. 이럴 때는 문제가 생기지 않도록 개발자가 Figma 속성과 코드 props의 대응 관계를 직접 정의합니다.

이렇게 개발자가 정의한 매핑 정보는 에이전트가 Figma MCP로 디자인을 분석할 때 함께 전달됩니다. 덕분에 에이전트는 Figma에서 `Size = Large`로 설정된 속성을 보고, 매핑 정보를 참고해 `size="lg"`로 정확하게 변환할 수 있습니다. 아래는 `BoxButton`의 Code Connect 정의 예시입니다.

```
// Code Connect 정의
figma.connect(BoxButton, '…', {
 props: {
 size: figma.enum('Size', { Large: 'lg', Medium: 'md', Small: 'sm' }),
 hierarchy: figma.enum('Hierarchy', {
 Primary: 'primary',
 Secondary: 'secondary',
 Destructive: 'destructive',
 }),
 },
 example: (props) => (
 <BoxButton size={props.size} hierarchy={props.hierarchy}>
 Button
 </BoxButton>
 ),
});
```

![](https://cdn-images-1.medium.com/max/1024/1*6sRITQwCEpsqzFo7pxRW1Q.png)

`BoxButton`처럼 사용법이 단순한 컴포넌트는 Code Connect만으로도 충분합니다. 에이전트는 Figma 속성과 코드 `props`의 매핑 정보를 바탕으로 올바른 코드를 생성할 수 있습니다.

하지만 Code Connect에도 한계는 있습니다. 단일 컴포넌트의 `prop` 매핑은 잘 표현할 수 있지만, 사용 방법이 복잡하거나 여러 컴포넌트를 함께 조합해야 하는 경우에는 필요한 맥락을 충분히 전달하지 못합니다.

#### Calendar 실험: Code Connect로는 어디까지 가능한가

여러 컴포넌트를 조합하는 복잡한 케이스에서도 Code Connect가 충분한지 확인하기 위해 실험을 해봤습니다.

아래는 우리 디자인 시스템의 `DatePicker` 컴포넌트입니다.

![](https://cdn-images-1.medium.com/max/1024/1*Za37xtltItg_DX0QX3vsdA.png)

이번에는 `DatePicker`에 Code Connect를 연동한 상태에서 동일한 화면을 구현하도록 에이전트에게 지시했습니다. 그 결과는 아래와 같았습니다.

```
function DateRangePickerExample() {
  const [dateRange, setDateRange] = useState<[Date, Date] | undefined>(undefined);

  const { year, month, goPrev, goNext, goToMonth, getDateProps } =
    useCalendar({
      mode: 'range',
      value: dateRange,
      onChange: setDateRange,
    });

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <DatePicker.Root>
      <DatePicker.Trigger>
        <SelectorDefault placeholder="기간 선택" />
      </DatePicker.Trigger>

      <DatePicker.Content>
        <DatePickerDouble locale="ko">
          <DatePickerDouble.Header>
            <Navigator
              year={year}
              month={month}
              locale="ko"
              onPrev={goPrev}
              onMonthChange={(m) => goToMonth(year, m)}
            />

            <Navigator
              year={nextYear}
              month={nextMonth}
              locale="ko"
              onNext={goNext}
            />
          </DatePickerDouble.Header>

          <DatePickerDouble.Body>
            <DatePickerDouble.Grids>
              <Calendar
                year={year}
                month={month}
                getDateProps={getDateProps}
              />

              <Calendar
                year={nextYear}
                month={nextMonth}
                getDateProps={getDateProps}
              />
            </DatePickerDouble.Grids>
          </DatePickerDouble.Body>

          <DatePicker.Actions
            locale="ko"
            selectedDateText={formatDateRange(dateRange)}
            onReset={() => setDateRange(undefined)}
            onApply={() => {
              /* 적용 처리 */
            }}
          />
        </DatePickerDouble>
      </DatePicker.Content>
    </DatePicker.Root>
  );
}
```

Code Connect 덕분에 에이전트는 올바른 컴포넌트를 선택했고, 컴포넌트를 올바른 구조로 조합했습니다.

`useCalendar`훅을 사용하고 `DatePickerDouble` 내부에 Header → Body → Actions 를 배치하는 등 화면 구조가 의도한 형태와 거의 동일하게 구현되었습니다.

**문제: 상태 관리 패턴**

```
// ❌ 하나의 state만 사용 — 날짜 선택 즉시 반영
const [dateRange, setDateRange] = useState<[Date, Date] | undefined>(undefined);

const { ... } = useCalendar({
  mode: 'range',
  value: dateRange,
  onChange: setDateRange, // 선택할 때마다 즉시 state에 반영
});

// 이미 state에 반영되어 있으므로 적용 버튼이 의미 없음
onApply={() => { /* ??? */ }}
```

이 컴포넌트에는 적용 버튼이 있으므로, 사용자가 날짜를 선택하는 동안에는 임시 상태(`pending`)로 관리하고 적용 버튼을 눌렀을 때만 최종 상태(`committed`)에 반영해야 합니다.

하지만 에이전트는 하나의 state만 사용해 날짜를 선택하는 즉시 최종 상태를 변경했습니다. 이렇게 구현하면 적용 버튼은 사실상 의미가 없어지고, 사용자가 변경 사항을 취소하거나 이전 상태로 되돌리는 UX도 구현할 수 없습니다.

실험 결과를 보면 Code Connect는 어떤 컴포넌트를 사용해야 하는지, 컴포넌트를 어떻게 조합해야 하는지, 그리고 기본적인 `prop` 매핑까지는 정확하게 전달했습니다. 하지만 상태를 어떻게 관리해야 하는지, 컴포넌트가 어떤 방식으로 상호작용해야 하는지와 같은 사용 규칙까지 전달하지는 못했습니다.

Code Connect에서도 사용 예시를 제공할 수는 있습니다. 하지만 다양한 사용 패턴과 구현 시 주의해야 할 사항, 서비스에서 권장하는 구현 방식까지 모두 표현하기에는 한계가 있습니다. 그래서 이러한 정보를 에이전트에게 체계적으로 전달하기 위해 Agent Docs를 만들었습니다.

### 에이전트를 위한 정보: Agent Docs

Agent Docs는 쉽게 말해 에이전트를 위한 Storybook입니다. 각 패키지의 `agent/`디렉터리에 마크다운 문서로 관리되며, 컴포넌트별 사용법과 조합 패턴을 제공합니다.

```
packages/react/
├── agent/
│   ├── README.md              # 진입점: 공통 규칙 + 컴포넌트 목록
│   ├── FormField.md
│   ├── InputText.md
│   └── ...

packages/calendar/
├── agent/
│   ├── README.md              # "뭘 하고 싶은지 → 어떤 문서를 읽을지" 매핑
│   ├── useCalendar.md         # Hook 사용 가이드
│   ├── DatePickerDouble.md
│   ├── Calendar.md
│   ├── Navigator.md
│   └── ...
```

#### 문서의 구성

각 문서에는 다음과 같은 내용을 포함합니다.

* **Anatomy:** 컴포넌트 조합 구조와 역할
* **Props:** 각 컴포넌트의 `prop`, 타입, 기본값
* **사용 예제:** 기본 패턴부터 실전 변형까지의 코드 예제

예를 들어 `FormField`와 `InputText`의 Agent Docs는 아래와 같습니다.

````
# FormField + Input/TextArea 공통 가이드

## Anatomy

| Name               | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| FormField.Root     | 레이아웃 wrapper. disabled/readOnly를 하위에 자동 전파        |
| FormField.Label    | `<label>` 태그. required로 dot badge, optionalText로 선택 표시 |
| FormField.Control  | Input, Textarea 등을 감싸는 레이아웃 컨테이너                 |
| FormField.HintText | 힌트/에러/완료 등 보조 텍스트. status로 색상 제어             |

## Props
...

## 표준 패턴

FormField.Root의 `disabled`, `readOnly`는 하위 Input에 자동 전파된다.

```tsx
<FormField.Root>
  <FormField.Label required>이메일</FormField.Label>
  <FormField.Control>
    <InputText placeholder="이메일 입력" value={value} onChange={handleChange} />
  </FormField.Control>
  <FormField.HintText>이메일 형식으로 입력해 주세요.</FormField.HintText>
</FormField.Root>
```

## Label Focus 연결
...

## 서비스 자체 레이아웃 + PDS 부분 사용 (Standalone)

...

## React Hook Form 연동

...
````

Code Connect만으로는 전달하기 어려운 조합 패턴, 사용 규칙, 구현 시 주의사항, 실전 예제 등을 이 문서에 담았습니다.

#### 진입점 설계

`agent/README.md`에는 에이전트가 목적에 맞는 문서를 빠르게 찾을 수 있도록 매핑 테이블도 제공합니다. `Calendar`의 경우는 다음과 같습니다.

실제 서비스 프로젝트의 `CLAUDE.md`에 "PDS 컴포넌트 사용 시 반드시 `agent/` 문서를 먼저 읽을 것"이라고 명시해두면, 에이전트는 작업을 시작할 때 `agent/README.md`를 읽고 매핑 테이블에서 필요한 문서를 찾아 참고합니다.

```
| 하고 싶은 것                     | 참조 문서                              |
| ------------------------------- | ---------------------------------- |
| 날짜 하나 선택하고 싶다          | `useCalendar.md`                       |
| 기간(range) 선택하고 싶다        | `useCalendar.md`                      |
| 드롭다운으로 날짜를 선택하고 싶다 | `DatePicker.md`                          |
| 2개월 캘린더를 사용하고 싶다      | `DatePickerDouble.md`                  |
```

에이전트는 사용자의 요구사항을 바탕으로 이 매핑을 참고해 어떤 문서를 읽어야 하는지 판단합니다.

앞에서 했던 `Calendar` 실험과 동일한 요구사항을 이번에는 Agent Docs를 제공한 상태에서 다시 제시해봤습니다.

```
function DateRangePickerExample() {
  // ✅ 임시 상태(pending)와 최종 상태(committed)를 분리
  const [range, setRange] = useState<[Date, Date] | undefined>(undefined);
  const [tempRange, setTempRange] = useState<[Date, Date] | undefined>(undefined);

  const { year, month, goPrev, goNext, goToMonth, getDateProps } =
    useCalendar({
      mode: 'range',
      value: tempRange, // 임시 상태를 바인딩
      onChange: setTempRange, // 선택해도 최종 상태에 영향 없음
    });

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <DatePicker.Root>
      <DatePicker.Trigger>
        <SelectorDefault placeholder="기간 선택" />
      </DatePicker.Trigger>

      <DatePicker.Content>
        <DatePickerDouble locale="ko">
          <DatePickerDouble.Header>
            <Navigator
              year={year}
              month={month}
              onPrev={goPrev}
            />

            <Navigator
              year={nextYear}
              month={nextMonth}
              onNext={goNext}
            />
          </DatePickerDouble.Header>

          <DatePickerDouble.Body>
            <DatePickerDouble.Grids>
              <Calendar
                year={year}
                month={month}
                getDateProps={getDateProps}
              />

              <Calendar
                year={nextYear}
                month={nextMonth}
                getDateProps={getDateProps}
              />
            </DatePickerDouble.Grids>
          </DatePickerDouble.Body>

          <DatePicker.Actions
            selectedDateText={formatRange(tempRange)}
            onReset={() => setTempRange(undefined)}
            onApply={() => {
              setRange(tempRange); // ✅ 적용 시에만 최종 상태에 반영
              setOpen(false); // ✅ 적용 후 드롭다운 닫기
            }}
          />
        </DatePickerDouble>
      </DatePicker.Content>
    </DatePicker.Root>
  );
}
```

기존에 확인했던 상태 관리 문제가 해결되었습니다. 에이전트는 Agent Docs를 참고해 `useCalendar`의 사용 패턴과 컴포넌트 조합 규칙을 올바르게 이해했고, 의도한 구조 그대로 코드를 생성했습니다. Agent Docs는 타입 정의나 Code Connect만으로 전달하기 어려운 사용 규칙과 조합 패턴을 보완해 주었고, 그 결과 생성되는 코드의 정확성과 일관성을 크게 높일 수 있었습니다.

하지만 한 번의 성공만으로는 충분하지 않습니다. 앞서 언급했듯이 에이전트는 확률적으로 동작하기 때문에, 같은 입력을 줘도 결과가 달라질 수 있습니다. Agent Docs가 정말로 일관성을 높여주는지 확인하기 위해, 동일한 요구사항으로 실험을 3회씩 반복했습니다.

![](https://cdn-images-1.medium.com/max/1024/1*AhER-z4H0TJ16m_8VLqxnA.png)

특이한 점은 Code Connect만으로도 임시 선택과 최종 확정을 분리하는 것에는 3회 모두 성공했다는 것입니다. 에이전트가 `.d.ts`의 타입 정의에서 `onOpenChange`, `onApply`, `onReset` 같은 콜백 시그니처를 읽고 “상태를 분리해야 하겠구나” 정도는 추론한 것입니다. 하지만 세부 동작은 매번 다르게 구현되었습니다.

반면 Agent Docs를 추가한 실험에서는 3회 모두 동일한 변수명, 동일한 구조, 동일한 로직으로 올바른 코드를 생성했습니다. Agent Docs가 단순히 정확성만 높이는 것이 아니라, 에이전트의 확률적 특성으로 인한 결과 편차를 줄여 일관성까지 확보해준다는 것을 확인할 수 있었습니다.

#### Storybook과의 차이

아까 Agent Docs를 에이전트를 위한 Storybook이라고 표현했습니다. 하지만 완전히 똑같은 것은 아닙니다. Storybook은 사람이 시각적으로 탐색하기 좋은 형태로 만든 문서이고, Agent Docs는 에이전트가 소비하기 좋은 형태로 작성한 문서입니다. 사람과 AI는 정보를 소비하는 방식이 다르기 때문에 각각에게 맞는 형태로 문서를 제공해야만 효과적으로 정보를 전달할 수 있습니다.

또한 `agent/README.md`에는 시스템 수준의 규칙도 함께 정리해두었습니다. 이 파일은 에이전트가 작업을 시작할 때 가장 먼저 참고하는 진입점 역할을 합니다.

### 마치며

디자인 시스템의 소비자는 사람뿐만 아니라 에이전트까지 확장되고 있습니다. 디자인 시스템을 만드는 입장에서 이제는 “사람이 읽기 좋은 문서”뿐 아니라 “에이전트가 소비하기 좋은 정보”까지 함께 고민해야 합니다.

Code Connect는 Figma와 코드를 연결하고, Agent Docs는 사용 규칙과 조합 패턴을 전달합니다. 각각의 역할은 다르지만, 함께 사용할 때 에이전트가 디자인 시스템을 정확하고 일관되게 활용할 수 있습니다. 실제로 Agent Docs를 도입한 뒤, 에이전트가 생성한 코드를 수동으로 수정하는 빈도가 눈에 띄게 줄었습니다.

앞으로는 에이전트가 올바른 정보를 바탕으로 안정적으로 코드를 생성할 수 있도록 하는 것 역시 좋은 디자인 시스템의 주요 기준 중 하나가 될 것입니다.

이 글이 AI 에이전트를 활용해 화면을 개발하거나 디자인 시스템을 운영하는 분들께 도움이 되었으면 좋겠습니다.