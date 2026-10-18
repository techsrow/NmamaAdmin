import React,{useState} from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import ShadowfaxBookingFields from '../src/pages/shipping/ShadowfaxBookingFields';
afterEach(cleanup);
function Fields({highValue=false}){const[documents,setDocuments]=useState({ewayBill:'',sellerGstin:''});return <ShadowfaxBookingFields documents={documents} setDocuments={setDocuments} highValue={highValue}/>}
it('normal-value booking leaves merchant documents optional',()=>{render(<Fields/>);for(const input of screen.getAllByRole('textbox'))expect(input.required).toBe(false)});
it('does not request unsupported carrier pickup slots',()=>{render(<Fields/>);expect(screen.queryByLabelText(/Pickup date/)).toBeNull();expect(screen.queryByLabelText(/Pickup slot/)).toBeNull()});
it('high-value booking requires merchant documents',()=>{render(<Fields highValue/>);expect(screen.getByLabelText(/E-way bill/).required).toBe(true);expect(screen.getByLabelText(/Seller GSTIN/).required).toBe(true)});
