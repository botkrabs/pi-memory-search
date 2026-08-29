import { search, loadConfig } from '../store.mjs';
import os from 'node:os';
const HOME = os.homedir();
for (const q of process.argv.slice(2)) {
  console.log('\nQ:', q);
  for (const h of await search(q, 5, loadConfig()))
    console.log(' ', h.path.replace(HOME + '/', '~/'), `(${h.lanes}, s=${h.score.toFixed(3)})`, h.snippet.slice(0, 80).replace(/\n/g, ' '));
}
