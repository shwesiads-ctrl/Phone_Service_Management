import QRCode from 'qrcode';
import type { User, SettingsState } from '../types';
import { imageValidationError } from './imageUpload';
const escape = (value: string) => value.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const trim = (value: string, max: number) => Array.from(value).length>max ? Array.from(value).slice(0,max-1).join('')+'…' : value;
export async function generateCashierCard(user: User, settings: SettingsState): Promise<string> {
  if(user.role!=='cashier')throw new Error('Choose a cashier account.');
  const qr=await QRCode.toDataURL(`FIXFLOW:STAFF:${user.id}`,{width:150,margin:1,errorCorrectionLevel:'M'});
  const photo=user.profile_photo?.startsWith('data:image/') && !imageValidationError(user.profile_photo,false) ? user.profile_photo : '';
  const logo=settings.shopLogo?.startsWith('data:image/') && !imageValidationError(settings.shopLogo,false) ? settings.shopLogo : '';
  const initials=escape(Array.from(user.full_name.trim()).slice(0,2).join('').toUpperCase());
  const active=user.active!==false;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="85.6mm" height="54mm" viewBox="0 0 856 540">
  <defs><clipPath id="photo"><rect x="36" y="126" width="180" height="224" rx="14"/></clipPath></defs>
  <rect width="856" height="540" rx="20" fill="#f8fafc"/><rect width="856" height="88" fill="#14213b"/>
  ${logo?`<image href="${logo}" x="28" y="20" width="48" height="48"/>`:'<rect x="28" y="20" width="48" height="48" rx="12" fill="#347af6"/><text x="52" y="51" text-anchor="middle" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">FF</text>'}
  <g font-family="Arial, sans-serif"><text x="94" y="47" fill="white" font-size="25" font-weight="bold"${Array.from(settings.shopName || 'FixFlow').length>28?' textLength="710" lengthAdjust="spacingAndGlyphs"':''}>${escape(trim(settings.shopName || 'FixFlow',40))}</text><text x="94" y="68" fill="#b9cceb" font-size="13">FixFlow · Staff Identification Card</text>
  <rect x="36" y="126" width="180" height="224" rx="14" fill="#dbeafe"/>
  ${photo?`<image href="${photo}" x="36" y="126" width="180" height="224" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/>`:`<text x="126" y="255" text-anchor="middle" font-size="52" fill="#2563eb" font-weight="bold">${initials}</text>`}
  <text x="242" y="165" font-size="29" fill="#17243d" font-weight="bold"${Array.from(user.full_name).length>20?' textLength="560" lengthAdjust="spacingAndGlyphs"':''}>${escape(trim(user.full_name,31))}</text>
  <rect x="242" y="190" width="116" height="31" rx="7" fill="#dbeafe"/><text x="300" y="211" text-anchor="middle" font-size="15" fill="#2563eb" font-weight="bold">CASHIER</text>
  <text x="242" y="260" font-size="18" fill="#475569">@${escape(user.username)}</text>
  <text x="242" y="296" font-size="16" fill="#475569">Phone: ${escape(trim(user.phone || '—',35))}</text>
  <text x="242" y="329" font-size="15" fill="#475569">${escape(trim(user.email || '',42))}</text>
  <text x="242" y="366" font-size="12" fill="#64748b">Staff ID: ${escape(user.id)}</text>
  <text x="242" y="397" font-size="13" fill="#64748b">Issued: ${escape(new Date().toLocaleDateString())}</text>
  <image href="${qr}" x="665" y="343" width="140" height="140"/>
  <rect y="488" width="856" height="52" fill="#14213b"/><text x="36" y="520" font-size="14" fill="#cbd5e1">${escape(trim(settings.phone || 'FixFlow',38))}</text>
  <text x="810" y="520" text-anchor="end" font-size="15" font-weight="bold" fill="${active?'#34d399':'#fda4af'}">${active?'ACTIVE':'INACTIVE'}</text></g></svg>`;
}
export function downloadCashierCard(svg: string, username: string) {
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`FixFlow-Cashier-${username.replace(/[^a-z0-9_-]/gi,'_')}.svg`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function printCashierCard(svg: string) {
  const frame=document.createElement('iframe');frame.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(frame);
  const documentFrame=frame.contentDocument,windowFrame=frame.contentWindow;
  if(!documentFrame || !windowFrame){frame.remove();throw new Error('Printing is unavailable in this browser. Download the card to print it.');}
  documentFrame.title='FixFlow Cashier ID Card';
  const style=documentFrame.createElement('style');style.textContent='@page{size:85.6mm 54mm;margin:0}body{margin:0}img{width:85.6mm;height:54mm;display:block}';documentFrame.head.appendChild(style);
  const image=documentFrame.createElement('img');image.alt='Cashier ID Card';
  image.onload=()=>{windowFrame.addEventListener('afterprint',()=>frame.remove(),{once:true});windowFrame.focus();windowFrame.print();};
  image.onerror=()=>frame.remove();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);documentFrame.body.appendChild(image);
  window.setTimeout(()=>frame.remove(),60000);
}
