#!/usr/bin/env node
/*
  Build iq-snapshot.json by fetching Portal IQ points for each relic holder.
  - Input: static/relics-snapshot/relic-holders.json  { [address]: { ... } }
  - Output: static/relics-snapshot/iq-snapshot.json   { [address]: number }

  Points API:
    https://portal.intuition.systems/resources/get-points?accountId=<address>
*/

const fs = require('fs');
const path = require('path');

const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);
const CONCURRENCY = Number(process.env.CONCURRENCY || 8);

/**
 * Fetch JSON with timeout
 * @param {string} url
 * @param {AbortSignal} signal
 */
async function fetchJson(url, signal) {
  const res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Run tasks with concurrency
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

function normalizeAddr(addr) {
  try {
    return String(addr || '').toLowerCase();
  } catch {
    return '';
  }
}

async function main() {
  const root = process.cwd();
  const holdersPath = path.join(root, 'static', 'relics-snapshot', 'relic-holders.json');
  const outPath = path.join(root, 'static', 'relics-snapshot', 'iq-snapshot.json');

  if (!fs.existsSync(holdersPath)) {
    console.error(`Input file not found: ${holdersPath}`);
    process.exit(1);
  }

  /** @type {Record<string, any>} */
  const holders = JSON.parse(fs.readFileSync(holdersPath, 'utf8'));
  const addresses = Object.keys(holders).map(normalizeAddr).filter(Boolean);

  /** @type {Record<string, number>} */
  const results = {};

  let ok = 0, fail = 0;
  const started = Date.now();
  console.log(`Fetching points for ${addresses.length} addresses with concurrency=${CONCURRENCY}...`);

  await runPool(addresses, CONCURRENCY, async (address) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const apiUrl = `https://portal.intuition.systems/resources/get-points?accountId=${encodeURIComponent(address)}`;
      const data = await fetchJson(apiUrl, controller.signal);
      const total = Number(
        data?.points?.total_points ??
        data?.points?.totalPoints ??
        data?.total_points ??
        0
      );
      results[address] = Number.isFinite(total) ? total : 0;
      ok += 1;
      if (ok % 200 === 0) {
        const elapsed = ((Date.now() - started) / 1000).toFixed(1);
        console.log(`  ${ok}/${addresses.length} done... (${elapsed}s)`);
      }
    } catch (e) {
      results[address] = 0;
      fail += 1;
      console.warn(`Failed ${address}: ${(e && e.message) || e}`);
    } finally {
      clearTimeout(t);
    }
  });

  fs.writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${outPath}. ok=${ok}, fail=${fail}`);
}

main();


