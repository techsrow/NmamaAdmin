export const needsCarrierAwb=provider=>!!provider&&! ["Shiprocket","Shadowfax360","Delhivery","Local","Custom","Manual"].includes(provider);
export function buildShipmentPayload({provider,order,items,pkg,rate,documents={}}){
 if(!provider)throw new Error('Select a shipping provider.');
 if(!items.length)throw new Error('Select at least one item.');
 const result={provider,pickupLocationId:Number(pkg.pickupLocationId)||undefined,weightKg:Number(pkg.weightKg),lengthCm:Number(pkg.lengthCm),widthCm:Number(pkg.widthCm),heightCm:Number(pkg.heightCm),courierCode:rate?.courierCode,courierName:rate?.courierName};
 if(!Number.isFinite(result.weightKg)||result.weightKg<=0)throw new Error('Enter a valid package weight.');
 if(provider==='Shadowfax360'){
  const all=order.items||[];
  if(all.some(i=>i.allocatedQuantity>0)||items.length!==all.length||all.some(i=>!items.some(x=>x.orderItemId===i.id&&x.quantity===i.quantity)))throw new Error('Shadowfax requires the complete unfulfilled order.');
  if(documents.pickupDate?.trim()||documents.pickupSlot?.trim())throw new Error('Pickup date and slot scheduling is not supported by the documented carrier contract.');
  for(const k of ['ewayBill','sellerGstin'])if(documents[k]?.trim())result[k]=documents[k].trim();
  if(result.ewayBill&&!/^\d{12}$/.test(result.ewayBill))throw new Error('E-way bill must contain exactly 12 digits, or be left blank when optional.');
  if(result.sellerGstin&&!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(result.sellerGstin))throw new Error('Enter a valid seller GSTIN, or leave it blank when optional.');
  if(Number(order.totalAmount)-Number(order.shippingFee||0)>=50000&&(!/^\d{12}$/.test(result.ewayBill||'')||!result.sellerGstin))throw new Error('Enter the e-way bill and seller GSTIN for this high-value shipment.');
 }else result.items=items;
 if(provider==='Delhivery'){for(const k of ['ewayBill','sellerGstin'])if(documents[k]?.trim())result[k]=documents[k].trim();}
 if(needsCarrierAwb(provider)){
  result.awb=(documents.awb||'').trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9._/-]{2,99}$/.test(result.awb))throw new Error('Enter the actual carrier AWB after booking in its portal.');
  if(documents.trackingUrl?.trim()){const url=new URL(documents.trackingUrl.trim());if(url.protocol!=='https:'||url.username||url.password)throw new Error('Tracking URL must use HTTPS without credentials.');result.trackingUrl=url.href;}
 }
 return result;
}
export function reconciliationPayload(row,allocations,reason){
 const values=allocations.map(x=>({warehouseId:Number(x.warehouseId),quantity:Number(x.quantity)}));
 if(!values.length||values.some(x=>!Number.isInteger(x.warehouseId)||x.warehouseId<=0||!Number.isInteger(x.quantity)||x.quantity<0))throw new Error('Choose warehouses and whole nonnegative quantities.');
 if(new Set(values.map(x=>x.warehouseId)).size!==values.length)throw new Error('Each warehouse can appear only once.');
 if(values.reduce((s,x)=>s+x.quantity,0)!==Number(row.stockQuantity))throw new Error('Allocations must equal current available stock.');
 if(reason.trim().length<5)throw new Error('Enter a reason of at least five characters.');
 return {expectedStock:Number(row.stockQuantity),allocations:values,reason:reason.trim()};
}
export function receiptAttempt(storage,user,orderId,payload,uuid){
 const slot=`namama-receive:${user}:${orderId}`;const fingerprint=JSON.stringify(payload);
 const old=storage.getItem(slot);const saved=old?JSON.parse(old):null;
 if(saved&&saved.fingerprint!==fingerprint)throw new Error('An earlier receipt has an uncertain result. Retry its original quantities before changing this receipt.');
 const value=saved||{fingerprint,key:uuid()};storage.setItem(slot,JSON.stringify(value));return {key:value.key,finish:()=>storage.removeItem(slot)};
}
