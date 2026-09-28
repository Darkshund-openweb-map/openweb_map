// 현재 탐색 경로와 지도·통계 전환 및 상세보기 동작을 표시하는 컴포넌트
import styles from '@/styles/explorer.module.css';
import { type Category, type DetailTab, type Selection } from '@/lib/ecosystem-types';
import type { Scope, View } from '@/types/explorer';
import { useHeaderSummary } from '@/hooks/use-header-summary';

type Props = {
  scope: Scope;
  view: View;
  selected: Selection;
  category: Category | null;
  platformName?: string;
  name: string;
  tab: DetailTab;
  selectedRelation: string | null;
  detailOpen: boolean;
  onClear: () => void;
  onSelectCategory: () => void;
  onOpenDetail: () => void;
  onView: (view: View) => void;
};

export function ContentHeader({
  scope,
  view,
  selected,
  category,
  platformName,
  name,
  tab,
  selectedRelation,
  detailOpen,
  onClear,
  onSelectCategory,
  onOpenDetail,
  onView,
}: Props) {
  const statistics = view === 'statistics';
  const summary = useHeaderSummary(selected, tab, selectedRelation);
  return (
    <div className={styles['content-header']}>
      <div className={styles['content-path']}>
        {selected && !statistics ? (
          <>
            <button onClick={onClear}>전체 오픈웹</button>
            <span>›</span>
            {platformName && (
              <>
                <button onClick={onSelectCategory}>{category?.name}</button>
                <span>›</span>
              </>
            )}
            <h1>{name}</h1>
            <p>{summary}</p>
          </>
        ) : (
          <>
            <h1>
              {statistics
                ? '오픈웹 분석'
                : scope === 'dark'
                  ? '전체 다크웹'
                  : scope === 'connected'
                    ? '연결 생태계'
                    : '전체 오픈웹'}
            </h1>
            <p>{scope === 'dark' ? '등록된 다크웹 데이터가 없습니다.' : summary}</p>
          </>
        )}
      </div>
      <div className={styles['content-actions']}>
        {selected && !statistics && !detailOpen && (
          <button className={styles['detail-open-button']} onClick={onOpenDetail}>
            상세 보기 <span aria-hidden="true">›</span>
          </button>
        )}
        <div className={styles['view-tabs']} role="group" aria-label="지도 또는 통계 보기">
          <button className={view === 'map' ? styles['active'] : ''} onClick={() => onView('map')}>
            지도
          </button>
          <button
            className={view === 'statistics' ? styles['active'] : ''}
            onClick={() => onView('statistics')}
          >
            통계
          </button>
        </div>
      </div>
    </div>
  );
}
