import { color as d3Color } from 'd3';
import { HEX_POINTS, type HexCell } from './geometry';

type Props = { cell: HexCell; fill: string; onSelect: () => void };

export function HexTileSides({
  cell,
  fill,
  depth,
  edges,
  onSelect,
}: Props & { depth: number; edges: { left: boolean; right: boolean } }) {
  const tileColor = d3Color(fill);
  const left = tileColor?.darker(0.75).formatHex() ?? fill;
  const right = tileColor?.darker(1.25).formatHex() ?? fill;
  return (
    <g
      transform={`translate(${cell.x},${cell.y - depth})`}
      aria-hidden="true"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {edges.left && (
        <polygon points={`-8.75,5.05 0,10.1 0,${10.1 + depth} -8.75,${5.05 + depth}`} fill={left} />
      )}
      {edges.right && (
        <polygon points={`0,10.1 8.75,5.05 8.75,${5.05 + depth} 0,${10.1 + depth}`} fill={right} />
      )}
    </g>
  );
}

export function HexTileTop({
  cell,
  fill,
  elevation = 0,
  onSelect,
}: Props & { elevation?: number }) {
  return (
    <polygon
      transform={`translate(${cell.x},${cell.y - elevation})`}
      data-cell-key={cell.key}
      data-elevation={elevation}
      points={HEX_POINTS}
      fill={fill}
      stroke="#ffffff"
      strokeWidth="1.1"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    />
  );
}
