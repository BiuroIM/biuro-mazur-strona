import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'basic-ftp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const STATE = path.join(ROOT, 'scripts', 'publish-state.json');

const { FTP_HOST, FTP_USER, FTP_PASSWORD } = process.env;
const FTP_DIR = process.env.FTP_DIR ?? '/';
const STRICT_TLS = process.env.FTP_STRICT_TLS === 'true';

const step = (message) => console.log(`\n=== ${message} ===`);

const runNode = (args, label) => {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`Krok "${label}" zakończył się błędem. Publikacja przerwana.`);
  }
};

const collectFiles = async (directory, prefix = '') => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path.join(directory, entry.name), relative)));
      continue;
    }

    const bytes = await readFile(path.join(directory, entry.name));
    files.push({ relative, hash: createHash('md5').update(bytes).digest('hex') });
  }

  return files;
};

const readState = async () => {
  try {
    return JSON.parse(await readFile(STATE, 'utf8'));
  } catch {
    return null;
  }
};

const main = async () => {
  if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
    throw new Error('Brakuje FTP_HOST, FTP_USER albo FTP_PASSWORD w pliku .env');
  }

  step('Buduję stronę');
  runNode([path.join(ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'], 'budowanie strony');

  step('Porównuję z tym, co jest na serwerze');
  const previous = await readState();
  const files = await collectFiles(DIST);
  const previousHashes = new Map(Object.entries(previous?.files ?? {}));

  const changed = files.filter((file) => previousHashes.get(file.relative) !== file.hash);
  const currentPaths = new Set(files.map((file) => file.relative));
  const obsolete = previous ? [...previousHashes.keys()].filter((relative) => !currentPaths.has(relative)) : [];

  console.log(`Plików w dist: ${files.length}`);
  console.log(`Do wysłania: ${changed.length}`);
  console.log(`Do usunięcia z serwera: ${obsolete.length}`);

  if (changed.length === 0 && obsolete.length === 0) {
    console.log('\nNic się nie zmieniło. Kończę bez łączenia z FTP.');
    return;
  }

  step('Wysyłam na serwer');
  const client = new Client(30000);

  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: true,
      secureOptions: STRICT_TLS ? undefined : { rejectUnauthorized: false },
    });

    await client.ensureDir(FTP_DIR);
    const base = await client.pwd();

    const byDirectory = new Map();
    for (const file of changed) {
      const directory = path.posix.dirname(file.relative);
      if (!byDirectory.has(directory)) byDirectory.set(directory, []);
      byDirectory.get(directory).push(file);
    }

    let sent = 0;
    for (const [directory, group] of [...byDirectory].sort()) {
      await client.cd(base);
      if (directory !== '.') await client.ensureDir(directory);

      for (const file of group) {
        await client.uploadFrom(path.join(DIST, file.relative), path.posix.basename(file.relative));
        sent += 1;
        console.log(`  ${sent}/${changed.length}  ${file.relative}`);
      }
    }

    for (const relative of obsolete) {
      await client.cd(base);
      try {
        await client.remove(relative);
        console.log(`  usunięto ${relative}`);
      } catch {
        console.log(`  nie udało się usunąć ${relative}, pomijam`);
      }
    }
  } finally {
    client.close();
  }

  const state = { files: Object.fromEntries(files.map((file) => [file.relative, file.hash])) };
  await writeFile(STATE, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

  step('Gotowe');
  console.log(`Wysłano ${changed.length} plików, usunięto ${obsolete.length}.`);
};

const FTP_HINTS = {
  ENOTFOUND: 'Nie znaleziono serwera. Sprawdź FTP_HOST w pliku .env.',
  ECONNREFUSED: 'Serwer odrzucił połączenie. Sprawdź FTP_HOST i czy hosting nie blokuje FTP.',
  ETIMEDOUT: 'Serwer nie odpowiedział. Sprawdź połączenie z internetem.',
};

try {
  await main();
} catch (error) {
  console.error(`\nPUBLIKACJA NIEUDANA\n${error.message}`);

  if (FTP_HINTS[error.code]) {
    console.error(FTP_HINTS[error.code]);
  }

  if (error.message.includes('530')) {
    console.error('Serwer nie przyjął logowania. Sprawdź FTP_USER i FTP_PASSWORD.');
  }

  if (error.message.includes('550')) {
    console.error(`Serwer nie wpuścił do katalogu "${FTP_DIR}". Sprawdź FTP_DIR w pliku .env.`);
  }

  process.exitCode = 1;
}
