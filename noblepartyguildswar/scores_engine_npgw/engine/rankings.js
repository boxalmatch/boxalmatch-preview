import { CLASSES, GUILDS, MATCH_CATEGORIES } from '../config/config.js';
import { buildBwa } from './bwa.js';
import { buildAccess } from './access.js';

const AWARDS = ['Guerre', ...MATCH_CATEGORIES.filter(category => category !== 'Champions'), 'Champions', 'Viaggiatore'];
const orderedNames = names => [...names].sort((a, b) => a.localeCompare(b, 'it'));

/** One row per exact score, with all tied names in that row. */
function rank(entries, { includeZero = false } = {}) {
  const sorted = entries
    .filter(entry => Number.isFinite(entry.score) && (includeZero || entry.score > 0))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'it'));
  const ranks = [];
  for (const entry of sorted) {
    const previous = ranks.at(-1);
    if (previous && previous.score === entry.score) {
      previous.players.push(entry.name);
    } else {
      ranks.push({ rank: ranks.length + 1, score: entry.score, players: [entry.name] });
    }
  }
  for (const row of ranks) row.players = orderedNames(row.players);
  return ranks;
}

const perClass = entries => Object.fromEntries(CLASSES.map(cls =>
  [cls, rank(entries.filter(entry => entry.class === cls))]
));

/**
 * Classifiche calcolate solo da Risultati.csv.
 * - Parimeriti con BWA numericamente identico (mai arrotondato per ordinare).
 * - Champions: un punto per primo posto soltanto da Partecipante.
 * - Paladini: esclusione del Leader Principale della relativa Gilda.
 * - Guerre: Viaggiatori visibili durante la stagione; esclusi solo dalla finale.
 * - Gilde: media ponderata delle medie BWA dei Leader e Mercenari qualificati,
 *   minimo due Leader e tre Mercenari.
 */
export function buildRankings(parsed, { bwa = null, access = null } = {}) {
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  const model = bwa ?? buildBwa(parsed);
  const progress = access ?? buildAccess(model);
  const players = Object.values(model.players);

  const championWins = Object.fromEntries(players.map(player => [player.player, 0]));
  for (const row of rows) {
    if (row.category === 'Champions' && row.status === 'Partecipante' && row.ranking === 1) {
      championWins[row.player] = (championWins[row.player] ?? 0) + 1;
    }
  }

  const categories = {};
  for (const category of AWARDS) {
    if (category === 'Champions') {
      categories.Champions = perClass(players.map(player => ({
        name: player.player, class: player.class, score: championWins[player.player],
      })));
      continue;
    }
    const matching = players.filter(player =>
      category === 'Viaggiatore' ? player.viaggiatore.eligible : player.categories[category].eligible
    );
    categories[category] = perClass(matching.map(player => ({
      name: player.player, class: player.class,
      score: category === 'Viaggiatore' ? player.viaggiatore.bwa : player.categories[category].bwa,
    })));
  }

  const provisionalGuerre = categories.Guerre;
  const finalGuerre = perClass(players.filter(player =>
    player.categories.Guerre.eligible && !player.viaggiatore.eligible
  ).map(player => ({ name: player.player, class: player.class, score: player.categories.Guerre.bwa })));

  const paladins = {};
  const guildScores = [];
  for (const [guild, config] of Object.entries(GUILDS)) {
    const eligible = players.filter(player => player.guilds[guild].eligible);
    paladins[guild] = perClass(eligible.filter(player => player.player !== config.leader)
      .map(player => ({ name: player.player, class: player.class, score: player.guilds[guild].bwa })));

    const leaders = eligible.filter(player => player.class === 'Leader');
    const mercenaries = eligible.filter(player => player.class === 'Mercenario');
    const qualified = leaders.length >= 2 && mercenaries.length >= 3;
    const leaderAverage = leaders.length ? leaders.reduce((sum, player) => sum + player.guilds[guild].bwa, 0) / leaders.length : null;
    const mercAverage = mercenaries.length ? mercenaries.reduce((sum, player) => sum + player.guilds[guild].bwa, 0) / mercenaries.length : null;
    const score = qualified ? (leaderAverage * leaders.length + mercAverage * mercenaries.length) / (leaders.length + mercenaries.length) : null;
    guildScores.push({ guild, score, eligible: qualified, leaderAverage, mercAverage,
      leaderCount: leaders.length, mercenaryCount: mercenaries.length });
  }

  const guildRanking = rank(guildScores.map(entry => ({ name: entry.guild, score: entry.score })));
  const annotatedGuerre = Object.fromEntries(CLASSES.map(cls => [cls,
    provisionalGuerre[cls].map(row => ({ ...row, labels: Object.fromEntries(row.players
      .filter(name => progress.players[name]?.viaggiatoreLabel)
      .map(name => [name, progress.players[name].viaggiatoreLabel])) }))
  ]));

  return {
    categories: { ...categories, Guerre: annotatedGuerre },
    finalGuerre,
    paladins,
    guilds: { ranking: guildRanking, details: Object.fromEntries(guildScores.map(s => [s.guild, s])) },
    championWins,
  };
}
