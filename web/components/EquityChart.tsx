"use client";

import { useMemo } from "react";
import { LineChart } from "lucide-react";
import type { Deal } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface EquityChartProps {
  deals: Deal[];
  initialBalance: number;
  currency: string;
}

export function EquityChart({ deals, initialBalance, currency }: EquityChartProps) {
  const { points, min, max } = useMemo(() => {
    const sorted = [...deals].sort((a, b) => a.closeTime - b.closeTime);
    const pts: { time: number; value: number }[] = [];
    let value = initialBalance;
    if (sorted.length === 0) {
      return { points: pts, min: initialBalance, max: initialBalance };
    }

    // Starting point at the first open time gives a more realistic curve.
    pts.push({ time: sorted[0].openTime, value });
    for (const deal of sorted) {
      value += deal.profit + (deal.commission ?? 0) + (deal.swap ?? 0);
      pts.push({ time: deal.closeTime, value });
    }

    const values = pts.map((p) => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const pad = (maxValue - minValue) * 0.1 || initialBalance * 0.02;
    return {
      points: pts,
      min: Math.min(minValue, initialBalance) - pad,
      max: Math.max(maxValue, initialBalance) + pad,
    };
  }, [deals, initialBalance]);

  if (points.length < 2) {
    return (
      <div className="card flex h-64 flex-col items-center justify-center gap-3 text-zinc-500">
        <LineChart className="h-8 w-8 opacity-50" />
        <p className="text-sm">Not enough closed trades to draw an equity curve.</p>
      </div>
    );
  }

  const width = 800;
  const height = 260;
  const padding = { top: 24, right: 16, bottom: 32, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const firstTime = points[0].time;
  const lastTime = points[points.length - 1].time;

  const x = (time: number) =>
    padding.left +
    ((time - firstTime) / Math.max(1, lastTime - firstTime)) * chartW;

  const y = (value: number) =>
    padding.top + chartH - ((value - min) / Math.max(1, max - min)) * chartH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.time)} ${y(p.value)}`)
    .join(" ");

  const areaPath = `${linePath} L ${x(points[points.length - 1].time)} ${padding.top + chartH} L ${x(points[0].time)} ${padding.top + chartH} Z`;

  const yTicks = 4;
  const horizontalGrid = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / yTicks;
    const yPos = padding.top + chartH - (i / yTicks) * chartH;
    return { label: formatCurrency(value, currency), y: yPos };
  });

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
          <p className="text-xs text-zinc-500">
            Starting balance {formatCurrency(initialBalance, currency)}
          </p>
        </div>
        <span className="number text-lg font-semibold text-emerald-400">
          {formatCurrency(points[points.length - 1].value, currency)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {horizontalGrid.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              className="stroke-zinc-800"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-zinc-500 text-[10px] font-mono"
            >
              {tick.label}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#equityGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* current-end dot */}
        <circle
          cx={x(points[points.length - 1].time)}
          cy={y(points[points.length - 1].value)}
          r={4}
          fill="#22c55e"
          stroke="#050505"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}
