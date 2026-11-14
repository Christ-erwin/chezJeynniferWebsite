import { join } from 'node:path';

/**
 * Dossier des données (commandes, éditions, parties, photos).
 * En local : ./data. En production : le disque persistant monté par
 * l'hébergeur (ex. DATA_DIR=/data sur un volume Railway).
 */
export function dataPath(name: string): string {
  return join(process.env.DATA_DIR ?? 'data', name);
}
