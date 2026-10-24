# Tabilo — Scan. Order. Enjoy.

A responsive restaurant ordering and management website built with React, Vite, TypeScript, an Express API, and PostgreSQL. The customer menu and restaurant orders are loaded from the backend. Worker and Manager pages are demo roles, not secure staff authentication.

## Run locally

Install Node.js 20 or later, then run:

```bash
pnpm install
pnpm dev
```

To create a production bundle, run `pnpm build`; to serve it locally, run `pnpm preview`. Run the availability scenarios with `pnpm test`.

## Try the site

- Choose **Start Ordering**, pick T01–T05, or open `/?table=T01`.
- Browse the menu, add dishes, set quantities and notes, and submit an order.
- Open **Worker** to manage order status, service requests, and item availability.
- Open **Manager** to manage menu availability, prices, table sessions, reports, and QR codes.
- The running bill includes accepted items and supports demo-only bill allocation and payment simulation.

## Data and limits

The Render API and PostgreSQL database are authoritative for menu items, item availability, and restaurant orders. Worker and Manager availability switches save through that API. Customer pages refresh the menu and order queue every 15 seconds, checkout rechecks availability before submission, and the API validates it again under a database row lock. Other demo state (table sessions, service requests, price/tax settings, split allocations, and simulated payments) remains in this browser's `localStorage` and is not synchronized across devices. Staff dashboards are demo roles, not secure authentication. Payment is simulated and never requests credentials or transfers money. Generate and print table QR codes after deployment so their URLs use the public site origin.

