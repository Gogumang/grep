# VSCode의 Jupyter Extension을 사용하여 간단하게 Python으로 데이터 시각화하기

안녕하세요, 모델연구팀 김세회입니다.

기존에는 Python으로 데이터 분석을 할 경우 로컬이나 서버에 [Jupyter Notebook](https://jupyter.org/)을 설치하여 작업을 했습니다.

하지만 이번에 팀 내 스터디를 진행하면서 VSCode로 [Jupyter Extension](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter)을 설치해서 사용해보았던 경험을 정리하여 공유하고자 합니다.

비록 Jupyter Notebook의 다양한 plugin 같은 기능은 지원하지 않지만, 간단하게 로컬에서 VSCode 내 Jupyter Extension으로 코드를 작성하고 바로 실행해 볼 수 있습니다.

여기서는 붓꽃 예제 데이터를 이용해서 Pandas로 데이터를 로딩하고 간단한 통계를 확인한 후 Seaborn으로 시각화해보도록 하겠습니다.

## 준비하기

### Python 설치

* Python을 설치하는 방법은 여러 가지가 있지만 전 데이터 분석을 위한 다양한 라이브러리가 함께 설치되는 [Anaconda](https://www.anaconda.com/)로 설치하였습니다.
* 오픈소스인 [Anaconda Individual Edition](https://www.anaconda.com/products/individual)을 운영체제에 맞게 다운로드하셔서 설치하시면 됩니다.

### VSCode 설치

* 마찬가지로 [VSCode](https://code.visualstudio.com/) 사이트에서 다운로드하셔서 설치하시면 됩니다.
* 설치 및 실행에 관한 자세한 내용은 공식 사이트 참고하시기 바랍니다.

### Jupyter Extension 설치

* 아래 스샷처럼 VSCode에서 왼쪽 Extension 아이콘을 클릭하여 Jupyter로 검색하여 클릭한 후 오른쪽 Install을 눌러서 설치하시면 됩니다.

### 예제 데이터 CSV 파일 다운로드

* [Kaggle에 있는 붓꽃 예제 데이터 CSV 파일](https://www.kaggle.com/uciml/iris)을 가지고 통계 및 시각화를 진행해보았습니다.
  * 데이터 컬럼

|      컬럼명      |                 설명                  |
|:-------------:|:-----------------------------------:|
|      Id       |                일련번호                 |
| SepalLengthCm |               꽃받침의 길이               |
| SepalWidthCm  |               꽃받침의 너비               |
| PetalLengthCm |               꽃잎의 길이                |
| PetalWidthCm  |               꽃잎의 너비                |
|    Species    | 붓꽃 종류 setosa, versicolor, virginica |

## Jupyter Notebook 간단 사용법

### Jupyter Notebook 새로 만들기

* 새 프로젝트를 생성하고 Cmd(윈도우는 Ctrl)-Shift-P를 눌러서 커맨드 팔레트 실행하여, "Jupyter: Create New Blank Notebook" 커맨드를 실행하면 빈 노트북이 생성이 됩니다.

### 코드 작성 후 실행

* cell을 클릭하면 코드를 작성할 수 있습니다.
* 코드를 작성한 후 위에 녹색 실행 버튼을 클릭하거나 Cmd+Shift+Enter를 누르면 실행이 되며, cell 아래 실행 결과가 나타납니다. ![1.png](https://images.gogumang.com/b2edfa6deb/01.png)

## 데이터 로딩하고 살펴보기

### 데이터 로딩

* Pandas의 read_csv() 함수로 CSV 파일을 DataFrame으로 로딩할 수 있습니다.
  * delimiter로 구분자를 지정할 수 있습니다.
  * index_col로 인덱스 칼럼을 지정할 수 있습니다.
  * header=0으로 칼럼명으로 사용할 행을 지정할 수 있습니다.
  * header=None이면 Pandas에서 임의로 칼럼명을 생성합니다.

```python
import pandas as pd

df = pd.read_csv("Iris.csv", delimiter=",", index_col="Id", header=0)

# 또는 아래와 같이 names에 컬럼명을 넘겨주면 명시적으로 컬럼명을 지정할 수도 있습니다.
col_names = ["Id", "SepalLengthCm", "SepalWidthCm", "PetalLengthCm", "PetalWidthCm", "Species"]
df = pd.read_csv("Iris.csv", delimiter=",", names=col_names, index_col=0, header=None)
```

* DataFrame.head() 함수로 로딩한 DataFrame의 데이터를 일부 살펴볼 수 있습니다.

```python
df.head()
```

![2.png](https://images.gogumang.com/b2edfa6deb/02.png)

### 데이터셋 크기, 칼럼, 데이터 타입 살펴보기

* DataFrame.shape으로 데이터셋의 크기(row 개수, column 개수)를 확인할 수 있습니다.
* DataFrame.columns로 칼럼들을 확인할 수 있습니다.
* DataFrame.dtypes로는 칼럼 별 데이터 타입을 확인할 수 있습니다.
* 또는 위 세 가지를 info() 함수로 한 번에 확인할 수도 있습니다. ![3.png](https://images.gogumang.com/b2edfa6deb/03.png)
* 데이터는 총 150개이며 Id 인덱스를 제외한 5개의 칼럼이 있는 것을 확인할 수 있습니다.

## Pandas로 데이터 통계내기

### 칼럼 별 통계 확인하기

* DataFrame.describe() 함수로 칼럼 별 데이터 개수와 분포를 확인할 수 있습니다.
* 이를 통해 칼럼마다 평균과 최솟값, 최댓값 그리고 중앙값이 다른 것을 확인할 수 있습니다. ![4.png](https://images.gogumang.com/b2edfa6deb/04.png)

## Seaborn으로 시각화하기

### 분포도

* describe() 함수로 확인한 각 컬럼별 분포를 boxplot() 함수로 시각화하여 확인해 볼 수 있습니다.

```python
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns

# 스타일 지정
# white, dark, whitegrid, darkgrid 등이 있음
sns.set_style("darkgrid")

# boxplot 실행
ax = sns.boxplot(data=df, orient="h", palette="Set2")
```

![5.png](https://images.gogumang.com/b2edfa6deb/05.png)

* 또는 종(Species)에 따른 특정 컬럼(SepalLengthCm)의 분포의 차이도 아래처럼 확인할 수 있습니다.

```python
ax = sns.boxplot(x="Species", y="SepalLengthCm", data=df)
```

![6.png](https://images.gogumang.com/b2edfa6deb/06.png)

### 산점도

* scatterplot() 함수를 이용하여 산점도를 그려서 x, y로 입력한 두 칼럼 간의 상관관계를 확인해볼 수 있습니다.

```python
ax = sns.scatterplot(data=df, x="SepalLengthCm", y="SepalWidthCm", hue="Species")
```

![7.png](https://images.gogumang.com/b2edfa6deb/07.png)

* 또한 아래와 같이 hue로 입력한 종(Species)에 따른 x, y의 상관관계 및 분포 차이도 확인해볼 수 있습니다.
  * 이를 통해 꽃잎의 길이와 너비에 따라 세 가지 종류가 확실히 구분이 되는 것을 확인할 수 있습니다.

```python
ax = sns.scatterplot(data=df, x="PetalLengthCm", y="PetalWidthCm", hue="Species")
```

![8.png](https://images.gogumang.com/b2edfa6deb/08.png)

### 다중 차트

* PairGrid() 함수를 사용하면 여러 개의 산점도 등을 한 번에 그릴 수 있습니다.
* 이를 통해 종을 제외한 4개의 칼럼들 간의 상관관계 및 종에 따른 분포 차이를 한 번에 확인해볼 수 있습니다.
  * 단 데이터 크기가 클 경우 그리는데 오래 걸릴 수 있습니다.

```python
# PairGrid 실행
# diag_sharey: y축을 공유하지 않음
g = sns.PairGrid(df, hue="Species", diag_sharey=False)

# 대각선 위쪽 차트는 kdeplot으로 함
g.map_upper(sns.kdeplot)

# 대각선 차트 유형은 히스토그램으로 함
g.map_diag(plt.hist)

# 대각선 아래쪽 차트 유형은 산점도로 함.
g.map_lower(sns.scatterplot)

# 범례를 추가
g.add_legend()
```

![9.png](https://images.gogumang.com/b2edfa6deb/09.png)

## 마치며

간단하게 VSCode의 Jupyter Extension을 사용하여 Python으로 데이터 통계 및 시각화하는 방법을 살펴보았습니다.

간단하지만 응용만 잘한다면 실무에 있어서 데이터를 기반으로 한 의사결정이나 모델링을 하기 위한 근거로도 사용할 수 있을 것 같습니다.

부족한 글이지만 끝까지 읽어주셔서 감사합니다.