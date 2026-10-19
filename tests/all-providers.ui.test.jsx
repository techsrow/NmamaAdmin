import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import ShippingPage from '../src/pages/shipping/ShippingPage';
import shipping from '../src/services/shippingAdminService';
vi.mock('../src/services/shippingAdminService',()=>({default:{dashboard:vi.fn(async()=>({})),fulfillmentOrders:vi.fn(async()=>[{id:1,orderNumber:'NM-1',items:[{id:10,remainingQuantity:1}]}]),shipments:vi.fn(async()=>[]),fulfillmentOrder:vi.fn(async()=>({id:1,items:[{id:10,quantity:1,remainingQuantity:1}]})),pickupLocations:vi.fn(async()=>[{id:1,name:'Shop',isActive:true}]),providers:vi.fn(async()=>[{provider:'DTDC',isEnabled:true},{provider:'Local',isEnabled:true},{provider:'BlueDart',isEnabled:false}]),createFulfillment:vi.fn(async()=>({id:5,orderId:1,provider:'DTDC',awb:'DL12345',providerMeta:{bookingMode:'MANUAL'}})),shipment:vi.fn(async()=>({shipment:{id:5,orderId:1,provider:'DTDC',awb:'DL12345',providerMeta:{bookingMode:'MANUAL'}},items:[],tracking:[]}))}}));
afterEach(cleanup);
it('shows all enabled providers and submits the real AWB for manual carrier booking',async()=>{
 render(<ShippingPage/>);fireEvent.click(await screen.findByRole('button',{name:'Fulfil'}));
 const option=await screen.findByRole('option',{name:'DTDC — Manual AWB'});expect(screen.queryByRole('option',{name:/Blue Dart/})).toBeNull();
 fireEvent.change(option.closest('select'),{target:{value:'DTDC'}});
 fireEvent.click(screen.getByRole('button',{name:'Create shipment'}));await screen.findByText(/Enter the actual carrier AWB after booking/);expect(shipping.createFulfillment).not.toHaveBeenCalled();
 fireEvent.change(screen.getByPlaceholderText('AWB issued by this courier'),{target:{value:'DL12345'}});fireEvent.click(screen.getByRole('button',{name:'Create shipment'}));
 await waitFor(()=>expect(shipping.createFulfillment).toHaveBeenCalledWith(1,expect.objectContaining({provider:'DTDC',awb:'DL12345'})));
});
