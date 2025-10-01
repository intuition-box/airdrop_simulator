"use client";
import {
  useCallback,
  useMemo,
  useState,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import useBaseUrl from '@docusaurus/useBaseUrl';

type Rarity = "common" | "rare" | "epic" | "legendary" | "ancient" | "mystic";

const LABELS: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  ancient: "Ancient",
  mystic: "Mystic",
};
const RARITY_LIST = Object.keys(LABELS) as Rarity[];

const DEFAULT_NORMAL_BONUS: Record<Rarity, number> = {
  common: 500_000,
  rare: 750_000,
  epic: 1_000_000,
  legendary: 2_000_000,
  ancient: 4_000_000,
  mystic: 25_000_000,
};
const DEFAULT_GENESIS_BONUS: Record<Rarity, number> = {
  common: 1_000_000,
  rare: 1_500_000,
  epic: 2_000_000,
  legendary: 4_000_000,
  ancient: 8_000_000,
  mystic: 50_000_000,
};

const PRESET_IQ_PER_TRUST = [500, 750, 1000];
const FDV_MIN = 50_000_000;
const FDV_MAX = 1_000_000_000;
const FDV_MULTIPLIERS = [1, 2, 4, 8, 16, 32];
const FDV_PRESETS = [50_000_000, 500_000_000, 1_000_000_000];
const TOTAL_SUPPLY = 1_000_000_000;
const VESTING_TGE = new Date('2025-10-15T00:00:00Z');
const VESTING_MONTHS = 24;
const DEFAULT_OPENSEA_API_KEY = '5b48b7551702441ebdc46d3b47b30a1c';

const RARITY_COLORS: Record<Rarity, string> = {
  common: "#d1d5db",
  rare: "#7dd3fc",
  epic: "#f472b6",
  legendary: "#fb923c",
  ancient: "#d9f99d",
  mystic: "#c4b5fd",
};

// Final IQ multiplier (as PERCENT values from spec). We'll convert to factor later.
const GENESIS_FINAL_MULTIPLIER_PERCENT: Partial<Record<Rarity, number>> = {
  common: 50,
  rare: 75,
  epic: 125,
  legendary: 200,
  ancient: 300,
  mystic: 300, // treat Mystic as Ancient unless otherwise specified
};
const NORMAL_FINAL_MULTIPLIER_PERCENT: Partial<Record<Rarity, number>> = {
  common: 12.5,
  rare: 18.5,
  epic: 31.25,
  legendary: 50,
  ancient: 75,
  mystic: 75, // treat Mystic as Ancient unless otherwise specified
};

// Use Docusaurus baseUrl helper for static assets

const formatThousands = (value: number): string =>
  Number.isFinite(value)
    ? Math.trunc(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : '';

const formatNumber = (value: number, decimals = 2, trim = true): string => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const fixed = value.toFixed(decimals);
  const [integerPart, fractionalPartRaw = ''] = fixed.split('.');
  const spacedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (!fractionalPartRaw) {
    return spacedInt;
  }
  const fractionalPart = trim ? fractionalPartRaw.replace(/0+$/, '') : fractionalPartRaw;
  return fractionalPart ? `${spacedInt}.${fractionalPart}` : spacedInt;
};

const formatUsd = (value: number): string => formatNumber(value, 2, true);

const formatFdvShort = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  if (value >= 1_000_000_000) {
    return `${formatNumber(value / 1_000_000_000, 2, true)}B`;
  }
  return `${formatNumber(value / 1_000_000, 2, true)}M`;
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const createEmptyCounts = (): Record<Rarity, number> =>
  RARITY_LIST.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<Rarity, number>);

// Helper: convert hex color (e.g. #ffcc00) to rgb tuple
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function RelicFrame({
  children,
  rarity,
  radius = 20,
  highlighted = false,
}: {
  children: ReactNode;
  rarity: Rarity;
  radius?: number;
  highlighted?: boolean;
}) {
  const rarityColor = RARITY_COLORS[rarity];
  
  const cardStyle: CSSProperties = {
    borderRadius: radius,
    background: "rgba(0, 0, 0, 0.8)",
    border: highlighted ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
    position: "relative",
    overflow: "hidden",
    boxShadow: highlighted
      ? "0 0 0 2px rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.5)"
      : "0 20px 60px rgba(0,0,0,0.45)",
  };

  const topBorderStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: highlighted ? "4px" : "3px",
    background: rarity === "mystic" 
      ? "linear-gradient(90deg, #7dd3fc, #c4b5fd, #fbb6ce, #fcd34d, #d9f99d, #60a5fa)"
      : rarityColor,
  };

  return (
    <div style={cardStyle} className="shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div style={topBorderStyle} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function TrustAirdropCalculator() {
  const [iq, setIq] = useState<number>(500000);
  const [iqPerTrust, setIqPerTrust] = useState<number>(750);
  const clampIqPerTrust = (v: number) => Math.max(1, Math.floor(v || 1));

  const [fdvUsd, setFdvUsd] = useState<number>(150_000_000);

  const [isRelicHolder, setIsRelicHolder] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isFetchingWallet, setIsFetchingWallet] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [normalCounts, setNormalCounts] = useState<Record<Rarity, number>>(createEmptyCounts);
  const [genesisCounts, setGenesisCounts] = useState<Record<Rarity, number>>(createEmptyCounts);

  const [bonusN, setBonusN] = useState<Record<Rarity, number>>({ ...DEFAULT_NORMAL_BONUS });
  const [bonusG, setBonusG] = useState<Record<Rarity, number>>({ ...DEFAULT_GENESIS_BONUS });

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedFinalMultiplier, setSelectedFinalMultiplier] = useState<{ rarity: Rarity; isGenesis: boolean } | null>(null);

  // Resolve asset URLs unconditionally to respect hooks rules
  const commonUrl = useBaseUrl('/images/relics/common.png');
  const rareUrl = useBaseUrl('/images/relics/rare.png');
  const epicUrl = useBaseUrl('/images/relics/epic.png');
  const legendaryUrl = useBaseUrl('/images/relics/legendary.png');
  const ancientUrl = useBaseUrl('/images/relics/ancient.png');
  const mysticUrl = useBaseUrl('/images/relics/mystic.png');
  const relicHoldersUrl = useBaseUrl('/relics-snapshot/relic-holders.json');
  const iqSnapshotUrl = useBaseUrl('/relics-snapshot/iq-snapshot.json');
  const relicImageSrc: Record<Rarity, string> = {
    common: commonUrl,
    rare: rareUrl,
    epic: epicUrl,
    legendary: legendaryUrl,
    ancient: ancientUrl,
    mystic: mysticUrl,
  };

  const trustBefore = useMemo(() => (iqPerTrust > 0 ? iq / iqPerTrust : 0), [iq, iqPerTrust]);
  const trustPrice = fdvUsd / TOTAL_SUPPLY;

  const relicBonusIq = useMemo(() => {
    if (!isRelicHolder) {
      return 0;
    }
    return (Object.keys(LABELS) as Rarity[]).reduce((acc, r) => {
      const normalCount = Math.max(0, normalCounts[r] ?? 0);
      const genesisCount = Math.max(0, genesisCounts[r] ?? 0);
      const normalBonus = Math.max(0, bonusN[r] ?? 0);
      const genesisBonus = Math.max(0, bonusG[r] ?? 0);
      return acc + normalCount * normalBonus + genesisCount * genesisBonus;
    }, 0);
  }, [isRelicHolder, normalCounts, genesisCounts, bonusN, bonusG]);

  const highestRarity = useMemo(() => {
    // Determine highest rarity present, preferring genesis over normal when both exist for a given rarity
    const order: Rarity[] = ['mystic', 'ancient', 'legendary', 'epic', 'rare', 'common'];
    for (const r of order) {
      const hasGenesis = (genesisCounts[r] ?? 0) > 0;
      const hasNormal = (normalCounts[r] ?? 0) > 0;
      if (hasGenesis || hasNormal) {
        return { r, isGenesis: hasGenesis };
      }
    }
    return null;
  }, [normalCounts, genesisCounts]);

  const effectiveSelectedFinal = useMemo(() => {
    if (!isRelicHolder) return null;
    // Only apply if the user explicitly selected a global multiplier; otherwise none
    if (selectedFinalMultiplier) {
      return { rarity: selectedFinalMultiplier.rarity, isGenesis: selectedFinalMultiplier.isGenesis } as const;
    }
    return null;
  }, [isRelicHolder, selectedFinalMultiplier]);

  const finalIqMultiplier = useMemo(() => {
    if (!effectiveSelectedFinal) return 0;
    const table = effectiveSelectedFinal.isGenesis ? GENESIS_FINAL_MULTIPLIER_PERCENT : NORMAL_FINAL_MULTIPLIER_PERCENT;
    const pct = Math.max(0, table[effectiveSelectedFinal.rarity] ?? 0);
    return pct / 100;
  }, [effectiveSelectedFinal]);

  const finalMultiplierFactor = useMemo(() => 1 + finalIqMultiplier, [finalIqMultiplier]);

  const displayMultiplier = useMemo(() => {
    if (finalMultiplierFactor <= 1) return '';
    const rounded = Math.round(finalMultiplierFactor * 100) / 100;
    const nearInt = Math.abs(rounded - Math.round(rounded)) < 1e-6;
    return nearInt ? String(Math.round(rounded)) : formatNumber(rounded, 2, true);
  }, [finalMultiplierFactor]);

  const portalIqAfterMultiplier = useMemo(() => {
    return Math.max(0, iq * finalMultiplierFactor);
  }, [iq, finalMultiplierFactor]);

  const multiplierGlowStyle = useMemo((): CSSProperties => {
    if (!effectiveSelectedFinal || finalMultiplierFactor <= 1) return {};
    const rarityColor = RARITY_COLORS[effectiveSelectedFinal.rarity];
    const rgb = hexToRgb(rarityColor) || { r: 255, g: 255, b: 255 };
    const base = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b},`;
    const isGenesis = effectiveSelectedFinal.isGenesis;
    return {
      boxShadow: isGenesis
        ? `0 0 0 2px ${base} 0.75), 0 0 200px ${base} 0.4), 0 0 60px ${base} 0.75)`
        : `0 0 0 1px ${base} 0.25), 0 0 14px ${base} 0.25)`,
      background: isGenesis
        ? `radial-gradient(120% 120% at 50% 0%, ${base} 0.12) 0), rgba(255,255,255,0) 40%)`
        : undefined,
      transition: 'box-shadow 200ms ease, background 200ms ease',
      animation: isGenesis ? 'pulseGlow 5s ease-in-out infinite' : undefined,
    };
  }, [effectiveSelectedFinal, finalMultiplierFactor]);

  const multiplierBadgeStyle = useMemo((): CSSProperties => {
    if (!effectiveSelectedFinal || finalMultiplierFactor <= 1) return {};
    const hex = RARITY_COLORS[effectiveSelectedFinal.rarity];
    const rgb = hexToRgb(hex) || { r: 255, g: 255, b: 255 };
    const border = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
    const bg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${effectiveSelectedFinal.isGenesis ? 0.22 : 0.14})`;
    const glow = `0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${effectiveSelectedFinal.isGenesis ? 0.5 : 0.3})`;
    return {
      borderColor: border,
      background: bg,
      boxShadow: glow,
    };
  }, [effectiveSelectedFinal, finalMultiplierFactor]);

  const totalIq = useMemo(() => {
    const portalWithMultiplier = Math.max(0, iq * finalMultiplierFactor);
    const total = portalWithMultiplier + Math.max(0, relicBonusIq);
    return Math.max(0, total);
  }, [iq, relicBonusIq, finalMultiplierFactor]);

  const trustAfter = useMemo(() => {
    return iqPerTrust > 0 ? Math.max(0, totalIq / iqPerTrust) : 0;
  }, [totalIq, iqPerTrust]);

  const usdAfter = useMemo(() => Math.max(0, trustAfter * Math.max(0, trustPrice)), [trustAfter, trustPrice]);


  const normalizedWallet = walletAddress.trim().toLowerCase();
  const showWalletClear = normalizedWallet.length > 0 && (normalizedWallet.startsWith('0x') || normalizedWallet.includes('.'));
  const vestingSchedule = useMemo(() => {
    const schedule: Array<{date: Date; amount: number; label: string}> = [];
    if (!Number.isFinite(trustAfter) || trustAfter <= 0) {
      return schedule;
    }

    const immediateAmount = trustAfter * 0.5;
    schedule.push({date: VESTING_TGE, amount: immediateAmount, label: 'TGE unlock (50%)'});

    const monthlyAmount = (trustAfter * 0.5) / VESTING_MONTHS;
    for (let i = 1; i <= VESTING_MONTHS; i += 1) {
      const date = new Date(VESTING_TGE);
      date.setMonth(date.getMonth() + i);
      schedule.push({
        date,
        amount: monthlyAmount,
        label: `Month ${i}`,
      });
    }
    return schedule;
  }, [trustAfter]);

  const beforePct = trustAfter > 0 ? Math.min(100, (trustBefore / trustAfter) * 100) : 0;
  const effectiveRatio = useMemo(() => (trustAfter > 0 ? iq / trustAfter : iqPerTrust), [iq, iqPerTrust, trustAfter]);

  const marginalByRarity = useMemo(() => {
    return (Object.keys(LABELS) as Rarity[]).map((r) => {
      const normalBonusIq = Math.max(0, bonusN[r]);
      const genesisBonusIq = Math.max(0, bonusG[r]);
      const normalTrust = normalBonusIq / iqPerTrust;
      const genesisTrust = genesisBonusIq / iqPerTrust;
      return {
        r,
        normal: { iq: normalBonusIq, trust: normalTrust },
        genesis: { iq: genesisBonusIq, trust: genesisTrust },
      };
    });
  }, [bonusN, bonusG, iqPerTrust]);

  const totalRelicsOwned = useMemo(() => {
    return (Object.keys(LABELS) as Rarity[]).reduce((acc, r) => {
      return acc + Math.max(0, normalCounts[r] ?? 0) + Math.max(0, genesisCounts[r] ?? 0);
    }, 0);
  }, [normalCounts, genesisCounts]);

  const fetchWalletData = useCallback(async () => {
    const input = walletAddress.trim();
    if (!input) {
      setWalletError('Please enter a wallet address');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsFetchingWallet(true);
    setWalletError(null);

    try {
      // Helper: detect hex address
      const isHexAddress = (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v);
      // Helper: ENS resolution via public endpoint
      const resolveEns = async (name: string, signal: AbortSignal): Promise<string | null> => {
        try {
          const resp = await fetch(`https://api.ensideas.com/ens/resolve/${encodeURIComponent(name)}`, {
            signal,
            headers: { accept: 'application/json' },
          });
          if (!resp.ok) return null;
          const data = await resp.json();
          const addr = data?.address ?? data?.resolvedAddress ?? null;
          if (typeof addr === 'string' && isHexAddress(addr)) {
            return addr.toLowerCase();
          }
          return null;
        } catch (e) {
          return null;
        }
      };

      // Normalize input to an address (supports ENS)
      let raw = input.toLowerCase();
      if (!isHexAddress(raw)) {
        if (raw.includes('.') || raw.endsWith('.eth')) {
          const resolved = await resolveEns(raw, controller.signal);
          if (!resolved) {
            throw new Error('Unable to resolve ENS name to an address');
          }
          raw = resolved;
        } else {
          throw new Error('Invalid address or ENS name');
        }
      }

      // Load IQ from local snapshot first; fallback to API if not present
      let iqLoadedFromLocal = false;
      try {
        const localIqResp = await fetch(iqSnapshotUrl, { signal: controller.signal, headers: { accept: 'application/json' } });
        if (localIqResp.ok) {
          const iqMap: Record<string, number> = await localIqResp.json();
          // keys are lowercased addresses
          const val = iqMap[raw] ?? iqMap[raw.toLowerCase()];
          if (Number.isFinite(val)) {
            setIq(Math.max(0, Number(val)));
            iqLoadedFromLocal = true;
          }
        }
      } catch (_) {
        // ignore snapshot errors
      }
      if (!iqLoadedFromLocal) {
      try {
        const pointsResp = await fetch(
            `https://v0-airdrop-checker-design.vercel.app/api/get-points?address=${encodeURIComponent(raw)}&accountId=${encodeURIComponent(raw)}`,
          {
            signal: controller.signal,
            headers: {accept: 'application/json'},
          },
        );
        if (pointsResp.ok) {
          const pointsData = await pointsResp.json();
          const totalPoints =
            pointsData?.points?.total_points ?? pointsData?.points?.totalPoints ?? pointsData?.total_points ?? 0;
          if (Number.isFinite(totalPoints)) {
            setIq(Math.max(0, Number(totalPoints)));
          }
        } else if (pointsResp.status !== 404) {
          throw new Error('Failed to fetch IQ points');
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setWalletError('Unable to fetch IQ points for this wallet');
          }
        }
      }

      // Try local relic holders snapshot first
      let loadedFromLocal = false;
      try {
        const localResp = await fetch(relicHoldersUrl, { signal: controller.signal, headers: { accept: 'application/json' } });
        if (localResp.ok) {
          const holdersData: Record<string, any> = await localResp.json();
          const targetLower = raw;
          let entry: any = holdersData[raw] ?? holdersData[targetLower];
          if (!entry) {
            for (const key in holdersData) {
              if (Object.prototype.hasOwnProperty.call(holdersData, key)) {
                if (key.toLowerCase() === targetLower) {
                  entry = holdersData[key];
                  break;
                }
              }
            }
          }

          if (entry && typeof entry === 'object') {
            const nextNormal = createEmptyCounts();
            const nextGenesis = createEmptyCounts();
            (Object.keys(entry) as Array<string>).forEach((rarityKey) => {
              const rarity = rarityKey.toLowerCase() as Rarity;
              if (!RARITY_LIST.includes(rarity)) return;
              const bucket = entry[rarityKey] || {};
              const normalNum = Math.max(0, Number(bucket.normal || 0) || 0);
              const genesisNum = Math.max(0, Number(bucket.genesis || 0) || 0);
              nextNormal[rarity] += normalNum;
              nextGenesis[rarity] += genesisNum;
            });

            setNormalCounts(nextNormal);
            setGenesisCounts(nextGenesis);
            setIsRelicHolder(
              RARITY_LIST.some((key) => (nextNormal[key] ?? 0) + (nextGenesis[key] ?? 0) > 0),
            );
            loadedFromLocal = true;
          } else {
            // not found in snapshot
            setToastMsg('You were not a relic holder at snapshot time.\nYou have to enter your IQ points manually.');
          }
        }
      } catch (err) {
        // ignore local load errors, fallback to OpenSea
      }

      // Fallback to OpenSea NFT API when not found locally
      if (!loadedFromLocal) try {
        const headers: Record<string, string> = {accept: 'application/json'};
        const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY ?? process.env.OPENSEA_API_KEY ?? DEFAULT_OPENSEA_API_KEY;
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }
        const nftResp = await fetch(
          `https://api.opensea.io/api/v2/chain/ethereum/account/${encodeURIComponent(raw)}/nfts?collection=relics-by-intuition`,
          {
            signal: controller.signal,
            headers,
          },
        );
        if (nftResp.ok) {
          const nftData = await nftResp.json();
          const assets = nftData?.nfts ?? nftData?.assets ?? [];
          const nextNormal = createEmptyCounts();
          const nextGenesis = createEmptyCounts();

          assets.forEach((asset: any) => {
            const traits = asset?.traits ?? asset?.metadata?.attributes ?? asset?.attributes ?? [];
            if (!Array.isArray(traits)) {
              return;
            }
            const getTrait = (name: string): string => {
              const entry = traits.find((t: any) => {
                const traitType = (t?.trait_type ?? t?.type ?? '').toString().toLowerCase();
                return traitType === name.toLowerCase();
              });
              return (entry?.value ?? entry?.trait_value ?? '').toString();
            };

            const rarityRaw = getTrait('rarity');
            const editionRaw = getTrait('edition');
            const rarity = rarityRaw.toLowerCase();
            if (!RARITY_LIST.includes(rarity as Rarity)) {
              return;
            }
            const rarityKey = rarity as Rarity;
            const isGenesis = editionRaw.toLowerCase().includes('genesis');
            if (isGenesis) {
              nextGenesis[rarityKey] += 1;
            } else {
              nextNormal[rarityKey] += 1;
            }
          });

          setNormalCounts(nextNormal);
          setGenesisCounts(nextGenesis);
          setIsRelicHolder(
            RARITY_LIST.some((key) => (nextNormal[key] ?? 0) + (nextGenesis[key] ?? 0) > 0),
          );
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setWalletError((prev) => prev ?? 'Unable to fetch relics for this wallet');
        }
      }
    } finally {
      setIsFetchingWallet(false);
    }
  }, [walletAddress, iqPerTrust]);

  const stepNormal = (r: Rarity, delta: number) =>
    setNormalCounts((prev) => ({ ...prev, [r]: Math.max(0, (prev[r] ?? 0) + delta) }));
  const stepGenesis = (r: Rarity, delta: number) =>
    setGenesisCounts((prev) => ({ ...prev, [r]: Math.max(0, (prev[r] ?? 0) + delta) }));

  const setBonusNormal = (r: Rarity, val: string) =>
    setBonusN((s) => ({ ...s, [r]: Math.max(0, parseFloat(val || '0') || 0) }));
  const setBonusGenesis = (r: Rarity, val: string) =>
    setBonusG((s) => ({ ...s, [r]: Math.max(0, parseFloat(val || '0') || 0) }));

  const resetCounts = () => {
    setNormalCounts({ common: 0, rare: 0, epic: 0, legendary: 0, ancient: 0, mystic: 0 });
    setGenesisCounts({ common: 0, rare: 0, epic: 0, legendary: 0, ancient: 0, mystic: 0 });
  };
  const resetBonuses = () => {
    setBonusN({ ...DEFAULT_NORMAL_BONUS });
    setBonusG({ ...DEFAULT_GENESIS_BONUS });
  };


  const shellStyle: CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05))',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 25px 70px rgba(3, 10, 24, 0.45)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
  };

  return (
    <div
      className="mx-auto max-w-6xl p-6 md:p-10 text-white rounded-3xl"
      style={shellStyle}>
      {toastMsg && (
        <div className="fixed left-1/2 top-6 -translate-x-1/2 z-[1000] px-3">
          <div
            role="alert"
            aria-live="assertive"
            className="toast max-w-xl rounded-2xl border border-white/15 bg-gradient-to-b from-rose-600/95 to-rose-500/95 backdrop-blur-sm px-5 py-4 shadow-[0_14px_45px_rgba(244,63,94,0.55)] ring-1 ring-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="text-lg leading-none">⚠️</div>
              <div className="text-sm md:text-base font-medium text-white leading-snug whitespace-pre-line">{toastMsg}</div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setToastMsg(null)}
                className="text-xs md:text-[13px] text-white/90 hover:text-white underline underline-offset-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="text-center mb-8">
          {/* <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
            Simulate your airdrop rewards based on IQ points and relic multipliers
          </h1> */}
            <p className="text-white/60 text-sm md:text-base">
              Simulate your $TRUST airdrop rewards based on IQ points and Relic
            </p>
            <p className="text-white/40 text-xs md:text-sm mt-2 back">
              ⚠️ This is an unofficial simulator -- for fun only! ⚠️
            </p>
      </div>

      {/* Wallet address input moved inside Relics section */}

      {/* Wallet → Relics → Calculator order */}

      {/* Relic section moved above calculator */}
      <div className="mt-8 mb-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <label className="inline-flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isRelicHolder}
              onChange={(e) => setIsRelicHolder(e.target.checked)}
              className="peer sr-only"
              aria-label="Relic holder"
            />
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isRelicHolder ? "bg-white" : "bg-white/25"}`}>
              <span className={`h-5 w-5 transform rounded-full bg-black transition ${isRelicHolder ? "translate-x-5" : "translate-x-1"}`} />
            </span>
            <span className="text-sm font-medium">Relic holder</span>
          </label>

          <form
            className="flex items-end gap-2 md:gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              fetchWalletData();
            }}
          >
            <label className="sr-only">Relics holder address (0x or ENS)</label>
            <div className="relative w-64 md:w-[32rem]">
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.currentTarget.value)}
                className="w-full border border-white/15 rounded-2xl px-4 pr-12 py-2.5 bg-black/60 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
                placeholder="0x... or name.eth"
              />
              {showWalletClear && (
                <button
                  type="button"
                  onClick={() => {
                    setWalletAddress('');
                    setWalletError(null);
                    abortControllerRef.current?.abort();
                  }}
                  className="absolute inset-y-0 right-2 flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
                  aria-label="Clear wallet address"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isFetchingWallet}
              className={`text-xs md:text-sm px-3 md:px-4 py-2 rounded-full border transition ${
                isFetchingWallet
                  ? 'border-white/20 bg-white/10 text-white/40 cursor-not-allowed'
                  : 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isFetchingWallet ? 'Fetching…' : 'Fetch data'}
            </button>
          </form>

          {isRelicHolder && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/10">
                <span className="text-white/70">Total relics</span>
                <span className="font-semibold text-white">{totalRelicsOwned}</span>
              </span>
            <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition"
                onClick={resetCounts}
              >
                Reset counts
            </button>
            <button
              type="button"
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition"
                onClick={resetBonuses}
              >
                Reset bonuses
            </button>
          </div>
          )}
        </div>

        {isRelicHolder && (
          <>
            <div className="mt-6 md:hidden -mx-1 px-1">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
                {(Object.keys(LABELS) as Rarity[]).map((r) => {
                  return (
                    <div key={`mobile-${r}`} className="snap-start shrink-0 w-[85%]">
                          <RelicFrame key={`mobile-frame-${r}`} rarity={r}>
                          <div className="p-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={relicImageSrc[r]} 
                                    alt={`${LABELS[r]} relic`}
                                    className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                        const fallback = (e.currentTarget.nextElementSibling as HTMLElement);
                                        if (fallback) fallback.style.display = 'block';
                                      }}
                                  />
                                  <span className="text-2xl hidden">💎</span>
                                </div>
                                <div>
                                  <div className="font-semibold text-lg text-white">{LABELS[r]}</div>
                                  <div className="text-xs text-white/60">
                                    {normalCounts[r]} Normal • {genesisCounts[r]} Genesis
                                </div>
                              </div>
                            </div>

                              <RelicBody
                                rarity={r}
                                normalCounts={normalCounts}
                                genesisCounts={genesisCounts}
                                stepNormal={stepNormal}
                                stepGenesis={stepGenesis}
                                bonusN={bonusN}
                                bonusG={bonusG}
                                setBonusNormal={setBonusNormal}
                                setBonusGenesis={setBonusGenesis}
                                showAdvanced={showAdvanced}
                                marginalByRarity={marginalByRarity}
                              />

                              {/* Final multiplier radio for mobile (expose on every rarity except Mystic) */}
                              {(() => {
                                const order: Rarity[] = ['mystic', 'ancient', 'legendary', 'epic', 'rare', 'common'];
                                if (r === 'mystic') return null;
                                const hasG = (genesisCounts[r] ?? 0) > 0;
                                const hasN = (normalCounts[r] ?? 0) > 0;
                                const activeKey = effectiveSelectedFinal ? `${effectiveSelectedFinal.rarity}-${effectiveSelectedFinal.isGenesis ? 'G' : 'N'}` : '';
                                const percentNormal = NORMAL_FINAL_MULTIPLIER_PERCENT[r] ?? 0;
                                const percentGenesis = GENESIS_FINAL_MULTIPLIER_PERCENT[r] ?? 0;
                                return (
                                  <div className="mt-3">
                                    <div className="text-[11px] text-white/60 mb-2">Relic Mint+HODL Multiplier</div>
                                    <div className="flex items-center gap-2">
                                      <label className="inline-flex items-center gap-1 text-[11px]">
                                        <input
                                          type="radio"
                                          name={`final-multiplier-mobile-${r}`}
                                          checked={activeKey === `${r}-N`}
                                          onChange={() => setSelectedFinalMultiplier({ rarity: r, isGenesis: false })}
                                        />
                                        <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/10">
                                          Normal (+{formatNumber(percentNormal, 2, true)}%)
                                        </span>
                                      </label>
                                      <label className="inline-flex items-center gap-1 text-[11px]">
                                        <input
                                          type="radio"
                                          name={`final-multiplier-mobile-${r}`}
                                          checked={activeKey === `${r}-G`}
                                          onChange={() => setSelectedFinalMultiplier({ rarity: r, isGenesis: true })}
                                        />
                                        <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/10">
                                          Genesis (+{formatNumber(percentGenesis, 2, true)}%)
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </RelicFrame>
                    </div>
                  );
                })}
              </div>
            </div>


            <div className="mt-6 hidden md:grid md:grid-cols-3 gap-4">
              {(Object.keys(LABELS) as Rarity[]).map((r) => {
                return (
                    <RelicFrame key={`desktop-${r}`} rarity={r}>
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
                            <img 
                              src={relicImageSrc[r]} 
                              alt={`${LABELS[r]} relic`}
                              className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                        const fallback = (e.currentTarget.nextElementSibling as HTMLElement);
                                        if (fallback) fallback.style.display = 'block';
                                      }}
                            />
                            <span className="text-3xl hidden">💎</span>
                          </div>
                          <div>
                            <div className="font-semibold text-lg text-white">{LABELS[r]}</div>
                            <div className="text-xs text-white/60">
                              {normalCounts[r]} Normal • {genesisCounts[r]} Genesis
                            </div>
                          </div>
                        </div>

                        <RelicBody
                          rarity={r}
                          normalCounts={normalCounts}
                          genesisCounts={genesisCounts}
                          stepNormal={stepNormal}
                          stepGenesis={stepGenesis}
                          bonusN={bonusN}
                          bonusG={bonusG}
                          setBonusNormal={setBonusNormal}
                          setBonusGenesis={setBonusGenesis}
                          showAdvanced={showAdvanced}
                          marginalByRarity={marginalByRarity}
                        />

                        {/* Final multiplier radio selection (expose on every rarity) */}
                        {(() => {
                          if (r === 'mystic') return null;
                          const hasG = (genesisCounts[r] ?? 0) > 0;
                          const hasN = (normalCounts[r] ?? 0) > 0;
                          const activeKey = effectiveSelectedFinal ? `${effectiveSelectedFinal.rarity}-${effectiveSelectedFinal.isGenesis ? 'G' : 'N'}` : '';
                          const percentNormal = NORMAL_FINAL_MULTIPLIER_PERCENT[r] ?? 0;
                          const percentGenesis = GENESIS_FINAL_MULTIPLIER_PERCENT[r] ?? 0;
                          return (
                            <div className="mt-4">
                              <div className="text-xs text-white/60 mb-2">Relic Mint+HODL Multiplier</div>
                              <div className="flex flex-wrap items-center gap-3">
                                <label className="inline-flex items-center gap-1 text-xs">
                                  <input
                                    type="radio"
                                    name={`final-multiplier-${r}`}
                                    checked={activeKey === `${r}-N`}
                                    onChange={() => setSelectedFinalMultiplier({ rarity: r, isGenesis: false })}
                                  />
                                  <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/10">
                                    Normal (+{formatNumber(percentNormal, 2, true)}%)
                                  </span>
                                </label>
                                <label className="inline-flex items-center gap-1 text-xs">
                                  <input
                                    type="radio"
                                    name={`final-multiplier-${r}`}
                                    checked={activeKey === `${r}-G`}
                                    onChange={() => setSelectedFinalMultiplier({ rarity: r, isGenesis: true })}
                                  />
                                  <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/10">
                                    Genesis (+{formatNumber(percentGenesis, 2, true)}%)
                                  </span>
                                </label>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </RelicFrame>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="text-xs underline underline-offset-2 decoration-white/40 hover:decoration-white"
              >
                {showAdvanced ? "Hide Advanced" : "Advanced"}
              </button>
            </div>
          </>
        )}
      </div>
      </div>

      {/* Calculator section moved below */}
      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-2 ">
              <span className="text-sm font-medium flex items-center gap-2">
                Portal IQ
                {finalMultiplierFactor > 1 && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border text-white"
                    style={multiplierBadgeStyle}
                  >
                    <span className="font-semibold">{displayMultiplier}×</span>
                  </span>
                )}
              </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatThousands(iq)}
              onChange={(e) => {
                const clean = e.currentTarget.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
                const next = clean === '' ? 0 : Math.max(0, parseInt(clean, 10) || 0);
                setIq(next);
              }}
                style={multiplierGlowStyle}
                className={`rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none transition ${
                  finalMultiplierFactor > 1
                    ? 'border border-amber-300/60 bg-gradient-to-r from-yellow-200/10 to-amber-400/10 focus:ring-2 focus:ring-amber-300/50 shadow-[0_0_30px_rgba(251,191,36,0.35)]'
                    : 'border border-white/10 bg-black/60 focus:ring-2 focus:ring-white/30 focus:border-white/40 shadow-[0_14px_35px_rgba(0,0,0,0.45)]'
                }`}
              placeholder="e.g. 1200"
            />
              {finalMultiplierFactor > 1 && (
                <div className="text-[11px] text-white/60">
                  after multiplier: <span className="text-white font-medium">{formatThousands(Math.trunc(portalIqAfterMultiplier))}</span>
                </div>
              )}
            </label>
            <label className="flex flex-col gap-2 ">
              <span className="text-sm font-medium">Relics bonus IQ</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatThousands(Math.trunc(relicBonusIq))}
                readOnly
                disabled
                className="border border-white/10 rounded-2xl px-4 py-3 bg-black/40 text-white/80 placeholder-white/40 focus:outline-none shadow-[0_14px_35px_rgba(0,0,0,0.45)] transition"
              />
              <span className="text-xs text-white/60">Computed from relics held</span>
            </label>
            <label className="flex flex-col gap-2 ">
              <span className="text-sm font-medium">Total IQ</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatThousands(Math.trunc(totalIq))}
                readOnly
                disabled
                className="border border-white/10 rounded-2xl px-4 py-3 bg-black/40 text-white/90 placeholder-white/40 focus:outline-none shadow-[0_14px_35px_rgba(0,0,0,0.45)] transition"
              />
              <span className="text-xs text-white/60">(Portal IQ × Relic multiplier) + Relics bonus</span>
          </label>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          <div className="rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] h-full flex flex-col">
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">IQ per 1 $TRUST</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousands(iqPerTrust)}
                  onChange={(e) => {
                    const clean = e.currentTarget.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
                    const next = clean === '' ? 0 : Math.max(1, parseInt(clean, 10));
                    setIqPerTrust(next);
                  }}
                  className="w-28 border border-white/15 rounded-2xl px-3 py-2 bg-black/70 text-white text-right placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 shadow-[0_14px_35px_rgba(0,0,0,0.45)]"
                  placeholder="500"
                />
              </div>
              <input
                type="range"
                min={500}
                max={1000}
                step={1}
                value={Math.min(Math.max(iqPerTrust, 500), 1000)}
                onChange={(e) => setIqPerTrust(clampIqPerTrust(parseInt(e.target.value, 10)))}
                className="w-full accent-white"
              />
              <div className="flex items-center justify-between gap-2">
                {PRESET_IQ_PER_TRUST.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setIqPerTrust(p)}
                    className={`flex-1 text-xs px-3 py-1.5 rounded-full border transition ${
                      iqPerTrust === p
                        ? 'bg-white text-black border-white'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                    }`}
                    title={`1 $TRUST = ${p} IQ`}
                  >
                    1:{p.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/60">
                1 $TRUST = <span className="text-white font-semibold">{iqPerTrust.toLocaleString()} IQ</span>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                <div className="text-[11px] tracking-wider uppercase text-white/60 font-medium">Estimated</div>
              </div>
              <div className="text-4xl md:text-5xl font-extrabold tabular-nums bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-1">
                <span className="text-2xl md:text-3xl">{Math.floor(trustAfter).toLocaleString()}</span>
                <span className="text-lg md:text-xl text-white/60">.{Math.floor((trustAfter % 1) * 100).toString().padStart(2, '0')}</span>
              </div>
              <div className="text-[11px] text-white/60 font-medium mb-3">$TRUST</div>
              <div className="text-[11px] text-white/60">
                Without relic: <span className="text-white font-medium">{Math.floor(trustBefore).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">TRUST FDV</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousands(Math.trunc(fdvUsd))}
                  onChange={(e) => {
                    const clean = e.currentTarget.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
                    const next = clean === '' ? 0 : parseInt(clean, 10);
                    setFdvUsd(next);
                  }}
                  max={99_999_999_999}
                  className="w-40 border border-white/15 rounded-2xl px-4 py-2 bg-black/70 text-white text-right placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 shadow-[0_14px_35px_rgba(0,0,0,0.45)]"
                  placeholder="500 000 000"
                />
              </div>
              <input
                type="range"
                min={FDV_MIN}
                max={FDV_MAX}
                step={1_000_000}
                value={Math.min(Math.max(fdvUsd, FDV_MIN), FDV_MAX)}
                onChange={(e) => {
                  const next = Math.max(FDV_MIN, Math.min(FDV_MAX, parseInt(e.target.value, 10) || FDV_MIN));
                  setFdvUsd(next);
                }}
                className="w-full accent-white"
              />
              <div className="flex items-center justify-between gap-2">
                {FDV_PRESETS.map((preset) => {
                  const isActive = Math.abs(fdvUsd - preset) < 1e-3;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFdvUsd(preset)}
                      className={`flex-1 text-xs px-3 py-1.5 rounded-full border transition ${
                        isActive
                          ? 'bg-white text-black border-white'
                          : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                      }`}
                    >
                      {formatFdvShort(preset)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {FDV_MULTIPLIERS.map((multiplier, idx) => {
                const valuation = fdvUsd * multiplier;
                const price = valuation / TOTAL_SUPPLY;
                const usdValue = trustAfter * price;
                const isSelected = Math.abs(fdvUsd - valuation) < 1e-6;
                const colors = ['text-sky-300', 'text-emerald-300', 'text-amber-300', 'text-purple-300', 'text-lime-300'];
                const colorClass = colors[idx % colors.length];
                const baseClasses = 'w-full text-left px-4 py-3 rounded-2xl border transition flex items-center justify-between gap-4';
                const stateClasses = isSelected
                  ? 'bg-white/15 border-white/60 shadow-[0_14px_35px_rgba(0,0,0,0.5)] ring-2 ring-white/40'
                  : 'bg-black/25 border-white/10 hover:bg-black/35 hover:border-white/25';

                return (
                  <button
                    key={multiplier}
                    type="button"
                    aria-pressed={isSelected}
                    className={`${baseClasses} ${stateClasses}`}
                    onClick={() => setFdvUsd(valuation)}
                  >
                    <div>
                      <div className={`text-sm font-semibold ${colorClass}`}>{formatFdvShort(valuation)}</div>
                      <div className="text-[11px] text-white/45">{formatNumber(price, 2, false)}$ / $TRUST</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-white">${formatUsd(usdValue)}</div>
                      <div className="text-[10px] text-white/30">×{multiplier}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-[11px] text-white/50">
              Selected FDV: <span className="text-white font-medium">{formatFdvShort(fdvUsd)}</span> (1 $TRUST = {formatNumber(trustPrice, 2, false)}$)
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] h-full flex flex-col min-h-0 max-h-[520px] md:max-h-[560px] overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <span className="text-sm font-medium">Token distribution</span>
              {vestingSchedule.length > 0 && (
                <span className="text-xs text-white/60">
                  Ends {formatDate(vestingSchedule[vestingSchedule.length - 1].date)}
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {vestingSchedule.map(({date, amount, label}, idx) => {
                const usdValue = amount * trustPrice;
                return (
                  <div key={`${label}-${idx}`} className="flex items-center justify-between text-sm bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
                    <div>
                      <div className="font-semibold text-white/85">{formatDate(date)}</div>
                      <div className="text-[11px] text-white/45">{label}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-white">${formatUsd(usdValue)}</div>
                      <div className="text-[11px] text-white/60">{formatNumber(amount, 0, true)} $TRUST</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      
    </div>
  );
}

function RelicBody({
  rarity,
  normalCounts,
  genesisCounts,
  stepNormal,
  stepGenesis,
  bonusN,
  bonusG,
  setBonusNormal,
  setBonusGenesis,
  showAdvanced,
  marginalByRarity,
}: {
  rarity: Rarity;
  normalCounts: Record<Rarity, number>;
  genesisCounts: Record<Rarity, number>;
  stepNormal: (r: Rarity, d: number) => void;
  stepGenesis: (r: Rarity, d: number) => void;
  bonusN: Record<Rarity, number>;
  bonusG: Record<Rarity, number>;
  setBonusNormal: (r: Rarity, val: string) => void;
  setBonusGenesis: (r: Rarity, val: string) => void;
  showAdvanced: boolean;
  marginalByRarity: Array<{
    r: Rarity;
    normal: { iq: number; trust: number };
    genesis: { iq: number; trust: number };
  }>;
}) {
  const normalBonus = bonusN[rarity];
  const genesisBonus = bonusG[rarity];
  const marg = marginalByRarity.find((x) => x.r === rarity)!;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="text-xs text-white/75 mb-2 font-medium">Normal</div>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition" onClick={() => stepNormal(rarity, -1)} aria-label={`Decrease ${LABELS[rarity]} normal`}>–</button>
            <div className="min-w-[2.5rem] text-center font-bold tabular-nums">{normalCounts[rarity]}</div>
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition" onClick={() => stepNormal(rarity, +1)} aria-label={`Increase ${LABELS[rarity]} normal`}>+</button>
          </div>
          <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2">
            <div className="text-xs text-white/75 mb-1 font-medium">+1 Normal</div>
            <div className="text-xs font-bold text-white">+{formatNumber(marg.normal.trust, 2, true)} $TRUST</div>
            <div className="text-[11px] text-white/60">(+{formatNumber(marg.normal.iq, 0, true)} IQ)</div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="text-xs text-white/75 mb-2 font-medium">Genesis</div>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition" onClick={() => stepGenesis(rarity, -1)} aria-label={`Decrease ${LABELS[rarity]} genesis`}>–</button>
            <div className="min-w-[2.5rem] text-center font-bold tabular-nums">{genesisCounts[rarity]}</div>
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition" onClick={() => stepGenesis(rarity, +1)} aria-label={`Increase ${LABELS[rarity]} genesis`}>+</button>
          </div>
          <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2">
            <div className="text-xs text-white/75 mb-1 font-medium">+1 Genesis</div>
            <div className="text-xs font-bold text-white">+{formatNumber(marg.genesis.trust, 2, true)} $TRUST</div>
            <div className="text-[11px] text-white/60">(+{formatNumber(marg.genesis.iq, 0, true)} IQ)</div>
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-white/80">
            Normal bonus IQ
            <input
              type="number" min={0} step={1} value={normalBonus}
              onChange={(e) => setBonusNormal(rarity, e.target.value)}
              className="mt-1 w-full border border-white/10 bg-black/40 rounded-lg px-2 py-1 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </label>
          <label className="text-xs text-white/80">
            Genesis bonus IQ
            <input
              type="number" min={0} step={1} value={genesisBonus}
              onChange={(e) => setBonusGenesis(rarity, e.target.value)}
              className="mt-1 w-full border border-white/10 bg-black/40 rounded-lg px-2 py-1 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </label>
        </div>
      )}
    </div>
  );
}
