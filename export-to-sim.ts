// Adds the routines that auto-search.ts found (shortlist, backup and, with --top10, the top 10) to a local copy of
// caryden/ftc-biobuzz-sim, so you can pick them as AUTO plans in the browser view (npm run dev).
// Drop this file in scripts/ next to auto-search.ts. Run: npx tsx scripts/export-to-sim.ts [--top10]
//
// It writes src/auto/trees/auto/found-<id>.json for each routine and adds them to AUTO_FILES in src/auto/onboard.ts.
// Both changes are local experiments, not for committing. To undo them:
//   git checkout src/auto/onboard.ts && rm src/auto/trees/auto/found-*.json
import fs from 'node:fs';
import path from 'node:path';

type Node = Record<string, any>;
const ROOT = path.resolve(import.meta.dirname, '..'), TREES = path.join(ROOT, 'src/auto/trees/auto'), ONBOARD = path.join(ROOT, 'src/auto/onboard.ts');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'auto-search-top10.json'), 'utf8')) as Record<string, { top10?: Node[]; shortlist?: Node[]; backup?: Node | null }>;
const includeTop = process.argv.includes('--top10');

// The same routine can be on several lists (red right, blue right), so write each id once.
const found = new Map<string, { tree: Node; labels: string[] }>();
const add = (r: Node | null | undefined, label: string, kind: string) => {
  if (!r?.tree) return;
  const e = found.get(r.id) ?? { tree: r.tree, labels: [] }; e.labels.push(`${label} ${kind}`); found.set(r.id, e);
};
for (const [label, v] of Object.entries(report)) {
  v.shortlist?.forEach((r, i) => add(r, label, `S${i + 1}`)); add(v.backup, label, 'backup');
  if (includeTop) v.top10?.forEach((r, i) => add(r, label, `#${i + 1}`));
}

fs.readdirSync(TREES).filter(f => f.startsWith('found-')).forEach(f => fs.rmSync(path.join(TREES, f)));
const names: { id: string; ident: string }[] = [];
for (const [id, { tree, labels }] of found) {
  const t = structuredClone(tree); t.id = `found-${id}`; t.name = `Found: ${id}`; t.description = `${t.description ?? ''} Found by auto-search (${labels.join(', ')}).`.trim();
  if (id.endsWith('backup-leave-park')) { t.meta = { ...(t.meta ?? {}), start: id.startsWith('left') ? 'left' : 'right' }; }
  fs.writeFileSync(path.join(TREES, `found-${id}.json`), JSON.stringify(t, null, 1) + '\n');
  names.push({ id, ident: `found_${id.replace(/[^A-Za-z0-9]/g, '_')}` });
}

// Patch onboard.ts between marker comments, so a second run replaces the first one's lines.
let src = fs.readFileSync(ONBOARD, 'utf8');
src = src.replace(/\/\/ found-trees:begin[\s\S]*?\/\/ found-trees:end\n/g, '').replace(/, \.\.\.FOUND_FILES\]/g, ']');
const imports = `// found-trees:begin (local experiment from export-to-sim.ts)\n${names.map(n => `import ${n.ident} from './trees/auto/found-${n.id}.json';`).join('\n')}\nconst FOUND_FILES = [${names.map(n => n.ident).join(', ')}];\n// found-trees:end\n`;
src = src.replace("import leaveAndPark from './trees/auto/leave-and-park.json';\n", m => m + imports);
src = src.replace("soloSweepNoPark, leaveAndPark];", "soloSweepNoPark, leaveAndPark, ...FOUND_FILES];");
fs.writeFileSync(ONBOARD, src);
console.log(`Added ${names.length} routines to the sim:\n${[...found].map(([id, e]) => `  found-${id}  (${e.labels.join(', ')})`).join('\n')}\nNow run: npm run dev`);
