/** Browser-only fixture: fake shop records and no external API requests. */
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Navbar} from '../src/components/Navbar';
import {ServiceView} from '../src/views/ServiceView';
import {PrintTicketModal} from '../src/modals/PrintTicketModal';
import {ShopSettings} from '../src/components/ShopSettings';
import {LoginView} from '../src/components/LoginView';
import {ProfileModal} from '../src/modals/ProfileModal';
import {generateCashierCard} from '../src/utils/cashierCard';
import {defaultPaymentSettings} from '../src/utils/paymentDefaults';
const user:any={id:'USR-CASH-4921fa32-b92c-436f-ad67-08e67c8759f6',staff_code:'CASH-0001',full_name:'Counter One',username:'cashier_one',role:'cashier'};
const initial:any={shopName:'Workshop & Phone',phone:'099123',email:'shop@example.test',address:'Workshop Road, Yangon',shopLogo:'',taxEnabled:false,taxPercentage:0,taxId:'',paperSize:'A4',receiptFooterNote:'Thank you for choosing our workshop.',paymentSettings:defaultPaymentSettings};
const jobs:any[]=Array.from({length:45},(_,i)=>({id:'JOB-'+i,service_number:`SRV-${String(i+1).padStart(4,'0')}`,customer:{name:i===44?'Unique Customer':'Customer '+i,phone:'099123'},device:{brand:'Google',model:'Pixel',serial_or_imei:'IMEI-'+i},technician_id:'TECH-1',status_id:'received',received_at:'2026-10-12',created_at:'2026-10-12',service_charge:100,parts_cost:50,total_cost:150,amount_paid:40,currency_code:'MMK',warranty_days:30,problem_description:'Charging port repair',intake_received_by:user.full_name,payments:[{id:'PAY-'+i,service_job_id:'JOB-'+i,received_by:'Counter Two',amount:40,currency_code:'MMK',paid_at:'2026-10-12',payment_method:'cash',cashier_id:'other-counter'}]}));
let failSave=false;
function Harness(){
 const [mode,setMode]=useState('jobs'),[settings,setSettings]=useState(initial),[query,setQuery]=useState(''),[tab,setTab]=useState('dashboard');
 Object.assign(window,{setMode,setSettings,failSave:(value:boolean)=>{failSave=value;},generateCard:()=>generateCashierCard(user,settings)});
 (globalThis as any).__testApp={settings,language:'en',searchQuery:query,setSearchQuery:setQuery,role:'cashier',currentUser:user,jobs,technicians:[{id:'TECH-1',full_name:'Bench Technician'}],payments:[],theme:'dark',setTheme:()=>{},setLanguage:()=>{},activeTab:tab,license:{plan:'FREE'},serverStatus:'online',getAuthHeaders:()=>({}),t:(key:string)=>key,login:()=>{},navigate:(path:string)=>setTab(path.replace('/','')),formatDate:(value:string)=>value,formatCurrency:(value:number,code='MMK')=>`${code} ${value}`,updateSettings:async(value:any)=>{if(failSave)throw new Error('Save failed. Try again.');setSettings((previous:any)=>({...previous,...value}));},checkServerHealth:()=>{}};
 return mode==='receipt'?<PrintTicketModal job={jobs[0]} onClose={()=>setMode('jobs')}/>:mode==='thermal'?<PrintTicketModal job={jobs[0]} onClose={()=>setMode('jobs')}/>:mode==='shop'?<ShopSettings/>:mode==='login'?<LoginView/>:mode==='profile'?<ProfileModal onChangePasswordClick={()=>{}} onClose={()=>setMode('jobs')}/>:<><Navbar onOpenMobileMenu={()=>{}} onOpenNewJobModal={()=>{}} onOpenNotificationJob={()=>{}}/>{tab==='dashboard'?<p>Dashboard</p>:<ServiceView onOpenJob={()=>{}} onNewJob={()=>{}} onPrintReceipt={()=>setMode('receipt')}/>}</>;
}
globalThis.fetch=async()=>new Response(JSON.stringify({notifications:[],unread_count:0}));
createRoot(document.getElementById('root')!).render(<Harness/>);
