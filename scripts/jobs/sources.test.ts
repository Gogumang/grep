import { describe, expect, test } from 'bun:test'
import {
  isEngineeringTitle,
  parseGreenhouseJobs,
  parseKakaoPage,
  parseNaverDetailPage,
  parseNaverPage,
  parseTossJobs,
  parseWoowahanDetail,
  parseWoowahanPage,
} from './sources'

const context = { group: '테스트회사' }

describe('parseKakaoPage', () => {
  test('닫힌·비공개 공고는 빼고 한국 시각에 시간대를 붙인다', () => {
    // Arrange
    const payload = {
      totalPage: 3,
      jobList: [
        {
          realId: 'S-4754',
          jobOfferTitle: '[공동체] 카카오페이 프로덕트 엔지니어',
          companyName: '카카오페이',
          jobTypeName: '테크',
          closeFlag: false,
          privateFlag: false,
          endDate: '2026-09-14T00:00:00',
          regDate: '2026-09-11T18:12:38',
        },
        { realId: 'S-1', jobOfferTitle: '닫힌 공고', closeFlag: true, privateFlag: false },
        { realId: 'S-2', jobOfferTitle: '비공개 공고', closeFlag: false, privateFlag: true },
      ],
    }

    // Act
    const { jobs, pageCount } = parseKakaoPage(payload, context)

    // Assert
    expect(pageCount).toBe(3)
    expect(jobs.map((collected) => collected.job.title)).toEqual(['[공동체] 카카오페이 프로덕트 엔지니어'])
    expect(jobs[0]?.job).toMatchObject({
      url: 'https://careers.kakao.com/jobs/S-4754',
      group: '테스트회사',
      company: '카카오페이',
      jobGroup: '테크',
      deadline: '2026-09-14T00:00:00+09:00',
      postedAt: '2026-09-11T18:12:38+09:00',
    })
  })

  test('introduction의 <br/>를 줄바꿈으로, ◆ 줄을 제목으로 바꾸고 "-"로 채운 칸은 버린다', () => {
    // Arrange — 카카오 자유 양식 공고 모양. 끝의 글자는 폭 없는 공백(U+200B)이다.
    const payload = {
      totalPage: 1,
      jobList: [
        {
          realId: 'S-4754',
          jobOfferTitle: '프로덕트 엔지니어',
          introduction: '◆ 조직소개<br/>우리 조직은 **플랫폼**을 만듭니다.<br/>​',
          workContentDesc: '-',
          qualification: '-',
        },
      ],
    }

    // Act
    const { jobs } = parseKakaoPage(payload, context)

    // Assert
    // 홑줄바꿈은 끝 공백 두 칸의 강제 줄바꿈이 된다 — 그냥 두면 화면에서 한 문단으로 뭉친다
    expect(jobs[0]?.body).toBe('### 조직소개  \n우리 조직은 **플랫폼**을 만듭니다.')
    expect(jobs[0]?.detailUrl).toBeNull()
  })

  test('jobList가 없는 응답은 빈 목록이 아니라 실패로 던진다', () => {
    expect(() => parseKakaoPage({ message: '점검 중' }, context)).toThrow('jobList')
  })
})

describe('parseNaverPage', () => {
  test('Tech 분류만 남기고 전체 건수를 쪽 수로 바꾸며, 본문은 상세 페이지에서 받도록 주소를 남긴다', () => {
    // Arrange
    const payload = {
      result: 'Y',
      totalSize: 45,
      list: [
        {
          annoId: 30005289,
          annoSubject: '[NAVER] 보안 부문 경력 채용',
          sysCompanyCdNm: 'NAVER',
          classCdNm: 'Tech',
          subJobCdNm: 'Security Analysis',
          entTypeCdNm: '경력',
          staYmdTime: '2026.09.11 10:00:00',
          endYmdTime: '2026.09.29 10:00:00',
          jobDetailLink: 'https://recruit.navercorp.com/rcrt/view.do?annoId=30005289',
        },
        { annoId: 1, annoSubject: '[NAVER] 광고 영업', classCdNm: 'Service & Business' },
      ],
    }

    // Act
    const { jobs, pageCount } = parseNaverPage(payload, context)

    // Assert
    expect(pageCount).toBe(5)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.job).toMatchObject({
      company: 'NAVER',
      jobGroup: 'Security Analysis',
      career: '경력',
      deadline: '2026-09-29T10:00:00+09:00',
      postedAt: '2026-09-11T10:00:00+09:00',
    })
    expect(jobs[0]?.body).toBeNull()
    expect(jobs[0]?.detailUrl).toBe('https://recruit.navercorp.com/rcrt/view.do?annoId=30005289')
  })
})

describe('parseNaverDetailPage', () => {
  test('.detail_box들을 이어 마크다운으로 바꾸고 밑줄로 그은 구분선은 버린다', () => {
    // Arrange — 실제 페이지처럼 p 안에 p가 들어 있고 인라인 스타일투성이다
    const html = `<html><body><div class="detail_wrap">
      <div class="detail_box"><h4 class="detail_title"></h4><p class="detail_text"><p><b style="color: rgb(35, 35, 35)"><span style="font-size: 18pt">1. Security Analysis</span></b></p></p></div>
      <div class="detail_box"><h4 class="detail_title"></h4><p class="detail_text"><p>______________________________<br></p><p>모든 서비스가 안전하게 운영되도록 보안 리스크를 분석합니다.</p></p></div>
    </div></body></html>`

    // Act
    const body = parseNaverDetailPage(html)

    // Assert
    expect(body, `body was: ${body}`).toContain('**1\\. Security Analysis**')
    expect(body, `body was: ${body}`).toContain('모든 서비스가 안전하게 운영되도록 보안 리스크를 분석합니다.')
    expect(body, `body was: ${body}`).not.toContain('\\_\\_\\_')
  })

  test('.detail_box가 없으면 구조가 바뀐 것으로 보고 던진다', () => {
    expect(() => parseNaverDetailPage('<html><body><p>점검 중</p></body></html>')).toThrow('.detail_box')
  })
})

describe('parseWoowahanPage', () => {
  test('제목으로 개발 직군을 가르고 9999년 마감은 상시 채용으로 읽는다', () => {
    // Arrange
    const payload = {
      data: {
        totalPageNumber: 1,
        list: [
          {
            recruitNumber: 'R2603081',
            recruitName: '[배민] 백엔드 서버 개발자',
            recruitOpenDate: '2026-03-25 14:54:23',
            recruitEndDate: '9999-12-31 00:00:00',
            careerRestrictionMinYears: 5,
            isHidden: false,
            recruitDeleteYn: false,
          },
          { recruitNumber: 'R1', recruitName: 'CEO Office', isHidden: false, recruitDeleteYn: false },
          { recruitNumber: 'R2', recruitName: '숨긴 iOS 개발자', isHidden: true, recruitDeleteYn: false },
        ],
      },
    }

    // Act
    const { jobs } = parseWoowahanPage(payload, context)

    // Assert
    expect(jobs.map((collected) => collected.job.title)).toEqual(['[배민] 백엔드 서버 개발자'])
    expect(jobs[0]?.job).toMatchObject({
      url: 'https://career.woowahan.com/recruitment/R2603081/detail',
      career: '경력 5년 이상',
      deadline: null,
      postedAt: '2026-03-25T14:54:23+09:00',
    })
    expect(jobs[0]?.detailUrl).toBe('https://career.woowahan.com/w1/recruits/R2603081')
  })
})

describe('parseWoowahanDetail', () => {
  test('recruitContents HTML을 마크다운으로 바꾼다', () => {
    // Arrange
    const payload = {
      code: '2000',
      data: {
        recruitContents:
          '<p><span style="font-size: 14px;"><strong>[조직소개]</strong><br>배민 서버를 만듭니다.</span></p><ul><li>대규모 트래픽을 다룹니다</li></ul>',
      },
    }

    // Act
    const body = parseWoowahanDetail(payload)

    // Assert
    expect(body, `body was: ${body}`).toContain('배민 서버를 만듭니다.')
    expect(body, `body was: ${body}`).toMatch(/^- +대규모 트래픽을 다룹니다$/m)
  })

  test('<br>로 나뉜 굵은 줄 두 개가 하나로 붙지 않는다 — 실제 수집에서 붙었던 모양', () => {
    // Arrange — 우아한형제들 편집기가 남기는 모양. 공백만 감싼 <strong>도 섞여 있다.
    const payload = {
      data: {
        recruitContents:
          '<p><strong>구분: 경력(6년 이상)</strong><br id="isPasted"><br><strong>[조직소개]</strong><br>배민 서버를 만듭니다.<strong> </strong></p>',
      },
    }

    // Act
    const body = parseWoowahanDetail(payload) ?? ''

    // Assert
    const lines = body.split('\n').map((line) => line.trim())
    expect(lines, `body was: ${JSON.stringify(body)}`).toContain('**구분: 경력(6년 이상)**')
    expect(lines, `body was: ${JSON.stringify(body)}`).toContain('**\\[조직소개\\]**')
    expect(body, `body was: ${JSON.stringify(body)}`).not.toContain('** **')
  })

  test('data가 없으면 던진다', () => {
    expect(() => parseWoowahanDetail({ code: '9002', data: null })).toThrow('data가 없습니다')
  })
})

describe('parseTossJobs', () => {
  test('Job Category가 개발 직군인 공고만 남기고 계열사 이름을 회사로, Job Description을 본문으로 쓴다', () => {
    // Arrange
    const payload = {
      resultType: 'SUCCESS',
      success: [
        {
          title: 'Server Developer',
          absolute_url: 'https://toss.im/career/job-detail?gh_jid=1',
          first_published: '2026-09-01T10:00:00-04:00',
          application_deadline: null,
          metadata: [
            { name: '커리어 페이지 노출 Job Category 값을 선택해주세요', value: 'Backend' },
            { name: '포지션의 소속 자회사를 선택해 주세요.', value: '토스뱅크' },
            {
              name: 'Job Description을 작성해 주세요.(작성 전, 채용 커뮤니케이션 가이드 노션을 꼭 참고해 주세요.)',
              value: '# 합류하게 될 팀에 대해 알려드려요\n- 뱅크 서버를 만들어요',
            },
          ],
        },
        {
          title: '상담팀 리드',
          absolute_url: 'https://toss.im/career/job-detail?gh_jid=2',
          metadata: [{ name: '커리어 페이지 노출 Job Category 값을 선택해주세요', value: 'Customer Support' }],
        },
      ],
    }

    // Act
    const jobs = parseTossJobs(payload, context)

    // Assert
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.job).toMatchObject({
      company: '토스뱅크',
      jobGroup: 'Backend',
      deadline: null,
      postedAt: '2026-09-01T14:00:00.000Z',
    })
    // 공고 제목이 h1이라 본문 제목은 h3으로 내린다
    expect(jobs[0]?.body).toBe('### 합류하게 될 팀에 대해 알려드려요  \n- 뱅크 서버를 만들어요')
  })
})

describe('parseGreenhouseJobs', () => {
  test('Engineer·Division 메타데이터가 있으면 제목보다 그것을 믿고, 이스케이프된 content를 본문으로 바꾼다', () => {
    // Arrange — 당근 보드 모양
    const payload = {
      jobs: [
        {
          title: 'Software Engineer, Feed',
          absolute_url: 'https://about.daangn.com?gh_jid=1',
          location: { name: 'SEOUL' },
          content: '&lt;h3&gt;DB팀을 소개해요&lt;/h3&gt;&lt;p&gt;4개 DBMS를 지원해요.&amp;nbsp;&lt;/p&gt;',
          metadata: [
            { name: 'Engineer', value: true },
            { name: 'Division', value: 'Tech' },
            { name: 'Corporate', value: '당근' },
            { name: 'Prior Experience', value: '경력' },
          ],
        },
        {
          // 제목에 '데이터'가 있어도 직군 값이 Business면 뺀다
          title: '데이터 기반 광고 세일즈 매니저',
          absolute_url: 'https://about.daangn.com?gh_jid=2',
          location: { name: 'SEOUL' },
          metadata: [
            { name: 'Engineer', value: false },
            { name: 'Division', value: 'Business' },
          ],
        },
      ],
    }

    // Act
    const jobs = parseGreenhouseJobs(payload, context)

    // Assert
    expect(jobs.map((collected) => collected.job.title)).toEqual(['Software Engineer, Feed'])
    expect(jobs[0]?.job).toMatchObject({ company: '당근', jobGroup: 'Tech', career: '경력' })
    expect(jobs[0]?.body).toBe('### DB팀을 소개해요\n\n4개 DBMS를 지원해요.')
  })

  test('메타데이터가 없으면 제목으로 가르고 해외 근무지는 뺀다', () => {
    // Arrange — 쿠팡 보드 모양
    const payload = {
      jobs: [
        {
          title: 'Staff Backend Engineer',
          absolute_url: 'https://www.coupang.jobs/1',
          location: { name: 'Seoul, South Korea' },
        },
        { title: 'Staff Backend Engineer', absolute_url: 'https://www.coupang.jobs/2', location: { name: 'Taipei, Taiwan' } },
        {
          title: '채널 관리 담당자 (계약직)',
          absolute_url: 'https://www.coupang.jobs/3',
          location: { name: 'Seoul, South Korea' },
        },
      ],
    }

    // Act
    const jobs = parseGreenhouseJobs(payload, context)

    // Assert
    expect(jobs.map((collected) => collected.job.url)).toEqual(['https://www.coupang.jobs/1'])
    expect(jobs[0]?.job.company).toBe('테스트회사')
    // content를 주지 않은 공고는 본문 없음 — 공고는 남는다
    expect(jobs[0]?.body).toBeNull()
  })
})

describe('isEngineeringTitle', () => {
  test('영문 약어는 단어 단위로만 잡는다', () => {
    expect(isEngineeringTitle('iOS Developer')).toBe(true)
    expect(isEngineeringTitle('ML Engineer')).toBe(true)
    // 'Mail', 'html' 안의 ai·ml에 걸리면 안 된다
    expect(isEngineeringTitle('Mail Room Manager')).toBe(false)
    expect(isEngineeringTitle('Brand Designer')).toBe(false)
  })

  test('사업개발·플랫폼 사업 직군은 개발 공고로 보지 않는다 — 실제 수집에서 섞였던 제목', () => {
    expect(isEngineeringTitle('사업개발/운영(커머스광고사업)')).toBe(false)
    expect(isEngineeringTitle('[쿠팡] 로켓배송 셀렉션 플래닝 운영기획 (Platform Biz Intelligence)')).toBe(false)
    // 플랫폼 엔지니어는 '엔지니어'로 남는다
    expect(isEngineeringTitle('플랫폼엔지니어링(배포시스템)')).toBe(true)
    expect(isEngineeringTitle('로보틱스 S/W 엔지니어링(SLAM 개발)')).toBe(true)
  })
})
