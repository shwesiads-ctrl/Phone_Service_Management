import release from '../config/release.json';
import { DeveloperInfo } from '../components/DeveloperInfo';
import React from 'react';
import { useApp } from '../context/AppContext';
import { Cpu } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { settings, language } = useApp();
  const my = language === 'my';
  const baseSections = [
    [my ? 'ပြုပြင်ရေးလုပ်ငန်း စီမံခန့်ခွဲမှု' : 'Repair workshop management', my ? 'Customer နှင့် Device စာရင်း၊ Service Job လက်ခံခြင်း၊ Technician တာဝန်ပေးခြင်း၊ စစ်ဆေး/ပြုပြင်မှတ်တမ်း၊ အသုံးပြုသည့်ပစ္စည်းနှင့် အာမခံကို တစ်နေရာတည်းတွင် စီမံနိုင်ပါသည်။ စာရင်းရှည်များတွင် page နံပါတ်၊ search နှင့် filter သုံးပြီး ရှာဖွေနိုင်ပါသည်။' : 'Manage customers, devices, service intake, technician assignments, diagnostics, repair history, parts used and warranty details. Numbered pages, search and filters keep long lists manageable.'],
    [my ? 'ပထမဆုံး Admin အကောင့်' : 'First administrator setup', my ? 'မူလ Admin account မသုံးဘဲ Login မှ New User Register ဖြင့် မိမိအကောင့်ကို စတင်ဖွင့်ပါ။ ဖွင့်ပြီးနောက် Register ကို ဖျောက်ထားပြီး မိမိ username / password ဖြင့် Login ဝင်နိုင်ပါသည်။' : 'Create your own first administrator from New User Register on Login. Registration closes after creation; sign in with your chosen username and password.'],
    [my ? 'အကောင့်နှင့် လုပ်ပိုင်ခွင့်' : 'Accounts and responsibilities', my ? 'Admin က ဆိုင်၊ ဝန်ထမ်း၊ ငွေစာရင်းနှင့် setting များကို စီမံနိုင်သည်။ Technician က မိမိတာဝန်ကျအလုပ်များကို ဆောင်ရွက်နိုင်သည်။ Cashier က အလုပ်လက်ခံခြင်း၊ ငွေလက်ခံခြင်းနှင့် receipt ထုတ်ခြင်းကို ဆောင်ရွက်နိုင်သည်။ Account Management မှ လုပ်ပိုင်ခွင့်၊ account status နှင့် password reset စီမံနိုင်သည်။ Cashier profile နှင့် ဓာတ်ပုံပါ ID Card ထုတ်နိုင်ပါသည်။ Receipt ကို JPEG ပုံအဖြစ် သိမ်းနိုင်သည်။' : 'Administrators manage the workshop, staff, finances and settings. Technicians work on assigned repairs. Cashiers handle service intake, collect payments and issue receipts. Account Management controls roles, account status and password resets. Cashier profiles support photos and printable staff ID cards. Save complete receipts as JPEG images.'],
    [my ? 'ငွေပေးချေမှုနှင့် ငွေစာရင်း' : 'Payments and accounting', my ? 'Myanmar၊ Thailand၊ China နှင့် Global payment channel များကို ဆိုင်၏အကောင့်အချက်အလက်ဖြင့် ပြင်ဆင်နိုင်သည်။ Payment QR ကို upload လုပ်နိုင်သည်။ ငွေလက်ခံပြီးကြောင်းကို ဝန်ထမ်းက စစ်ဆေးမှတ်တမ်းတင်ရမည်။ Income၊ Expense၊ payment history နှင့် workload report များကို ကြည့်ရှုနိုင်ပါသည်။' : 'Configure Myanmar, Thailand, China and global payment channels using your workshop’s account details and uploaded payment QR images. Staff verify and record received payments. Review income, expenses, payment history and technician workload reports.'],
    [my ? 'ဘာသာစကားနှင့် ငွေကြေး' : 'Languages and currencies', my ? 'မြန်မာ၊ English၊ Thai နှင့် Chinese ကို ရွေးနိုင်သည်။ ငွေကြေးမှာ Ks (MMK)၊ $ (USD)၊ ฿ (THB) နှင့် ¥ (CNY) ဖြစ်ပြီး စိတ်ကြိုက်ရွေးချယ်နိုင်သည်။ ဘာသာစကားပြောင်းလဲခြင်းကြောင့် ငွေကြေး အလိုအလျောက် မပြောင်းပါ။' : 'Choose Myanmar, English, Thai or Chinese. Select Ks (MMK), $ (USD), ฿ (THB) or ¥ (CNY) independently of language. Currency selection changes the display; it does not perform an exchange-rate conversion.'],
    [my ? 'Backup နှင့် Password Recovery' : 'Backups and password recovery', my ? 'Settings မှ database backup ကို သိမ်းဆည်းပြီး restore လုပ်နိုင်သည်။ Server PC အတွက် Recovery Key ကို သီးခြား backup သိမ်းထားပါ။ Forgot Password တွင် Recovery Key ဖြင့် password အသစ်သတ်မှတ်နိုင်ပြီး recovery အောင်မြင်တိုင်း key အသစ်ပြောင်းပါသည်။ Key အသစ်ကို ထပ်မံသိမ်းဆည်းရန် လိုအပ်သည်။' : 'Save and restore database backups from Settings. Store the server PC’s password recovery key separately. Forgot Password accepts that key to reset an account password. Every successful recovery rotates the key; save the newly issued backup key.'],
    [my ? 'အသုံးပြုပုံ' : 'Running FixFlow', my ? 'Browser မှ local server သို့မဟုတ် LAN မှတစ်ဆင့် အသုံးပြုနိုင်ပြီး Electron desktop အဖြစ်လည်း ဖွင့်နိုင်သည်။ ဆိုင်ဒေတာကို server PC တွင် သိမ်းဆည်းသည်။ Update လုပ်ချိန်တွင် မူလ data/ နှင့် .security/ ကို ထိန်းသိမ်းပါ။ Light၊ Dark နှင့် System theme များကို ရွေးနိုင်သည်။' : 'Use FixFlow in a browser through the local server or LAN, or run the Electron desktop app. Workshop data is stored on the server PC. Preserve your existing data/ directory and its .security/ recovery files when updating. Light, Dark and System themes are available.'],
  ];
  const labels = {
    my: {version:'ဗားရှင်း',tagline:'Local / LAN ဆိုင်စီမံမှု',news:'ယခု Version တွင် ပြောင်းလဲထားသည်များ',workshop:'ဆိုင်အချက်အလက်',name:'ဆိုင်အမည်',phone:'ဖုန်း',email:'အီးမေးလ်',address:'လိပ်စာ'},
    en: {version:'Version',tagline:'Local & LAN Workshop Management',news:'What’s new in this version',workshop:'Workshop information',name:'Workshop',phone:'Phone',email:'Email',address:'Address'},
    th: {version:'เวอร์ชัน',tagline:'จัดการร้านผ่านระบบภายในและ LAN',news:'มีอะไรใหม่ในเวอร์ชันนี้',workshop:'ข้อมูลร้าน',name:'ชื่อร้าน',phone:'โทรศัพท์',email:'อีเมล',address:'ที่อยู่'},
    zh: {version:'版本',tagline:'本地及局域网维修店管理',news:'此版本更新内容',workshop:'店铺信息',name:'店铺名称',phone:'电话',email:'电子邮件',address:'地址'},
  }[language];
  const translatedSections = {
    th: [
      ['จัดการงานซ่อม','จัดการลูกค้า อุปกรณ์ งานรับซ่อม การมอบหมายช่าง ประวัติการซ่อม อะไหล่ และการรับประกัน ค้นหาและแบ่งหน้าได้เมื่อรายการเพิ่มขึ้น'],
      ['ตั้งค่าผู้ดูแลระบบคนแรก','สร้างบัญชีผู้ดูแลระบบของคุณจากการลงทะเบียนบนหน้าเข้าสู่ระบบ เมื่อสร้างแล้วระบบจะซ่อนการลงทะเบียน ใช้ชื่อผู้ใช้และรหัสผ่านที่คุณตั้งไว้'],
      ['บัญชีและหน้าที่','ผู้ดูแลระบบจัดการร้าน พนักงาน การเงิน และการตั้งค่า ช่างดูแลงานที่ได้รับมอบหมาย แคชเชียร์รับงาน รับชำระเงิน และออกใบเสร็จ จัดการบทบาทและสถานะผ่านการจัดการบัญชี สร้างบัตรพนักงานพร้อมรูปและบันทึกใบเสร็จเป็น JPEG ได้'],
      ['การชำระเงินและบัญชี','เลือกโปรไฟล์เมียนมา ไทย จีน หรือสากลได้เอง โดยไม่ขึ้นกับภาษา อัปโหลด QR ของร้านและกำหนดช่องทางชำระเงิน พนักงานต้องตรวจสอบการรับเงินจริง ดูรายรับ รายจ่าย และรายงานได้'],
      ['ภาษาและสกุลเงิน','รองรับเมียนมา อังกฤษ ไทย และจีน ผู้ดูแลระบบเลือก Ks, US $, B ฿ หรือ Y ¥ จากแถบด้านบน ภาษาไม่เปลี่ยนสกุลเงินหรือโปรไฟล์การชำระเงิน และไม่มีการแปลงอัตราแลกเปลี่ยนอัตโนมัติ'],
      ['สำรองข้อมูลและกู้คืนรหัสผ่าน','สำรองและกู้คืนฐานข้อมูลจากการตั้งค่า เก็บคีย์กู้คืนของคอมพิวเตอร์เซิร์ฟเวอร์ไว้แยกต่างหาก ใช้คีย์ในหน้าลืมรหัสผ่าน เมื่อกู้คืนสำเร็จคีย์จะเปลี่ยน ต้องบันทึกคีย์ใหม่'],
      ['ใช้งาน FixFlow','ใช้งานผ่านเบราว์เซอร์บนเครื่องหรือ LAN หรือแอป Electron เก็บโฟลเดอร์ data/ และ .security/ เดิมไว้เมื่ออัปเดต เลือกธีมสว่าง มืด หรือตามระบบได้ PHP CLI เป็นตัวเลือกและต้องมีเซิร์ฟเวอร์ Node ทำงานอยู่'],
    ],
    zh: [
      ['维修业务管理','管理客户、设备、维修接单、技师分配、维修历史、零件和保修。列表支持搜索、筛选和分页。'],
      ['首次管理员设置','在登录页注册自己的首个管理员账户。创建后注册入口会隐藏，使用自己设置的用户名和密码登录。'],
      ['账户与职责','管理员管理店铺、员工、财务和设置。技师处理分配的维修任务。收银员负责接单、收款和开具收据。账户管理支持角色、状态和密码重置。可生成带照片的员工证并将收据保存为 JPEG。'],
      ['支付与账目','自行选择缅甸、泰国、中国或全球支付配置，不随语言变化。上传店铺真实支付二维码并设置渠道。员工需核实实际到账；可查看收入、支出和工作量报告。'],
      ['语言与货币','支持缅甸语、英语、泰语和中文。管理员可在顶部栏选择 Ks、US $、B ฿ 或 Y ¥。语言变化不会切换货币或支付配置；不会自动进行汇率换算。'],
      ['备份与密码恢复','在设置中备份和恢复数据库。单独保管服务器电脑的恢复密钥。在忘记密码页面使用密钥；每次成功恢复后密钥会更换，请保存新密钥。'],
      ['使用 FixFlow','通过本机或局域网浏览器访问，也可运行 Electron 桌面应用。升级时保留现有 data/ 和 .security/。可选择浅色、深色或跟随系统。PHP CLI 为可选功能，需要 Node 服务器同时运行。'],
    ],
  };
  const sections = language==='th'||language==='zh'?translatedSections[language]:baseSections;
  return <div className="max-w-4xl mx-auto space-y-5 pb-16">
    <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex items-center gap-3"><Cpu className="w-9 h-9 text-[var(--primary)]" /><div><h1 className="text-2xl font-bold">FixFlow Repair & Service Manager</h1><p className="text-xs text-[var(--text-muted)]">{labels.version} {release.version} · {release.date} · {labels.tagline}</p></div></div>
      <p className="mt-4 text-sm text-[var(--text-muted)]">{language==='th'?'ระบบจัดการร้านซ่อมโทรศัพท์และอุปกรณ์ ตั้งแต่รับงานจนถึงชำระเงินและรายงาน':language==='zh'?'面向手机和设备维修店的管理系统，涵盖接单、维修跟踪、收款和报表。':my ? 'ဖုန်းနှင့် စက်ပစ္စည်း ပြုပြင်ရေးဆိုင်များအတွက် အလုပ်လက်ခံခြင်းမှ ငွေလက်ခံခြင်းအထိ နေ့စဉ်လုပ်ငန်းများကို စီမံရန် အသုံးပြုနိုင်သည့် စနစ်။' : 'A workshop management system for phone and device repair businesses, from service intake and repair tracking to payments and reporting.'}</p>
    </div>
    <section className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]"><h2 className="font-bold mb-3">{labels.news}</h2><ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-muted)]">{release.changes[language].map(change=><li key={change}>{change}</li>)}</ul></section>
    <DeveloperInfo />
    {sections.map(([title, description]) => <section key={title} className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]"><h2 className="font-bold mb-2">{title}</h2><p className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</p></section>)}
    <section className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]"><h2 className="font-bold mb-3">{labels.workshop}</h2><dl className="grid sm:grid-cols-2 gap-3 text-sm">{[[labels.name, settings.shopName], [labels.phone, settings.phone], [labels.email, settings.email], [labels.address, settings.address]].map(([label, value]) => <div key={label}><dt className="text-[var(--text-muted)] text-xs">{label}</dt><dd className="break-words">{value || '—'}</dd></div>)}</dl><p className="mt-4 text-xs text-[var(--text-muted)]">React · TypeScript · Express · Electron</p></section>
  </div>;
};
