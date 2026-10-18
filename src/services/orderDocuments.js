export function enabledOrderProviders(rows, current = '') {
  const providers = new Map((Array.isArray(rows) ? rows : []).filter(row => row.isEnabled === true).map(row => [row.provider, {value: row.provider, label: row.provider === 'Shadowfax360' ? 'Shadowfax 360' : row.provider}]));
  if (current && !providers.has(current)) providers.set(current, {value: current, label: `${current === 'Shadowfax360' ? 'Shadowfax 360' : current} (saved on order)`});
  return [...providers.values()];
}
export function carrierLabelUrl(value) {
  try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch {}
  throw new Error('The carrier has not returned a valid HTTPS label. Create or reconcile the shipment in Shipping first.');
}
