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
  onClear: () => void;
  onSelectCategory: () => void;
  onView: (view: View) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
  onClear,
  onSelectCategory,
  onView,
  theme,
  onToggleTheme,
}: Props) {
  const statistics = view === 'statistics';
  const summary = useHeaderSummary(selected, tab, selectedRelation);
  const displayedSummary = scope === 'dark' ? '등록된 다크웹 데이터가 없습니다.' : summary;
  return (
    <div className={styles['content-header']}>
      <div className={styles['content-heading']}>
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
            </>
          )}
          <p className={styles['content-summary']}>{displayedSummary}</p>
        </div>
      </div>
      <div className={styles['content-actions']}>
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
        <button
          type="button"
          className={styles['theme-toggle']}
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
