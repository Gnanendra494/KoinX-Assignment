# KoinX Backend Take-Home — Reconciliation Engine
✨ **KoinX Backend Take-Home — Reconciliation Engine** ✨

A compact, developer-friendly Node.js service that ingests CSV exports from a user wallet and an exchange, normalizes messy real-world data, attempts to match records across both sources, and produces human-readable reconciliation reports. 🚀

This repo runs locally with or without Docker and is optimized for quick reproducible runs.

What you'll find 📦

- ✅ CSV ingestion with per-row data-quality checks
- 🛠️ Normalization helpers (timestamps, quantities, asset/type aliases)
- ⚖️ A configurable matching engine with tolerance settings
- 🧾 CSV report generation (full report, unmatched-only, and quality-issues)
- 🔌 Small REST API to trigger runs and fetch reports
- 🧭 CLI helpers: one for a real MongoDB and a convenience in-memory runner for quick runs
- 🧪 Tests covering normalization and integration using mongodb-memory-server

Quick decisions & assumptions ⚙️

- 🔁 Transfers: transfer directions are canonicalized so opposite-direction transfer rows can match.
- 🔡 Asset aliases: common names (e.g. `bitcoin`) are normalized to short symbols (BTC, ETH).
- ⏱️ Tolerances: timestamp and quantity tolerances are configurable and determine whether a pair is `matched`, `conflicting`, or `unmatched`.
- ⚠️ Bad rows: rows with parsing/quality issues are retained and surfaced (they are not silently dropped).

Getting started (copy-paste) 🧭

1) Install dependencies

```bash
npm install
```

2) Run with Docker (recommended) 🐳

```bash
# Start MongoDB
docker compose up -d

# Start the API server (default PORT=3000)
npm start
```

3) Run without Docker (in-memory MongoDB) 🧠

If you don't want to run MongoDB locally, use the in-memory helper which writes outputs under `reports-memory/`:

```bash
node scripts/run-reconciliation-memory.js
```

4) Run the CLI against a running MongoDB

```bash
node scripts/run-reconciliation.js --user data/user_transactions.csv --exchange data/exchange_transactions.csv
```

5) Run tests 🧪

```bash
npm test
```

API quick examples 🔍

- Trigger a run (POST):

```bash
curl -X POST http://localhost:3000/api/reconcile \
	-H "Content-Type: application/json" \
	-d '{"timestampToleranceSeconds":300,"quantityTolerancePercent":0.01}'
```

- Fetch run counts and report URLs:

```bash
curl http://localhost:3000/api/runs/<RUN_ID>/counts
curl http://localhost:3000/api/runs/<RUN_ID>/report
curl http://localhost:3000/api/runs/<RUN_ID>/unmatched
```

Files produced 📁

- Full reconciliation report CSV: `reports/<RUN_ID>-reconciliation-report.csv`
- Unmatched-only CSV: `reports/<RUN_ID>-unmatched-only.csv`
- Quality issues CSV: `reports/<RUN_ID>-quality-issues.csv`

If you use the in-memory helper, outputs are written in `reports-memory/` instead.

Sample expected summary (from a typical run) 📊

- ✅ matched: 21
- ⚠️ conflicting: 1
- 🟡 unmatched (user only): 4
- 🔴 unmatched (exchange only): 3

Troubleshooting 🩺

- If you see `MongooseServerSelectionError` or `ECONNREFUSED 127.0.0.1:27017`, MongoDB is not running locally. Either start Docker Compose or use the in-memory runner above.
- If the API reports `EADDRINUSE` when starting, another process is already bound to the configured port. Restart with `PORT=<port> npm start` or stop the conflicting process.

Design notes (short) 💡

- Data quality first: every raw row keeps a list of `issues` so you can audit why a row did not match.
- Transfer normalization: we canonicalize transfer types to remove perspective differences between sources.
- Configurable tolerances: timestamp and quantity tolerances are parameters, making the engine adaptable to multiple asset types and data qualities.

Where to look in the code 🔎

- `src/services/ingestionService.js` — CSV parsing, normalization, and data-quality tagging
- `src/services/matchingService.js` — the reconciliation algorithm and scoring rules
- `src/services/reportService.js` — CSV exporters for reports and quality issues
- `scripts/run-reconciliation.js` — CLI runner (connects to configured MongoDB)
- `scripts/run-reconciliation-memory.js` — in-memory convenience runner (no external Mongo required)

Suggested next steps 🚀

- Add pagination/filtering to the API for very large runs
- Add a Postman collection or OpenAPI spec for easier API exploration
- Add streaming CSV output to handle very large inputs without loading everything into memory

License & acknowledgements 📜

This is a take-home exercise repository. Feel free to reuse the approach and patterns for similar reconciliation tasks.

Happy reconciling ✨


