import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readResults } from '../engine/data.js';
import { buildSnapshot } from '../engine/snapshot.js';
import { buildHistory } from '../engine/history.js';

const fixture = readFileSync(new URL('./fixtures/risultati.csv', import.meta.url), 'latin1');
const parsed = readResults(fixture);

test('storico: una fotografia per partita completa e cronologica', () => {
  const history = buildHistory(parsed);
  const ids = [...new Set(parsed.rows.map(r => r.matchNumber))].sort((a, b) => a - b);
  assert.deepEqual(history.matches.map(m => m.matchNumber), ids);
  assert.equal(history.guilds.Valore.length, ids.length);
  assert.equal(Object.keys(history.players).length, 26);
  assert.equal(history.matches.length, 52);
});

test('storico: ultima fotografia identica allo snapshot corrente, senza arrotondamenti', () => {
  const snapshot = buildSnapshot(parsed);
  const history = snapshot.history;
  for (const [name, profile] of Object.entries(snapshot.players)) {
    const latest = history.players[name].at(-1);
    for (const [category, value] of Object.entries({...profile.categories, Viaggiatore:profile.viaggiatore})) {
      assert.equal(latest.categories[category].bwa, value.eligible ? value.rawBwa : null, `${name} / ${category}`);
      assert.equal(latest.categories[category].eligible, value.eligible);
    }
    for (const [guild, value] of Object.entries(profile.guilds)) {
      assert.equal(latest.guilds[guild].bwa, value.eligible ? value.rawBwa : null, `${name} / ${guild}`);
    }
  }
  for (const [guild, values] of Object.entries(history.guilds)) {
    const last = values.at(-1), current = snapshot.rankings.guilds.details[guild];
    assert.equal(last.bwa, current.eligible ? current.score : null);
  }
});

test('storico: anche una partita non giocata può modificare il BWA', () => {
  const { players } = buildHistory(parsed);
  const changedWhileAbsent = Object.values(players).some(points => points.some((point, i) => {
    if (!i || point.participated) return false;
    const before = points[i - 1];
    return before && point.categories.Guerre.eligible && before.categories.Guerre.eligible
      && point.categories.Guerre.bwa !== before.categories.Guerre.bwa;
  }));
  assert.equal(changedWhileAbsent, true);
});

test('storico: ranking assente prima dell’accesso, mai finto zero', () => {
  const { players } = buildHistory(parsed);
  for (const points of Object.values(players)) {
    for (const point of points) {
      for (const value of [...Object.values(point.categories), ...Object.values(point.guilds)]) {
        if (!value.eligible) {
          assert.equal(value.bwa, null);
          if ('rank' in value) assert.equal(value.rank, null);
          if ('paladinRank' in value) assert.equal(value.paladinRank, null);
        }
      }
    }
  }
});
