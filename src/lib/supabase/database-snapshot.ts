import type { EcosystemEvent, EcosystemSnapshot, Platform, Relation } from '../ecosystem-types';
import { createIslandCategories, parseIslandRows } from '../island-categories';
import { fitIslandForPlatforms, platformSlot } from '../platform-layout';

type Row = Record<string, unknown>;
export type DatabaseRows = {
  islands: unknown[];
  platforms: unknown[];
  incidents: unknown[];
  dataTypes: unknown[];
  connections: unknown[];
};

function records(value: unknown[], table: string): Row[] {
  const ids = new Set<number>();
  return value.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`${table} 응답 형식이 올바르지 않습니다.`);
    }
    const record = row as Row;
    const id = numericId(record.id);
    if (ids.has(id)) throw new Error(`${table} 조회 결과에 중복 ID가 있습니다.`);
    ids.add(id);
    return record;
  });
}

function numericId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new Error('DB 레코드 ID가 올바르지 않습니다.');
  }
  return value;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function requiredText(value: unknown, field: string): string {
  const result = text(value);
  if (!result) throw new Error(`${field} 값이 비어 있습니다.`);
  return result;
}

function date(value: unknown): string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return '';
  return value.slice(0, 10);
}

const platformId = (value: unknown) => `platform-${numericId(value)}`;

export function createDatabaseSnapshot(data: DatabaseRows): EcosystemSnapshot {
  let categories = createIslandCategories(parseIslandRows(data.islands));
  const platformRows = records(data.platforms, 'platforms');
  const incidentRows = records(data.incidents, 'incidents');
  const typeRows = records(data.dataTypes, 'incidents_data_types');
  const connectionRows = records(data.connections, 'platform_connections');

  categories = categories.map((category) =>
    fitIslandForPlatforms(
      category,
      platformRows.filter((row) => row.island_id === category.sourceId).length,
    ),
  );
  const platforms: Platform[] = categories.flatMap((category) => {
    const rows = platformRows.filter((row) => row.island_id === category.sourceId);
    return rows.map((row, index) => ({
      id: platformId(row.id),
      category: category.id,
      name: requiredText(row.name, 'platforms.name'),
      domain: text(row.domain),
      description: text(row.description),
      featured: true,
      ...platformSlot(category, index, rows.length),
    }));
  });
  const platformsById = new Map(platforms.map((platform) => [platform.id, platform]));
  const exposuresByIncident = new Map<number, Set<string>>();
  for (const row of typeRows) {
    const incidentId = numericId(row.incident_id);
    const names = exposuresByIncident.get(incidentId) ?? new Set<string>();
    const name = text(row.name, text(row.category));
    if (name) names.add(name);
    exposuresByIncident.set(incidentId, names);
  }

  const events: EcosystemEvent[] = incidentRows
    .flatMap((row) => {
      const platform = platformsById.get(platformId(row.platform_id));
      if (!platform) return [];
      const eventDate = date(row.published_at) || date(row.created_at);
      if (!eventDate) throw new Error('incidents에 유효한 사건 날짜가 없습니다.');
      const exposures = [...(exposuresByIncident.get(numericId(row.id)) ?? [])];
      return [
        {
          id: `incident-${row.id}`,
          platform: platform.id,
          title: requiredText(row.title, 'incidents.title'),
          type: text(row.status, '등록'),
          date: eventDate,
          meta: [platform.name, exposures.join(' · ')].filter(Boolean).join(' · '),
          exposures,
        },
      ];
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

  const relations = connectionRows.flatMap<Relation>((row) => {
    const source = platformId(row.source_platform_id);
    const target = platformId(row.target_platform_id);
    if (!platformsById.has(source) || !platformsById.has(target)) return [];
    return [
      {
        id: `connection-${row.id}`,
        source,
        target,
        type: requiredText(row.connection_type, 'platform_connections.connection_type'),
        // 현재 테이블에는 검증·신뢰도·근거 수가 없어 임의로 검증 완료 처리하지 않는다.
        status: 'candidate',
        confidence: '미평가',
        evidence: 0,
        firstSeen: '—',
        lastSeen: '—',
        note: '근거 정보 미제공',
      },
    ];
  });

  const exposureNames = [...new Set(events.flatMap((event) => event.exposures))];
  const exposureRows = exposureNames
    .map((name) => {
      const matching = events.filter((event) => event.exposures.includes(name));
      return {
        name,
        count: matching.length,
        heat: events.length ? Math.round((matching.length / events.length) * 100) : 0,
        date: matching[0].date.slice(5),
        state: matching[0].type,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
  const timestamps = [...platformRows, ...incidentRows, ...typeRows, ...connectionRows]
    .flatMap((row) => [date(row.updated_at), date(row.created_at)])
    .filter(Boolean)
    .sort();

  return {
    updatedAt: timestamps.at(-1) ?? new Date().toISOString().slice(0, 10),
    readOnly: true,
    categories: categories.map((category) => ({
      ...category,
      count: events.filter((event) => platformsById.get(event.platform)?.category === category.id)
        .length,
    })),
    platforms,
    events,
    relations,
    exposureRows,
  };
}
