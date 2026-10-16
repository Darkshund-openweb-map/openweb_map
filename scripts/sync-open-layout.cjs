// Publish the current 2D open-web territories to the 3D layout table.
// Run from the repository root: node scripts/sync-open-layout.cjs [--write]
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = require('node:fs').readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

process.loadEnvFile(path.resolve('.env'));

const { createIslandCategories } = require('../src/lib/island-categories.ts');
const { layoutIslandPlatforms } = require('../src/lib/platform-layout.ts');
const { getSizedCategoryTiles, HEX_COLUMN_GAP, HEX_ROW_GAP } = require('../src/lib/hex-layout.ts');
const { getPlatformTileQuotas, assignTerritoryCells, BASE_ISLAND_TILES } = require('../src/lib/island-territories.ts');

const COLORS = {
  code: '#457AFF', marketplace: '#ECBB22', text: '#2ABFAF',
  backend: '#38CB6E', official: '#976CF7', files: '#4BC4F9',
  community: '#FA812E',
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !publicKey) throw new Error('Supabase URL or publishable key is missing');
const projectRef = new URL(url).hostname.split('.')[0];
if (process.env.ADMIN_WRITE_PROJECT_REF !== projectRef)
  throw new Error('Supabase project does not match ADMIN_WRITE_PROJECT_REF');

async function getRows(table, columns) {
  const response = await fetch(`${url}/rest/v1/${table}?select=${columns}&limit=1000`, {
    headers: { apikey: publicKey },
  });
  if (!response.ok) throw new Error(`${table} read failed: ${response.status}`);
  return response.json();
}

async function writeRows(rows) {
  if (!secretKey) throw new Error('SUPABASE_SECRET_KEY is missing');
  const response = await fetch(`${url}/rest/v1/open_layout?on_conflict=territory_id`, {
    method: 'POST',
    headers: {
      apikey: secretKey,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`open_layout write failed: ${response.status} ${await response.text()}`);
  const ids = rows.map((row) => row.territory_id);
  const stale = await fetch(`${url}/rest/v1/open_layout?territory_id=not.in.(${ids.join(',')})`, {
    method: 'DELETE', headers: { apikey: secretKey },
  });
  if (!stale.ok) throw new Error(`open_layout stale-row cleanup failed: ${stale.status} ${await stale.text()}`);
}

async function main() {
  const [islands, platformRows, incidentRows] = await Promise.all([
    getRows('island', 'id,name'),
    getRows('platforms', 'id,island_id,name'),
    getRows('incidents', 'id,platform_id'),
  ]);
  const categories = createIslandCategories(islands);
  const events = incidentRows.map((row) => ({ platform: `platform-${row.platform_id}` }));
  const now = new Date();
  const asOf = now.toISOString();
  const quarter = `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
  const rows = [];
  const occupied = new Set();

  for (const initialCategory of categories) {
    const members = platformRows
      .filter((row) => row.island_id === initialCategory.sourceId)
      .sort((a, b) => a.id - b.id);
    if (!members.length) continue;
    const layout = layoutIslandPlatforms(initialCategory, members.map((row) => row.name));
    const category = layout.category;
    const platforms = members.map((row, i) => ({
      id: `platform-${row.id}`, name: row.name, category: category.id, ...layout.positions[i],
    }));
    const sorted = [...platforms].sort((a, b) => b.x - a.x || a.y - b.y || a.id.localeCompare(b.id));
    const quotas = getPlatformTileQuotas(sorted, events);
    const tileCount = quotas.length ? quotas.reduce((sum, quota) => sum + quota.count, 0) : BASE_ISLAND_TILES;
    const cells = getSizedCategoryTiles(category, tileCount);
    const owners = assignTerritoryCells(cells, quotas, sorted);
    const anchor = cells[0];
    const baseR = Math.round(anchor.y / HEX_ROW_GAP);
    const baseQ = Math.round(anchor.x / HEX_COLUMN_GAP - baseR / 2);
    const byPlatform = new Map(platforms.map((platform) => [platform.id, []]));

    for (const cell of cells) {
      const localR = Math.round((cell.y - anchor.y) / HEX_ROW_GAP);
      const localQ = Math.round((cell.x - anchor.x) / HEX_COLUMN_GAP - localR / 2);
      const pair = [baseQ + localQ, baseR + localR];
      const key = pair.join(',');
      if (occupied.has(key)) throw new Error(`Overlapping axial cell: ${key}`);
      occupied.add(key);
      const owner = owners.get(cell.key);
      if (!owner) throw new Error(`Unowned cell: ${category.id}/${cell.key}`);
      byPlatform.get(owner).push(pair);
    }

    for (const platform of platforms) {
      const territoryCells = byPlatform.get(platform.id);
      if (!territoryCells.length) throw new Error(`Empty territory: ${platform.id}`);
      rows.push({
        territory_id: platform.id,
        web: 'open',
        island_id: category.id.toUpperCase(),
        island_name: category.name,
        territory_name: platform.name,
        aliases: [],
        kind: category.name,
        cells: territoryCells,
        color: COLORS[category.id],
        quarter,
        as_of: asOf,
      });
    }
  }

  if (rows.length !== platformRows.length) throw new Error(`Expected ${platformRows.length} platforms, got ${rows.length}`);
  if (occupied.size > 4000) throw new Error('3D layout exceeds 4000 cells');
  if (process.argv.includes('--write')) await writeRows(rows);
  console.log(JSON.stringify({ project: new URL(url).hostname.split('.')[0], rows: rows.length, cells: occupied.size, quarter, wrote: process.argv.includes('--write'), islands: Object.fromEntries(Object.entries(COLORS).map(([id, color]) => [id, { color, territories: rows.filter((row) => row.island_id === id.toUpperCase()).length }])) }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
