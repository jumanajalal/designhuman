"use client";

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

  const supportedCount =
    Array.isArray(result.supportedDimensions)
      ? result.supportedDimensions.length
      : dimensions.length;

  const unsupportedCount =
    Array.isArray(result.unsupportedDimensions)
      ? result.unsupportedDimensions.length
      : 0;

  const weakestName = getDimensionName(result.weakestDimension);

  return (
    <section className="mx-auto max-w-7xl text-white">

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-400">
          {result.domain || "PPE"} ANALYSIS
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {result.specificationName ||
            "Fall-Arrest Safety Harness M/L"}
        </h2>

        {result.fileName && (
          <p className="mt-1 text-sm text-slate-500">
            Specification: {result.fileName}
          </p>
        )}
      </div>

      {/* Population Coverage */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
        <p className="text-sm text-slate-400">
          Population Coverage
        </p>

        <p className="mt-3 text-6xl font-bold text-cyan-400">
          {Number(result.coveragePercent).toFixed(2)}%
        </p>

        <p className="mt-3 text-sm text-slate-500">
          Based on the real human-variability analysis
        </p>
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Evaluated
          </p>

          <p className="mt-2 text-3xl font-bold">
            {Number(result.evaluated).toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            reference population
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Passing
          </p>

          <p className="mt-2 text-3xl font-bold text-cyan-400">
            {Number(result.passing).toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            within specification
          </p>
        </div>

      </div>

      {/* Coverage by Sex */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <p className="text-sm font-medium text-slate-300">
          Coverage by Sex
        </p>

        <div className="mt-6 space-y-6">

          {/* Male */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-300">
                Male
              </span>

              <span className="font-semibold">
                {result.maleCoveragePercent !== undefined
                  ? `${Number(
                      result.maleCoveragePercent
                    ).toFixed(1)}%`
                  : "—"}
              </span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        result.maleCoveragePercent ?? 0
                      )
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Female */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-300">
                Female
              </span>

              <span className="font-semibold">
                {result.femaleCoveragePercent !== undefined
                  ? `${Number(
                      result.femaleCoveragePercent
                    ).toFixed(1)}%`
                  : "—"}
              </span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-pink-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        result.femaleCoveragePercent ?? 0
                      )
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Analysis Scope */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <p className="text-sm font-medium text-slate-300">
          Analysis Scope
        </p>

        <p className="mt-2 text-sm text-slate-400">
          <span className="font-semibold text-white">
            {supportedCount}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-white">
            {supportedCount + unsupportedCount}
          </span>{" "}
          dimensions evaluated
        </p>

        {unsupportedCount > 0 && (
          <p className="mt-2 text-xs text-amber-400">
            {unsupportedCount} dimension
            {unsupportedCount !== 1 ? "s" : ""} could not be
            evaluated by the current analysis engine.
          </p>
        )}

      </div>

      {/* Dimension Analysis */}
      {dimensions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div>
            <p className="text-sm font-medium text-slate-300">
              Dimension Analysis
            </p>

            {weakestName && (
              <p className="mt-1 text-xs text-slate-500">
                Weakest dimension:{" "}
                <span className="text-amber-400">
                  {formatDimension(weakestName)}
                </span>
              </p>
            )}
          </div>

          <div className="mt-5 overflow-x-auto">

            <table className="w-full min-w-[650px] text-left text-sm">

              <thead>
                <tr className="border-b border-slate-800 text-slate-500">

                  <th className="px-4 py-3 font-medium">
                    Dimension
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Evaluated
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Passing
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Coverage
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Excluded
                  </th>

                </tr>
              </thead>

              <tbody>
                {dimensions.map((item, index) => (

                  <tr
                    key={item.dimension || index}
                    className="border-b border-slate-800/60"
                  >

                    <td className="px-4 py-4 font-medium text-slate-200">
                      {formatDimension(item.dimension)}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {Number(
                        item.evaluated
                      ).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {Number(
                        item.passing
                      ).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 font-semibold text-cyan-400">
                      {Number(
                        item.coveragePercent
                      ).toFixed(2)}%
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {Number(
                        item.excludedPercent
                      ).toFixed(2)}%
                    </td>

                  </tr>

                ))}
              </tbody>

            </table>

          </div>
        </div>
      )}

      {/* Unsupported Dimensions */}
      {unsupportedCount > 0 &&
        Array.isArray(result.unsupportedDimensions) && (

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">

            <p className="text-sm font-medium text-amber-400">
              Unsupported Dimensions
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {result.unsupportedDimensions.map(
                (dimension, index) => {

                  const name =
                    getDimensionName(dimension);

                  return (
                    <span
                      key={name || index}
                      className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
                    >
                      {name
                        ? formatDimension(name)
                        : "Unsupported Dimension"}
                    </span>
                  );
                }
              )}

            </div>

          </div>
        )}

      {/* Note */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <p className="text-sm font-medium text-slate-300">
          Analysis scope
        </p>

        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          These results come directly from the human-variability
          analysis engine using the uploaded specification. Results
          shown above are based on the dimensions currently
          supported by the analysis engine.
        </p>

      </div>

    </section>
  );
}