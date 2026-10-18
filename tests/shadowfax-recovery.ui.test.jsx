import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import ShadowfaxRecovery from '../src/pages/shipping/ShadowfaxRecovery';
import shipping from '../src/services/shippingAdminService';
vi.mock('../src/services/shippingAdminService',()=>({default:{shadowfaxBooking:vi.fn(),retrySavedShadowfax:vi.fn(),correctShadowfaxPickup:vi.fn()}}));
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('replays only the saved request reference and completes recovery',async()=>{
 shipping.shadowfaxBooking.mockResolvedValue({hasIntent:true,clientOrderId:'NM-2-saved',mode:'LIVE',state:'PENDING'});shipping.retrySavedShadowfax.mockResolvedValue({id:77});const done=vi.fn();
 render(<ShadowfaxRecovery orderId={2} done={done}/>);fireEvent.click(await screen.findByRole('button',{name:'Retry saved booking'}));await waitFor(()=>expect(done).toHaveBeenCalled());expect(shipping.retrySavedShadowfax).toHaveBeenCalledWith(2,'NM-2-saved');
});
it('keeps the carrier error visible after an unsuccessful replay',async()=>{
 shipping.shadowfaxBooking.mockResolvedValue({hasIntent:true,clientOrderId:'NM-2-saved',mode:'LIVE',state:'PENDING',lastError:{message:'Pickup postcode is unavailable.'}});shipping.retrySavedShadowfax.mockRejectedValue({response:{data:{message:'Shadowfax rejected booking: pickup postcode.'}}});
 render(<ShadowfaxRecovery orderId={2} done={vi.fn()}/>);fireEvent.click(await screen.findByRole('button',{name:'Retry saved booking'}));expect((await screen.findByRole('alert')).textContent).toContain('pickup postcode');
});
it('does not offer replay without a saved booking',async()=>{
 shipping.shadowfaxBooking.mockResolvedValue({hasIntent:false});render(<ShadowfaxRecovery orderId={2} done={vi.fn()}/>);await screen.findByText(/No saved booking attempt/);expect(screen.queryByRole('button',{name:'Retry saved booking'})).toBeNull();
});

it('corrects a rejected booking using the selected pickup and saved error version',async()=>{
 shipping.shadowfaxBooking.mockResolvedValue({hasIntent:true,clientOrderId:'NM-2-saved',pickupPincode:400050,lastError:{kind:'CARRIER_REJECTED',at:'2026-10-17T12:00:00.000Z',message:'Pickup not serviceable'}});shipping.correctShadowfaxPickup.mockResolvedValue({id:77});const done=vi.fn();
 render(<ShadowfaxRecovery orderId={2} done={done} pickupLocationId={8} pickupPincode="400102"/>);fireEvent.click(await screen.findByRole('button',{name:'Use selected pickup and retry'}));await waitFor(()=>expect(done).toHaveBeenCalled());expect(shipping.correctShadowfaxPickup).toHaveBeenCalledWith(2,{expectedClientOrderId:'NM-2-saved',pickupLocationId:8,expectedErrorAt:'2026-10-17T12:00:00.000Z'});
});
it('does not offer pickup correction after an uncertain response',async()=>{
 shipping.shadowfaxBooking.mockResolvedValue({hasIntent:true,lastError:{kind:'UNCERTAIN',message:'Timeout'}});render(<ShadowfaxRecovery orderId={2} done={vi.fn()} pickupLocationId={8}/>);await screen.findByText(/Timeout/);expect(screen.queryByRole('button',{name:'Use selected pickup and retry'})).toBeNull();
});
