"use client";

type AnalysisResult = {
  fileName?: string;
  specificationName?: string;
  domain?: string;

  coveragePercent: number;
  evaluated: number;
  passing: number;

  maleCoveragePercent?: number;
  femaleCoveragePercent?: number;

  perDimension?: Record<string, any>;
};

export default function ResultsDashboard({
  result,
}: {
  result: AnalysisResult;
}) {
  return (
    <section className="mx-auto max-w-7xl text-white">
      {/* Analysis header */}
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

      {/* Hero Coverage */}
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

      {/* Summary statistics */}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Evaluated
          </p>

          <p className="mt-2 text-3xl font-bold">
            {result.evaluated.toLocaleString()}
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
            {result.passing.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            within specification
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Male Coverage
          </p>

          <p className="mt-2 text-3xl font-bold">
            {result.maleCoveragePercent !== undefined
              ? `${Number(result.maleCoveragePercent).toFixed(1)}%`
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Female Coverage
          </p>

          <p className="mt-2 text-3xl font-bold">
            {result.femaleCoveragePercent !== undefined
              ? `${Number(result.femaleCoveragePercent).toFixed(1)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Per-dimension results */}
      {result.perDimension &&
        Object.keys(result.perDimension).length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Dimension Analysis
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="px-4 py-3 font-medium">
                      Dimension
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Result
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(result.perDimension).map(
                    ([dimension, value]) => (
                      <tr
                        key={dimension}
                        className="border-b border-slate-800/60"
                      >
                        <td className="px-4 py-4 font-medium text-slate-200">
                          {dimension}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Current implementation note */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm font-medium text-slate-300">
          Analysis scope
        </p>

        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          These results come directly from the human-variability
          analysis engine using the Fall-Arrest Safety Harness M/L
          specification. Blind-spot explanations and redesign
          projections will be connected when those backend
          calculations are available.
        </p>
      </div>
    </section>
  );
}
