# Prop Firm Dashboard — MT5 Bridge

A read-only FastAPI bridge between MetaTrader 5 and the Next.js dashboard. It exposes a single snapshot that matches the shared `CONTRACT.md`.

## Endpoints

- `GET /health` → `{"status":"ok"}`
- `GET /api/snapshot` → full `DashboardSnapshot` object (account, rules, positions, performance, deals)

CORS is enabled for all origins so the Next.js dev server can call the bridge directly.

## Requirements

- Windows (the `MetaTrader5` Python package is Windows-only)
- [MetaTrader 5 terminal](https://www.metatrader5.com/) installed from your broker
- Python 3.12+
- An investor/read-only MT5 login (login, password, server)

## Quick start

1. **Install MT5 terminal** from your prop-firm/broker and log in once with the investor/read-only account.

2. **Create the virtual environment and install dependencies:**

   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. **Copy the example environment file and edit it with your credentials:**

   ```powershell
   cp .env.example .env
   notepad .env
   ```

   Required for real mode:

   - `MT5_LOGIN`
   - `MT5_PASSWORD` (investor/read-only password)
   - `MT5_SERVER`
   - `MT5_MOCK=0`

4. **Run the server:**

   ```powershell
   uvicorn main:app --port 8000
   ```

5. **Verify:**

   ```powershell
   curl http://localhost:8000/health
   curl http://localhost:8000/api/snapshot | python -m json.tool
   ```

## Mock mode (no MT5 terminal)

Set `MT5_MOCK=1` in `.env` (or export it) to return a deterministic, realistic sample snapshot without connecting to MT5.

```powershell
$env:MT5_MOCK=1
uvicorn main:app --port 8000
```

Useful for:

- Local frontend development on macOS/Linux
- CI checks where no MT5 terminal is available
- Verifying that the contract shape is respected

## Linux / macOS note

The `MetaTrader5` package is built for Windows. The bridge module uses a guarded import so it can still be parsed and run in **mock mode** on other platforms. For real trading data you must run the bridge on Windows with the MT5 terminal open (or under Wine, which is not officially supported by the `MetaTrader5` wheel).

## Configuration reference

| Variable                  | Description                                      | Default       |
| ------------------------- | ------------------------------------------------ | ------------- |
| `MT5_LOGIN`               | MT5 account number                               | *(required)*  |
| `MT5_PASSWORD`            | Investor/read-only password                      | *(required)*  |
| `MT5_SERVER`              | Broker server name (e.g. `FTMO-Demo`)            | *(required)*  |
| `MT5_MOCK`                | `1` = mock data, `0` = connect to MT5            | `0`           |
| `RULES_FIRM`              | Prop firm name                                   | `FTMO`        |
| `RULES_PHASE`             | `challenge`, `verification`, or `funded`           | `challenge`   |
| `RULES_INITIAL_BALANCE`   | Starting account balance                         | `100000`      |
| `RULES_PROFIT_TARGET_PCT` | Profit target percentage                         | `10`          |
| `RULES_MAX_DAILY_LOSS_PCT` | Max daily loss percentage                        | `5`           |
| `RULES_MAX_TOTAL_LOSS_PCT` | Max total loss percentage                         | `10`          |
| `PORT`                    | Uvicorn port                                     | `8000`        |

## Error handling

If the MT5 terminal is closed, credentials are missing, or any MT5 read fails, the bridge returns HTTP `503` with:

```json
{ "detail": "<human readable message>" }
```
