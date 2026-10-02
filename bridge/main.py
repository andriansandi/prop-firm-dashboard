"""
Prop Firm Dashboard — MetaTrader 5 Bridge (read-only).

A FastAPI service that exposes a single snapshot of the connected MT5 account,
matching the shared CONTRACT.md exactly.  Set MT5_MOCK=1 to run without an MT5
terminal (useful for local/CI verification).
"""

from __future__ import annotations

import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# The MetaTrader5 wheel is platform-specific (Windows).  Wrapping the import lets
# the module load on Linux/in mock mode while still using the official API name.
_MT5: Any
try:
    import MetaTrader5 as mt5  # type: ignore  # platform-specific package

    _MT5 = mt5
    MT5_AVAILABLE = True
except Exception:  # pragma: no cover - package not installed on non-Windows hosts
    _MT5 = None
    MT5_AVAILABLE = False

load_dotenv()

app = FastAPI(title="Prop Firm MT5 Bridge", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def _load_rules() -> Dict[str, Any]:
    return {
        "firm": os.getenv("RULES_FIRM", "FTMO"),
        "phase": os.getenv("RULES_PHASE", "challenge"),
        "initialBalance": float(os.getenv("RULES_INITIAL_BALANCE", "100000")),
        "profitTargetPct": float(os.getenv("RULES_PROFIT_TARGET_PCT", "10")),
        "maxDailyLossPct": float(os.getenv("RULES_MAX_DAILY_LOSS_PCT", "5")),
        "maxTotalLossPct": float(os.getenv("RULES_MAX_TOTAL_LOSS_PCT", "10")),
    }


def _format_money(value: float, decimals: int = 2) -> float:
    return round(float(value), decimals)


# ---------------------------------------------------------------------------
# MT5 -> Contract mapping
# ---------------------------------------------------------------------------


def _init_mt5() -> None:
    if not MT5_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="MetaTrader5 package is not available on this platform",
        )

    login_raw = os.getenv("MT5_LOGIN")
    server = os.getenv("MT5_SERVER")
    if not login_raw or not server:
        raise HTTPException(
            status_code=503,
            detail="MT5_LOGIN and MT5_SERVER must be set in the environment",
        )

    password = os.getenv("MT5_PASSWORD", "")
    try:
        login = int(login_raw)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=f"MT5_LOGIN is not numeric: {exc}")

    if _MT5 is None:
        raise HTTPException(status_code=503, detail="MT5 module is not loaded")

    mt5_local = _MT5
    ok = mt5_local.initialize(login=login, password=password, server=server)
    if not ok:
        err = mt5_local.last_error()
        raise HTTPException(status_code=503, detail=f"MT5 initialize failed: {err}")


def _fetch_account() -> Dict[str, Any]:
    if _MT5 is None:
        raise HTTPException(status_code=503, detail="MT5 module is not loaded")

    mt5_local = _MT5
    info = mt5_local.account_info()
    if info is None:
        err = mt5_local.last_error()
        raise HTTPException(status_code=503, detail=f"MT5 account_info failed: {err}")

    return {
        "login": int(info.login),
        "server": str(info.server),
        "currency": str(info.currency),
        "balance": _format_money(info.balance),
        "equity": _format_money(info.equity),
        "margin": _format_money(info.margin),
        "marginFree": _format_money(info.margin_free),
        "marginLevel": _format_money(info.margin_level) if info.margin_level else 0.0,
        "leverage": int(info.leverage),
        "credit": _format_money(info.credit),
        "floatingProfit": _format_money(info.profit),
        "time": _now_ts(),
    }


def _fetch_positions() -> List[Dict[str, Any]]:
    if _MT5 is None:
        raise HTTPException(status_code=503, detail="MT5 module is not loaded")

    mt5_local = _MT5
    raw = mt5_local.positions_get()
    if raw is None:
        err = mt5_local.last_error()
        raise HTTPException(status_code=503, detail=f"MT5 positions_get failed: {err}")

    positions: List[Dict[str, Any]] = []
    for p in raw:
        positions.append(
            {
                "ticket": int(p.ticket),
                "symbol": str(p.symbol),
                "type": "buy" if p.type == 0 else "sell",
                "volume": _format_money(p.volume),
                "priceOpen": float(p.price_open),
                "priceCurrent": float(p.price_current),
                "sl": float(p.sl),
                "tp": float(p.tp),
                "profit": _format_money(p.profit),
                "swap": _format_money(p.swap),
                "openTime": int(p.time.timestamp()),
            }
        )
    return positions


def _fetch_deals() -> List[Dict[str, Any]]:
    if _MT5 is None:
        raise HTTPException(status_code=503, detail="MT5 module is not loaded")

    mt5_local = _MT5
    now = datetime.now(timezone.utc)
    from_date = datetime(2000, 1, 1, tzinfo=timezone.utc)
    to_date = now + timedelta(days=1)

    raw = mt5_local.history_deals_get(from_date, to_date)
    if raw is None:
        err = mt5_local.last_error()
        raise HTTPException(status_code=503, detail=f"MT5 history_deals_get failed: {err}")

    # Group each physical trade by its MT5 position_id.  This produces one Deal
    # per closed position with open/close prices and times.
    grouped: Dict[int, List[Any]] = {}
    for d in raw:
        # Skip balance/credit/charge/correction/bonus deal types.
        if d.type not in (0, 1):  # DEAL_TYPE_BUY, DEAL_TYPE_SELL
            continue
        grouped.setdefault(int(d.position_id), []).append(d)

    deals: List[Dict[str, Any]] = []
    for pid, ds in grouped.items():
        if not ds:
            continue
        ds_sorted = sorted(ds, key=lambda x: x.time)
        entry_deals = [d for d in ds_sorted if d.entry == 0]  # DEAL_ENTRY_IN
        exit_deals = [d for d in ds_sorted if d.entry in (1, 3)]  # OUT / OUT_BY

        if not entry_deals or not exit_deals:
            # Still-open positions or orphaned fills are intentionally skipped.
            continue

        entry = entry_deals[0]
        exit_ = exit_deals[-1]

        profit = sum(float(d.profit) for d in ds_sorted)
        commission = sum(float(d.commission) for d in ds_sorted)
        swap = sum(float(d.swap) for d in ds_sorted)

        deals.append(
            {
                "ticket": int(pid),  # position id is a stable ticket-like id
                "symbol": str(entry.symbol),
                "type": "buy" if entry.type == 0 else "sell",
                "volume": _format_money(entry.volume),
                "priceOpen": float(entry.price),
                "priceClose": float(exit_.price),
                "profit": _format_money(profit),
                "commission": _format_money(commission),
                "swap": _format_money(swap),
                "openTime": int(entry.time.timestamp()),
                "closeTime": int(exit_.time.timestamp()),
            }
        )

    deals.sort(key=lambda x: x["closeTime"])
    return deals


# ---------------------------------------------------------------------------
# Performance maths
# ---------------------------------------------------------------------------


def _compute_performance(
    deals: List[Dict[str, Any]],
    floating_profit: float,
    initial_balance: float,
) -> Dict[str, Any]:
    profits = [d["profit"] for d in deals]
    total = len(profits)
    net_profit = sum(profits)

    wins = [p for p in profits if p > 0]
    losses = [p for p in profits if p < 0]
    gross_profit = sum(wins) if wins else 0.0
    gross_loss = sum(losses) if losses else 0.0

    wins_count = len(wins)
    losses_count = len(losses)

    win_rate = round((wins_count / total) * 100, 1) if total else 0.0
    profit_factor = round(gross_profit / abs(gross_loss), 2) if gross_loss else 0.0
    avg_win = round(gross_profit / wins_count, 2) if wins_count else 0.0
    avg_loss = round(gross_loss / losses_count, 2) if losses_count else 0.0
    expectancy = round(net_profit / total, 2) if total else 0.0

    best_trade = round(max(profits), 2) if profits else 0.0
    worst_trade = round(min(profits), 2) if profits else 0.0

    # Running equity curve and max drawdown percentage.
    max_drawdown_pct = 0.0
    if profits:
        peak = initial_balance
        equity = initial_balance
        for d in sorted(deals, key=lambda x: x["closeTime"]):
            equity += d["profit"]
            if equity > peak:
                peak = equity
            drawdown = (peak - equity) / peak * 100.0
            if drawdown > max_drawdown_pct:
                max_drawdown_pct = drawdown

    # Today's closed PnL in UTC + current floating PnL.
    now = datetime.now(timezone.utc)
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    end_of_day = start_of_day + timedelta(days=1)
    start_ts = int(start_of_day.timestamp())
    end_ts = int(end_of_day.timestamp())

    today_pnl = sum(
        d["profit"] for d in deals if start_ts <= d["closeTime"] < end_ts
    )
    daily_pnl = _format_money(floating_profit + today_pnl)

    return {
        "totalTrades": total,
        "wins": wins_count,
        "losses": losses_count,
        "winRate": win_rate,
        "profitFactor": profit_factor,
        "avgWin": avg_win,
        "avgLoss": avg_loss,
        "expectancy": expectancy,
        "netProfit": _format_money(net_profit),
        "maxDrawdownPct": round(max_drawdown_pct, 2),
        "dailyPnl": daily_pnl,
        "bestTrade": best_trade,
        "worstTrade": worst_trade,
    }


# ---------------------------------------------------------------------------
# Mock data
# ---------------------------------------------------------------------------


def _build_mock_snapshot() -> Dict[str, Any]:
    rules = _load_rules()
    initial_balance = rules["initialBalance"] or 100000.0

    base_prices = {
        "EURUSD": 1.0850,
        "GBPUSD": 1.2700,
        "USDJPY": 157.30,
        "XAUUSD": 2410.00,
        "US30": 42000.00,
    }

    now = datetime.now(timezone.utc)
    random.seed(42)  # deterministic mock data

    deals: List[Dict[str, Any]] = []
    ticket = 1000
    for _ in range(35):
        symbol = random.choice(list(base_prices.keys()))
        trade_type = random.choice(["buy", "sell"])
        volume = round(random.uniform(0.1, 0.5), 2)

        gross = round(random.gauss(55.0, 110.0), 2)
        if abs(gross) < 5.0:
            gross = 5.0 if gross >= 0 else -5.0

        commission = -round(volume * 3.5, 2)
        swap = -round(random.uniform(0.0, 1.5), 2) if random.random() > 0.5 else 0.0
        net_profit = _format_money(gross + commission + swap)

        price_open = base_prices[symbol] + random.uniform(-0.010, 0.010)
        if symbol in ("EURUSD", "GBPUSD"):
            price_open = round(price_open, 5)
            multiplier = volume * 100_000
        elif symbol == "USDJPY":
            price_open = round(price_open, 3)
            multiplier = volume * 100_000
        elif symbol == "XAUUSD":
            price_open = round(price_open, 2)
            multiplier = volume * 100
        else:  # US30 / indices
            price_open = round(price_open, 2)
            multiplier = volume

        # Keep the close price directionally consistent with the gross PnL.
        delta = (gross if trade_type == "buy" else -gross) / multiplier
        decimals = 2 if symbol in ("XAUUSD", "US30", "USDJPY") else 5
        price_close = round(price_open + delta, decimals)

        open_dt = now - timedelta(
            days=random.randint(1, 45),
            hours=random.randint(0, 18),
        )
        close_dt = open_dt + timedelta(hours=random.randint(1, 72))

        deals.append(
            {
                "ticket": ticket,
                "symbol": symbol,
                "type": trade_type,
                "volume": volume,
                "priceOpen": price_open,
                "priceClose": price_close,
                "profit": net_profit,
                "commission": commission,
                "swap": swap,
                "openTime": int(open_dt.timestamp()),
                "closeTime": int(close_dt.timestamp()),
            }
        )
        ticket += 1

    deals.sort(key=lambda x: x["closeTime"])

    open_positions = [
        {
            "ticket": 9001,
            "symbol": "EURUSD",
            "type": "buy",
            "volume": 0.5,
            "priceOpen": 1.08450,
            "priceCurrent": 1.08760,
            "sl": 1.08000,
            "tp": 1.09500,
            "profit": 155.0,
            "swap": -1.2,
            "openTime": int((now - timedelta(hours=6)).timestamp()),
        },
        {
            "ticket": 9002,
            "symbol": "XAUUSD",
            "type": "sell",
            "volume": 0.2,
            "priceOpen": 2415.00,
            "priceCurrent": 2402.50,
            "sl": 2430.00,
            "tp": 2385.00,
            "profit": 250.0,
            "swap": -0.4,
            "openTime": int((now - timedelta(hours=12)).timestamp()),
        },
        {
            "ticket": 9003,
            "symbol": "US30",
            "type": "buy",
            "volume": 1.0,
            "priceOpen": 41950.0,
            "priceCurrent": 42110.0,
            "sl": 41700.0,
            "tp": 42500.0,
            "profit": 160.0,
            "swap": -2.1,
            "openTime": int((now - timedelta(hours=3)).timestamp()),
        },
    ]

    floating_profit = sum(p["profit"] for p in open_positions)
    equity = _format_money(initial_balance + floating_profit)
    balance = _format_money(equity - floating_profit)
    margin_used = 1234.56

    account = {
        "login": 12345678,
        "server": rules["firm"] + "-Demo",
        "currency": "USD",
        "balance": balance,
        "equity": equity,
        "margin": _format_money(margin_used),
        "marginFree": _format_money(equity - margin_used),
        "marginLevel": 0.0,
        "leverage": 100,
        "credit": 0.0,
        "floatingProfit": _format_money(floating_profit),
        "time": _now_ts(),
    }

    performance = _compute_performance(deals, account["floatingProfit"], initial_balance)

    return {
        "account": account,
        "rules": rules,
        "positions": open_positions,
        "performance": performance,
        "deals": deals,
        "generatedAt": _now_ts(),
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/snapshot")
def snapshot() -> Dict[str, Any]:
    if os.getenv("MT5_MOCK", "0") == "1":
        return _build_mock_snapshot()

    try:
        _init_mt5()
        account = _fetch_account()
        positions = _fetch_positions()
        deals = _fetch_deals()
        performance = _compute_performance(
            deals,
            account["floatingProfit"],
            _load_rules()["initialBalance"],
        )

        return {
            "account": account,
            "rules": _load_rules(),
            "positions": positions,
            "performance": performance,
            "deals": deals,
            "generatedAt": _now_ts(),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"MT5 bridge error: {exc}")
    finally:
        try:
            if _MT5 is not None and os.getenv("MT5_MOCK", "0") != "1":
                _MT5.shutdown()
        except Exception:
            pass


# Small CLI sanity check: `python main.py` prints the mock snapshot as JSON.
if __name__ == "__main__":
    import json

    os.environ.setdefault("MT5_MOCK", "1")
    print(json.dumps(_build_mock_snapshot(), indent=2))
