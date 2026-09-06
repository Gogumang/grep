import { type Post, visibleTags } from '@/shared'
import * as badge from '@/shared/styles/badge.css'
import * as styles from './PostList.css'

/** 카드에 늘어놓을 태그 수. 넘치면 줄바꿈이 잦아져 목록이 읽기 어려워진다. */
const VISIBLE_TAG_COUNT = 3

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className={styles.list}>
      {posts.map((post) => {
        const tags = visibleTags(post)
        return (
          <li key={post.id}>
            <a href={`/posts/${post.id}`} className={styles.item}>
              <div>
                <div className={styles.meta}>
                  {post.category && <span className={badge.category}>{post.category}</span>}
                  {post.author && <span className={badge.secondary}>{post.author}</span>}
                  <span className={badge.secondary}>{post.blogName}</span>
                </div>

                <h2 className={styles.title}>{post.title}</h2>
                {post.summary && <p className={styles.summary}>{post.summary}</p>}

                {tags.length > 0 && (
                  <div className={styles.tagRow}>
                    {tags.slice(0, VISIBLE_TAG_COUNT).map((tag) => (
                      <span key={tag} className={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 원문이 준 이미지만 쓴다. 없는 글은 이미지 칸을 비운다. */}
              {post.sourceThumbnail && (
                <img
                  className={styles.thumbnail}
                  src={post.sourceThumbnail}
                  alt=""
                  loading="lazy"
                  width={400}
                  height={220}
                />
              )}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
