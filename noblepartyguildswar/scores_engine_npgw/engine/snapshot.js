import { buildWars } from './wars.js';
import { buildBwa } from './bwa.js';
import { buildAccess } from './access.js';
import { buildRankings } from './rankings.js';
import { buildPlayerStats } from './stats.js';
import { buildRelationships } from './relationships.js';
import { buildHistory } from './history.js';

/**
 * Una singola fotografia di tutti i risultati NPGW, ricavata solo dal CSV.
 * generatedAt/sourceHash vengono dal chiamante, non influenzano i calcoli.
 */
export function buildSnapshot(parsed, { sourceHash = null, generatedAt = null } = {}) {
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  const bwa = buildBwa(parsed);
  const access = buildAccess(bwa);
  const rankings = buildRankings(parsed, { bwa, access });
  const wars = buildWars(parsed);
  const stats = buildPlayerStats(parsed);
  const relationships = buildRelationships(parsed);
  const issues = [...(Array.isArray(parsed) ? [] : parsed.issues ?? []), ...wars.issues];

  return {
    schemaVersion: 1,
    metadata: {
      source: 'risultati.csv',
      sourceSha256: sourceHash,
      generatedAt,
      rows: rows.length,
      matches: new Set(rows.map(row => row.matchNumber)).size,
      players: Object.keys(bwa.players).length,
      issues,
    },
    parameters: bwa.parameters,
    players: Object.fromEntries(Object.entries(bwa.players).map(([name, player]) => [name, {
      ...player,
      access: access.players[name],
      statistics: stats[name],
      relationships: relationships.profiles[name],
      championWins: rankings.championWins[name] ?? 0,
    }])),
    rankings: {
      categories: rankings.categories,
      finalGuerre: rankings.finalGuerre,
      paladins: rankings.paladins,
      guilds: rankings.guilds,
    },
    wars: {
      official: wars.official,
      sideQuest: wars.sideQuest,
      roadmaps: wars.roadmaps,
    },
    relationships: { together: relationships.together, against: relationships.against },
    history: buildHistory(parsed),
  };
}
