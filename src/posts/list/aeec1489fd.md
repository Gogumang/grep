---
title: "양자 시대를 대비하는 개발자의 암호학 가이드(PQC-ML-KEM)"
url: "https://meetup.nhncloud.com/posts/421"
blogName: "NHN"
blogKey: "meetup-nhncloud-com"
blogHomepage: "https://meetup.nhncloud.com"
publishedAt: "2026-08-24T03:54:26Z"
sourceThumbnail: "https://images.gogumang.com/aeec1489fd.png"
tags: []
---

들어가며 현재 웹 통신의 대부분은 HTTPS 프로토콜을 사용하고 있습니다. HTTPS는 TLS(Transport Layer Security) 위에서 동작하며, 주로 RSA나 ECDH 알고리즘으로 키를 교환하고 AES로 데이터를 암호화합니다. 과거 HTTP 시절에는 데이터가 평문으로 전송됐지만, 지금은 중간에서 패킷을 가로채더라도 내용을 알 수 없습니다. 도청은 사실상 불가능하다고 알려져 있습니다. 그런데 지금 이 순간에도 누군가는 이 복호화할 수 없는 암호화된 트래픽을 수집하고 있습니다. 왜 못 푸는 데이터를 모을까요? > "Har…
