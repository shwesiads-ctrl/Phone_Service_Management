import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { AppProvider, useApp } from '../src/context/AppContext';
import { translations } from '../src/i18n/translations';
import { formatCurrency, getCurrencySymbol } from '../src/utils/formatters';
(async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 let systemHandler:any;window.matchMedia=()=>({matches:true,addEventListener(_type:string,handler:any){systemHandler=handler;},removeEventListener(){}} as any);
 const user={id:'USR-001',username:'admin',role:'admin',full_name:'Administrator',created_at:''};
 localStorage.setItem('fixflow_auth_token','test-token');localStorage.setItem('fixflow_current_user',JSON.stringify(user));localStorage.setItem('fixflow_lang','fr');
 let settings:any={currency:'CNY',currency_mode:'manual',language:'en',dateFormat:'DD-MM-YYYY'};
 let writes:any[]=[];
 globalThis.fetch=async(path:any,options:any={})=>{
   let body:any=[];
   if(path==='/api/auth/me')body={user};
   if(path==='/api/settings'){if(options.method==='PUT'){const data=JSON.parse(options.body);writes.push(data);settings={...settings,...data};}body=settings;}
   if(path==='/api/health')body={ok:true};
   if(path==='/api/license')body={plan:'FREE',status:'ACTIVE'};
   if(path==='/api/telegram')body={enabled:false};
   if(path==='/api/backup')body={};
   return new Response(JSON.stringify(body));
 };
 let app:any;function Probe(){app=useApp();return <p>{app.language}:{app.currency}</p>;}
 const {createRoot}=require('react-dom/client');const root=createRoot(document.getElementById('root')!);
 await act(async()=>root.render(<AppProvider><Probe /></AppProvider>));
 await act(async()=>app.setTheme('light'));assert.equal(document.documentElement.getAttribute('data-theme'),'light');assert.ok(!document.documentElement.classList.contains('dark'));
 await act(async()=>app.setTheme('dark'));assert.equal(document.documentElement.getAttribute('data-theme'),'dark');assert.equal(localStorage.getItem('fixflow_theme'),'dark');
 await act(async()=>app.setTheme('system'));assert.equal(document.documentElement.getAttribute('data-theme'),'dark');
 await act(async()=>systemHandler({matches:false}));assert.equal(document.documentElement.getAttribute('data-theme'),'light');
 await act(async()=>window.dispatchEvent(new dom.window.StorageEvent('storage',{key:'fixflow_theme',newValue:'dark'})));assert.equal(app.theme,'dark');
 await act(async()=>app.setTheme('invalid'));assert.equal(app.theme,'dark');
 console.log('PASS: Real context Light/Dark/System selection, system changes, persistence, cross-tab sync and invalid-theme protection.');
 assert.deepEqual(Object.keys(translations).sort(),['en','my','th','zh']);
 assert.equal(app.language,'en');assert.equal(app.currency,'CNY');
 for(const lang of ['my','th','zh','en']){await act(async()=>app.setLanguage(lang));assert.equal(app.currency,'CNY');}
 assert.equal(writes.length,0);
 await act(async()=>app.setCurrency('THB'));assert.equal(app.currency,'THB');assert.equal(writes[0].currency_mode,'manual');
 await act(async()=>app.setLanguage('my'));assert.equal(app.currency,'THB');assert.equal(writes.length,1);
 await act(async()=>app.setCurrency('CNY'));assert.equal(app.currency,'CNY');
 assert.equal(formatCurrency(50,'CNY'),'¥50.00');assert.equal(getCurrencySymbol('CNY'),'¥');
 await act(async()=>root.unmount());dom.window.close();
 console.log('PASS: Exactly four languages, removed-language fallback, language changes never write or change currency, user currency selection persists, Yuan formats correctly.');
})().catch(e=>{console.error(e);process.exitCode=1;});
