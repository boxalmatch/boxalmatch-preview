import { GUILDS, OFFICIAL_WARS, SIDE_QUEST_SLOTS } from '../config/config.js';

const unique = values => [...new Set(values)];
const sorted = values => [...values].sort((a, b) => a.localeCompare(b, 'it'));
const sameMembers = (a, b) => sorted(a).join('|') === sorted(b).join('|');

function groupBy(values, key) {
  const result = new Map();
  for (const item of values) {
    const k = key(item);
    if (!result.has(k)) result.set(k, []);
    result.get(k).push(item);
  }
  return result;
}

function summarizeMatch(matchNumber, rows, canonicalArmies, issues) {
  const guilds = unique(rows.map(r => r.guild));
  const modes = unique(rows.map(r => r.mode));
  const categories = unique(rows.map(r => r.category));
  const actualArmies = [1, 2].map(id => unique(rows.filter(r => r.army === id).map(r => r.guild)));
  const winners = unique(rows.filter(r => r.ranking === 1).map(r => r.guild));
  const earningArmies = canonicalArmies.map((army, index) => ({ index: index + 1, receivesPoint: army.some(g => winners.includes(g)) }));
  if (modes.length !== 1 || categories.length !== 1) issues.push({ code: 'INCONSISTENT_MATCH', matchNumber });
  if (!canonicalArmies.every(army => army.every(g => guilds.includes(g)))) issues.push({ code: 'MISSING_GUILD_IN_MATCH', matchNumber });
  if (actualArmies.some(a => a.length === 0)) issues.push({ code: 'MISSING_ARMY_IN_MATCH', matchNumber });
  if (!winners.length) issues.push({ code: 'NO_FIRST_PLACE', matchNumber });
  return {
    matchNumber, name: rows[0].eventName, date: rows[0].date,
    category: categories[0], mode: modes[0],
    armies: actualArmies, guilds, winners,
    points: earningArmies.map(a => Number(a.receivesPoint)),
    isTie: earningArmies.every(a => a.receivesPoint),
    players: rows.map(r => ({ name: r.player, guild: r.guild, army: r.army,
      status: r.status, ranking: r.ranking, points: r.points, class: r.class })),
  };
}

function calculateWar(chapter, type, rows, configuredArmies, issues) {
  const matches = groupBy(rows, r => r.matchNumber);
  const earliestMatch = Math.min(...rows.map(r => r.matchNumber));
  const actualArmies = [1, 2].map(id => unique(rows.filter(r => r.army === id).map(r => r.guild)));
  const armies = configuredArmies ?? actualArmies;
  if (!sameMembers(actualArmies[0], armies[0]) && !sameMembers(actualArmies[0], armies[1])) {
    issues.push({ code: 'ARMY_MISMATCH', chapter, detail: 'Armate CSV diverse dalla configurazione' });
  }
  if (configuredArmies && !actualArmies.every(a => armies.some(expected => sameMembers(a, expected)))) {
    issues.push({ code: 'ARMY_MISMATCH', chapter });
  }
  if (armies[0].length !== armies[1].length) issues.push({ code: 'UNBALANCED_ARMIES', chapter });
  if (matches.size !== 4) issues.push({ code: 'EXPECTED_FOUR_MATCHES', chapter, actual: matches.size });
  const games = [...matches.entries()].sort((a, b) => a[0] - b[0])
    .map(([id, participants]) => summarizeMatch(id, participants, armies, issues));
  const score = [0, 0];
  for (const game of games) game.points.forEach((value, i) => { score[i] += value; });
  return { chapter, type, earliestMatch, armies, guildsPerArmy: armies[0].length,
    campaigns: [...new Set(rows.map(r => r.campaign))],
    games, score, tiedGames: games.filter(g => g.isTie).length,
    played: true };
}

export function buildWars(parsed) {
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  const issues = [];
  const grouped = groupBy(rows, r => `${r.campaignType}\0${r.chapter}`);
  const played = [...grouped.values()].map(warRows => {
    const { chapter, campaignType } = warRows[0];
    const config = campaignType === 'Primaria' ? OFFICIAL_WARS.find(w => w.chapter === chapter) : null;
    return calculateWar(chapter, campaignType, warRows, config?.armies, issues);
  }).sort((a, b) => a.earliestMatch - b.earliestMatch);

  const official = OFFICIAL_WARS.map(w => {
    const match = played.find(x => x.type === 'Primaria' && x.chapter === w.chapter);
    return match ? { ...match, order: w.order } : {
      chapter: w.chapter, order: w.order, type: 'Primaria', armies: w.armies,
      guildsPerArmy: w.armies[0].length, played: false,
      games: [], score: null, tiedGames: 0,
    };
  });
  const sideQuest = played.filter(w => w.type === 'Side Quest');
  const roadmaps = {};
  for (const guild of Object.keys(GUILDS)) {
    const slots = SIDE_QUEST_SLOTS.map(slot => ({ ...slot, war: null }));
    const participating = sideQuest.filter(w => w.armies.some(a => a.includes(guild)));
    const unassignedWars = [];
    for (const war of participating) {
      const free = slots.find(slot => !slot.war && slot.guildsPerArmy === war.guildsPerArmy);
      if (free) free.war = war.chapter;
      else unassignedWars.push(war.chapter);
    }
    roadmaps[guild] = {
      guild, officialCampaign: GUILDS[guild].official, sideQuestCampaign: GUILDS[guild].sideQuest,
      official: official.filter(w => w.armies.some(a => a.includes(guild))).map(w => w.chapter),
      slots, unassignedWars, // Valide nell'archivio, non occupano altri slot.
    };
  }
  return { official, sideQuest, played, roadmaps, issues };
}
