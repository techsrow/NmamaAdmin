# Namama Admin — API Integration

This admin has been expanded to expose the commerce API modules completed through Module 26.

## Existing specialist screens retained
Products/product editor/variants/colors/images, categories/subcategories/tags, orders/order detail, coupons, users, reviews, home slider and banner grid remain available.

## New integrated management areas
Collections & brands; search/filter inspection; inventory; payments; shipping; returns/exchanges; promotions/gift cards; reviews/trust; marketing/retention; SEO; CMS; support; analytics; tracking/ads; taxes/invoicing; staff/RBAC; security/reliability; international selling; integrations/webhooks; mobile/PWA/push; accessibility.

The new module console uses the shared authenticated Axios client (`src/services/adminPlatformService.js`) and `VITE_API_URL`. It supports GET/POST/PATCH/PUT/DELETE actions, query parameters, JSON request bodies, API errors and tabular response inspection. Endpoints requiring a concrete `:id`, `:orderId`, etc. are intentionally blocked until a real record is selected rather than sending invalid placeholder IDs.

## Configure
`.env`: `VITE_API_URL=http://localhost:6103/api` (or your deployed API base URL).

## Build
`npm ci && npm run build`

Provider-backed features still require their credentials in the API environment (Razorpay, couriers, email/SMS/WhatsApp, Meta/Google, push providers, accounting/CRM/ERP/marketplaces). Database migrations for the API must be applied before opening admin modules that depend on their tables.
