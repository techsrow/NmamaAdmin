import React from 'react';
import {it,expect,vi,afterEach,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import ShippingPage from '../src/pages/shipping/ShippingPage';
import api from '../src/services/shippingAdminService';
const shipment={id:8,orderId:2,provider:'Delhivery',awb:'123456789012',status:'AwbAssigned',providerMeta:{bookingMode:'API'}};
vi.mock('../src/services/shippingAdminService',()=>({default:{dashboard:vi.fn(async()=>({})),fulfillmentOrders:vi.fn(async()=>[{id:2,items:[{id:10,quantity:1,remainingQuantity:1}]}]),shipments:vi.fn(async()=>[]),fulfillmentOrder:vi.fn(async()=>({id:2,totalAmount:1000,items:[{id:10,quantity:1,remainingQuantity:1}]})),pickupLocations:vi.fn(async()=>[{id:1,name:'Mumbai',pincode:'400102',isActive:true}]),providers:vi.fn(async()=>[{provider:'Delhivery',isEnabled:true},{provider:'BlueDart',isEnabled:false}]),createFulfillment:vi.fn(),shipment:vi.fn(),label:vi.fn(),labelPdf:vi.fn(),track:vi.fn()}}));
beforeEach(()=>{URL.createObjectURL=vi.fn(()=>"blob:test-label");URL.revokeObjectURL=vi.fn();const b=new Blob(["%PDF-1.4\n%%EOF"]);b.slice=()=>({text:async()=>"%PDF-"});api.labelPdf.mockResolvedValue(b);api.createFulfillment.mockResolvedValue(shipment);api.shipment.mockResolvedValue({shipment,items:[],tracking:[]});api.label.mockResolvedValue({...shipment,labelUrl:'https://carrier.example/label.pdf'});api.track.mockResolvedValue({shipment});});
afterEach(()=>{cleanup();vi.clearAllMocks()});
async function select(){render(<ShippingPage/>);fireEvent.click(await screen.findByRole('button',{name:'Fulfil'},{timeout:3000}));const option=await screen.findByRole('option',{name:'Delhivery — API booking'});fireEvent.change(option.closest('select'),{target:{value:'Delhivery'}});expect(screen.queryByPlaceholderText('AWB issued by this courier')).toBeNull();}
it('creates Delhivery without manual AWB, opens saved shipment, generates label and syncs tracking',async()=>{
 await select();fireEvent.click(screen.getByRole('button',{name:'Create shipment'}));
 await screen.findByText(/Shipment created successfully/);expect(screen.getByText('123456789012')).toBeTruthy();
 expect(api.createFulfillment).toHaveBeenCalledWith(2,expect.objectContaining({provider:'Delhivery',pickupLocationId:1}));expect(api.createFulfillment.mock.calls[0][1].awb).toBeUndefined();
 fireEvent.click(screen.getByRole('button',{name:'Generate label'}));const link=await screen.findByRole('link',{name:'Open / print shipping label'});expect(link.getAttribute('href')).toBe('blob:test-label');
 fireEvent.click(screen.getByRole('button',{name:'Sync tracking'}));await screen.findByText('Tracking updated from the shipping provider.');expect(api.track).toHaveBeenCalledWith(8);
});
it('shows carrier configuration failure and retains the selected provider without claiming success',async()=>{
 api.createFulfillment.mockRejectedValueOnce({response:{data:{message:'Delhivery warehouse mapping is missing for this pickup location.'}}});
 await select();fireEvent.click(screen.getByRole('button',{name:'Create shipment'}));await waitFor(()=>expect(screen.getAllByRole('alert')[0].textContent).toContain('Delhivery warehouse mapping is missing'));expect(screen.queryByText(/Shipment created successfully/)).toBeNull();expect(screen.getByRole('option',{name:'Delhivery — API booking'}).selected).toBe(true);
});
it('shows label rejection without requesting another shipment',async()=>{
 api.labelPdf.mockRejectedValueOnce({response:{data:{message:'Carrier label is not ready. Retry later.'}}});await select();fireEvent.click(screen.getByRole('button',{name:'Create shipment'}));fireEvent.click(await screen.findByRole('button',{name:'Generate label'}));await screen.findByText('Carrier label is not ready. Retry later.');expect(api.createFulfillment).toHaveBeenCalledTimes(1);
});
