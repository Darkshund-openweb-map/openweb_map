'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  categories,
  getCategory,
  getPlatform,
  platforms,
  type CategoryId,
  type DetailTab,
  type Selection,
} from '@/lib/fixture';
import { DetailPanel } from './detail-panel';
import { EcosystemMap } from './map';
import { Statistics } from './statistics';

type Scope = 'open' | 'connected' | 'dark';
type View = 'map' | 'statistics';

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
function Hex({ color }: { color: string }) {
  return <span className="legend-hex" style={{ background: color }} />;
}

export function Explorer() {
  const [scope, setScope] = useState<Scope>('open');
  const [view, setView] = useState<View>('map');
  const [selected, setSelected] = useState<Selection>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [detailOpen, setDetailOpen] = useState(false);
  const [showAllRelations, setShowAllRelations] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearSelection = () => {
    setSelected(null);
    setTab('overview');
    setDetailOpen(false);
    setSelectedRelation(null);
    setShowAllRelations(false);
  };
  const selectCategory = (id: CategoryId) => {
    setScope('open');
    setView('map');
    setSelected({ kind: 'category', id });
    setTab('overview');
    setDetailOpen(true);
    setSelectedRelation(null);
    setShowAllRelations(false);
  };
  const selectPlatform = (id: string) => {
    setScope('open');
    setView('map');
    setSelected({ kind: 'platform', id });
    setTab('overview');
    setDetailOpen(true);
    setSelectedRelation(null);
    setShowAllRelations(false);
  };
  const selectRelation = (id: string | null) => {
    setSelectedRelation(id);
    if (id) {
      setSelected({ kind: 'platform', id: 'github-gist' });
      setTab('connections');
      setDetailOpen(true);
      setShowAllRelations(true);
    }
  };

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const categoryHits = categories
      .filter((item) => !normalized || item.name.toLocaleLowerCase().includes(normalized))
      .map((item) => ({
        key: `c-${item.id}`,
        label: item.name,
        sub: '플랫폼 유형',
        color: item.color,
        category: item.id,
        platform: null as string | null,
      }));
    const platformHits = platforms
      .filter((item) =>
        !normalized
          ? item.featured
          : `${item.name} ${item.domain}`.toLocaleLowerCase().includes(normalized),
      )
      .map((item) => ({
        key: `p-${item.id}`,
        label: item.name,
        sub: item.domain,
        color: getCategory(item.category).color,
        category: item.category,
        platform: item.id,
      }));
    return [...platformHits, ...categoryHits].slice(0, 8);
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const chooseResult = (index: number) => {
    const result = results[index];
    if (!result) return;
    if (result.platform) selectPlatform(result.platform);
    else selectCategory(result.category);
    setQuery('');
    setSearchOpen(false);
    inputRef.current?.blur();
  };
  const category =
    selected?.kind === 'category'
      ? getCategory(selected.id)
      : selected?.kind === 'platform'
        ? getCategory(getPlatform(selected.id)?.category ?? 'code')
        : null;
  const platform = selected?.kind === 'platform' ? getPlatform(selected.id) : null;
  const name = platform?.name ?? category?.name ?? '전체 오픈웹';
  const statistics = view === 'statistics';

  return (
    <main className="reference-page">
      <div className="reference-caption">
        <span>
          {statistics
            ? '④-8'
            : selected?.kind === 'platform'
              ? tab === 'overview'
                ? '④-3a'
                : tab === 'events'
                  ? '④-3'
                  : selectedRelation
                    ? '④-4b'
                    : '④-4'
              : selected?.kind === 'category'
                ? tab === 'overview'
                  ? '④-2'
                  : tab === 'events'
                    ? '④-2a'
                    : '④-2b'
                : '④-1'}
        </span>{' '}
        오픈웹 ·{' '}
        {statistics
          ? '분석'
          : selected
            ? `${selected.kind === 'category' ? '섬' : '영토'} ${tab === 'overview' ? '개요' : tab === 'events' ? '사건' : '연결'}`
            : '전체 생태계'}
      </div>
      <div className="workspace">
        <div className="app-shell">
          <header className="app-header">
            <button
              className="brand"
              onClick={clearSelection}
              aria-label="WEB SCOPE 전체 오픈웹으로"
            >
              <Mark />
              <span>
                <strong>WEB SCOPE</strong>
                <small>ECOSYSTEM MAP</small>
              </span>
            </button>
            <span className="header-divider" />
            <nav className="scope-tabs" aria-label="탐색 영역">
              {[
                { id: 'open', name: '오픈웹', color: '#176bfa' },
                { id: 'connected', name: '연결', color: '#8053e9' },
                { id: 'dark', name: '다크웹', color: '#df2f4b' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={scope === item.id ? 'active' : ''}
                  aria-current={scope === item.id ? 'page' : undefined}
                  onClick={() => {
                    setScope(item.id as Scope);
                    clearSelection();
                    setView('map');
                    setShowAllRelations(item.id === 'connected');
                  }}
                >
                  <i style={{ background: item.color }} />
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="header-spacer" />
            <span className="database-date">DB 2026-09-20</span>
            <div className="search-region" ref={searchRef}>
              <div className="search-input-wrap">
                <span>⌕</span>
                <input
                  ref={inputRef}
                  value={query}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearchOpen(true);
                    setSearchIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setSearchIndex(Math.min(results.length - 1, searchIndex + 1));
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setSearchIndex(Math.max(0, searchIndex - 1));
                    } else if (event.key === 'Enter') {
                      event.preventDefault();
                      chooseResult(searchIndex);
                    }
                  }}
                  placeholder="노드 · 키워드 · 엔티티 검색"
                  aria-label="노드 · 키워드 · 엔티티 검색"
                  role="combobox"
                  aria-expanded={searchOpen}
                  aria-controls="search-results"
                  aria-autocomplete="list"
                />
                <kbd>⌘K</kbd>
              </div>
              {searchOpen && (
                <div className="search-results" id="search-results" role="listbox">
                  <div className="search-results-title">
                    {query ? `검색 결과 ${results.length}개` : '빠른 검색'}
                    <span>ESC 닫기</span>
                  </div>
                  {results.length ? (
                    results.map((item, index) => (
                      <button
                        role="option"
                        aria-selected={index === searchIndex}
                        key={item.key}
                        className={index === searchIndex ? 'active' : ''}
                        onClick={() => chooseResult(index)}
                        onMouseEnter={() => setSearchIndex(index)}
                      >
                        <Hex color={item.color} />
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.sub}</small>
                        </span>
                        <span>↗</span>
                      </button>
                    ))
                  ) : (
                    <p>검색 결과가 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </header>
          <div className="app-body">
            <aside className="legend">
              <h2>범례</h2>
              <p className="legend-subtitle">섬 색 = 영역 (유형)</p>
              <div className="legend-list">
                {categories.map((item) => (
                  <button
                    key={item.id}
                    className={category?.id === item.id ? 'active' : ''}
                    onClick={() => selectCategory(item.id)}
                  >
                    <Hex color={item.color} />
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="legend-section">
                <p>
                  {statistics
                    ? '연결선 · 실제 관계 데이터'
                    : selected
                      ? '연결선 · 신뢰도'
                      : '선 스타일 = 신뢰도'}
                </p>
                <div>
                  <i className="line-solid" />
                  {statistics ? '직접 근거' : '높음'}
                </div>
                <div>
                  <i className="line-dashed" />
                  {statistics ? '복수 정황' : '중간'}
                </div>
                <div>
                  <i className="line-dotted" />
                  {statistics ? '참고 신호' : '낮음'}
                </div>
              </div>
              <div className="legend-section legend-reading">
                <p>읽는 법</p>
                <span>섬 = 플랫폼 유형 · 영토 = 공개 플랫폼</span>
                <span>영토 배치는 유지 · 수치는 현재 DB 기준</span>
                <span>
                  {statistics
                    ? '샘플 관계는 제외하고 실제 등록된 관계만 집계'
                    : '사건 선택 시 발생 위치와 연결 경로 표시'}
                </span>
              </div>
              {!statistics && (!selected || tab === 'connections') && (
                <div className="legend-section relation-legend">
                  <p>관계선 = 검증된 관계 레코드</p>
                  <div>
                    <i className="dot" style={{ background: '#f26420' }} />
                    재게시 <i className="dot" style={{ background: '#139e77' }} />
                    미러링
                  </div>
                  <div>
                    <i className="dot" style={{ background: '#176bfa' }} />
                    직접 링크 <i className="dot" style={{ background: '#8053e9' }} />
                    동일 파일
                  </div>
                  <div>
                    <i className="dot" style={{ background: '#f1a512' }} />
                    동일 콘텐츠
                  </div>
                </div>
              )}
              {!statistics && (!selected || tab === 'connections') && (
                <div className="legend-footer">
                  굵기 = 관계 레코드 수<br />
                  화살표 = 먼저 관측된 쪽 → 나중
                  <br />
                  검증 완료만 표시 · 후보/제외는 숨김
                  <br />
                  같은 플랫폼 안의 재게시 선이 아니라 영토 사건
                </div>
              )}
            </aside>
            <section className="main-content" aria-label="오픈웹 생태계 탐색">
              <div className="content-header">
                <div className="content-path">
                  {selected && !statistics ? (
                    <>
                      <button onClick={clearSelection}>전체 오픈웹</button>
                      <span>›</span>
                      {platform && (
                        <>
                          <button onClick={() => selectCategory(category!.id)}>
                            {category!.name}
                          </button>
                          <span>›</span>
                        </>
                      )}
                      <h1>{name}</h1>
                      <p>
                        {selectedRelation
                          ? '관계선 선택됨 · 근거 리소스 2쌍 · 나머지 관계는 흐리게'
                          : tab === 'connections'
                            ? platform
                              ? '검증 완료 0건 · 후보 3건 · 제외 1건 · 근거 리소스 0개'
                              : '검증 완료 0건 · 후보 3건 · 집계 입력 플랫폼 연결 0개'
                            : '플랫폼 유형 8개 · 공개 플랫폼 18곳 · 지도 표시 사건 13건'}
                      </p>
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
                      <p>
                        {statistics
                          ? '현재 등록 · 플랫폼 유형 8개 · 공개 플랫폼 18곳 · 사건 16건 · 실제 연결 0건'
                          : '플랫폼 유형 8개 · 공개 플랫폼 18곳 · 검증 완료 관계 0건 · 후보 3건'}
                      </p>
                    </>
                  )}
                </div>
                <div className="view-tabs" role="group" aria-label="지도 또는 통계 보기">
                  <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
                    지도
                  </button>
                  <button
                    className={view === 'statistics' ? 'active' : ''}
                    onClick={() => {
                      setView('statistics');
                      setDetailOpen(false);
                    }}
                  >
                    통계
                  </button>
                </div>
              </div>
              {statistics ? (
                <Statistics onSelectCategory={selectCategory} />
              ) : scope === 'dark' ? (
                <div className="empty-scope">
                  <h2>등록된 다크웹 플랫폼이 없습니다</h2>
                  <p>현재 화면은 오픈웹 플로우 V4를 구현한 예시입니다.</p>
                  <button onClick={() => setScope('open')}>오픈웹으로 돌아가기</button>
                </div>
              ) : (
                <EcosystemMap
                  selected={selected}
                  tab={tab}
                  showAllRelations={showAllRelations}
                  selectedRelation={selectedRelation}
                  onSelectCategory={selectCategory}
                  onSelectPlatform={selectPlatform}
                  onSelectRelation={selectRelation}
                  onClear={clearSelection}
                  onShowAllRelations={() => setShowAllRelations((value) => !value)}
                />
              )}
            </section>
            {!statistics && selected && detailOpen ? (
              <>
                <button
                  className="panel-handle open"
                  aria-label="상세 패널 접기"
                  onClick={() => setDetailOpen(false)}
                >
                  ‹
                </button>
                <DetailPanel
                  selected={selected}
                  tab={tab}
                  showAllRelations={showAllRelations}
                  selectedRelation={selectedRelation}
                  onTab={(nextTab) => {
                    setTab(nextTab);
                    setSelectedRelation(null);
                    setShowAllRelations(false);
                  }}
                  onSelectCategory={selectCategory}
                  onSelectPlatform={selectPlatform}
                  onSelectRelation={selectRelation}
                />
              </>
            ) : (
              <div className="collapsed-panel">
                <button
                  className="panel-handle"
                  aria-label="상세 패널 펼치기"
                  onClick={() => setDetailOpen(true)}
                >
                  ‹
                </button>
                <span>상세 패널</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
