# DineEase

A responsive restaurant ordering and management demo built with React, Vite, TypeScript, and browser `localStorage`.

## Run locally

Install Node.js 20 or later, then from this directory run:

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. `npm install` / `npm run dev` also work if npm is your preferred package manager. To create a production bundle, run `pnpm build`; to serve it locally, run `pnpm preview`.

## Try the demo

- Choose **Start Ordering**, then pick one of T01–T05, or open `/?table=T01`.
- Add dishes, set quantities and notes, then submit. Orders start as **Pending Acceptance**.
- Open **Worker** to accept/reject, set kitchen estimates, progress statuses, respond to Table Buddy requests, and change availability.
- Open **Manager** to update prices and tax, manage table sessions, view local reports, and generate/download/print table QR codes.
- Open the customer **Running bill** to see accepted items, create split allocations, and simulate payment success, failure, or cancellation.

## Demo data and limits

All demo data is stored in this browser's `localStorage`. It is not secure authentication, a database, or cross-device synchronization. The payment checkout is simulated and never requests credentials or transfers money. QR URLs derive from the current site origin; generate/print them after deployment if they should point to a public site. Use **Manager → Reset demo data** is not currently provided; clear the browser's `localStorage` key `dineease-demo-v1` to restore the initial sample data.

The pasted project brief ended at the “Table Sessions” heading. This implementation includes active/closed table sessions and prevents closing an unpaid table.

