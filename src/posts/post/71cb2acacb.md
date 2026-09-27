## 1. 들어가며

가상화 기술의 발전으로, **PM(Physical Machine, 물리 서버) 한 대에 여러 대의 VM(Virtual Machine, 가상 서버)을 운영** 하는 것은 이제 흔히 찾아볼 수 있는 일이 되었습니다. [VMWare](http://vmware.com)는 이러한 가상화 기술을 제공하는 대표적인 솔루션으로, 카카오에서도 상당한 규모의 VMWare 인프라를 운영하고 있습니다.

이러한 VM 인프라를 운영하다 보면 ‘**PM 한 대에서 VM을 몇 대 실행시킬지** ’, 즉 **VM 집적도** 에 대한 고민에 부딪히게 됩니다. **PM 1대에서 실행 중인 VM 개수가 늘어날수록, 제한된 PM 리소스에 대한 경쟁이 심화되어 VM의 성능이 줄어든다는 사실** 은 누구나 알고 있습니다. 하지만 구체적으로 ‘**얼마만큼의 성능 저하가 발생하는지** ’ 또는 ‘**급격한 성능 저하가 발생하는 VM 개수는 몇 대인지**’와 같은 내용들에 대해서는 명확한 답을 내리기가 쉽지 않습니다.

사실 이러한 내용들은 PM의 스펙과 VM의 리소스 사용량 등 운영 환경에 따라 달라지기 때문에, 일반화된 형태로 정의할 수 없는 것은 당연합니다. 하지만 현재 운영 환경에 대응되는 조건으로 범위를 한정하여 테스트를 진행한다면, 적어도 **현재 운영 환경에 대해서는 참고 기준이 될 수 있는 최적의 VM 집적도를 도출** 해 낼 수 있을 것이라고 생각하였습니다. 또한, **VM 집적도에 대한 전반적인 이해**를 확보해 둔다면 향후 운영 환경이 달라지더라도 반드시 도움이 되리라 생각하였습니다.

이번 글에서는 **효율적인 VMWare 인프라 운영을 위해, CPU 관점에서 최적의 VM 집적도를 찾기 위한 테스트**를 진행해 본 경험을 공유드리고자 합니다.

## 2. 테스트 소개

이번 테스트의 목적은 **CPU 관점에서의 최적의 VM 집적도** , 즉 **VM의 CPU 성능 저하 없이 PM 1대에서 수용 가능한 최대 VM 개수** 를 도출하는 것에 있습니다. 최적의 VM 집적도를 결정짓는 요소에는 CPU 외에도 메모리와 디스크 등이 있지만, **이번 테스트에서는 CPU에 초점을 두었습니다**.

### 1) 기본 아이디어

테스트의 기본 아이디어는 **PM 1대에서 VM 개수를 늘려가며 VM의 CPU 성능을 측정** 하고, **VM의 CPU 성능이 기준치 이하로 저하되기 시작하는 VM 개수를 찾는 것**입니다.

![](https://images.gogumang.com/71cb2acacb/01.png)

예를 들어, 안정적인 서비스 운영을 위한 VM의 CPU 성능 저하 기준치를 7%로 정해두었다고 했을 때, 위 그림과 같이 PM 1대에서 동시 실행 중인 VM이 20대를 넘어가는 순간부터 기준치 이상의 VM 성능 저하가 발생하기 시작한다면, 해당 PM에서 수용 가능한 최대 VM 개수는 20대라고 할 수 있습니다.

이때 **다른 VM들과의 리소스 경쟁으로 인해 영향을 받은 VM의 CPU 성능을 어떻게 측정할지** 가 중요한데, 이번 테스트에서는 **PM 내 배포된 모든 VM에서 동시에 벤치마크 프로그램을 실행하고, 그 결과들의 평균을 계산** 하는 방식을 사용하였습니다. 즉, 벤치마크 프로그램은 **VM 자기 자신의 CPU 성능을 측정** 할 뿐만 아니라, **다른 VM에 대한 리소스 경쟁을 발생시키는 부하** 역할도 하는 것입니다.

### 2) VM의 CPU 사용량

VM의 CPU 사용량에 따라 PM 1대에서 수용할 수 있는 최대 VM 개수가 달라지기 때문에, **VM의 CPU 부하를 얼마만큼 할당해 줄 것인지**도 중요합니다.

실제로 VM의 평균 CPU 사용량이 높지 않은 운영 환경에서는, PM의 리소스 활용률을 높이기 위해 PM의 물리 코어 개수에 비해 많은 VM들을 실행(a.k.a CPU Overcommit)시키는 경우가 많습니다. 따라서 실제 운영 시 참고가 될 수 있는 결과를 얻기 위해, **VM의 CPU 사용량을 10%부터 100%까지 10% 단위로 늘려가며 테스트를 진행**하였습니다.

PM 내 모든 VM들이 CPU를 특정 퍼센트만큼 사용 중인 상황을 재현하기 위해, **VM들의 최대 CPU 사용량을 제한시킨 상태로 벤치마크 프로그램을 실행**시켰습니다. 테스트에 사용된 벤치마크 프로그램은 사용 가능한 CPU 리소스를 최대한으로 사용하기 때문에, VM에 CPU 사용량 제한을 설정하고 벤치마크 프로그램을 실행하면 원하는 수준으로 VM의 CPU 사용량을 맞출 수 있습니다.

![VM 4대에서 CPU 사용량 제한을 60%로 설정하고 벤치마크 프로그램을 실행했을 때의 CPU 사용률](https://images.gogumang.com/71cb2acacb/02.png)

이때, VM의 CPU 사용량을 제한해 놓은 상태로 벤치마크 프로그램을 실행하면 당연히 CPU 사용량이 100% 일 때에 비해 점수가 낮을 수밖에 없습니다. 하지만 비교하고자 하는 대상은 VM의 CPU 사용량이 다를 때의 성능이 아니라, **VM의 CPU 사용량은 동일하지만 VM 개수가 다를 때의 성능**이므로, 벤치마크 점수가 VM의 CPU 사용량에 비례해서 낮게 측정되는 것은 문제가 되지 않습니다.

### 3) VM의 Flavor

최적의 VM 집적도는 **VM의 Flavor** , 즉 **VM의 CPU** (**vCPU**) 수에 따라 달라질 수 있습니다. PM의 CPU 리소스는 한정되어 있기 때문에, VM 1대 당 CPU 리소스를 얼마나 할당해 줄 것인지에 따라 수용 가능한 VM의 수가 달라집니다.

![](https://images.gogumang.com/71cb2acacb/03.png)

간단한 예로 위 그림과 같이 32개의 Core(pCPU)를 가진 PM이 있을 때, VM의 vCPU 수 총합이 PM의 Core 수와 동일해지도록 VM을 배포한다고 하면, 2 vCPU VM은 16대, 그리고 8 vCPU VM은 4대가 배포될 수 있습니다.

VM의 Flavor 별 최적의 VM 집적도를 확인하기 위해, 2 vCPU / 4 vCPU / 8 vCPU 세 가지 Flavor를 대상으로 PM 1대에 각 Flavor의 VM이 몇 대까지 들어갈 수 있는지 테스트를 진행하였습니다. PM 1대에서 다양한 Flavor의 VM을 혼용하는 것도 가능하지만, 이번 테스트에서는 **PM 내 모든 VM들이 같은 Flavor로 통일**되어 있는 상황을 가정하였습니다.

### 4) PM의 CPU 스펙

PM의 CPU 스펙 역시 최적의 VM 집적도에 영향을 미치는 중요한 요소입니다. Core 수, 캐시 메모리 크기 등 다양한 조건에 따라 최적의 VM 집적도가 달라집니다.

이때, Core 수는 최대 수용 가능한 VM 개수에 직접적인 영향을 미칩니다.

![](https://images.gogumang.com/71cb2acacb/04.png)

간단한 예로, 위 그림과 같이 PM의 Core 수가 2배 더 많으면, 2배 더 많은 VM을 수용 가능할 것이라고 기대할 수 있습니다.

이번 테스트에 사용된 PM들의 CPU는 Intel Xeon Silver 4410Y와 Intel Xeon Silver 4214 두 가지입니다. 비록 두 CPU 간 Core 수는 동일하지만, CPU 세대 차이에 의한 VM 집적도 차이가 있을 수 있습니다. 따라서 이를 확인하고자, **PM의 CPU 스펙에 대해서도 케이스를 나눠 테스트를 진행**하였습니다.

### 5) 테스트 진행

위와 같은 내용들을 바탕으로, 각각의 조건별로 최적의 VM 집적도를 도출하기 위한 테스트를 진행하였습니다.

#### 테스트 환경

**PM** (**CPU 스펙 및 하이퍼바이저 버전**)

|                                  |        Processor        | Sockets | Cores per Socket | Threads per Socket | Total Threads | Hyper-Threading | Base Frequency | Turbo Frequency | Cache Size | Hypervisor Version |
|----------------------------------|-------------------------|---------|------------------|--------------------|---------------|-----------------|----------------|-----------------|------------|--------------------|
| Sapphire Rapids CPU PM(Vendor A) | Intel Xeon Silver 4410Y | 2       | 12               | 24                 | 48            | Enabled         | 2.00GHz        | 3.90GHz         | 30MB       | VMWare ESXi 8.0.2  |
| Sapphire Rapids CPU PM(Vendor B) | Intel Xeon Silver 4410Y | 2       | 12               | 24                 | 48            | Enabled         | 2.00GHz        | 3.90GHz         | 30MB       | VMWare ESXi 8.0.2  |
| Cascade Lake CPU PM              | Intel Xeon Silver 4214  | 2       | 12               | 24                 | 48            | Enabled         | 2.20GHz        | 3.20GHz         | 16.5MB     | VMWare ESXi 7.0.2  |

*Sapphire Rapids CPU PM의 경우, Vendor 간 비교를 위해 스펙이 동일한 두 Vendor의 PM에서 동일한 테스트를 진행하였습니다.*

**VM의 Flavor**

* 2 vCPU 4GB MEM
* 4 vCPU 8GB MEM
* 8 vCPU 16GB MEM

**VM의 CPU 사용량**

* 10%부터 100%까지, 10%씩 증가

**VM 개수**

* 1개부터 60개까지, 1씩 증가

**벤치마크 프로그램**

* [CoreMark](https://github.com/eembc/coremark)
* [stress-ng](https://github.com/ColinIanKing/stress-ng)

#### 테스트 방법

**특정 PM, VM Flavor 조합** 에 대해 **VM 개수와 VM의 CPU 사용량을 변경해 가며 VM의 CPU 성능을 측정**합니다.

테스트 진행 순서는 아래와 같습니다.

1. 특정 PM에, 특정 Flavor의 VM을 1대부터 60대까지 1대씩 늘려가며 N대 배포
2. VM N대에 대해 CPU 사용량 제한을 10%부터 100%까지 10%씩 늘려가며 세팅
3. VM N대에서 동시에 벤치마크 프로그램 실행
4. VM N대의 각 CPU 사용량 별 벤치마크 실행 결과를 취합한 후, 평균을 계산

즉, 하나의 PM, VM Flavor 조합에 대해 아래와 같은 이중 for 문을 수행하며 각각의 VM 개수, VM의 CPU 사용량 별로 총 600개의 케이스에 대한 VM의 CPU 성능을 측정하는 것이라고 할 수 있습니다.

```
for N in range(1, 60, 1):  # 1부터 60까지 VM 개수 1씩 증가
    # PM에 VM을 N대 배포
    for M in range(10, 100, 10):    # 10%부터 100%까지 VM CPU 사용량 제한 10%씩 증가
        # N대의 VM 들에서 M%의 CPU 사용량 제한을 설정해 둔 상태로 동시에 벤치마크 실행
        # VM 별 벤치마크 실행 결과 취합
```

### 6) 테스트 결과

테스트를 진행하고 나면 **각각의 PM, VM Flavor 조합마다 VM 개수, VM의 CPU 사용량 별 VM의 CPU 성능** 결과를 얻을 수 있습니다.

![](https://images.gogumang.com/71cb2acacb/05.png)

이해를 돕기 위해 모든 요소가 가장 잘 드러나는 형태로 결과를 나타내자면, 위와 같이 각각의 PM, VM Flavor 조합마다, VM 개수를 X축, **VM의 CPU 사용량을 Y축, 그리고 벤치마크 점수의 평균을 Z축으로 갖는 그래프**를 작성할 수 있습니다.

위 그래프는 테스트를 진행하기 전에, 전체적인 결과가 어떻게 나올지를 예상하며 작성한 그래프입니다. **더 많은 VM들이, 더 많은 CPU를 사용할수록, 제한된 CPU 리소스에 대한 경쟁이 증가하기 때문에 VM의 CPU 성능이 감소**할 것을 예상하였습니다.

확인하고자 하는 값이 무엇인지에 따라 테스트의 결과를 시각화하는 방법은 달라질 수 있지만, 이러한 테스트 결과를 통해 각 조건 별로 **VM의 CPU 성능이 기준치 이하로 저하되기 시작하는 지점** , 즉 **최적의 VM 집적도**를 도출할 수 있습니다.

## 3. VM 개수 증가에 따른 VM의 CPU 성능 변화

|                 |                SPR Silver 4410Y @ 2.00GHz (Vendor A)                |                SPR Silver 4410Y @ 2.00GHz (Vendor B)                |                    Cascade Silver 4214 @ 2.20GHz                    |
|-----------------|---------------------------------------------------------------------|---------------------------------------------------------------------|---------------------------------------------------------------------|
| 2 vCPU 4GB MEM  | ![](https://images.gogumang.com/71cb2acacb/06.png) | ![](https://images.gogumang.com/71cb2acacb/07.png) | ![](https://images.gogumang.com/71cb2acacb/08.png) |
| 4 vCPU 8GB MEM  | ![](https://images.gogumang.com/71cb2acacb/09.png) | ![](https://images.gogumang.com/71cb2acacb/10.png) | ![](https://images.gogumang.com/71cb2acacb/11.png) |
| 8 vCPU 16GB MEM | ![](https://images.gogumang.com/71cb2acacb/12.png) | ![](https://images.gogumang.com/71cb2acacb/13.png) | ![](https://images.gogumang.com/71cb2acacb/14.png) |

\< 전체 PM 스펙, VM Flavor 별 결과 \>

![2 vCPU 4GB MEM VM / SPR Silver 4410Y @ 2.00GHz PM (Vendor A)](https://images.gogumang.com/71cb2acacb/15.png)

![4 vCPU 8GB MEM VM / SPR Silver 4410Y @ 2.00GHz PM (Vendor A)](https://images.gogumang.com/71cb2acacb/16.png)

![8 vCPU 16GB MEM VM / SPR Silver 4410Y @ 2.00GHz PM (Vendor A)](https://images.gogumang.com/71cb2acacb/17.png)

![2 vCPU 4GB MEM VM / SPR Silver 4410Y @ 2.00GHz PM (Vendor B)](https://images.gogumang.com/71cb2acacb/18.png)

![4 vCPU 8GB MEM VM / SPR Silver 4410Y @ 2.00GHz PM (Vendor B)](https://images.gogumang.com/71cb2acacb/19.png)

![8 vCPU 16GB MEM VM / SPR Silver 4410Y @ 2.00GHz PM (Vendor B)](https://images.gogumang.com/71cb2acacb/20.png)

![2 vCPU 4GB MEM VM / Cascade Silver 4214 @ 2.20GHz PM](https://images.gogumang.com/71cb2acacb/21.png)

![4 vCPU 8GB MEM VM / Cascade Silver 4214 @ 2.20GHz PM](https://images.gogumang.com/71cb2acacb/22.png)

![8 vCPU 16GB MEM VM / Cascade Silver 4214 @ 2.20GHz PM](https://images.gogumang.com/71cb2acacb/23.png)

### 1) 자료 소개

**VM 개수 증가에 따른 VM의 CPU 성능 변화** 를 PM의 CPU 스펙, VM의 Flavor 및 VM의 CPU 사용량 별로 나타내고 있습니다. 이는 각 조건에 따른 **전반적인 VM의 CPU 성능 감소 형태를 파악**하는 것에 목적이 있습니다.

![](https://images.gogumang.com/71cb2acacb/24.png)

하나의 **PM CPU 스펙 + VM Flavor** 조합마다, 위 그림과 같이 **1개의 3D 그래프와 10개의 2D 그래프** 로 구성된 결과를 갖습니다. 앞서 말씀드렸던 바와 같이 테스트는 **각 조건 별로 여러 대의 VM에서 동시에 벤치마크 프로그램을 실행** 하는 방식으로 진행되었으며, 벤치마크 프로그램으로는 [CoreMark](https://github.com/eembc/coremark)를 사용하였습니다.

**Iterations/Sec** 은 각 VM에 대한 CoreMark 실행 결과의 평균값으로, **VM의 CPU 성능** 을 의미합니다. 이때 중요한 것은, **벤치마크 결과값 Iterations/Sec 그 자체에는 큰 의미가 없다** 는 것입니다. 예를 들어, VM의 CPU 사용량이 10% 일 때의 결과값이 CPU 사용량이 100% 일 때에 비해 낮다고 해서, 해당 VM의 성능이 실제로 떨어진 것은 아닙니다. 또한, VM이 1대이고 VM의 CPU 사용량이 100% 일 때의 결과값이 가장 높다고 해서 최적의 VM 집적도가 1이 되는 것도 아닙니다. **VM의 CPU 사용량에 제한을 걸어두고 벤치마크 프로그램을 실행시킨 결과**이기 때문에, 당연히 CPU 사용량 10% 일 때의 결과가 CPU 사용량 100% 일 때의 결과보다 낮을 수밖에 없습니다.

VM의 CPU 사용량을 제한한 이유는 앞서 말씀드렸듯이 **실제 운영 환경에서 모든 VM이 항상 CPU를 100% 사용하는 것이 아니기 때문** 입니다. 테스트의 목적은 실제 운영 환경에서 VM들이 평균 XX%의 CPU를 사용하고 있다고 했을 때, **서로의 성능에 영향을 미치지 않고 공존 가능한 최대 VM 개수** 를 확인하는 것이 목표였습니다. 이를 달성하기 위해, 가장 왼쪽의 VM이 1대일 때의 결과, 즉 **아무런 방해가 없는 상황에서 VM이 본래 보여야 할 성능을 기준치로 삼고, 해당 성능치를 유지한 상태로 PM에 VM을 얼마나 더 추가할 수 있는지를 확인**하고자 하였습니다.

#### 3D 그래프(전체적인 VM의 CPU 성능 변화 그래프)

![](https://images.gogumang.com/71cb2acacb/25.png)

**X축을 VM 개수, Y축을 VM의 CPU 사용량 그리고 Z축을 벤치마크 결과값** 으로 가지는 3D 그래프입니다. **VM 개수 및 VM CPU 사용량에 따라 VM의 CPU 성능이 어떻게 변하는지 전반적인 추이**를 파악할 수 있습니다.

#### 2D 그래프(VM의 CPU 사용량 별 VM의 CPU 성능 변화 그래프)

![](https://images.gogumang.com/71cb2acacb/26.png)

앞서 소개드린 3D 그래프를 VM의 CPU 사용량 10%, 20%, 30%, … 100% 각각에 대하여 단면으로 나타낸 결과입니다.

각각의 그래프들이 의미하는 것은 **VM의 CPU 사용량마다의 VM 개수 증가에 따른 VM 성능 변화** 입니다. 즉, 이 그래프를 통해 ‘**VM들의 평균 CPU 사용량이 XX%라고 했을 때, VM 몇 대부터 성능이 얼마나 감소하기 시작하는지**’를 알 수 있습니다.

VM의 CPU 성능이 얼마나 감소하였는지 파악하기 쉽도록, 가장 왼쪽의 **VM이 1대였을 때의 벤치마크 결과를 기준으로 성능 감소율을 구간 별로 색을 나누어 표시**하였습니다. 각 구간 별 성능 감소율 범위는 아래와 같습니다.

* 0 \~ 10%
* 10 \~ 20%
* 20 \~ 30%
* 30 \~ 40%
* 40 \~ 50%
* 50% \~

또한, 0 \~ 10%, 10 \~ 20% 및 20 \~ 30% 세 개의 구간에 대해서는 **각 구간 별로 가장 오른쪽에 해당되는 VM 개수에 추가적으로 표시** 를 해두었습니다. 이 표시는 VM의 CPU 성능 저하를 0 \~ 10%, 10 \~ 20% 및 20 \~ 30%까지 감수할 수 있다고 했을 때, **PM 한 대에서 최대로 수용 가능한 VM 개수**가 됩니다.

이외에도, **그래프의 기울기에 따라 색깔을 다르게 표시** 해 두어 **VM의 CPU 성능이 급격하게 감소하는 시점**을 보다 알기 쉽게 나타내었습니다(짙은 파란색에 가까울수록 급격한 성능 저하를 의미합니다).

### 2) VM의 CPU 성능 변화 형태 분석

![](https://images.gogumang.com/71cb2acacb/27.png)

3D 그래프의 경우, 테스트를 진행하기 전에 결과를 예상하며 그렸던 그래프와 유사한 결과를 얻을 수 있었으며, **더 많은 VM들이, 더 많은 CPU 리소스를 사용할수록, 제한된 PM의 CPU 리소스에 대한 경쟁이 증가** 하기 때문에 **벤치마크 결과치가 감소**하는 것을 확인할 수 있었습니다.

특히, PM의 CPU 리소스를 원하는 만큼 사용할 수 있을 정도로 **VM 개수가 적을 때는 CPU 사용량 제한을 높이면 그대로 벤치마크 결과치 향상** 으로 이어지지만, **VM 개수가 많을 때는 CPU 사용량 제한을 높여도 다른 VM과의 리소스 경쟁으로 인해 벤치마크 결과치가 증가하지 않을 것**이라는 예상이 일치하였습니다.

또한, **VM의 CPU 사용량이 적을 때는 PM의 CPU 리소스에 비교적 여유가 생기기 때문에 VM 개수를 늘려도 벤치마크 결과치가 크게 떨어지지 않을 것**이라는 예상과도 일치하는 결과를 나타냈습니다.

![](https://images.gogumang.com/71cb2acacb/28.png)

2D 그래프 역시 전반적으로 예상했던 바와 동일한 결과를 얻을 수 있었습니다.

전체 결과를 VM의 Flavor 관점에서 보면, VM의 Flavor가 고사양일수록(VM의 vCPU 수가 많을수록) 파란색/초록색/노란색 등 적은 성능 감소 구간의 색깔은 줄어들고, 빨간색이 늘어나는 것을 확인할 수 있습니다. 이는 **VM의 Flavor가 고사양일수록 적은 VM 개수에서도 큰 성능 감소가 발생**한다는 것을 의미합니다.

또한, VM의 CPU 사용량의 관점에서 각각의 PM CPU 스펙 + VM Flavor 조합 별 결과를 보면, VM의 CPU 사용량이 높아져도 파란색/초록색/노란색 등 적은 성능 감소 구간의 색깔은 줄어들고, 빨간색이 늘어나는 것을 확인할 수 있습니다. 이는 **VM의 CPU 사용량이 높을수록 적은 VM 개수에서도 큰 성능 감소가 발생**한다는 것을 의미합니다.

결과적으로 **VM의 Flavor가 저사양일수록, 그리고 VM의 CPU 사용량이 낮을수록, VM 개수를 늘려도 성능이 어느 정도 방어**되는 것을 확인할 수 있었습니다.

![예상하였던 VM의 CPU 성능 변화 형태](https://images.gogumang.com/71cb2acacb/29.png)

![실제 VM의 CPU 성능 변화 형태](https://images.gogumang.com/71cb2acacb/30.png)

지금까지의 내용과 같이, 전반적인 결과는 예상과 크게 다르지 않았습니다. 다만 세부적으로 예상과 다른 점들이 있었는데, VM의 CPU 사용량이 낮을 때와 높을 때, 두 경우를 나누어 그래프를 살펴보아야 합니다.

![4 vCPU 8GB MEM VM / SPR Silver 4410Y @ 2.00GHz PM (Vendor B) / CPU Usage 20% & 40%](https://images.gogumang.com/71cb2acacb/31.png)

우선 **낮은 VM CPU 사용량** 의 경우, VM의 CPU 사용량이 낮으면 성능 방어가 더 잘 이루어질 것이라는 예상과는 달리, **적은 VM 개수 구간부터 상당한 성능 감소**가 발생하였습니다.

물론 VM의 CPU 사용량이 높을 때에 비하면 성능 감소량은 낮지만, **PM의 CPU 리소스에 여유가 있는 상태에서도 다른 VM의 영향을 받아 성능 저하가 발생**하는 것을 확인할 수 있었습니다.

![4 vCPU 8GB MEM VM / SPR Silver 4410Y @ 2.00GHz PM (Vendor A) / CPU Usage 100%](https://images.gogumang.com/71cb2acacb/32.png)

**높은 VM CPU 사용량**의 경우, CPU 성능이 저하되기 시작하는 시점이 예상보다 빨랐습니다.

하이퍼스레드를 활성화시킨 상태라면, PM의 Thread(vCPU)가 포화되기 전까지는 VM 개수를 늘려도 성능이 어느 정도 유지될 것을 기대하였으나, **PM의 Core(pCPU)가 포화된 이후부터 상당한 성능 저하가 발생**하였습니다.

그리고 VM 개수가 늘어나면 늘어날수록 그에 비례하여 CPU 성능이 저하될 것이라는 예상과는 달리, **전체적으로는 VM의 CPU 사용량에 관계없이, 한번 성능이 감소하기 시작하면 급격하게 감소하다가, 어느 정도를 넘어서면 성능 감소가 둔해지는 모습** 을 보였습니다. 즉, 예상했던 것보다도 더 **1/N** (**N = VM 개수**)에 가까운 형태로 성능이 변화하는 모습을 확인할 수 있었습니다.

## 4. VM의 CPU 성능 감소에 영향을 미치는 요소

![VM의 CPU 사용량이 10% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/33.png)

![VM의 CPU 사용량이 20% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/34.png)

![VM의 CPU 사용량이 30% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/35.png)

![VM의 CPU 사용량이 40% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/36.png)

![VM의 CPU 사용량이 50% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/37.png)

![VM의 CPU 사용량이 60% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/38.png)

![VM의 CPU 사용량이 70% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/39.png)

![VM의 CPU 사용량이 80% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/40.png)

![VM의 CPU 사용량이 90% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/41.png)

![VM의 CPU 사용량이 100% 일 때, VM 개수 증가에 따른 VM CPU 성능 카운터 변화](https://images.gogumang.com/71cb2acacb/42.png)

### 1) 자료 소개

앞서 소개드린 **3. VM 개수 증가에 따른 VM의 CPU 성능 변화** 를 좀 더 상세히 분석하기 위한 자료입니다. VM의 CPU 사용량이 10%, 20%, 30%, … 100% 일 때 각각에 대한 **VM 개수 증가에 따른 VM의 CPU 성능 카운터(CPU Performance Counter)의 변화**를 나타냅니다.

VM 개수가 증가할 때, **내부적으로 어떤 변화가 발생하여 최종적으로 VM의 CPU 성능 감소로 이어지는지** , 그 원인을 파악하고자 별도의 테스트를 진행하였습니다. 테스트 방식 자체는 이전과 동일하나, **4 vCPU / 8GB MEM Flavor VM** 에 대해서만, [stress-ng](https://github.com/ColinIanKing/stress-ng)라는 벤치마크 프로그램을 사용하여 진행하였다는 점에서 차이가 있습니다. 이때 VM의 CPU 성능 카운터 값을 얻기 위해, stress-ng의 --perf 옵션을 사용하였습니다.

![stress-ng를 --perf 옵션을 사용하여 실행한 결과](https://images.gogumang.com/71cb2acacb/43.png)

stress-ng의 --perf 옵션을 사용하면, 위 그림과 같이 벤치마크 결과와 함께 CPU 성능 카운터 통계를 확인할 수 있습니다.

각 PM 별로 VM의 CPU 사용량을 바꿔가며 진행한 테스트 결과를 바탕으로 아래와 같이 최종 그래프를 구성하였습니다.

![](https://images.gogumang.com/71cb2acacb/44.png)

각 행은 하나의 PM에 대응되며, 각 열은 벤치마크 결과 및 VM의 CPU 성능 카운터 값을 나타냅니다.

**bogo ops** (**/sec** )는 N개의 VM에서 동시에 **stress-ng 벤치마크** (**cpu-method=all**)를 실행시킨 결과의 평균입니다.

이외에 \***로 시작하는 항목** 들은 실제 벤치마크 실행은 N개의 VM에서 동시에 이루어졌지만, 하나의 VM에서만 추출한 **샘플링된 VM의 CPU 성능 카운터 값** 입니다. VM의 CPU 성능 카운터 값을 수집하기 위해서는 [가상 CPU 성능 카운터(Virtual CPU Performance Counters) 활성화 설정](https://docs.vmware.com/en/VMware-vSphere/7.0/com.vmware.vsphere.vm_admin.doc/GUID-F920A3C7-3B42-4E78-8EA7-961E49AF479D.html)이 필요하나, 일괄 작업이 어려운 관계로 PM 스펙 별로 한 대씩의 VM에만 설정을 진행하였습니다.

주황색 점선은 **PM의 Core(pCPU) 수와 VM의 vCPU 수의 총합이 같아지는 VM 개수** (**24 ÷ 4 = 6** )를, 빨간색 점선은 **PM의 Thread(vCPU) 수와 VM의 vCPU 수의 총합이 같아지는 VM 개수** (**48 ÷ 4 = 12**)를 나타냅니다.

### 2) 그래프 분석

#### bogo ops(/sec) ≒ Instructions(G/sec)

![](https://images.gogumang.com/71cb2acacb/45.png)

* bogo ops(/sec) 그래프와 Instructions(G/sec) 그래프는 서로 비슷한 개형을 가지고 있습니다.
* 벤치마크의 결과인 VM의 CPU 성능은 Instructions(G/sec) 값을 그대로 따라간다는 것을 알 수 있습니다.
* Instructions(G/sec) 그래프가 bogo ops(/sec) 그래프에 비해 불안정한 모습을 보이는 이유는, N개의 VM들에 대해 평균값을 낸 bogo ops(/sec)과 달리, 한 대의 VM에서만 추출된 샘플링 결과이기 때문입니다.

#### Instructions(G/sec) = CPU Cycles(G/sec) × Instructions(/cycle)

![](https://images.gogumang.com/71cb2acacb/46.png)

* Instructions(G/sec)는 CPU Cycles(G/sec)과 Instructions(/cycle)의 곱으로 나타낼 수 있습니다.
* 즉, CPU Cycles(G/sec)이 그대로여도 Instructions(/cycle)이 감소하거나, 반대로 Instructions(/cycle)이 그대로여도 CPU Cycles(G/sec)이 감소하면 Instructions(G/sec)은 감소합니다.

#### CPU Cycles(/sec)과 Instructions(/cycle) 사이의 관계

![](https://images.gogumang.com/71cb2acacb/47.png)

* Instructions(/cycle)과 CPU Cycles(/sec)이 동시에 감소하는 경우는 없으며, Instructions(/cycle) 감소가 멈추기 시작하면 CPU Cycles(/sec) 감소가 시작됩니다.

#### CPU Cycles(G/sec)

![](https://images.gogumang.com/71cb2acacb/48.png)

* CPU Cycles(G/sec)은 VM의 각 vCPU들에 대한 초당 Cycle 수의 총합을 의미합니다(이 경우 4 vCPU이므로 vCPU 당 Cycle 수는 4로 나누어 계산할 수 있습니다).
* CPU Cycles(G/sec)은 적어도 VM의 vCPU 수의 총합이 PM의 Thread(vCPU) 수와 같아지기 전까지(빨간색 점선 전까지)는 감소하지 않는 경향을 보입니다.
* VM의 CPU 사용량이 낮을수록, VM의 vCPU 수의 총합이 PM의 Thread(vCPU) 수를 넘어선 이후에도 CPU Cycles(G/sec)가 유지되는 경향을 보이는데, 이는 VM의 CPU 사용량이 낮으면 그만큼 PM의 CPU 리소스에 여유가 생기기 때문이라고 볼 수 있습니다.
* 즉, CPU Cycles(G/sec)가 감소하기 시작한다는 것은 PM의 CPU 리소스가 포화되었음을 의미하며, 해당 시점 이후로는 CPU Cycles(G/sec)이 Instructions(G/sec) (≒ bogo ops(/sec)) 감소의 원인이라고 할 수 있습니다.

#### Instructions(/cycle)

![](https://images.gogumang.com/71cb2acacb/49.png)

* Instructions(/cycle)은 VM의 각 vCPU들에 대한 한 CPU Cycle 당 실행된 Instruction 개수의 총합을 의미합니다.
* Instructions(/cycle)은 초반에는 VM 개수 증가에 따라 지속적으로 감소하다가, 어느 시점부터 수렴하는 모습을 보입니다.
* 해당 시점은 CPU Cycles(G/sec)가 감소하기 시작하는 시점과 동일하며, 이는 PM의 CPU 리소스가 포화되기 전까지 Instructions(/cycle)가 감소한다는 것을 의미합니다.
* 실제로 VM의 CPU 사용량이 낮을수록, VM의 vCPU 수의 총합이 PM의 Thread(vCPU) 수를 넘어선 이후, 즉 빨간색 점선을 넘어선 이후에도 Instructions(/cycle)가 추가로 감소하는 경향을 보입니다.
* CPU Cycles(G/sec)은 PM의 CPU 리소스가 포화되기 전까지 감소하지 않기 때문에, PM의 CPU 리소스가 포화되기 전에 발생하는 Instructions(G/sec=) (≒ bogo ops(/sec)) 감소의 원인은 Instructions(/cycle)이라고 할 수 있습니다.

#### Cache Misses(%)

![](https://images.gogumang.com/71cb2acacb/50.png)

* VM의 가상 CPU 성능 카운터 값이기 때문에 실제 PM의 CPU Cache와 어떻게 연결되는지 설명하기 어려운 부분이 있지만, VM의 전반적인 Cache Miss 발생률(%)을 나타냅니다(Cache Miss / Cache References).
* Cache Misses(%)는 VM의 CPU 사용량에 상관없이, 초반에는 VM 개수 증가에 따라 함께 큰 폭으로 증가하다가 VM의 vCPU 수의 총합이 PM의 Thread(vCPU) 수를 넘어선 이후, 즉 빨간색 점선 이후부터는 증가를 멈추거나, 매우 작은 폭으로 천천히 증가하는 경향을 보입니다.

#### Instructions(/cycle)과 Cache Misses(%) 사이의 관계

![](https://images.gogumang.com/71cb2acacb/51.png)

* Instructions(/cycle)은 Cache Misses(%)와 반비례하는 경향을 보입니다.
* Cache Misses(%)가 증가하면 Instructions(/cycle)는 감소하고, 반대로 Cache Misses(%)가 감소하면 Instructions(/cycle)는 증가합니다.
* Cache Misses(%) 이외에도 Instructions(/cycle)에 영향을 미치는 요소가 존재하기 때문에 그래프 개형이 완벽하게 일치하지는 않습니다.
* 하지만 Cache Misses(%)에 눈에 띄는 변화가 있다면 대체로 Instructions(/cycle)에서도 대응되는 변화를 찾아볼 수 있으며, 이를 통해 Cache Misses(%)가 Instructions(/cycle)에 중요하게 작용하고 있는 것을 알 수 있습니다.

#### Branch Misses(%)

![](https://images.gogumang.com/71cb2acacb/52.png)

* Branch Misses(%) 지표도 확인은 해보았으나 CPU 스펙, VM CPU 사용량 및 VM 개수 등의 조건에 관계없이 1.8% 정도가 일정하게 유지되고 있었습니다.
* VM 개수 증가에 따른 변화가 미미하고 PM의 CPU 스펙 간 차이가 거의 없다 보니, 이번 테스트에서는 큰 의미를 갖지 못하는 지표로 판단하여 결과 그래프에서 제외하였습니다.

### 3) VM 개수가 증가할 때 VM의 CPU 성능이 감소하는 원인

#### Instructions(/cycle)의 감소

![](https://images.gogumang.com/71cb2acacb/53.png)

* CPU Cycles(/sec)에는 변동이 없고, Instructions(/cycle)이 감소하는 구간입니다.
* VM의 CPU 사용량이 낮을수록 Instructions(/cycle) 감소가 멈추는 시점, 같은 의미로는 CPU Cycles(/sec)가 감소하기 시작하는 시점이 늦어집니다.
* 이 구간에서는 VM 개수가 증가함에 따라 Instructions(/cycle)의 감소로 인해 VM의 CPU 성능이 감소합니다.
* Instructions(/cycle) 감소의 원인 중 하나로 Cache Misses(%) 증가가 있습니다.
* Cache Misses(%)는 VM의 CPU 사용량에 상관없이, 초반에는 VM 개수 증가에 따라 함께 큰 폭으로 증가하다가, VM의 vCPU 수의 총합이 PM의 Thread(vCPU) 수를 넘어선 이후부터는 거의 증가하지 않습니다.

#### CPU Cycles(/sec)의 감소

![](https://images.gogumang.com/71cb2acacb/54.png)

* Instructions(/cycle)의 감소가 멈추고, CPU Cycles(/sec)가 감소하는 구간입니다.
* VM의 CPU 사용량이 높을수록 Instructions(/cycle) 감소가 멈추는 시점, 같은 의미로는 CPU Cycles(/sec)가 감소하기 시작하는 시점이 빨라집니다.
* 이 구간에서는 VM 개수가 증가함에 따라 CPU Cycles(/sec)의 감소로 인해 VM의 CPU 성능이 감소합니다.
* Cache Misses(%)의 경우, VM의 vCPU 수의 총합이 PM의 Thread(vCPU) 수를 넘어선 이후부터는 거의 증가하지 않기 때문에, Instructions(/cycle) 감소의 원인은 Cache Misses(%)라고 보기 어렵습니다.

### 4) Turbo Boost 모드 활성화 여부에 따른 성능 차이

![](https://images.gogumang.com/71cb2acacb/55.png)

* Intel CPU에서 지원하는 기능인 Turbo Boost 모드를 활성화시킨 경우, 그렇지 않은 경우에 비해 CPU Cycles(/sec)이 약 35% 정도 증가하고, Instructinos(/cycle)은 약 8% 정도 감소하는 경향이 있습니다.
* Instructinos(/cycle)이 약간 감소하기는 하지만, CPU Cycles(/sec)이 대폭 증가하며 최종적으로 VM의 CPU의 성능이 향상됩니다.

### 5) PM의 CPU 스펙 차이에 의한 성능 감소율 차이

![](https://images.gogumang.com/71cb2acacb/56.png)

* CPU Cycles(/sec)의 경우, Cascade가 Sapphire Rapids에 비해 높은 값으로 시작하지만, VM 개수가 충분히 증가한 이후에는 Cascade와 Sapphire Rapids가 비슷한 값을 가집니다.
* Instructions(/cycle)의 경우, Cascade와 Sapphire Rapids가 비슷한 값으로 시작하지만, VM 개수가 충분히 증가한 이후에는 Sapphire Rapids가 Cascade에 비해 10% 높은 값을 가집니다.
* 결과적으로, Cascade가 Sapphire Rapids에 비해 큰 성능 감소율을 보이며, 이는 이번 테스트에서 Cascade CPU PM에 대한 최적의 VM 집적도 결과에 부정적인 영향을 미칠 수 있음을 의미합니다.
* 하지만 PM의 CPU 스펙 별 벤치마크 결과는 벤치마크 프로그램의 연산 특성에 따라 달라질 수 있기 때문에, CPU 스펙이 다른 두 PM을 절대적인 수치를 기준으로 비교하기에는 적절하지 않습니다.

### 6) Vendor 간 Cache Misses(%) 차이

![](https://images.gogumang.com/71cb2acacb/57.png)

* Vendor B 장비에 비해 Vendor A 장비에서 안정적인 Cache Misses(%) 추이를 보입니다.
* Vendor B 장비에서는 Cache Misses(%)의 변화 폭이 크고, 최대 60%까지 증가하는 것을 확인할 수 있습니다.
* 반면 Vendor A 장비에서는 Cache Misses(%)의 변화 폭이 작고, 최대 40%까지 증가하는 것을 확인할 수 있습니다.
* 이는 동일한 CPU 모델을 사용하는 PM이더라도, Vendor에 따라서 전체적인 장비 구성 차이에 의한 성능 차이가 발생할 수 있다는 것을 의미합니다.

## 5. 최적의 VM 집적도

![VM의 CPU 성능 감소를 10%까지 감안하였을 때 최대 수용 가능한 VM 개수](https://images.gogumang.com/71cb2acacb/58.png)

![VM의 CPU 성능 감소를 20%까지 감안하였을 때 최대 수용 가능한 VM 개수](https://images.gogumang.com/71cb2acacb/59.png)

![VM의 CPU 성능 감소를 30%까지 감안하였을 때 최대 수용 가능한 VM 개수](https://images.gogumang.com/71cb2acacb/60.png)

### 1) 자료 소개

![](https://images.gogumang.com/71cb2acacb/61.png)

앞서 소개드린 **3. VM 개수 증가에 따른 VM의 CPU 성능 변화** 그래프에서의 **VM의 CPU 성능 감소 구간 별 최대 VM 개수** 마커들을 그대로 표로 옮긴 결과입니다.

VM의 CPU 성능 감소율 0 \~ 10%, 10 \~ 20% 및 20 \~ 30% 구간 별로 각각의 PM 스펙, VM의 Flavor, 및 VM의 CPU 사용량 조건에 대한 최대 수용 가능 VM 개수, 즉 **CPU 관점의 최적의 VM 집적도**를 나타냅니다.

각각의 VM CPU 사용량, VM Flavor 케이스마다, PM 스펙 별로 최대값, 중앙값 및 최소값에 따라 색깔을 다르게 표현해 두었습니다(짙을수록 더 많은 VM을 수용할 수 있다는 의미입니다).

이를 바탕으로 **어느 정도의 VM CPU 성능 저하를 감안할 수 있다고 하였을 때, PM 1대 당 수용 가능한 최대 VM 개수**를 알 수 있습니다.

### 2) 실제 운영 환경을 고려한 최적의 VM 집적도

이 결과를 바탕으로, 실제 운영 환경에서 PM의 CPU 스펙, VM의 Flavor, VM의 CPU 사용량을 알고 있을 때, **PM 1대에 몇 대의 VM을 수용시킬 것인지를 설계**할 수 있습니다.

![](https://images.gogumang.com/71cb2acacb/62.png)

예를 들어, **Cascade Silver 4214 @ 2.20GHz** CPU 스펙의 PM에 **4 vCPU 8GB MEM Flavor** 의 VM을 운영 중인 환경에서, **VM들의 평균 CPU 사용량이 40** %이고 **VM의 CPU 성능 감소를 최대 20%까지 감수** 할 수 있다고 했을 때, **PM 1대 당 VM을 21대** 정도로 운영하는 것을 고려해볼 수 있습니다.

다만 CPU 관점에서만 이루어진 테스트이기 때문에, 어디까지나 **PM의 메모리, 디스크 스펙에는 부족함이 없다는 전제 하에 도출된 결과**라는 것을 인지하고 있어야 합니다.

## 6. 마치며

지금까지 **효율적인 VMWare 인프라 운영을 위한 CPU 관점의 VM 집적도 테스트**를 수행한 방법과, 그 결과를 소개드렸습니다.

사실 최적의 VM 집적도라는 것은 CPU 이외에도 메모리와 디스크 등 다양한 시스템 구성 요소들을 고려해야 하며, 운영 환경 및 서비스의 요구 사항과 같은 상황에 따른 변수가 많기 때문에, 직접 인프라를 운영해 보며 최적 값을 찾아나가는 수밖에 없습니다.

또한, 이번 테스트에 사용된 PM의 CPU 스펙, VM의 Flavor 및 벤치마크 프로그램은 실제 환경을 시뮬레이션할 수 있는 범위가 극히 한정적입니다. 나아가 실제 운영 환경에서는 부하 급증에 대비하기 위한 여유 리소스 확보 등 여러 가지 현실적인 요소들도 고려해야 하기 때문에, 이번 테스트에서 도출한 최적의 VM 집적도 값 그 자체는 큰 의미를 가지지 못합니다.

**하지만 ‘PM의 리소스는 제한되어 있기 때문에, VM 개수가 증가하면 VM의 성능은 저하된다’라는 당연하면서도 막연한 사실에 대해 ‘어떻게?’, ‘얼마나?’, 그리고 ‘왜?’에 대한 통찰력을 줄 수 있다는 것에 충분한 의미가 있다고 생각합니다.** 나아가 이번 글에서 소개드린 VM 집적도 테스트 방법을 CPU 뿐만이 아니라 메모리 및 디스크 등에도 적용하여 다양한 조건으로 테스트를 진행한다면, 보다 의미 있는 VM 집적도를 도출할 수 있을 것이라고 기대합니다.

지금까지의 내용이 많은 분들께 도움이 되기를 바라며 이 글을 마치겠습니다.

긴 글 읽어주셔서 감사합니다.

*** ** * ** ***

Written by `Sky.q`

Edited by `June.6`