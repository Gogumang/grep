---
title: "사내 DB 관리 규정을 AI로 적용하다 : Amazon Bedrock 기반 DBA 리뷰봇 개발기"
url: "https://techblog.yogiyo.co.kr/%EC%82%AC%EB%82%B4-db-%EA%B4%80%EB%A6%AC-%EA%B7%9C%EC%A0%95%EC%9D%84-ai%EB%A1%9C-%EC%A0%81%EC%9A%A9%ED%95%98%EB%8B%A4-amazon-bedrock-%EA%B8%B0%EB%B0%98-dba-%EB%A6%AC%EB%B7%B0%EB%B4%87-%EA%B0%9C%EB%B0%9C%EA%B8%B0-f845508e6055?source=rss----c1b33ccbbc42---4"
blogName: "요기요"
blogKey: "techblog-yogiyo-co-kr"
blogHomepage: "https://techblog.yogiyo.co.kr"
publishedAt: "2025-12-31T01:17:58Z"
sourceThumbnail: "https://cdn-images-1.medium.com/max/1024/1*1XmQ86I4O81_2iFTP6JaSQ.png"
tags: ["post", "yogiyo", "search-engines", "tech", "dba"]
---

사내 DB 관리 규정을 AI로 적용하다 : Amazon Bedrock 기반 DBA 리뷰봇 개발기 DDL 관리는 어떻게 하고 계신가요? 마이크로서비스 환경에서 DB 스키마 변경은 빈번하게 발생합니다. 문제는 단일 DDL이 아니라, 여러 DDL이 한 요청에 섞여 들어오거나 CDC·Replication과 같은 복제 구조가 함께 고려되어야 하는 복잡도가 높은 작업에서 발생합니다. 이러한 요청을 리뷰하는 DBA의 부담은 요청 수와 복잡도에 비례해 빠르게 커집니다. 요기요에서는 이러한 스키마 변경을 내부 관리 포털인 DBportal(요기요의…
