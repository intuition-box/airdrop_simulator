"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

type Rarity = "common" | "rare" | "epic" | "legendary" | "ancient" | "mystic";

const PrismBg = dynamic(() => import("./Prism"), { ssr: false });

const LABELS: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  ancient: "Ancient",
  mystic: "Mystic",
};

const DEFAULT_MULTIPLIERS: Record<Rarity, number> = {
  common: 1.02,
  rare: 1.05,
  epic: 1.12,
  legendary: 1.25,
  ancient: 1.5,
  mystic: 2.0,
};

const PRESET_IQ_PER_TRUST = [333, 500, 1000, 3333];

const RARITY_THEME: Record<
  Rarity,
  { capGrad: string; dot: string; ring: string }
> = {
  common: {
    capGrad: "from-neutral-500/30 to-transparent",
    dot: "bg-neutral-400",
    ring: "ring-neutral-500/25",
  },
  rare: {
    capGrad: "from-sky-500/40 to-transparent",
    dot: "bg-sky-400",
    ring: "ring-sky-500/25",
  },
  epic: {
    capGrad: "from-rose-500/40 to-transparent",
    dot: "bg-rose-400",
    ring: "ring-rose-500/25",
  },
  legendary: {
    capGrad: "from-orange-500/40 to-transparent",
    dot: "bg-orange-400",
    ring: "ring-orange-500/25",
  },
  ancient: {
    capGrad: "from-yellow-400/60 to-transparent",
    dot: "bg-yellow-400",
    ring: "ring-yellow-400/25",
  },
  mystic: {
    capGrad: "from-fuchsia-500/40 via-emerald-400/40 to-sky-400/40",
    dot: "bg-gradient-to-r from-fuchsia-400 via-emerald-400 to-sky-400",
    ring: "ring-fuchsia-500/20",
  },
};

const fmt = (n: number, digits = 4) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";

export default function TrustAirdropCalculator() {
  // Core inputs
  const [iq, setIq] = useState<number>(50000);
  const [iqPerTrust, setIqPerTrust] = useState<number>(333);

  // Relics
  const [isRelicHolder, setIsRelicHolder] = useState<boolean>(false);
  const [counts, setCounts] = useState<Record<Rarity, number>>({
    common: 0, rare: 0, epic: 0, legendary: 0, ancient: 0,mystic: 0,
  });
  const [mult, setMult] = useState<Record<Rarity, number>>({ ...DEFAULT_MULTIPLIERS });
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Genesis Relic (global boost)
  const [hasGenesis, setHasGenesis] = useState<boolean>(false);
  const [genesisMult, setGenesisMult] = useState<number>(1.5);

  // Math
  const baseTrust = useMemo(() => (iqPerTrust > 0 ? iq / iqPerTrust : 0), [iq, iqPerTrust]);

  const totalMultiplier = useMemo(() => {
    if (!isRelicHolder) return 1;
    let m = 1;
    (Object.keys(counts) as Rarity[]).forEach((r) => {
      const c = Math.max(0, counts[r]);
      const factor = Math.pow(Math.max(0, mult[r]), c);
      m *= factor;
    });
    if (hasGenesis) m *= Math.max(0, genesisMult);
    return m;
  }, [counts, mult, isRelicHolder, hasGenesis, genesisMult]);

  const finalTrust = useMemo(() => Math.max(0, baseTrust * totalMultiplier), [baseTrust, totalMultiplier]);

  const effectiveRatio = useMemo(
    () => (totalMultiplier > 0 ? iqPerTrust / totalMultiplier : iqPerTrust),
    [iqPerTrust, totalMultiplier]
  );

  // Marginal (+1 relic)
  const marginalByRarity = useMemo(() => {
    const baseline = isRelicHolder ? finalTrust : baseTrust;
    return (Object.keys(LABELS) as Rarity[]).map((r) => {
      const m = Math.max(0, mult[r]);
      const diff = Math.max(0, baseline * (m - 1));
      const pct = (m - 1) * 100;
      return { r, m, diff, pct };
    });
  }, [finalTrust, baseTrust, mult, isRelicHolder]);

  // Marginal Genesis (toggle on/off)
  const genesisMarginal = useMemo(() => {
    const baseline = isRelicHolder ? finalTrust : baseTrust;
    const m = Math.max(0, genesisMult);
    const diff = Math.max(0, baseline * (m - 1));
    const pct = (m - 1) * 100;
    return { m, diff, pct };
  }, [finalTrust, baseTrust, genesisMult, isRelicHolder]);

  // Handlers
  const step = (r: Rarity, delta: number) =>
    setCounts((s) => ({ ...s, [r]: Math.max(0, (s[r] ?? 0) + delta) }));
  const setMultiplier = (r: Rarity, val: string) =>
    setMult((s) => ({ ...s, [r]: Math.max(0, parseFloat(val || "0") || 0) }));
  const resetMultipliers = () => setMult({ ...DEFAULT_MULTIPLIERS });

  const basePortion = finalTrust > 0 ? Math.min(100, (baseTrust / finalTrust) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10 bg-black text-white rounded-3xl">
      {/* ===== HERO ===== */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-white/5" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl bg-white/5" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
              $TRUST Airdrop <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Calculator</span>
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Convert <strong>IQ → $TRUST</strong>.
            </p>
          </div>

          {/* KPI */}
          <div className="relative rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-right">
            <div className="text-[11px] tracking-wider uppercase text-white/60">Estimated</div>
            <div className="text-4xl md:text-5xl font-extrabold tabular-nums bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              {fmt(finalTrust)}
            </div>
            <div className="text-[11px] text-white/60">$TRUST</div>
            <div className="mt-2 text-[11px] text-white/60">
              Effective ratio: <span className="font-semibold text-white">1:{Math.max(2, Math.round(effectiveRatio)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Inputs row */}
        <div className="mt-6 grid md:grid-cols-3 gap-5">
          {/* IQ */}
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">IQ points</span>
            <input
              type="number"
              min={0}
              value={iq}
              onChange={(e) => setIq(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
              className="border border-white/10 rounded-2xl px-3 py-2 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="e.g. 1200"
            />
            <span className="text-xs text-white/60">Your current IQ total.</span>
          </label>

          {/* Ratio */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">IQ needed for 1 TRUST</span>
              <div className="flex gap-2">
                {PRESET_IQ_PER_TRUST.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setIqPerTrust(p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      iqPerTrust === p ? "bg-white text-black border-white" : "bg-white/10 text-white border-white/10 hover:bg-white/20"
                    }`}
                    title={`1 TRUST = ${p} IQ`}
                  >
                    1:{p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={10000}
                step={1}
                value={iqPerTrust}
                onChange={(e) => setIqPerTrust(Math.max(2, parseInt(e.target.value, 10) || 2))}
                className="w-full accent-white"
              />
              <input
                type="number"
                min={2}
                value={iqPerTrust}
                onChange={(e) => setIqPerTrust(Math.max(2, parseInt(e.target.value || "2", 10) || 2))}
                className="w-28 border border-white/10 rounded-2xl px-2 py-2 bg-white/10 text-white text-right placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <p className="text-xs text-white/60 mt-1">
              Example: <strong className="text-white">333</strong> ⇒ 333 IQ = 1 $TRUST. Base = IQ / {iqPerTrust}.
            </p>
          </div>
        </div>

        {/* Before/After bar */}
        <div className="mt-6">
          <div className="text-[11px] text-white/60 mb-1">Before / After Relics</div>
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-3 rounded-r-full bg-white transition-all duration-500" style={{ width: `${basePortion}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-white/60 mt-1">
            <span>Base: {fmt(baseTrust)}</span>
            <span>×{fmt(totalMultiplier, 6)}</span>
          </div>
        </div>
      </div>

      {/* ===== RELICS */}
      <div className="mt-8 relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        {/* Toggles */}
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

          {/* Genesis toggle */}
          {isRelicHolder && (
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasGenesis}
                  onChange={(e) => setHasGenesis(e.target.checked)}
                  className="peer sr-only"
                  aria-label="Genesis Relic"
                />
                <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${hasGenesis ? "bg-white" : "bg-white/25"}`}>
                  <span className={`h-5 w-5 transform rounded-full bg-black transition ${hasGenesis ? "translate-x-5" : "translate-x-1"}`} />
                </span>
                <span className="text-sm font-medium">Genesis Relic</span>
                <span className="text-xs text-white/70">×{genesisMult.toFixed(2)}</span>
              </label>

              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition"
                onClick={() => { setCounts({ common: 0, rare: 0, epic: 0, legendary: 0, ancient: 0, mystic: 0 }); setHasGenesis(false); }}
              >
                Reset counts
              </button>
            </div>
          )}
        </div>

        {isRelicHolder && (
          <>
            <div className="absolute inset-0 -z-10 opacity-85 pointer-events-none mix-blend-screen">
              <PrismBg
                animationType="rotate"
                timeScale={0.3}
                scale={2.1}
                height={4}
                baseWidth={5.5}
                noise={0}
                glow={0.7}
                hueShift={0.5}
                colorFrequency={4}
                suspendWhenOffscreen
              />
            </div>
            <div className="absolute inset-0 -z-5 bg-black/35" />
          </>
        )}

        {/* Genesis marginal pill */}
        {isRelicHolder && hasGenesis && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 flex items-baseline justify-between">
            <div className="text-sm font-medium">Genesis bonus</div>
            <div className="text-xs text-white/70">
              ×{genesisMarginal.m.toFixed(2)} → +{fmt(genesisMarginal.diff)} $TRUST ({genesisMarginal.pct.toFixed(2)}%)
            </div>
          </div>
        )}

        {/* Cards */}
        {isRelicHolder && (
          <>
            {/* Mobile carousel */}
            <div className="mt-6 md:hidden -mx-4 px-4">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
                {(Object.keys(LABELS) as Rarity[]).map((r) => {
                  const theme = RARITY_THEME[r];
                  const m = mult[r];
                  const marginal = marginalByRarity.find((x) => x.r === r)!;
                  const label = LABELS[r];

                  return (
                    <div
                      key={r}
                      className={`snap-start shrink-0 w-[85%] group relative rounded-2xl border border-white/10 bg-white/10 supports-[backdrop-filter]:backdrop-blur-md p-4 ring-1 ${theme.ring} transition hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)]`}
                    >
                      <div className={`pointer-events-none absolute left-4 right-4 top-2 h-0.5 rounded-full bg-gradient-to-r ${theme.capGrad}`} />
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${theme.dot} shadow`} />
                          <div className="font-semibold">{label}</div>
                        </div>
                        <div className="text-xs text-white/70">×{m.toFixed(2)}</div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition"
                          onClick={() => step(r, -1)}
                          aria-label={`Decrease ${label} count`}
                        >
                          –
                        </button>
                        <div className="min-w-[3.25rem] text-center font-bold tabular-nums text-lg">{counts[r]}</div>
                        <button
                          type="button"
                          className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition"
                          onClick={() => step(r, +1)}
                          aria-label={`Increase ${label} count`}
                        >
                          +
                        </button>
                      </div>

                      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-[11px] text-white/75 mb-1">Add +1 {label}</div>
                        <div className="flex items-baseline justify-between">
                          <div className="text-sm font-medium">+{fmt(marginal.diff)} $TRUST</div>
                          <div className="text-xs text-white/70">{marginal.pct.toFixed(2)}%</div>
                        </div>
                      </div>

                      {showAdvanced && (
                        <label className="block mt-3 text-xs text-white/80">
                          Multiplier (×)
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={mult[r]}
                            onChange={(e) => setMultiplier(r, e.target.value)}
                            className="mt-1 w-full border border-white/10 bg-black/30 rounded-lg px-2 py-1 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop grid */}
            <div className="mt-6 hidden md:grid md:grid-cols-3 gap-4">
              {(Object.keys(LABELS) as Rarity[]).map((r) => {
                const theme = RARITY_THEME[r];
                const m = mult[r];
                const marginal = marginalByRarity.find((x) => x.r === r)!;
                const label = LABELS[r];

                return (
                  <div
                    key={r}
                    className={`group relative rounded-2xl border border-white/10 bg-white/10 supports-[backdrop-filter]:backdrop-blur-md p-4 ring-1 ${theme.ring} transition hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)]`}
                  >
                    <div className={`pointer-events-none absolute left-4 right-4 top-2 h-0.5 rounded-full bg-gradient-to-r ${theme.capGrad}`} />
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${theme.dot} shadow`} />
                        <div className="font-semibold">{label}</div>
                      </div>
                      <div className="text-xs text-white/70">×{m.toFixed(2)}</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition"
                        onClick={() => step(r, -1)}
                        aria-label={`Decrease ${label} count`}
                      >
                        –
                      </button>
                      <div className="min-w-[3.25rem] text-center font-bold tabular-nums text-lg">{counts[r]}</div>
                      <button
                        type="button"
                        className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition"
                        onClick={() => step(r, +1)}
                        aria-label={`Increase ${label} count`}
                      >
                        +
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="text-[11px] text-white/75 mb-1">Add +1 {label}</div>
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-medium">+{fmt(marginal.diff)} $TRUST</div>
                        <div className="text-xs text-white/70">{marginal.pct.toFixed(2)}%</div>
                      </div>
                    </div>

                    {showAdvanced && (
                      <label className="block mt-3 text-xs text-white/80">
                        Multiplier (×)
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={mult[r]}
                          onChange={(e) => setMultiplier(r, e.target.value)}
                          className="mt-1 w-full border border-white/10 bg-black/30 rounded-lg px-2 py-1 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Advanced controls */}
        {isRelicHolder && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="text-xs underline underline-offset-2 decoration-white/40 hover:decoration-white"
              >
                {showAdvanced ? "Hide Advanced" : "Advanced"}
              </button>
              {showAdvanced && (
                <>
                  <button
                    type="button"
                    onClick={resetMultipliers}
                    className="text-xs underline underline-offset-2 decoration-white/40 hover:decoration-white"
                  >
                    Reset default multipliers
                  </button>

                  <label className="text-xs text-white/80 flex items-center gap-2">
                    Genesis ×
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={genesisMult}
                      onChange={(e) => setGenesisMult(Math.max(0, parseFloat(e.target.value || "0") || 0))}
                      className="w-20 border border-white/10 bg-black/30 rounded-md px-2 py-1 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
