// 선택한 섬 또는 플랫폼의 핵심 지표와 설명을 표시하는 상세 개요 컴포넌트
import styles from '@/styles/detail-panel.module.css';
import sharedStyles from '@/styles/shared.module.css';
import type { Category, CategoryId, Platform } from '@/lib/ecosystem-types';
import { Bars } from '@/components/chart/bars';
import { Metric } from '@/components/chart/metric';
import { MiniChart } from '@/components/chart/mini-chart';

export function DetailOverview({
  category,
  categories,
  platform,
  platforms,
  bars,
  trend,
  eventCount,
  latestDate,
  verifiedCount,
  onSelectCategory,
  onSelectPlatform,
}: {
  category?: Category;
  categories: Category[];
  platform?: Platform;
  platforms: Platform[];
  bars: { name: string; value: number }[];
  trend: { label: string; value: number }[];
  eventCount: number;
  latestDate?: string;
  verifiedCount: number;
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
}) {
  return (
    <>
      <div className={styles['metric-grid']}>
        <Metric label="전체 사건" value={`${eventCount}건`} />
        <Metric label="최근 관측일" value={latestDate?.slice(5) ?? '—'} />
        {!category && <Metric label="실제 연결" value={`${verifiedCount}건`} />}
      </div>
      {(platform?.description || category?.description) && (
        <div className={styles['detail-section']}>
          <div className={sharedStyles['block-heading']}>
            {platform ? '영토 설명' : '생태계 역할'}
          </div>
          <p className={styles['body-copy']}>{platform?.description ?? category?.description}</p>
        </div>
      )}
      {!category && (
        <div className={styles['detail-section']}>
          <div className={sharedStyles['block-heading']}>플랫폼 유형 · {categories.length}개</div>
          {categories.map((item) => (
            <button
              key={item.id}
              className={styles['platform-list-row']}
              onClick={() => onSelectCategory(item.id)}
            >
              <span>{item.name}</span>
              <span>→</span>
            </button>
          ))}
        </div>
      )}
      <Bars
        caption={platform ? '노출 정보 유형' : category ? '플랫폼 사건 비중' : '전체 노출 유형'}
        items={bars}
      />
      {trend.some((point) => point.value > 0) && (
        <MiniChart
          title={platform ? '등록 추이 · 최근 4개월' : '사건 추이 · 최근 12개월'}
          points={trend}
        />
      )}
      {!platform && category && (
        <div className={styles['detail-section']}>
          <div className={sharedStyles['block-heading']}>포함 플랫폼</div>
          {platforms.map((item) => (
            <button
              key={item.id}
              className={styles['platform-list-row']}
              onClick={() => onSelectPlatform(item.id)}
            >
              <span>{item.name}</span>
              <span>→</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
