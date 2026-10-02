export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatDateOnly(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleDateString("en-US", {
    dateStyle: "short",
  });
}

export function formatLots(value: number): string {
  return `${formatNumber(value, 2)} lots`;
}

export function profitColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-zinc-400";
}

export function typeColor(type: "buy" | "sell"): string {
  return type === "buy" ? "text-emerald-400" : "text-rose-400";
}

export function typeBg(type: "buy" | "sell"): string {
  return type === "buy"
    ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
    : "bg-rose-400/10 border-rose-400/20 text-rose-400";
}
