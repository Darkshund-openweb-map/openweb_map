export type IncidentFields = {
  title: string;
  sourceUrl: string;
  summary: string;
  riskLevel: '' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: '검토중' | '검토완료' | '보류' | '삭제';
  publishedAt: string;
};

export type IncidentDataType = {
  id?: number;
  name: string;
  category: string;
  description: string;
};

export type PlatformConnectionInput = {
  id?: number;
  targetPlatformId: number;
  connectionType: string;
  description: string;
  verificationStatus: 'candidate' | 'verified' | 'excluded';
  confidence: '높음' | '중간' | '낮음' | '미평가';
  evidenceCount: number;
  firstSeen: string;
  lastSeen: string;
};

export type IncidentEditorRecord = IncidentFields & {
  id: number;
  dataTypes: IncidentDataType[];
};

export type PlatformOption = { id: number; name: string };

export type IncidentEditorData = {
  incidents: IncidentEditorRecord[];
  connections: PlatformConnectionInput[];
  platforms: PlatformOption[];
};
