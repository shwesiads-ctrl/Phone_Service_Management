import React,{useEffect,useRef,useState} from 'react';
import {useApp} from '../context/AppContext';
type Configuration={available:boolean;url?:string;is_running?:boolean};
export function NodeServerControl({config,onStatus}:{config?:Configuration;onStatus?:(running:boolean)=>void}) {
 const {getAuthHeaders,checkServerHealth,language}=useApp();
 const local=['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
 const [status,setStatus]=useState<any>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const callback=useRef(onStatus);callback.current=onStatus;
 const request=async(action:string)=>{
  const response=await fetch(`${config?.url}/api/control/${action}`,{method:['start','stop'].includes(action)?'POST':'GET',headers:getAuthHeaders(),signal:AbortSignal.timeout(10000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error || 'Node control failed.');
  setStatus(result);callback.current?.(result.is_running);return result;
 };
 useEffect(()=>{
  if(!local || !config?.available || !config.url)return;
  let active=true;
  const refresh=async()=>{try{const response=await fetch(`${config.url}/api/control/status`,{headers:getAuthHeaders(),signal:AbortSignal.timeout(3000)});const result=await response.json();if(active&&response.ok){setStatus(result);callback.current?.(result.is_running);}}catch{if(active)setError('Local controller is unavailable. Restart FixFlow from the server terminal.');}};
  void refresh();const timer=window.setInterval(refresh,5000);return()=>{active=false;window.clearInterval(timer);};
 },[local,config?.available,config?.url,getAuthHeaders]);
 const action=async(name:string)=>{
  if(busy)return;
  if(name==='stop'&&!window.confirm(language==='my'?'Node server ပိတ်မလား? ဆက်ထားသောစက်အားလုံး disconnect ဖြစ်မည်။ Local control page ကို ဖွင့်ထားပါ။':'Turn Node Off? All devices will disconnect. Keep the local control page open.'))return;
  setBusy(true);setError('');setMessage('');
  try{const result=await request(name);if(result.success===false)throw new Error(result.error || result.message);setMessage(result.message);await checkServerHealth();}catch(error:any){setError(error.message);}finally{setBusy(false);}
 };
 const disabled=busy||!local||!config?.available||!status||Boolean(status.transition);
 return <section className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3" aria-label="Node server controls">
  <div className="flex flex-wrap justify-between items-center gap-3"><div><h3 className="font-bold">Node server</h3><p className="text-xs text-[var(--text-muted)]">{language==='my'?'Node port အမှန်တကယ် ဖွင့်/ပိတ်ပြီး ဆက်သွယ်မှု စစ်ဆေးပါ။':'Start/stop the Node HTTP port and verify its health.'}</p></div><div className="flex items-center gap-3"><span className="text-xs font-bold">{status?.transition?status.transition:status?status.healthy?'On':status.is_running?'Not responding':'Off':local?'Checking…':config?.is_running?'On (reported)':'Unavailable'}</span><button type="button" role="switch" aria-label="Node server" aria-checked={Boolean(status?.is_running ?? config?.is_running)} disabled={disabled} onClick={()=>void action(status?.is_running?'stop':'start')} className={`w-12 h-7 rounded-full p-1 disabled:opacity-50 ${status?.healthy?'bg-emerald-600':'bg-slate-500'}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${status?.is_running?'translate-x-5':''}`}/></button></div></div>
  <div className="flex flex-wrap gap-3 items-center"><button type="button" disabled={disabled} onClick={()=>void action('test')} className="px-3 py-2 border border-[var(--border)] rounded-lg text-xs disabled:opacity-50">{busy?'Checking…':'Test Node connection'}</button>{local&&config?.available&&config.url&&<a href={config.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--primary)] underline">Open local Node control page</a>}</div>
  <p className="text-xs text-[var(--text-muted)]">{local?'Keep the control page open before switching Off. Off disconnects all clients and stops managed PHP; the local controller remains available for On.':'Control Node on the server computer using localhost. LAN clients can view server status.'}</p>
  {!config?.available&&<p className="text-xs text-amber-600">Restart FixFlow using the updated server to enable controls.</p>}
  {message&&<p role="status" className="text-xs text-emerald-600">{message}</p>}{error&&<p role="alert" className="text-xs text-rose-500">{error}</p>}
 </section>;
}
