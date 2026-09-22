'use client';

import { useState } from 'react';
import {
  getCategory,
  getPlatform,
  platforms,
  relations,
  type CategoryId,
  type DetailTab,
  type Selection,
} from '@/lib/fixture';

type Props = {
  selected: Selection;
  tab: DetailTab;
  showAllRelations: boolean;
  selectedRelation: string | null;
  onTab: (tab: DetailTab) => void;
  onSelectPlatform: (id: string) => void;
  onSelectCategory: (id: CategoryId) => void;
  onSelectRelation: (id: string | null) => void;
};

function Metric({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {caption && <small>{caption}</small>}
    </div>
  );
}

function Bars({ items, caption }: { items: { name: string; value: number }[]; caption: string }) {
  return (
    <div className="bars-block">
      <div className="block-heading">
        {caption}
        <span>전체 대비</span>
      </div>
      {items.map((item, index) => (
        <div className="bar-row" key={item.name}>
          <div>
            <span>{item.name}</span>
            <span>{item.value}%</span>
          </div>
          <div className="bar-track">
            <span
              style={{
                width: `${Math.max(item.value, 3)}%`,
                background: index === 0 ? '#2865e8' : '#8ec7ff',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniChart({ title }: { title: string }) {
  return (
    <div className="mini-chart">
      <div className="block-heading">{title}</div>
      <div className="chart-bars">
        {[24, 31, 18, 40, 26, 48, 32, 51, 22, 39, 57, 34].map((height, index) => (
          <span
            key={index}
            style={{ height: `${height}px`, background: index === 11 ? '#1867f2' : '#7fbbff' }}
          />
        ))}
      </div>
      <div className="chart-axis">
        <span>2025-10</span>
        <span>2026-01</span>
        <span>2026-04</span>
        <span>2026-09</span>
      </div>
    </div>
  );
}

export function DetailPanel({
  selected,
  tab,
  showAllRelations,
  selectedRelation,
  onTab,
  onSelectPlatform,
  onSelectCategory,
  onSelectRelation,
}: Props) {
  const [period, setPeriod] = useState('90일');
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(0);
  if (!selected) return null;
  const category =
    selected.kind === 'category'
      ? getCategory(selected.id)
      : getCategory(getPlatform(selected.id)?.category ?? 'code');
  const platform = selected.kind === 'platform' ? getPlatform(selected.id) : null;
  const isCode = category.id === 'code';
  const title = platform?.name ?? category.name;
  const eventCount = isCode ? 1 : category.id === 'text' ? 3 : category.id === 'community' ? 9 : 0;
  const hasVerifiedRelations = Boolean(selectedRelation || showAllRelations);
  const relationCount = hasVerifiedRelations ? 3 : 0;

  return (
    <aside className="detail-panel" aria-label={`${title} 상세 패널`}>
      <div className={`detail-title ${platform || selectedRelation ? 'with-subtitle' : ''}`}>
        <span className="eyebrow">
          {selectedRelation
            ? '관계 · GITHUB GIST → PASTEBIN'
            : platform
              ? `개별 플랫폼 · ${platform.name.toUpperCase()}`
              : '플랫폼 유형 · 선택됨'}
        </span>
        <h2>{selectedRelation ? '재게시 2건' : title}</h2>
        {(platform || selectedRelation) && (
          <p>
            {selectedRelation
              ? '선택한 관계 · 신뢰도 높음 · 검증 완료 2026-08-05'
              : `${category.name} > ${title} · 사건 ${eventCount}건`}
          </p>
        )}
      </div>
      <div className="detail-tabs" role="tablist" aria-label="상세 정보">
        <button
          role="tab"
          aria-selected={tab === 'overview'}
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => onTab('overview')}
        >
          개요
        </button>
        <button
          role="tab"
          aria-selected={tab === 'events'}
          className={tab === 'events' ? 'active' : ''}
          onClick={() => onTab('events')}
        >
          사건 <span>{eventCount}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'connections'}
          className={tab === 'connections' ? 'active' : ''}
          onClick={() => onTab('connections')}
        >
          연결 <span>{relationCount}</span>
        </button>
      </div>
      <div className="detail-scroll">
        {tab === 'overview' && (
          <>
            <div className="metric-grid">
              <Metric label="전체 사건" value={`${eventCount}건`} caption="등록 사건 기준" />
              <Metric label="최근 관측일" value="08-31" caption="최근 등록" />
            </div>
            <div className="detail-section">
              <div className="block-heading">{platform ? '영토 설명' : '생태계 역할'}</div>
              <p className="body-copy">
                {platform?.description ??
                  (isCode
                    ? '공개 코드와 스니펫에서 인증정보가 확인되는 영역입니다. 현재 GitHub Gist에 1개 사건이 연결되어 있습니다.'
                    : category.description)}
              </p>
            </div>
            {platform ? (
              <Bars
                caption="노출 정보 유형"
                items={[
                  { name: '소스코드', value: 100 },
                  { name: 'API 키 포함', value: 100 },
                  { name: '비밀키 포함', value: 100 },
                  { name: '계정정보', value: 0 },
                  { name: '기타', value: 0 },
                ]}
              />
            ) : (
              <Bars
                caption="플랫폼 사건 비중"
                items={[
                  { name: isCode ? 'GitHub Gist' : title, value: 100 },
                  { name: isCode ? 'GitHub' : '기타', value: 0 },
                  { name: '기타', value: 0 },
                  { name: '미분류', value: 0 },
                  { name: '추가 데이터', value: 0 },
                ]}
              />
            )}
            <MiniChart title={platform ? '등록 추이 · 최근 4개월' : '사건 추이 · 최근 12개월'} />
            <div className="detail-section">
              <div className="block-heading">{platform ? '플랫폼 정보' : '포함 플랫폼'}</div>
              {platform ? (
                <>
                  <div className="info-row">
                    <span>도메인</span>
                    <strong>{platform.domain}</strong>
                  </div>
                  <div className="info-row">
                    <span>플랫폼 유형</span>
                    <strong>{category.name}</strong>
                  </div>
                  <div className="info-row">
                    <span>수집 상태</span>
                    <strong>등록 중</strong>
                  </div>
                </>
              ) : (
                platforms
                  .filter((item) => item.category === category.id)
                  .slice(0, 4)
                  .map((item) => (
                    <button
                      key={item.id}
                      className="platform-list-row"
                      onClick={() => onSelectPlatform(item.id)}
                    >
                      <span>{item.name}</span>
                      <span>→</span>
                    </button>
                  ))
              )}
            </div>
          </>
        )}
        {tab === 'events' && (
          <>
            <div className="section-meta">
              {title} 사건 · 최신순 <span>전체 · {eventCount}건</span>
            </div>
            <div className="period-tabs" role="group" aria-label="사건 조회 기간">
              {['7일', '30일', '90일', '전체'].map((item) => (
                <button
                  key={item}
                  className={period === item ? 'active' : ''}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="date-picker-wrap">
              <button className="date-button" onClick={() => setDateOpen((value) => !value)}>
                ▦ &nbsp; 2026-08-31 – 2026-08-31 <span>변경 ﹀</span>
              </button>
              {dateOpen && (
                <div className="date-popover">
                  <label>
                    시작일 <input type="date" defaultValue="2026-08-31" />
                  </label>
                  <label>
                    종료일 <input type="date" defaultValue="2026-08-31" />
                  </label>
                  <button onClick={() => setDateOpen(false)}>적용</button>
                </div>
              )}
            </div>
            <div className="timeline">
              <div className="timeline-month">2026-08</div>
              {eventCount ? (
                <>
                  <button
                    className={`timeline-item ${selectedEvent === 0 ? 'active' : ''}`}
                    onClick={() => setSelectedEvent(0)}
                  >
                    <span className="timeline-dot" />
                    <small>
                      08-31 <em>등록</em>
                    </small>
                    <strong>쿠팡 API 관련 코드 게시</strong>
                    <span>GitHub Gist · 소스코드</span>
                  </button>
                  {[1, 2].map((index) => (
                    <button
                      key={index}
                      className={`timeline-item ${selectedEvent === index ? 'active' : ''}`}
                      onClick={() => setSelectedEvent(index)}
                    >
                      <span className="timeline-dot" />
                      <small>
                        — <em>없음</em>
                      </small>
                      <strong>등록된 추가 사건 없음</strong>
                      <span>—</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="empty-inline">이 기간에 등록된 사건이 없습니다.</div>
              )}
              <div className="timeline-month">추가 기록</div>
              {[3, 4].map((index) => (
                <button
                  key={index}
                  className={`timeline-item ${selectedEvent === index ? 'active' : ''}`}
                  onClick={() => setSelectedEvent(index)}
                >
                  <span className="timeline-dot" />
                  <small>
                    — <em>없음</em>
                  </small>
                  <strong>등록된 추가 사건 없음</strong>
                  <span>—</span>
                </button>
              ))}
            </div>
            <p className="helper-text">
              현재 DB에 연결된 사건만 표시합니다. 연결 데이터는 샘플 화면을 기준으로 구성되었습니다.
            </p>
          </>
        )}
        {tab === 'connections' && (
          <>
            <div className="section-meta">
              {selected.kind === 'category'
                ? '집계 단위 · 리소스 → 플랫폼 → 유형'
                : '관계 요약 · 검증 상태별'}
            </div>
            {selected.kind === 'category' && (
              <div className="connection-steps">
                <div>
                  ① &nbsp; 리소스 관계 <span>관계 레코드</span>
                  <b>0건</b>
                </div>
                <div>
                  ② &nbsp; 플랫폼 연결 <span>지도 연결선</span>
                  <b>0개</b>
                </div>
                <div>
                  ③ &nbsp; 유형 간 연결 <span>섬 연결선</span>
                  <b>0건</b>
                </div>
              </div>
            )}
            <p className="helper-text">
              {selected.kind === 'category'
                ? '이 Git 코드 → Pastebin 재게시 2건 = 플랫폼 연결 1개 = 코드 저장소 → 텍스트 호스팅 2건'
                : '재게시 · 미러링 · 직접 링크 · 동일 파일 · 동일 콘텐츠 → 집계할 검증 관계가 없습니다.'}
            </p>
            {selected.kind === 'platform' && (
              <>
                <div className="metric-grid triple">
                  <Metric label="검증 완료" value={hasVerifiedRelations ? '3건' : '0건'} />
                  <Metric label="후보" value={hasVerifiedRelations ? '2건' : '3건'} />
                  <Metric label="제외" value="1건" />
                </div>
                <div className="relation-composition">
                  <div className="block-heading">
                    관계 유형 구성 <span>검증 관계 {hasVerifiedRelations ? '3건' : '0건'}</span>
                  </div>
                  <div>
                    <span
                      style={{ width: hasVerifiedRelations ? '66%' : 0, background: '#ec6124' }}
                    />
                    <span
                      style={{ width: hasVerifiedRelations ? '34%' : 0, background: '#f6a216' }}
                    />
                  </div>
                  {hasVerifiedRelations && (
                    <p>
                      <i style={{ background: '#ec6124' }} /> 재게시 2건　
                      <i style={{ background: '#f6a216' }} /> 동일 콘텐츠 1건
                    </p>
                  )}
                </div>
              </>
            )}
            <div className="section-meta">
              {selected.kind === 'category'
                ? '섬 · 플랫폼 연결 · 집계 입력'
                : selectedRelation
                  ? '검증 완료 관계 · 지도 표시'
                  : '후보 관계 · 지도 비표시'}{' '}
              <span>{selected.kind === 'category' ? 3 : selectedRelation ? 2 : 3}</span>
            </div>
            {relations
              .filter((item) => item.source === 'github-gist')
              .map((item, index) => (
                <button
                  key={item.id}
                  className={`relation-card ${selectedRelation === item.id || (!selectedRelation && index === 0) ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectRelation(item.id);
                    if (selected.kind === 'category') onSelectPlatform('github-gist');
                  }}
                >
                  <div>
                    <span className="status-tag">
                      {hasVerifiedRelations && index < 2 ? '플랫폼 간' : '후보'}
                    </span>
                    <span>{item.type}</span>
                    <strong>{item.evidence}건</strong>
                  </div>
                  <b>GitHub Gist → {getPlatform(item.target)?.name}</b>
                  <small>
                    {hasVerifiedRelations && index < 2
                      ? `신뢰도 ${item.confidence} · 근거 코드 일치 · ${item.firstSeen} → ${item.lastSeen}`
                      : '검증 대기 · 집계 제외'}
                  </small>
                </button>
              ))}
            <div className="section-meta">
              플랫폼 유형 집계 <span>1</span>
            </div>
            <button className="relation-card" onClick={() => onSelectCategory('text')}>
              <div>
                <span className="status-tag">유형 간</span>
                <span>집계 보류</span>
                <strong>0건</strong>
              </div>
              <b>코드 저장소 → 텍스트 호스팅</b>
              <small>검증 완료 0건 · 섬 연결선 없음</small>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
