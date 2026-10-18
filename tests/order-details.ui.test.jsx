import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import OrderDetails from '../src/pages/admin/OrderDetails';
import orders from '../src/services/orderService';
vi.mock('../src/services/orderService',()=>({default:{adminGet:vi.fn(async()=>({data:{data:{id:2,shippingProvider:'Delhivery',shipmentStatus:'NotCreated',paymentStatus:'Paid',status:'Confirmed',totalAmount:1000,shippingFee:120,shipments:[]}}})),updateShipping:vi.fn(async()=>({}))}}));
vi.mock('../src/services/shippingAdminService',()=>({default:{providers:vi.fn(async()=>[{provider:'Shadowfax360',isEnabled:true},{provider:'BlueDart',isEnabled:false}])}}));
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('order details offers enabled Shadowfax, excludes disabled providers, and saves its API enum',async()=>{
 render(<MemoryRouter initialEntries={['/orders/2']}><Routes><Route path="/orders/:id" element={<OrderDetails/>}/></Routes></MemoryRouter>);
 const option=await screen.findByRole('option',{name:'Shadowfax 360'});expect(screen.queryByRole('option',{name:'BlueDart'})).toBeNull();expect(screen.getByRole('option',{name:'Delhivery (saved on order)'})).toBeTruthy();
 fireEvent.change(option.closest('select'),{target:{value:'Shadowfax360'}});fireEvent.click(screen.getByRole('button',{name:'Update Shipping'}));await waitFor(()=>expect(orders.updateShipping).toHaveBeenCalledWith(2,expect.objectContaining({shippingProvider:'Shadowfax360',shippingFee:120})));expect(orders.updateShipping.mock.calls[0][1].awbNumber).toBeUndefined();expect(screen.getByRole('button',{name:'Print invoice'})).toBeTruthy();
 await screen.findByText(/Shipping details saved successfully/);
});
it('shows shipping save errors next to the shipping action',async()=>{
 orders.updateShipping.mockRejectedValueOnce({response:{data:{message:'Shipping provider could not be saved.'}}});
 render(<MemoryRouter initialEntries={['/orders/2']}><Routes><Route path="/orders/:id" element={<OrderDetails/>}/></Routes></MemoryRouter>);
 fireEvent.click(await screen.findByRole('button',{name:'Update Shipping'}));expect((await screen.findByRole('alert')).textContent).toContain('Shipping provider could not be saved.');
});
