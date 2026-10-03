// 선택 영역의 관계 집계와 관계 카드 목록을 표시하는 상세 연결 컴포넌트
'use client';

import styles from '@/styles/detail-panel.module.css';
import sharedStyles from '@/styles/shared.module.css';
import type { Relation } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { useRelationPopup } from '@/hooks/use-relation-popup';
import { Metric } from '@/components/chart/metric';
import { RelationEvidencePopup } from './relation-evidence-popup';

const statusNames = { verified: '검토 완료', candidate: '검토 전', excluded: '제외' };

export function DetailConnections({
  relations,
  selectedRelation,
  onSelectRelation,
}: {
  relations: Relation[];
  selectedRelation: string | null;
  onSelectRelation: (id: string | null) => void;
}) {
  const { getPlatform } = useEcosystemData();
  const { popup, popupRef, closeButtonRef, open, close } = useRelationPopup(() =>
    onSelectRelation(null),
  );
  const verified = relations.filter((item) => item.status === 'verified');
  const unverified = relations.filter((item) => item.status !== 'verified');
  const types = [...new Set(verified.map((item) => item.type))];

  return (
    <>
      <div className={styles['section-meta']}>관계 요약 · 검토 상태별</div>
      <div className={styles['metric-grid']}>
        <Metric label="검토 완료" value={`${verified.length}건`} />
        <Metric label="검토 전" value={`${unverified.length}건`} />
      </div>
      <div className={styles['relation-composition']}>
        <div className={sharedStyles['block-heading']}>관계 유형 구성</div>
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
          집계할 검토 완료 관계가 없습니다. 검토 전 관계는 완료 건수에 포함되지 않습니다.
        </p>
      )}
      <div className={styles['section-meta']}>
        관련 관계 <span>{relations.length}</span>
      </div>
      {relations.map((item) => {
        const source = getPlatform(item.source);
        const target = getPlatform(item.target);
        return (
          <button
            key={item.id}
            className={[
              styles['relation-card'],
              selectedRelation === item.id ? styles.selected : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-haspopup="dialog"
            aria-expanded={popup?.relation.id === item.id}
            aria-controls={popup?.relation.id === item.id ? `relation-popup-${item.id}` : undefined}
            onClick={(event) => {
              onSelectRelation(item.id);
              open(item, event.currentTarget);
            }}
          >
            <div>
              <span>{item.type}</span>
              <span
                className={[
                  sharedStyles['status-tag'],
                  item.status === 'verified' ? sharedStyles.good : '',
                  item.status === 'candidate' ? sharedStyles.pending : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {statusNames[item.status]}
              </span>
              <strong>{item.evidence}건</strong>
            </div>
            <b>
              {source?.name ?? item.source} → {target?.name ?? item.target}
            </b>
          </button>
        );
      })}
      {!relations.length && <div className={styles['empty-inline']}>등록된 관계가 없습니다.</div>}
      {popup && (
        <RelationEvidencePopup
          relation={popup.relation}
          source={getPlatform(popup.relation.source)}
          target={getPlatform(popup.relation.target)}
          position={popup.position}
          popupRef={popupRef}
          closeButtonRef={closeButtonRef}
          onClose={close}
        />
      )}
    </>
  );
}
