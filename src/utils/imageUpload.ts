export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const allowed = ['image/png', 'image/jpeg', 'image/webp'];
function rasterMime(binary: string): string | null {
  const bytes = Array.from(binary.slice(0,12), c=>c.charCodeAt(0));
  if ([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)) return 'image/png';
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  if(binary.slice(0,4)==='RIFF' && binary.slice(8,12)==='WEBP')return 'image/webp';
  return null;
}
export function imageValidationError(value: unknown, allowUrl=true): string | null {
  if(value===undefined || value==='')return null;
  if(typeof value!=='string')return 'Choose a PNG, JPEG or WebP image.';
  if(allowUrl && /^https?:\/\//i.test(value)) {
    try {const url=new URL(value);if(value.length<=2048 && !url.username && !url.password)return null;}catch{}
    return 'Enter a valid image URL.';
  }
  const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]*={0,2})$/i.exec(value);
  if(!match)return 'Choose a PNG, JPEG or WebP image.';
  if(match[2].length>Math.ceil(MAX_IMAGE_BYTES/3)*4)return 'Image must be 2 MB or smaller.';
  try {const binary=atob(match[2]);if(binary.length>MAX_IMAGE_BYTES)return 'Image must be 2 MB or smaller.';if(rasterMime(binary)!==match[1].toLowerCase())return 'Image content does not match its file type.';}catch{return 'Image data is invalid.';}
  return null;
}
export function readUploadedImage(file: File): Promise<string> {
  if(!file.size || file.size>MAX_IMAGE_BYTES)return Promise.reject(new Error('Choose an image of 2 MB or smaller.'));
  if(file.type && !allowed.includes(file.type))return Promise.reject(new Error('Choose a PNG, JPEG or WebP image.'));
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Image could not be read.'));
    reader.onload=()=>{try{const encoded=String(reader.result).split(',')[1]||'';const mime=rasterMime(atob(encoded));if(!mime)throw new Error('Choose a valid PNG, JPEG or WebP image.');const value=`data:${mime};base64,${encoded}`;const error=imageValidationError(value,false);if(error)throw new Error(error);resolve(value);}catch(error){reject(error);}};
    reader.readAsDataURL(file);
  });
}
