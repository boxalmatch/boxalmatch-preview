import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readResults } from '../engine/data.js';
import { buildPlayerStats } from '../engine/stats.js';
import { buildRelationships } from '../engine/relationships.js';

const csv = readFileSync(new URL('./fixtures/risultati.csv', import.meta.url)).toString('latin1');

test('statistiche cumulative: conteggi coerenti e piazzamenti anche in panchina', () => {
  const parsed = readResults(csv);
  const stats = buildPlayerStats(parsed);
  const appearances = Object.values(stats).reduce((sum, p) => sum + p.appearances, 0);
  const participant = Object.values(stats).reduce((sum, p) => sum + p.participant, 0);
  const bench = Object.values(stats).reduce((sum, p) => sum + p.bench, 0);
  const placements = Object.values(stats).reduce((sum, p) => sum + Object.values(p.placements).reduce((a, b) => a + b, 0), 0);
  assert.equal(appearances, parsed.rows.length);
  assert.equal(participant + bench, appearances);
  assert.equal(placements, appearances);
  assert.equal(Object.values(stats).reduce((sum, p) => sum + p.categories.Champions, 0), 22);
  assert.ok(Object.values(stats).every(p => p.heartGuilds.every(g => p.guilds[g] === Math.max(...Object.values(p.guilds)))));
});

const fixture = (matchNumber, player, guild, army, mode, status = 'Partecipante', support = 'No') => ({
  matchNumber, player, guild, army, mode, status, twoLeaderSupport: support,
  category: 'Champions', class: 'Leader', ranking: 1, raw: { 'Class PP': 'Leaders only', GA: 'Yes', EC: '' },
});

test('Gilda svantaggiata: No conta solo quando esiste almeno un Yes', () => {
  const rows = [
    fixture(1, 'A', 'Ade', 1, 'TS'), fixture(1, 'B', 'Aquila', 2, 'TS'),
    fixture(2, 'A', 'Ade', 1, 'TS', 'Partecipante', 'No'),
    fixture(2, 'B', 'Aquila', 2, 'TS', 'Partecipante', 'Yes'),
    fixture(3, 'A', 'Ade', 1, 'TS', 'Panchina', 'No'),
    fixture(3, 'B', 'Aquila', 2, 'TS', 'Partecipante', 'Yes'),
  ];
  const s = buildPlayerStats(rows);
  assert.equal(s.A.unbalancedGuild, 2);
  assert.equal(s.B.unbalancedGuild, 0);
  assert.equal(s.A.bench, 1);
  assert.equal(s.A.categories.Champions, 3);
  assert.equal(s.A.placements['1'], 3);
});

test('TS: stessa Armata alleati, FFA/MTS: stessa Gilda alleati', () => {
  const rows = [
    fixture(1, 'A', 'Ade', 1, 'TS'), fixture(1, 'B', 'Sciabola', 1, 'TS'), fixture(1, 'C', 'Aquila', 2, 'TS'),
    fixture(2, 'A', 'Ade', 1, 'FFA'), fixture(2, 'B', 'Sciabola', 1, 'FFA'), fixture(2, 'C', 'Ade', 1, 'FFA'),
    fixture(3, 'A', 'Ade', 1, 'MTS'), fixture(3, 'B', 'Sciabola', 1, 'MTS'), fixture(3, 'C', 'Ade', 1, 'MTS'),
    fixture(4, 'A', 'Ade', 1, 'TS', 'Panchina'), fixture(4, 'B', 'Ade', 1, 'TS'),
  ];
  const rel = buildRelationships(rows);
  assert.equal(rel.together.A.B, 1);
  assert.equal(rel.against.A.B, 2);
  assert.equal(rel.together.A.C, 2);
  assert.equal(rel.against.A.C, 1);
  assert.deepEqual(rel.profiles.A.heartAllies, ['C']);
  assert.deepEqual(rel.profiles.A.archEnemies, ['B']);
  assert.equal(rel.together.B.A, rel.together.A.B);
  assert.equal(rel.against.B.A, rel.against.A.B);
});

test('parimeriti e zero relazioni', () => {
  const rows = [
    fixture(1, 'A', 'Ade', 1, 'TS'), fixture(1, 'B', 'Sciabola', 1, 'TS'), fixture(1, 'C', 'Aquila', 2, 'TS'),
    fixture(2, 'A', 'Ade', 1, 'TS'), fixture(2, 'D', 'Sciabola', 1, 'TS'),
    fixture(3, 'E', 'Pericolo', 2, 'TS', 'Panchina'),
  ];
  const rel = buildRelationships(rows);
  assert.deepEqual(rel.profiles.A.heartAllies, ['B', 'D']);
  assert.deepEqual(rel.profiles.E.heartAllies, []);
  assert.deepEqual(rel.profiles.E.archEnemies, []);
});
