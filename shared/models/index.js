/* The model list, in priority order. 'globe' is written separately; loaders skip any entry whose import fails. */
export const MODELS = ['globe', 'vault', 'shield', 'key', 'lock', 'lock-2', 'wallet', 'wallet-2', 'stablecoin', 'orbit-globe', 'hsm', 'bank', 'towers', 'bridge', 'coin', 'coin-2', 'ledger', 'validators', 'charter', 'bolt', 'bolt-2', 'depth', 'rig', 'rig-2'];

/* import every model that exists; returns [{name, mod}] and logs (does not throw) for the ones that fail */
export async function loadModels(names = MODELS) {
  const out = [];
  await Promise.all(names.map(async (name, i) => {
    try { out[i] = { name, mod: await import(`./${name}.js`) }; }
    catch (e) { console.info('model skipped:', name, e && e.message); }
  }));
  return out.filter(Boolean);
}
