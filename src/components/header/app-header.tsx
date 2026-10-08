// 브랜드·탐색 범위·검색 기능을 제공하는 애플리케이션 상단 헤더 컴포넌트
'use client';

import styles from '@/styles/explorer.module.css';
import { type CategoryId } from '@/lib/ecosystem-types';
import type { Scope } from '@/types/explorer';
import { useEcosystemSearch } from '@/hooks/use-ecosystem-search';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { BrandMark } from './brand-mark';
import { HexSwatch } from '@/components/legend/hex-swatch';

const CONNECTED_MAP_URL = 'https://d4rkn3ttz-collaboration.github.io/Connection-Map/';
const DARK_WEB_URL = 'https://darkchoco-map.darkchoco.workers.dev/';

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return text;
  const index = text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

type Props = {
  scope: Scope;
  onScope: (scope: Scope) => void;
  onHome: () => void;
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
  onSelectIncident: (platformId: string, incidentId: string) => void;
  onSelectRelation: (relationId: string) => void;
};

export function AppHeader({
  scope,
  onScope,
  onHome,
  onSelectCategory,
  onSelectPlatform,
  onSelectIncident,
  onSelectRelation,
}: Props) {
  const { updatedAt } = useEcosystemData();
  const {
    query,
    open,
    activeIndex,
    results,
    regionRef,
    inputRef,
    setQuery,
    setOpen,
    setActiveIndex,
    choose,
  } = useEcosystemSearch({
    onSelectCategory,
    onSelectPlatform,
    onSelectIncident,
    onSelectRelation,
  });
  return (
    <header className={styles['app-header']}>
      <button className={styles['brand']} onClick={onHome} aria-label="WEB SCOPE 전체 오픈웹으로">
        <BrandMark />
        <span>
          <strong>WEB SCOPE</strong>
          <small>ECOSYSTEM MAP</small>
        </span>
      </button>
      <span className={styles['header-divider']} />
      <nav className={styles['scope-tabs']} aria-label="탐색 영역">
        {[
          { id: 'open' as const, name: '오픈웹', color: '#176bfa' },
          { id: 'connected' as const, name: '연결', color: '#8053e9' },
          { id: 'dark' as const, name: '다크웹', color: '#df2f4b' },
        ].map((item) => (
          <button
            key={item.id}
            className={scope === item.id ? styles['active'] : ''}
            aria-current={scope === item.id ? 'page' : undefined}
            onClick={() => {
              if (item.id === 'connected' || item.id === 'dark') {
                window.location.assign(item.id === 'connected' ? CONNECTED_MAP_URL : DARK_WEB_URL);
                return;
              }
              onScope(item.id);
            }}
          >
            <i style={{ background: item.color }} />
            {item.name}
          </button>
        ))}
      </nav>
      <div className={styles['header-spacer']} />
      <span className={styles['database-date']}>DB {updatedAt}</span>
      <div className={styles['search-region']} ref={regionRef}>
        <div className={styles['search-input-wrap']}>
          <span>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex(Math.min(results.length - 1, activeIndex + 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex(Math.max(0, activeIndex - 1));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                choose(activeIndex);
              }
            }}
            placeholder="노드 · 키워드 · 엔티티 검색"
            aria-label="노드 · 키워드 · 엔티티 검색"
            role="combobox"
            aria-expanded={open}
            aria-controls="search-results"
            aria-autocomplete="list"
          />
        </div>
        {open && (
          <div className={styles['search-results']} id="search-results" role="listbox">
            <div className={styles['search-results-title']}>
              {query ? `관련 검색어 ${results.length}개` : '빠른 검색'}
              <span>ESC 닫기</span>
            </div>
            <div className={styles['search-result-list']}>
              {results.length ? (
                results.map((item, index) => (
                  <div className={styles['search-result-group']} key={item.key}>
                    {query && (index === 0 || results[index - 1].kind !== item.kind) && (
                      <div className={styles['search-kind-title']}>
                        {item.kind === 'incident'
                          ? '사건'
                          : item.kind === 'relation'
                            ? '연결관계'
                            : '플랫폼'}
                      </div>
                    )}
                    <button
                      role="option"
                      data-search-kind={item.kind}
                      aria-selected={index === activeIndex}
                      className={index === activeIndex ? styles['active'] : ''}
                      onClick={() => choose(index)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <HexSwatch color={item.color} />
                      <span>
                        <strong>
                          <HighlightMatch text={item.label} query={query} />
                        </strong>
                        <small>
                          <HighlightMatch text={item.sub} query={query} />
                        </small>
                      </span>
                      <span>↗</span>
                    </button>
                  </div>
                ))
              ) : (
                <p>검색 결과가 없습니다.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
