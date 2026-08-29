import { indexNow, loadConfig } from '../store.mjs';
const t0 = Date.now();
const r = await indexNow(loadConfig());
console.log('INDEX DONE in', ((Date.now()-t0)/1000).toFixed(0), 's:', JSON.stringify(r));
