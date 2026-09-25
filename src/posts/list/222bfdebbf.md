---
title: "경계가 만든 길, Load Balancer(DSR)"
url: "https://meetup.nhncloud.com/posts/418"
blogName: "NHN"
blogKey: "meetup-nhncloud-com"
blogHomepage: "https://meetup.nhncloud.com"
publishedAt: "2026-07-20T02:12:54Z"
sourceThumbnail: "https://images.gogumang.com/222bfdebbf.png"
tags: []
---

기존의 프록시 방식 로드 밸런서(LB)는 클라이언트와 서버 사이에서 양쪽 연결을 모두 종단하고 데이터를 중계하는 구조입니다. 요청과 응답이 모두 LB를 경유하기 때문에, 응답 트래픽이 클수록 LB가 병목이 됩니다. 1KB 요청에 100MB 응답이 나가는 워크로드라면 응답이 LB 대역폭 대부분을 소모합니다. 접속자가 늘수록 LB 처리량이 선형으로 증가하고, 백엔드 서버를 늘려도 LB 자체가 처리량의 상한이 됩니다. L7 라우팅이나 SSL 종단이 필요한 표준 웹 서비스에서는 프록시 방식이 적합합니다. 하지만 응답 트래픽이 크거나 낮은…
