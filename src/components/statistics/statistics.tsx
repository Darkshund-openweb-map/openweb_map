'use client';

import styles from '@/components/statistics/statistics.module.css';
import sharedStyles from '@/components/ui/shared.module.css';
import { type CategoryId } from '@/lib/ecosystem-types';
import { useStatistics } from './use-statistics';

export function Statistics({
  onSelectCategory,
  onSelectPlatform,
}: {
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
}) {
  const { categories, events, rows, active, platformCounts, verifiedCount, selectCategory } =
    useStatistics();
  return (
    <div className={styles['statistics-surface']}>
      <div className={styles['stats-heading']}>
        <h2>오픈웹 노출 분포 분석</h2>
        <div className={styles['category-chips']}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={active === category.id ? styles['active'] : ''}
              aria-pressed={active === category.id}
              onClick={() => selectCategory(category.id)}
            >
              <i style={{ background: category.color }} />
              {category.name} <span>{platformCounts.get(category.id) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles['stats-metrics']}>
        <div>
          <span>등록 사건</span>
          <strong>{events.length}</strong>
          <small>조회 가능한 사건 기준</small>
        </div>
        <div>
          <span>노출 유형</span>
          <strong>{rows.length}</strong>
          <small>현재 등록 기준</small>
        </div>
        <div>
          <span>실제 연결</span>
          <strong>{verifiedCount}건</strong>
          <small>샘플 관계 제외</small>
        </div>
      </div>
      <div className={styles['stats-table-heading']}>
        노출 유형 ·{' '}
        {active === 'all' ? '전체' : categories.find((category) => category.id === active)?.name}{' '}
        등록 기준
      </div>
      <div className={styles['stats-table']}>
        <div className={[styles['stats-table-row'], styles['table-header']].join(' ')}>
          <span>#</span>
          <span>노출 유형</span>
          <span>활동도</span>
          <span>30일</span>
          <span>상태</span>
          <span>사건</span>
          <span>최근 관측</span>
        </div>
        {rows.map((row, index) => (
          <button
            key={row.name}
            className={[styles['stats-table-row'], index === 0 ? styles['highlighted'] : '', '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              const event = events.find((event) => event.exposures.includes(row.name));
              if (event) onSelectPlatform(event.platform);
              else if (active !== 'all') onSelectCategory(active);
            }}
            disabled={
              !events.some((event) => event.exposures.includes(row.name)) && active === 'all'
            }
          >
            <span>{index + 1}</span>
            <strong>{row.name}</strong>
            <span className={styles['heat-bar']}>
              <i style={{ width: `${Math.min(100, row.heat * 2)}%` }} />
            </span>
            <b>{row.heat}</b>
            <span
              className={[styles['state-label'], row.state === '활성' ? styles['live'] : '', '']
                .filter(Boolean)
                .join(' ')}
            >
              {row.state}
            </span>
            <span>{row.count}건</span>
            <span>{row.date}</span>
          </button>
        ))}
      </div>
      <div className={styles['recent-activity']}>
        <div className={sharedStyles['block-heading']}>
          최근 주요 노출 · 오픈웹{' '}
          <span>사건 선택 → 상세 · 실제 관계 데이터가 있을 때만 연결 표시</span>
        </div>
        <div>
          {events.slice(0, 3).map((event) => (
            <button key={event.id} onClick={() => onSelectPlatform(event.platform)}>
              <small>
                {event.date.slice(5)} <em>{event.type}</em>
              </small>
              <strong>{event.title}</strong>
              <span>{event.meta}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
