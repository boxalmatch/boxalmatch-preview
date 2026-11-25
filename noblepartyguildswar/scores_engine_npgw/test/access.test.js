import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readResults } from '../engine/data.js';
import { buildBwa } from '../engine/bwa.js';
import { buildAccess } from '../engine/access.js';

const parsed = readResults(readFileSync(new URL('./fixtures/risultati.csv', import.meta.url), 'latin1'));
const access = buildAccess(buildBwa(parsed)).players;

test('accessi Excel: requisiti standard, Guerre e Viaggiatore', () => {
  assert.equal(access.Pino.guerre.eligible, true);
  assert.equal(access.Pino.viaggiatore.eligible, true);
  assert.equal(access.Pino.viaggiatoreLabel, 'Accesso a Viaggiatore');
  assert.equal(access.Tigrozzo.viaggiatore.eligible, true);
  assert.equal(access.Spartan.guerre.eligible, true);
  assert.equal(access.Spartan.viaggiatore.eligible, false);
  assert.deepEqual(access.Spartan.viaggiatore.missingGuilds, ['Ade', 'Aquila', 'Valchiria']);
  assert.equal(access.Spartan.viaggiatore.nextRequirement, 'Gilde');
  assert.equal(access.Spartan.categories.Sketch.eligible, true);
});

test('prima di Guerre mostrare solo Guerre come requisito Viaggiatore', () => {
  const p = access.Apocal;
  assert.equal(p.categories.Sketch.played, 1);
  assert.equal(p.categories.Sketch.remaining, 3);
  assert.equal(p.categories.Standard.remaining, 4);
  assert.equal(p.categories.Social.remaining, 5);
  assert.deepEqual(p.guerre.missingCategories, ['Sketch', 'Standard', 'Social']);
  assert.equal(p.guerre.remainingMatches, 12);
  assert.equal(p.viaggiatore.missingGuerre, true);
  assert.equal(p.viaggiatore.nextRequirement, 'Guerre');
  assert.deepEqual(p.viaggiatore.missingGuilds, []);
  assert.equal(p.viaggiatoreLabel, null);
});

test('Champions: conta presenza anche in Panchina; non richiede vittoria', () => {
  assert.equal(access.Spartan.categories.Champions.eligible, true);
  assert.equal(access.Spartan.categories.Champions.remaining, 0);
  assert.equal(access.Clavuss.categories.Champions.eligible, false);
  assert.equal(access.Clavuss.categories.Champions.remaining, 1);
});

test('buildAccess accetta direttamente risultati.csv e non altera i BWA', () => {
  const fresh = buildAccess(parsed);
  assert.deepEqual(fresh.players.Spartan, access.Spartan);
});
