"use client";
import { useState, useEffect } from "react";

type WhatIfResult = {
  dimension: string;
  before: { min: number; max: number; coveragePercent: number; evaluated: number; passing: number };
  after: { min: number; max: number; coveragePercent: number; evaluated: number; passing: number };
};

export default function WhatIfSlider({
  specification,
  weakestDimension,
  baselineCoveragePercent,
  baselineEvaluated,
  baselinePassing,
}: {
  specification: any;
  weakestDimension: string;
  baselineCoveragePercent: number;
  baselineEvaluated: number;
  baselinePassing: number;
}) {
  const [expansion, setExpansion] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  const targetDim = specification?.dimensions?.find(
    (d: any) => d.name === weakestDimension || d.dimension === weakestDimension
  );

  const minValue = targetDim?.min_value ?? 0;
  const maxValue = targetDim?.max_value ?? 0;
  const unit = targetDim?.unit ?? "mm";

  const projectedMin = minValue - expansion;
  const projectedMax = maxValue + expansion;

  const calculateImpact = async (currentExpansion: number) => {
    if (currentExpansion === 0) {
      setResult(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newMin = minValue - currentExpansion;
      const newMax = maxValue + currentExpansion;

      const res = await fetch(
        `https://designhuman.onrender.com/coverage/whatif?changed_dimension=${weakestDimension}&new_min=${newMin}&new_max=${newMax}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(specification),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`What-if failed (${res.status}): ${text}`);
      }

      setResult(await res.json());
    } catch (err) {
      console.error("Failed to calculate impact", err);
      setError("Could not recalculate. Check the backend is running.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      calculateImpact(expansion);
    }, 500);
    return () => clearTimeout(handler);
  }, [expansion]);

  if (!weakestDimension || !targetDim) return null;

  const formatName = (name: string) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // "Before" always comes from the real overall analysis result — never
  // guessed or hardcoded, even before the slider moves.
  const beforeCoverage = baselineCoveragePercent;
  const beforePassing = baselinePassing;

  // "After" comes from the real backend recalculation once the slider
  // moves; before that, it equals "before" (no change proposed yet).
  const afterCoverage = result ? result.after.coveragePercent : beforeCoverage;
  const afterPassing = result ? result.after.passing : beforePassing;

  const improvementPp = (afterCoverage - beforeCoverage).toFixed(2);
  const additionalPeople = afterPassing - beforePassing;

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-6 shadow-lg shadow-cyan-900/10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          What-If Design Lab
        </p>
        <h3 className="mt-2 text-2xl font-bold text-white">
          Redesign {formatName(weakestDimension)}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Expand the dimensional tolerance to see the projected impact on population coverage.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-400">Current Specification</span>
            </div>
            <div className="flex h-12 items-center justify-between rounded-lg bg-slate-900 px-4 text-slate-300 shadow-inner">
              <span className="font-mono">{minValue}</span>
              <div className="h-px flex-1 bg-slate-700 mx-4"></div>
              <span className="font-mono">{maxValue} {unit}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-medium text-white">Expand tolerance</label>
              <span className="rounded bg-cyan-400/20 px-2 py-1 text-xs font-bold text-cyan-400">
                +{expansion} {unit}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={expansion}
              onChange={(e) => setExpansion(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>0 {unit}</span>
              <span>50 {unit}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-cyan-400">Projected Specification</span>
            </div>
            <div className="flex h-12 items-center justify-between rounded-lg border border-cyan-400/30 bg-slate-900 px-4 text-white shadow-inner">
              <span className="font-mono font-bold text-cyan-300">{projectedMin}</span>
              <div className="h-px flex-1 bg-cyan-400/30 mx-4"></div>
              <span className="font-mono font-bold text-cyan-300">{projectedMax} {unit}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-slate-700 bg-slate-900 p-6">
          <p className="mb-6 text-sm font-medium uppercase tracking-widest text-slate-400 text-center">
            Projected Coverage
          </p>

          {error && (
            <p className="mb-4 text-center text-xs text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-between px-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Before</p>
              <p className="text-2xl font-semibold text-slate-300">
                {beforeCoverage.toFixed(2)}%
              </p>
            </div>

            <div className="flex flex-col items-center justify-center px-4">
              <div className="h-px w-12 bg-slate-600 mb-2"></div>
              <span className="text-slate-500 text-lg">→</span>
            </div>

            <div className="text-center">
              <p className="text-xs text-cyan-400 mb-1">After</p>
              <div className="relative">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
                  </div>
                )}
                <p className={`text-3xl font-bold text-white transition-opacity ${loading ? "opacity-0" : "opacity-100"}`}>
                  {afterCoverage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Coverage Delta</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-2xl font-bold ${expansion > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                    {Number(improvementPp) > 0 ? "↑ +" : ""}{improvementPp} pp
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Human Impact</p>
                <p className={`mt-1 text-lg font-medium ${expansion > 0 ? "text-cyan-400" : "text-slate-500"}`}>
                  +{additionalPeople.toLocaleString()} people included
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}