"use client";

import { useMemo } from "react";
import { History } from "lucide-react";
import type { Deal } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  profitColor,
  typeBg,
} from "@/lib/format";

interface HistoryTableProps {
  deals: Deal[];
  currency: string;
}

export function HistoryTable({ deals, currency }: HistoryTableProps) {
  const sorted = useMemo(
    () => [...deals].sort((a, b) => b.closeTime - a.closeTime),
    [deals]
  );

  if (sorted.length === 0) {
    return (
      <div className="card flex h-48 flex-col items-center justify-center gap-3 text-zinc-500">
        <History className="h-8 w-8 opacity-50" />
        <p className="text-sm">No closed trades yet.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-zinc-900/50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-3">Symbol</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Volume</th>
              <th className="px-5 py-3 text-right">Open Price</th>
              <th className="px-5 py-3 text-right">Close Price</th>
              <th className="px-5 py-3 text-right">Profit</th>
              <th className="px-5 py-3 text-right">Commission</th>
              <th className="px-5 py-3 text-right">Swap</th>
              <th className="px-5 py-3">Opened</th>
              <th className="px-5 py-3">Closed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {sorted.map((deal) => (
                <tr
                  key={deal.ticket}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium text-zinc-200">
                    {deal.symbol}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium uppercase ${typeBg(deal.type)}`}
                    >
                      {deal.type}
                    </span>
                  </td>
                  <td className="number px-5 py-3 text-right text-zinc-300">
                    {formatNumber(deal.volume, 2)}
                  </td>
                  <td className="number px-5 py-3 text-right text-zinc-300">
                    {formatNumber(deal.priceOpen, 5)}
                  </td>
                  <td className="number px-5 py-3 text-right text-zinc-300">
                    {formatNumber(deal.priceClose, 5)}
                  </td>
                  <td
                    className={`number px-5 py-3 text-right font-medium ${profitColor(deal.profit)}`}
                  >
                    {formatCurrency(deal.profit, currency)}
                  </td>
                  <td className="number px-5 py-3 text-right text-zinc-400">
                    {formatCurrency(deal.commission, currency)}
                  </td>
                  <td className="number px-5 py-3 text-right text-zinc-400">
                    {formatCurrency(deal.swap, currency)}
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {formatDate(deal.openTime)}
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {formatDate(deal.closeTime)}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
