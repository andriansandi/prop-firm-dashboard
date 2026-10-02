"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useDashboardSnapshot } from "@/lib/useSnapshot";
import { Header } from "@/components/Header";
import { SummaryStrip } from "@/components/SummaryStrip";
import { RulesProgress } from "@/components/RulesProgress";
import { MetricCards } from "@/components/MetricCards";
import { EquityChart } from "@/components/EquityChart";
import { PositionsTable } from "@/components/PositionsTable";
import { HistoryTable } from "@/components/HistoryTable";
import { AnalysisPanel } from "@/components/AnalysisPanel";

export default function DashboardPage() {
  const { snapshot, loading, error, refetch } = useDashboardSnapshot();

  if (loading && !snapshot) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm">Loading account snapshot…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen pb-12">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:py-8">
        {error && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Could not refresh snapshot</p>
                <p className="mt-1 opacity-90">{error}</p>
              </div>
            </div>
            <button
              onClick={refetch}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.1]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {snapshot ? (
          <>
            <Header
              account={snapshot.account}
              rules={snapshot.rules}
              generatedAt={snapshot.generatedAt}
            />

            <section aria-label="Account summary">
              <SummaryStrip account={snapshot.account} />
            </section>

            <section aria-label="Prop-firm rules">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Prop-Firm Rules</h2>
                <span className="text-xs text-zinc-500">
                  Initial balance{" "}
                  <span className="number text-zinc-300">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: snapshot.account.currency,
                    }).format(snapshot.rules.initialBalance)}
                  </span>
                </span>
              </div>
              <RulesProgress
                rules={snapshot.rules}
                performance={snapshot.performance}
                account={snapshot.account}
                currency={snapshot.account.currency}
              />
            </section>

            <section aria-label="Performance metrics">
              <h2 className="mb-3 text-sm font-semibold text-white">Performance</h2>
              <MetricCards
                performance={snapshot.performance}
                currency={snapshot.account.currency}
              />
            </section>

            <section aria-label="Equity curve">
              <EquityChart
                deals={snapshot.deals}
                initialBalance={snapshot.rules.initialBalance}
                currency={snapshot.account.currency}
              />
            </section>

            <section aria-label="Open positions">
              <h2 className="mb-3 text-sm font-semibold text-white">Open Positions</h2>
              <PositionsTable
                positions={snapshot.positions}
                currency={snapshot.account.currency}
              />
            </section>

            <section aria-label="Trade history">
              <h2 className="mb-3 text-sm font-semibold text-white">Trade History</h2>
              <HistoryTable
                deals={snapshot.deals}
                currency={snapshot.account.currency}
              />
            </section>

            <section aria-label="AI analysis">
              <AnalysisPanel snapshot={snapshot} />
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
