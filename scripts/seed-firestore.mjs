import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'dumsor-timetable-ghana';

function loadSeedData() {
  const seedPath = resolve(root, 'src/app/data/seed-data.ts');
  const source = readFileSync(seedPath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const sandbox = {
    exports: {},
    require: () => ({}),
  };

  vm.runInNewContext(output, sandbox, { filename: seedPath });
  return sandbox.exports;
}

async function commitInChunks(db, collectionName, rows) {
  const chunkSize = 450;
  let written = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + chunkSize)) {
      const ref = db.collection(collectionName).doc(row.id);
      batch.set(ref, removeUndefined(row), { merge: true });
      written += 1;
    }
    await batch.commit();
  }

  return written;
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined));
}

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  }

  const { AREAS, SCHEDULES } = loadSeedData();
  const db = admin.firestore();

  const areasWritten = await commitInChunks(db, 'areas', AREAS);
  const schedulesWritten = await commitInChunks(db, 'schedules', SCHEDULES);

  console.log(`Seeded ${areasWritten} areas and ${schedulesWritten} schedules to project ${projectId}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
