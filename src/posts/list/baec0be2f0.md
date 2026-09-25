---
title: "MySQL 3분 vs ClickHouse 0.3초 — 같은 쿼리입니다"
url: "https://meetup.nhncloud.com/posts/414"
blogName: "NHN"
blogKey: "meetup-nhncloud-com"
blogHomepage: "https://meetup.nhncloud.com"
publishedAt: "2026-05-11T00:12:36Z"
sourceThumbnail: "https://images.gogumang.com/baec0be2f0.png"
tags: []
---

들어가며 최근 MySQL 기반 서비스들로부터 ClickHouse 도입 문의를 받으면서 직접 검토하고 도입하게 되었습니다. 실제 운영 중인 서비스에 적용하며 성능을 확인할 수 있었고, 기술과 경험을 공유하고자 글을 작성했습니다. ClickHouse란? ClickHouse는 데이터를 빠르게 읽기 위해 만들어진 데이터베이스입니다. MySQL은 행(Row) 단위로 데이터를 저장하고, ClickHouse는 열(Column) 단위로 데이터를 저장합니다. 행 단위 DBMS는 데이터를 블록 단위로 저장하고 읽기 때문에 일부 열만 필요한 쿼리라도…
