import type { EcosystemEvent, Platform } from './ecosystem-types';
import type { HexCell } from './hex-layout';

export const MAX_ISLAND_TILES = 80;
export const BASE_ISLAND_TILES = 38;
export const BASE_TILES_PER_PLATFORM = 4;

export function getTerritoryCenters(cells: HexCell[], owners: Map<string, string>) {
  const totals = new Map<string, { x: number; y: number; count: number }>();
  for (const cell of cells) {
    const owner = owners.get(cell.key);
    if (!owner) continue;
    const total = totals.get(owner) ?? { x: 0, y: 0, count: 0 };
    total.x += cell.x;
    total.y += cell.y;
    total.count += 1;
    totals.set(owner, total);
  }
  return new Map(
    Array.from(totals, ([id, total]) => [
      id,
      { x: total.x / total.count, y: total.y / total.count },
    ]),
  );
}

export function getPlatformTileQuotas(platforms: Platform[], events: EcosystemEvent[]) {
  if (!platforms.length) return [];
  const incidents = new Map<string, number>();
  for (const event of events)
    incidents.set(event.platform, (incidents.get(event.platform) ?? 0) + 1);

  const sharedBase = platforms.map(
    (_, index) =>
      Math.floor(BASE_ISLAND_TILES / platforms.length) +
      (index < BASE_ISLAND_TILES % platforms.length ? 1 : 0),
  );
  const guaranteed = BASE_ISLAND_TILES + platforms.length * BASE_TILES_PER_PLATFORM;
  if (guaranteed > MAX_ISLAND_TILES) {
    // 플랫폼이 아주 많을 때도 80칸 상한 안에서 기본 영토를 균등하게 나눈다.
    return platforms.map((platform, index) => ({
      id: platform.id,
      count:
        Math.floor(MAX_ISLAND_TILES / platforms.length) +
        (index < MAX_ISLAND_TILES % platforms.length ? 1 : 0),
    }));
  }

  const extras = platforms.map((platform) => Math.floor((incidents.get(platform.id) ?? 0) / 2));
  const available = MAX_ISLAND_TILES - guaranteed;
  const requested = extras.reduce((sum, value) => sum + value, 0);
  if (requested <= available)
    return platforms.map((platform, index) => ({
      id: platform.id,
      count: sharedBase[index] + BASE_TILES_PER_PLATFORM + extras[index],
    }));

  const shares = extras.map((value) => (value * available) / requested);
  const assigned = shares.map(Math.floor);
  let remainder = available - assigned.reduce((sum, value) => sum + value, 0);
  const order = shares
    .map((value, index) => ({ index, fraction: value - assigned[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const item of order) {
    if (!remainder) break;
    assigned[item.index] += 1;
    remainder -= 1;
  }
  return platforms.map((platform, index) => ({
    id: platform.id,
    count: sharedBase[index] + BASE_TILES_PER_PLATFORM + assigned[index],
  }));
}

export function assignTerritoryCells(
  cells: HexCell[],
  quotas: { id: string; count: number }[],
  platforms: Platform[],
) {
  const platformById = new Map(platforms.map((platform) => [platform.id, platform]));
  const slots = quotas.flatMap((quota) => Array.from({ length: quota.count }, () => quota.id));
  if (!slots.length) return new Map<string, string>();

  // 동일 플랫폼의 슬롯을 필요한 칸 수만큼 만들고, 전체 이동 거리가 최소가 되게
  // 칸과 슬롯을 일대일 대응한다. 이름 주변에 조밀한 보로노이형 영토가 생긴다.
  const size = cells.length;
  const rowPotential = Array(size + 1).fill(0) as number[];
  const columnPotential = Array(size + 1).fill(0) as number[];
  const matchedRow = Array(size + 1).fill(0) as number[];
  const previousColumn = Array(size + 1).fill(0) as number[];
  for (let row = 1; row <= size; row += 1) {
    matchedRow[0] = row;
    let column = 0;
    const minimum = Array(size + 1).fill(Infinity) as number[];
    const used = Array(size + 1).fill(false) as boolean[];
    do {
      used[column] = true;
      const currentRow = matchedRow[column];
      let delta = Infinity;
      let nextColumn = 0;
      for (let candidate = 1; candidate <= size; candidate += 1) {
        if (used[candidate]) continue;
        const platform = platformById.get(slots[candidate - 1]);
        const cell = cells[currentRow - 1];
        const cost = platform ? (cell.x - platform.x) ** 2 + (cell.y - platform.y) ** 2 : 0;
        const reduced = cost - rowPotential[currentRow] - columnPotential[candidate];
        if (reduced < minimum[candidate]) {
          minimum[candidate] = reduced;
          previousColumn[candidate] = column;
        }
        if (minimum[candidate] < delta) {
          delta = minimum[candidate];
          nextColumn = candidate;
        }
      }
      for (let candidate = 0; candidate <= size; candidate += 1) {
        if (used[candidate]) {
          rowPotential[matchedRow[candidate]] += delta;
          columnPotential[candidate] -= delta;
        } else minimum[candidate] -= delta;
      }
      column = nextColumn;
    } while (matchedRow[column] !== 0);
    do {
      const previous = previousColumn[column];
      matchedRow[column] = matchedRow[previous];
      column = previous;
    } while (column !== 0);
  }

  const owners = new Map<string, string>();
  for (let column = 1; column <= size; column += 1)
    owners.set(cells[matchedRow[column] - 1].key, slots[column - 1]);
  return owners;
}
