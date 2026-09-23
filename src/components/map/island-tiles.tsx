import styles from '@/components/map/map.module.css';
import {
  type Category,
  type DetailTab,
  type Platform,
  type Selection,
} from '@/lib/ecosystem-types';
import { isTileActive, type HexCell } from './geometry';
import { HexTileSides, HexTileTop } from './hex-tile';

type Props = {
  category: Category;
  cells: HexCell[];
  selected: Selection;
  tab: DetailTab;
  dimmed: boolean;
  selectedPlatform?: Platform;
};

function getTileAppearance(
  category: Category,
  cell: HexCell,
  selected: Selection,
  tab: DetailTab,
  dimmed: boolean,
  selectedPlatform?: Platform,
) {
  const active = isTileActive(category, cell, selected, selectedPlatform);
  const raised = Boolean(selected && active && !dimmed);
  const related =
    selected?.kind === 'platform' &&
    tab !== 'connections' &&
    (category.id === 'cloud' || category.id === 'files') &&
    active;
  const fill = active
    ? related
      ? category.id === 'cloud'
        ? '#a8e2f8'
        : '#cdb8fa'
      : category.color
    : category.light;

  return { fill, raised };
}

export function IslandTiles({ category, cells, selected, tab, dimmed, selectedPlatform }: Props) {
  const rendered = cells.map((cell) => ({
    cell,
    ...getTileAppearance(category, cell, selected, tab, dimmed, selectedPlatform),
  }));

  return (
    <>
      <g
        className={styles['island-side-layer']}
        data-map-layer="sides"
        filter="url(#island-shadow)"
      >
        {rendered.map(({ cell, fill, raised }) =>
          raised ? <HexTileSides key={`side-${cell.key}`} cell={cell} fill={fill} /> : null,
        )}
      </g>
      <g className={styles['island-top-layer']} data-map-layer="tops">
        {rendered.map(({ cell, fill }) => (
          <HexTileTop key={`top-${cell.key}`} cell={cell} fill={fill} />
        ))}
      </g>
    </>
  );
}
