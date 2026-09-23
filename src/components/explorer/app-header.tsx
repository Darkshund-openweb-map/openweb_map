'use client';

import styles from '@/components/explorer/explorer.module.css';
import { type CategoryId } from '@/lib/ecosystem-types';
import type { Scope } from './types';
import { useEcosystemSearch } from './use-ecosystem-search';
import { useEcosystemData } from './ecosystem-data-context';

function BrandMark() {
  return (
    <span className={styles['brand-mark']} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function HexSwatch({ color }: { color: string }) {
  return <span className={styles['legend-hex']} style={{ background: color }} />;
}

type Props = {
  scope: Scope;
  onScope: (scope: Scope) => void;
  onHome: () => void;
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
};

export function AppHeader({ scope, onScope, onHome, onSelectCategory, onSelectPlatform }: Props) {
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
  } = useEcosystemSearch({ onSelectCategory, onSelectPlatform });
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
            onClick={() => onScope(item.id)}
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
          <kbd>⌘K</kbd>
        </div>
        {open && (
          <div className={styles['search-results']} id="search-results" role="listbox">
            <div className={styles['search-results-title']}>
              {query ? `검색 결과 ${results.length}개` : '빠른 검색'}
              <span>ESC 닫기</span>
            </div>
            {results.length ? (
              results.map((item, index) => (
                <button
                  role="option"
                  aria-selected={index === activeIndex}
                  key={item.key}
                  className={index === activeIndex ? styles['active'] : ''}
                  onClick={() => choose(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <HexSwatch color={item.color} />
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
  );
}
