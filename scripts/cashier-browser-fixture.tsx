import { RepairRecordsView } from '../src/views/RepairRecordsView';
import { FinanceView } from '../src/views/FinanceView';
import { ReportsView } from '../src/views/ReportsView';
import { CashierCardModal } from '../src/components/CashierCardModal';
import { UserAccessView } from '../src/views/UserAccessView';
import { CashierAccountsView } from '../src/views/CashierAccountsView';
import { en } from '../src/i18n/locales/en';
import { AdminDashboardView } from '../src/views/AdminDashboardView';
import { TechniciansView } from '../src/views/TechniciansView';
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
const initial:any={shopName:'Workshop & Phone',phone:'099123',email:'shop@example.test',defaultWarrantyDays:90,address:'Workshop Road, Yangon',shopLogo:'',taxEnabled:false,taxPercentage:0,taxId:'',paperSize:'A4',receiptFooterNote:'Thank you for choosing our workshop.',paymentSettings:defaultPaymentSettings};
const jobs:any[]=Array.from({length:45},(_,i)=>({id:'JOB-'+i,service_number:`SRV-${String(i+1).padStart(4,'0')}`,customer:{name:i===44?'Unique Customer':'Customer '+i,phone:'099123'},device:{brand:'Google',model:'Pixel',serial_or_imei:'IMEI-'+i},technician_id:'TECH-1',status_id:'received',received_at:'2026-10-12',created_at:'2026-10-12',service_charge:100,parts_cost:50,total_cost:150,amount_paid:40,currency_code:'MMK',warranty_days:30,problem_description:'Charging port repair',intake_received_by:user.full_name,payments:[{id:'PAY-'+i,service_job_id:'JOB-'+i,received_by:'Counter Two',amount:40,currency_code:'MMK',paid_at:'2026-10-12',payment_method:'cash',cashier_id:'other-counter'}]}));
const technicians=Array.from({length:45},(_,i)=>({id:`TECH-${i+1}`,full_name:i===0?'Bench Technician':`Technician ${i+1}`,username:`tech${i+1}`,status:'active',specialization:['Screen','Battery'],phone:'099123',email:'tech@example.test',address:'Workshop',created_at:'2026-10-12'}));
const reportJobs=Array.from({length:180},(_,i)=>({...jobs[0],id:'PDF-JOB-'+i,service_number:'PDF-SRV-'+String(i+1).padStart(4,'0')}));
let failSave=false,setupAvailable=true;
function Harness(){
 const [mode,setMode]=useState('jobs'),[settings,setSettings]=useState(initial),[query,setQuery]=useState(''),[tab,setTab]=useState('dashboard'),[currency,setCurrency]=useState('MMK');
 Object.assign(window,{setMode,setSettings,failSave:(value:boolean)=>{failSave=value;},generateCard:()=>generateCashierCard(user,settings)});
 (globalThis as any).__testApp={settings,currency,setCurrency,language:'en',searchQuery:query,setSearchQuery:setQuery,role:['technicians','admin-dashboard','admin-navbar','accounts','cashiers','repairs','finance','reports'].includes(mode)?'admin':'cashier',currentUser:user,jobs:['repairs','reports'].includes(mode)?reportJobs:jobs,technicians,payments:mode==='reports'?reportJobs.map((job,i)=>({...job.payments[0],id:'P-'+i,service_number:job.service_number})):[],auditTrail:[],incomeRecords:[],expenseRecords:reportJobs.map((job,i)=>({id:'EXP-'+i,reference:'PDF-EXP-'+String(i+1).padStart(4,'0'),date:'2026-10-13',description:'Report expense '+i,amount:10,payment_method:'cash',category:'Parts'})),theme:'dark',setTheme:()=>{},setLanguage:()=>{},activeTab:tab,license:{plan:'FREE'},serverStatus:'online',getAuthHeaders:()=>({}),t:(key:string)=>(en as Record<string,string>)[key] || key,login:()=>{},navigate:(path:string)=>setTab(path.replace('/','')),formatDate:(value:string)=>value,formatCurrency:(value:number,code='MMK')=>`${code} ${value}`,updateSettings:async(value:any)=>{if(failSave)throw new Error('Save failed. Try again.');setSettings((previous:any)=>({...previous,...value}));},setActiveTab:()=>{},checkServerHealth:()=>{}};
 return mode==='repairs'?<RepairRecordsView onOpenJob={()=>{}}/>:mode==='finance'?<FinanceView/>:mode==='reports'?<ReportsView/>:mode==='card'?<CashierCardModal user={user} onClose={()=>setMode('jobs')}/>:mode==='cashiers'?<CashierAccountsView/>:mode==='accounts'?<UserAccessView/>:mode==='technicians'?<TechniciansView/>:mode==='admin-dashboard'?<AdminDashboardView onOpenJob={()=>{}} onNewJob={()=>{}}/>:mode==='receipt'?<PrintTicketModal job={jobs[0]} onClose={()=>setMode('jobs')}/>:mode==='thermal'?<PrintTicketModal job={jobs[0]} onClose={()=>setMode('jobs')}/>:mode==='shop'?<ShopSettings/>:mode==='login'?<LoginView/>:mode==='profile'?<ProfileModal onChangePasswordClick={()=>{}} onClose={()=>setMode('jobs')}/>:<><Navbar onOpenMobileMenu={()=>{}} onOpenNewJobModal={()=>{}} onOpenNotificationJob={()=>{}}/>{tab==='dashboard'?<p>Dashboard</p>:<ServiceView onOpenJob={()=>{}} onNewJob={()=>{}} onPrintReceipt={()=>setMode('receipt')}/>}</>;
}
globalThis.fetch=async(path:any)=>new Response(JSON.stringify(path==='/api/users'||path==='/api/cashiers'?Array.from({length:25},(_,i)=>({...user,id:'counter-'+i,staff_code:'CASH-'+String(i+1).padStart(4,'0'),username:'counter'+i,full_name:'Cashier '+i,active:true,password_configured:true})):path==='/api/auth/setup-status'?{registration_open:setupAvailable}:{notifications:[],unread_count:0}));
document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark');
createRoot(document.getElementById('root')!).render(<Harness/>);
