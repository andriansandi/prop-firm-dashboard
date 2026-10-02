# prop-firm-dashboard-api

Cloudflare Worker that receives a `DashboardSnapshot` (see `../CONTRACT.md`) and returns an AI-generated Markdown trading-performance analysis.

## Endpoints

- `GET /` — health check returning `{"status":"ok"}`.
- `POST /api/analyze` — accepts a `DashboardSnapshot` JSON body and returns:
  ```json
  {
    "analysis": "# Performance Analysis\n...",
    "model": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "generatedAt": 1759200000
  }
  ```
- `OPTIONS` requests are handled as CORS preflight (204).

## Local development

```bash
cd worker
npm install
npm run typecheck
npx wrangler dev
```

> Note: Workers AI uses real neurons even in `wrangler dev`, so you must be logged in with `npx wrangler login` first. Free tier: ~10,000 neurons/day.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

The first command opens a browser to authenticate with Cloudflare. The second builds and deploys the Worker.

## Notes

- The worker only references metrics present in the incoming snapshot (`CONTRACT.md`).
- If the AI binding fails, the worker responds with `502 {"error":"ai failed"}`.
- Invalid JSON bodies result in `400 {"error":"invalid snapshot"}`.
