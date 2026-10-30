#!/usr/bin/env node
/**
 * npm run images
 *
 * Prépare les photos déposées dans public/images/ pour le web :
 *  1. l'original trop lourd est rangé dans images-originales/ (hors du site) ;
 *  2. la photo du site est réduite à 2560 px max et recompressée (même nom,
 *     même format : aucun changement de code nécessaire) ;
 *  3. une vignette de partage 1200×630 est générée dans public/images/og/
 *     (aperçus WhatsApp, Facebook, Instagram…) ;
 *  4. le cache d'images de Next.js est vidé pour que le site affiche tout de
 *     suite les nouvelles versions.
 *
 * Relançable sans risque : une photo déjà optimisée n'est pas retouchée.
 */
import { copyFile, mkdir, readdir, rename, rm, stat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGES = path.join(ROOT, "public/images");
const OG = path.join(IMAGES, "og");
const ORIGINALS = path.join(ROOT, "images-originales");

const MAX_SIDE = 2560; // largement assez pour un écran Retina plein écran
const MAX_BYTES = 900 * 1024; // au-delà, on recompresse même si la taille est bonne
const OG_SIZE = { width: 1200, height: 630 };
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// marque posée dans les métadonnées : une photo déjà traitée n'est jamais retraitée
const MARK = "chez-jeynnifer:optimized";
const isMarked = (meta) => !!meta.exif && meta.exif.includes(MARK);

const kb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`);

function encoder(img, ext) {
  img = img.withExif({ IFD0: { Software: MARK } });
  if (ext === ".png") return img.png({ compressionLevel: 9, effort: 8 });
  if (ext === ".webp") return img.webp({ quality: 80, effort: 5 });
  return img.jpeg({ quality: 80, mozjpeg: true, progressive: true });
}

async function main() {
  await mkdir(OG, { recursive: true });
  const files = (await readdir(IMAGES, { withFileTypes: true }))
    .filter((d) => d.isFile() && EXT.has(path.extname(d.name).toLowerCase()))
    .map((d) => d.name)
    .sort();

  let changed = 0;
  const rows = [];

  for (const name of files) {
    const file = path.join(IMAGES, name);
    const ext = path.extname(name).toLowerCase();
    const before = (await stat(file)).size;
    let meta;
    try {
      meta = await sharp(file).metadata();
    } catch {
      rows.push([name, kb(before), "—", "illisible, ignorée"]);
      continue;
    }

    // 1-2. réduction de la photo du site
    let note = "déjà optimisée";
    const tooBig = !isMarked(meta) && (Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_SIDE || before > MAX_BYTES);
    if (tooBig) {
      await mkdir(ORIGINALS, { recursive: true });
      const original = path.join(ORIGINALS, name);
      await copyFile(file, original);
      const tmp = `${file}.tmp`;
      await encoder(
        sharp(original).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true }),
        ext,
      ).toFile(tmp);
      await rename(tmp, file);
      note = `optimisée (original dans images-originales/)`;
      changed++;
    }
    const after = (await stat(file)).size;

    // 3. vignette de partage (régénérée si la photo est plus récente)
    const og = path.join(OG, `${path.parse(name).name}.jpg`);
    const ogStale = !existsSync(og) || (await stat(og)).mtimeMs < (await stat(file)).mtimeMs;
    if (ogStale) {
      await sharp(file)
        .rotate()
        .resize({ ...OG_SIZE, fit: "cover", position: "attention" })
        .jpeg({ quality: 78, mozjpeg: true })
        .toFile(og);
      changed++;
    }

    rows.push([name, kb(before), kb(after), note]);
  }

  // vignettes orphelines (photo supprimée)
  const bases = new Set(files.map((f) => path.parse(f).name));
  for (const f of await readdir(OG)) {
    if (!bases.has(path.parse(f).name)) await unlink(path.join(OG, f));
  }

  // 4. cache Next.js (dev et build) : sinon l'ancienne version reste servie
  if (changed) {
    for (const dir of [".next/dev/cache/images", ".next/cache/images"]) {
      await rm(path.join(ROOT, dir), { recursive: true, force: true });
    }
  }

  const w = Math.max(...rows.map((r) => r[0].length), 5);
  console.log(`\n${"Photo".padEnd(w)}  ${"Avant".padStart(8)}  ${"Après".padStart(8)}  `);
  for (const [n, b, a, note] of rows) console.log(`${n.padEnd(w)}  ${b.padStart(8)}  ${a.padStart(8)}  ${note}`);
  console.log(
    changed
      ? "\n✓ Terminé. Recharge le site avec Cmd + Maj + R pour voir les nouvelles photos.\n"
      : "\n✓ Rien à faire : toutes les photos sont déjà prêtes.\n",
  );
}

main().catch((err) => {
  console.error("✗ Échec de l'optimisation :", err.message);
  process.exit(1);
});
