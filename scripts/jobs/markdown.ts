import { parse as parseHtml } from 'node-html-parser'
import TurndownService from 'turndown'

/**
 * 채용 공고 본문 → 마크다운. 사이트는 본문을 react-markdown으로 그리고 HTML은 넣지 않는다 —
 * 남의 사이트에서 가져온 HTML에 스크립트가 섞이면 안 되니, 여기서 마크다운으로 바꿔 저장한다.
 */
const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' })

// 이미지는 옮기지 않는다 — 방문자 브라우저가 채용 사이트 이미지 서버로 요청을 보내게 되고(핫링크), 대부분 장식이다.
turndown.remove(['style', 'script', 'img'])

/*
  편집기가 공백이나 <br>만 감싼 강조를 흔히 남긴다. 그대로 두면 '** **'가 화면에 별표로 남는다.
  강조만 벗기고 안의 내용(줄바꿈 등)은 살린다 — 마크다운 문자열에서 정규식으로 지우면
  '**구분: 경력**<br><br>**[조직소개]**' 사이의 줄바꿈까지 먹어서 두 굵은 줄이 하나로 붙었다(실제 수집에서 확인).
*/
turndown.addRule('emptyEmphasis', {
  filter: (node) => ['STRONG', 'B', 'EM', 'I'].includes(node.nodeName) && !node.textContent?.trim(),
  replacement: (content) => content,
})

/** 공고 본문을 사이트에 싣기 좋게 다듬는다. 남는 게 없으면 null. */
export function normalizeMarkdown(markdown: string): string | null {
  const normalized = markdown
    .replace(/[​‌‍﻿]/g, '')
    .replace(/ /g, ' ')
    // 공고 제목은 페이지가 h1으로 그린다. 본문 제목은 h3부터 쓴다.
    .replace(/^#{1,2}(?=\s)/gm, '###')
    // 편집기에서 구분선 대신 밑줄 문자를 길게 친 줄
    .replace(/^\s*(\\?_){5,}\s*$/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    /*
      공고는 <br>로 줄을 나눈 글이 대부분이다. 마크다운에서 홑줄바꿈은 공백으로 이어져
      '조직소개 / 업무내용'이 한 문단으로 뭉친다 — 문단 안의 줄바꿈을 모두 강제 줄바꿈(끝 공백 두 칸)으로 바꾼다.
    */
    .replace(/([^\n])\n(?=[^\n])/g, '$1  \n')
  return normalized || null
}

export function htmlToMarkdown(html: string): string | null {
  if (!html.trim()) return null
  return normalizeMarkdown(turndown.turndown(html))
}

/** 태그 대신 <br/>로 줄을 나눈, 마크다운 비슷한 글(카카오). '◆ 조직소개' 같은 줄은 제목으로 세운다. */
export function textToMarkdown(text: string): string | null {
  const withLineBreaks = text.replace(/<br\s*\/?>/gi, '\n')
  return normalizeMarkdown(decodeHtmlEntities(withLineBreaks).replace(/^\s*◆\s*(.+)$/gm, '### $1'))
}

/** '&lt;p&gt;'처럼 한 번 이스케이프해서 주는 소스(Greenhouse)를 되돌린다. */
export function decodeHtmlEntities(text: string): string {
  return parseHtml(text).textContent
}
