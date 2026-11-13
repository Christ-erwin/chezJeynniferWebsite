#!/usr/bin/env node
/**
 * Mode « soirée » : le jeu tourne sur cet ordinateur (branché à la télé) et
 * les téléphones du même Wi-Fi ouvrent la régie. Détecte l'adresse du Mac,
 * l'injecte dans la config (API, CORS, origines de dev) et lance les deux
 * serveurs ouverts sur le réseau local.
 *
 *   npm run soiree          lance tout
 *   npm run soiree -- --dry affiche la config sans rien lancer
 */
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FRONT = 3000;
const BACK = 4000;
const dry = process.argv.includes("--dry");

/** Adresse IPv4 privée de l'ordinateur sur le Wi-Fi / le réseau local. */
function lanAddress() {
  const found = [];
  for (const [name, list] of Object.entries(networkInterfaces())) {
    for (const i of list ?? []) {
      if (i.family !== "IPv4" || i.internal) continue;
      if (/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01])\.|169\.254)/.test(i.address)) found.push({ name, address: i.address, rank: name === "en0" ? 0 : i.address.startsWith("169.254") ? 9 : 1 });
    }
  }
  return found.sort((a, b) => a.rank - b.rank)[0]?.address;
}

const free = (port) =>
  new Promise((resolve) => {
    const s = createServer();
    s.once("error", () => resolve(false));
    s.once("listening", () => s.close(() => resolve(true)));
    s.listen(port); // sans adresse : écoute IPv4 + IPv6, comme Next et Nest
  });

const ip = lanAddress();
if (!ip) {
  console.error("\n✗ Aucune adresse réseau trouvée. Connecte l'ordinateur au Wi-Fi (ou au partage de connexion du téléphone), puis relance.\n");
  process.exit(1);
}

const env = {
  ...process.env,
  // le navigateur du téléphone appelle l'API par l'adresse de l'ordinateur, pas « localhost »
  NEXT_PUBLIC_API_BASE_URL: `http://${ip}:${BACK}/api`,
  FRONTEND_ORIGIN: [`http://localhost:${FRONT}`, `http://${ip}:${FRONT}`].join(","),
  DEV_ORIGINS: ip,
};

console.log(`
  Mode soirée — adresse de l'ordinateur : ${ip}

  Sur l'ordinateur (recopié sur la télé), en fenêtre privée :
    http://localhost:${FRONT}/ecran/loup-garou/<id de la partie>

  Sur le téléphone (même Wi-Fi) :
    http://${ip}:${FRONT}/admin/loup-garou
`);

if (dry) process.exit(0);

for (const [port, label] of [[FRONT, "le site (3000)"], [BACK, "l'API (4000)"]]) {
  if (!(await free(port))) {
    console.error(`✗ Le port ${port} est déjà utilisé : arrête d'abord ${label} (le « npm run dev » en cours), puis relance.\n`);
    process.exit(1);
  }
}

const bin = join(root, "node_modules", ".bin", "concurrently");
const child = spawn(
  bin,
  ["-n", "api,site", "-c", "blue,magenta", "-k", `npm --prefix lg-chez-jennifer-backend run start:dev`, `npm --prefix lg-chez-jennifer-frontend run dev -- -H 0.0.0.0`],
  { cwd: root, env, stdio: "inherit" },
);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
