# 수집 대상 블로그

collector가 이 파일의 표를 읽어 RSS/Atom 피드를 수집한다.
행을 추가하거나 지우면 다음 수집부터 바로 반영된다 — 코드는 건드리지 않아도 된다.

표의 열은 순서가 고정이다: **블로그 이름 | 피드 주소 | 홈페이지 주소**.
홈페이지 주소는 비워둬도 되고, 비우면 피드 주소의 도메인을 대신 쓴다.

| 블로그 이름 | 피드 주소 | 홈페이지 주소 |
| --- | --- | --- |
| 카카오 | https://tech.kakao.com/feed/ | https://tech.kakao.com |
| 네이버 D2 | https://d2.naver.com/d2.atom | https://d2.naver.com |
| 라인 | https://techblog.lycorp.co.jp/ko/feed/index.xml | https://techblog.lycorp.co.jp/ko |
| 우아한형제들 | https://techblog.woowahan.com/feed/ | https://techblog.woowahan.com |
| 토스 | https://toss.tech/rss.xml | https://toss.tech |
| 당근 | https://medium.com/feed/daangn | https://medium.com/daangn |
| 쿠팡 | https://medium.com/feed/coupang-engineering | https://medium.com/coupang-engineering |
| 무신사 | https://medium.com/feed/musinsa-tech | https://medium.com/musinsa-tech |
| 야놀자 | https://medium.com/feed/yanolja | https://medium.com/yanolja |
| 데브시스터즈 | https://tech.devsisters.com/rss.xml | https://tech.devsisters.com |
| 뱅크샐러드 | https://blog.banksalad.com/rss.xml | https://blog.banksalad.com |
| 하이퍼커넥트 | https://hyperconnect.github.io/feed.xml | https://hyperconnect.github.io |
| 컬리 | https://helloworld.kurly.com/rss.xml | https://helloworld.kurly.com |
| 요기요 | https://techblog.yogiyo.co.kr/feed | https://techblog.yogiyo.co.kr |
| 스포카 | https://spoqa.github.io/rss | https://spoqa.github.io |
| 강남언니 | https://blog.gangnamunni.com/feed.xml | https://blog.gangnamunni.com |
| 인프랩 | https://tech.inflab.com/rss.xml | https://tech.inflab.com |
| 원티드 | https://medium.com/feed/wantedjobs | https://medium.com/wantedjobs |
| 직방 | https://medium.com/feed/zigbang | https://medium.com/zigbang |
| 왓챠 | https://medium.com/feed/watcha | https://medium.com/watcha |
| 29CM | https://medium.com/feed/29cm | https://medium.com/29cm |
| 여기어때 | https://techblog.gccompany.co.kr/feed | https://techblog.gccompany.co.kr |
| NHN | https://meetup.nhncloud.com/rss | https://meetup.nhncloud.com |
| 데이블 | https://teamdable.github.io/techblog/feed.xml | https://teamdable.github.io/techblog |
| SK 데보션 | https://devocean.sk.com/blog/rss.do | https://devocean.sk.com |
| 카카오엔터프라이즈 | https://tech.kakaoenterprise.com/feed | https://tech.kakaoenterprise.com |

## 뺀 블로그

- **리디** (`https://ridicorp.com/feed/`) — 서버가 봇 요청을 403으로 막는다. 브라우저 UA로도 열리지 않아 제외.
- **카카오페이** (`https://tech.kakaopay.com/rss`) — 피드는 200으로 열리지만 항목이 하나도 없다. 저쪽이 채우면 다시 넣으면 된다.
- **라인 엔지니어링** (`https://engineering.linecorp.com/ko/feed`) — techblog.lycorp.co.jp로 넘어가서 '라인'과 원문 주소가 100% 겹친다. 중복이라 제외.
- **쏘카·오늘의집·11번가** — 알려진 피드 주소가 모두 404. 정확한 주소를 알면 추가할 것.
