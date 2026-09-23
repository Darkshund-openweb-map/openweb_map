import styles from '@/components/detail-panel/detail-panel.module.css';
import sharedStyles from '@/components/ui/shared.module.css';
import type { CategoryId, Relation } from '@/lib/ecosystem-types';
import { useEcosystemData } from '../explorer/ecosystem-data-context';
import { Metric } from './detail-widgets';

const statusNames = { verified: '검증 완료', candidate: '후보', excluded: '제외' };

export function DetailConnections({
  relations,
  selectedRelation,
  onSelectRelation,
  onSelectCategory,
}: {
  relations: Relation[];
  selectedRelation: string | null;
  onSelectRelation: (id: string | null) => void;
  onSelectCategory: (id: CategoryId) => void;
}) {
  const { getPlatform, getCategory } = useEcosystemData();
  const verified = relations.filter((item) => item.status === 'verified');
  const candidates = relations.filter((item) => item.status === 'candidate');
  const excluded = relations.filter((item) => item.status === 'excluded');
  const types = [...new Set(verified.map((item) => item.type))];
  const categoryIds = [
    ...new Set(
      relations.flatMap((item) => {
        const target = getPlatform(item.target);
        return target ? [target.category] : [];
      }),
    ),
  ];
  return (
    <>
      <div className={styles['section-meta']}>관계 요약 · 검증 상태별</div>
      <div className={[styles['metric-grid'], styles['triple']].join(' ')}>
        <Metric label="검증 완료" value={`${verified.length}건`} />
        <Metric label="후보" value={`${candidates.length}건`} />
        <Metric label="제외" value={`${excluded.length}건`} />
      </div>
      <div className={styles['relation-composition']}>
        <div className={sharedStyles['block-heading']}>
          관계 유형 구성 <span>검증 관계 {verified.length}건</span>
        </div>
        <div>
          {types.map((type, index) => (
            <span
              key={type}
              style={{
                width: `${(verified.filter((item) => item.type === type).length / verified.length) * 100}%`,
                background: index % 2 ? '#f6a216' : '#ec6124',
              }}
            />
          ))}
        </div>
      </div>
      {!verified.length && (
        <p className={styles['helper-text']}>
          집계할 검증 관계가 없습니다. 후보 관계는 검증 완료 건수에 포함되지 않습니다.
        </p>
      )}
      <div className={styles['section-meta']}>
        관련 관계 <span>{relations.length}</span>
      </div>
      {relations.map((item) => (
        <button
          key={item.id}
          className={[
            styles['relation-card'],
            selectedRelation === item.id ? styles['selected'] : '',
            '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelectRelation(item.id)}
        >
          <div>
            <span className={sharedStyles['status-tag']}>{statusNames[item.status]}</span>
            <span>{item.type}</span>
            <strong>{item.evidence}건</strong>
          </div>
          <b>
            {getPlatform(item.source)?.name ?? item.source} →{' '}
            {getPlatform(item.target)?.name ?? item.target}
          </b>
          <small>
            {item.status === 'verified'
              ? `신뢰도 ${item.confidence} · ${item.firstSeen} → ${item.lastSeen}`
              : item.status === 'excluded'
                ? '집계 제외'
                : '검증 대기 · 집계 제외'}
          </small>
        </button>
      ))}
      {!relations.length && <div className={styles['empty-inline']}>등록된 관계가 없습니다.</div>}
      {categoryIds.length > 0 && (
        <div className={styles['section-meta']}>
          관련 플랫폼 유형 <span>{categoryIds.length}</span>
        </div>
      )}
      {categoryIds.map((id) => (
        <button key={id} className={styles['relation-card']} onClick={() => onSelectCategory(id)}>
          <b>{getCategory(id)?.name ?? id}</b>
          <small>플랫폼 유형 상세 보기 →</small>
        </button>
      ))}
    </>
  );
}
