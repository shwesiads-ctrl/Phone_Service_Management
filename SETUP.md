# FixFlow Setup Guide — မြန်မာ / English

## မြန်မာလမ်းညွှန်

### 1. လိုအပ်ချက်များ

- Node.js **22.12 နှင့်အထက်**၊ Node.js 24 LTS ကို အကြံပြုပါသည်။ npm သည် Node.js နှင့်အတူ ပါဝင်သည်။
- Windows၊ Linux သို့မဟုတ် macOS နှင့် ခေတ်မီ browser တစ်ခု။
- ပထမဆုံး dependency တပ်ဆင်ရန် Internet လိုအပ်သည်။ LAN အသုံးပြုရန် စက်များသည် network တစ်ခုတည်းတွင် ရှိရမည်။

### 2. Download နှင့် တပ်ဆင်ခြင်း

[Source ZIP](https://github.com/shwesiads-ctrl/Phone_Service_Management/raw/refs/heads/main/downloads/FixFlow-LAN-Work-Updated.zip) ကို download လုပ်ပြီး extract လုပ်ပါ။ Project folder တွင် Terminal / Command Prompt ဖွင့်ပါ။ Git သုံးလိုပါက အောက်ပါအတိုင်း clone လုပ်နိုင်သည်။

```sh
git clone https://github.com/shwesiads-ctrl/Phone_Service_Management.git
cd Phone_Service_Management
```

```sh
node --version
npm ci
npm run build
npm run start:production
```

Server စတင်ပြီးနောက် browser မှ **http://localhost:3000** ကို ဖွင့်ပါ။ Terminal ကို ဖွင့်ထားရမည်။ ရပ်ရန် `Ctrl+C` နှိပ်ပါ။ နောက်တစ်ကြိမ် စတင်ရန် `npm run start:production` ကို project folder မှ run ပါ။

### 3. Admin အကောင့်နှင့် ဆိုင်အချက်အလက်

Fresh installation တွင် Login → **New User Register — Create Admin Account** မှ အမည်၊ username၊ password နှင့် confirm password ဖြည့်ပါ။ ပထမဆုံး Admin ဖွင့်ပြီးနောက် Login မှ Register ကို ဖျောက်ထားမည်။ မူလ Admin password မလိုပါ။ Existing installation တွင် လက်ရှိ account ကို သုံးပါ။

Admin ဝင်ပြီး **Settings** တွင် Shop Info၊ ဘာသာစကား၊ ငွေကြေး၊ payment channel နှင့် မိမိဆိုင်၏ payment QR ကို သတ်မှတ်ပါ။ **User Roles & Access** မှ staff account၊ role နှင့် account status ကို စီမံနိုင်သည်။ **Settings → Security** မှ recovery backup key ကို download လုပ်ပြီး သီးသန့်သိမ်းပါ။ Password recovery အောင်မြင်တိုင်း key အသစ်ကို ပြန်သိမ်းရန်လိုသည်။

### 4. LAN မှ အသုံးပြုခြင်း

Server PC တွင် Windows `ipconfig` သို့မဟုတ် Linux `hostname -I` ဖြင့် LAN IP ကို စစ်ပါ။ တခြားစက်များတွင် `http://SERVER-IP:3000` ကို ဖွင့်ပါ၊ ဥပမာ `http://192.168.1.10:3000`။ OS firewall တွင် ယုံကြည်ရသော local network အတွက် TCP port 3000 ကို ခွင့်ပြုပါ။ စက်များအကြား ချိတ်ဆက်မရပါက IP၊ server ဖွင့်ထားခြင်းနှင့် firewall ကို စစ်ပါ။

### 5. Update နှင့် Backup

Update မလုပ်မီ app မှ backup ထုတ်ပြီး server ကို ရပ်ပါ။ လက်ရှိ **`data/` folder တစ်ခုလုံးနှင့် `data/.security/`** ကို သီးခြား copy သိမ်းထားပါ။ Source အသစ်၏ sample data ဖြင့် မိမိဆိုင် data ကို အစားမထိုးပါနှင့်။ Source update ပြီး မူလ data ကို ထိန်းထားကာ `npm ci` → `npm run build` → `npm run start:production` ပြန်လုပ်ပါ။ Browser တွင် `Ctrl+F5` ဖြင့် refresh လုပ်ပါ။

### 6. အဖြစ်များသော ပြဿနာများ

- `html2canvas` / package မတွေ့ပါက project folder တွင် `npm ci` ပြန်လုပ်ပြီး build ပြန်လုပ်ပါ။
- Node version error ဖြစ်ပါက Node.js 24 LTS တပ်ဆင်ပြီး Terminal အသစ်ဖွင့်ပါ။
- Port 3000 အသုံးပြုနေပါက မိမိဖွင့်ထားသော server အဟောင်းကို ရပ်ပါ၊ သို့မဟုတ် အောက်ပါ port ပြောင်းနည်းကို သုံးပါ။
- Register မပေါ်ပါက installation တွင် Admin setup ပြီးသားဖြစ်နိုင်သည်။ လက်ရှိ Admin account သို့မဟုတ် **Forgot Password** နှင့် recovery key ကို သုံးပါ။ Register ပြန်ပေါ်ရန် database ကို မဖျက်ပါနှင့်။
- Password မှား ၅ ကြိမ်ပြီး ပိတ်ထားပါက ၁၅ မိနစ်အထိ စောင့်ပြီး ပြန်ဝင်ပါ။

## English guide

### Install and start

Install Node.js **22.12 or newer** (Node.js 24 LTS recommended). Download and extract the source ZIP linked above, or clone the repository. Open a terminal in the folder containing `package.json`, then run:

```sh
npm ci
npm run build
npm run start:production
```

Open **http://localhost:3000**. Keep the server terminal open; press `Ctrl+C` to stop it. For subsequent starts, run `npm run start:production` from the same folder. Installation needs Internet access. PHP is optional and is not required for this Node workflow.

### Configure your installation

On a fresh installation, create your own administrator using **New User Register — Create Admin Account** on Login. Registration disappears after first setup. Existing installations retain their configured administrator accounts.

Set shop details, language, accounting currency and your actual payment channels/QR images in **Settings**. Manage staff roles and account status in **User Roles & Access**. Download your installation's recovery backup key from **Settings → Security** and store it privately. Successful password recovery rotates the key; save the replacement backup.

### LAN and custom port

Find the server computer's LAN IP using `ipconfig` on Windows or `hostname -I` on Linux. Devices on the same network open `http://SERVER-IP:3000`. Allow inbound TCP port 3000 on the server firewall for your trusted local network. The server computer must remain running.

To change the port, set `PORT` before starting. Use the matching port in the browser and firewall:

Windows Command Prompt:

```bat
set PORT=3001
npm run start:production
```

Windows PowerShell:

```powershell
$env:PORT = '3001'
npm run start:production
```

Linux / macOS:

```sh
PORT=3001 npm run start:production
```

### Updating safely

Create an application backup and stop the server. Copy your existing **`data/` folder, including `data/.security/`**, to a separate backup location. Preserve that folder when replacing source files; do not overwrite current records with the downloadable sample database. Run `npm ci`, `npm run build` and `npm run start:production` again, then refresh the browser with `Ctrl+F5`.

### Development and optional desktop build

For development, run `npm run dev`. Run `npm run lint` for TypeScript checks and `npm test` for the supported test suite, which uses isolated test data.

```sh
npm run desktop
```

The Electron desktop app requires a graphical desktop environment. To build the Windows installer on a Windows development machine, run `npm run dist:win`; output is written to `release/`. Optional PHP/Windows launchers are documented in [README.md](README.md#php-and-windows-lan-launchers).

### Troubleshooting

For missing packages such as `html2canvas`, run `npm ci` and rebuild from the project folder. Upgrade Node if its version is unsupported. For an occupied port, stop your previous server or choose another port. If Login registration is hidden, use the existing administrator or **Forgot Password** with the current recovery key; do not delete the database to reopen registration. Five failed login attempts trigger a cooldown of up to 15 minutes.

## License

FixFlow is distributed under the [MIT License](LICENSE). Keep the copyright and license notice when redistributing the software.
