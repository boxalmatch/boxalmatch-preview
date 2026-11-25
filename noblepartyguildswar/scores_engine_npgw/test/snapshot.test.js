import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readResults } from '../engine/data.js';
import { buildSnapshot } from '../engine/snapshot.js';
import { generateSnapshot } from '../tools/generate-snapshot.js';

const fixture = readFileSync(new URL('./fixtures/risultati.csv', import.meta.url));
const parsed = readResults(fixture.toString('latin1'));

test('snapshot: unisce tutti gli output senza arrotondare i BWA', () => {
  const snapshot = buildSnapshot(parsed, { sourceHash: 'example', generatedAt: '2026-01-01T00:00:00Z' });
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.metadata.rows, 721);
  assert.equal(snapshot.metadata.players, 26);
  assert.equal(snapshot.metadata.issues.length, 0);
  assert.equal(snapshot.parameters.Mercenario.Guerre.Y, 420);
  assert.equal(snapshot.players.Spartan.categories.Guerre.appearances, 26);
  assert.equal(snapshot.players.Spartan.statistics.placements['1'], 15);
  assert.equal(snapshot.players.Pino.access.viaggiatore.eligible, true);
  assert.deepEqual(snapshot.rankings.categories.Champions.Mercenario[0].players, ['Patrifu', 'Tigrozzo']);
  assert.equal(snapshot.wars.official.length, 11);
  assert.equal(snapshot.wars.sideQuest.length, 7);
  assert.equal(snapshot.rankings.guilds.details.Aquila.leaderCount, 3);
  assert.equal(snapshot.metadata.sourceSha256, 'example');
});

test('snapshot CLI: uno storico per ogni contenuto CSV, corrente sempre aggiornato', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'npgw-snapshot-'));
  try {
    const input = join(dir, 'risultati.csv');
    const output = join(dir, 'current.json');
    const history = join(dir, 'history');
    await writeFile(input, fixture);
    const first = await generateSnapshot({ input, output, history });
    const second = await generateSnapshot({ input, output, history });
    assert.equal(first.generated, true);
    assert.equal(second.generated, false);
    assert.equal((await readdir(history)).length, 1);
    const current = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(current.metadata.rows, 721);
    assert.equal(current.metadata.sourceSha256.length, 64);

    await writeFile(input, Buffer.concat([fixture, Buffer.from('\n')]));
    const third = await generateSnapshot({ input, output, history });
    assert.equal(third.generated, true);
    assert.equal((await readdir(history)).length, 2);
    assert.notEqual(first.snapshot.metadata.sourceSha256, third.snapshot.metadata.sourceSha256);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
