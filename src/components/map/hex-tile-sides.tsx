// 선택된 육각 타일의 입체적인 좌우 측면을 그리는 컴포넌트
import { color as d3Color } from 'd3';
import { type HexCell } from './geometry';

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
