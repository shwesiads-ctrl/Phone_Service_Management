import {createServer, type Server, type IncomingMessage, type ServerResponse} from 'node:http';

const localHost = (hostname: string) => ['localhost','127.0.0.1','[::1]'].includes(hostname);
export class NodeControl {
  readonly control: Server;
  controlPort = 0;
  transition: 'starting' | 'stopping' | null = null;
  constructor(private backend: Server, private port: number, private host: string,
    private authorize: (token: string) => string | undefined,
    private login: (username: unknown, password: unknown) => string | undefined,
    private beforeStop: () => Promise<void>) {
    this.control = createServer((request, response) => void this.handle(request, response));
  }
  async listen() {
    await new Promise<void>((resolve,reject)=>{this.control.once('error',reject);this.control.listen(0,'127.0.0.1',()=>{this.control.removeListener('error',reject);resolve();});});
    this.controlPort = (this.control.address() as {port:number}).port;
  }
  get info() {return {available:Boolean(this.controlPort),url:`http://127.0.0.1:${this.controlPort}`,port:this.controlPort,is_running:this.backend.listening};}
  async health() {
    if (!this.backend.listening) return false;
    try {const response=await fetch(`http://127.0.0.1:${this.port}/api/health`,{signal:AbortSignal.timeout(1500)});return response.ok && (await response.json()).server==='FixFlow-Node';} catch {return false;}
  }
  private async handle(request: IncomingMessage, response: ServerResponse) {
    const json=(status:number,value:unknown)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(value));};
    try {
      const host=new URL(`http://${request.headers.host}`);
      if (!localHost(host.hostname) || Number(host.port)!==this.controlPort) return json(403,{error:'Local server computer access only.'});
      const origin=request.headers.origin;
      if (origin) {
        const url=new URL(origin);
        if (!localHost(url.hostname) || url.protocol!=='http:' || ![this.port,this.controlPort].includes(Number(url.port || 80))) return json(403,{error:'Untrusted control origin.'});
        response.setHeader('Access-Control-Allow-Origin',origin);response.setHeader('Vary','Origin');
        response.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');response.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
      }
      if(request.method==='OPTIONS'){response.writeHead(204);response.end();return;}
      if(request.method==='GET' && request.url==='/'){
        response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'"});
        response.end(controlPage(this.port));return;
      }
      if(request.method==='POST' && request.url==='/api/control/login'){
        let text='';for await(const chunk of request){text+=chunk;if(text.length>8192)return json(413,{error:'Request too large.'});}
        const body=JSON.parse(text);const token=this.login(body.username,body.password);
        return token ? json(200,{token}) : json(401,{error:'Administrator credentials required. Try again later after repeated failures.'});
      }
      const token=request.headers.authorization?.startsWith('Bearer ')?request.headers.authorization.slice(7):'';
      const role=this.authorize(token);
      if(!role)return json(401,{error:'Sign in as an administrator.'});
      if(role!=='admin')return json(403,{error:'Administrator access required.'});
      if(request.method==='GET' && ['/api/control/status','/api/control/test'].includes(request.url || '')){
        const healthy=await this.health();return json(200,{...this.info,healthy,transition:this.transition,success:healthy,message:healthy?'Node server health check passed.':'Node server is Off or not responding.'});
      }
      if(request.method!=='POST' || !['/api/control/start','/api/control/stop'].includes(request.url || ''))return json(404,{error:'Control endpoint not found.'});
      if(this.transition)return json(409,{error:'Wait for the current server action to finish.'});
      if(request.url==='/api/control/stop'){
        this.transition='stopping';
        try {
          await this.beforeStop();
          if(this.backend.listening)await new Promise<void>((resolve,reject)=>{
            const timer=setTimeout(()=>reject(new Error('Server shutdown timed out.')),5000);
            this.backend.close(error=>{clearTimeout(timer);error?reject(error):resolve();});this.backend.closeAllConnections();
          });
          return json(200,{...this.info,healthy:false,success:true,message:'Node server is Off. The local control page remains available.'});
        }finally{this.transition=null;}
      }
      this.transition='starting';
      try {
        if(!this.backend.listening)await new Promise<void>((resolve,reject)=>{const failed=(error:Error)=>reject(error);this.backend.once('error',failed);this.backend.listen(this.port,this.host,()=>{this.backend.removeListener('error',failed);resolve();});});
        if(!await this.health())return json(503,{...this.info,success:false,error:'Node server did not pass its health check.'});
        return json(200,{...this.info,healthy:true,success:true,message:'Node server is On. Health check passed.'});
      }finally{this.transition=null;}
    }catch(error:any){return json(error instanceof SyntaxError?400:500,{error:error.code==='EADDRINUSE'?'Node port is occupied. Close the conflicting program before turning On.':error.message || 'Server control failed.'});}
  }
}
function controlPage(port:number){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FixFlow Node Control</title><style>body{font:16px Arial;background:#0b1220;color:#e5edf9;margin:0;padding:24px}main{max-width:480px;margin:10vh auto;background:#172238;padding:28px;border-radius:18px}input,button{box-sizing:border-box;width:100%;padding:12px;margin:8px 0;border-radius:8px;border:1px solid #526079}button{background:#2563eb;color:white;cursor:pointer}button:disabled{opacity:.5}p{line-height:1.6}a{color:#85b5ff}</style></head><body><main><h1>FixFlow · Node Server</h1><p>Local server control · ဆာဗာဖွင့် / ပိတ်</p><form id="login"><label>Admin username<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button>Sign in</button></form><div id="controls" hidden><button id="on">On · ဖွင့်ရန်</button><button id="off">Off · ပိတ်ရန်</button><button id="test">Test connection</button></div><p id="status" role="status">Sign in with your administrator account.</p><a href="http://127.0.0.1:${port}" target="_blank" rel="noopener">Open FixFlow</a><p>Keep this page open to turn Node back On. Off closes the workshop API port and managed PHP server. This local control page stays available.</p></main><script>let token='',busy=false;const status=document.getElementById('status');async function action(path,body){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{const response=await fetch('/api/control/'+path,{method:path==='test'?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw Error(data.error);if(data.token){token=data.token;document.getElementById('login').hidden=true;document.getElementById('controls').hidden=false;}status.textContent=data.message||'Administrator signed in.';}catch(error){status.textContent=error.message;}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}}document.getElementById('login').onsubmit=event=>{event.preventDefault();const form=event.target;action('login',{username:form.elements.namedItem('username').value,password:form.elements.namedItem('password').value});form.elements.namedItem('password').value='';};document.getElementById('on').onclick=()=>action('start');document.getElementById('off').onclick=()=>{if(confirm('Turn Node Off? All devices will disconnect.'))action('stop');};document.getElementById('test').onclick=()=>action('test');</script></body></html>`;}
