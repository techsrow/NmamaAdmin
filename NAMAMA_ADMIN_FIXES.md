# Namama Admin — repaired build

## Fixed
- API base fallback corrected to `http://localhost:3011/api`.
- 401 interceptor no longer redirects repeatedly while already on `/login`.
- Shared platform service now supports the legacy/current Namama route aliases during API migration and caches the working route.
- Route fallback only occurs for HTTP 404; validation, authentication and server/database errors are preserved instead of being hidden.
- Platform pages now show useful API/network/permission/server errors.
- Edit operations prefer PATCH and fall back to PUT when the API does not expose PATCH.
- Create/edit payloads only send configured fields, preventing table-only/API fields from being posted back accidentally.
- Numeric fields are normalized before submit and JSON-shaped textarea values are parsed safely.
- Pagination no longer uses stale React state and Next is disabled when fewer than 25 rows are returned.
- Search can be submitted with Enter while local filtering remains available.
- Drawer accessibility and close behavior improved.

## Local environment
`VITE_API_URL=http://localhost:3011/api`

## Verification
Run:

```bash
npm install
npm run build
npm run dev
```

The packaging environment could not finish dependency installation within its execution time limit, so run the build command locally before deployment.
