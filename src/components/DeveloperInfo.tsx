import React from 'react';
import { useApp } from '../context/AppContext';
import { developer } from '../config/developer';
export function DeveloperInfo() {
  const {language}=useApp();const my=language==='my';
  return <section className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
    <div><h2 className="font-bold">{my ? 'Developer နှင့် စိတ်ကြိုက်ပြင်ဆင်မှု' : 'Developer & Customization Services'}</h2><p className="text-xl font-bold mt-2">{developer.name}</p><p className="text-xs text-[var(--text-muted)]">FixFlow Developer & Maintainer</p></div>
    <dl className="grid sm:grid-cols-3 gap-3 text-sm">{[['Telegram',developer.telegram,developer.telegramUrl],['Email',developer.email,`mailto:${developer.email}`],['WhatsApp',developer.whatsapp,developer.whatsappUrl]].map(([label,value,href])=><div key={label}><dt className="text-xs text-[var(--text-muted)]">{label}</dt><dd><a href={href} target={label==='Email'?undefined:'_blank'} rel="noopener noreferrer" className="text-[var(--primary)] hover:underline break-all">{value}</a></dd></div>)}</dl>
    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{my ? 'ဆိုင်လုပ်ငန်းအလိုက် စိတ်ကြိုက် feature ထည့်ခြင်း၊ UI ပြင်ဆင်ခြင်း၊ receipt / ID card ပုံစံပြောင်းခြင်း၊ payment channel နှင့် report ပြင်ဆင်ခြင်း၊ LAN setup နှင့် အသုံးပြုနည်းအကူအညီအတွက် ဆက်သွယ်နိုင်ပါသည်။ လိုအပ်သည့်လုပ်ဆောင်ချက်၊ အသုံးပြုမည့်စက်နှင့် နမူနာပုံစံကို ပေးပို့ပြီး အသေးစိတ်ညှိနှိုင်းနိုင်ပါသည်။' : 'Contact the developer for workshop-specific features, UI changes, receipt and ID card layouts, payment channels, reports, LAN setup and usage support. Share the required workflow, devices and a sample layout to discuss scope and delivery.'}</p>
  </section>;
}
