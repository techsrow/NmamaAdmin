import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import OrderDocuments from '../src/components/OrderDocuments';
import api from '../src/services/api';
import shipping from '../src/services/shippingAdminService';
import {enabledOrderProviders,carrierLabelUrl} from '../src/services/orderDocuments';
vi.mock('../src/services/api',()=>({default:{get:vi.fn()}}));
vi.mock('../src/services/shippingAdminService',()=>({default:{labelPdf:vi.fn()}}));
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.clearAllMocks()});
it('lists enabled Shadowfax and retains a saved historical provider',()=>{
 expect(enabledOrderProviders([{provider:'Shadowfax360',isEnabled:true},{provider:'Delhivery',isEnabled:false}],'Manual').map(x=>x.value)).toEqual(['Shadowfax360','Manual']);
});
it('blocks unsafe carrier label URLs',()=>{for(const value of ['javascript:alert(1)','http://labels.example/x','https://user:pass@labels.example/x',undefined])expect(()=>carrierLabelUrl(value)).toThrow();expect(carrierLabelUrl('https://labels.example/a.pdf')).toBe('https://labels.example/a.pdf')});
it('explains missing shipment instead of inventing a label',()=>{render(<MemoryRouter><OrderDocuments order={{id:2}}/></MemoryRouter>);expect(screen.getByText(/No booked shipment/)).toBeTruthy();expect(screen.queryByText(/Generate \/ print label/)).toBeNull()});
it('previews the authenticated carrier PDF for the selected shipment',async()=>{
 Object.defineProperty(URL,'createObjectURL',{configurable:true,writable:true,value:vi.fn(()=> 'blob:carrier-pdf')});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,writable:true,value:vi.fn()});const b=new Blob(['%PDF-1.4']);b.slice=()=>({text:async()=>'%PDF-'});shipping.labelPdf.mockResolvedValue(b);
 render(<MemoryRouter><OrderDocuments order={{id:2,shipments:[{id:77,provider:'Shadowfax360',status:'AwbAssigned',awb:'SFX123'}]}}/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Generate label'}));const link=await screen.findByRole('link',{name:'Download label PDF'});expect(link.getAttribute('href')).toBe('blob:carrier-pdf');expect(shipping.labelPdf).toHaveBeenCalledWith(77);
});
it('does not open a fabricated label when booking has no AWB',()=>{render(<MemoryRouter><OrderDocuments order={{id:2,shipments:[{id:77,provider:'Shadowfax360',status:'Draft'}]}}/></MemoryRouter>);expect(screen.getByRole('button',{name:'Generate label'}).disabled).toBe(true)});
it('fetches the authenticated invoice as a PDF blob',async()=>{
 const popup={opener:{},location:{replace:vi.fn()},close:vi.fn()};vi.spyOn(window,'open').mockReturnValue(popup);const create=vi.fn(()=> 'blob:invoice');Object.defineProperty(URL,'createObjectURL',{configurable:true,value:create});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});const blob=new Blob(['pdf'],{type:'application/pdf'});api.get.mockResolvedValue({data:blob,headers:{'content-type':'application/pdf'}});
 render(<MemoryRouter><OrderDocuments order={{id:2}}/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Print invoice'}));await waitFor(()=>expect(popup.location.replace).toHaveBeenCalledWith('blob:invoice'));expect(api.get).toHaveBeenCalledWith('/invoice/order/2',{responseType:'blob'});
});
