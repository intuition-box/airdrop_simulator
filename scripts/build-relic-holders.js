#!/usr/bin/env node
/*
  Build relic-holders.json by fetching token metadata from Phosphor.
  - Input: static/relics-snapshot/holders.json  { [address]: string[] }
  - Output: static/relics-snapshot/relic-holders.json  {
      [address]: {
        [rarityLower]: { normal?: number, genesis?: number }
      }
    }

  Metadata API (per token id):
    https://public-api.phosphor.xyz/v1/metadata/<collectionId>/<tokenId>
*/

const fs = require('fs');
const path = require('path');

const COLLECTION_ID = '4e382831-8b4a-4ca6-8a02-846161d7f38f';
const BASE_URL = `https://public-api.phosphor.xyz/v1/metadata/${COLLECTION_ID}`;
const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

/**
 * Sleep helper
 * @param {number} ms
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch JSON with basic retry/backoff
 * @param {string} url
 */
async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extract rarity and genesis flag from Phosphor metadata document
 * @param {any} meta
 */
function parseRarityAndGenesis(meta) {
  const attrs = Array.isArray(meta?.attributes) ? meta.attributes : [];
  let rarity = undefined;
  let genesis = undefined;
  for (const a of attrs) {
    const t = (a?.trait_type || a?.traitType || '').toString().toLowerCase();
    if (t === 'rarity') {
      rarity = (a?.value || '').toString();
    } else if (t === 'genesis' || t === 'edition') {
      const val = (a?.value || '').toString().toLowerCase();
      genesis = val.includes('yes') || val.includes('genesis');
    }
  }
  // Fallbacks
  if (!rarity && typeof meta?.name === 'string') {
    const m = meta.name.match(/#\d+\s*\(([^)]+)\)/i);
    if (m) rarity = m[1];
  }
  const rarityLower = (rarity || '').toString().toLowerCase();
  return { rarity: rarityLower, genesis: Boolean(genesis) };
}

/**
 * Simple concurrency pool runner
 * @template T
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, i: number) => Promise<void>} worker
 */
async function runPool(items, limit, worker) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const root = process.cwd();
  const holdersPath = path.join(root, 'static', 'relics-snapshot', 'holders.json');
  const outPath = path.join(root, 'static', 'relics-snapshot', 'relic-holders.json');

  if (!fs.existsSync(holdersPath)) {
    console.error(`Input file not found: ${holdersPath}`);
    process.exit(1);
  }

  /** @type {Record<string, string[]>} */
  const holders = JSON.parse(fs.readFileSync(holdersPath, 'utf8'));

  // Unique token ids across all holders
  const uniqueTokenIds = Array.from(
    new Set(
      Object.values(holders).flatMap((arr) => (Array.isArray(arr) ? arr : [])).map((t) => String(t))
    )
  );

  /** @type {Record<string, { rarity: string, genesis: boolean }>} */
  const tokenMeta = {};

  let success = 0;
  let fail = 0;
  const startedAt = Date.now();
  console.log(`Fetching metadata for ${uniqueTokenIds.length} tokens with concurrency=${CONCURRENCY}...`);

  await runPool(uniqueTokenIds, CONCURRENCY, async (tokenId, idx) => {
    const url = `${BASE_URL}/${encodeURIComponent(tokenId)}`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const meta = await fetchJson(url);
        const { rarity, genesis } = parseRarityAndGenesis(meta);
        if (!rarity) {
          throw new Error('Missing rarity');
        }
        tokenMeta[tokenId] = { rarity, genesis };
        success += 1;
        if (success % 100 === 0) {
          const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
          console.log(`  ${success}/${uniqueTokenIds.length} fetched... (${elapsed}s)`);
        }
        return;
      } catch (err) {
        if (attempt === 3) {
          fail += 1;
          console.warn(`Failed token ${tokenId}: ${(err && err.message) || err}`);
        } else {
          await sleep(300 * attempt);
        }
      }
    }
  });

  console.log(`Fetched: ok=${success}, failed=${fail}`);

  /**
   * Aggregate per holder
   */
  /** @type {Record<string, any>} */
  const output = {};
  for (const [address, tokenIds] of Object.entries(holders)) {
    /** @type {Record<string, { normal?: number, genesis?: number }>} */
    const rarities = {};
    for (const tokenId of tokenIds) {
      const info = tokenMeta[String(tokenId)];
      if (!info || !info.rarity) continue;
      const key = info.rarity.toLowerCase();
      if (!rarities[key]) rarities[key] = {};
      const field = info.genesis ? 'genesis' : 'normal';
      rarities[key][field] = (rarities[key][field] || 0) + 1;
    }

    // prune empty fields
    const pruned = {};
    for (const [rarity, counts] of Object.entries(rarities)) {
      const entry = {};
      if (counts.normal) entry.normal = counts.normal;
      if (counts.genesis) entry.genesis = counts.genesis;
      if (Object.keys(entry).length > 0) pruned[rarity] = entry;
    }
    output[address] = pruned;
  }

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${outPath}`);
}

main();


