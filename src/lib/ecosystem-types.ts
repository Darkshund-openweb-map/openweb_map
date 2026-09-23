export type CategoryId =
  | 'code'
  | 'text'
  | 'community'
  | 'cloud'
  | 'files'
  | 'backend'
  | 'release'
  | 'other';
export type DetailTab = 'overview' | 'events' | 'connections';
export type Selection =
  | { kind: 'category'; id: CategoryId }
  | { kind: 'platform'; id: string }
  | null;
export type RelationStatus = 'verified' | 'candidate' | 'excluded';

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  light: string;
  count: number;
  badge: [number, number];
  center: [number, number];
  rows: number[];
  description: string;
}

export interface Platform {
  id: string;
  name: string;
  aliases?: string[];
  category: CategoryId;
  x: number;
  y: number;
  domain: string;
  description: string;
  featured?: boolean;
}

export interface Relation {
  id: string;
  source: string;
  target: string;
  type: string;
  status: RelationStatus;
  confidence: '높음' | '중간' | '낮음';
  evidence: number;
  firstSeen: string;
  lastSeen: string;
  note: string;
}

export interface EcosystemEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  meta: string;
  platform: string;
  exposures: string[];
}

export interface ExposureRow {
  name: string;
  heat: number;
  count: number;
  date: string;
  state: string;
}

export type EcosystemSnapshot = {
  updatedAt: string;
  categories: Category[];
  platforms: Platform[];
  relations: Relation[];
  events: EcosystemEvent[];
  exposureRows: ExposureRow[];
};
