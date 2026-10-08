import api from './api';

const unique = (items) => [...new Set(items.filter(Boolean))];

// During the API migration Namama used both legacy and v2 route mounts.
// The admin resolves a resource against both contracts and remembers the one
// that exists, so every screen uses one consistent API layer.
const routeCache = new Map();

function candidates(url) {
  const list = [url];
  const rules = [
    [/^\/catalog-v2(?=\/|$)/, '/catalog'],
    [/^\/catalog(?=\/|$)/, '/catalog-v2'],
    [/^\/inventory(?=\/|$)/, '/inventory-v2'],
    [/^\/inventory-v2(?=\/|$)/, '/inventory'],
    [/^\/(payments|shipping|returns|promotions|gift-cards)(?=\/|$)/, '/commerce/$1'],
    [/^\/commerce\/(payments|shipping|returns|promotions|gift-cards)(?=\/|$)/, '/$1'],
    [/^\/tracking(?=\/|$)/, '/platform/tracking'],
    [/^\/support(?=\/|$)/, '/content/support'],
  ];
  for (const [pattern, replacement] of rules) {
    if (pattern.test(url)) list.push(url.replace(pattern, replacement));
  }
  return unique(list);
}

function message(err, url) {
  const status = err?.response?.status;
  const server = err?.response?.data?.message || err?.response?.data?.error;
  if (server) return server;
  if (status === 404) return `API route not found: ${url}`;
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 422 || status === 400) return 'Please check the submitted fields.';
  if (status >= 500) return 'The API reached the server but failed while processing this request.';
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the Namama API. Check VITE_API_URL and that the API is running.';
  return err?.message || 'Request failed';
}

async function requestWithFallback({ method = 'get', url, data, params, responseType }) {
  const cached = routeCache.get(url);
  const urls = unique([cached, ...candidates(url)]);
  let lastError;

  for (const candidate of urls) {
    try {
      const res = await api.request({ method, url: candidate, data, params, responseType });
      routeCache.set(url, candidate);
      return res.data;
    } catch (err) {
      lastError = err;
      // Only try an alias when the route itself does not exist. Never hide
      // validation/auth/database errors by retrying a different endpoint.
      if (err?.response?.status !== 404) break;
    }
  }

  const err = lastError || new Error('Request failed');
  err.adminMessage = message(err, url);
  throw err;
}

export const adminPlatformService = {
  request: requestWithFallback,
  get: (url, params) => requestWithFallback({ method: 'get', url, params }),
  post: (url, data) => requestWithFallback({ method: 'post', url, data }),
  patch: (url, data) => requestWithFallback({ method: 'patch', url, data }),
  put: (url, data) => requestWithFallback({ method: 'put', url, data }),
  delete: (url) => requestWithFallback({ method: 'delete', url }),
};
