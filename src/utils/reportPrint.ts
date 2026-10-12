/** Print only the report sheet, with normal document flow instead of a clipped modal. */
export function printReport(element:HTMLElement,title='FixFlow Report',orientation:'portrait'|'landscape'='portrait'):HTMLIFrameElement {
  const frame=document.createElement('iframe');frame.title='Report print';frame.style.cssText='position:fixed;width:0;height:0;border:0;right:0;bottom:0';document.body.appendChild(frame);
  const doc=frame.contentDocument,win=frame.contentWindow;
  if(!doc||!win){frame.remove();throw new Error('Printing is unavailable in this browser.');}
  const clone=element.cloneNode(true) as HTMLElement;
  clone.classList.remove('hidden');clone.style.cssText='display:block;position:static;height:auto;max-height:none;overflow:visible;padding:0;margin:0;width:100%;max-width:none';
  clone.querySelectorAll('button,input,select,[aria-label="Pagination"],.no-print').forEach(node=>node.remove());
  doc.documentElement.setAttribute('data-theme','light');doc.title=title;
  for(const sheet of Array.from(document.querySelectorAll<HTMLLinkElement|HTMLStyleElement>('link[rel=stylesheet],style'))){const copy=sheet.cloneNode(true) as HTMLLinkElement|HTMLStyleElement;if(copy.tagName==='LINK')(copy as HTMLLinkElement).href=(sheet as HTMLLinkElement).href;doc.head.appendChild(copy);}
  const style=doc.createElement('style');style.textContent=`
    @page{size:A4 ${orientation};margin:12mm}
    html,body{background:white!important;color:#111827!important;margin:0;padding:0;font-family:Arial,sans-serif;font-size:10pt;color-scheme:light}
    *{box-shadow:none!important;text-shadow:none!important;max-height:none!important;overflow:visible!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    table{width:100%;border-collapse:collapse;font-size:9pt;table-layout:auto}
    th,td{padding:5px 6px!important;border-bottom:1px solid #e2e8f0;font-size:inherit;white-space:normal!important;text-overflow:clip!important;overflow-wrap:break-word;word-break:normal!important;vertical-align:top}
    thead{display:table-header-group;background:#f1f5f9!important;color:#111827!important}
    tfoot{display:table-row-group;break-inside:avoid}
    tr{break-inside:avoid;page-break-inside:avoid}h1,h2,h3{break-after:avoid}p{orphans:2;widows:2}
    .report-group-heading{break-after:avoid}.report-group{break-inside:auto}
    [class*="text-right"]{text-align:right}[class*="text-center"]{text-align:center}
  `;doc.head.appendChild(style);doc.body.appendChild(clone);
  let printed=false;
  const launch=async()=>{if(printed||!frame.isConnected)return;printed=true;await Promise.race([doc.fonts?.ready || Promise.resolve(),new Promise(resolve=>window.setTimeout(resolve,3000))]);await Promise.all(Array.from(doc.images).map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.onload=resolve;image.onerror=resolve;window.setTimeout(resolve,2000);})));if(!frame.isConnected)return;win.addEventListener('afterprint',()=>frame.remove(),{once:true});win.focus();win.print();};
  const links=Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]'));
  Promise.all(links.map(link=>link.sheet?Promise.resolve():new Promise(resolve=>{link.onload=resolve;link.onerror=resolve;window.setTimeout(resolve,3000);}))).then(launch);
  window.setTimeout(()=>frame.remove(),120000);return frame;
}

export function createReportSheet(shopName:string,title:string,subtitle:string,headers:string[],rows:(string|number|undefined)[][]):HTMLDivElement {
  const sheet=document.createElement('div');
  for(const [tag,text] of [['h1',shopName],['h2',title],['p',subtitle]]){const element=document.createElement(tag);element.textContent=text;sheet.appendChild(element);}
  const table=document.createElement('table'),head=document.createElement('thead'),body=document.createElement('tbody'),heading=document.createElement('tr');
  for(const label of headers){const cell=document.createElement('th');cell.textContent=label;heading.appendChild(cell);}head.appendChild(heading);
  for(const values of rows){const row=document.createElement('tr');for(const value of values){const cell=document.createElement('td');cell.textContent=String(value ?? '—');row.appendChild(cell);}body.appendChild(row);}
  table.append(head,body);sheet.appendChild(table);return sheet;
}
