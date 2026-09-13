import { formatPostDate, type Job } from '@/shared'
import * as badge from '@/shared/styles/badge.css'
import * as styles from './JobList.css'

/** 누르면 이 사이트의 공고 페이지(/jobs/{id})로 간다. 지원은 그 페이지에서 원문으로 넘어간다. */
export function JobList({ jobs }: { jobs: Job[] }) {
  return (
    <ul className={styles.list}>
      {jobs.map((job) => (
        <li key={job.id}>
          <a href={`/jobs/${job.id}`} className={styles.item}>
            <div className={styles.meta}>
              <span className={badge.secondary}>{job.company}</span>
              {job.jobGroup && <span className={badge.category}>{job.jobGroup}</span>}
              {job.career && <span className={badge.secondary}>{job.career}</span>}
            </div>
            <h2 className={styles.title}>{job.title}</h2>
            <p className={styles.deadline}>{job.deadline ? `${formatPostDate(job.deadline)} 마감` : '상시 채용'}</p>
          </a>
        </li>
      ))}
    </ul>
  )
}
