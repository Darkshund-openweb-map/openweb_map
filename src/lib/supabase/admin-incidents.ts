import 'server-only';

import type {
  IncidentDataType,
  IncidentEditorData,
  IncidentFields,
  PlatformConnectionInput,
} from '@/lib/incident-editor-types';
import { adminRequest } from './admin-rest';

function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function optionalId(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const id = positiveId(value);
  if (!id) throw new Error('레코드 ID가 올바르지 않습니다.');
  return id;
}

function text(value: unknown, max: number, label: string, required = false): string {
  if (typeof value !== 'string') throw new Error(`${label} 값이 올바르지 않습니다.`);
  const trimmed = value.trim();
  if ((required && !trimmed) || trimmed.length > max)
    throw new Error(`${label} 값을 확인해 주세요.`);
  return trimmed;
}

function calendarDate(value: unknown, label: string): string {
  const result = text(value, 10, label);
  if (result && (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`))))
    throw new Error(`${label}이 올바르지 않습니다.`);
  return result;
}

export function parseIncidentMutation(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('사건 입력값이 올바르지 않습니다.');
  const body = value as Record<string, unknown>;
  const platformId = positiveId(body.platformId);
  if (!platformId) throw new Error('플랫폼 ID가 올바르지 않습니다.');
  const incidentId = optionalId(body.incidentId);
  const raw = body.incident;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('사건 입력값이 올바르지 않습니다.');
  const incident = raw as Record<string, unknown>;
  const title = text(incident.title, 200, '사건 제목', true);
  const sourceUrl = text(incident.sourceUrl, 2000, '출처 URL');
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      throw new Error('출처 URL은 http 또는 https 주소로 입력해 주세요.');
    }
  }
  const riskLevel = text(incident.riskLevel, 20, '위험도');
  if (riskLevel && !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(riskLevel))
    throw new Error('위험도가 올바르지 않습니다.');
  const status = text(incident.status, 20, '상태', true);
  if (!['검토중', '검토완료', '보류', '삭제'].includes(status))
    throw new Error('상태가 올바르지 않습니다.');
  const publishedAt = text(incident.publishedAt, 10, '게시일');
  if (
    publishedAt &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt) ||
      Number.isNaN(Date.parse(`${publishedAt}T00:00:00Z`)))
  )
    throw new Error('게시일이 올바르지 않습니다.');
  const fields: IncidentFields = {
    title,
    sourceUrl,
    summary: text(incident.summary, 10000, '요약'),
    riskLevel: riskLevel as IncidentFields['riskLevel'],
    status: status as IncidentFields['status'],
    publishedAt,
  };
  if (!Array.isArray(body.dataTypes) || body.dataTypes.length > 50)
    throw new Error('노출 유형 목록이 올바르지 않습니다.');
  const dataTypes: IncidentDataType[] = body.dataTypes.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      throw new Error('노출 유형 입력값이 올바르지 않습니다.');
    const row = entry as Record<string, unknown>;
    return {
      id: optionalId(row.id),
      name: text(row.name, 200, '노출 유형 이름', true),
      category: text(row.category, 200, '노출 유형 분류'),
      description: text(row.description, 2000, '노출 유형 설명'),
    };
  });
  let connections: PlatformConnectionInput[] | null = null;
  if (body.connections !== null && body.connections !== undefined) {
    if (!Array.isArray(body.connections) || body.connections.length > 50)
      throw new Error('플랫폼 연결 목록이 올바르지 않습니다.');
    connections = body.connections.map((entry: unknown) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry))
        throw new Error('플랫폼 연결 입력값이 올바르지 않습니다.');
      const row = entry as Record<string, unknown>;
      const targetPlatformId = positiveId(row.targetPlatformId);
      if (!targetPlatformId || targetPlatformId === platformId)
        throw new Error('연결 대상 플랫폼을 선택해 주세요.');
      const verificationStatus = text(row.verificationStatus, 20, '검증 상태', true);
      if (!['candidate', 'verified', 'excluded'].includes(verificationStatus))
        throw new Error('검증 상태가 올바르지 않습니다.');
      const confidence = text(row.confidence, 20, '신뢰도', true);
      if (!['높음', '중간', '낮음', '미평가'].includes(confidence))
        throw new Error('신뢰도가 올바르지 않습니다.');
      const evidenceCount = row.evidenceCount;
      if (typeof evidenceCount !== 'number' || !Number.isSafeInteger(evidenceCount) || evidenceCount < 0)
        throw new Error('관계 레코드 수가 올바르지 않습니다.');
      const firstSeen = calendarDate(row.firstSeen, '최초 관측일');
      const lastSeen = calendarDate(row.lastSeen, '최근 관측일');
      if (firstSeen && lastSeen && firstSeen > lastSeen)
        throw new Error('최근 관측일은 최초 관측일보다 빠를 수 없습니다.');
      return {
        id: optionalId(row.id),
        targetPlatformId,
        connectionType: text(row.connectionType, 200, '연결 유형', true),
        description: text(row.description, 2000, '연결 설명'),
        verificationStatus: verificationStatus as PlatformConnectionInput['verificationStatus'],
        confidence: confidence as PlatformConnectionInput['confidence'],
        evidenceCount,
        firstSeen,
        lastSeen,
      };
    });
  }
  return { platformId, incidentId, fields, dataTypes, connections };
}

export async function loadIncidentEditorData(platformId: number): Promise<IncidentEditorData> {
  const [incidentRows, connectionRows, platformRows] = await Promise.all([
    adminRequest(
      `incidents?platform_id=eq.${platformId}&select=id,title,source_url,summary,risk_level,status,published_at,created_at&order=id.desc`,
      { method: 'GET' },
    ),
    adminRequest(
      `platform_connections?source_platform_id=eq.${platformId}&select=id,incident_id,target_platform_id,connection_type,description,verification_status,confidence,evidence_count,first_seen,last_seen&order=id.asc`,
      { method: 'GET' },
    ),
    adminRequest('platforms?select=id,name&order=name.asc', { method: 'GET' }),
  ]);
  if (
    !Array.isArray(incidentRows) ||
    !Array.isArray(connectionRows) ||
    !Array.isArray(platformRows)
  )
    throw new Error('관리자 데이터 응답이 올바르지 않습니다.');
  const ids = incidentRows.map((row) => row.id).filter(positiveId);
  const typeRows = ids.length
    ? await adminRequest(
        `incidents_data_types?incident_id=in.(${ids.join(',')})&select=id,incident_id,name,category,description&order=id.asc`,
        { method: 'GET' },
      )
    : [];
  if (!Array.isArray(typeRows)) throw new Error('노출 유형 응답이 올바르지 않습니다.');
  return {
    incidents: incidentRows.map((row) => ({
      id: row.id,
      title: row.title ?? '',
      sourceUrl: row.source_url ?? '',
      summary: row.summary ?? '',
      riskLevel: row.risk_level ?? '',
      status: row.status ?? '검토중',
      publishedAt: (row.published_at ?? '').slice(0, 10),
      dataTypes: typeRows
        .filter((item) => item.incident_id === row.id)
        .map((item) => ({
          id: item.id,
          name: item.name ?? '',
          category: item.category ?? '',
          description: item.description ?? '',
        })),
      connections: connectionRows
        .filter((connection) => connection.incident_id === row.id)
        .map((connection) => ({
          id: connection.id,
          targetPlatformId: connection.target_platform_id,
          connectionType: connection.connection_type ?? '',
          description: connection.description ?? '',
          verificationStatus: connection.verification_status ?? 'candidate',
          confidence: connection.confidence ?? '미평가',
          evidenceCount: connection.evidence_count ?? 0,
          firstSeen: (connection.first_seen ?? '').slice(0, 10),
          lastSeen: (connection.last_seen ?? '').slice(0, 10),
        })),
    })),
    platforms: platformRows.map((row) => ({ id: row.id, name: row.name })),
  };
}

export async function saveIncident(input: ReturnType<typeof parseIncidentMutation>) {
  const result = await adminRequest('rpc/admin_save_incident', {
    method: 'POST',
    body: JSON.stringify({
      p_platform_id: input.platformId,
      p_incident_id: input.incidentId ?? null,
      p_incident: {
        title: input.fields.title,
        source_url: input.fields.sourceUrl,
        summary: input.fields.summary,
        risk_level: input.fields.riskLevel,
        status: input.fields.status,
        published_at: input.fields.publishedAt,
      },
      p_data_types: input.dataTypes,
      p_connections:
        input.connections?.map((row) => ({
          id: row.id ?? null,
          target_platform_id: row.targetPlatformId,
          connection_type: row.connectionType,
          description: row.description,
          verification_status: row.verificationStatus,
          confidence: row.confidence,
          evidence_count: row.evidenceCount,
          first_seen: row.firstSeen,
          last_seen: row.lastSeen,
        })) ?? null,
    }),
  });
  if (!positiveId(result)) throw new Error('저장된 사건 ID를 확인할 수 없습니다.');
  return result;
}

export async function deleteIncident(platformId: number, incidentId: number) {
  const result = await adminRequest('rpc/admin_delete_incident', {
    method: 'POST',
    body: JSON.stringify({ p_platform_id: platformId, p_incident_id: incidentId }),
  });
  if (result !== true) throw new Error('삭제할 사건을 찾을 수 없습니다.');
}
