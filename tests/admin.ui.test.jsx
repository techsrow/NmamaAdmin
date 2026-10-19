import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import InventoryTools from '../src/pages/inventory/InventoryTools';
import ShippingPage from '../src/pages/shipping/ShippingPage';
import api from '../src/services/api';
import shipping from '../src/services/shippingAdminService';
vi.mock('../src/services/api',()=>({default:{get:vi.fn(),post:vi.fn()}}));
vi.mock('../src/services/shippingAdminService',()=>({default:{dashboard:vi.fn(async()=>({})),fulfillmentOrders:vi.fn(async()=>[]),shipments:vi.fn(async()=>[]),pickupLocations:vi.fn(async()=>[{id:1,name:'Mumbai',pincode:'400102',isActive:true}]),providerCatalog:vi.fn(async()=>[{provider:'Shadowfax360'}]),providers:vi.fn(async()=>[{provider:'Shadowfax360',isEnabled:true,mode:'TEST',publicConfig:{enableBooking:false,productCategory:'Clothing'}}]),saveProvider:vi.fn(async()=>({})),testProvider:vi.fn(async()=>({ok:true}))}}));
afterEach(()=>{cleanup();vi.clearAllMocks()});
describe('Main admin flows',()=>{
 it('generates selected barcode without creating a sale',async()=>{
 api.get.mockResolvedValue({data:{data:[{id:7,sku:'KIDS-M',displayName:'Kids / M',stockQuantity:4}]}});api.post.mockResolvedValue({data:{success:true}});
 render(<InventoryTools mode="barcodes"/>);await screen.findByText('KIDS-M');fireEvent.click(screen.getByRole('checkbox',{name:'Select variant 7'}));fireEvent.click(screen.getByRole('button',{name:'Generate missing barcodes'}));
 await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/pos/barcodes/generate',{variantIds:[7]}));expect(api.post.mock.calls.some(([url])=>url.includes('sales'))).toBe(false);
 });
 it('blocks reconciliation of legacy reservations',async()=>{
 api.get.mockImplementation(async url=>({data:{data:url.includes('warehouses')?[{id:1,name:'Shop',isActive:true}]:[{id:1,sku:'A',stockQuantity:2,allocated:2,legacyReserved:1,needsReconciliation:true,allocations:[]}]}}));
 render(<InventoryTools mode="reconciliation"/>);await screen.findByText('Review required');expect(screen.getByRole('button',{name:'Allocate'}).disabled).toBe(true);
 });
 it('saves Shadowfax booking settings without blank secret replacement',async()=>{
 render(<ShippingPage/>);fireEvent.click(screen.getByRole('button',{name:'Shipping Providers'}));await screen.findByRole('heading',{name:'Shadowfax 360'});
 const heading=screen.getByRole('heading',{name:'Shadowfax 360'});fireEvent.click(heading.closest('.ship-provider').querySelector('.ship-btn.primary'));
 const enable=screen.getByRole('checkbox',{name:/Enable API booking/});fireEvent.click(enable);fireEvent.click(screen.getByRole('button',{name:'Save provider'}));
 await waitFor(()=>expect(shipping.saveProvider).toHaveBeenCalledWith('Shadowfax360',expect.objectContaining({credentials:{},publicConfig:{productCategory:'Clothing',enableBooking:true}})));
 });
});

it('saves Delhivery warehouse mapping without replacing an existing token',async()=>{
 shipping.providers.mockResolvedValueOnce([{provider:'Delhivery',isEnabled:true,mode:'LIVE',publicConfig:{}}]);
 render(<ShippingPage/>);fireEvent.click(screen.getByRole('button',{name:'Shipping Providers'}));
 const heading=await screen.findByRole('heading',{name:'Delhivery'});fireEvent.click(heading.closest('.ship-provider').querySelector('.ship-btn.primary'));
 const field=await screen.findByLabelText('Delhivery warehouse for Mumbai (400102)');fireEvent.change(field,{target:{value:'Namama Mumbai WH'}});fireEvent.click(screen.getByRole('button',{name:'Save provider'}));
 await waitFor(()=>expect(shipping.saveProvider).toHaveBeenCalledWith('Delhivery',expect.objectContaining({mode:'LIVE',credentials:{},publicConfig:{pickupLocationNames:{'1':'Namama Mumbai WH'}}})));
});
