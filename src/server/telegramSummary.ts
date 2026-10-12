import type {ServiceJob,ServicePayment,SettingsState,TelegramBotConfig,Language} from '../types';
import {escapeTelegramHtml} from './telegram';
export function localDay(date:Date,timeZone='Asia/Yangon'):string {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const part=(name:string)=>parts.find(part=>part.type===name)!.value;return `${part('year')}-${part('month')}-${part('day')}`;
}
export function summaryDue(config:TelegramBotConfig,now=new Date()):boolean {
  if(!config.enabled||!config.daily_summary_schedule_enabled||!config.notify_on_daily_summary||!config.bot_token||!config.chat_id)return false;
  const zone=config.summary_time_zone || 'Asia/Yangon';
  const current=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
  return current>=(config.daily_summary_time || '18:00')&&config.last_daily_summary_attempt!==localDay(now,zone);
}
export function buildTelegramSummary(jobs:ServiceJob[],payments:ServicePayment[],settings:SettingsState,date:string,timeZone='Asia/Yangon',language:Language='en') {
  const onDate=(value?:string)=>{if(!value)return false;const stamp=new Date(value);return Number.isFinite(stamp.getTime())&&localDay(stamp,timeZone)===date;};
  const active=jobs.filter(job=>!['completed','delivered','cancelled'].includes(job.status_id)).length;
  const ready=jobs.filter(job=>job.status_id==='ready').length;
  const completed=jobs.filter(job=>onDate(job.completed_at)).length;
  const received=payments.filter(payment=>!payment.is_deleted&&onDate(payment.paid_at));
  const totals:Record<string,number>={};for(const payment of received){const code=payment.currency_code || settings.currency;totals[code]=(totals[code] || 0)+Number(payment.amount || 0);}
  const labels={en:['Daily Workshop Summary','Date','Active repairs','Ready for pickup','Completed today','Payments collected'],my:['နေ့စဉ်ဆိုင်လုပ်ငန်း အနှစ်ချုပ်','ရက်စွဲ','ပြုပြင်နေဆဲအလုပ်','လာယူရန်အသင့်','ယနေ့ပြီးစီးမှု','လက်ခံရရှိငွေ'],th:['สรุปงานประจำวัน','วันที่','งานซ่อมที่ดำเนินอยู่','พร้อมรับคืน','เสร็จวันนี้','ยอดรับชำระ'],zh:['店铺日报','日期','在修任务','可取件','今日完成','收款']}[language];
  const collected=Object.entries(totals).map(([code,amount])=>`${escapeTelegramHtml(code)} ${amount.toLocaleString()}`).join(', ') || '0';
  const html=`📊 <b>${escapeTelegramHtml(settings.shopName || 'FixFlow')} — ${labels[0]}</b>\n📅 ${labels[1]}: ${date} (${escapeTelegramHtml(timeZone)})\n\n• ${labels[2]}: ${active}\n• ${labels[3]}: ${ready}\n• ${labels[4]}: ${completed}\n• ${labels[5]}: ${collected} (${received.length})`;
  return {html,summary:{date,time_zone:timeZone,active_jobs:active,ready_jobs:ready,completed_today:completed,revenue_today:totals[settings.currency] || 0,revenue_by_currency:totals,transactions:received.length}};
}
