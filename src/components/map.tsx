'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  color as d3Color,
  range,
  select,
  zoom,
  zoomIdentity,
  type ZoomBehavior,
  type ZoomTransform,
} from 'd3';
import {
  categories,
  getPlatform,
  platforms,
  relations,
  type Category,
  type CategoryId,
  type DetailTab,
  type Selection,
} from '@/lib/fixture';

const hexPoints = range(6)
  .map((index) => {
    const angle = ((index * 60 - 90) * Math.PI) / 180;
    return `${(10.1 * Math.cos(angle)).toFixed(2)},${(10.1 * Math.sin(angle)).toFixed(2)}`;
  })
  .join(' ');

const badgeWidths: Record<CategoryId, number> = {
  code: 90,
  text: 108,
  community: 82,
  cloud: 118,
  files: 92,
  backend: 98,
  release: 94,
  other: 66,
};

function tiles(category: Category) {
  const [cx, cy] = category.center;
  const middle = (category.rows.length - 1) / 2;
  const colSpacing = category.id === 'cloud' ? 19 : 17.6;
  const rowSpacing = category.id === 'code' || category.id === 'text' ? 17.3 : 15.2;
  return category.rows.flatMap((count, row) =>
    range(count).map((col) => ({
      key: `${row}-${col}`,
      x: cx + (col - (count - 1) / 2) * colSpacing + (row % 2 ? colSpacing / 2 : 0),
      y: cy + (row - middle) * rowSpacing,
      row,
      col,
      count,
    })),
  );
}

function tileActive(
  category: Category,
  row: number,
  col: number,
  count: number,
  selected: Selection,
) {
  if (!selected) return true;
  if (selected.kind === 'category') return true;
  const platform = getPlatform(selected.id);
  if (!platform) return true;
  if (selected.id === 'github-gist') {
    if (category.id === 'text') {
      if (row < 2) return col >= Math.floor(count / 2);
      if (row < 5) return col >= 1 && col <= count - 2;
      return col >= Math.floor(count / 2);
    }
    if (category.id === 'cloud') return row < 3 ? col >= Math.floor(count / 2) : col <= 1;
    if (category.id === 'files') return row < 3 ? col >= Math.floor(count / 2) : col === 0;
  }
  if (platform.category !== category.id) return true;
  if (category.id === 'code')
    return row < 2
      ? col % 2 === 0
      : row < 4
        ? col >= 1 && col <= count - 2
        : col >= Math.floor(count / 2) - 1 && col <= Math.floor(count / 2) + 1;
  if (category.id === 'text') return col % 2 === 0 || row % 3 === 0;
  return col % 2 === 0;
}

type Props = {
  selected: Selection;
  tab: DetailTab;
  showAllRelations: boolean;
  selectedRelation: string | null;
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
  onSelectRelation: (id: string | null) => void;
  onClear: () => void;
  onShowAllRelations: () => void;
};

export function EcosystemMap({
  selected,
  tab,
  showAllRelations,
  selectedRelation,
  onSelectCategory,
  onSelectPlatform,
  onSelectRelation,
  onClear,
  onShowAllRelations,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hover, setHover] = useState<CategoryId | null>(null);
  const relation = relations.find((item) => item.id === selectedRelation);
  const showLines = showAllRelations || Boolean(selectedRelation);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = select(svgRef.current);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.65, 2.8])
      .extent([
        [0, 0],
        [846, 614],
      ])
      .translateExtent([
        [-550, -450],
        [1396, 1064],
      ])
      .clickDistance(5)
      .on('zoom', (event) => setTransform(event.transform));
    svg.call(behavior);
    zoomRef.current = behavior;
    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  const zoomBy = (factor: number) => {
    if (svgRef.current && zoomRef.current)
      select(svgRef.current).transition().duration(220).call(zoomRef.current.scaleBy, factor);
  };
  const reset = () => {
    if (svgRef.current && zoomRef.current)
      select(svgRef.current)
        .transition()
        .duration(240)
        .call(zoomRef.current.transform, zoomIdentity);
    onClear();
  };

  const activeId =
    selected?.kind === 'category'
      ? selected.id
      : selected?.kind === 'platform'
        ? getPlatform(selected.id)?.category
        : hover;
  const tileGroups = useMemo(
    () => categories.map((category) => ({ category, cells: tiles(category) })),
    [],
  );

  return (
    <div className="map-surface">
      <div className="map-top-control">
        <button
          className="relation-switch"
          type="button"
          role="switch"
          aria-checked={showAllRelations}
          onClick={onShowAllRelations}
        >
          <span className={`switch-track ${showAllRelations ? 'on' : ''}`}>
            <span />
          </span>
          전체 관계 보기
        </button>
        <span>검증 0건</span>
      </div>
      <svg
        ref={svgRef}
        className="ecosystem-svg"
        viewBox={selected ? '0 0 650 614' : '0 0 846 614'}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="오픈웹 생태계 육각형 지도: 섬과 플랫폼을 선택할 수 있습니다"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClear();
        }}
      >
        <defs>
          <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".55" fill="#d8e0ed" />
          </pattern>
          <filter id="island-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#233856" floodOpacity=".2" />
          </filter>
          <filter id="badge-shadow" x="-20%" y="-40%" width="140%" height="190%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1.5"
              floodColor="#7183a2"
              floodOpacity=".18"
            />
          </filter>
        </defs>
        <rect width="846" height="614" fill="url(#map-dots)" pointerEvents="none" />
        <g transform={`${transform.toString()} translate(${selected ? -75 : 5},0)`}>
          {showLines &&
            relations
              .filter(
                (item) =>
                  item.source === 'github-gist' &&
                  (item.target !== 'mega' || selectedRelation === 'gist-mega') &&
                  (selected?.kind === 'platform' || showAllRelations),
              )
              .map((item, index) => {
                const source = getPlatform(item.source)!;
                const target = getPlatform(item.target)!;
                const active = selectedRelation === item.id;
                const yBend = index === 0 ? -78 : 75;
                const path = `M ${source.x} ${source.y + 5} Q ${(source.x + target.x) / 2} ${(source.y + target.y) / 2 + yBend} ${target.x} ${target.y}`;
                return (
                  <g
                    key={item.id}
                    className="relation-path"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectRelation(item.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') onSelectRelation(item.id);
                    }}
                    aria-label={`${source.name}에서 ${target.name}로의 ${item.type} 후보 관계`}
                  >
                    <path d={path} fill="none" stroke="transparent" strokeWidth="16" />
                    <path
                      d={path}
                      fill="none"
                      stroke={active || index === 0 ? '#f05a16' : '#f8a038'}
                      strokeWidth={active ? 2.8 : index === 0 ? 2 : 1.5}
                      strokeDasharray={active || index === 0 ? undefined : '6 4'}
                    />
                    {active && (
                      <g
                        transform={`translate(${(source.x + target.x) / 2},${(source.y + target.y) / 2 + yBend / 2})`}
                      >
                        <rect x="-33" y="-12" width="66" height="23" rx="11" fill="#f46a18" />
                        <circle cx="-22" cy="-1" r="3" fill="white" />
                        <text x="-15" y="3" fill="white" fontSize="9" fontWeight="700">
                          재게시 2건
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
          {tileGroups.map(({ category, cells }) => {
            const badgeWidth = badgeWidths[category.id];
            const relatedIsland =
              selected?.kind === 'platform' &&
              selected.id === 'github-gist' &&
              (category.id === 'text' || category.id === 'cloud' || category.id === 'files');
            const dimmed =
              activeId !== null &&
              activeId !== undefined &&
              activeId !== category.id &&
              !relatedIsland;
            const clickable = () => onSelectCategory(category.id);
            return (
              <g
                key={category.id}
                opacity={dimmed ? 0.35 : 1}
                onMouseEnter={() => setHover(category.id)}
                onMouseLeave={() => setHover(null)}
              >
                <g
                  className="island-tiles"
                  role="button"
                  tabIndex={0}
                  aria-label={`${category.name} 섬 선택`}
                  onClick={(event) => {
                    event.stopPropagation();
                    clickable();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      clickable();
                    }
                  }}
                >
                  {cells.map((cell) => {
                    const active = tileActive(category, cell.row, cell.col, cell.count, selected);
                    const raised = Boolean(selected && active && !dimmed);
                    const softRelated =
                      selected?.kind === 'platform' &&
                      tab !== 'connections' &&
                      (category.id === 'cloud' || category.id === 'files') &&
                      active;
                    const fillColor = active
                      ? softRelated
                        ? category.id === 'cloud'
                          ? '#a8e2f8'
                          : '#cdb8fa'
                        : category.color
                      : category.light;
                    const tileColor = d3Color(fillColor);
                    const sideDark = tileColor?.darker(1.25).formatHex() ?? fillColor;
                    const sideLight = tileColor?.darker(0.9).formatHex() ?? fillColor;
                    return (
                      <g key={cell.key} transform={`translate(${cell.x},${cell.y})`}>
                        {raised && (
                          <>
                            <polygon
                              points="-8.75,5.05 0,10.1 0,14.6 -8.75,9.55"
                              fill={sideLight}
                            />
                            <polygon points="0,10.1 8.75,5.05 8.75,9.55 0,14.6" fill={sideDark} />
                          </>
                        )}
                        <polygon
                          points={hexPoints}
                          fill={fillColor}
                          stroke={raised ? sideLight : 'white'}
                          strokeWidth={raised ? 0.8 : 1.7}
                          strokeLinejoin="round"
                        />
                      </g>
                    );
                  })}
                </g>
                <g
                  className="island-badge"
                  transform={`translate(${category.badge[0]},${category.badge[1]})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${category.name} ${category.count}건`}
                  onClick={(event) => {
                    event.stopPropagation();
                    clickable();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      clickable();
                    }
                  }}
                >
                  <rect
                    x={-badgeWidth / 2}
                    y="-10"
                    width={badgeWidth}
                    height="21"
                    rx="10"
                    fill="white"
                    stroke="#dde6f2"
                    filter="url(#badge-shadow)"
                  />
                  <circle cx={-badgeWidth / 2 + 10} cy="0" r="3.1" fill={category.color} />
                  <text
                    x={-badgeWidth / 2 + 18}
                    y="3"
                    fontSize={
                      category.id === 'code' || category.id === 'cloud' || category.id === 'backend'
                        ? 8.2
                        : 9
                    }
                    fontWeight="600"
                    fill="#1b2536"
                  >
                    {category.name}
                  </text>
                  <text x={badgeWidth / 2 - 8} y="3" fontSize="9" textAnchor="end" fill="#62718b">
                    {category.count}건
                  </text>
                </g>
                {category.id === 'code' &&
                  selected?.kind === 'category' &&
                  selected.id === 'code' && (
                    <g transform="translate(245,160)">
                      <rect
                        x="-14"
                        y="-8"
                        width="28"
                        height="16"
                        rx="3"
                        fill="white"
                        stroke="#a9b5c8"
                        strokeWidth=".6"
                      />
                      <text textAnchor="middle" y="3" fontSize="9" fontWeight="600" fill="#1e293b">
                        기타
                      </text>
                    </g>
                  )}
                {platforms
                  .filter(
                    (item) =>
                      item.category === category.id &&
                      (item.featured || (selected?.kind === 'platform' && selected.id === item.id)),
                  )
                  .map((platform) => {
                    if (selected && selected.kind === 'category' && selected.id !== category.id)
                      return null;
                    const mapLabel = platform.id === 'github-gist' ? 'GitHub' : platform.name;
                    const width = Math.max(
                      23,
                      mapLabel.length * (/[가-힣]/.test(mapLabel) ? 9 : 5.3) + 10,
                    );
                    return (
                      <g
                        key={platform.id}
                        className="platform-label"
                        transform={`translate(${platform.x},${platform.y})`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${platform.name} 영토 선택`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectPlatform(platform.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelectPlatform(platform.id);
                          }
                        }}
                      >
                        <rect
                          x={-width / 2}
                          y="-8"
                          width={width}
                          height="17"
                          rx="3"
                          fill="#fff"
                          stroke={
                            selected?.kind === 'platform' && selected.id === platform.id
                              ? '#172a4d'
                              : '#a9b5c8'
                          }
                          strokeWidth=".6"
                        />
                        <text
                          textAnchor="middle"
                          y="3.3"
                          fontSize="9.4"
                          fontWeight="600"
                          fill="#1e293b"
                        >
                          {mapLabel}
                        </text>
                      </g>
                    );
                  })}
              </g>
            );
          })}
          {relation && (
            <foreignObject x="435" y="28" width="260" height="320">
              <div className="evidence-card">
                <div className="muted small">선택한 관계 · Evidence</div>
                <h3>
                  {getPlatform(relation.source)?.name} → {getPlatform(relation.target)?.name}{' '}
                  <span className="status-tag good">검증 완료</span>
                </h3>
                <dl>
                  <div>
                    <dt>관계 유형</dt>
                    <dd>{relation.type}</dd>
                  </div>
                  <div>
                    <dt>신뢰도</dt>
                    <dd>{relation.confidence}</dd>
                  </div>
                  <div>
                    <dt>관계 레코드</dt>
                    <dd>{relation.evidence}건</dd>
                  </div>
                  <div>
                    <dt>최초 관측</dt>
                    <dd>{relation.firstSeen}</dd>
                  </div>
                  <div>
                    <dt>최근 관측</dt>
                    <dd>{relation.lastSeen}</dd>
                  </div>
                  <div>
                    <dt>근거</dt>
                    <dd>{relation.note}</dd>
                  </div>
                  <div>
                    <dt>검증</dt>
                    <dd>2026-08-05 · analyst-02</dd>
                  </div>
                </dl>
                <p>출발 리소스&nbsp; gist.github.com/…/a3f9c2</p>
                <p>도착 리소스&nbsp; pastebin.com/raw/7Kd2Vb</p>
                <button type="button" onClick={() => onSelectRelation(null)}>
                  리소스 원문 비교 →
                </button>
              </div>
            </foreignObject>
          )}
        </g>
      </svg>
      {selected?.kind === 'category' && tab === 'connections' && (
        <div className="map-empty-card">
          <strong>섬 사이 연결선이 없습니다</strong>
          <p>
            섬 연결선은 검증 완료된 플랫폼 연결을 다시 집계한 값입니다.
            <br />
            코드 저장소에는 검증 완료 관계가 0건이라 그릴 선이 없습니다.
          </p>
          <button onClick={onShowAllRelations}>후보 관계 3건 검토</button>
          <button className="secondary" onClick={onClear}>
            집계 규칙 보기
          </button>
        </div>
      )}
      {selected?.kind === 'platform' && tab === 'connections' && !relation && !showAllRelations && (
        <div className="map-empty-card">
          <strong>검증 완료된 관계가 없습니다</strong>
          <p>
            GitHub Gist에서 출발하거나 도착하는 관계 중 검증을 끝낸 건이 없어 연결선은 그리지
            않습니다.
            <br />
            후보 3건을 검토해 검증 완료로 바꾸면 지도에 선이 생깁니다.
          </p>
          <button onClick={onShowAllRelations}>후보 관계 3건 검토</button>
          <button className="secondary" onClick={onClear}>
            관계 등록 규칙
          </button>
        </div>
      )}
      <div className="map-bottom-bar">
        <span>
          <i className="hint-dot" />
          {selectedRelation
            ? '선택한 관계선 강조 · 근거(Evidence) 팝업 표시'
            : selected
              ? '플랫폼을 선택해 사건과 외부 연결을 확인하세요'
              : '섬을 선택해 플랫폼 유형을 탐색하세요'}
        </span>
        <div className="map-actions">
          <div className="zoom-buttons">
            <button type="button" aria-label="축소" onClick={() => zoomBy(1 / 1.25)}>
              −
            </button>
            <output>{Math.round(transform.k * 100)}%</output>
            <button type="button" aria-label="확대" onClick={() => zoomBy(1.25)}>
              ＋
            </button>
          </div>
          <button type="button" onClick={reset}>
            ⌗ 전체 보기
          </button>
        </div>
      </div>
    </div>
  );
}
