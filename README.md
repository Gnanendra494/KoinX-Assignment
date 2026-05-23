# 🚀 KoinX Backend Take Home — Reconciliation Engine ⚙️

A production-style Node.js service that ingests user and exchange CSV exports, normalizes messy data, matches transactions, and generates a reconciliation report. 🛠️

## ✨ What is included

- 📥 CSV ingestion with quality checks
- 🗄️ MongoDB storage for ingested rows and reconciliation runs
- 🧩 Matching engine with configurable tolerances
- 📊 CSV reconciliation report generation
- 🌐 REST API endpoints for runs, counts, report, and unmatched rows
- 💻 CLI script to run reconciliation locally
- 📂 Sample input files from the assignment
- 🧪 Unit tests for normalization helpers

## 🤔 Assumptions and decisions

1. **🗺️ Type mapping**
   - `TRANSFER_OUT` on the user file matches `TRANSFER_IN` on the exchange file.
   - Transfer records are normalized to a shared canonical type `TRANSFER` and matched by opposite direction.

2. **🏷️ Asset aliases**
   - Common aliases are normalized case-insensitively.
   - Example: `bitcoin` → `BTC`.

3. **⏱️ Tolerance interpretation**
   - `TIMESTAMP_TOLERANCE_SECONDS=300` means a 5-minute window.
   - `QUANTITY_TOLERANCE_PERCENT=0.01` means 0.01% relative quantity tolerance.

4. **🚫 Bad rows are not dropped**
   - Invalid rows are stored with issues.
   - They appear in the unmatched output with a clear reason.

5. **👯 Duplicates**
   - Duplicate transaction IDs are retained and flagged.
   - Only one row can match a given counterparty record.

6. **⚠️ Conflict handling**
   - If a near candidate exists but quantity or timestamp exceeds tolerance, the row is marked `conflicting`.

## 📁 Project structure

- 🛠️ `src/services/ingestionService.js` — CSV parsing, normalization, and quality logging
- 🧠 `src/services/matchingService.js` — reconciliation algorithm
- 📝 `src/services/reportService.js` — CSV report generation
- 🚂 `src/services/reconciliationService.js` — orchestration
- 🛣️ `src/routes/` — REST API routes
- 🏗️ `src/models/` — MongoDB schemas
- 📜 `scripts/run-reconciliation.js` — local runner

## ⚙️ Setup

### 1) 📦 Install dependencies
```bash
npm install
```

### 2) 🐳 Start MongoDB
```bash
docker compose up -d
```

### 3) 🔧 Configure environment
Copy `.env.example` to `.env` and adjust if needed.

### 4) 🚀 Run the API
```bash
npm start
```

### 5) 🖥️ Run reconciliation from the CLI
```bash
node scripts/run-reconciliation.js --user data/user_transactions.csv --exchange data/exchange_transactions.csv
```

### 6) 📡 Trigger via API
```bash
POST /api/reconcile
```

Optional body:
```json
{
  "timestampToleranceSeconds": 300,
  "quantityTolerancePercent": 0.01,
  "userFilePath": "data/user_transactions.csv",
  "exchangeFilePath": "data/exchange_transactions.csv"
}
```

### 7) 🔍 Fetch results
- `GET /api/runs/:runId`
- `GET /api/runs/:runId/counts`
- `GET /api/runs/:runId/report`
- `GET /api/runs/:runId/unmatched`

## 📝 Notes on the sample data

The provided files contain:
- 🔁 duplicate transaction IDs
- ⏰ malformed timestamps
- ❓ missing timestamp/type values
- ➖ negative quantity data errors
- 🔄 transfer perspective differences
- 📏 one quantity mismatch outside the configured tolerance

These are all handled and surfaced in the output. ✅

## 💻 API examples

```bash
curl -X POST http://localhost:3000/api/reconcile   -H "Content-Type: application/json"   -d '{"timestampToleranceSeconds":300,"quantityTolerancePercent":0.01}'
```

```bash
curl http://localhost:3000/api/runs/<RUN_ID>/counts
curl http://localhost:3000/api/runs/<RUN_ID>/report
curl http://localhost:3000/api/runs/<RUN_ID>/unmatched
```

## 🏠 Running Locally (sample run and outputs)

Follow these commands from the repository root. If you have Docker available, start MongoDB with Docker; otherwise the repository includes a helper that runs using an in-memory Mongo for convenience.

- **Install dependencies:**

```bash
npm install
```

- **Start MongoDB (recommended) via Docker Compose:**

```bash
docker compose up -d
```

- **Run the reconciliation CLI (uses `data/` files and writes reports to `reports/`):**

```bash
npm run reconcile
# or explicitly:
node scripts/run-reconciliation.js --user data/user_transactions.csv --exchange data/exchange_transactions.csv
```

- **If you don't have Docker, run using an in-memory Mongo (generates outputs under `reports-memory/`):**

```bash
node scripts/run-reconciliation-memory.js
```

**Sample output produced by `node scripts/run-reconciliation-memory.js` (generated during test run):**

- 📄 **Generated report files:**
   - `reports-memory/6a113a9f722cd1ade073e115-reconciliation-report.csv`
   - `reports-memory/6a113a9f722cd1ade073e115-unmatched-only.csv`
   - `reports-memory/6a113a9f722cd1ade073e115-quality-issues.csv`

- 📈 **Summary counts from the reconciliation run:**
   - ✅ matched: 21
   - ⚠️ conflicting: 1
   - ❌ unmatched (user only): 4
   - ❌ unmatched (exchange only): 3

💡 If you see `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`, MongoDB is not running locally — either start Docker or use the in-memory helper above.
