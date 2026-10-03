// 생태계 섬을 구성하는 단일 육각 타일의 윗면을 그리는 컴포넌트
import { HEX_POINTS, type HexCell } from './geometry';

type Props = {
  cell: HexCell;
  fill: string;
  owner?: string;
  onHoverOwner: (owner: string | null) => void;
  onSelect: () => void;
};

export function HexTileTop({
  cell,
  fill,
  owner,
  elevation = 0,
  onHoverOwner,
  onSelect,
}: Props & { elevation?: number }) {
  return (
    <polygon
      transform={`translate(${cell.x},${cell.y - elevation})`}
      data-cell-key={cell.key}
      data-elevation={elevation}
      data-owner-id={owner}
      points={HEX_POINTS}
      fill={fill}
      stroke="#ffffff"
      strokeWidth="1.1"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      onPointerEnter={() => onHoverOwner(owner ?? null)}
      onPointerLeave={() => onHoverOwner(null)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    />
  );
}
