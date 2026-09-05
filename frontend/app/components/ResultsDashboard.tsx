"use client";
import WhatIfSlider from "./WhatIfSlider";

type DimensionResult = {
  dimension: string;
  evaluated: number;
  passing: number;
  coverage: number;
  coveragePercent: number;
  excludedPercent: number;
};

type AnalysisResult = {
  fileName?: string;
  specificationName?: string;
  domain?: string;

  coveragePercent: number;
  evaluated: number;
  passing: number;

  maleCoveragePercent?: number;
  femaleCoveragePercent?: number;

  supportedDimensions?: any[];
  unsupportedDimensions?: any[];
  weakestDimension?: any;

  perDimension?: DimensionResult[];
  specification?: {
    domain: string;
    name: string;
    dimensions: any[];
  };
};

function formatDimension(name: any) {
  if (typeof name !== "string") {
    return "Unknown Dimension";
  }

  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDimensionName(value: any) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    if (typeof value.dimension === "string") {
      return value.dimension;
    }

    if (typeof value.name === "string") {
      return value.name;
    }
  }

  return null;
}

export default function ResultsDashboard({
  result,
}: {
  result: AnalysisResult;
}) {
  const dimensions = Array.isArray(result.perDimension)
    ? result.perDimension
    : [];

  const supportedCount = Array.isArray(result.supportedDimensions)
    ? result.supportedDimensions.length
    : dimensions.length;

  const unsupportedCount = Array.isArray(result.unsupportedDimensions)
    ? result.unsupportedDimensions.length
    : 0;

  const weakestName = getDimensionName(result.weakestDimension);
  const weakestDimObj = dimensions.find(
    (d) =>
      getDimensionName(d.dimension) === weakestName ||
      d.dimension === weakestName
  );

  const excludedCount = (result.evaluated || 0) - (result.passing || 0);

  const maleCoverage = Number(result.maleCoveragePercent ?? 0);
  const femaleCoverage = Number(result.femaleCoveragePercent ?? 0);
  const coverageGap = Math.abs(maleCoverage - femaleCoverage);

  return (
    <section className="mx-auto max-w-7xl space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-4 py-2 text-sm font-medium tracking-widest text-cyan-400">
          {(result.domain || "PPE").toUpperCase()} ANALYSIS
        </div>

        <h2 className="mt-4 text-3xl font-bold">
          {result.specificationName || "Standard Specification"}
        </h2>

        {result.fileName && (
          <p className="mt-2 text-sm text-slate-500">
            Source: {result.fileName}
          </p>
        )}
      </div>

      {/* Population Coverage - The Big Impact Card */}
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-900 p-8 text-center shadow-lg shadow-cyan-900/10">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
          Design Coverage
        </p>

        <p className="mt-3 text-6xl font-bold tracking-tight text-cyan-400">
          {result.coveragePercent?.toFixed(2)}%
        </p>

        <p className="mt-4 text-lg text-slate-300">
          <span className="font-semibold text-white">
            {result.passing?.toLocaleString()}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-white">
            {result.evaluated?.toLocaleString()}
          </span>{" "}
          people fit the evaluated specification.
        </p>

        {excludedCount > 0 && (
          <div className="mt-5 inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300">
            ⚠ {excludedCount.toLocaleString()} people fall outside
          </div>
        )}
      </div>

      {/* Design Verdict / Weakest Dimension */}
      {weakestName && weakestDimObj && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6 shadow-lg shadow-amber-900/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            ⚠ Primary Design Blind Spot
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            {formatDimension(weakestName)}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            This is currently the most restrictive evaluated dimension.
          </p>

          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className="font-medium text-slate-300">
              {Number(weakestDimObj.coveragePercent).toFixed(2)}% coverage
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-medium text-amber-400">
              {Number(weakestDimObj.excludedPercent).toFixed(2)}% excluded
            </span>
          </div>
        </div>
      )}

      {/* Who Does the Design Miss? (Sex Breakdown) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
          Who are we missing?
        </p>

        <div className="mt-6 space-y-6">
          {/* Male */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-slate-300">Male</span>
              <span className="font-semibold text-white">
                {result.maleCoveragePercent !== undefined
                  ? `${maleCoverage.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.1) 10px, transparent 10px, transparent 20px)' }}>
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, maleCoverage))}%`,
                }}
              />
            </div>
          </div>

          {/* Female */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-slate-300">Female</span>
              <span className="font-semibold text-white">
                {result.femaleCoveragePercent !== undefined
                  ? `${femaleCoverage.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.1) 10px, transparent 10px, transparent 20px)' }}>
              <div
                className="h-full rounded-full bg-pink-400 transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, femaleCoverage))}%`,
                }}
              />
            </div>
          </div>

          {/* Gap Analysis */}
          {result.maleCoveragePercent !== undefined &&
  result.femaleCoveragePercent !== undefined &&
  coverageGap > 0 && (
    <div className="mt-4 space-y-3 rounded-lg bg-slate-800/50 p-4">
      <p className="text-sm text-slate-300">
        The current specification has an{" "}
        <span className="font-semibold text-white">
          {coverageGap.toFixed(1)} percentage-point
        </span>{" "}
        coverage gap between male and female reference populations.
      </p>

      {result.maleEvaluated && result.malePassing !== undefined && (
        <p className="text-sm text-slate-400">
          In real terms:{" "}
          <span className="font-semibold text-amber-300">
            1 in {Math.round(result.maleEvaluated / (result.maleEvaluated - result.malePassing))}
          </span>{" "}
          men would fall outside this spec, compared to{" "}
          <span className="font-semibold text-amber-300">
            1 in {Math.round(result.femaleEvaluated / (result.femaleEvaluated - result.femalePassing))}
          </span>{" "}
          women — using {result.maleEvaluated.toLocaleString()} male and{" "}
          {result.femaleEvaluated.toLocaleString()} female real measured profiles.
        </p>
      )}
    </div>
  )}
        </div>
      </div>

      {/* Dimension Breakdown Table */}
      {dimensions.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-slate-400">
            Dimension Breakdown
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="px-4 py-3 font-medium">Dimension</th>
                  <th className="px-4 py-3 font-medium">Evaluated</th>
                  <th className="px-4 py-3 font-medium">Passing</th>
                  <th className="px-4 py-3 font-medium">Coverage</th>
                  <th className="px-4 py-3 font-medium">Excluded</th>
                </tr>
              </thead>
              <tbody>
                {dimensions.map((item, index) => {
                  const isWeakest =
                    getDimensionName(item.dimension) === weakestName;
                  return (
                    <tr
                      key={item.dimension || index}
                      className={`border-b border-slate-800/60 transition-colors ${
                        isWeakest ? "bg-amber-400/5" : ""
                      }`}
                    >
                      <td className="px-4 py-4 font-medium text-slate-200">
                        {isWeakest && (
                          <span className="mr-2 text-amber-400">⚠</span>
                        )}
                        {formatDimension(item.dimension)}
                      </td>
                      <td className="px-4 py-4 text-slate-400">
                        {Number(item.evaluated).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-slate-400">
                        {Number(item.passing).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-cyan-400">
                        {Number(item.coveragePercent).toFixed(2)}%
                      </td>
                      <td
                        className={`px-4 py-4 ${
                          isWeakest
                            ? "font-medium text-amber-400"
                            : "text-slate-400"
                        }`}
                      >
                        {Number(item.excludedPercent).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* What-If Engine */}
      <WhatIfSlider
  specification={result.specification}
  weakestDimension={weakestName}
  baselineCoveragePercent={result.coveragePercent}
  baselineEvaluated={result.evaluated}
  baselinePassing={result.passing}
/>

      {/* Analysis Scope (Scope Transparency) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
          Analysis Scope
        </p>

        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
          <p className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span> {supportedCount}{" "}
            dimension{supportedCount !== 1 ? "s" : ""} evaluated
          </p>

          {unsupportedCount > 0 && (
            <p className="flex items-center gap-2">
              <span className="text-amber-400">⚠</span> {unsupportedCount}{" "}
              dimension{unsupportedCount !== 1 ? "s" : ""} detected but not
              currently modeled
            </p>
          )}
        </div>

        {unsupportedCount > 0 &&
          Array.isArray(result.unsupportedDimensions) && (
            <div className="mt-5 border-t border-slate-800 pt-5">
              <p className="mb-3 text-xs text-slate-500">
                These dimensions were extracted from the uploaded specification
                but fall outside the current human-variability model:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.unsupportedDimensions.map((dimension, index) => {
                  const name = getDimensionName(dimension);
                  return (
                    <span
                      key={name || index}
                      className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-400"
                    >
                      {name ? formatDimension(name) : "Unsupported Dimension"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
      </div>
    </section>
  );
}