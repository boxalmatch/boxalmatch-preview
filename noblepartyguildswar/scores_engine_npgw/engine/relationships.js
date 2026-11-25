function add(matrix, a, b) {
  matrix[a] ??= {};
  matrix[b] ??= {};
  matrix[a][b] = (matrix[a][b] ?? 0) + 1;
  matrix[b][a] = (matrix[b][a] ?? 0) + 1;
}

function mostFrequent(others) {
  const values = Object.entries(others ?? {});
  const max = Math.max(0, ...values.map(([, count]) => count));
  return max ? values.filter(([, count]) => count === max)
    .map(([name]) => name).sort((a, b) => a.localeCompare(b, 'it')) : [];
}

/**
 * Le coppie sono simmetriche e conteggiate una sola volta per partita.
 * La Panchina non crea relazioni. TS: stessa Armata alleati;
 * FFA/MTS: stessa Gilda alleati, Gilde diverse avversari.
 */
export function buildRelationships(parsed) {
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  const matches = new Map();
  const players = new Set(rows.map(r => r.player));
  for (const r of rows) {
    if (r.status !== 'Partecipante') continue;
    if (!matches.has(r.matchNumber)) matches.set(r.matchNumber, []);
    matches.get(r.matchNumber).push(r);
  }
  const together = {}, against = {};
  for (const participants of matches.values()) {
    for (let i = 0; i < participants.length; i++) {
      const a = participants[i];
      for (let j = i + 1; j < participants.length; j++) {
        const b = participants[j];
        if (a.player === b.player) continue;
        const allies = a.mode === 'TS' ? a.army === b.army : a.guild === b.guild;
        add(allies ? together : against, a.player, b.player);
      }
    }
  }
  const profiles = {};
  for (const player of players) {
    profiles[player] = {
      together: together[player] ?? {}, against: against[player] ?? {},
      heartAllies: mostFrequent(together[player]),
      archEnemies: mostFrequent(against[player]),
    };
  }
  return { together, against, profiles };
}
