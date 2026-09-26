// 생태계 섬을 구성하는 단일 육각 타일의 윗면을 그리는 컴포넌트
import { HEX_POINTS, type HexCell } from './geometry';

type Props = { cell: HexCell; fill: string; onSelect: () => void };

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
