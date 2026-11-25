import { ACCESS, CLASSES, GUILDS, MATCH_CATEGORIES } from '../config/config.js';

const CATEGORIES = ['Guerre', ...MATCH_CATEGORIES];
const empty = () => ({ points: 0, appearances: 0 });

function median(numbers) {
  const sorted = numbers.filter(n => n > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function performance(totals, parameter, eligible) {
  const { points, appearances } = totals;
  const { L, k } = parameter;
  const rawBwa = k + appearances > 0 ? (L * k + points) / (k + appearances) : null;
  return { points, appearances, L, k, eligible, rawBwa, bwa: eligible ? rawBwa : 0 };
}

/**
 * Calcola L, k e tutte le performance partendo unicamente dalle righe CSV.
 * Tutte le presenze (Partecipante e Panchina) contribuiscono a X e Y.
 * L usa X/Y di tutta la classe; k e' la mediana delle presenze positive
 * per giocatore (i giocatori non qualificati rimangono inclusi).
 * Il campo `bwa` e' mascherato a 0 prima dell'accesso; `rawBwa` conserva
 * il valore matematico senza arrotondamenti per le verifiche.
 */
export function buildBwa(parsed) {
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  const players = {};
  for (const row of rows) {
    if (!CLASSES.includes(row.class)) throw new Error(`Classe sconosciuta: ${row.class}`);
    if (!MATCH_CATEGORIES.includes(row.category)) throw new Error(`Categoria sconosciuta: ${row.category}`);
    if (!(row.guild in GUILDS)) throw new Error(`Gilda sconosciuta: ${row.guild}`);
    if (!Number.isFinite(row.points)) throw new Error(`Punti non validi: ${row.player}, partita ${row.matchNumber}`);
    const player = players[row.player] ??= {
      player: row.player,
      class: row.class,
      totals: Object.fromEntries(CATEGORIES.map(category => [category, empty()])),
      guildTotals: Object.fromEntries(Object.keys(GUILDS).map(guild => [guild, empty()])),
    };
    if (player.class !== row.class) throw new Error(`Classe incoerente per ${row.player}`);
    for (const total of [player.totals.Guerre, player.totals[row.category], player.guildTotals[row.guild]]) {
      total.points += row.points;
      total.appearances++;
    }
  }

  const parameters = Object.fromEntries(CLASSES.map(playerClass => {
    const members = Object.values(players).filter(p => p.class === playerClass);
    const categories = Object.fromEntries(CATEGORIES.map(category => {
      const X = members.reduce((sum, p) => sum + p.totals[category].points, 0);
      const Y = members.reduce((sum, p) => sum + p.totals[category].appearances, 0);
      return [category, { X, Y, L: Y ? X / Y : 0, k: median(members.map(p => p.totals[category].appearances)) }];
    }));
    return [playerClass, categories];
  }));

  for (const p of Object.values(players)) {
    const parameter = parameters[p.class];
    const sketch = p.totals.Sketch.appearances >= ACCESS.Sketch;
    const standard = p.totals.Standard.appearances >= ACCESS.Standard;
    const social = p.totals.Social.appearances >= ACCESS.Social;
    const guerre = sketch && standard && social;
    const guildAccess = Object.fromEntries(Object.entries(p.guildTotals)
      .map(([guild, total]) => [guild, total.appearances >= ACCESS.guild]));
    const viaggiatore = guerre && Object.values(guildAccess).every(Boolean);

    p.categories = Object.fromEntries(CATEGORIES.map(category => {
      const eligible = category === 'Guerre' ? guerre
        : category === 'Champions' ? p.totals.Champions.appearances >= 1
        : p.totals[category].appearances >= ACCESS[category];
      return [category, performance(p.totals[category], parameter[category], eligible)];
    }));
    p.guilds = Object.fromEntries(Object.entries(p.guildTotals)
      .map(([guild, total]) => [guild, performance(total, parameter.Guerre, guildAccess[guild])]));
    p.viaggiatore = { ...p.categories.Guerre, eligible: viaggiatore,
      bwa: viaggiatore ? p.categories.Guerre.rawBwa : 0 };
    p.access = { ...Object.fromEntries(Object.entries(p.categories).map(([category, value]) => [category, value.eligible])),
      guilds: guildAccess, Viaggiatore: viaggiatore };
    delete p.totals;
    delete p.guildTotals;
  }

  return { parameters, players };
}
