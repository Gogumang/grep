# 채용 공고 수집 대상

`bun run jobs`(`scripts/fetchJobs.ts`)가 이 표를 읽어 각 회사 채용 사이트에서 **개발 직군** 공고를 모으고
`src/jobs/jobs.json`에 쓴다. GitHub Actions(`.github/workflows/jobs.yml`)가 매일 한국 시간 06시에 돌리고,
공고가 바뀌었으면 커밋한다 — 커밋이 곧 배포다.

공고 본문은 `src/jobs/body/{id}.md`(마크다운)에 따로 쓴다. 채용 사이트가 준 HTML은 마크다운으로 바꿔 저장하고
이미지는 옮기지 않는다. 본문을 못 받은 공고도 목록에는 남고, 공고 페이지가 원문으로 안내한다.
목록에서 사라진 공고의 본문 파일은 수집할 때 함께 지운다.

표의 열은 순서가 고정이다: **회사 이름 | 소스 | 수집**.
수집 칸이 `비활성`이면 뺀다. 잠시 멈출 회사는 행을 지우지 말고 이 칸을 `비활성`으로 둔다.

한 소스가 실패하거나 0건을 돌려주면 그 회사는 **이전 공고를 그대로 둔다**. 일시 장애로 목록이 통째로
비는 것을 막으려는 것이다. 모든 소스가 실패하면 파일을 건드리지 않고 실패로 끝난다.

소스 종류 (새 종류는 `scripts/jobs/sources.ts`에 파서를 더해야 한다):

- `kakao` — careers.kakao.com의 테크 직군. 카카오페이·카카오모빌리티 등 계열사 공고가 함께 온다.
- `naver` — recruit.navercorp.com에서 분류가 `Tech`인 공고. 네이버웹툰·네이버클라우드 등 계열사 포함.
- `woowahan` — career.woowahan.com. 직군 이름을 주지 않아 제목으로 개발 직군을 가른다.
- `toss` — 토스 채용 API. 커리어 페이지의 Job Category가 개발 직군인 것만. 토스뱅크·토스증권 등 계열사 포함.
- `greenhouse:보드이름` — Greenhouse 공개 채용 API를 쓰는 회사. `Engineer`·`Division` 값이 있으면 그것으로,
  없으면 제목으로 개발 직군을 가르고, 한국 근무지 공고만 남긴다.

| 회사 이름 | 소스 | 수집 |
| --- | --- | --- |
| 카카오 | kakao | |
| 네이버 | naver | |
| 우아한형제들 | woowahan | |
| 토스 | toss | |
| 당근 | greenhouse:daangn | |
| 쿠팡 | greenhouse:coupang | |
