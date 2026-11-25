import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readResults } from '../engine/data.js';
import { buildBwa } from '../engine/bwa.js';

const csv = readFileSync(new URL('./fixtures/risultati.csv', import.meta.url), 'latin1');
const sample = buildBwa(readResults(csv));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} !== ${expected}`);

test('L e k per classe/categoria coincidono con Excel di riferimento', () => {
  const { Leader, Mercenario } = sample.parameters;
  close(Leader.Guerre.L, 5.497009967);
  close(Mercenario.Guerre.L, 5.514761905);
  close(Leader.Social.L, 6.167924528);
  close(Mercenario.Sketch.L, 4.3975);
  close(Leader.Champions.L, 5.833333333);
  close(Mercenario.Champions.L, 6.8);
  assert.equal(Leader.Guerre.k, 38);
  assert.equal(Mercenario.Guerre.k, 26);
  assert.equal(Leader.Champions.k, 1.5);
  assert.equal(Mercenario.Standard.k, 7.5);
  assert.equal(Mercenario.Guerre.Y, 420);
});

test('BWA: formule identiche a Excel, nessun arrotondamento interno', () => {
  const { Baudo, Clavuss, Spartan, Tigrozzo } = sample.players;
  close(Baudo.categories.Guerre.bwa, 5.470565594);
  close(Clavuss.categories.Guerre.bwa, 5.434663643);
  close(Spartan.categories.Sketch.bwa, 4.532166667);
  close(Spartan.categories.Social.bwa, 6.353154122);
  close(Spartan.categories.Champions.bwa, 6.65);
  close(Spartan.categories.Standard.bwa, 5.744802867);
  // L'Excel caricato conserva 0 in cache per Spartan Guerre, ma le
  // formule corrette impongono questo valore dopo il ricalcolo.
  close(Spartan.categories.Guerre.bwa, 5.624688644688645);
  close(Tigrozzo.categories.Guerre.bwa, 5.550520147);
});

test('accessi, gilde e Viaggiatore; Panchina inclusa in X e Y', () => {
  const { Pino, Tigrozzo, Spartan, Apocal } = sample.players;
  assert.equal(Pino.access.Viaggiatore, true);
  assert.equal(Tigrozzo.access.Viaggiatore, true);
  assert.equal(Spartan.access.Guerre, true);
  assert.equal(Spartan.access.Viaggiatore, false);
  assert.equal(Spartan.categories.Guerre.appearances, 26);
  assert.equal(Spartan.guilds.Aquila.appearances, 3);
  assert.equal(Spartan.guilds.Aquila.eligible, false);
  assert.equal(Spartan.guilds.Aquila.bwa, 0);
  assert.equal(Spartan.guilds.Aquila.rawBwa > 0, true);
  assert.equal(Apocal.categories.Guerre.eligible, false);
  assert.equal(Apocal.categories.Guerre.bwa, 0);
  assert.equal(Pino.categories.Guerre.bwa, Pino.viaggiatore.bwa);
});

test('mediana esclude solo presenze zero, non giocatori senza accesso', () => {
  const rows = [
    { player: 'A', class: 'Leader', category: 'Sketch', guild: 'Ade', points: 4 },
    { player: 'B', class: 'Leader', category: 'Sketch', guild: 'Aquila', points: 6 },
    { player: 'B', class: 'Leader', category: 'Sketch', guild: 'Aquila', points: 8 },
    { player: 'C', class: 'Leader', category: 'Social', guild: 'Cobra', points: 10 },
  ];
  const result = buildBwa(rows);
  assert.equal(result.parameters.Leader.Sketch.k, 1.5);
  assert.equal(result.parameters.Leader.Sketch.L, 6);
  assert.equal(result.players.A.categories.Sketch.eligible, false);
  assert.equal(result.players.A.categories.Sketch.bwa, 0);
  assert.ok(result.players.A.categories.Sketch.rawBwa > 0);
});
