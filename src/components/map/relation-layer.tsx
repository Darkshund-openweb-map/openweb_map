// 플랫폼 사이의 검증·후보 관계선을 지도에 그리는 컴포넌트
import styles from '@/styles/map.module.css';
import type { Selection } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';

type Props = {
  selected: Selection;
  showAllRelations: boolean;
  selectedRelation: string | null;
  onSelectRelation: (id: string | null) => void;
};

export function RelationLayer({
  selected,
  showAllRelations,
  selectedRelation,
  onSelectRelation,
}: Props) {
  const { relations, getPlatform } = useEcosystemData();

  return relations
    .filter(
      (item) =>
        (item.status === 'verified' ||
          (showAllRelations && item.status !== 'excluded') ||
          item.id === selectedRelation) &&
        (!selected ||
          (selected.kind === 'platform'
            ? item.source === selected.id || item.target === selected.id
            : getPlatform(item.source)?.category === selected.id ||
              getPlatform(item.target)?.category === selected.id)),
    )
    .map((item, index) => {
      const source = getPlatform(item.source);
      const target = getPlatform(item.target);
      if (!source || !target) return null;
      const active = selectedRelation === item.id;
      const yBend = index === 0 ? -78 : 75;
      const path = `M ${source.x} ${source.y + 5} Q ${(source.x + target.x) / 2} ${(source.y + target.y) / 2 + yBend} ${target.x} ${target.y}`;
      return (
        <g
          key={item.id}
          className={styles['relation-path']}
          data-relation-id={item.id}
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
              transform={`translate(${(source.x + target.x) / 2},${(source.y + target.y) / 2 + yBend / 2})`}
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
