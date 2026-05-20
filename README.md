# SMI Payer Performance Dashboard

A local web dashboard for analyzing radiology payer performance from practice management CSV exports.

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Usage

Export a CSV from your practice management system and upload it. The dashboard expects these columns:

| Column | Example |
|---|---|
| CPT Code | 71046 |
| Insurance Grouping | Medicare |
| State | AZ |
| Insurance Plan Name | Medicare Part B |
| CPT Modality | Chest X-Ray |
| Month of Service | 2024-01 |
| Total Payment Amount | 125.00 |
| Insurance Payment | 100.00 |
| Patient Payment | 25.00 |
| Refunds | 0.00 |
| Payment Posted Date | 02/15/2024 |

## Derived Metrics

- **Net Collected** = Insurance Payment + Patient Payment − Refunds
- **Days to Post** = Payment Posted Date − last day of Month of Service
- **Refund Rate %** = Refunds ÷ Total Payment Amount × 100

## Features

- KPI cards: total net collected, insurance %, patient %, refund rate, avg days to post
- Payer scorecard table — sortable by any column
- Monthly trend line chart — net collected by Insurance Grouping
- State comparison bar chart — insurance vs patient mix
- Global filters: State, Insurance Grouping, CPT Modality, date range
