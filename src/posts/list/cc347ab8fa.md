---
title: "99%가 모른다는 DB Connection 누수 문제"
url: "https://helloworld.kurly.com/blog/connection-leak/"
blogName: "컬리"
blogKey: "helloworld-kurly-com"
blogHomepage: "https://helloworld.kurly.com"
publishedAt: "2025-01-05T15:00:00Z"
sourceThumbnail: "https://helloworld.kurly.com/_astro/connection-leak.DRjYbKfR.png"
tags: []
---

DB Connection과 Garbage Collector의 관계를 중심으로 mysql-connector-j 사용 시 발생할 수 있는 메모리 누수를 탐지하고 해결한 경험을 공유합니다.
