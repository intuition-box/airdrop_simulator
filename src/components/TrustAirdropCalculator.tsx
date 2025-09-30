"use client";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
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

const DEFAULT_MULTIPLIERS: Record<Rarity, number> = {
  common: 1.02, rare: 1.05, epic: 1.12, legendary: 1.25, ancient: 1.5, mystic: 2.0,
};
const DEFAULT_GENESIS_MULTIPLIERS: Record<Rarity, number> = {
  common: 1.02 * 1.05, rare: 1.05 * 1.08, epic: 1.12 * 1.06, legendary: 1.25 * 1.07, ancient: 1.5 * 1.08, mystic: 2.0 * 1.06,
};

const PRESET_IQ_PER_TRUST = [400, 500, 600];
const FDV_MIN = 50_000_000;
const FDV_MAX = 1_000_000_000;
const FDV_MULTIPLIERS = [1, 2, 4, 8, 16, 32];
const FDV_PRESETS = [50_000_000, 500_000_000, 1_000_000_000];
const TOTAL_SUPPLY = 1_000_000_000;
const VESTING_TGE = new Date('2025-10-15T00:00:00Z');
const VESTING_MONTHS = 24;

const RARITY_COLORS: Record<Rarity, string> = {
  common: "#d1d5db",
  rare: "#7dd3fc",
  epic: "#f472b6",
  legendary: "#fb923c",
  ancient: "#d9f99d",
  mystic: "#c4b5fd",
};

// Use Docusaurus baseUrl helper for static assets

const fmt = (n: number, digits = 2) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";

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

function RelicFrame({
  children,
  rarity,
  radius = 20,
}: {
  children: ReactNode;
  rarity: Rarity;
  radius?: number;
}) {
  const rarityColor = RARITY_COLORS[rarity];
  
  const cardStyle: CSSProperties = {
    borderRadius: radius,
    background: "rgba(0, 0, 0, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    position: "relative",
    overflow: "hidden",
  };

  const topBorderStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
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
  const [iqPerTrust, setIqPerTrust] = useState<number>(500);
  const clampIqPerTrust = (v: number) => Math.max(1, Math.floor(v || 1));

  const [fdvUsd, setFdvUsd] = useState<number>(150_000_000);
  const [fdvBaseUsd, setFdvBaseUsd] = useState<number>(150_000_000);

  const [isRelicHolder, setIsRelicHolder] = useState<boolean>(false);

  const [normalCounts, setNormalCounts] = useState<Record<Rarity, number>>({
    common: 0, rare: 0, epic: 0, legendary: 0, ancient: 0, mystic: 0,
  });
  const [genesisCounts, setGenesisCounts] = useState<Record<Rarity, number>>({
    common: 0, rare: 0, epic: 0, legendary: 0, ancient: 0, mystic: 0,
  });

  const [multN, setMultN] = useState<Record<Rarity, number>>({ ...DEFAULT_MULTIPLIERS });
  const [multG, setMultG] = useState<Record<Rarity, number>>({ ...DEFAULT_GENESIS_MULTIPLIERS });

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Resolve asset URLs unconditionally to respect hooks rules
  const commonUrl = useBaseUrl('/images/relics/common.png');
  const rareUrl = useBaseUrl('/images/relics/rare.png');
  const epicUrl = useBaseUrl('/images/relics/epic.png');
  const legendaryUrl = useBaseUrl('/images/relics/legendary.png');
  const ancientUrl = useBaseUrl('/images/relics/ancient.png');
  const mysticUrl = useBaseUrl('/images/relics/mystic.png');
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

  const totalMultiplier = useMemo(() => {
    if (!isRelicHolder) return 1;
    let acc = 1;
    (Object.keys(LABELS) as Rarity[]).forEach((r) => {
      const n = Math.max(0, normalCounts[r] ?? 0);
      const g = Math.max(0, genesisCounts[r] ?? 0);
      const mN = Math.max(0, multN[r]);
      const mG = Math.max(0, multG[r]);
      acc *= Math.pow(mN, n) * Math.pow(mG, g);
    });
    return acc;
  }, [isRelicHolder, normalCounts, genesisCounts, multN, multG]);

  const trustAfter = useMemo(() => Math.max(0, trustBefore * totalMultiplier), [trustBefore, totalMultiplier]);
  const usdAfter = useMemo(() => Math.max(0, trustAfter * Math.max(0, trustPrice)), [trustAfter, trustPrice]);

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
  const effectiveRatio = useMemo(
    () => (totalMultiplier > 0 ? iqPerTrust / totalMultiplier : iqPerTrust),
    [iqPerTrust, totalMultiplier]
  );

  const marginalByRarity = useMemo(() => {
    const baseline = trustBefore;
    return (Object.keys(LABELS) as Rarity[]).map((r) => {
      const mN = Math.max(0, multN[r]);
      const mG = Math.max(0, multG[r]);
      const normalDiff = Math.max(0, baseline * (mN - 1));
      const normalPctVs1 = (mN - 1) * 100;
      const genesisDiff = Math.max(0, baseline * (mG - 1));
      const genesisPctVsNormal = (mG / (mN || 1) - 1) * 100;
      return {
        r, mN, mG,
        normal: { diff: normalDiff, pctVs1: normalPctVs1 },
        genesis: { diff: genesisDiff, pctVsNormal: genesisPctVsNormal },
      };
    });
  }, [trustBefore, multN, multG]);

  const stepNormal = (r: Rarity, delta: number) =>
    setNormalCounts((prev) => ({ ...prev, [r]: Math.max(0, (prev[r] ?? 0) + delta) }));
  const stepGenesis = (r: Rarity, delta: number) =>
    setGenesisCounts((prev) => ({ ...prev, [r]: Math.max(0, (prev[r] ?? 0) + delta) }));

  const setMultiplierN = (r: Rarity, val: string) =>
    setMultN((s) => ({ ...s, [r]: Math.max(0, parseFloat(val || "0") || 0) }));
  const setMultiplierG = (r: Rarity, val: string) =>
    setMultG((s) => ({ ...s, [r]: Math.max(0, parseFloat(val || "0") || 0) }));

  const resetCounts = () => {
    setNormalCounts({ common: 0, rare: 0, epic: 0, legendary: 0, ancient: 0, mystic: 0 });
    setGenesisCounts({ common: 0, rare: 0, epic: 0, legendary: 0, ancient: 0, mystic: 0 });
  };
  const resetMultipliers = () => {
    setMultN({ ...DEFAULT_MULTIPLIERS });
    setMultG({ ...DEFAULT_GENESIS_MULTIPLIERS });
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

      <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-6">
          <label className="flex flex-col gap-2 ">
            <span className="text-sm font-medium">IQ points</span>
            <input
              type="text"
              inputMode="numeric"
              value={formatThousands(iq)}
              onChange={(e) => {
                const clean = e.currentTarget.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
                const next = clean === '' ? 0 : Math.max(0, parseInt(clean, 10) || 0);
                setIq(next);
              }}
              className="border border-white/10 rounded-2xl px-4 py-3 bg-black/60 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 shadow-[0_14px_35px_rgba(0,0,0,0.45)] transition"
              placeholder="e.g. 1200"
            />
            <span className="text-xs text-white/60">Your current IQ total</span>
          </label>
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
                min={400}
                max={600}
                step={1}
                value={Math.min(Math.max(iqPerTrust, 400), 600)}
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
                <span className="text-sm font-medium">$TRUST FDV</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousands(Math.trunc(fdvBaseUsd))}
                  onChange={(e) => {
                    const clean = e.currentTarget.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
                    const next = clean === '' ? 0 : parseInt(clean, 10);
                    setFdvBaseUsd(next);
                    setFdvUsd(next);
                  }}
                  className="w-44 border border-white/15 rounded-2xl px-4 py-2 bg-black/70 text-white text-right placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 shadow-[0_14px_35px_rgba(0,0,0,0.45)]"
                  placeholder="500 000 000"
                />
              </div>
              <input
                type="range"
                min={FDV_MIN}
                max={FDV_MAX}
                step={1_000_000}
                value={Math.min(Math.max(fdvBaseUsd, FDV_MIN), FDV_MAX)}
                onChange={(e) => {
                  const next = Math.max(FDV_MIN, Math.min(FDV_MAX, parseInt(e.target.value, 10) || FDV_MIN));
                  setFdvBaseUsd(next);
                  setFdvUsd(next);
                }}
                className="w-full accent-white"
              />
              <div className="flex items-center justify-between gap-2">
                {FDV_PRESETS.map((preset) => {
                  const isActive = Math.abs(fdvBaseUsd - preset) < 1e-3;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => { setFdvBaseUsd(preset); setFdvUsd(preset); }}
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
                const valuation = fdvBaseUsd * multiplier;
                const price = valuation / TOTAL_SUPPLY;
                const usdValue = trustAfter * price;
                const isWithinRange = valuation <= FDV_MAX;
                const isSelected = Math.abs(fdvUsd - valuation) < 1e-6;
                const colors = ['text-sky-300', 'text-emerald-300', 'text-amber-300', 'text-purple-300', 'text-lime-300'];
                const colorClass = colors[idx % colors.length];
                const baseClasses = 'w-full text-left px-4 py-3 rounded-2xl border transition flex items-center justify-between gap-4';
                const stateClasses = isSelected
                  ? 'bg-white/15 border-white/60 shadow-[0_14px_35px_rgba(0,0,0,0.5)] ring-2 ring-white/40'
                  : 'bg-black/25 border-white/10 hover:bg-black/35 hover:border-white/25';
                const disabledClasses = isWithinRange ? '' : ' opacity-50 cursor-not-allowed';

                return (
                  <button
                    key={multiplier}
                    type="button"
                    disabled={!isWithinRange}
                    aria-pressed={isSelected}
                    className={`${baseClasses} ${stateClasses}${disabledClasses}`}
                    onClick={() => {
                      if (isWithinRange) {
                        setFdvUsd(Math.max(FDV_MIN, Math.min(FDV_MAX, valuation)));
                      }
                    }}
                  >
                    <div>
                      <div className={`text-sm font-semibold ${colorClass}`}>{formatFdvShort(valuation)}</div>
                      <div className="text-[11px] text-white/45">1 $TRUST = {formatNumber(price, 2, false)}$</div>
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
              Custom FDV: <span className="text-white font-medium">{formatFdvShort(fdvUsd)}</span> (1 $TRUST = {formatNumber(trustPrice, 2, false)}$)
            </div>

            <div className="mt-6">
              <label className="block text-xs font-semibold uppercase text-white/50 tracking-widest mb-2">
                Enter custom price
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={trustPrice}
                  onChange={(e) => {
                    const price = Math.max(0, parseFloat(e.target.value || '0') || 0);
                    const nextFdv = Math.min(FDV_MAX, Math.max(FDV_MIN, price * TOTAL_SUPPLY));
                    setFdvUsd(nextFdv);
                  }}
                  className="flex-1 border border-white/15 rounded-2xl px-4 py-3 bg-black/60 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 shadow-[0_14px_35px_rgba(0,0,0,0.45)]"
                  placeholder="0.00"
                />
                <span className="text-sm font-medium text-white/60">USD</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <span className="text-sm font-medium">Token distribution</span>
              {vestingSchedule.length > 0 && (
                <span className="text-xs text-white/60">
                  Ends {formatDate(vestingSchedule[vestingSchedule.length - 1].date)}
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
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

      <div className="mt-8">
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

          {isRelicHolder && (
            <div className="flex items-center gap-3">
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
                onClick={resetMultipliers}
              >
                Reset multipliers
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
                                multN={multN}
                                multG={multG}
                                setMultiplierN={setMultiplierN}
                                setMultiplierG={setMultiplierG}
                                showAdvanced={showAdvanced}
                                marginalByRarity={marginalByRarity}
                              />
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
                          multN={multN}
                          multG={multG}
                          setMultiplierN={setMultiplierN}
                          setMultiplierG={setMultiplierG}
                          showAdvanced={showAdvanced}
                          marginalByRarity={marginalByRarity}
                        />
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
    </div>
  );
}

function RelicBody({
  rarity,
  normalCounts,
  genesisCounts,
  stepNormal,
  stepGenesis,
  multN,
  multG,
  setMultiplierN,
  setMultiplierG,
  showAdvanced,
  marginalByRarity,
}: {
  rarity: Rarity;
  normalCounts: Record<Rarity, number>;
  genesisCounts: Record<Rarity, number>;
  stepNormal: (r: Rarity, d: number) => void;
  stepGenesis: (r: Rarity, d: number) => void;
  multN: Record<Rarity, number>;
  multG: Record<Rarity, number>;
  setMultiplierN: (r: Rarity, val: string) => void;
  setMultiplierG: (r: Rarity, val: string) => void;
  showAdvanced: boolean;
  marginalByRarity: Array<{
    r: Rarity;
    mN: number;
    mG: number;
    normal: { diff: number; pctVs1: number };
    genesis: { diff: number; pctVsNormal: number };
  }>;
}) {
  const mN = multN[rarity];
  const mG = multG[rarity];
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
            <div className="text-xs font-bold text-white">+{fmt(marg.normal.diff)} $TRUST</div>
            <div className="relative group mt-1">
              <div className="text-xs text-white/70 cursor-help hover:text-white transition-colors">?</div>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900/95 text-white text-xs rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-20 shadow-lg">
                <div className="font-medium">{marg.normal.pctVs1.toFixed(2)}% bonus</div>
                <div className="text-[10px] text-white/70 mt-0.5">vs baseline</div>
              </div>
            </div>
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
            <div className="text-xs font-bold text-white">+{fmt(marg.genesis.diff)} $TRUST</div>
            <div className="relative group mt-1">
              <div className="text-xs text-white/70 cursor-help hover:text-white transition-colors">?</div>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900/95 text-white text-xs rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-20 shadow-lg">
                <div className="font-medium">{marg.genesis.pctVsNormal.toFixed(2)}% bonus</div>
                <div className="text-[10px] text-white/70 mt-0.5">vs Normal relic</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-white/80">
            Normal ×
            <input
              type="number" min={0} step={0.001} value={mN}
              onChange={(e) => setMultiplierN(rarity, e.target.value)}
              className="mt-1 w-full border border-white/10 bg-black/40 rounded-lg px-2 py-1 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </label>
          <label className="text-xs text-white/80">
            Genesis ×
            <input
              type="number" min={0} step={0.001} value={mG}
              onChange={(e) => setMultiplierG(rarity, e.target.value)}
              className="mt-1 w-full border border-white/10 bg-black/40 rounded-lg px-2 py-1 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </label>
        </div>
      )}
    </div>
  );
}
