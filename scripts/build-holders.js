#!/usr/bin/env node
/*
  Build holders.json from snapshot.json
  Input: static/relics-snapshot/snapshot.json { metadata, holders: Array<{address, token_id, quantity}> }
  Output: static/relics-snapshot/holders.json { [address]: string[] }
*/

const fs = require('fs');
const path = require('path');

function main() {
  const root = process.cwd();
  const inPath = path.join(root, 'static', 'relics-snapshot', 'snapshot.json');
  const outPath = path.join(root, 'static', 'relics-snapshot', 'holders.json');

  if (!fs.existsSync(inPath)) {
    console.error(`Input file not found: ${inPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inPath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse snapshot.json as JSON');
    console.error(e.message);
    process.exit(1);
  }

  const list = Array.isArray(data?.holders) ? data.holders : [];
  /** @type {Record<string, string[]>} */
  const holders = {};

  for (const item of list) {
    if (!item || !item.address) continue;
    const address = String(item.address);
    const tokenId = String(item.token_id ?? item.tokenId ?? '');
    if (!tokenId) continue;
    if (!holders[address]) holders[address] = [];
    holders[address].push(tokenId);
  }

  // Optional: sort token ids numerically if possible
  for (const addr of Object.keys(holders)) {
    holders[addr].sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
  }

  const outJson = JSON.stringify(holders, null, 2);
  fs.writeFileSync(outPath, outJson + '\n', 'utf8');
  console.log(`Wrote ${outPath} with ${Object.keys(holders).length} addresses.`);
}

main();


