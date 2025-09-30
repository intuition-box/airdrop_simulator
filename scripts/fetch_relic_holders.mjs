import {writeFile} from 'node:fs/promises';
import https from 'node:https';

const API_KEY = process.env.OPENSEA_API_KEY ?? process.env.NEXT_PUBLIC_OPENSEA_API_KEY ?? '5b48b7551702441ebdc46d3b47b30a1c';
const COLLECTION = 'relics-by-intuition';
const OUTPUT_PATH = new URL('../data/relic_holders.json', import.meta.url);
const API_BASE = 'https://api.opensea.io/api/v2';
const PAGE_LIMIT = Number(process.env.RELIC_SNAPSHOT_LIMIT ?? '200');
const DELAY_MS = Number(process.env.RELIC_SNAPSHOT_DELAY ?? '250');

const RARITIES = new Set(['common', 'rare', 'epic', 'legendary', 'ancient', 'mystic']);
const RARITY_LIST = Array.from(RARITIES);

const createEmptyCounts = () =>
  RARITY_LIST.reduce((acc, key) => {
    acc[key] = {normal: 0, genesis: 0};
    return acc;
  }, {});

const httpFetch = (url, headers) =>
  new Promise((resolve, reject) => {
    const req = https.get(url, {headers}, (res) => {
      const {statusCode = 0} = res;
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (statusCode >= 200 && statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Request failed: ${statusCode}`));
        }
      });
    });
    req.on('error', reject);
  });

const serialise = (walletMap) => {
  const output = {};
  for (const [wallet, rarityCounts] of walletMap.entries()) {
    const rarityObj = {};
    for (const [rarity, counts] of Object.entries(rarityCounts)) {
      const entry = {};
      if (counts.normal > 0) entry.normal = counts.normal;
      if (counts.genesis > 0) entry.genesis = counts.genesis;
      if (Object.keys(entry).length > 0) rarityObj[rarity] = entry;
    }
    if (Object.keys(rarityObj).length > 0) output[wallet] = rarityObj;
  }
  return output;
};

const extractTraitValue = (traits, name) => {
  if (!Array.isArray(traits)) return '';
  const entry = traits.find((trait) => {
    const traitType = (trait?.trait_type ?? trait?.type ?? '').toString().toLowerCase();
    return traitType === name.toLowerCase();
  });
  return (entry?.value ?? entry?.trait_value ?? '').toString();
};

const fetchAllNfts = async () => {
  const headers = {accept: 'application/json'};
  if (API_KEY) headers['x-api-key'] = API_KEY;

  let cursor = null;
  const walletMap = new Map();

  do {
    const params = new URLSearchParams({limit: String(PAGE_LIMIT)});
    if (cursor) params.set('next', cursor);

    const url = `${API_BASE}/collection/${COLLECTION}/nfts?${params.toString()}`;
    const body = await httpFetch(url, headers);
    const nfts = body?.nfts ?? [];

    for (const nft of nfts) {
      const owner = nft?.owner ?? nft?.owners?.[0]?.address ?? nft?.owners?.[0]?.owner_address;
      if (!owner) continue;

      const traits = nft?.traits ?? nft?.metadata?.attributes ?? nft?.attributes ?? [];
      const rarity = extractTraitValue(traits, 'rarity').toLowerCase();
      if (!RARITIES.has(rarity)) continue;

      const edition = extractTraitValue(traits, 'edition').toLowerCase();
      const isGenesis = edition.includes('genesis');

      const key = owner.toLowerCase();
      if (!walletMap.has(key)) walletMap.set(key, createEmptyCounts());
      const counts = walletMap.get(key)[rarity];
      if (isGenesis) counts.genesis += 1;
      else counts.normal += 1;
    }

    cursor = body?.next ?? null;
    if (cursor && DELAY_MS > 0) await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  } while (cursor);

  return walletMap;
};

const main = async () => {
  try {
    console.log(`Fetching relic holders for ${COLLECTION}...`);
    const holders = await fetchAllNfts();
    const serialised = serialise(holders);
    await writeFile(OUTPUT_PATH, `${JSON.stringify(serialised, null, 2)}\n`, 'utf8');
    console.log(`Snapshot written to ${OUTPUT_PATH.pathname}`);
    console.log(`Wallets discovered: ${Object.keys(serialised).length}`);
  } catch (error) {
    console.error('Failed to snapshot relic holders:', error);
    process.exitCode = 1;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
