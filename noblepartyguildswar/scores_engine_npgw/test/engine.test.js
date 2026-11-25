import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readResults } from '../engine/data.js';
import { buildWars } from '../engine/wars.js';

const sample = readFileSync(new URL('./fixtures/risultati.csv', import.meta.url)).toString('latin1');

test('intestazioni e lettura numeri, codifiche e alias', () => {
  const parsed = readResults(sample);
  assert.equal(parsed.headers.length, 35);
  assert.equal(parsed.rows.length, 721);
  assert.equal(parsed.rows[0].points, 6.4);
  assert.equal(parsed.rows[0].category, 'Social');
  assert.ok(parsed.rows.some(r => r.category === 'Champions' && r.status === 'Panchina'));
  assert.ok(parsed.rows.some(r => r.campaign === 'Onniscienza'));
  assert.equal(parsed.issues.filter(e => e.code === 'DUPLICATE_PLAYER_MATCH').length, 0);
  assert.equal(parsed.issues.filter(e => e.code === 'UNKNOWN_OFFICIAL_CHAPTER').length, 0);
});

test('Guerre e punteggi di facciata ricostruiti dal campione', () => {
  const parsed = readResults(sample);
  const result = buildWars(parsed);
  assert.equal(result.official.length, 11);
  assert.equal(result.official.filter(w => w.played).length, 6);
  assert.equal(result.sideQuest.length, 7);
  assert.deepEqual(result.official.find(w => w.chapter === 'Fondatori').score, [1, 4]);
  assert.deepEqual(result.official.find(w => w.chapter === 'The Great LAN pt.1').score, [3, 1]);
  assert.deepEqual(result.official.find(w => w.chapter === 'The Great LAN pt.2').score, [2, 2]);
  assert.deepEqual(result.sideQuest.find(w => w.chapter === 'Impatto').score, [3, 2]);
  assert.equal(result.sideQuest.find(w => w.chapter === 'Impatto').tiedGames, 1);
  assert.deepEqual(result.sideQuest.find(w => w.chapter === 'The BlackMail').score, [4, 1]);
  assert.equal(result.issues.filter(i => i.code === 'EXPECTED_FOUR_MATCHES').length, 0);
});

test('slot Side Quest cronologici e indipendenti per Gilda', () => {
  const parsed = readResults(sample);
  const { roadmaps } = buildWars(parsed);
  assert.equal(roadmaps.Ade.slots[0].war, 'Mr.Glimpse 3 sec');
  assert.equal(roadmaps.Ade.slots[1].war, 'Vasellina');
  assert.equal(roadmaps.Aquila.slots[0].war, 'Notte del Solstizio');
  assert.equal(roadmaps.Aquila.slots[2].war, 'Impatto');
  assert.equal(roadmaps.Aquila.slots[3].war, 'Scontro degli Xx');
  assert.equal(roadmaps.Valore.slots[0].war, 'Mr.Glimpse 3 sec');
  assert.equal(roadmaps.Valore.slots[1].war, 'The BlackMail');
  assert.equal(roadmaps.Valore.slots[2].war, 'Impatto');
});

test('le Gilde senza slot conservano le Guerre nell archivio globale', () => {
  const base = readResults(sample).rows;
  const extra = base.filter(r => r.chapter === 'Impatto').map(r => ({ ...r, chapter: 'Quest Extra', matchNumber: r.matchNumber + 100 }));
  const another = base.filter(r => r.chapter === 'Scontro degli Xx').map(r => ({ ...r, chapter: 'Quest Terza', matchNumber: r.matchNumber + 100 }));
  const result = buildWars([...base, ...extra, ...another]);
  assert.ok(result.played.some(w => w.chapter === 'Quest Extra'));
  assert.ok(result.roadmaps.Aquila.unassignedWars.includes('Quest Terza'));
});
