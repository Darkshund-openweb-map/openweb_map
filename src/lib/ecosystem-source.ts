import type { EcosystemSnapshot } from './ecosystem-types';

export interface EcosystemSource {
  load(): Promise<EcosystemSnapshot>;
}
