import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import assert from 'node:assert/strict';
import {DevicesView} from '../src/views/DevicesView';
import {CashierJobModal} from '../src/modals/CashierJobModal';
import {JobDetailModal} from '../src/modals/JobDetailModal';
import {NewTicketModal} from '../src/modals/NewTicketModal';
import {defaultPaymentSettings} from '../src/utils/paymentDefaults';
import {generateCashierCard} from '../src/utils/cashierCard';
(async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=require('react-dom/client');const root=createRoot(document.getElementById('root')!);
 let selected:string[]=[],failed=true,deleted:string[]=[];
 const paymentSettings=structuredClone(defaultPaymentSettings);paymentSettings.myanmar.methods.find(method=>method.id==='kbz_pay')!.enabled=true;
 const app:any={role:'admin',currentUser:{id:'owner',full_name:'Owner',username:'owner'},language:'en',settings:{shopName:'Shop',address:'Road',phone:'099',defaultWarrantyDays:90,paymentSettings},activePaymentProfile:'thailand',customers:[],technicians:[],devices:Array.from({length:45},(_,i)=>({id:'device-'+i,brand:'Phone',model:'Model '+i,category:'smartphone',serial_or_imei:'IMEI-'+i,condition_notes:'',customer_id:'customer'})),t:(key:string)=>key,currency:'MMK',formatCurrency:(value:number)=>'Ks '+value,formatDate:(value:string)=>value,getCurrencySymbol:()=> 'Ks',payments:[],availablePaymentMethods:paymentSettings.thailand.methods.filter(method=>method.enabled)};
 app.previewDeviceDeletion=async(ids:string[])=>{selected=ids;return {names:ids,devices:ids.length,jobs:3,parts:2,payments:1,income:1,notifications:1,revision:'review'};};
 app.deleteDevicesWithRecords=async(ids:string[])=>{if(failed)throw new Error('Save failed');deleted=ids;app.devices=[];};
 (globalThis as any).__testApp=app;
 const render=(element:React.ReactNode)=>act(async()=>root.render(element));
 const click=async(element:Element|null)=>{assert.ok(element);await act(async()=>element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));};
 const button=(name:string)=>Array.from(document.querySelectorAll('button')).find(element=>element.textContent===name)!;
 const change=async(element:HTMLSelectElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype,'value')!.set!.call(element,value);element.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
 await render(<DevicesView/>);assert.equal(document.querySelectorAll('tbody tr').length,20);
 await click(document.querySelector('[aria-label="Select all matching devices"]'));assert.ok(button('Delete Selected (45)'));
 await click(document.querySelector('[aria-label="Next page"]'));assert.equal(document.querySelector('tbody tr td')!.textContent,'21');assert.ok((document.querySelector('[aria-label="Select device device-20"]') as HTMLInputElement).checked);
 await click(button('Delete Selected (45)'));assert.equal(selected.length,45);assert.ok((button('Delete All Listed Records') as HTMLButtonElement).disabled);assert.ok(document.querySelector('[role=dialog]')!.textContent!.includes('3 repair jobs'));
 await click(document.querySelector('[aria-label="Acknowledge device deletion"]'));await click(button('Delete All Listed Records'));assert.equal(deleted.length,0);assert.ok(document.querySelector('[role=dialog]')!.textContent!.includes('Save failed'));
 failed=false;await click(button('Delete All Listed Records'));assert.equal(deleted.length,45);assert.ok(!document.querySelector('[role=dialog]'));
 const job:any={id:'job',service_number:'SRV-1',customer:{name:'Customer'},device:{brand:'Phone',model:'One'},technician_id:'none',warranty_days:60,total_cost:100,amount_paid:0,service_charge:100,parts_used:[],status_id:'repairing',priority:'normal',currency_code:'MMK'};
 for(const element of [<CashierJobModal job={job} onClose={()=>{}} onPrint={()=>{}}/>,<JobDetailModal job={job} onClose={()=>{}} onPrint={()=>{}}/>,<NewTicketModal onClose={()=>{}} onCreated={()=>{}}/>]){
  await render(element);
  if(!document.querySelector('[aria-label="Payment profile"]'))await click(Array.from(document.querySelectorAll('button')).find(button=>button.textContent?.toLowerCase().replace(/\s/g,'').includes('recordpayment'))!);
  const warranty=document.querySelector('[aria-label="Service warranty policy"]') as HTMLInputElement|null;if(warranty){assert.equal(warranty.value,'90');assert.ok(warranty.readOnly);}
  const profile=document.querySelector('[aria-label="Payment profile"]') as HTMLSelectElement;assert.ok(profile);
  assert.ok(Array.from(document.querySelectorAll('option')).some(option=>option.textContent==='Cash'));
  assert.ok(!Array.from(document.querySelectorAll('option')).some(option=>option.textContent?.includes('เงินสด')));
  await change(profile,'myanmar');assert.ok(Array.from(document.querySelectorAll('option')).some(option=>option.textContent==='KBZ Pay'));assert.equal(app.activePaymentProfile,'thailand');
 }
 const svg=await generateCashierCard({id:'counter',staff_code:'CASH-0001',role:'cashier',username:'counter',full_name:'Counter',created_at:''},app.settings);
 const xml=new dom.window.DOMParser().parseFromString(svg,'image/svg+xml');
 for(const contact of ['Shop','Road','099']){const text=Array.from(xml.querySelectorAll('text')).find(text=>text.textContent===contact)!;assert.ok(text);assert.ok(Number(text.getAttribute('y'))<146);}
 assert.ok(svg.includes('CASH-0001'));assert.ok(svg.includes('STAFF IDENTIFICATION'));
 await act(async()=>root.unmount());dom.window.close();console.log('PASS: Device cross-page selection, confirmation, failure/retry; all payment forms support localized Myanmar channels; professional cashier contacts occupy card header.');
})().catch(error=>{console.error(error);process.exitCode=1;});
