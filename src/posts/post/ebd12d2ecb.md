안녕하세요. 인프랩 DevOps Engineer 선비입니다!

오늘은 Docker를 다루며 발견하게 된 Alpine 기반 이미지의 cp 명령과 Debian 또는 Ubuntu 기반 이미지의 cp 명령의 동작 차이점을 소개해드리겠습니다.

## Docker Image

Docker에서는 Image를 이용하여 Container를 생성할 수 있습니다.

Docker Image는 Layer로 이루어져 있으며 Base Image에 명령을 수행하거나 외부에서 파일을 복사하는 등의 과정을 통해 Layer를 추가함으로써 새로운 Image를 빌드할 수 있습니다.

빌드에 사용된 Dockerfile을 열어보거나, node:gallium-alpine 처럼 제작자가 붙인 Tag를 참고하거나, 직접 실행하여 설치된 패키지 관리자가 무엇인지 등의 특성을 살펴보면 빌드된 이미지의 Base Image로 어떤 이미지가 사용되었는지 유추할 수 있습니다.

매우 적은 용량의 이점을 갖는 Alpine 이미지와 범용적인 Debian 및 Ubuntu 이미지가 Base Image로 많이 사용되고 있습니다.

이 글에서는 Alpine 기반의 이미지를 사용하던 중 호환성 문제를 해결하기 위하여 Debian 기반으로 이전하는 과정에서 발견한 유의사항을 말씀드리겠습니다.

## Alpine

alpine:latest, node:alpine 과 같은 Alpine 기반 Docker Image에서 아래 명령을 수행해봅시다.

```sh
echo 1 > a
echo 2 > b
ln -s a c
cat a b c
```

결과는 아래와 같을 것입니다.

```plain
1
2
1
```

그 다음 아래 명령으로 cp 명령의 동작을 확인해봅시다.

```sh
cp b c
cat a b c
```

결과는 아래와 같습니다.

```plain
1
2
2
```

확인해보면 생성하였던 심볼릭 링크는 제거되었으며 파일 b가 c라는 이름으로 복사되었음을 알 수 있습니다.

## Debian 또는 Ubuntu

debian:latest, ubuntu:latest, node:latest 와 같은 Debian 또는 Ubuntu 기반 Docker Image에서 같은 명령을 수행해봅시다.

```sh
echo 1 > a
echo 2 > b
ln -s a c
cat a b c
```

결과는 아래와 같을 것입니다.

```plain
1
2
1
```

그 다음 아래 명령으로 cp 명령의 동작을 확인해봅시다.

```sh
cp b c
cat a b c
```

결과는 아래와 같습니다.

```plain
2
2
2
```

놀랍게도 심볼릭 링크가 삭제되지 않았고 파일 b의 내용만이 심볼릭 링크 c에 복사되어 결국 파일 a의 내용이 변경되었음을 알 수 있습니다.

만약 Alpine 이미지에서와 같은 결과를 얻고 싶다면 `cp b c` 명령을 실행하기 전에 `rm c` 명령을 수행하여 **심볼릭 링크를 명시적으로 삭제**해주어야 합니다.

만약 두 이미지 사이를 넘나드는 마이그레이션 작업을 수행한다면 이러한 차이점을 인지하고 적절히 명령을 수정해주어야 합니다.

## 마무리

해당 현상을 발견한 후 팀원들께 공유드렸는데요, 백엔드 개발자이신 인트의 도움으로 cp 명령에 alias가 걸려있는 것이 아닌지 확인해보았는데 alias는 걸려 있지 않았습니다.

검색으로도 별다른 정보를 얻을 수 없었는데 혹시 이 현상의 원인에 대해 알고 계신 분께서는 댓글로 알려주시면 정말 감사드리겠습니다!

감사합니다.