import {useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../services/api';
import ShippingLabel from './ShippingLabel';

export default function OrderDocuments({order}) {
  const [busy,setBusy]=useState(''),[error,setError]=useState('');
  async function invoice(download) {
    const popup=download?null:window.open('about:blank','_blank');
    if(popup)popup.opener=null;
    setBusy('invoice');setError('');
    try {
      if(!download&&!popup)throw new Error('Allow popups to open the printable invoice, or use Download invoice.');
      const response=await api.get(`/invoice/order/${order.id}`,{responseType:'blob'});
      if(!String(response.headers?.['content-type']||response.data?.type||'').includes('application/pdf'))throw new Error('The API did not return an invoice PDF.');
      const url=URL.createObjectURL(response.data);
      if(download){const a=document.createElement('a');a.href=url;a.download=`invoice-${order.id}.pdf`;a.click();}else popup.location.replace(url);
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){popup?.close();setError(e.message||'Unable to generate invoice.');}finally{setBusy('');}
  }
  const shipments=(order.shipments||[]).filter(s=>s.status!=='Cancelled');
  return <section className="bg-white border rounded-xl p-4 mb-4" aria-label="Order documents">
    <h2 className="font-semibold mb-3">Invoice and shipping labels</h2>
    <div className="flex flex-wrap gap-3">
      <button className="px-3 py-2 border rounded-lg" disabled={!!busy} onClick={()=>invoice(false)}>Print invoice</button>
      <button className="px-3 py-2 border rounded-lg" disabled={!!busy} onClick={()=>invoice(true)}>Download invoice PDF</button>
      <Link className="px-3 py-2 border rounded-lg" to={`/manage/shipping?orderId=${order.id}`}>Create / manage shipment</Link>
    </div>
    <p className="text-sm text-gray-500 mt-2">Print invoice opens the PDF viewer; use its print control. Carrier labels require a booked shipment and AWB.</p>
    {!shipments.length&&<p className="mt-2">No booked shipment. Create a shipment in Shipping before generating its carrier label.</p>}
    {shipments.map(s=><div key={s.id} className="flex flex-wrap gap-3 items-center mt-3"><span>{s.provider==='Shadowfax360'?'Shadowfax 360':s.provider} · shipment #{s.id} · AWB {s.awb||'not assigned'}</span><ShippingLabel shipment={s}/></div>)}
    {error&&<p role="alert" className="mt-3 text-red-700">{error}</p>}
  </section>;
}
