import 'server-only';

import type { EcosystemSource } from './ecosystem-source';
import { categories, platforms, relations, events, exposureRows } from './fixture';

export const fixtureEcosystemSource: EcosystemSource = {
  async load() {
    return { updatedAt: '2026-09-20', categories, platforms, relations, events, exposureRows };
  },
};
