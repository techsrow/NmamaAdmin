export default function ShadowfaxBookingFields({documents,setDocuments,highValue}) {
  const set=(key,value)=>setDocuments(current=>({...current,[key]:value}));
  return <>
    <p className="ship-muted">Ships the complete unfulfilled order. Pickup-slot scheduling is not documented; arrange pickup changes through Shadowfax.</p>
    <div className="ship-grid-2">
      <label className="ship-field"><b>E-way bill (12 digits) <span className="ship-field-hint">{highValue?'Required for this booking':'Optional'}</span></b><input value={documents.ewayBill} onChange={e=>set('ewayBill',e.target.value)} inputMode="numeric" maxLength={12} placeholder="Enter e-way bill number" required={highValue}/><small>{highValue?'The API requires this for this high-value shipment.':'Leave blank when not applicable to this shipment.'}</small></label>
      <label className="ship-field"><b>Seller GSTIN <span className="ship-field-hint">{highValue?'Required for this booking':'Optional'}</span></b><input value={documents.sellerGstin} onChange={e=>set('sellerGstin',e.target.value.toUpperCase())} maxLength={15} placeholder="Enter seller GSTIN" required={highValue}/><small>Use the actual seller registration when applicable.</small></label>
    </div>
  </>;
}
