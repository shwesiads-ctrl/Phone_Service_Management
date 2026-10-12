export class LoginLimiter {
  private attempts=new Map<string,{count:number;until:number}>();
  constructor(private now=()=>Date.now()){}
  private entry(key:string){const entry=this.attempts.get(key);if(entry&&entry.until<=this.now()){this.attempts.delete(key);return undefined;}return entry;}
  retryAfter(ip:string,username:string){const pair=this.entry(`${ip}|${username.toLowerCase()}`),global=this.entry(ip);return Math.max(0,...[pair&&pair.count>=5?pair.until:0,global&&global.count>=100?global.until:0].map(until=>Math.ceil(((until || 0)-this.now())/1000)));}
  fail(ip:string,username:string){for(const key of [ip,`${ip}|${username.toLowerCase()}`]){const previous=this.entry(key);this.attempts.set(key,{count:(previous?.count || 0)+1,until:previous?.until || this.now()+15*60*1000});}if(this.attempts.size>10000){for(const [key,value] of this.attempts)if(value.until<=this.now())this.attempts.delete(key);if(this.attempts.size>10000)this.attempts.delete(this.attempts.keys().next().value!);}}
  reset(username:string){for(const key of this.attempts.keys())if(key.endsWith('|'+username.toLowerCase()))this.attempts.delete(key);}
  success(ip:string,username:string){this.attempts.delete(`${ip}|${username.toLowerCase()}`);}
}
