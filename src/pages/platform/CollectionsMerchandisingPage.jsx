import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Check, ChevronLeft, Image as ImageIcon, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";

import { adminPlatformService as platformApi } from "../../services/adminPlatformService";

import productService from "../../services/productService";

import "./collections-merchandising.css";



const unwrap = (v) => {

 const x = v?.data?.data ?? v?.data ?? v?.items ?? v?.results ?? v;

 if (Array.isArray(x)) return x;

 if (Array.isArray(x?.items)) return x.items;

 if (Array.isArray(x?.products)) return x.products;

 if (Array.isArray(x?.rows)) return x.rows;

 return [];

};

const apiData = (v) => v?.data ?? v;

const slugify = (s = "") => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const thumb = (p) => p?.imageUrl || p?.images?.find?.((i) => i.isMain)?.url || p?.images?.[0]?.url || p?.variants?.[0]?.images?.[0]?.url || "";

const price = (p) => {

 const values = (p?.variants || []).map((v) => Number(v.discountPrice ?? v.price)).filter(Number.isFinite);

 if (!values.length) return "—";

 const min = Math.min(...values), max = Math.max(...values);

 return min === max ? `₹${min.toLocaleString("en-IN")}` : `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`;

};

const errorText = (e) => e?.adminMessage || e?.response?.data?.message || e?.response?.data?.error || e?.message || "Request failed";



function ProductPicker({ open, title, selected, products, loading, onClose, onSave, singleActionLabel = "Add" }) {

 const [q, setQ] = useState("");

 const [draft, setDraft] = useState([]);

 useEffect(() => { if (open) { setDraft(selected || []); setQ(""); } }, [open, selected]);

 const filtered = useMemo(() => products.filter((p) => {

const hay = `${p.name || ""} ${p.slug || ""} ${p.category?.name || ""} ${(p.variants || []).map(v => v.sku).join(" ")}`.toLowerCase();

return !q || hay.includes(q.toLowerCase());

 }), [products, q]);

 if (!open) return null;

 const toggle = (id) => setDraft((old) => old.includes(id) ? old.filter((x) => x !== id) : [...old, id]);

 return <div className="cm-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>

<div className="cm-picker">

 <div className="cm-picker-head"><div><h2>{title}</h2><p>Search and select products from your catalog.</p></div><button className="cm-icon" onClick={onClose}><X size={19}/></button></div>

 <div className="cm-picker-search"><Search size={18}/><input autoFocus value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search products"/></div>

 <div className="cm-picker-list">

{loading ? <div className="cm-empty">Loading products…</div> : filtered.length ? filtered.map((p) => {

 const checked = draft.includes(Number(p.id));

 return <button type="button" key={p.id} className={`cm-product-row ${checked ? "selected" : ""}`} onClick={()=>toggle(Number(p.id))}>

<span className={`cm-check ${checked ? "on" : ""}`}>{checked && <Check size={14}/>}</span>

<span className="cm-product-thumb">{thumb(p) ? <img src={thumb(p)} alt=""/> : <ImageIcon size={18}/>}</span>

<span className="cm-product-copy"><strong>{p.name}</strong><small>{p.variants?.length || 0} variants · {price(p)}</small></span>

<span className={`cm-stock ${(p.variants || []).reduce((a,v)=>a+Number(v.stockQuantity||0),0) > 0 ? "in" : "out"}`}>{(p.variants || []).reduce((a,v)=>a+Number(v.stockQuantity||0),0)} in stock</span>

 </button>;

}) : <div className="cm-empty">No products found.</div>}

 </div>

 <div className="cm-picker-foot"><span>{draft.length} selected</span><div><button className="cm-btn secondary" onClick={onClose}>Cancel</button><button className="cm-btn primary" onClick={()=>onSave(draft)}>{singleActionLabel} {draft.length ? `(${draft.length})` : ""}</button></div></div>

</div>

 </div>;

}



function CollectionEditor({ open, value, products, productsLoading, onClose, onSaved }) {

 const editing = !!value?.id;

 const [form, setForm] = useState({name:"",slug:"",description:"",type:"MANUAL",startsAt:"",endsAt:"",isFeatured:false,isActive:true});

 const [selected, setSelected] = useState([]);

 const [picker, setPicker] = useState(false);

 const [saving, setSaving] = useState(false);

 const [error, setError] = useState("");

 useEffect(() => {

if (!open) return;

setForm({name:value?.name||"",slug:value?.slug||"",description:value?.description||"",type:value?.type||"MANUAL",startsAt:value?.startsAt ? String(value.startsAt).slice(0,16) : "",endsAt:value?.endsAt ? String(value.endsAt).slice(0,16) : "",isFeatured:!!value?.isFeatured,isActive:value?.isActive ?? true});

setSelected((value?.products || []).map((x)=>Number(x.productId ?? x.product?.id ?? x.id)).filter(Boolean)); setError("");

 }, [open, value]);

 const selectedProducts = selected.map((id)=>products.find((p)=>Number(p.id)===Number(id))).filter(Boolean);

 const save = async () => {

if (!form.name.trim()) return setError("Collection name is required.");

setSaving(true); setError("");

try {

 const payload = {...form, slug:slugify(form.slug || form.name), description:form.description || null, startsAt:form.startsAt || null, endsAt:form.endsAt || null};

 let id = value?.id;

 if (editing) await platformApi.patch(`/catalog-v2/admin/collections/${id}`, payload);

 else { const created = await platformApi.post("/catalog-v2/admin/collections", payload); id = apiData(created)?.data?.id ?? apiData(created)?.id; }

 if (payload.type === "MANUAL" && id) await platformApi.put(`/catalog-v2/admin/collections/${id}/products`, {productIds:selected});

 onSaved();

} catch(e) { setError(errorText(e)); } finally { setSaving(false); }

 };

 if (!open) return null;

 return <div className="cm-overlay"><div className="cm-editor">

<div className="cm-editor-head"><button className="cm-icon" onClick={onClose}><ChevronLeft size={20}/></button><div><h2>{editing ? "Edit collection" : "Create collection"}</h2><p>Organize products for your storefront.</p></div></div>

<div className="cm-editor-body">{error && <div className="cm-error">{error}</div>}

 <section className="cm-panel"><label>Title<input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value,slug:form.slug || slugify(e.target.value)})} placeholder="Summer collection"/></label><label>Description<textarea rows="4" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></label></section>

 <section className="cm-panel"><div className="cm-section-head"><div><h3>Products</h3><p>{form.type === "MANUAL" ? "Choose the products that belong to this collection." : "Automatic collections are populated by rules."}</p></div>{form.type === "MANUAL" && <button className="cm-btn secondary" onClick={()=>setPicker(true)}><Plus size={16}/>Browse</button>}</div>

{form.type === "MANUAL" && (selectedProducts.length ? <div className="cm-selected-list">{selectedProducts.map((p,i)=><div className="cm-selected" key={p.id}><span className="cm-drag">{i+1}</span><span className="cm-product-thumb">{thumb(p)?<img src={thumb(p)} alt=""/>:<ImageIcon size={18}/>}</span><span><strong>{p.name}</strong><small>{price(p)}</small></span><button className="cm-icon danger" onClick={()=>setSelected(selected.filter(id=>id!==Number(p.id)))}><X size={16}/></button></div>)}</div> : <button className="cm-add-products" onClick={()=>setPicker(true)}><Plus size={22}/><strong>Add products</strong><span>Search your catalog and add products to this collection</span></button>)}

 </section>

 <section className="cm-panel cm-grid2"><label>Collection type<select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}><option value="MANUAL">Manual</option><option value="AUTOMATIC">Automatic</option><option value="SEASONAL">Seasonal</option></select></label><label>URL handle<input value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})}/></label><label>Starts<input type="datetime-local" value={form.startsAt} onChange={(e)=>setForm({...form,startsAt:e.target.value})}/></label><label>Ends<input type="datetime-local" value={form.endsAt} onChange={(e)=>setForm({...form,endsAt:e.target.value})}/></label></section>

 <section className="cm-panel"><label className="cm-toggle-row"><span><strong>Featured collection</strong><small>Highlight this collection on storefront merchandising.</small></span><input type="checkbox" checked={form.isFeatured} onChange={(e)=>setForm({...form,isFeatured:e.target.checked})}/></label><label className="cm-toggle-row"><span><strong>Active</strong><small>Make this collection available to customers.</small></span><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm({...form,isActive:e.target.checked})}/></label></section>

</div>

<div className="cm-editor-foot"><button className="cm-btn secondary" onClick={onClose}>Cancel</button><button className="cm-btn primary" disabled={saving} onClick={save}>{saving?"Saving…":"Save collection"}</button></div>

<ProductPicker open={picker} title="Add products" selected={selected} products={products} loading={productsLoading} onClose={()=>setPicker(false)} onSave={(ids)=>{setSelected(ids);setPicker(false)}}/>

 </div></div>;

}



export default function CollectionsMerchandisingPage(){

 const [tab,setTab]=useState("collections"), [collections,setCollections]=useState([]), [featured,setFeatured]=useState([]), [products,setProducts]=useState([]), [loading,setLoading]=useState(true), [productsLoading,setProductsLoading]=useState(true), [error,setError]=useState("");

 const [editor,setEditor]=useState(null), [picker,setPicker]=useState(false), [q,setQ]=useState("");

 const loadProducts=useCallback(async()=>{setProductsLoading(true);try{const r=await productService.list({limit:500});setProducts(unwrap(r));}catch(e){setError(errorText(e))}finally{setProductsLoading(false)}},[]);

 const load=useCallback(async()=>{setLoading(true);setError("");try{const [c,f]=await Promise.all([platformApi.get("/catalog-v2/collections"),platformApi.get("/catalog-v2/featured-products",{limit:50})]);setCollections(unwrap(c));setFeatured(unwrap(f));}catch(e){setError(errorText(e))}finally{setLoading(false)}},[]);

 useEffect(()=>{load();loadProducts()},[load,loadProducts]);

 const editCollection=async(c)=>{try{const detail=await platformApi.get(`/catalog-v2/collections/${c.slug}`);setEditor(apiData(detail)?.data ?? apiData(detail) ?? c);}catch{setEditor(c)}};

 const removeCollection=async(c)=>{if(!window.confirm(`Disable ${c.name}?`))return;try{await platformApi.delete(`/catalog-v2/admin/collections/${c.id}`);await load()}catch(e){setError(errorText(e))}};

 const saveFeatured=async(ids)=>{try{const current=new Set(featured.map(p=>Number(p.id))), next=new Set(ids.map(Number));const jobs=[];products.forEach(p=>{const id=Number(p.id);if(current.has(id)!==next.has(id))jobs.push(platformApi.patch(`/catalog-v2/admin/products/${id}/featured`,{isFeatured:next.has(id)}));});await Promise.all(jobs);setPicker(false);await load()}catch(e){setError(errorText(e))}};

 const removeFeatured=async(p)=>{try{await platformApi.patch(`/catalog-v2/admin/products/${p.id}/featured`,{isFeatured:false});await load()}catch(e){setError(errorText(e))}};

 const source=tab==="collections"?collections:featured;

 const filtered=source.filter(x=>!q||`${x.name||""} ${x.slug||""}`.toLowerCase().includes(q.toLowerCase()));

 return <div className="cm-page">

<header className="cm-title"><div><p>PRODUCTS</p><h1>Collections & merchandising</h1><span>Create collections and choose exactly which products are featured.</span></div><button className="cm-btn primary" onClick={()=>tab==="collections"?setEditor({}):setPicker(true)}><Plus size={16}/>{tab==="collections"?"Create collection":"Add featured products"}</button></header>

<div className="cm-tabs"><button className={tab==="collections"?"active":""} onClick={()=>setTab("collections")}>Collections <span>{collections.length}</span></button><button className={tab==="featured"?"active":""} onClick={()=>setTab("featured")}>Featured products <span>{featured.length}</span></button></div>

{error&&<div className="cm-error">{error}</div>}

<div className="cm-card"><div className="cm-toolbar"><div className="cm-search"><Search size={17}/><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={`Search ${tab === "collections" ? "collections" : "featured products"}`}/></div></div>

 {loading?<div className="cm-empty">Loading…</div>:filtered.length===0?<div className="cm-empty big"><Sparkles size={28}/><strong>{tab==="collections"?"Create your first collection":"No featured products yet"}</strong><span>{tab==="collections"?"Group products so customers can browse them together.":"Choose products to highlight across your storefront."}</span><button className="cm-btn primary" onClick={()=>tab==="collections"?setEditor({}):setPicker(true)}><Plus size={16}/>{tab==="collections"?"Create collection":"Add products"}</button></div>:tab==="collections"?<div className="cm-table-wrap"><table><thead><tr><th>Collection</th><th>Type</th><th>Products</th><th>Featured</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><div className="cm-name"><span className="cm-collection-icon"><ImageIcon size={18}/></span><div><strong>{c.name}</strong><small>/collections/{c.slug}</small></div></div></td><td><span className="cm-pill">{c.type}</span></td><td>{c.products?.length ?? c._count?.products ?? "—"}</td><td>{c.isFeatured?"Yes":"No"}</td><td><span className={`cm-status ${c.isActive?"active":"draft"}`}>{c.isActive?"Active":"Draft"}</span></td><td><div className="cm-row-actions"><button className="cm-icon" onClick={()=>editCollection(c)}><Pencil size={16}/></button><button className="cm-icon danger" onClick={()=>removeCollection(c)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>:<div className="cm-featured-grid">{filtered.map((p,i)=><article key={p.id} className="cm-featured-card"><div className="cm-featured-image">{thumb(p)?<img src={thumb(p)} alt=""/>:<ImageIcon size={24}/>}<span>#{i+1}</span></div><div className="cm-featured-copy"><strong>{p.name}</strong><small>{price(p)} · {p.variants?.length||0} variants</small></div><button className="cm-btn dangerText" onClick={()=>removeFeatured(p)}>Remove</button></article>)}</div>}

</div>

<CollectionEditor open={editor!==null} value={editor||{}} products={products} productsLoading={productsLoading} onClose={()=>setEditor(null)} onSaved={async()=>{setEditor(null);await load()}}/>

<ProductPicker open={picker} title="Featured products" selected={featured.map(p=>Number(p.id))} products={products} loading={productsLoading} onClose={()=>setPicker(false)} onSave={saveFeatured} singleActionLabel="Save featured"/>

 </div>;

}
