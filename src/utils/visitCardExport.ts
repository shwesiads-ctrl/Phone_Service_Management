import type {SettingsState} from '../types';

type Shop=Pick<SettingsState,'shopName'|'shopLogo'|'address'|'phone'|'secondaryPhone'|'email'|'website'>;
export type CardSide='front'|'back';
const W=1712,H=1080;
const socials=['facebook','tiktok','telegram','instagram','whatsapp','other'] as const;
function path(ctx:CanvasRenderingContext2D,points:[number,number][],color:string){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,width:number,size:number,color:string,font:string,bold=false,align:CanvasTextAlign='left'){
 ctx.font=`${bold?'700':'400'} ${size}px "${font}","Noto Sans Myanmar",Arial,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';
 let shown=value.trim();while(shown.length>1&&ctx.measureText(shown).width>width)shown=shown.slice(0,-1);if(shown.length<value.trim().length)shown=shown.trimEnd()+'…';ctx.fillText(shown,x,y);
}
function wrap(ctx:CanvasRenderingContext2D,value:string,maxWidth:number,maxLines:number){
 const words=value.replace(/\s+/g,' ').trim().split(' '),lines:string[]=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines.slice(0,maxLines);
}
function background(ctx:CanvasRenderingContext2D,design:number,accent:string){
 const navy='#122238',dark='#111827',white='#ffffff',cream='#fbf7f0';let base=white,ink=navy,soft='#53647a';
 if([4,7,9].includes(design)){base=dark;ink=white;soft='#cad4e1';}if(design===8){base=cream;}
 ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
 switch(design){
  case 1:ctx.fillStyle=accent;ctx.fillRect(0,0,W,29);ctx.fillRect(0,H-29,W,29);break;
  case 2:ctx.fillStyle=accent;ctx.fillRect(0,0,570,H);break;
  case 3:path(ctx,[[W*.7,0],[W,0],[W,H],[W*.35,H]],accent);break;
  case 4:ctx.strokeStyle=accent;ctx.lineWidth=14;ctx.strokeRect(65,65,W-130,H-130);break;
  case 5:ctx.fillStyle=accent;ctx.beginPath();ctx.arc(W-130,120,455,0,Math.PI*2);ctx.fill();break;
  case 6:ctx.fillStyle=accent;ctx.fillRect(0,0,70,H);ctx.fillRect(0,H-70,W,70);break;
  case 7:path(ctx,[[0,0],[W*.57,0],[0,H*.78]],accent);break;
  case 8:ctx.strokeStyle=accent;ctx.lineWidth=7;ctx.strokeRect(70,70,W-140,H-140);ctx.fillStyle=accent;ctx.fillRect(120,H-120,220,10);break;
  case 9:ctx.fillStyle=accent;ctx.fillRect(W-240,0,240,H);break;
  case 10:ctx.fillStyle=accent;ctx.beginPath();ctx.arc(W,0,435,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,H,235,0,Math.PI*2);ctx.fill();break;
 }
 return {ink,soft,base};
}
async function drawLogo(ctx:CanvasRenderingContext2D,shop:Shop,card:NonNullable<SettingsState['visitCard']>,x:number,y:number,ink:string){
 const size=195;if(shop.shopLogo?.startsWith('data:image/')){const logo=new Image();logo.src=shop.shopLogo;try{await logo.decode();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.roundRect(x,y,size,size,26);ctx.fill();ctx.drawImage(logo,x+16,y+16,size-32,size-32);return;}catch{/* Fall through to a monogram. */}}
 ctx.fillStyle=card.color;ctx.beginPath();ctx.roundRect(x,y,size,size,30);ctx.fill();text(ctx,(shop.shopName||'S').slice(0,1).toUpperCase(),x+size/2,y+size/2,160,116,'#ffffff',card.font,true,'center');
}
/** The same canvas renderer powers preview and PNG, so both sides stay visually identical. */
export async function drawVisitCard(canvas:HTMLCanvasElement,side:CardSide,shop:Shop,card:NonNullable<SettingsState['visitCard']>){
 const ctx=canvas.getContext('2d');if(!ctx)return;ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 const design=Math.min(10,Math.max(1,card.design||1)),accent=card.color||'#2563eb',font=card.font||'Plus Jakarta Sans';const {ink,soft,base}=background(ctx,design,accent);
 const x=design===2?615:135,room=W-x-130;
 if(side==='front'){
  const center=[4,8,10].includes(design),mid=W/2;
  const logoX=center?mid-98:x,logoY=center?210:280;await drawLogo(ctx,shop,card,logoX,logoY,ink);
  const nameY=center?545:425,nameX=center?mid:x+245,align=center?'center':'left',nameWidth=center?1400:room-245;
  text(ctx,shop.shopName||'Shop name',nameX,nameY,nameWidth,center?88:90,ink,font,true,align);
  text(ctx,'SERVICE · REPAIR · CARE',nameX,nameY+104,nameWidth,31,soft,font,false,align);
  if(shop.website)text(ctx,shop.website,center?mid:x,H-160,center?1300:room,35,soft,font,false,align);
  else text(ctx,'QUALITY WORK. PERSONAL SERVICE.',center?mid:x,H-160,center?1300:room,29,soft,font,false,align);
  if(design===2&&base==='#ffffff'){ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(284,130,54,0,Math.PI*2);ctx.fill();}
 }else{
  const headingColor=design===2?ink:ink;text(ctx,'VISIT & CONTACT',x,170,room,49,headingColor,font,true);
  ctx.fillStyle=accent;ctx.fillRect(x,225,170,8);
  const rows:[string,string][]=[['ADDRESS',shop.address||'Shop address'],['PHONE',[shop.phone||'Phone',shop.secondaryPhone].filter(Boolean).join(' · ')],['EMAIL',shop.email||'Email']];
  let y=320;for(const [label,value] of rows){text(ctx,label,x,y,230,29,soft,font,true);ctx.font=`400 39px "${font}","Noto Sans Myanmar",Arial,sans-serif`;const lines=wrap(ctx,value,room,2);lines.forEach((line,i)=>text(ctx,line,x,y+55+i*50,room,39,ink,font));y+=label==='ADDRESS'?177:140;}
  const social=Object.entries(card.social||{}).filter(([,value])=>typeof value==='string'&&value.trim()).slice(0,6);
  if(social.length){ctx.fillStyle=accent;ctx.fillRect(x,y+13,room,3);y+=70;const column=room/2;social.forEach(([label,value],i)=>{const col=i%2,row=Math.floor(i/2);text(ctx,`${label==='other'?'SOCIAL':label.toUpperCase()}  ${value}`,x+col*column,y+row*62,column-30,27,ink,font);});}
  else if(shop.website)text(ctx,shop.website,x,y+70,room,33,soft,font);
 }
}
export async function exportVisitCard(shop:Shop,card:NonNullable<SettingsState['visitCard']>,side:CardSide='front'){
 await document.fonts?.ready;const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;await drawVisitCard(canvas,side,shop,card);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG encoding failed.')),'image/png'));
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.download=`${(shop.shopName||'shop').replace(/[^a-z0-9_-]+/gi,'-')}-visit-card-${side}.png`;link.href=url;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
