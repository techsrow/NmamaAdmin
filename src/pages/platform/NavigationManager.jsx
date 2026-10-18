import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { moveItem, removeItem, updateItem, normalizeMenuTree } from '../../services/navigationTree';

const blank = () => ({ name: '', handle: '', items: [], locations: [], isActive: true });
const titles = { header: 'Main header', mobile: 'Mobile menu', footer: 'Footer', 'footer-legal': 'Footer legal links', 'top-bar': 'Top bar' };
const input = 'border rounded px-3 py-2 w-full';
const button = 'border rounded px-3 py-2 disabled:opacity-50';
const newItem = data => ({ id: crypto.randomUUID(), label: '', type: 'custom', url: '/', newTab: false, isActive: true, children: [], ...data });
const stable = data => JSON.stringify(data, (_key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value);
export default function NavigationManager() {
  const [menus, setMenus] = useState([]), [pages, setPages] = useState([]), [locations, setLocations] = useState([]);
  const [menu, setMenu] = useState(blank), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(true);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [drag, setDrag] = useState(null), [search, setSearch] = useState('');
  const [custom, setCustom] = useState({ label: '', url: '/' });
  async function load() {
    const [m, p, l] = await Promise.all([api.get('/content/navigation'), api.get('/content/navigation/pages'), api.get('/content/navigation/locations')]);
    setMenus(m.data.data); setPages(p.data.data); setLocations(l.data.data); return m.data.data;
  }
  useEffect(() => { load().catch(e => setError(e.response?.data?.message || 'Unable to load menus. Refresh to retry.')).finally(() => setBusy(false)); }, []);
  useEffect(() => { const leave = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', leave); return () => window.removeEventListener('beforeunload', leave); }, [dirty]);
  const change = patch => { setMenu(m => ({ ...m, ...patch })); setDirty(true); setNotice(''); };
  const edit = (id, patch) => change({ items: updateItem(menu.items, id, patch) });
  function open(selected) {
    const normalized = normalizeMenuTree(selected.items);
    const converted = stable(normalized) !== stable(selected.items);
    setMenu({ ...selected, items: normalized, locations: selected.locations || [] }); setDirty(converted); setError('');
    setNotice(converted ? 'Legacy menu converted for editing. Review all links and submenus before saving. Non-list legacy items must be rebuilt.' : '');
  }
  function select(handle) {
    if (dirty && !window.confirm('Discard unsaved menu changes?')) return;
    open(handle ? structuredClone(menus.find(m => m.handle === handle)) : blank());
  }
  function move(source, target, placement) {
    try { change({ items: moveItem(menu.items, source, target, placement) }); setError(''); } catch(e) { setError(e.message); } finally { setDrag(null); }
  }
  async function save() {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await api.put(`/content/navigation/${encodeURIComponent(menu.handle)}`, { ...menu, expectedUpdatedAt: menu.updatedAt });
      setMenu(response.data.data); setDirty(false); setNotice('Menu saved. Selected positions now use this menu.');
      try { await load(); } catch { setError('Menu saved, but the menu list could not refresh. Reload before further changes.'); }
    } catch(e) { setError(e.response?.data?.message || 'Save could not be confirmed. Reload menus before retrying.'); }
    finally { setBusy(false); }
  }
  async function reload() {
    if (dirty && !window.confirm('Discard unsaved changes and reload?')) return;
    setBusy(true); setError('');
    try { const list = await load(); open(list.find(m => m.handle === menu.handle) || blank()); } catch(e) { setError(e.response?.data?.message || 'Reload failed.'); } finally { setBusy(false); }
  }
  async function destroy() {
    if (!window.confirm('Delete this menu and remove its position assignments? Pages will remain.')) return;
    setBusy(true); setError('');
    try { await api.delete(`/content/navigation/${encodeURIComponent(menu.handle)}`, { data: { expectedUpdatedAt: menu.updatedAt } }); setMenu(blank()); setDirty(false); setNotice('Menu deleted.'); await load(); }
    catch(e) { setError(e.response?.data?.message || 'Delete could not be confirmed. Reload menus.'); } finally { setBusy(false); }
  }
  function rows(items, parent = null, depth = 0) {
    return items.map((item, index) => <div key={item.id} className="mt-3" style={{ marginLeft: depth ? 20 : 0 }}>
      <div className="border bg-white rounded p-3" onDragOver={e => { if (drag && drag !== item.id) e.preventDefault(); }}>
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <span draggable={!busy} onDragStart={e => { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move'; setDrag(item.id); }} onDragEnd={() => setDrag(null)} className="cursor-grab border rounded p-2" title="Drag to move this item">⠿</span>
          <span className="text-sm text-gray-500">{item.type === 'page' ? 'Page' : 'Custom link'}</span>
          <button type="button" className={button} disabled={busy || index === 0} onClick={() => move(item.id, items[index - 1].id, 'before')} aria-label={`Move ${item.label} up`}>↑</button>
          <button type="button" className={button} disabled={busy || index === items.length - 1} onClick={() => move(item.id, items[index + 1].id, 'after')} aria-label={`Move ${item.label} down`}>↓</button>
          <button type="button" className={button} disabled={busy || index === 0} onClick={() => move(item.id, items[index - 1].id, 'inside')}>Indent</button>
          <button type="button" className={button} disabled={busy || !parent} onClick={() => move(item.id, parent.id, 'after')}>Outdent</button>
          <button type="button" className={button} disabled={busy} onClick={() => { if (window.confirm('Remove this item and its submenu?')) change({ items: removeItem(menu.items, item.id) }); }}>Remove</button>
        </div>
        <label className="block">Navigation label<input className={input} value={item.label} onChange={e => edit(item.id, { label: e.target.value })} /></label>
        {item.type === 'custom' ? <label className="block mt-2">URL<input className={input} value={item.url} onChange={e => edit(item.id, { url: e.target.value })} /></label> : <label className="block mt-2">Page<select className={input} value={item.pageId} onChange={e => edit(item.id, { pageId: Number(e.target.value) })}>{!pages.some(p => p.id === item.pageId) && <option value={item.pageId}>Missing page — select another</option>}{pages.map(p => <option key={p.id} value={p.id}>{p.title}{p.isPublished ? '' : ' (draft; hidden on website)'}</option>)}</select></label>}
        <div className="flex gap-4 mt-2"><label><input type="checkbox" checked={item.newTab} onChange={e => edit(item.id, { newTab: e.target.checked })} /> Open in new tab</label><label><input type="checkbox" checked={item.isActive} onChange={e => edit(item.id, { isActive: e.target.checked })} /> Visible</label></div>
        {drag && drag !== item.id && <div className="flex gap-2 mt-2">{[['before', 'Drop before'], ['inside', 'Drop as submenu'], ['after', 'Drop after']].map(([placement, label]) => <div key={placement} className="border-2 border-dashed rounded p-3 bg-blue-50" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); move(drag, item.id, placement); }}>{label}</div>)}</div>}
      </div>{rows(item.children || [], item, depth + 1)}
    </div>);
  }
  return <section className="max-w-6xl mx-auto">
    <h1 className="text-2xl font-semibold">Navigation manager</h1><p className="text-gray-600 mt-1">Build menus from pages and custom links. Drag items to reorder or nest them; arrow and indent buttons also work on mobile.</p>
    {error && <p role="alert" className="bg-red-50 text-red-700 p-3 my-3">{error}</p>}{notice && <p role="status" className="bg-green-50 text-green-800 p-3 my-3">{notice}</p>}
    <div className="flex flex-wrap gap-3 my-4"><label className="flex-1">Select menu<select className={input} disabled={busy} value={menu.id ? menu.handle : ''} onChange={e => select(e.target.value)}><option value="">Create a new menu</option>{menus.map(m => <option key={m.id} value={m.handle}>{m.name} — {(m.locations || []).join(', ') || 'unassigned'}</option>)}</select></label><button className={button} disabled={busy} onClick={() => select('')}>New menu</button><button className={button} disabled={busy} onClick={reload}>Reload menus</button></div>
    <fieldset disabled={busy} className="grid lg:grid-cols-3 gap-5">
      <aside className="space-y-4"><div className="bg-white border rounded p-4"><h2 className="font-semibold">Add pages</h2><input aria-label="Search pages" placeholder="Search pages" className={input + ' my-2'} value={search} onChange={e => setSearch(e.target.value)} /><div className="max-h-72 overflow-auto">{pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map(p => <button key={p.id} className="block w-full text-left border-b py-2" onClick={() => change({ items: [...menu.items, newItem({ label: p.title, type: 'page', pageId: p.id, url: undefined })] })}>+ {p.title}{!p.isPublished && ' (draft)'}</button>)}{!pages.length && <p>Create pages in Content first.</p>}</div></div>
      <div className="bg-white border rounded p-4"><h2 className="font-semibold">Custom link</h2><label>Label<input className={input} value={custom.label} onChange={e => setCustom({ ...custom, label: e.target.value })} /></label><label>URL<input className={input} value={custom.url} onChange={e => setCustom({ ...custom, url: e.target.value })} /></label><button className={button + ' mt-2'} disabled={!custom.label.trim() || !custom.url.trim()} onClick={() => { change({ items: [...menu.items, newItem(custom)] }); setCustom({ label: '', url: '/' }); }}>Add to menu</button></div></aside>
      <div className="lg:col-span-2"><div className="bg-white border rounded p-4 space-y-3"><label className="block">Menu name<input className={input} value={menu.name} onChange={e => change({ name: e.target.value })} /></label><label className="block">Handle<input className={input} disabled={!!menu.id} placeholder="main-menu" value={menu.handle} onChange={e => change({ handle: e.target.value })} /></label><label><input type="checkbox" checked={menu.isActive} onChange={e => change({ isActive: e.target.checked })} /> Menu enabled</label><h2 className="font-semibold">Display positions</h2><p className="text-sm text-gray-600">Saving moves each selected position from its previous menu to this menu. The website displays the assigned active menu.</p><div className="flex flex-wrap gap-4">{locations.map(location => <label key={location}><input type="checkbox" checked={menu.locations.includes(location)} onChange={e => change({ locations: e.target.checked ? [...menu.locations, location] : menu.locations.filter(x => x !== location) })} /> {titles[location] || location}</label>)}</div></div>
      <h2 className="font-semibold mt-4">Menu structure {dirty && '(unsaved)'}</h2>{!menu.items.length && <p className="border border-dashed rounded p-6 mt-3">Add pages or custom links to start.</p>}{rows(menu.items)}
      <div className="flex gap-3 mt-4"><button className="bg-gray-900 text-white rounded px-4 py-2 disabled:opacity-50" disabled={!menu.name.trim() || !menu.handle || !dirty} onClick={save}>Save menu</button>{menu.id && <button className={button + ' text-red-700'} onClick={destroy}>Delete menu</button>}</div></div>
    </fieldset>
  </section>;
}
