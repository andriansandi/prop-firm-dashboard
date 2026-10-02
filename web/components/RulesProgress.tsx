"use client";

import { Target, TrendingDown, ShieldAlert } from "lucide-react";
import type { Account, Performance, Rules } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/format";

interface RulesProgressProps {
  rules: Rules;
  performance: Performance;
  account: Account;
  currency: string;
}

interface RuleMetric {
  id: string;
  label: string;
  icon: React.ReactNode;
  used: number;
  limit: number;
  usedPct: number;
  remaining: number;
  kind: "profit" | "loss";
}

export function RulesProgress({
  rules,
  performance,
  account,
  currency,
}: RulesProgressProps) {
  const profitTarget = rules.initialBalance * (rules.profitTargetPct / 100);
  const netProfit = performance.netProfit;
  const profitPct = Math.max(0, Math.min(100, (netProfit / profitTarget) * 100));

  const dailyLossLimit = rules.initialBalance * (rules.maxDailyLossPct / 100);
  const dailyNetLoss = Math.min(0, performance.dailyPnl ?? 0);
  const dailyAbs = Math.abs(dailyNetLoss);
  const dailyPct = Math.max(0, Math.min(100, (dailyAbs / dailyLossLimit) * 100));

  const totalLossLimit = rules.initialBalance * (rules.maxTotalLossPct / 100);
  const totalNetLoss = Math.min(0, account.equity - rules.initialBalance);
  const totalAbs = Math.abs(totalNetLoss);
  const totalPct = Math.max(0, Math.min(100, (totalAbs / totalLossLimit) * 100));

  const metrics: RuleMetric[] = [
    {
      id: "profit",
      label: `Profit Target · ${rules.profitTargetPct}%`,
      icon: <Target className="h-4 w-4" />,
      used: netProfit,
      limit: profitTarget,
      usedPct: profitPct,
      remaining: profitTarget - netProfit,
      kind: "profit",
    },
    {
      id: "daily",
      label: `Max Daily Loss · ${rules.maxDailyLossPct}%`,
      icon: <TrendingDown className="h-4 w-4" />,
      used: dailyAbs,
      limit: dailyLossLimit,
      usedPct: dailyPct,
      remaining: dailyLossLimit - dailyAbs,
      kind: "loss",
    },
    {
      id: "total",
      label: `Max Total Loss · ${rules.maxTotalLossPct}%`,
      icon: <ShieldAlert className="h-4 w-4" />,
      used: totalAbs,
      limit: totalLossLimit,
      usedPct: totalPct,
      remaining: totalLossLimit - totalAbs,
      kind: "loss",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {metrics.map((m) => (
        <RuleCard key={m.id} metric={m} currency={currency} />
      ))}
    </section>
  );
}

function RuleCard({
  metric,
  currency,
}: {
  metric: RuleMetric;
  currency: string;
}) {
  const isOverLimit = metric.usedPct >= 100;
  const fillColor =
    metric.kind === "profit"
      ? "bg-emerald-500"
      : metric.usedPct >= 90
        ? "bg-rose-500"
        : metric.usedPct >= 70
          ? "bg-amber-500"
          : "bg-emerald-500";

  return (
    <div className="card flex flex-col gap-4 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <span className="text-zinc-500">{metric.icon}</span>
          {metric.label}
        </div>
        <span className="number text-lg font-semibold text-white">
          {formatPercent(metric.usedPct, 1)}
        </span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
          style={{ width: `${Math.min(100, metric.usedPct)}%` }}
        />
        {/* Limit marker */}
        <div
          className="pointer-events-none absolute top-0 h-full w-0.5 bg-white/40"
          style={{ left: "100%" }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">
          Used: {formatCurrency(metric.used, currency)}
        </span>
        <span className={`${isOverLimit ? "text-rose-400" : "text-zinc-400"}`}>
          {isOverLimit
            ? `Limit exceeded by ${formatCurrency(Math.abs(metric.remaining), currency)}`
            : `${formatCurrency(metric.remaining, currency)} remaining`}
        </span>
      </div>
    </div>
  );
}
