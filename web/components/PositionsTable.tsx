"use client";

import { Inbox } from "lucide-react";
import type { Position } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  profitColor,
  typeBg,
} from "@/lib/format";

interface PositionsTableProps {
  positions: Position[];
  currency: string;
}

export function PositionsTable({ positions, currency }: PositionsTableProps) {
  if (positions.length === 0) {
    return (
      <div className="card flex h-48 flex-col items-center justify-center gap-3 text-zinc-500">
        <Inbox className="h-8 w-8 opacity-50" />
        <p className="text-sm">No open positions right now.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="bg-zinc-900/50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-3">Symbol</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Volume</th>
              <th className="px-5 py-3 text-right">Open Price</th>
              <th className="px-5 py-3 text-right">Current Price</th>
              <th className="px-5 py-3 text-right">SL / TP</th>
              <th className="px-5 py-3 text-right">Profit</th>
              <th className="px-5 py-3 text-right">Swap</th>
              <th className="px-5 py-3">Opened</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {positions.map((position) => (
              <tr
                key={position.ticket}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3 font-medium text-zinc-200">
                  {position.symbol}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium uppercase ${typeBg(position.type)}`}
                  >
                    {position.type}
                  </span>
                </td>
                <td className="number px-5 py-3 text-right text-zinc-300">
                  {formatNumber(position.volume, 2)}
                </td>
                <td className="number px-5 py-3 text-right text-zinc-300">
                  {formatNumber(position.priceOpen, 5)}
                </td>
                <td className="number px-5 py-3 text-right text-zinc-300">
                  {formatNumber(position.priceCurrent, 5)}
                </td>
                <td className="number px-5 py-3 text-right text-zinc-400">
                  {position.sl ? formatNumber(position.sl, 5) : "—"} /{" "}
                  {position.tp ? formatNumber(position.tp, 5) : "—"}
                </td>
                <td
                  className={`number px-5 py-3 text-right font-medium ${profitColor(position.profit)}`}
                >
                  {formatCurrency(position.profit, currency)}
                </td>
                <td className="number px-5 py-3 text-right text-zinc-400">
                  {formatCurrency(position.swap, currency)}
                </td>
                <td className="px-5 py-3 text-zinc-500">
                  {formatDate(position.openTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
