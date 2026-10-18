export function findItem(items, id) {
  for (const item of items) { if (item.id === id) return item; const found = findItem(item.children || [], id); if (found) return found; }
  return null;
}
export function normalizeMenuTree(items) {
  const ids = new Set();
  const normalize = rows => (Array.isArray(rows) ? rows : []).map(value => {
    const item = value && typeof value === 'object' ? value : { label: String(value || '') };
    let id = typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID();
    if (ids.has(id)) id = crypto.randomUUID();
    ids.add(id);
    const pageId = Number(item.pageId);
    const isPage = Number.isSafeInteger(pageId) && pageId > 0;
    return { id, label: String(item.label || item.title || item.name || 'Menu item'), type: isPage ? 'page' : 'custom',
      ...(isPage ? { pageId } : { url: String(item.url || item.href || '/') }),
      newTab: item.newTab === true || item.target === '_blank', isActive: item.isActive !== false,
      children: normalize(item.children),
    };
  });
  return normalize(items);
}
export function updateItem(items, id, patch) {
  return items.map(item => item.id === id ? { ...item, ...patch } : { ...item, children: updateItem(item.children || [], id, patch) });
}
export function removeItem(items, id) {
  return items.filter(item => item.id !== id).map(item => ({ ...item, children: removeItem(item.children || [], id) }));
}
export function moveItem(items, sourceId, targetId, placement = 'before') {
  if (sourceId === targetId) return items;
  const source = findItem(items, sourceId), target = findItem(items, targetId);
  if (!source || !target || findItem(source.children || [], targetId)) throw Error('A menu item cannot be placed inside its own submenu.');
  const without = removeItem(items, sourceId);
  const insert = rows => rows.flatMap(row => {
    if (row.id === targetId) {
      if (placement === 'inside') return [{ ...row, children: [...(row.children || []), source] }];
      return placement === 'after' ? [row, source] : [source, row];
    }
    return [{ ...row, children: insert(row.children || []) }];
  });
  const result = insert(without);
  function validate(rows, depth) { if (rows.length && depth > 4) throw Error('Menus support up to four levels.'); for (const row of rows) validate(row.children || [], depth + 1); }
  validate(result, 1); return result;
}
