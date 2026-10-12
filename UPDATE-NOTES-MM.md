# ပြင်ဆင်ချက်များ

- Password ပြောင်း/Reset ပြီးနောက် မူလ password အညွှန်းကို Login နှင့် Settings မှ အလိုအလျောက်ဖျောက်သည်။ Server restart ပြီးလည်း ထိန်းထားသည်။ အခြား LAN client များတွင် focus ပြန်ရချိန် သို့မဟုတ် 15 စက္ကန့်အတွင်း ပြန်စစ်သည်။
- Technician Management တွင် Demo User ထည့်/ဖျက်နိုင်သည်။ demo_tech / tech123 ကို စတင်အသုံးပြုနိုင်သည်။ Demo လို့ မှတ်ထားသော account များသာ ဖျက်သည်။ Repair job ချိတ်ထားလျှင် အရင် ပြန်လွှဲရမည်။
- Desktop app ပိတ်ချိန် Cancel/Close confirmation ပြသည်။ Browser တွင် login ဝင်ထားချိန် browser ၏ ပုံမှန် leave-page confirmation ကို အသုံးပြုသည်။ Refresh လုပ်ချိန်လည်း ပြနိုင်သည်။
- မူလ payment profile များမှ sample beneficiary အချက်အလက်များကို ဖယ်ထားသည်။ Cash မှလွဲ၍ ဆိုင်၏ အမှန်တကယ် account/QR ဖြည့်ပြီး enable လုပ်ပါ။ လက်ရှိ data မှ seed နှင့် တူညီသော sample payment 13 ခုကို ဖယ်ပြီး ပိတ်ထားသည်။ ပြင်ဆင်ထားသော custom payment အချက်အလက်ကို ထိန်းထားသည်။

မူရင်း customer၊ repair၊ finance၊ user data နှင့် historical backup များကို ထိန်းထားသည်။ ယခင်ဆိုင် data အသစ်များရှိလျှင် ထို data/ folder ကိုပဲ ဆက်သုံးပါ။

စတင်ရန် Node.js 22.12+ ဖြင့် npm ci, npm run build, npm run start:production ကို အစဉ်လိုက် လုပ်ပါ။

စစ်ဆေးမှု: TypeScript PASS၊ existing tests 217 PASS၊ new HTTP tests 22 PASS၊ UI interaction နှင့် desktop confirmation tests PASS၊ desktop server bundle PASS။ Windows installer/GUI ကို တိုက်ရိုက်မစမ်းထားပါ။

GitHub ထုတ်ဝေသည့် copy တွင် Telegram bot token များကို ဖယ်ပြီး connection ပိတ်ထားသည်။ Telegram Settings တွင် ကိုယ်ပိုင် token ကို ပြန်ထည့်ပါ။ မူရင်း local data copy ကို မပြောင်းထားပါ။
