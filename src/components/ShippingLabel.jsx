import {useEffect,useRef,useState} from 'react';
import {carrierLabelUrl} from '../services/orderDocuments';
import shipping from '../services/shippingAdminService';

export async function pdfError(error){
  const data=error?.response?.data;
  if(data instanceof Blob){try{const body=JSON.parse(await data.text());if(typeof body.message==='string')return body.message}catch{}}
  return (typeof data?.message==='string'&&data.message)||error?.message||'Unable to load the shipping label PDF.';
}
export default function ShippingLabel({shipment}){
  const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[fallback,setFallback]=useState('');
  const current=useRef(''),generation=useRef(0);
  useEffect(()=>{setUrl('');setFallback('');setError('');setBusy(false);return()=>{generation.current++;if(current.current)URL.revokeObjectURL(current.current);current.current=''}},[shipment.id,shipment.status]);
  const local=['Local','Custom','Manual'].includes(shipment.provider);
  const supported=local||['Shadowfax360','Delhivery','Shiprocket'].includes(shipment.provider);
  const manual=shipment.providerMeta?.bookingMode==='MANUAL'&&!local;
  async function generate(){
    const run=++generation.current;setBusy(true);setError('');setFallback('');
    if(current.current)URL.revokeObjectURL(current.current);current.current='';setUrl('');
    try{
      const blob=await(local?shipping.localLabel(shipment.id):shipping.labelPdf(shipment.id));
      if(!(blob instanceof Blob)||(await blob.slice(0,5).text())!=='%PDF-')throw Error('The API did not return a PDF. Retry this shipment label; do not create another shipment.');
      if(run!==generation.current)return;
      current.current=URL.createObjectURL(new Blob([blob],{type:'application/pdf'}));setUrl(current.current);
    }catch(e){const message=await pdfError(e);let link='';try{const raw=e?.response?.data;const body=raw instanceof Blob?JSON.parse(await raw.text()):raw;link=carrierLabelUrl(body?.labelUrl)}catch{}if(run===generation.current){setError(message);setFallback(link)}}finally{if(run===generation.current)setBusy(false)}
  }
  if(!supported||manual)return <p>Download this manually booked courier's label from its portal. No additional shipment is needed.</p>;
  return <section aria-label={`Shipping label ${shipment.id}`} style={{marginTop:12,width:'100%'}}>
    <button type="button" className="ship-btn px-3 py-2 border rounded-lg" disabled={busy||shipment.status==='Cancelled'||!shipment.awb} onClick={generate}>{busy?'Loading PDF…':'Generate label'}</button>
    {error&&<p role="alert" className="text-red-700 ship-error">{error}</p>}
    {fallback&&shipment.status!=='Cancelled'&&<p>The carrier generated the label. <a className="ship-download" href={fallback} target="_blank" rel="noopener noreferrer">Open carrier label / print PDF</a> Use the PDF viewer to print or download. No new shipment is needed.</p>}
    {url&&shipment.status!=='Cancelled'&&<><p role="status">Label PDF ready for shipment #{shipment.id}. Use the PDF viewer’s Print control at actual size.</p>
      <div style={{display:'flex',gap:16,margin:'12px 0',flexWrap:'wrap'}}>
        <a className="ship-download" href={url} target="_blank" rel="noopener noreferrer">Open / print shipping label</a>
        <a className="ship-download" href={url} download={`shipping-label-${shipment.id}.pdf`}>Download label PDF</a>
      </div>
      <iframe title={`Shipping label PDF preview ${shipment.id}`} src={url} style={{width:'100%',height:480,border:'1px solid #d1d5db',borderRadius:8}}/>
      <p className="text-sm">If your browser cannot display PDFs here, use Open / print or Download label PDF.</p>
    </>}
  </section>;
}
