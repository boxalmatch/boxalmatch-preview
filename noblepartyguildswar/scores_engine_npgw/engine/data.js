import { CAMPAIGN_ALIASES, CLASSES, GUILDS, MATCH_CATEGORIES, MODES, OFFICIAL_WARS } from '../config/config.js';

// Lettore CSV RFC4180 minimale: virgolette, virgole e ritorni a capo nei campi.
export function parseCsv(source) {
  const table = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(x => x !== '')) table.push(row);
      row = [];
    } else field += c;
  }
  if (quoted) throw new Error('CSV: virgolette non chiuse');
  if (field !== '' || row.length) { row.push(field); table.push(row); }
  return table;
}

const required = ['match n.', 'Data', 'Player', 'Classe', 'Gilda', 'points', 'Capitolo', 'Campagna', 'Campagna Type', 'Note', 'Categoria', 'Mode', 'Ranking', '2L Support Point', 'Armata'];
const official = new Set(OFFICIAL_WARS.map(w => w.chapter));
const sideCampaigns = new Set(Object.values(GUILDS).map(g => g.sideQuest));
const officialCampaigns = new Set(Object.values(GUILDS).map(g => g.official));

function number(value) {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function readResults(csv) {
  const table = parseCsv(csv.replace(/^\uFEFF/, ''));
  if (!table.length) throw new Error('CSV vuoto');
  const headers = table[0];
  const missing = required.filter(name => !headers.includes(name));
  if (missing.length) throw new Error(`Colonne mancanti: ${missing.join(', ')}`);
  const issues = [], rows = [];
  const seen = new Set();
  const guildNames = new Set(Object.keys(GUILDS));
  for (let i = 1; i < table.length; i++) {
    const values = table[i];
    if (values.length !== headers.length) { issues.push({ row: i + 1, code: 'COLUMN_COUNT', detail: `${values.length}/${headers.length}` }); continue; }
    const raw = {};
    let factor = 0;
    headers.forEach((name, ix) => { raw[name === 'Factor' ? `Factor_${++factor}` : name] = values[ix].trim(); });
    const matchNumber = number(raw['match n.']);
    const points = number(raw.points);
    const ranking = number(raw.Ranking);
    const army = number(raw.Armata);
    const category = raw.Categoria === 'Special' ? 'Champions' : raw.Categoria;
    const status = raw.Note === 'Spettatore' ? 'Panchina' : raw.Note;
    const campaign = CAMPAIGN_ALIASES[raw.Campagna] ?? raw.Campagna;
    const type = raw['Campagna Type'];
    const key = `${matchNumber}\0${raw.Player}`;
    if (seen.has(key)) issues.push({ row: i + 1, code: 'DUPLICATE_PLAYER_MATCH', detail: `${matchNumber} / ${raw.Player}` });
    seen.add(key);
    if (!Number.isInteger(matchNumber) || matchNumber < 1) issues.push({ row: i + 1, code: 'BAD_MATCH_NUMBER' });
    if (points === null) issues.push({ row: i + 1, code: 'BAD_POINTS' });
    if (!Number.isInteger(ranking) || ranking < 1 || ranking > 8) issues.push({ row: i + 1, code: 'BAD_RANKING' });
    if (army !== 1 && army !== 2) issues.push({ row: i + 1, code: 'BAD_ARMY' });
    if (!guildNames.has(raw.Gilda)) issues.push({ row: i + 1, code: 'UNKNOWN_GUILD', detail: raw.Gilda });
    if (!CLASSES.includes(raw.Classe)) issues.push({ row: i + 1, code: 'UNKNOWN_CLASS' });
    if (!MATCH_CATEGORIES.includes(category)) issues.push({ row: i + 1, code: 'UNKNOWN_CATEGORY' });
    if (!MODES.includes(raw.Mode)) issues.push({ row: i + 1, code: 'UNKNOWN_MODE' });
    if (!['Partecipante', 'Panchina'].includes(status)) issues.push({ row: i + 1, code: 'UNKNOWN_STATUS' });
    if (type === 'Primaria' && !officialCampaigns.has(campaign)) issues.push({ row: i + 1, code: 'UNKNOWN_OFFICIAL_CAMPAIGN' });
    if (type === 'Side Quest' && !sideCampaigns.has(campaign)) issues.push({ row: i + 1, code: 'UNKNOWN_SIDE_CAMPAIGN' });
    if (!['Primaria', 'Side Quest'].includes(type)) issues.push({ row: i + 1, code: 'UNKNOWN_CAMPAIGN_TYPE' });
    if (type === 'Primaria' && !official.has(raw.Capitolo)) issues.push({ row: i + 1, code: 'UNKNOWN_OFFICIAL_CHAPTER', detail: raw.Capitolo });
    if (!['Yes', 'No'].includes(raw['2L Support Point'])) issues.push({ row: i + 1, code: 'BAD_2L_SUPPORT' });
    rows.push({ sourceRow: i + 1, raw, matchNumber, player: raw.Player, class: raw.Classe, guild: raw.Gilda,
      points, chapter: raw.Capitolo, campaign, campaignType: type, status, category, mode: raw.Mode,
      ranking, army, twoLeaderSupport: raw['2L Support Point'],
      date: raw.Data, eventName: raw['note pt.'] });
  }
  return { rows, issues, headers };
}

// Il CSV Excel del campione è in codifica Windows-1252; UTF-8 resta configurabile.
export async function loadResults(url, { encoding = 'windows-1252', fetcher = fetch } = {}) {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Caricamento CSV fallito: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  return readResults(new TextDecoder(encoding).decode(bytes));
}
