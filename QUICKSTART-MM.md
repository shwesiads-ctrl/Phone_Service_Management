# ပြင်ပြီးသား FixFlow အသုံးပြုနည်း

1. ZIP ကို folder အသစ်တစ်ခုထဲ ဖြည်ပါ။ Node.js 22.12 နှင့်အထက် လိုအပ်ပြီး Node.js 24 ကို အသုံးပြုနိုင်ပါတယ်။
2. Project folder ထဲတွင် Terminal ဖွင့်ပြီး `npm ci` လုပ်ပါ။
3. `npm run start:production` လုပ်ပါ။
4. Browser တွင် `http://localhost:3000` ကိုဖွင့်ပြီး ပြန် Login ဝင်ပါ။

မူရင်း account၊ password၊ ဆိုင် data နဲ့ backup ဖိုင်တွေကို မပြောင်းထားပါ။ Server restart လုပ်ရင် Login ပြန်ဝင်ရပါမယ်။

ရှိပြီးသားဆိုင်စနစ်ကို update လုပ်မယ်ဆိုရင် အဲဒီစနစ်ရဲ့ လက်ရှိ `data/` folder ကို ထိန်းထားပါ။ ZIP ထဲက အဟောင်း snapshot နဲ့ အသစ်ရှိနေတဲ့ဆိုင် data ကို မအစားထိုးပါနဲ့။

Bank QR အတွက် Payment Settings မှာ ဘဏ်/Wallet ကပေးတဲ့ QR ပုံရဲ့ URL သို့မဟုတ် base64 image ကို ထည့်ပါ။ Account number ကို URL အဖြစ် QR လုပ်ပြတဲ့ အမှားကို ဖယ်ထားပါတယ်။ ပိုက်ဆံရောက်မရောက်ကို Cashier က စစ်ပြီးမှ Confirm လုပ်ရပါမယ်။

License key ကို local License Registry မှာရှိတဲ့ key နဲ့ activate လုပ်ပါ။ `PAID` / `PRO` ပါရုံနဲ့ မည်သည့်စာသားမဆို activate လုပ်နိုင်တဲ့ အမှားကို ပြင်ထားပါတယ်။ Remote owner-server verification ကို ဒီ project က မလုပ်သေးပါ။

Code ပြောင်းပြီးရင် `npm run build` လုပ်ပါ။ စစ်ဆေးဖို့ `npm run lint` နဲ့ `npm test` ကို အသုံးပြုပါ။

PHP နဲ့ Windows launcher ကို ဒီ environment ထဲမှာ လက်တွေ့စမ်းမထားနိုင်လို့ ဆိုင်ကွန်ပျူတာမှာ ပြန်စမ်းပါ။ ပြင်ထားတဲ့အချက်အသေးစိတ်ကို `BUGFIX_REPORT.md` မှာ ကြည့်နိုင်ပါတယ်။

## Notification အသစ်

အပေါ်ဘက် Bell ကိုနှိပ်ပြီး အသိပေးချက်တွေကို ကြည့်နိုင်ပါတယ်။ အနီရောင်နံပါတ်က မဖတ်ရသေးတဲ့အရေအတွက်ပါ။ Ticket အသစ်၊ တာဝန်ပေးမှု၊ status ပြောင်းလဲမှုနဲ့ ငွေလက်ခံမှုတွေကို အသိပေးပါမယ်။

Technician က မိမိတာဝန်ရှိတဲ့ ticket alerts တွေကိုပဲ ရပါမယ်။ Payment alerts ကို Admin ကပဲ ရပါမယ်။ အသိပေးချက်ကိုနှိပ်ရင် ဖတ်ပြီးသတ်မှတ်ကာ သက်ဆိုင်ရာ ticket ဖွင့်ပေးပါမယ်။ “Mark all read” နဲ့ အားလုံးကို ဖတ်ပြီးသတ်မှတ်နိုင်ပါတယ်။

App ဖွင့်ထားချိန် ၁၅ စက္ကန့်တိုင်း အသစ်ပြန်စစ်ပေးပြီး ဖတ်ပြီး/မဖတ်ရသေး အခြေအနေတွေကို သိမ်းထားပါတယ်။ Server restart အပြီး Login ပြန်ဝင်ရင် notification တွေ ဆက်ရှိပါမယ်။

## User အမြန် Register နှင့် Telegram FREE

Admin account menu → “User အမြန် Register” ကိုနှိပ်ပါ။ အမည်၊ username၊ အနည်းဆုံး ၈ လုံး password နဲ့ ဖုန်း (optional) ထည့်ပြီး technician account ကို ချက်ချင်းဖွင့်နိုင်ပါတယ်။

Telegram Bot ကို FREE plan မှာ အသုံးပြုနိုင်ပါပြီ။ Settings → Telegram Bot Service မှာ BotFather token နဲ့ Chat ID ထည့်ပါ။ Automatic alerts ကိုဖွင့်ပြီး Save လုပ်ပါ။ Test လုပ်ပြီး message ရောက်မရောက် စစ်ပါ။ Bot ကို `/start` ပို့ပြီး Chat ID detection သုံးနိုင်ပါတယ်။ Channel ကိုသုံးရင် bot အတွက် post လုပ်ခွင့်ပေးပါ။

Daily summary ကို “Send Daily Summary Now” နဲ့ ကိုယ်တိုင်ပို့ရပါမယ်။ အလိုအလျောက် နေ့စဉ်ပို့မယ့် scheduler မပါသေးပါ။ စမ်းသပ်ချက်တွေမှာ Telegram ကို mock လုပ်ထားလို့ live bot နဲ့ message အမှန်ပို့ပြီး မစမ်းထားပါ။ အသေးစိတ်ကို REGISTER-TELEGRAM.md မှာကြည့်ပါ။
