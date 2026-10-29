const SCALE = 4;
type LabelTheme = 'light' | 'dark';

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character];
  });
}

export function mapLabelArtwork({
  text,
  color,
  width,
  height,
  count,
  highlighted = false,
  theme = 'dark',
}: {
  text: string;
  color: string;
  width: number;
  height: number;
  count?: string;
  highlighted?: boolean;
  theme?: LabelTheme;
}): string {
  const radius = count === undefined ? 8 : 16;
  const label = escapeXml(text);
  const background = theme === 'dark' ? '#202632' : highlighted ? color : '#ffffff';
  const border = theme === 'dark' ? '#8994a5' : highlighted ? color : '#dce5f1';
  const textColor = theme === 'dark' ? color : highlighted ? '#ffffff' : color;
  const countColor = theme === 'dark' ? '#e5eaf2' : highlighted ? '#ffffff' : '#42526a';
  const lettering = count === undefined
    ? `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${14.5 * SCALE}" font-weight="${highlighted ? 800 : 700}" fill="${textColor}">${label}</text>`
    : `<text x="${18 * SCALE}" y="50%" dominant-baseline="central" text-anchor="start" font-size="${14.5 * SCALE}" font-weight="${highlighted ? 800 : 700}" fill="${textColor}">${label}<tspan dx="${9 * SCALE}" font-size="${12.5 * SCALE}" font-weight="600" fill="${countColor}">${escapeXml(count)}</tspan></text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * SCALE}" height="${height * SCALE}" viewBox="0 0 ${width * SCALE} ${height * SCALE}">
    <rect x="${SCALE}" y="${SCALE}" width="${(width - 2) * SCALE}" height="${(height - 2) * SCALE}" rx="${radius * SCALE}" fill="${background}" stroke="${highlighted ? color : border}" stroke-width="${highlighted ? 1.5 * SCALE : SCALE}"/>
    <g font-family="Arial, Noto Sans KR, Malgun Gothic, sans-serif">${lettering}</g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function mapPlatformArtwork({
  labels,
  color,
  x,
  y,
  width,
  height,
  theme = 'dark',
}: {
  labels: { text: string; x: number; y: number; width: number; highlighted: boolean }[];
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  theme?: LabelTheme;
}): string {
  const background = theme === 'dark' ? '#202632' : '#ffffff';
  const border = theme === 'dark' ? '#8994a5' : '#e6ecf4';
  const textColor = theme === 'dark' ? color : '#1e293b';
  const artwork = labels.map((label) => {
    const left = (label.x - x - label.width / 2) * SCALE;
    const top = (label.y - y - 11) * SCALE;
    const centerX = (label.x - x) * SCALE;
    const centerY = (label.y - y) * SCALE;
    return `<rect x="${left}" y="${top}" width="${label.width * SCALE}" height="${22 * SCALE}" rx="${8 * SCALE}" fill="${background}" stroke="${label.highlighted ? color : border}" stroke-width="${label.highlighted ? 1.5 * SCALE : SCALE}"/>
      <text x="${centerX}" y="${centerY}" dominant-baseline="central" text-anchor="middle" font-size="${14.5 * SCALE}" font-weight="${label.highlighted ? 800 : 700}" fill="${textColor}">${escapeXml(label.text)}</text>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * SCALE}" height="${height * SCALE}" viewBox="0 0 ${width * SCALE} ${height * SCALE}">
    <rect width="100%" height="100%" fill="${background}" opacity="0.005"/>
    <g font-family="Arial, Noto Sans KR, Malgun Gothic, sans-serif">${artwork}</g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
