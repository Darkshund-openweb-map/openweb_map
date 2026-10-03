import type {
  EcosystemEvent,
  EcosystemSnapshot,
  IncidentDataType,
  Platform,
  Relation,
} from '../ecosystem-types';
import { createIslandCategories, parseIslandRows } from '../island-categories';
import { layoutIslandPlatforms } from '../platform-layout';
import { aggregateExposures } from '../event-aggregates';
import { exposureCategory } from '../exposure-categories';

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

  const islandGroups = categories.map((category) => {
    const rows = platformRows
      .filter((row) => row.island_id === category.sourceId)
      .sort((a, b) => numericId(a.id) - numericId(b.id));
    const layout = layoutIslandPlatforms(
      category,
      rows.map((row) => requiredText(row.name, 'platforms.name')),
    );
    return { ...layout, rows };
  });
  categories = islandGroups.map((group) => group.category);
  const platforms: Platform[] = islandGroups.flatMap(({ category, rows, positions }) => {
    return rows.map((row, index) => ({
      id: platformId(row.id),
      category: category.id,
      name: requiredText(row.name, 'platforms.name'),
      domain: text(row.domain),
      description: text(row.description),
      featured: true,
      ...positions[index],
    }));
  });
  const platformsById = new Map(platforms.map((platform) => [platform.id, platform]));
  const exposuresByIncident = new Map<number, Set<string>>();
  const dataTypesByIncident = new Map<number, IncidentDataType[]>();
  for (const row of typeRows) {
    const incidentId = numericId(row.incident_id);
    const exposures = exposuresByIncident.get(incidentId) ?? new Set<string>();
    const category = exposureCategory(row.category);
    exposures.add(category);
    exposuresByIncident.set(incidentId, exposures);
    const details = dataTypesByIncident.get(incidentId) ?? [];
    details.push({
      id: `incident-data-type-${numericId(row.id)}`,
      name: text(row.name),
      category,
      // 유형은 사건별로 중복 제거하지만 상세 이름·설명은 각 DB 행을 보존한다.
      description: typeof row.description === 'string' ? row.description : '',
    });
    dataTypesByIncident.set(incidentId, details);
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
          dataTypes: dataTypesByIncident.get(numericId(row.id)) ?? [],
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
        recordedAt: date(row.created_at) || undefined,
        note: '근거 정보 미제공',
      },
    ];
  });

  const exposureRows = aggregateExposures(events);
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
