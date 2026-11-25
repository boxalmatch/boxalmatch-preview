#!/usr/bin/env node
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readResults } from '../engine/data.js';
import { buildSnapshot } from '../engine/snapshot.js';

function options(args) {
  const result = { encoding: 'windows-1252', output: 'snapshots/current.json', history: 'snapshots/history' };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!['--input', '--output', '--history', '--encoding'].includes(key) || !args[i + 1]) {
      throw new Error(`Opzione non valida: ${key}. Usa --input FILE [--output FILE] [--history DIRECTORY] [--encoding windows-1252|utf-8]`);
    }
    result[key.slice(2)] = args[++i];
  }
  if (!result.input) throw new Error('Specifica --input /percorso/risultati.csv');
  return result;
}

export async function generateSnapshot({ input, output = 'snapshots/current.json', history = 'snapshots/history', encoding = 'windows-1252' }) {
  const bytes = await readFile(resolve(input));
  const hash = createHash('sha256').update(bytes).digest('hex');
  const parsed = readResults(new TextDecoder(encoding).decode(bytes));
  const generatedAt = new Date().toISOString();
  const snapshot = buildSnapshot(parsed, { sourceHash: hash, generatedAt });
  if (snapshot.metadata.issues.length) {
    throw new Error(`CSV non valido: ${snapshot.metadata.issues.length} anomalie. ${JSON.stringify(snapshot.metadata.issues.slice(0, 5))}`);
  }

  const content = `${JSON.stringify(snapshot, null, 2)}\n`;
  const currentPath = resolve(output);
  const historyDir = resolve(history);
  await mkdir(dirname(currentPath), { recursive: true });
  await mkdir(historyDir, { recursive: true });

  // Uno storico per ogni versione distinta del CSV; una nuova esecuzione
  // senza modifiche aggiorna il file corrente, senza duplicare lo storico.
  const previous = (await readdir(historyDir)).find(name => name.endsWith(`_${hash.slice(0, 16)}.json`));
  const historyName = previous ?? `${generatedAt.replace(/[:.]/g, '-')}_${hash.slice(0, 16)}.json`;
  const historyPath = join(historyDir, historyName);
  if (!previous) await writeFile(historyPath, content, { flag: 'wx' });
  await writeFile(currentPath, content);
  return { currentPath, historyPath, generated: !previous, snapshot };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await generateSnapshot(options(process.argv.slice(2)));
    process.stdout.write(`Snapshot: ${result.currentPath}\nStorico: ${result.historyPath}${result.generated ? ' (nuovo)' : ' (già presente)'}\nRighe: ${result.snapshot.metadata.rows}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
