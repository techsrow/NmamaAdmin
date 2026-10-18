# Namama main admin — 16 October 2026

This is the main store admin project. It contains no POS checkout, cashier session, sales or return UI. Barcode generation/labels use the shared API's existing /pos/barcodes endpoints as inventory-management operations. The separate POS app remains a later project.

The upload contained only src. This package adds the Vite/React build files, locked dependencies, Tailwind configuration and tests. Existing admin styling and screens are preserved. The new routes are /manage/barcodes, /manage/ledger and /manage/reconciliation. The package includes dist built using the API URL https://api.nmama.in/api; rebuild if your API URL differs.

## Install the small API compatibility update first

Use the latest apiforai.zip API from this conversation, with its inventory and Shadowfax migrations already applied. Copy api-compatibility/src/routes/adminOperations.ts into the API's src/routes folder. In API src/server.ts add:

```ts
import adminOperationsRoutes from "./routes/adminOperations";
```

Register it BEFORE app.use("/api/commerce", commerce913Routes):

```ts
app.use("/api", adminOperationsRoutes);
```

This adds protected admin return-request listing, return-policy listing/create/update and fraud-check listing. Existing return workflow PATCH remains in the API. No additional Prisma migration is required for this companion update. Do not copy admin package.json into the API.

In the API directory:

```bash
npm run build
```

Copy api-compatibility/tests/admin-operations.cjs to the API tests folder to run the optional mocked HTTP checks:

```bash
node tests/admin-operations.cjs
```

Restart the existing API PM2 process using its actual name. Preserve .env and existing source customization. The companion route file depends on the latest API models, auth middleware and Prisma client.

## Build the admin

Run inside this admin project:

```bash
npm ci
cp .env.example .env
npm test
npm run test:ui
npm run build
```

If an existing .env is present, edit its VITE_API_URL instead of overwriting it. The URL must include /api. VITE variables are public frontend configuration; never place database credentials, encryption keys or gateway secrets in them.

For development:

```bash
npm run dev
```

For production, serve the generated dist directory with Nginx/CloudPanel static hosting. Set the document root to the deployed dist folder and include SPA fallback:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Add the exact HTTPS admin origin to the API CORS configuration. A Vite static admin does not require a PM2 Node process. Preserve your existing domain/SSL configuration. Test direct refresh on /manage/inventory and /manage/shipping.

## Operator flows

- Inventory: stock, warehouses, suppliers, purchase orders and transfers remain in Inventory. Receipt submissions send a stable Idempotency-Key. An uncertain receipt can be retried with its original body after reopening the modal. Do not clear session storage to bypass an uncertain result.
- Reconciliation: allocations must equal current available stock and use distinct active warehouses. Existing legacy reservations block allocation changes. This changes warehouse allocation, not global stock.
- Barcodes: search variants, select rows, generate missing barcodes, then download PDF labels (1–10 copies). Existing barcodes are preserved. Internal generated codes are not GS1 registration. PDF generation supports EAN-13 codes; unsupported existing codes return an API error.
- Shipping: configure Shadowfax 360 token, category and booking switch. Full-order requests omit partial item data. Merchant e-way bill/GST and pickup slot/date fields are available. Use AWB recovery if a booking has an uncertain outcome. Cancellation request acceptance is shown separately from confirmed cancellation. Physical return review never automatically means sellable stock.
- Payments: supported checkout adapters are Razorpay, COD, BankTransfer and Manual. Record received payments only after verifying actual receipt of funds, with a unique reference. Refund retry keys persist for the same request. POS-origin payments are not refunded through this screen.
- Returns: use workflow states for approval/pickup/receipt. Actual money refunds belong in Payments; changing return workflow status does not move money or restock goods.

## Verification and limitations

Production build passed. Nine payload/idempotency checks, three DOM interaction tests and six companion API HTTP checks passed. API operations were mocked in those tests. The full browser download failed in this environment, so browser visual QA is not claimed. No live server, real customer mutation, payment, shipment, refund or deployment was performed.

Core integration flows were updated; this is not certification of every inherited business module. Existing backend limits still apply: partial Shadowfax booking is unavailable; fraud checks are a read-only log; incident/credit-note records are not editable where no API endpoint exists; provider-specific integrations beyond implemented adapters require backend work. The old rich-text editor is retained for compatibility and contributes a large lazy-loaded chunk. Verify editor licensing and upgrade policy for your deployment.

Before live release, test the deployed admin against staging: login, product editing, PO receipt retry, stock transfer, reconciliation, barcode PDF, tax rules, shipping-rule totals, Shadowfax booking/recovery and payment/refund reconciliation. Staff access remains governed by server permissions; many management routes require Admin.

## Navigation menus

Open Navigation Menus in the sidebar or /manage/navigation. Create/select a menu, add pages/custom links, drag into order or submenus, assign header/mobile/footer/footer-legal/top-bar, then save. Use arrows/Indent/Outdent on touch devices. The API navigation migration is required. Page content stays in Content; navigation is now a dedicated visual editor. The storefront will consume the public position endpoints in its later integration. Read ../api/NAVIGATION-MANAGER.md.

Navigation validation added four contract and three DOM tests, for 13 admin contract tests and 6 DOM tests in this release.
