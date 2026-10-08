# Namama Admin — Production UI Upgrade

This build removes the generic endpoint runner from the routed admin experience and replaces Modules 2–26 with commerce-oriented screens.

## Existing dedicated workflows retained
Products/product editor, variants, product colors/images, categories/subcategories, tags, orders/order details, coupons, customers, reviews, home slider and banner grid.

## New production management experiences
Collections/brands, search/discovery, inventory/warehouses/suppliers/purchase orders/transfers, payments/refunds, shipping zones/methods, returns/policies, promotions/gift cards, reviews/trust content, marketing/segments/abandoned carts/loyalty/referrals/affiliates, SEO metadata/redirects/audits, CMS pages/blogs/templates/navigation, support/tickets/help center/WhatsApp, analytics dashboard, tracking/ads, taxes/credit notes/reports, staff/roles/approvals/activity/notifications, security/health/fraud/incidents/backups, markets/currencies/locales/regional prices, integrations/webhooks, PWA/push, and accessibility issues.

## UI behavior
- Purpose-built navigation tabs per business area
- Searchable tables
- Create/edit side drawers with typed inputs
- Delete confirmation
- Status badges
- Responsive mobile layout
- Loading, empty and API error states
- Authenticated requests through the existing Axios client
- Analytics KPI dashboard

## Environment
Uses the existing VITE_API_URL and authentication setup.

## Verification
Run `npm ci` and `npm run build`. Dependency installation could not complete within the packaging environment time limit, so deployment should only proceed after the production build passes in your environment.
