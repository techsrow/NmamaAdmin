import {useEffect,useState} from 'react';
import shipping from '../../services/shippingAdminService';

export default function ShadowfaxRecovery({orderId,done,pickupLocationId,pickupPincode}) {
 const [booking,setBooking]=useState(null),[busy,setBusy]=useState('load'),[error,setError]=useState('');
 async function load(){setError('');try{setBooking(await shipping.shadowfaxBooking(orderId));}catch(e){setError(e?.response?.data?.message||e.message||'Unable to load booking diagnostics. Update/restart the API and refresh.');}finally{setBusy('');}}
 useEffect(()=>{void load()},[orderId]);
 async function retry(correct=false){
  setBusy('retry');setError('');
  try{if(correct)await shipping.correctShadowfaxPickup(orderId,{expectedClientOrderId:booking.clientOrderId,pickupLocationId:Number(pickupLocationId),expectedErrorAt:booking.lastError.at});else await shipping.retrySavedShadowfax(orderId,booking.clientOrderId);done();}
  catch(e){const message=e?.response?.data?.message||e.message||'Unable to recover saved booking.';try{setBooking(await shipping.shadowfaxBooking(orderId))}catch{}setError(message);setBusy('');}
 }
 return <section className="ship-recovery" aria-label="Saved Shadowfax booking">
  <h3>Saved booking diagnostics</h3>
  {busy==='load'?<p>Loading booking status…</p>:booking?.hasIntent?<>
   <dl className="ship-booking-diagnostics"><div><dt>Client order ID</dt><dd>{booking.clientOrderId}</dd></div><div><dt>Saved pickup PIN</dt><dd>{booking.pickupPincode||"Unknown"}</dd></div><div><dt>Original mode</dt><dd>{booking.mode}</dd></div><div><dt>Booking state</dt><dd>{booking.state}</dd></div></dl>
   {booking.lastError?<p><strong>Last booking error:</strong> {booking.lastError.message}</p>:!booking.shipmentId&&<p className="ship-muted">The old attempt has no saved carrier error. Retry the saved request to retrieve its existing shipment or obtain the carrier’s response.</p>}
   {!booking.shipmentId&&<><p className="ship-muted">This recovery sends the original saved request with the same client order ID. Current form edits are not sent. Shadowfax uses that ID to avoid duplicate orders.</p><button className="ship-btn primary" type="button" disabled={!!busy} onClick={()=>retry()}>{busy==='retry'?'Recovering saved request…':'Retry saved booking'}</button></>}
   {!booking.shipmentId&&booking.lastError?.kind==='CARRIER_REJECTED'&&<div><p>Selected pickup PIN: <strong>{pickupPincode||'Select a pickup location above'}</strong>. Use the corrected address only after verifying that it is the actual pickup address. This action updates pickup and return details and retries using the same client order ID.</p><button type="button" className="ship-btn primary" disabled={!!busy||!pickupLocationId} onClick={()=>retry(true)}>Use selected pickup and retry</button></div>}
   {booking.awb&&<p>Saved AWB: {booking.awb}</p>}
  </>:booking?<p className="ship-muted">No saved booking attempt for this order.</p>:<p className="ship-muted">Booking status is unavailable. Check the error below and refresh.</p>}
  {error&&<p role="alert" className="ship-error">{error}</p>}
  <button className="ship-btn" type="button" disabled={!!busy} onClick={()=>{setBusy('load');void load()}}>Refresh booking status</button>
 </section>;
}
