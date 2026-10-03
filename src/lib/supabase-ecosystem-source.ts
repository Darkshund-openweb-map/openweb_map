import 'server-only';

import type { EcosystemSource } from './ecosystem-source';
import { readSupabaseConfig } from './supabase/island-query';
import { queryTableRows } from './supabase/rest-query';
import { createDatabaseSnapshot } from './supabase/database-snapshot';

export const supabaseEcosystemSource: EcosystemSource = {
  async load() {
    const config = readSupabaseConfig(process.env);
    const [islands, platforms, incidents, dataTypes, connections] = await Promise.all([
      queryTableRows(config, 'island', 'id,name'),
      queryTableRows(
        config,
        'platforms',
        'id,island_id,name,domain,description,created_at,updated_at',
      ),
      queryTableRows(
        config,
        'incidents',
        'id,platform_id,title,status,published_at,created_at,updated_at',
      ),
      queryTableRows(
        config,
        'incidents_data_types',
        'id,incident_id,name,category,description,created_at',
      ),
      queryTableRows(
        config,
        'platform_connections',
        'id,incident_id,source_platform_id,target_platform_id,connection_type,description,verification_status,confidence,evidence_count,first_seen,last_seen,verified_at,created_at,updated_at',
      ),
    ]);
    return createDatabaseSnapshot({ islands, platforms, incidents, dataTypes, connections });
  },
};
