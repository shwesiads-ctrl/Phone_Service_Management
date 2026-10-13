import type {SettingsState} from '../types';

type Shop=Pick<SettingsState,'shopName'|'shopLogo'|'address'|'phone'|'secondaryPhone'|'email'|'website'>;
export async function exportVisitCard(shop:Shop,card:NonNullable<SettingsState['visitCard']>){
 const canvas=document.createElement('canvas');canvas.width=1712;canvas.height=1080;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable.');
 const w=canvas.width,h=canvas.height,color=card.color,design=card.design,light=[1,2,5,6,7,9].includes(design),ink=light?'#172238':'#ffffff',muted=light?'#475569':'#e2e8f0';
 ctx.fillStyle=light?'#ffffff':design===10?'#101827':color;ctx.fillRect(0,0,w,h);
 if(design===4){ctx.fillStyle='#111827';ctx.beginPath();ctx.moveTo(w*.43,0);ctx.lineTo(w,0);ctx.lineTo(w,h);ctx.lineTo(w*.43,h);ctx.fill();}
 if(design===8){ctx.fillStyle='#111827';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);ctx.lineTo(w*.6,h);ctx.lineTo(0,h);ctx.fill();}
 if(design===2){ctx.fillStyle=color;ctx.fillRect(0,0,45,h);}if(design===3){ctx.fillStyle=color;ctx.fillRect(0,0,w,85);}
 if(design===9){ctx.fillStyle=color;ctx.fillRect(0,h-65,w,65);}
 if(design===5){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w-290,0);ctx.lineTo(w,290);ctx.fill();}
 if(design===6){ctx.strokeStyle=color;ctx.lineWidth=22;ctx.strokeRect(11,11,w-22,h-22);}
 const font=`'${card.font}',Arial,sans-serif`;const center=design===7;ctx.textAlign=center?'center':'left';ctx.textBaseline='top';
 const x=center?w/2:140,logoX=center?w/2-360:140;
 if(shop.shopLogo?.startsWith('data:image/')){const logo=new Image();logo.src=shop.shopLogo;try{await logo.decode();ctx.fillStyle='#ffffff';ctx.fillRect(logoX,130,180,180);ctx.drawImage(logo,logoX+8,138,164,164);}catch{/* Continue with the shop name if an old logo cannot be decoded. */}}
 else {ctx.fillStyle=light?color:'#ffffff';ctx.fillRect(logoX,130,180,180);ctx.fillStyle=light?'#ffffff':color;ctx.font=`bold 92px ${font}`;ctx.textAlign='center';ctx.fillText((shop.shopName||'S').slice(0,1).toUpperCase(),logoX+90,171);ctx.textAlign=center?'center':'left';}
 const nameX=center?w/2:350;ctx.fillStyle=ink;ctx.font=`bold 70px ${font}`;const name=shop.shopName||'Shop name';ctx.fillText(name,nameX,160,center?1000:1200);
 if(shop.website){ctx.font=`32px ${font}`;ctx.fillStyle=muted;ctx.fillText(shop.website,nameX,245,center?1050:1150);}
 const details=[shop.address||'Shop address',[shop.phone||'Phone',shop.secondaryPhone].filter(Boolean).join(' · '),shop.email||''];
 ctx.fillStyle=ink;ctx.font=`39px ${font}`;let y=610;for(const item of details){if(!item)continue;for(const line of wrap(ctx,item,center?1350:1430)){ctx.fillText(line,x,y,center?1350:1430);y+=53;}}
 const social=Object.entries(card.social||{}).filter(([,value])=>value?.trim()).map(([key,value])=>`${key==='other'?'Social':key.toUpperCase()}: ${value}`);ctx.font=`30px ${font}`;ctx.fillStyle=muted;y=Math.max(y+18,845);for(const item of social){for(const line of wrap(ctx,item,center?1350:1430)){if(y>1030)break;ctx.fillText(line,x,y,center?1350:1430);y+=38;}}
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG encoding failed.')),'image/png'));
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.download=`${(shop.shopName||'shop').replace(/[^a-z0-9_-]+/gi,'-')}-visit-card.png`;link.href=url;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function wrap(ctx:CanvasRenderingContext2D,value:string,maxWidth:number){const lines:string[]=[];for(const paragraph of value.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);}return lines;}
