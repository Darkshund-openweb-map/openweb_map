import { color as d3Color } from 'd3';
import { HEX_POINTS, type HexCell } from './geometry';

type Props = {
  cell: HexCell;
  fill: string;
};

export function HexTileSides({ cell, fill }: Props) {
  const tileColor = d3Color(fill);
  const left = tileColor?.darker(0.8).formatHex() ?? fill;
  const right = tileColor?.darker(1.35).formatHex() ?? fill;

  return (
    <g transform={`translate(${cell.x},${cell.y})`} aria-hidden="true">
      <polygon points="-8.75,5.05 0,10.1 0,15.1 -8.75,10.05" fill={left} />
      <polygon points="0,10.1 8.75,5.05 8.75,10.05 0,15.1" fill={right} />
    </g>
  );
}

export function HexTileTop({ cell, fill }: Props) {
  return (
    <polygon
      transform={`translate(${cell.x},${cell.y})`}
      points={HEX_POINTS}
      fill={fill}
      stroke="#ffffff"
      strokeWidth="1.15"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}
