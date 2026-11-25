import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readResults } from '../engine/data.js';
import { buildRankings } from '../engine/rankings.js';

const fixture = readResults(readFileSync(new URL('./fixtures/risultati.csv', import.meta.url), 'latin1'));
const result = buildRankings(fixture);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} !== ${expected}`);

test('Guerre: classifiche Leader/Mercenari e corretto ricalcolo Spartan', () => {
  assert.deepEqual(result.categories.Guerre.Leader.slice(0, 4).map(r => r.players[0]),
    ['Puffo', 'Noble', 'Colt', 'Drius']);
  near(result.categories.Guerre.Leader[0].score, 5.639805411);
  assert.deepEqual(result.categories.Guerre.Mercenario.slice(0, 4).map(r => r.players[0]),
    ['Patrifu', 'Spartan', 'Sootz', 'Skate']);
  near(result.categories.Guerre.Mercenario[1].score, 5.624688644688645);
});

test('Viaggiatore e Guerre provvisoria/finale', () => {
  assert.deepEqual(result.categories.Viaggiatore.Mercenario.map(r => r.players[0]), ['Tigrozzo', 'Pino']);
  assert.equal(result.categories.Guerre.Mercenario.find(r => r.players.includes('Pino')).labels.Pino,
    'Accesso a Viaggiatore');
  assert.ok(!result.finalGuerre.Mercenario.some(row => row.players.includes('Pino')));
  assert.ok(!result.finalGuerre.Mercenario.some(row => row.players.includes('Tigrozzo')));
  assert.ok(result.categories.Guerre.Mercenario.some(row => row.players.includes('Pino')));
});

test('Champions: partecipante e ranking 1; parimeriti su una sola riga', () => {
  assert.deepEqual(result.categories.Champions.Leader, []);
  assert.equal(result.categories.Champions.Mercenario.length, 1);
  assert.deepEqual(result.categories.Champions.Mercenario[0], {
    rank: 1, score: 1, players: ['Patrifu', 'Tigrozzo'],
  });
  assert.equal(result.championWins.Colt, 0); // 2 primi posti da Panchina
  assert.equal(result.championWins.Swine, 0); // 1 primo posto da Panchina
});

test('Paladini Ade: esclusione Swine, classi distinte e triplo parimerito', () => {
  const ade = result.paladins.Ade;
  assert.deepEqual(ade.Leader.slice(0, 3).map(r => r.players[0]), ['Puffo', 'Noble', 'Copter']);
  assert.ok(!ade.Leader.some(r => r.players.includes('Swine')));
  assert.deepEqual(ade.Mercenario[2].players, ['Patrifu', 'Stokes', 'WC']);
  near(ade.Mercenario[0].score, 5.652619048);
});

test('Classifica Gilde: tua formula di media ponderata e soglie di accesso', () => {
  assert.deepEqual(result.guilds.ranking.map(r => r.players[0]),
    ['Valore', 'Aquila', 'Pericolo', 'Valchiria', 'Ade', 'Cobra', 'Bastione', 'Sciabola']);
  near(result.guilds.details.Valore.score, 5.567324882);
  near(result.guilds.details.Aquila.score, 5.556402976);
  const aquila = result.guilds.details.Aquila;
  assert.equal(aquila.leaderCount, 3);
  assert.equal(aquila.mercenaryCount, 11);
  near(aquila.score, (aquila.leaderAverage * 3 + aquila.mercAverage * 11) / 14);
});

test('Un solo CSV: nessun accesso => assenza dalla classifica; parità esatta', () => {
  const rows = [
    { player: 'X', class: 'Mercenario', guild: 'Ade', category: 'Champions', status: 'Partecipante', ranking: 1, points: 5 },
    { player: 'Y', class: 'Mercenario', guild: 'Aquila', category: 'Champions', status: 'Partecipante', ranking: 1, points: 5 },
    { player: 'Z', class: 'Mercenario', guild: 'Cobra', category: 'Champions', status: 'Panchina', ranking: 1, points: 5 },
  ];
  const r = buildRankings(rows);
  assert.deepEqual(r.categories.Champions.Mercenario, [{ rank: 1, score: 1, players: ['X', 'Y'] }]);
  assert.deepEqual(r.categories.Guerre.Mercenario, []);
  assert.equal(r.guilds.ranking.length, 0);
});
