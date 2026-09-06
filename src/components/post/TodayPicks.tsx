import { useEffect, useState } from 'react'
import { formatPostDate, type Post } from '@/shared'
import { Chevron } from './Chevron'
import * as styles from './TodayPicks.css'

/** toss.tech 실측: 제목 opacity 0→1, 400ms linear. CSS 애니메이션과 값을 맞춘다. */
const FADE_MILLISECONDS = 400

export function TodayPicks({ picks }: { picks: Post[] }) {
  const [index, setIndex] = useState(0)
  /**
   * 나가는 글. 크로스페이드에는 두 장이 동시에 필요하다 —
   * 새 글만 페이드인하면 그 사이 칸이 비어 글자가 사라졌다 나타나는 것처럼 보인다.
   */
  const [leaving, setLeaving] = useState<Post | null>(null)

  // 페이드가 끝나면 나가는 글을 떼어낸다. 남겨두면 클릭이 가려진다.
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => setLeaving(null), FADE_MILLISECONDS)
    return () => clearTimeout(timer)
  }, [leaving])

  // 고를 글이 없으면 영역 자체를 그리지 않는다 — 빈 상자는 고장난 것처럼 보인다.
  const post = picks[index]
  if (!post) return null

  function move(step: number) {
    setLeaving(picks[index] ?? null)
    setIndex((current) => (current + step + picks.length) % picks.length)
  }

  return (
    <>
      <section className={styles.section} aria-roledescription="carousel" aria-label="추천 글">
        <div className={styles.slide}>
          <div className={styles.textColumn}>
            <div className={styles.textStack}>
              {leaving && leaving.id !== post.id && (
                <div key={leaving.id} className={`${styles.textLayer} ${styles.leaving}`} aria-hidden="true">
                  <SlideText post={leaving} />
                </div>
              )}
              <div key={post.id} className={`${styles.textLayer} ${styles.entering}`}>
                <SlideText post={post} />
              </div>
            </div>

            {picks.length > 1 && (
              <div className={styles.controls}>
                <button type="button" className={styles.arrow} onClick={() => move(-1)} aria-label="이전 픽">
                  <Chevron direction="left" />
                </button>
                <button type="button" className={styles.arrow} onClick={() => move(1)} aria-label="다음 픽">
                  <Chevron direction="right" />
                </button>
              </div>
            )}
          </div>

          <div className={styles.imageStack}>
            {leaving && leaving.id !== post.id && leaving.wideImage && (
              <div key={leaving.id} className={`${styles.imageLayer} ${styles.leaving}`} aria-hidden="true">
                <img className={styles.image} src={leaving.wideImage} alt="" width={1200} height={630} />
              </div>
            )}
            {post.wideImage && (
              <a key={post.id} href={`/posts/${post.id}`} className={`${styles.imageLayer} ${styles.entering}`}>
                <img className={styles.image} src={post.wideImage} alt="" width={1200} height={630} />
              </a>
            )}
          </div>
        </div>
      </section>
      <hr className={styles.divider} />
    </>
  )
}

function SlideText({ post }: { post: Post }) {
  return (
    <>
      <a href={`/posts/${post.id}`}>
        <h2 className={styles.title}>{post.title}</h2>
        {post.summary && <p className={styles.summary}>{post.summary}</p>}
      </a>
      <p className={styles.meta}>
        {post.blogName} · {formatPostDate(post.publishedAt)}
      </p>
    </>
  )
}
