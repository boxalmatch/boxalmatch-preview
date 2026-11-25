import { GUILDS, MATCH_CATEGORIES, MODES } from '../config/config.js';

const COMPOSITIONS = [
  '1 Leader + Support',
  'Support only',
  '2 or more Leaders + Support',
  'Leaders only',
];

const fromList = keys => Object.fromEntries(keys.map(k => [k, 0]));
const add = (target, key) => { target[key] = (target[key] ?? 0) + 1; };

function isPenalty(ec) {
  const value = ec?.trim();
  return !!value && Number(value.replace(',', '.')) !== 0;
}

/** Statistiche cumulative senza calcoli BWA; ogni riga è una presenza. */
export function buildPlayerStats(parsed) {
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  const has2LSupport = new Map();
  for (const row of rows) {
    if (row.twoLeaderSupport === 'Yes') has2LSupport.set(row.matchNumber, true);
  }

  const players = {};
  for (const r of rows) {
    if (!players[r.player]) {
      players[r.player] = {
        player: r.player, class: r.class,
        appearances: 0, participant: 0, bench: 0,
        placements: fromList(['1', '2', '3', '4', 'lower']),
        categories: fromList(MATCH_CATEGORIES),
        guilds: fromList(Object.keys(GUILDS)),
        modes: fromList(MODES), compositions: fromList(COMPOSITIONS),
        equipmentGA: 0, penaltiesEC: 0, unbalancedGuild: 0,
        heartGuilds: [],
      };
    }
    const s = players[r.player];
    s.appearances++;
    if (r.status === 'Partecipante') {
      s.participant++;
    } else if (r.status === 'Panchina') s.bench++;
    // Il piazzamento appartiene anche alla Panchina. La vittoria Champions
    // resta una regola separata: conta solo il primo posto da Partecipante.
    add(s.placements, r.ranking >= 1 && r.ranking <= 4 ? String(r.ranking) : 'lower');
    add(s.categories, r.category);
    add(s.guilds, r.guild);
    add(s.modes, r.mode);
    add(s.compositions, r.raw['Class PP']);
    if (r.raw.GA === 'Yes') s.equipmentGA++;
    if (isPenalty(r.raw.EC)) s.penaltiesEC++;
    if (r.twoLeaderSupport === 'No' && has2LSupport.get(r.matchNumber)) s.unbalancedGuild++;
  }
  for (const s of Object.values(players)) {
    const max = Math.max(...Object.values(s.guilds));
    s.heartGuilds = max > 0 ? Object.keys(s.guilds).filter(g => s.guilds[g] === max) : [];
  }
  return players;
}
