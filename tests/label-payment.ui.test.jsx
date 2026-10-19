import React from 'react';
import {it,expect,vi,afterEach,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import ShippingLabel from '../src/components/ShippingLabel';
import {ShipmentOperations} from '../src/pages/shipping/ShippingOperations';
import PaymentsPage from '../src/pages/payments/PaymentsPage';
import shipping from '../src/services/shippingAdminService';
import payments from '../src/services/paymentAdminService';
vi.mock('../src/services/shippingAdminService',()=>({default:{labelPdf:vi.fn(),localLabel:vi.fn(),notifyShipment:vi.fn(async()=>({message:'Tracking email queued.'}))}}));
vi.mock('../src/services/paymentAdminService',()=>({default:{transactions:vi.fn(async()=>[]),providerCatalog:vi.fn(async()=>[{provider:'Stripe',checkoutImplemented:false},{provider:'Razorpay',checkoutImplemented:true}]),providers:vi.fn(async()=>[{provider:'Stripe',mode:'LIVE',isEnabled:false}]),saveProvider:vi.fn(async()=>({})),testProvider:vi.fn()}}));
function blob(text){const b=new Blob([text]);b.text=async()=>text;b.slice=()=>({text:async()=>text.slice(0,5)});return b;}
beforeEach(()=>{URL.createObjectURL=vi.fn(()=> 'blob:label-preview');URL.revokeObjectURL=vi.fn();shipping.labelPdf.mockResolvedValue(blob('%PDF-1.4\n%%EOF'));shipping.localLabel.mockResolvedValue(blob('%PDF-1.4\n%%EOF'))});
afterEach(()=>{cleanup();vi.clearAllMocks()});
for(const provider of ['Shadowfax360','Delhivery','Shiprocket','Local'])it(`previews and downloads ${provider} PDF without popups`,async()=>{
 render(<ShippingLabel shipment={{id:7,provider,awb:'SAMPLE7',status:'AwbAssigned'}}/>);fireEvent.click(screen.getByRole('button',{name:'Generate label'}));
 const link=await screen.findByRole('link',{name:'Download label PDF'});expect(link.getAttribute('download')).toBe('shipping-label-7.pdf');expect(link.getAttribute('href')).toBe('blob:label-preview');expect(screen.getByTitle('Shipping label PDF preview 7')).toBeTruthy();expect(provider==='Local'?shipping.localLabel:shipping.labelPdf).toHaveBeenCalledWith(7);
});
it('shows JSON error returned as blob, then retries without rebooking',async()=>{
 shipping.labelPdf.mockRejectedValueOnce({response:{data:blob('{"message":"Carrier label not ready. Retry later."}')}});
 render(<ShippingLabel shipment={{id:7,provider:'Shiprocket',awb:'SAMPLE7'}}/>);fireEvent.click(screen.getByRole('button',{name:'Generate label'}));await screen.findByText('Carrier label not ready. Retry later.');expect(screen.queryByRole('link')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Generate label'}));await screen.findByRole('link',{name:'Download label PDF'});
});
it('rejects HTML masquerading as a PDF',async()=>{
 shipping.labelPdf.mockResolvedValueOnce(blob('<html>Login</html>'));render(<ShippingLabel shipment={{id:7,provider:'Delhivery',awb:'SAMPLE7'}}/>);fireEvent.click(screen.getByRole('button',{name:'Generate label'}));await screen.findByText(/API did not return a PDF/);expect(URL.createObjectURL).not.toHaveBeenCalled();
});
it('restores eleven payment cards and saves Stripe settings without false activation',async()=>{
 render(<PaymentsPage/>);fireEvent.click(screen.getByRole('button',{name:'Payment Providers'}));const stripe=await screen.findByRole('heading',{name:'Stripe'});expect(document.querySelectorAll('.pay-provider').length).toBe(11);
 expect(stripe.closest('.pay-provider').textContent).toContain('Integration required');fireEvent.click(stripe.closest('.pay-provider').querySelector('.primary'));
 expect(screen.getByRole('checkbox',{name:/Enable Stripe/}).disabled).toBe(true);expect(screen.getByRole('button',{name:'Test connection'}).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Save provider'}));await waitFor(()=>expect(payments.saveProvider).toHaveBeenCalledWith('Stripe',expect.objectContaining({credentials:{},isEnabled:false,mode:'LIVE'})));
});
it('offers the returned carrier link when the API cannot download the PDF',async()=>{
 shipping.labelPdf.mockRejectedValueOnce({response:{data:blob('{"message":"PDF server DNS unavailable","labelUrl":"https://storage.googleapis.com/example/label.pdf"}')}});
 render(<ShippingLabel shipment={{id:7,provider:'Shadowfax360',awb:'SF7'}}/>);fireEvent.click(screen.getByRole('button',{name:'Generate label'}));
 const link=await screen.findByRole('link',{name:'Open carrier label / print PDF'});expect(link.getAttribute('href')).toBe('https://storage.googleapis.com/example/label.pdf');expect(screen.queryByTitle('Shipping label PDF preview 7')).toBeNull();
});

it('queues a customer tracking email for an existing shipment and shows its outcome',async()=>{
 render(<ShipmentOperations shipment={{id:1,provider:'Shadowfax360',awb:'SF123'}} items={[]} reload={vi.fn(async()=>{})}/>);
 fireEvent.click(screen.getByRole('button',{name:'Send tracking email'}));await screen.findByText('Tracking email queued.');expect(shipping.notifyShipment).toHaveBeenCalledWith(1);
});
