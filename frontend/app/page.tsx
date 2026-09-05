"use client";

import { useState } from "react";
import ResultsDashboard from "./components/ResultsDashboard";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              DESIGN<span className="text-cyan-400">//</span>HUMAN
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Inclusive Design Analysis
            </p>
          </div>

          <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            PPE
          </button>
        </div>
      </header>

      {/* Main Dashboard */}
      <section className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-10">
          <h2 className="text-4xl font-bold">
            Design for the <span className="text-cyan-400">real</span> human.
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Analyze your product specifications against real human body
            measurements and discover who your design may exclude.
          </p>
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
          <div className="mx-auto max-w-xl">
            <div className="mb-4 text-5xl">📄</div>

            <h3 className="text-xl font-semibold">
              Upload your specification
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Upload a PDF containing your product specification or safety
              standard.
            </p>

            <input
              type="file"
              accept=".pdf,application/pdf"
              id="pdf-upload"
              className="hidden"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];

                if (selectedFile) {
                  setFile(selectedFile);
                  setFileName(selectedFile.name);
                  setShowResults(false);
                  setAnalysisResult(null);
                }
              }}
            />

            <label
              htmlFor="pdf-upload"
              className="mt-6 inline-block cursor-pointer rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Choose PDF
            </label>

            {fileName && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <p className="text-sm text-cyan-400">
                  ✓ {fileName} selected
                </p>

                {/* Remove */}
                <button
                  onClick={() => {
                    setFile(null);
                    setFileName("");
                    setShowResults(false);
                    setAnalysisResult(null);
                  }}
                  className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  Remove
                </button>

                {/* Analyze */}
                <button
                  onClick={async () => {
                    if (!file) {
                      alert("Please select a PDF first.");
                      return;
                    }

                    setIsAnalyzing(true);
                    setShowResults(false);

                    try {
                      const formData = new FormData();

                      // Send the actual PDF to the backend
                      formData.append("file", file);

                      const response = await fetch(
                        "http://127.0.0.1:8000/coverage/analyze",
                        {
                          method: "POST",
                          body: formData,
                        }
                      );

                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error(
                          "Backend error:",
                          response.status,
                          errorText
                        );

                        throw new Error(
                          `Analysis failed (${response.status})`
                        );
                      }

                      const data = await response.json();

                      console.log("Real backend response:", data);

                     setAnalysisResult({
  ...data,
  fileName: file.name,
  specificationName:
    data.product || "Industrial Safety Helmet",
  domain: data.domain || "PPE",
});

                      setShowResults(true);
                    } catch (error) {
                      console.error(
                        "Error analyzing specification:",
                        error
                      );

                      alert(
                        "Could not connect to the analysis backend. Make sure the backend is running on port 8000."
                      );
                    } finally {
                      setIsAnalyzing(false);
                    }
                  }}
                  disabled={isAnalyzing}
                  className="rounded-lg border border-cyan-400 px-6 py-3 font-semibold text-cyan-400 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalyzing
                    ? "Analyzing..."
                    : "Analyze Specification"}
                </button>
              </div>
            )}

            <p className="mt-3 text-xs text-slate-500">
              PDF files only
            </p>
          </div>
        </div>

        {/* Real Results */}
        {showResults && analysisResult && (
          <div className="mt-10">
            <ResultsDashboard result={analysisResult} />
          </div>
        )}

        {/* Before analysis */}
        {!showResults && (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h3 className="text-xl font-semibold">
              What we will build next
            </h3>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-slate-800 p-4">
                📊
                <p className="mt-2 font-medium">
                  Population Visualization
                </p>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                🔍
                <p className="mt-2 font-medium">Blind Spots</p>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                🎚️
                <p className="mt-2 font-medium">Redesign Slider</p>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                💡
                <p className="mt-2 font-medium">Why?</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

