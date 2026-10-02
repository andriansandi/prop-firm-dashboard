"use client";

import type { Account } from "@/lib/types";
import { formatCurrency, formatPercent, profitColor } from "@/lib/format";

interface SummaryStripProps {
  account: Account;
}

function SummaryCard({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  accent?: "neutral" | "profit" | "loss";
}) {
  const accentClasses = {
    neutral: "border-white/[0.08]",
    profit: "border-emerald-500/20",
    loss: "border-rose-500/20",
  };

  return (
    <div
      className={`card flex flex-col justify-between gap-3 px-5 py-4 ${accentClasses[accent]}`}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
        {value}
      </div>
    </div>
  );
}

export function SummaryStrip({ account }: SummaryStripProps) {
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <SummaryCard
        label="Balance"
        value={
          <span className="number">{formatCurrency(account.balance, account.currency)}</span>
        }
      />
      <SummaryCard
        label="Equity"
        value={
          <span className="number">{formatCurrency(account.equity, account.currency)}</span>
        }
      />
      <SummaryCard
        label="Floating P&L"
        accent={account.floatingProfit > 0 ? "profit" : account.floatingProfit < 0 ? "loss" : "neutral"}
        value={
          <span className={`number ${profitColor(account.floatingProfit)}`}>
            {formatCurrency(account.floatingProfit, account.currency)}
          </span>
        }
      />
      <SummaryCard
        label="Margin Level"
        value={
          <span className="number">
            {account.marginLevel > 0
              ? formatPercent(account.marginLevel, 1)
              : "—"}
          </span>
        }
      />
      <SummaryCard
        label="Leverage"
        value={<span className="number">1:{account.leverage}</span>}
      />
    </section>
  );
}
