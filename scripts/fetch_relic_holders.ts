import {writeFile} from 'node:fs/promises';
const API_KEY = process.env.OPENSEA_API_KEY ?? process.env.NEXT_PUBLIC_OPENSEA_API_KEY ?? '5b48b7551702441ebdc46d3b47b30a1c';
const COLLECTION = 'relics-by-intuition';
const OUTPUT_PATH = new URL('../data/relic_holders.json', import.meta.url);
const API_BASE = 'https://api.opensea.io/api/v2';
const PAGE_LIMIT = 200;
const DELAY_MS = Number(process.env.RELIC_SNAPSHOT_DELAY ?? '250');

const RARITIES = new Set(['common', 'rare', 'epic', 'legendary', 'ancient', 'mystic']);

interface HolderCounts {
  [rarity: string]: {
    normal?: number;
    genesis?: number;
  };
}

type RarityCounts = Map<string, {normal: number; genesis: number}>;

type WalletMap = Map<string, RarityCounts>;

function ensureWallet(map: WalletMap, wallet: string): RarityCounts {
  const key = wallet.toLowerCase();
  if (!map.has(key)) {
    map.set(key, new Map());
  }
  return map.get(key)!;
}

function ensureRarity(counts: RarityCounts, rarity: string) {
  if (!counts.has(rarity)) {
    counts.set(rarity, {normal: 0, genesis: 0});
  }
  return counts.get(rarity)!;
}

function extractTraitValue(traits: any[], name: string): string {
  const match = traits.find((trait) => {
    const type = (trait?.trait_type ?? trait?.type ?? '').toString().toLowerCase();
    return type === name.toLowerCase();
  });
  if (!match) {
    return '';
  }
  return (match?.value ?? match?.trait_value ?? '').toString();
}

async function fetchAllNfts(): Promise<WalletMap> {
  const headers: Record<string, string> = {accept: 'application/json'};
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  let cursor: string | null = null;
  const walletMap: WalletMap = new Map();

  do {
    const params = new URLSearchParams({limit: String(PAGE_LIMIT)});
    if (cursor) {
      params.set('next', cursor);
    }
    const url = `${API_BASE}/collection/${COLLECTION}/nfts?${params.toString()}`;

    const response = await fetch(url, {headers});
    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs (${response.status} ${response.statusText})`);
    }
    const body: any = await response.json();
    const nfts: any[] = body?.nfts ?? [];

    for (const nft of nfts) {
      const ownerAddress: string | undefined = nft?.owner ?? nft?.owners?.[0]?.address ?? nft?.owners?.[0]?.owner_address;
      if (!ownerAddress) {
        continue;
      }
      const traits: any[] = nft?.traits ?? nft?.metadata?.attributes ?? nft?.attributes ?? [];
      const rarityRaw = extractTraitValue(traits, 'rarity').toLowerCase();
      if (!RARITIES.has(rarityRaw)) {
        continue;
      }
      const edition = extractTraitValue(traits, 'edition').toLowerCase();
      const isGenesis = edition.includes('genesis');

      const walletCounts = ensureWallet(walletMap, ownerAddress);
      const rarityCounts = ensureRarity(walletCounts, rarityRaw);
      if (isGenesis) {
        rarityCounts.genesis += 1;
      } else {
        rarityCounts.normal += 1;
      }
    }

    cursor = body?.next ?? null;
    if (cursor && DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  } while (cursor);

  return walletMap;
}

function serialise(holderMap: WalletMap): HolderCounts {
  const output: HolderCounts = {};
  for (const [wallet, rarityCounts] of holderMap.entries()) {
    const rarityObj: HolderCounts[string] = {};
    for (const [rarity, counts] of rarityCounts.entries()) {
      const {normal, genesis} = counts;
      const entry: {normal?: number; genesis?: number} = {};
      if (normal > 0) {
        entry.normal = normal;
      }
      if (genesis > 0) {
        entry.genesis = genesis;
      }
      if (Object.keys(entry).length > 0) {
        rarityObj[rarity] = entry;
      }
    }
    if (Object.keys(rarityObj).length > 0) {
      output[wallet] = rarityObj;
    }
  }
  return output;
}

async function main() {
  try {
    console.log('Fetching relic holders for collection:', COLLECTION);
    const holders = await fetchAllNfts();
    const serialised = serialise(holders);
    await writeFile(OUTPUT_PATH, `${JSON.stringify(serialised, null, 2)}\n`, 'utf8');
    console.log(`Snapshot saved to ${OUTPUT_PATH.pathname}`);
    console.log(`Wallets processed: ${Object.keys(serialised).length}`);
  } catch (error) {
    console.error('Failed to snapshot relic holders:', error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
