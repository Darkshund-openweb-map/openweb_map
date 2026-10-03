// 플랫폼 사이의 검증·후보 관계선을 지도에 그리는 컴포넌트
import styles from '@/styles/map.module.css';
import type { Selection } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { MAP_ELEVATION } from './geometry';

type Props = {
  selected: Selection;
  activePlatformIds: Set<string>;
  platformAnchors: Map<string, { x: number; y: number }>;
  selectedRelation: string | null;
  onSelectRelation: (id: string | null) => void;
};

export function RelationLayer({
  selected,
  activePlatformIds,
  platformAnchors,
  selectedRelation,
  onSelectRelation,
}: Props) {
  const { relations, getPlatform } = useEcosystemData();

  if (selected?.kind !== 'platform') return null;

  return relations
    .filter(
      (item) =>
        item.status !== 'excluded' &&
        (item.source === selected.id || item.target === selected.id),
    )
    .map((item, index) => {
      const source = getPlatform(item.source);
      const target = getPlatform(item.target);
      if (!source || !target) return null;
      const sourceAnchor = platformAnchors.get(source.id) ?? source;
      const targetAnchor = platformAnchors.get(target.id) ?? target;
      const sourceRaised = activePlatformIds.has(source.id);
      const targetRaised = activePlatformIds.has(target.id);
      const sourcePoint = {
        x: sourceAnchor.x,
        y: sourceAnchor.y - (sourceRaised ? MAP_ELEVATION : 0),
      };
      const targetPoint = {
        x: targetAnchor.x,
        y: targetAnchor.y - (targetRaised ? MAP_ELEVATION : 0),
      };
      const active = selectedRelation === item.id;
      const yBend = index % 2 === 0 ? -48 : 48;
      const midX = (sourcePoint.x + targetPoint.x) / 2;
      const midY = (sourcePoint.y + targetPoint.y) / 2;
      const path = `M ${sourcePoint.x} ${sourcePoint.y} Q ${midX} ${midY + yBend} ${targetPoint.x} ${targetPoint.y}`;
      return (
        <g
          key={item.id}
          className={styles['relation-path']}
          data-relation-id={item.id}
          data-source-x={sourcePoint.x}
          data-source-y={sourcePoint.y}
          data-target-x={targetPoint.x}
          data-target-y={targetPoint.y}
          onClick={(event) => {
            event.stopPropagation();
            onSelectRelation(item.id);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectRelation(item.id);
            }
          }}
          aria-label={`${source.name}에서 ${target.name}로의 ${item.type} ${item.status === 'verified' ? '검증' : '후보'} 관계`}
        >
          <path d={path} fill="none" stroke="transparent" strokeWidth="16" />
          <path
            d={path}
            fill="none"
            stroke={active || index === 0 ? '#f05a16' : '#f8a038'}
            strokeWidth={active ? 2.8 : index === 0 ? 2 : 1.5}
            strokeDasharray={item.status === 'verified' ? undefined : '6 4'}
          />
          {active && (
            <g
              transform={`translate(${midX},${midY + yBend / 2})`}
            >
              <rect x="-33" y="-12" width="66" height="23" rx="11" fill="#f46a18" />
              <circle cx="-22" cy="-1" r="3" fill="white" />
              <text x="-15" y="3" fill="white" fontSize="9" fontWeight="700">
                {item.type} {item.evidence}건
              </text>
            </g>
          )}
        </g>
      );
    });
}
