# Prop Firm Dashboard — Shared Data Contract

Kontrak tunggal yang dipakai semua lane. Setiap lane TIDAK boleh mengubah
bentuk field di sini tanpa koordinasi. Kalau butuh field tambahan, tambahkan
secara backward-compatible (optional), jangan rename/hapus.

## Struktur Repo

```
prop-firm-dashboard/
├── CONTRACT.md          # file ini
├── bridge/              # L2: MT5 bridge (Python + FastAPI) — jalan di Windows
├── web/                 # L3: Next.js dashboard (React + Tailwind)
└── worker/              # L4: Cloudflare Worker (Workers AI) endpoint /analyze
```

## Tipe Data (JSON — camelCase)

### Account
```json
{
  "login": 12345678,
  "server": "FTMO-Demo",
  "currency": "USD",
  "balance": 100000,
  "equity": 102150.5,
  "margin": 0,
  "marginFree": 102150.5,
  "marginLevel": 0,
  "leverage": 100,
  "credit": 0,
  "floatingProfit": 2150.5,
  "time": 1759200000
}
```

### Rules (aturan prop firm — dari config, bukan dari MT5)
```json
{
  "firm": "FTMO",
  "phase": "challenge",            // "challenge" | "verification" | "funded"
  "initialBalance": 100000,
  "profitTargetPct": 10,           // 10 = 10%
  "maxDailyLossPct": 5,            // 5 = 5%
  "maxTotalLossPct": 10
}
```

### Position (open)
```json
{
  "ticket": 1,
  "symbol": "EURUSD",
  "type": "buy",                   // "buy" | "sell"
  "volume": 0.5,
  "priceOpen": 1.0851,
  "priceCurrent": 1.0876,
  "sl": 1.0800,
  "tp": 1.0950,
  "profit": 125.0,
  "swap": -1.2,
  "openTime": 1759190000
}
```

### Deal (closed)
```json
{
  "ticket": 2,
  "symbol": "XAUUSD",
  "type": "sell",
  "volume": 0.2,
  "priceOpen": 2410.0,
  "priceClose": 2402.5,
  "profit": 150.0,
  "commission": -3.0,
  "swap": -0.4,
  "openTime": 1759100000,
  "closeTime": 1759150000
}
```

### Performance (dihitung bridge dari deals)
```json
{
  "totalTrades": 42,
  "wins": 26,
  "losses": 16,
  "winRate": 61.9,
  "profitFactor": 1.74,
  "avgWin": 88.4,
  "avgLoss": -52.1,
  "expectancy": 34.9,
  "netProfit": 1466.3,
  "maxDrawdownPct": 4.2,
  "dailyPnl": 2150.5,
  "bestTrade": 310.0,
  "worstTrade": -180.0
}
```

### DashboardSnapshot (respons utama bridge)
```json
{
  "account": { ...Account },
  "rules": { ...Rules },
  "positions": [ ...Position ],
  "performance": { ...Performance },
  "deals": [ ...Deal ],
  "generatedAt": 1759200000
}
```

## Endpoints

### Bridge (Windows, FastAPI, default port 8000)
- `GET /health` → `{"status":"ok"}`
- `GET /api/snapshot` → `DashboardSnapshot` (satu payload lengkap)

Bridge read-only. Credential MT5 (login, investor password, server) via `.env`,
tidak hardcode. Kalau koneksi MT5 gagal, balas `503` dengan `{"detail":"..."}`.

### Worker (Cloudflare)
- `POST /api/analyze` — body = `DashboardSnapshot`, respons:
```json
{
  "analysis": "<markdown: ringkasan performa, drawdown, risiko, insight>",
  "model": "<model id>",
  "generatedAt": 1759200000
}
```
- `GET /` → `{"status":"ok"}`

## Alur Runtime (dev)
1. Bridge jalan di Windows `http://localhost:8000`.
2. Next.js dev proxy `/api/snapshot` → bridge (rewrite).
3. Frontend render snapshot + chart equity.
4. Frontend POST snapshot ke worker `/api/analyze`, tampilkan markdown hasil AI.

## Catatan Penting
- Semua angka uang dalam float mata uang akun (bukan persen kecuali diberi `Pct`).
- Waktu dalam Unix epoch detik (integer).
- Bridge hanya baca (investor mode) — tidak ada order/send API sama sekali.