import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

/** .astro에서 client 지시어 없이 부른다 — 빌드 때 HTML로만 구워진다. */
export function PostBody({ body }: { body: string }) {
  // HTML을 직접 넣지 않는다 — 남의 페이지에서 가져온 내용이라 스크립트가 섞이면 안 된다.
  return (
    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
      {body}
    </Markdown>
  )
}
