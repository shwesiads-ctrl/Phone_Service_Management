import { staffCode } from './staffCode';
import QRCode from 'qrcode';
import type { User, SettingsState } from '../types';
import { imageValidationError } from './imageUpload';
const escape = (value: string) => value.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const trim = (value: string, max: number) => Array.from(value).length>max ? Array.from(value).slice(0,max-1).join('')+'…' : value;
export async function generateCashierCard(user: User, settings: SettingsState, theme: 'blue'|'teal'|'dark'='blue'): Promise<string> {
  if(user.role!=='cashier')throw new Error('Choose a cashier account.');
  const qr=await QRCode.toDataURL(`FIXFLOW:STAFF:${user.id}`,{width:150,margin:1,errorCorrectionLevel:'M'});
  const photo=user.profile_photo?.startsWith('data:image/') && !imageValidationError(user.profile_photo,false) ? user.profile_photo : '';
  const logo=settings.shopLogo?.startsWith('data:image/') && !imageValidationError(settings.shopLogo,false) ? settings.shopLogo : '';
  const initials=escape(Array.from(user.full_name.trim()).slice(0,2).join('').toUpperCase());
  const active=user.active!==false;
  const accent={blue:'#2563eb',teal:'#0f766e',dark:'#17243d'}[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="85.6mm" height="54mm" viewBox="0 0 856 540">
    <defs><clipPath id="photo"><rect x="36" y="190" width="190" height="248" rx="12"/></clipPath></defs>
    <rect width="856" height="540" rx="20" fill="#ffffff"/>
    <path d="M20 0H836Q856 0 856 20V146H0V20Q0 0 20 0Z" fill="${accent}"/>
    ${logo?`<image href="${logo}" x="30" y="28" width="70" height="70"/>`:'<rect x="30" y="28" width="70" height="70" rx="12" fill="#ffffff" opacity="0.18"/><text x="65" y="73" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="25" font-weight="bold">FF</text>'}
    <g font-family="Arial,sans-serif">
      <text x="122" y="49" fill="white" font-size="30" font-weight="bold"${Array.from(settings.shopName || 'FixFlow').length>30?' textLength="686" lengthAdjust="spacingAndGlyphs"':''}>${escape(trim(settings.shopName || 'FixFlow Workshop',48))}</text>
      <text x="122" y="80" fill="#eef2ff" font-size="18"${Array.from(settings.address || '').length>58?' textLength="686" lengthAdjust="spacingAndGlyphs"':''}>${escape(trim(settings.address || 'Add workshop address in Shop Settings',100))}</text>
      <text x="122" y="111" fill="white" font-size="17"${Array.from((settings.phone || '')+' '+(settings.email || '')).length>62?' textLength="686" lengthAdjust="spacingAndGlyphs"':''}>${escape(settings.phone || 'Shop phone not configured')}${settings.email?' · '+escape(settings.email):''}</text>
      <text x="36" y="171" fill="${accent}" font-size="12" font-weight="bold" letter-spacing="2">CASHIER • STAFF IDENTIFICATION</text>
      <rect x="36" y="190" width="190" height="248" rx="12" fill="#eef2ff"/>
      ${photo?`<image href="${photo}" x="36" y="190" width="190" height="248" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/>`:`<text x="131" y="326" text-anchor="middle" font-size="56" fill="${accent}" font-weight="bold">${initials}</text>`}
      <text x="256" y="220" font-size="30" fill="#17243d" font-weight="bold"${Array.from(user.full_name).length>24?' textLength="550" lengthAdjust="spacingAndGlyphs"':''}>${escape(trim(user.full_name,42))}</text>
      <rect x="256" y="238" width="120" height="30" rx="7" fill="${accent}"/><text x="316" y="259" text-anchor="middle" font-size="14" fill="white" font-weight="bold">CASHIER</text>
      <text x="256" y="305" font-size="16" fill="#64748b">STAFF ID</text><text x="256" y="334" font-size="24" fill="#17243d" font-weight="bold">${escape(staffCode(user))}</text>
      <text x="256" y="374" font-size="17" fill="#475569">@${escape(trim(user.username,36))}</text>
      <text x="256" y="406" font-size="16" fill="#475569">Phone: ${escape(trim(user.phone || '—',34))}</text>
      <text x="256" y="434" font-size="13" fill="#475569">${escape(trim(user.email || '',44))}</text>
      <image href="${qr}" x="668" y="350" width="140" height="140"/>
      <line x1="36" y1="467" x2="626" y2="467" stroke="#e2e8f0"/>
      <text x="36" y="496" font-size="14" fill="#64748b">Issued: ${escape(new Date().toLocaleDateString())}</text>
      <text x="36" y="520" font-size="11" fill="#64748b">AUTHORIZED WORKSHOP STAFF</text>
      <text x="810" y="520" text-anchor="end" font-size="15" font-weight="bold" fill="${active?'#059669':'#e11d48'}">${active?'ACTIVE':'INACTIVE'}</text>
    </g>
  </svg>`;

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
