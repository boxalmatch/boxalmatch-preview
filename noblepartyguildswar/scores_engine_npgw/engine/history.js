import { GUILDS, MATCH_CATEGORIES } from '../config/config.js';
import { buildBwa } from './bwa.js';
import { buildAccess } from './access.js';
import { buildRankings } from './rankings.js';

const CATEGORIES = ['Guerre', ...MATCH_CATEGORIES, 'Viaggiatore'];
const guildNames = Object.keys(GUILDS);

function playerRank(rows, playerName) {
  for (const entry of rows ?? []) if (entry.players.includes(playerName)) return entry.rank;
  return null;
}

function guildRank(rows, guild) {
  for (const entry of rows ?? []) if (entry.players.includes(guild)) return entry.rank;
  return null;
}

/**
 * Fotografia immediatamente DOPO ogni partita (tutte le sue righe in blocco).
 * Anche chi non gioca viene ricalcolato: L e k della classe possono cambiare.
 * Nessun arrotondamento interno; null indica assenza di accesso/classifica.
 */
export function buildHistory(parsed) {
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  const byMatch = new Map();
  for (const row of rows) {
    if (!byMatch.has(row.matchNumber)) byMatch.set(row.matchNumber, []);
    byMatch.get(row.matchNumber).push(row);
  }
  const ordered = [...byMatch.entries()].sort((a, b) => a[0] - b[0]);
  const accumulated = [];
  const matches = [], players = {}, guilds = Object.fromEntries(guildNames.map(name => [name, []]));

  for (const [matchNumber, matchRows] of ordered) {
    accumulated.push(...matchRows);
    const bwa = buildBwa(accumulated);
    const access = buildAccess(bwa);
    const ranks = buildRankings(accumulated, { bwa, access });
    const first = matchRows[0];
    matches.push({ matchNumber, chapter: first.chapter, name: first.eventName, date: first.date,
      category: first.category, mode: first.mode });
    for (const [name, player] of Object.entries(bwa.players)) {
      if (!players[name]) players[name] = [];
      const categoryProgress = {};
      for (const category of CATEGORIES) {
        const value = category === 'Viaggiatore' ? player.viaggiatore : player.categories[category];
        const categoryRank = ranks.categories[category]?.[player.class];
        categoryProgress[category] = {
          appearances: value.appearances,
          eligible: value.eligible,
          bwa: value.eligible ? value.rawBwa : null,
          rank: value.eligible ? playerRank(categoryRank, name) : null,
        };
      }
      const guildProgress = {};
      for (const guild of guildNames) {
        const value = player.guilds[guild];
        guildProgress[guild] = {
          appearances: value.appearances,
          eligible: value.eligible,
          bwa: value.eligible ? value.rawBwa : null,
          // Il ranking personale per Gilda è quello dei Paladini (esclude il Leader Principale).
          paladinRank: value.eligible ? playerRank(ranks.paladins[guild]?.[player.class], name) : null,
        };
      }
      players[name].push({ matchNumber, participated: matchRows.some(row => row.player === name),
        categories: categoryProgress, guilds: guildProgress });
    }
    for (const guild of guildNames) {
      const detail = ranks.guilds.details[guild];
      guilds[guild].push({ matchNumber, eligible: detail.eligible,
        bwa: detail.eligible ? detail.score : null,
        rank: detail.eligible ? guildRank(ranks.guilds.ranking, guild) : null });
    }
  }
  return { matches, players, guilds };
}
