"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import type { AnalysisResponse, DashboardSnapshot } from "@/lib/types";

interface AnalysisPanelProps {
  snapshot: DashboardSnapshot;
}

export function AnalysisPanel({ snapshot }: AnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Analysis failed (${res.status}): ${text}`);
      }
      const data: AnalysisResponse = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach analysis worker.");
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  return (
    <div className="card flex flex-col gap-5 p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            AI Analysis
          </h3>
          <p className="text-xs text-zinc-500">
            Generates a performance summary, risk read, and drawdown insight.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Analyzing…" : analysis ? "Regenerate" : "Generate AI Analysis"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-rose-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Analysis unavailable</p>
            <p className="mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {analysis && !error && (
        <div className="rounded-xl border border-white/[0.06] bg-surface-elevated p-5">
          <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
            <span>Model: {analysis.model}</span>
            <span>{new Date(analysis.generatedAt * 1000).toLocaleString()}</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-3 mt-0 text-lg font-semibold text-white">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-2 mt-5 text-base font-semibold text-white">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-4 text-sm font-semibold text-white">{children}</h3>
                ),
                p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                ul: ({ children }) => (
                  <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
                ),
                li: ({ children }) => <li className="text-zinc-400">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-medium text-zinc-200">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-xs text-zinc-300">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-emerald-500/50 pl-4 text-zinc-400">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {analysis.analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {!analysis && !error && !loading && (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-surface-elevated/50 p-8 text-center text-sm text-zinc-500">
          No analysis generated yet. Click the button above to analyze this snapshot.
        </div>
      )}
    </div>
  );
}
