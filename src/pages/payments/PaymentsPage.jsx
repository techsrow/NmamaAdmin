import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Eye, Landmark, Loader2, RefreshCw, RotateCcw, Search, Settings2, ShieldCheck, X } from "lucide-react";
import paymentApi from "../../services/paymentAdminService";
import "./payments.css";

const PROVIDER_META = {
  Razorpay:{name:"Razorpay",kind:"Online",fields:[["keyId","Key ID"],["keySecret","Key Secret","password"],["webhookSecret","Webhook Secret","password"]]},
  Stripe:{name:"Stripe",kind:"Online",fields:[["publishableKey","Publishable key"],["secretKey","Secret key","password"],["webhookSecret","Webhook Secret","password"]]},
  PhonePe:{name:"PhonePe",kind:"Online",fields:[["merchantId","Merchant ID"],["saltKey","Salt key","password"],["saltIndex","Salt index"]]},
  Cashfree:{name:"Cashfree",kind:"Online",fields:[["appId","App ID"],["secretKey","Secret key","password"]]},
  PayU:{name:"PayU",kind:"Online",fields:[["merchantKey","Merchant key"],["merchantSalt","Merchant salt","password"]]},
  CCAvenue:{name:"CCAvenue",kind:"Online",fields:[["merchantId","Merchant ID"],["accessCode","Access code","password"],["workingKey","Working key","password"]]},
  PayPal:{name:"PayPal",kind:"Online",fields:[["clientId","Client ID"],["clientSecret","Client secret","password"]]},
  Square:{name:"Square",kind:"Online",fields:[["applicationId","Application ID"],["accessToken","Access token","password"],["locationId","Location ID"]]},
  COD:{name:"Cash on Delivery",kind:"Offline",fields:[]},
  BankTransfer:{name:"Bank Transfer",kind:"Offline",fields:[["accountName","Account name"],["bankName","Bank name"],["accountNumber","Account number"],["ifsc","IFSC"],["instructions","Instructions","textarea"]]},
  Manual:{name:"Manual Payment",kind:"Offline",fields:[]},
};
const PROVIDERS=Object.keys(PROVIDER_META);
const arr=x=>{const v=x?.items??x?.rows??x?.data??x;return Array.isArray(v)?v:[]};
const money=(v,c="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency:c||"INR",maximumFractionDigits:2}).format(Number(v||0));
const date=v=>v?new Date(v).toLocaleString("en-IN"):"—";
const err=e=>e?.response?.data?.message||e?.response?.data?.error||e?.message||"Request failed";
const statusClass=s=>String(s||"").toLowerCase().replaceAll("_","-").replaceAll(" ","-");
const orderNo=p=>p?.order?.orderNumber||p?.order?.orderNo||p?.orderNumber||`#${p?.orderId??"—"}`;
const customer=p=>p?.order?.customerName||p?.customerName||p?.order?.user?.email||p?.order?.customerEmail||"—";
const providerName=p=>PROVIDER_META[p]?.name||p||"—";

function Badge({value}){return <span className={`pay-badge ${statusClass(value)}`}>{String(value||"—").replaceAll("_"," ")}</span>}
function Empty({title,text}){return <div className="pay-empty"><CreditCard size={34}/><h3>{title}</h3><p>{text}</p></div>}
function ErrorBox({children}){return children?<div className="pay-error"><AlertCircle size={17}/>{children}</div>:null}
function Drawer({title,sub,onClose,children}){return <div className="pay-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><aside className="pay-drawer"><header><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div><button className="pay-icon" onClick={onClose}><X size={19}/></button></header><main>{children}</main></aside></div>}

export default function PaymentsPage(){
  const[tab,setTab]=useState("transactions"),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const[transactions,setTransactions]=useState([]),[refunds,setRefunds]=useState([]),[providers,setProviders]=useState([]),[catalog,setCatalog]=useState([]);
  const[q,setQ]=useState(""),[status,setStatus]=useState(""),[provider,setProvider]=useState(""),[modal,setModal]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      if(tab==="transactions") setTransactions(arr(await paymentApi.transactions({q:q||undefined,status:status||undefined,provider:provider||undefined,limit:100})));
      else if(tab==="refunds") setRefunds(arr(await paymentApi.refunds({q:q||undefined,status:status||undefined,provider:provider||undefined,limit:100})));
      else{
        const[c,p]=await Promise.all([paymentApi.providerCatalog(),paymentApi.providers()]);
        setCatalog(arr(c));setProviders(arr(p));
      }
    }catch(e){setError(err(e))}finally{setLoading(false)}
  },[tab,q,status,provider]);

  useEffect(()=>{const t=setTimeout(load,180);return()=>clearTimeout(t)},[load]);
  const configured=useMemo(()=>new Map(providers.map(x=>[x.provider,x])),[providers]);
  const cards=useMemo(()=>{
    const apiCodes=catalog.map(x=>x.provider||x.code||x.id).filter(Boolean);
    return [...new Set([...apiCodes,...PROVIDERS])].map(code=>({code,meta:PROVIDER_META[code]||{name:code,kind:"Online",fields:[]},config:configured.get(code)||null}));
  },[catalog,configured]);

  return <div className="pay-page">
    <div className="pay-heading"><div><p>COMMERCE</p><h1>Payments</h1><span>Manage transactions, refunds and payment providers from one place.</span></div><button className="pay-btn" onClick={load} disabled={loading}>{loading?<Loader2 className="spin" size={17}/>:<RefreshCw size={17}/>} Refresh</button></div>
    <div className="pay-tabs">{[["transactions","Transactions"],["refunds","Refunds"],["providers","Payment Providers"]].map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>{setTab(k);setQ("");setStatus("");setProvider("")}}>{l}</button>)}</div>
    <ErrorBox>{error}</ErrorBox>

    {tab!=="providers"&&<div className="pay-card"><div className="pay-toolbar"><div className="pay-search"><Search size={16}/><input placeholder="Search payments, orders or customers" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="pay-filters"><select value={provider} onChange={e=>setProvider(e.target.value)}><option value="">All providers</option>{PROVIDERS.map(x=><option key={x} value={x}>{providerName(x)}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{(tab==="transactions"?["Pending","Created","Paid","Failed","PartiallyRefunded","Refunded"]:["PENDING","PROCESSING","SUCCESS","FAILED"]).map(x=><option key={x}>{x}</option>)}</select></div></div>
      {loading?<div className="pay-loading"><Loader2 className="spin"/> Loading…</div>:tab==="transactions"?<Transactions rows={transactions} open={setModal}/>:<Refunds rows={refunds}/>}</div>}
    {tab==="providers"&&(loading?<div className="pay-loading"><Loader2 className="spin"/> Loading providers…</div>:<Providers cards={cards} open={setModal} reload={load}/>)}

    {modal?.type==="payment"&&<PaymentDrawer row={modal.row} close={()=>setModal(null)} refund={row=>setModal({type:"refund",row})}/>}
    {modal?.type==="refund"&&<RefundDrawer row={modal.row} close={()=>setModal(null)} done={()=>{setModal(null);load()}}/>}
    {modal?.type==="provider"&&<ProviderDrawer code={modal.code} existing={configured.get(modal.code)} close={()=>setModal(null)} done={()=>{setModal(null);load()}}/>}
  </div>
}

function Transactions({rows,open}){
  if(!rows.length)return <Empty title="No transactions found" text="Payments created by checkout will appear here."/>;
  return <div className="pay-table"><table><thead><tr><th>Payment</th><th>Order</th><th>Customer</th><th>Provider</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td><strong>#{p.id}</strong><small>{p.providerPaymentId||p.razorpayPaymentId||"No gateway ID"}</small></td><td>{orderNo(p)}</td><td>{customer(p)}</td><td>{providerName(p.provider)}</td><td>{p.paymentMethod||"—"}</td><td><strong>{money(p.amount,p.currency)}</strong></td><td><Badge value={p.paymentStatus||p.status}/></td><td>{date(p.createdAt)}</td><td><button className="pay-icon" onClick={()=>open({type:"payment",row:p})}><Eye size={17}/></button></td></tr>)}</tbody></table></div>
}
function Refunds({rows}){
  if(!rows.length)return <Empty title="No refunds yet" text="Full and partial refunds will appear here."/>;
  return <div className="pay-table"><table><thead><tr><th>Refund</th><th>Payment</th><th>Order</th><th>Provider</th><th>Amount</th><th>Status</th><th>Reason</th><th>Date</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><strong>#{r.id}</strong><small>{r.providerRefundId||"—"}</small></td><td>#{r.paymentId||"—"}</td><td>#{r.orderId||"—"}</td><td>{providerName(r.provider)}</td><td><strong>{money(r.amount,r.currency||"INR")}</strong></td><td><Badge value={r.status}/></td><td className="pay-wrap">{r.reason||"—"}</td><td>{date(r.createdAt)}</td></tr>)}</tbody></table></div>
}
function Providers({cards,open,reload}){
  const toggle=async c=>{try{await paymentApi.setProviderStatus(c.code,!c.config?.isEnabled);reload()}catch(e){alert(err(e))}};
  return <div className="pay-provider-grid">{cards.map(c=><div className="pay-provider" key={c.code}><div className="pay-provider-top"><div className="pay-logo">{c.meta.kind==="Offline"?<Landmark size={22}/>:<CreditCard size={22}/>}</div><div><h3>{c.meta.name}</h3><p>{c.meta.kind} payment provider</p></div><Badge value={c.config?.isEnabled?"Active":c.config?"Disabled":"Not setup"}/></div><div className="pay-provider-info"><span>Mode <b>{c.config?.mode||"—"}</b></span><span>Configuration <b>{c.config?"Saved":"Required"}</b></span>{c.config?.lastTestedAt&&<span>Last test <b>{c.config.lastTestOk?"Passed":"Failed"}</b></span>}</div><div className="pay-provider-actions">{c.config&&<button className="pay-btn" onClick={()=>toggle(c)}>{c.config.isEnabled?"Disable":"Enable"}</button>}<button className="pay-btn primary" onClick={()=>open({type:"provider",code:c.code})}><Settings2 size={16}/>{c.config?"Manage":"Set up"}</button></div></div>)}</div>
}
function PaymentDrawer({row,close,refund}){
  const canRefund=["Paid","PartiallyRefunded","PAID","PARTIALLY_REFUNDED"].includes(row.paymentStatus||row.status);
  return <Drawer title={`Payment #${row.id}`} sub={orderNo(row)} onClose={close}><div className="pay-detail-status"><Badge value={row.paymentStatus||row.status}/><strong>{money(row.amount,row.currency)}</strong></div><dl className="pay-details"><div><dt>Provider</dt><dd>{providerName(row.provider)}</dd></div><div><dt>Method</dt><dd>{row.paymentMethod||"—"}</dd></div><div><dt>Order</dt><dd>{orderNo(row)}</dd></div><div><dt>Customer</dt><dd>{customer(row)}</dd></div><div><dt>Provider order ID</dt><dd>{row.providerOrderId||row.razorpayOrderId||"—"}</dd></div><div><dt>Provider payment ID</dt><dd>{row.providerPaymentId||row.razorpayPaymentId||"—"}</dd></div><div><dt>Captured</dt><dd>{row.isCaptured?"Yes":"No"}</dd></div><div><dt>Created</dt><dd>{date(row.createdAt)}</dd></div>{row.failureReason&&<div className="full"><dt>Failure reason</dt><dd>{row.failureReason}</dd></div>}</dl>{canRefund&&<div className="pay-drawer-actions"><button className="pay-btn danger" onClick={()=>refund(row)}><RotateCcw size={16}/> Create refund</button></div>}</Drawer>
}
function RefundDrawer({row,close,done}){
  const[amount,setAmount]=useState(row?.amount||""),[reason,setReason]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const submit=async e=>{e.preventDefault();const n=Number(amount);if(!n||n<=0)return setError("Enter a valid refund amount.");if(n>Number(row.amount))return setError("Refund cannot exceed the payment amount.");setBusy(true);setError("");try{await paymentApi.refund(row.id,{amount:n,reason:reason||undefined});done()}catch(e){setError(err(e));setBusy(false)}};
  return <Drawer title="Create refund" sub={`Payment #${row.id} · ${money(row.amount,row.currency)}`} onClose={close}><form className="pay-form" onSubmit={submit}><ErrorBox>{error}</ErrorBox><label><b>Refund amount</b><input type="number" min="0.01" step="0.01" max={Number(row.amount)} value={amount} onChange={e=>setAmount(e.target.value)} required/><small>Use a lower amount for a partial refund.</small></label><label><b>Reason</b><textarea rows="4" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for refund"/></label><div className="pay-form-actions"><button type="button" className="pay-btn" onClick={close}>Cancel</button><button className="pay-btn danger" disabled={busy}>{busy?<Loader2 className="spin" size={16}/>:<RotateCcw size={16}/>} Refund {money(amount||0,row.currency)}</button></div></form></Drawer>
}
function ProviderDrawer({code,existing,close,done}){
  const meta=PROVIDER_META[code]||{name:code,kind:"Online",fields:[]};
  const[mode,setMode]=useState(existing?.mode||"TEST"),[enabled,setEnabled]=useState(existing?.isEnabled??false),[credentials,setCredentials]=useState({}),[publicConfig,setPublicConfig]=useState(existing?.publicConfig||{}),[busy,setBusy]=useState(false),[testing,setTesting]=useState(false),[error,setError]=useState(""),[test,setTest]=useState(null);
  const change=(k,v)=>setCredentials(x=>({...x,[k]:v}));
  const save=async e=>{e.preventDefault();setBusy(true);setError("");try{const clean=Object.fromEntries(Object.entries(credentials).filter(([,v])=>String(v).trim()!==""));await paymentApi.saveProvider(code,{displayName:meta.name,isEnabled:enabled,mode,credentials:clean,publicConfig});done()}catch(e){setError(err(e));setBusy(false)}};
  const testConnection=async()=>{setTesting(true);setError("");setTest(null);try{const r=await paymentApi.testProvider(code);setTest({ok:r?.ok??r?.success??true,message:r?.message||"Connection test completed."})}catch(e){setTest({ok:false,message:err(e)})}finally{setTesting(false)}};
  return <Drawer title={meta.name} sub="Payment provider configuration" onClose={close}><form className="pay-form" onSubmit={save}><ErrorBox>{error}</ErrorBox><div className="pay-mode"><button type="button" className={mode==="TEST"?"active":""} onClick={()=>setMode("TEST")}>Test</button><button type="button" className={mode==="LIVE"?"active":""} onClick={()=>setMode("LIVE")}>Live</button></div><label className="pay-switch"><span><b>Enable {meta.name}</b><small>Make this provider available to the payment system.</small></span><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/></label>{meta.fields.map(([key,label,type="text"])=><label key={key}><b>{label}</b>{type==="textarea"?<textarea rows="4" value={credentials[key]||""} onChange={e=>change(key,e.target.value)}/>:<input type={type} value={credentials[key]||""} onChange={e=>change(key,e.target.value)} placeholder={existing?`Leave blank to keep saved ${label.toLowerCase()}`:""}/>} {type==="password"&&existing&&<small>Leave blank to keep the saved secret.</small>}</label>)}{code==="BankTransfer"&&<label><b>Customer instructions</b><textarea rows="4" value={publicConfig.instructions||""} onChange={e=>setPublicConfig({...publicConfig,instructions:e.target.value})}/></label>}{test&&<div className={`pay-test ${test.ok?"ok":"bad"}`}>{test.ok?<CheckCircle2 size={17}/>:<AlertCircle size={17}/>} {test.message}</div>}<div className="pay-form-actions"><button type="button" className="pay-btn" onClick={testConnection} disabled={testing}>{testing?<Loader2 className="spin" size={16}/>:<ShieldCheck size={16}/>} Test connection</button><button className="pay-btn primary" disabled={busy}>{busy?<Loader2 className="spin" size={16}/>:null} Save provider</button></div></form></Drawer>
}
