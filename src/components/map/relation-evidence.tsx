// 선택한 플랫폼 관계의 근거와 검증 정보를 표시하는 컴포넌트
import styles from '@/styles/map.module.css';
import sharedStyles from '@/styles/shared.module.css';
import type { Relation } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';

export function RelationEvidence({
  relation,
  onClose,
}: {
  relation: Relation;
  onClose: () => void;
}) {
  const { getPlatform } = useEcosystemData();
  return (
    <foreignObject x="435" y="28" width="260" height="320">
      <div className={styles['evidence-card']}>
        <div className={[styles['muted'], styles['small']].join(' ')}>선택한 관계 · Evidence</div>
        <h3>
          {getPlatform(relation.source)?.name} → {getPlatform(relation.target)?.name}{' '}
          <span
            className={[
              sharedStyles['status-tag'],
              relation.status === 'verified' ? sharedStyles['good'] : '',
            ].join(' ')}
          >
            {relation.status === 'verified'
              ? '검증 완료'
              : relation.status === 'excluded'
                ? '제외'
                : '검증 대기'}
          </span>
        </h3>
        <dl>
          <div>
            <dt>관계 유형</dt>
            <dd>{relation.type}</dd>
          </div>
          <div>
            <dt>신뢰도</dt>
            <dd>{relation.confidence}</dd>
          </div>
          <div>
            <dt>관계 레코드</dt>
            <dd>{relation.evidence}건</dd>
          </div>
          <div>
            <dt>최초 관측</dt>
            <dd>{relation.firstSeen}</dd>
          </div>
          <div>
            <dt>최근 관측</dt>
            <dd>{relation.lastSeen}</dd>
          </div>
          <div>
            <dt>근거</dt>
            <dd>{relation.note}</dd>
          </div>
          <div>
            <dt>검증</dt>
            <dd>
              {relation.status === 'verified'
                ? '검증 완료'
                : relation.status === 'excluded'
                  ? '집계 제외'
                  : '검증 대기'}
            </dd>
          </div>
        </dl>
        <p>출발 플랫폼&nbsp; {getPlatform(relation.source)?.domain}</p>
        <p>도착 플랫폼&nbsp; {getPlatform(relation.target)?.domain}</p>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </foreignObject>
  );
}
