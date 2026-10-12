# ပြင်ဆင်ချက်များ

- Password ပြောင်း/Reset ပြီးနောက် မူလ password အညွှန်းကို Login နှင့် Settings မှ အလိုအလျောက်ဖျောက်သည်။ Server restart ပြီးလည်း ထိန်းထားသည်။ အခြား LAN client များတွင် focus ပြန်ရချိန် သို့မဟုတ် 15 စက္ကန့်အတွင်း ပြန်စစ်သည်။
- Technician Management တွင် Demo User ထည့်/ဖျက်နိုင်သည်။ demo_tech / tech123 ကို စတင်အသုံးပြုနိုင်သည်။ Demo လို့ မှတ်ထားသော account များသာ ဖျက်သည်။ Repair job ချိတ်ထားလျှင် အရင် ပြန်လွှဲရမည်။
- Desktop app ပိတ်ချိန် Cancel/Close confirmation ပြသည်။ Browser တွင် login ဝင်ထားချိန် browser ၏ ပုံမှန် leave-page confirmation ကို အသုံးပြုသည်။ Refresh လုပ်ချိန်လည်း ပြနိုင်သည်။
- မူလ payment profile များမှ sample beneficiary အချက်အလက်များကို ဖယ်ထားသည်။ Cash မှလွဲ၍ ဆိုင်၏ အမှန်တကယ် account/QR ဖြည့်ပြီး enable လုပ်ပါ။ လက်ရှိ data မှ seed နှင့် တူညီသော sample payment 13 ခုကို ဖယ်ပြီး ပိတ်ထားသည်။ ပြင်ဆင်ထားသော custom payment အချက်အလက်ကို ထိန်းထားသည်။

မူရင်း customer၊ repair၊ finance၊ user data နှင့် historical backup များကို ထိန်းထားသည်။ ယခင်ဆိုင် data အသစ်များရှိလျှင် ထို data/ folder ကိုပဲ ဆက်သုံးပါ။

စတင်ရန် Node.js 22.12+ ဖြင့် npm ci, npm run build, npm run start:production ကို အစဉ်လိုက် လုပ်ပါ။

စစ်ဆေးမှု: TypeScript PASS၊ existing tests 217 PASS၊ new HTTP tests 22 PASS၊ UI interaction နှင့် desktop confirmation tests PASS၊ desktop server bundle PASS။ Windows installer/GUI ကို တိုက်ရိုက်မစမ်းထားပါ။

GitHub ထုတ်ဝေသည့် copy တွင် Telegram bot token များကို ဖယ်ပြီး connection ပိတ်ထားသည်။ Telegram Settings တွင် ကိုယ်ပိုင် token ကို ပြန်ထည့်ပါ။ မူရင်း local data copy ကို မပြောင်းထားပါ။

## Customer ချိတ်ထားသော data ဖျက်ခြင်း

Customers စာမျက်နှာတွင် ဖျက်ရန် button သို့မဟုတ် Delete Selected ကိုနှိပ်ပါ။ Device၊ repair job၊ parts၊ payment၊ linked income နှင့် notification အရေအတွက်များကို ပြမည်။ Checkbox ဖြင့် အတည်ပြုပြီး ချိတ်ထားသော Data အပါအဝင် ဖျက်မည် ကိုနှိပ်ပါ။ အရင် data/backups/ တွင် full safety backup သိမ်းသည်။ အခြား customer၊ user၊ expense၊ settlement history နှင့် audit logs ကို ထိန်းထားသည်။

အရင် linked-customer error ကို ဒီ confirmation flow ဖြင့် ဖြေရှင်းထားသည်။ ကိုယ်တိုင် delete လုပ်မှသာ data ဖျက်သည်။ Update တင်ခြင်းက သင့်လက်ရှိ data ကို အလိုအလျောက် မဖျက်ပါ။

## Language၊ Currency၊ Cashier နှင့် Password Recovery

- Language: မြန်မာ၊ English၊ Thai၊ Chinese လေးမျိုးပဲ ကျန်သည်။
- Currency: Ks/MMK၊ $/USD၊ ฿/THB၊ ¥/CNY (တရုတ်ယွမ်) လေးမျိုးကို Settings → Currency တွင် စိတ်ကြိုက်ရွေးပါ။ Language နှင့် auto ချိတ်ထားခြင်းကို ဖယ်ထားသည်။ ယခင် transactions ၏ currency နှင့် amount မပြောင်းပါ။
- Admin sidebar → Cashier Accounts တွင် လက်ခံဝန်ထမ်းအကောင့် ထည့်နိုင်သည်။ Cashier က service လက်ခံခြင်း၊ payment လက်ခံခြင်း၊ receipt ထုတ်ခြင်း လုပ်နိုင်သည်။ Staff/Settings/Data ဖျက်ခြင်း မလုပ်နိုင်ပါ။
- Server PC တစ်လုံးအတွက် recovery key တစ်ခုကို ပထမဆုံး run ချိန် auto ထုတ်သည်။ App ပြန်ဖွင့်ရုံဖြင့် မပြောင်းပါ။ Settings → Security တွင် လက်ရှိ Admin password ဖြည့်ပြီး Backup Key Download လုပ်ကာ သီးသန့်သိမ်းပါ။
- Login → Forgot Password တွင် Username၊ လက်ရှိ Recovery Key၊ Password အသစ်နှစ်ကြိမ် ဖြည့်ပါ။ Recovery အောင်မြင်ပြီးတိုင်း key အဟောင်းကို ပယ်ပြီး backup key အသစ် ထုတ်ပေးသည်။ Automatic download ပိတ်ထားသော browser တွင် Download Backup Key ခလုတ်ကို နှိပ်ပါ။
- Key backup သည် account password များကို ပြန်သတ်မှတ်နိုင်သော admin recovery credential ဖြစ်သည်။ GitHub/ZIP ထဲတွင် သင့် PC အတွက် live key မပါပါ။ ကိုယ်ပိုင် PC မှာ run လုပ်ချိန်မှ ထုတ်ပေးမည်။
- Update လုပ်ရာတွင် လက်ရှိ data/ folder အပြည့်အစုံနှင့် data/.security/ ကို ထိန်းထားပါ။ အခြား PC တွင် recovery key အသစ်ဖြစ်မည်။ Database restore က recovery key အဟောင်းကို ပြန်မသက်ဝင်စေပါ။

## China Payment၊ QR Upload၊ Cashier Dashboard နှင့် Photo ID Card

- Settings → Payments → China တွင် Alipay၊ WeChat Pay၊ UnionPay၊ Bank Transfer နှင့် Cash ထည့်ထားသည်။ ကိုယ်ပိုင် merchant account ဖြည့်ပြီး channel ကို enable လုပ်ပါ။ Use China Payment Profile ကို ရွေးနိုင်သည်။ Currency ကို သီးခြား စိတ်ကြိုက်ရွေးထားနိုင်သည်။
- Payment channel → Configure / Upload QR တွင် PNG/JPEG/WebP QR ပုံကို upload၊ preview၊ remove/replace လုပ်နိုင်သည်။ အများဆုံး 2 MB ဖြစ်သည်။ Cashier payment လက်ခံချိန် ရွေးထားသော channel ၏ QR ပုံကို ပြမည်။ Bank/wallet reference ဖြည့်ပြီး အမှန်တကယ် ငွေလက်ခံရရှိကြောင်း ကိုယ်တိုင် အတည်ပြုပါ။
- Cashier Dashboard ကို Service Jobs စာမျက်နှာမှ သီးခြားခွဲထားသည်။ မိမိလက်ခံသော payment totals ကို currency ခွဲပြပြီး payment queue၊ receipt နှင့် service intake shortcut များ ပါသည်။
- Cashier Accounts → Edit Profile တွင် ဆက်သွယ်ရန်အချက်အလက်နှင့် profile photo သိမ်းနိုင်သည်။ Generate ID Card တွင် ပုံပါသော ID Card ကို download သို့မဟုတ် print လုပ်နိုင်သည်။ Card size သည် 85.6 × 54 mm ဖြစ်သည်။
- Cashier များသည် Dashboard → My Profile / My ID Card တွင် ကိုယ်ပိုင် profile နှင့် card ကို အသုံးပြုနိုင်သည်။ Update လုပ်ရာတွင် လက်ရှိ data/ folder နှင့် .security/ recovery key folder ကို ထိန်းထားပါ။
