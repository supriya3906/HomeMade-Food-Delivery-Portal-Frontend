// Downloads a real, freely-licensed photo of each dish from Wikimedia Commons
// into public/images/foods/ and records the credit in src/data/photos.js.
//
//   npm run fetch-photos                 all dishes
//   npm run fetch-photos -- --only f04   just some dishes (comma separated)
//   npm run fetch-photos -- --force      replace photos you already have
//
// Needs internet. Only CC-BY, CC-BY-SA, CC0 and public-domain files are used,
// and a photo is accepted only if its title/description mentions the dish.
// Always glance at the result (the script prints the source page for each) and
// swap in your own file + edit photos.js if one isn't right.
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/images/foods');
const dataFile = path.join(root, 'src/data/photos.js');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'Rasoi-student-project/1.0 (educational project; fetch-photos script)';

// [queries to try in order, words of which at least one must appear in the file title/description]
// Search terms for every dish live in the menu data (backend/src/data/catalog.json -> photoQuery),
// so a photo can be fetched for every dish in the database.
const catalog = JSON.parse(readFileSync(path.join(root, '../backend/src/data/catalog.json'), 'utf8'));
export const DISHES = Object.fromEntries(catalog.foods.filter((f) => f.photoQuery).map((f) => [f.id, f.photoQuery]));

const BAD = /(restaurant|menu|logo|map|stamp|poster|advert|statue|painting|drawing|diagram|shop|stall|market|street|vendor|packet|package|label)/i;
const okLicense = (l = '') => /^(CC BY|CC0|Public domain|PD)/i.test(l.trim()) && !/-(NC|ND)\b/i.test(l);
const strip = (h = '') => h.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// Choose the best usable file from a Commons API response (exported for testing).
export function pickPhoto(apiJson, keywords) {
  const pages = Object.values(apiJson?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info || !/^image\/(jpeg|png)$/.test(info.mime || '')) continue;
    const meta = info.extmetadata || {};
    if (!okLicense(meta.LicenseShortName?.value)) continue;
    if ((info.thumbwidth || info.width) < 500) continue;
    const title = page.title.replace(/^File:/, '');
    const text = `${title} ${strip(meta.ImageDescription?.value)}`.toLowerCase();
    if (BAD.test(title)) continue;
    if (!keywords.some((k) => text.includes(k))) continue;
    return {
      url: info.thumburl || info.url,
      mime: info.mime,
      author: strip(meta.Artist?.value) || 'Unknown author',
      license: meta.LicenseShortName.value.trim(),
      page: info.descriptionurl,
      title
    };
  }
  return null;
}

async function search(query) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '15',
    gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|mime|size|extmetadata', iiurlwidth: '900'
  });
  const res = await fetch(`${API}?${params}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons search failed (${res.status})`);
  return res.json();
}

async function loadExisting() {
  try {
    return (await import(`${pathToFileURL(dataFile).href}?t=${Date.now()}`)).photos || {};
  } catch {
    return {};
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const onlyArg = args[args.indexOf('--only') + 1];
  const only = args.includes('--only') && onlyArg ? onlyArg.split(',') : null;

  mkdirSync(outDir, { recursive: true });
  const photos = await loadExisting();
  const missing = [];

  for (const [id, [queries, keywords]] of Object.entries(DISHES)) {
    if (only && !only.includes(id)) continue;
    if (photos[id] && !force) { console.log(`${id}: already has a photo (use --force to replace)`); continue; }

    let found = null;
    for (const q of queries) {
      try { found = pickPhoto(await search(q), keywords); } catch (e) { console.warn(`  ${id}: ${e.message}`); }
      if (found) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!found) { missing.push(id); console.log(`${id}: no suitable free photo found — keeping the illustration`); continue; }

    let img;
    try { img = await fetch(found.url, { headers: { 'User-Agent': UA } }); } catch (e) { img = { ok: false, status: e.message }; }
    if (!img.ok) { missing.push(id); console.log(`${id}: download failed (${img.status})`); continue; }
    const file = `${id}.${found.mime === 'image/png' ? 'png' : 'jpg'}`;
    writeFileSync(path.join(outDir, file), Buffer.from(await img.arrayBuffer()));
    photos[id] = { src: `/images/foods/${file}`, author: found.author, license: found.license, page: found.page };
    console.log(`${id}: ${found.title}\n     ${found.page}`);
    await new Promise((r) => setTimeout(r, 300));
  }

  writeFileSync(
    dataFile,
    `// Written by scripts/fetch-photos.mjs — safe to edit by hand.\n// Each entry: { src, author, license, page }.\nexport const photos = ${JSON.stringify(photos, null, 2)};\n`
  );
  console.log(`\nDone. ${Object.keys(photos).length} of ${Object.keys(DISHES).length} dishes have photos.`);
  if (missing.length) console.log(`Still using illustrations: ${missing.join(', ')}. Add your own image + an entry in src/data/photos.js.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { console.error(`Photo download skipped: ${e.message}. Run "npm run fetch-photos" again when you are online.`); process.exit(0); });
}
