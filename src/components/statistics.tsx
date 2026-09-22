'use client';

import { useState } from 'react';
import { categories, events, exposureRows, type CategoryId } from '@/lib/fixture';

export function Statistics({ onSelectCategory }: { onSelectCategory: (id: CategoryId) => void }) {
  const [active, setActive] = useState<CategoryId | 'all'>('all');
  const rows =
    active === 'all'
      ? exposureRows
      : exposureRows.filter((_, index) => index < (active === 'code' ? 4 : 3));
  return (
    <div className="statistics-surface">
      <div className="stats-heading">
        <h2>오픈웹 노출 분포 분석</h2>
        <div className="category-chips">
          {categories.map((category) => (
            <button
              key={category.id}
              className={active === category.id ? 'active' : ''}
              onClick={() => setActive(active === category.id ? 'all' : category.id)}
            >
              <i style={{ background: category.color }} />
              {category.name}{' '}
              <span>
                {category.id === 'code'
                  ? 2
                  : category.id === 'text'
                    ? 2
                    : category.id === 'community'
                      ? 9
                      : category.id === 'cloud'
                        ? 1
                        : category.id === 'files'
                          ? 1
                          : category.id === 'backend'
                            ? 2
                            : category.id === 'release'
                              ? 1
                              : 0}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="stats-metrics">
        <div>
          <span>등록 사건</span>
          <strong>16</strong>
          <small>지도 표시 13건</small>
        </div>
        <div>
          <span>노출 유형</span>
          <strong>7</strong>
          <small>현재 등록 기준</small>
        </div>
        <div>
          <span>실제 연결</span>
          <strong>0건</strong>
          <small>샘플 관계 제외</small>
        </div>
      </div>
      <div className="stats-table-heading">노출 유형 · 전체 등록 사건 16건 기준</div>
      <div className="stats-table">
        <div className="stats-table-row table-header">
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
            className={`stats-table-row ${index === 0 ? 'highlighted' : ''}`}
            onClick={() => onSelectCategory('code')}
          >
            <span>{index + 1}</span>
            <strong>{row.name}</strong>
            <span className="heat-bar">
              <i style={{ width: `${row.heat * 2}%` }} />
            </span>
            <b>{row.heat}</b>
            <span className={`state-label ${row.state === '활성' ? 'live' : ''}`}>{row.state}</span>
            <span>{row.count}건</span>
            <span>{row.date}</span>
          </button>
        ))}
      </div>
      <div className="recent-activity">
        <div className="block-heading">
          최근 주요 노출 · 오픈웹{' '}
          <span>사건 선택 → 상세 · 실제 관계 데이터가 있을 때만 연결 표시</span>
        </div>
        <div>
          {events.slice(0, 3).map((event) => (
            <button key={event.title} onClick={() => onSelectCategory('code')}>
              <small>
                {event.date} <em>{event.type}</em>
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
