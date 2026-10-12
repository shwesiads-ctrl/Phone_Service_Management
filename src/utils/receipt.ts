/** Standalone receipts carry their own styles and contain only the rendered receipt body. */
export const receiptStyles = `
*{box-sizing:border-box}body{margin:0;background:#eef2f7;color:#182439;font-family:Arial,sans-serif;font-size:13px;line-height:1.5}
.receipt{color:#182439;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;margin:20px auto;padding:28px;background:white;max-width:740px;border-radius:12px}
.receipt-header{text-align:center;border-bottom:2px solid #182439;padding-bottom:16px;margin-bottom:16px}.receipt-header img{width:64px;height:64px;object-fit:contain}.receipt-header h1{font-weight:700;font-size:22px;margin:4px 0}.receipt-header p{margin:3px 0;font-size:12px;overflow-wrap:anywhere}
.receipt-title{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:16px 0}.receipt-title h2{font-weight:700;font-size:18px;margin:0}.receipt-title strong{font-family:monospace;color:#235ac3}
.receipt-details{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.receipt-details div{overflow-wrap:anywhere}.receipt-label{font-size:10px;text-transform:uppercase;color:#64748b;display:block;font-weight:bold}.receipt-note{padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:12px 0;white-space:pre-wrap;overflow-wrap:anywhere}
.receipt table{width:100%;border-collapse:collapse;font-size:12px;margin:16px 0}.receipt th,.receipt td{text-align:left;padding:8px 5px;border-bottom:1px solid #e2e8f0;overflow-wrap:anywhere;vertical-align:top}.receipt th{background:#f1f5f9;font-size:10px}.receipt .amount{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.receipt-total{font-size:15px;font-weight:bold}.receipt-total td{border-top:2px solid #182439}.receipt-footer{font-size:11px;text-align:center;border-top:1px dashed #94a3b8;margin-top:20px;padding-top:14px;white-space:pre-wrap;overflow-wrap:anywhere}.receipt-signatures{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:32px;font-size:10px;text-align:center}.receipt-signatures span{display:block;border-top:1px solid #94a3b8;padding-top:6px}
.receipt-thermal{max-width:302px;padding:12px;font-size:11px}.receipt-thermal .receipt-header h1{font-size:17px}.receipt-thermal .receipt-title{display:block}.receipt-thermal .receipt-details{grid-template-columns:1fr;gap:8px}.receipt-thermal table{font-size:10px}.receipt-thermal th,.receipt-thermal td{padding:6px 2px}.receipt-thermal .receipt-payments td{white-space:normal}.receipt-thermal .receipt-title h2{font-size:15px}
.receipt-actions{text-align:center;padding:12px}.receipt-actions button{background:#235ac3;color:white;padding:10px 16px;border:0;border-radius:8px;cursor:pointer}
@media print{body{background:white}.receipt{margin:0 auto;border-radius:0;padding:10mm;width:100%;max-width:none}.receipt-thermal{padding:3mm;width:80mm;max-width:80mm}.receipt-actions{display:none}tr{break-inside:avoid}thead{display:table-header-group}.receipt-header,.receipt-footer{break-inside:avoid}}
`;
export function receiptDocument(body: string, paperSize: 'A4' | '80mm') {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FixFlow Receipt</title><style>${receiptStyles}@page{size:${paperSize === '80mm' ? '80mm 297mm' : 'A4'};margin:${paperSize === '80mm' ? '0' : '10mm'}}</style></head><body><div class="receipt-actions"><button onclick="window.print()">Print / Save PDF</button></div>${body}</body></html>`;
}
export async function receiptJpeg(element: HTMLElement, paperSize: 'A4' | '80mm'): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas');
  await document.fonts?.ready;
  const host = document.createElement('div');
  host.style.cssText = `position:absolute;left:-100000px;top:0;width:${paperSize === '80mm' ? 302 : 794}px;background:white;color:#182439;`;
  const style=document.createElement('style');style.textContent=receiptStyles.replace(/body\{[^}]*\}/g, '');host.appendChild(style);
  const clone=element.cloneNode(true) as HTMLElement;
  clone.style.margin='0';clone.style.borderRadius='0';clone.style.maxWidth='none';host.appendChild(clone);document.body.appendChild(host);
  try {
    const canvas=await html2canvas(clone,{scale:2,backgroundColor:'#ffffff',useCORS:true,allowTaint:false,logging:false,windowWidth:1024,windowHeight:Math.max(1024,clone.scrollHeight)});
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob ? resolve(blob) : reject(new Error('Receipt image could not be created.')), 'image/jpeg', 0.95));
  } finally {host.remove();}
}
export async function saveReceipt(element: HTMLElement, serviceNumber: string, paperSize: 'A4' | '80mm') {
  const blob = await receiptJpeg(element,paperSize);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');link.href=url;link.download=`FixFlow-Receipt-${serviceNumber.replace(/[^A-Za-z0-9_-]/g,'_')}.jpg`;
  document.body.appendChild(link);link.click();link.remove();window.setTimeout(() => URL.revokeObjectURL(url),1000);
}
export function printReceipt(body: string, paperSize: 'A4' | '80mm') {
  const frame=document.createElement('iframe');frame.title='Receipt print';frame.style.cssText='position:fixed;width:0;height:0;border:0;right:0;bottom:0';document.body.appendChild(frame);
  const doc=frame.contentDocument,win=frame.contentWindow;
  if(!doc || !win){frame.remove();throw new Error('Printing is unavailable. Save the receipt and print the downloaded file.');}
  let printed=false;
  const launch=()=>{if(printed || !frame.isConnected)return;printed=true;if(paperSize==='80mm'){const style=doc.createElement('style');style.textContent=`@page{size:80mm ${Math.ceil((doc.querySelector('.receipt')?.scrollHeight || 1024)*25.4/96)+6}mm;margin:0}`;doc.head.appendChild(style);}win.addEventListener('afterprint',()=>frame.remove(),{once:true});win.focus();win.print();};
  frame.onload=async()=>{
    const images=Array.from(doc.images);
    await Promise.all(images.map(image=>image.complete ? Promise.resolve() : new Promise<void>(resolve=>{image.onload=()=>resolve();image.onerror=()=>resolve();window.setTimeout(resolve,3000);})));launch();
  };
  doc.open();doc.write(receiptDocument(body,paperSize));doc.close();
  window.setTimeout(launch,4000);window.setTimeout(()=>frame.remove(),60000);
}
