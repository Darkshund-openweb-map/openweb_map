import styles from '@/components/detail-panel/detail-panel.module.css';
import sharedStyles from '@/components/ui/shared.module.css';
import type { Category, Platform } from '@/lib/ecosystem-types';
import { Bars, Metric, MiniChart } from './detail-widgets';

export function DetailOverview({
  category,
  platform,
  platforms,
  bars,
  trend,
  eventCount,
  latestDate,
  onSelectPlatform,
}: {
  category: Category;
  platform?: Platform;
  platforms: Platform[];
  bars: { name: string; value: number }[];
  trend: { label: string; value: number }[];
  eventCount: number;
  latestDate?: string;
  onSelectPlatform: (id: string) => void;
}) {
  return (
    <>
      <div className={styles['metric-grid']}>
        <Metric label="전체 사건" value={`${eventCount}건`} caption="등록 사건 기준" />
        <Metric label="최근 관측일" value={latestDate?.slice(5) ?? '—'} caption="최근 등록" />
      </div>
      <div className={styles['detail-section']}>
        <div className={sharedStyles['block-heading']}>
          {platform ? '영토 설명' : '생태계 역할'}
        </div>
        <p className={styles['body-copy']}>{platform?.description ?? category.description}</p>
      </div>
      <Bars caption={platform ? '노출 정보 유형' : '플랫폼 사건 비중'} items={bars} />
      <MiniChart
        title={platform ? '등록 추이 · 최근 4개월' : '사건 추이 · 최근 12개월'}
        points={trend}
      />
      <div className={styles['detail-section']}>
        <div className={sharedStyles['block-heading']}>
          {platform ? '플랫폼 정보' : '포함 플랫폼'}
        </div>
        {platform ? (
          <>
            <div className={styles['info-row']}>
              <span>도메인</span>
              <strong>{platform.domain}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>플랫폼 유형</span>
              <strong>{category.name}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>수집 상태</span>
              <strong>등록 중</strong>
            </div>
          </>
        ) : (
          platforms.map((item) => (
            <button
              key={item.id}
              className={styles['platform-list-row']}
              onClick={() => onSelectPlatform(item.id)}
            >
              <span>{item.name}</span>
              <span>→</span>
            </button>
          ))
        )}
      </div>
    </>
  );
}
