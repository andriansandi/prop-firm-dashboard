"use client";

import type { Performance } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent, profitColor } from "@/lib/format";

interface MetricCardsProps {
  performance: Performance;
  currency: string;
}

export function MetricCards({ performance, currency }: MetricCardsProps) {
  const metrics = [
    {
      label: "Win Rate",
      value: formatPercent(performance.winRate, 1),
      color: "text-white",
    },
    {
      label: "Profit Factor",
      value: formatNumber(performance.profitFactor, 2),
      color: "text-white",
    },
    {
      label: "Avg Win",
      value: formatCurrency(performance.avgWin, currency),
      color: "text-emerald-400",
    },
    {
      label: "Avg Loss",
      value: formatCurrency(performance.avgLoss, currency),
      color: "text-rose-400",
    },
    {
      label: "Expectancy",
      value: formatCurrency(performance.expectancy, currency),
      color: profitColor(performance.expectancy),
    },
    {
      label: "Max Drawdown",
      value: formatPercent(performance.maxDrawdownPct, 1),
      color: "text-rose-400",
    },
    {
      label: "Net Profit",
      value: formatCurrency(performance.netProfit, currency),
      color: profitColor(performance.netProfit),
    },
    {
      label: "Total Trades",
      value: String(performance.totalTrades),
      color: "text-white",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="card flex flex-col justify-between gap-3 px-5 py-4"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {m.label}
          </span>
          <span className={`number text-xl font-semibold md:text-2xl ${m.color}`}>
            {m.value}
          </span>
        </div>
      ))}
    </section>
  );
}
