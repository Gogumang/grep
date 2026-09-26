import type { CodingProblem, CodingProblemsSnapshot } from '@/shared/types'
import snapshot from './problems.json'

/**
 * 코딩테스트 문제. collector(grep-airflow)가 어드민에서 공개한 문제를 problems.json으로 커밋한다 —
 * 이 저장소에서는 문제 파일을 손으로 만지지 않는다. 숨은 테스트는 collector에만 있다(이 저장소는 공개).
 */
export const PROBLEMS: CodingProblem[] = (snapshot as CodingProblemsSnapshot).problems
