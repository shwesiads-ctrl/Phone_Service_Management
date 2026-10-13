# FixFlow Repair & Service Manager

[MIT License](LICENSE) · [Setup Guide — မြန်မာ / English](SETUP.md)

[Download updated source ZIP](downloads/FixFlow-LAN-Work-Updated.zip?raw=true)

The published package excludes saved Telegram credentials. Re-enter your bot token in Telegram Settings after installation.

Staff registration and Telegram Bot settings are available; see REGISTER-TELEGRAM.md. Reviewed and corrected on 2026-10-10; an in-app notification system has now been added. See NOTIFICATIONS.md for the new bell, recipient rules and inbox controls. See BUGFIX_REPORT.md for changes, validation and limits, and QUICKSTART-MM.md for Burmese instructions.

## မြန်မာလမ်းညွှန် — Version 2.9.1

Settings → Local Network တွင် server PC မှ Node server On/Off နှင့် Test လုပ်နိုင်သည်။ Off သည် အဓိက Node HTTP port နှင့် managed PHP ကို ပိတ်သည်။ ပြန်ဖွင့်ရန် local control page ကို ကြိုဖွင့်ထားပါ။ Controller သည် server PC localhost တွင်သာ အလုပ်လုပ်ပြီး Admin account လိုသည်။ စာမျက်နှာများကို လိုအပ်မှသာ load လုပ်ကာ fonts ကို app ထဲထည့်ထားသည်။ Shop Settings တွင် ဒုတိယဖုန်း၊ website၊ ဆိုင်ဖွင့်ချိန်နှင့် receipt policy preview ထည့်ထားသည်။ Job အသစ်/Job Detail မှ Discount ကို amount သို့မဟုတ် % ရွေးပြီး Save လုပ်ပါ။ Receipt တွင် discount နုတ်ပြီး Total ကို ပြမည်။

Settings → Local Network မှ PHP CLI On/Off ရွေးနိုင်ပြီး တကယ်အလုပ်လုပ်ကြောင်း စစ်ပြီးမှ On ပြသည်။ Print report ကို app menu မပါဘဲ A4 သီးခြားစာရွက်ဖြင့် ထုတ်သည်။ Technician report တွင် ပထမ ၁၀ ခုသာမက record အားလုံး ထုတ်သည်။ Repair Records service warranty ကို Shop Settings အတိုင်း ပြသည်။ Telegram Summary Preview၊ Delivery History နှင့် daily schedule အသစ် ထည့်ထားသည်။

Fresh install မှာ demo data မပါပါ။ Payment form မှ profile ရွေးပြီး နာမည်များကို လက်ရှိဘာသာစကားအတိုင်း ပြသည်။ Non-cash channel သုံးရန် Settings → Payments မှ မိမိဆိုင်၏အကောင့်/QR ထည့်ပြီး Enable လုပ်ပါ။ Devices တွင် Select All နှင့် ဆက်စပ် record အရေအတွက် ပြပြီး backup သိမ်းကာ bulk delete လုပ်နိုင်သည်။ Customer account မဖျက်ပါ။ Cashier ID အပေါ်မှာ ဆိုင်နာမည်၊ လိပ်စာ၊ ဖုန်း ပါလာပြီး Receipt မှ Balance due ကို ဖယ်ထားသည်။ Receipt warranty ကို Shop Settings အတိုင်း ပြသည်။

Payment Profile ကို Settings → Payments မှ စိတ်ကြိုက်ရွေးပါ။ ဘာသာစကားပြောင်းလျှင် profile မပြောင်းပါ။ Admin သည် အပေါ်ဘားမှ currency ရွေးနိုင်သည်။ Account Management ကို card ပုံစံပြောင်းပြီး Cashier List တွင် search/status/pagination ပါဝင်သည်။ Settings မှ Technician Configuration နှင့် Demo User ခလုတ်များ ဖယ်ထားသည်။ About ကို မြန်မာ၊ English၊ Thai၊ Chinese အတိုင်း ပြထားသည်။

FixFlow သည် ဖုန်းနှင့် စက်ပစ္စည်းပြုပြင်ရေးဆိုင်အတွက် Service Job၊ Customer၊ Device၊ Technician၊ Cashier၊ ငွေလက်ခံခြင်းနှင့် Report များကို စီမံနိုင်သည့် Local / LAN စနစ်ဖြစ်ပါသည်။

**ပထမဆုံး Admin Account ဖွင့်ရန်:** မူလ Admin account ဖြင့် ဝင်စရာမလိုပါ။ Login စာမျက်နှာရှိ **New User Register — Admin အကောင့်အသစ်** ကို နှိပ်ပြီး မိမိအမည်၊ username၊ password နှင့် confirm password ဖြည့်ပါ။ ဖွင့်ပြီးတာနဲ့ Register နေရာကို ဖျောက်ထားမည်။ နောက်ထပ်ဖွင့်ခြင်းနှင့် server restart ပြီးနောက်တွင်လည်း Login မှ Register ထပ်မပေါ်တော့ပါ။ ယခင်သတ်မှတ်ထားပြီးသော Admin အကောင့်များကို ဆက်လက်အသုံးပြုနိုင်သည်။

Technician စာရင်းကို compact table၊ search၊ status filter၊ pagination နှင့် action ခလုတ်များဖြင့် ပြန်စီထားသည်။ Admin Dashboard summary card နှင့် workload table ကို screen အရွယ်အစားနှင့် ကိုက်ညီအောင် ပြင်ထားသည်။

**Login ဝင်ပြီး Admin menu မှဖွင့်ရန်:** လက်ရှိ Admin ဖြင့် Login ဝင်ပြီး အပေါ်ညာဘက် အကောင့် menu → **New User Register** ကို ဖွင့်ပါ။ Account role ကို **Admin** ရွေးပြီး အမည်၊ username၊ password နှင့် confirm password ဖြည့်ပါ။ Technician / Cashier အကောင့်များအတွက်လည်း သက်ဆိုင်ရာ role ကို ရွေးနိုင်သည်။ အဟောင်း Quick Register entry ကို ဖျောက်ထားပြီး လက်ရှိအကောင့်များကို ဆက်လက်အသုံးပြုနိုင်သည်။

**Email:** [shwetaythan@gmail.com](mailto:shwetaythan@gmail.com)


လက်ရှိ version တွင် Search၊ နံပါတ်စဉ်ပါ pagination၊ Receipt JPEG Save၊ Shop Settings၊ Cashier ID အတိုနှင့် Notifications ပြင်ဆင်မှုများ ပါဝင်သည်။ ဘာသာစကားမှာ မြန်မာ / English / Thai / Chinese ဖြစ်ပြီး ငွေကြေးကို Ks / USD / THB / CNY မှ စိတ်ကြိုက်ရွေးနိုင်သည်။

**တပ်ဆင်ရန်:** Node.js 22.12 နှင့်အထက်ဖြင့် `npm ci` → `npm run build` → `npm run start:production` လုပ်ပါ။ Update မလုပ်မီ backup သိမ်းပြီး မူလ `data/` နှင့် ၎င်းအတွင်းရှိ `.security/` ကို ထိန်းထားပါ။ Recovery အောင်မြင်တိုင်း key အသစ်ပြောင်းသောကြောင့် key အသစ်ကို ထပ်သိမ်းရန်လိုသည်။

Receipt နှင့် Job Detail တွင် job currency တစ်မျိုးတည်းဖြင့် တွက်ပြပြီး currency မတူသော payment အသစ်ကို လက်မခံပါ။ Receipt မှာ ဆိုင် logo နှင့် Staff signature ပါပြီး Customer signature ဖယ်ထားသည်။ Expense နှင့် Device Category ကို စိတ်ကြိုက်ရေးထည့်/ပြင်နိုင်သည်။ Finance တွင် Ledger currency ရွေးပြီး currency တူသော စာရင်းများကိုသာ ပေါင်းပြသည်။ System License plan/day badge ကို ဖယ်ထားသည်။

## Version 2.9.1 — Clear multilingual receipts and cashier navigation

Cashier Dashboard တွင် မိမိလက်ခံခဲ့သော My Repair Records နှင့် Customers ကို ဖွင့်နိုင်ပြီး Technician menu မှ အဆိုပါ နှစ်ခုကို ဖယ်ထားသည်။ Receipt တွင် ပစ္စည်းဖိုး၊ လက်ခ၊ လျှော့ငွေ၊ စရံ/လက်ခံပြီးငွေနှင့် ကျန်ငွေ သို့မဟုတ် ပြန်အမ်းငွေကို သီးခြားပြထားသည်။ Receipt စာသားများသည် မြန်မာ၊ English၊ Thai၊ Chinese ဘာသာစကားအတိုင်း ပြောင်းပြီး Login စာမျက်နှာတွင် ဘာသာရွေးနိုင်သည်။ Print page margin ကို ပြင်ကာ browser header/footer ကို ဖျောက်ထားသည်။

Cashiers can open their own repair records and customer list; technicians no longer see those navigation entries. Receipts separate parts, labor, discounts, deposits/payments and any remaining amount or change to return. Receipt labels follow all four supported languages, Login offers a language selector, and print pages use zero margins to suppress browser-generated headers and footers.

## Version 2.9.0 — Two-sided visit cards and Windows installer

Shop Settings မှ Visit Card Maker ကို စာမပြည့်ကျပ်အောင် ရှေ့/နောက် နှစ်ဖက်ပါ ဒီဇိုင်း ၁၀ မျိုးဖြင့် ပြန်ရေးထားသည်။ Front PNG နှင့် Back PNG ကို သီးခြား သိမ်းနိုင်သည်။ Dark mode currency dropdown နှင့် မြန်မာ sidebar စာများ ပြင်ထားသည်။ Windows installer သည် လက်ရှိ user data ကို AppData တွင် ထိန်းထားပြီး demo database၊ backup နှင့် recovery key များ မထည့်ထားပါ။ GitHub Actions မှ Windows installer ထုတ်ပြီး artifact အဖြစ် ရယူနိုင်သည်။

The card maker now offers ten clean, two-sided layouts with separate front and back PNG downloads. Dark currency menus and compact Myanmar navigation are fixed. The Windows installer retains existing user data in AppData and ships without demo databases, backups or recovery keys. GitHub Actions builds the installer as a downloadable artifact.

## Version 2.8.9 — Shop Visit Card Maker

Shop Settings တွင် ဆိုင် logo၊ လိပ်စာ၊ ဖုန်း၊ email နှင့် Facebook၊ TikTok၊ Telegram၊ Instagram၊ WhatsApp စသော social account များပါတဲ့ Visit Card Maker အသစ် ပါဝင်ပါသည်။ ဒီဇိုင်း ၁၀ မျိုး၊ အရောင်နှင့် font ရွေးပြီး preview ကြည့်ကာ Shop Settings သိမ်းပါ။ PNG card ပုံကို download လုပ်နိုင်ပါသည်။

Shop Settings now includes a visit card maker using your shop logo, address, phone, email and social accounts. Choose one of 10 designs, a color and a font, save the settings and download the card as a PNG.

## Version 2.8.8 — Node controls, faster loading, shop settings and discounts

Settings → Local Network offers Node HTTP On/Off and a real connection test on the server computer. Open the local control page before Off; it can authenticate an administrator and reopen the Node port while the workshop API is stopped. Off also stops managed PHP. The control listener stays on localhost; quitting the server terminal stops everything. LAN clients cannot control it. Pages load on demand, relational job lookups are indexed and fonts are bundled locally. Shop Settings adds contact fields and receipt policy previews. New jobs and Job Detail support fixed or percentage discounts; the backend calculates the net total and settlement status, and receipts show the deduction.

Version 2.8.7 fixed job/payment currency consistency without converting historical amounts. Receipts retain shop logos and staff signatures, with customer signatures removed. Expense records can be edited, and expense/device categories accept custom names. The system license plan/day badge is removed.

The PHP CLI switch verifies actual backend health and waits for the process to exit before showing Off. Reports print in an isolated A4 document (landscape for wide service and analytics tables) without clipped modal containers or app navigation, including all filtered records. Repair Records service warranty follows shop policy. Telegram summaries support previews, four languages, time zones, delivery history and opt-in schedules.

Payment forms offer a region selector and localized method labels. Enable your configured non-cash channels in Settings → Payments. Devices can select all search matches across pages and delete confirmed linked records after a backup, keeping customer accounts. Cashier cards show workshop contacts in the header. Receipts omit Balance due and use the current shop warranty; new jobs inherit that default, including zero-day warranties. Existing saved job/part warranty records remain unchanged.

Select the active payment profile in Settings → Payments; language changes never switch it. Administrators can choose currency in the top bar. Account Management uses role-filtered cards; cashier accounts use a searchable, status-filtered paginated table. Duplicate technician settings and demo-user controls have been removed. About follows Myanmar, English, Thai and Chinese. PHP startup reports success only after a health check, and the router forwards the configured Node port.

A fresh installation offers **New User Register — Create Admin Account** on Login. Create the first administrator with your own name, username and confirmed password; no previous/default administrator credentials are needed. Registration closes on the server and hides from Login immediately after creation, including after restart. Existing configured administrator accounts are preserved. Login registration also stays closed after restoring older backups from a configured installation.

Technician management now uses a compact paginated table with name/contact/ID search, status filters and inline actions. Dashboard cards adapt to screen width, and technician workloads use a compact paginated table with clickable filtering.

An existing administrator can also create a **new Admin account** from the account menu → **New User Register**, using a unique username and confirmed password of at least eight characters. Technician and cashier roles are also available. The old Quick User Register entry is hidden; existing accounts remain available.

**Email:** [shwetaythan@gmail.com](mailto:shwetaythan@gmail.com)

About and the sidebar use shared release metadata. Every product upgrade must update that metadata, accurate About content and the Myanmar/English README notes; see [AGENTS.md](AGENTS.md).

## Start

Use Node.js 22.12 or newer (Node.js 24 recommended).

```sh
npm ci
npm run build
npm run start:production
```

Open http://localhost:3000. Other devices on the same LAN use the host computer's IP address on port 3000. Build `dist/` before the first production startup. After changing source code, run `npm run build` before production startup.

For development, use `npm run dev`. Use `PORT` to override port 3000. PHP forwarding inherits `PORT` when started by the Node server.

Existing configured accounts and passwords are preserved. The unconfigured default administrator is replaced when first setup completes. Default credential hints have been removed from the interface and public API. After installing this revision, sign in again: old user-ID-based sessions are no longer accepted. Sessions expire after 12 hours and on server restart.

## Verify

```sh
npm run lint
npm test
```

`npm test` builds the UI, creates a temporary copy of the database, starts an isolated production server on a free port, runs the updated functional suite and the regression suite, runs notification/registration component interaction tests and mocked Telegram transport tests, and removes the temporary data. It checks that the original database remains unchanged. It does not send live Telegram messages or call the license owner server. Historical standalone test scripts are not the supported test entry point; use `npm test`.

## PHP and Windows LAN launchers

The PHP router requires PHP CLI and a running Node backend. Start Node first with `npm run start:production`, then start `start-pos-php-cli.bat` or run `php -S 0.0.0.0:8080 router.php`. The Windows launchers now switch to the project folder before running commands.

`start-pos-lan.bat` starts the Node development server directly. Network/firewall rules and PHP availability must be checked on the destination computer.

## Data, payment QR and licensing

The live `data/db.json` is no longer tracked or included in source packages, and historical shop backups are not shipped. On a fresh PC, the server creates an empty database with no demo accounts, customers, devices or jobs. Test records live only in `scripts/fixtures/legacy-demo-db.json` and are never loaded by production. Preserve your current `data/` folder and `.security/` when updating; existing installations do not have their records automatically removed.

Payment QR configuration accepts a bank-issued image URL or a PNG/JPEG/WebP base64 image. Unconfigured methods show account details and a prompt to configure the real bank QR. The application does not manufacture banking QR codes from an account number. Payment confirmation is still a manual cashier action; it is not bank settlement verification.

Licenses are managed by the existing local administrator registry. Unknown/revoked keys are rejected, and reactivation preserves the first expiry date. Verification explicitly reports that no remote owner-server verification occurred. A local registry is not a remote licensing authority.

The supplied database already contains repeated technician usernames from earlier test runs. No accounts were merged or removed. An administrator can assign each affected account a distinct username in Technician Management.

## Account, demo and close controls

Default password information is removed from Login, Settings and registration hints. The compatibility endpoint returns an empty list; existing account passwords are preserved.

Demo-user creation/deletion buttons have been removed from Technician Management. Existing accounts and workshop records are preserved; manage staff through the regular technician and cashier lists.

The desktop app asks before closing; Cancel is the default. Signed-in browser sessions request the browser's standard leave-page confirmation, which can also appear on refresh/navigation. Browsers control its wording and may suppress it before the user interacts with the page.

New payment profiles contain no sample beneficiary names, bank accounts or wallet numbers. Cash is enabled; configure and enable other methods using your own verified account/QR information. On loading older data, exact known sample beneficiary pairs without a configured QR are cleared and disabled. Custom account details and configured QR images are preserved. Historical backups remain unchanged.

## Delete customers with linked repair records

In **Customers**, click the customer's delete button or select customers and choose **Delete Selected**. The confirmation dialog shows the customer names and counts of devices, repair jobs, parts, payments, linked income records and notifications. Tick the acknowledgement and choose **Delete All Listed Records** to remove the entire selected graph. Other customers and user accounts remain unchanged. Payment/income totals change; historical settlements, expenses and audit logs remain.

A full safety backup is required and saved to `data/backups/before_customer_delete_*.json` before deletion. If a related record changes after preview, close the dialog and review again. Backup/save failures leave the database intact. The original simple DELETE endpoint still refuses linked customers; the UI uses a separate explicit confirmation operation.

## Four languages and manual currencies

The UI supports Myanmar (`my`), English (`en`), Thai (`th`) and Simplified Chinese (`zh`) only. Unsupported saved languages fall back to English. Select the workshop accounting currency in **Settings → Currency**: Ks/MMK, US dollars/USD, Thai baht/THB, or Chinese yuan/CNY. Automatic language/currency synchronization has been removed. Changing language never changes currency; existing transactions retain their recorded currency and amounts.

## Cashier accounts

Administrators can create, deactivate, reset passwords for, or delete accounts in **Cashier Accounts**. A cashier signs into their own dashboard and can register intake customers/devices, create assigned service jobs, collect payments and print receipts. Server permissions block staff management, settings changes, database backups, finance management, repair edits and deletion. Payments record the actual cashier identity. Deactivating/resetting a cashier revokes their sessions; deleting an account retains payment history.

## PC recovery key and Forgot Password

On the first server startup, FixFlow automatically creates one installation-specific 256-bit recovery key in `data/.security/password-recovery.json` (or under `FIXFLOW_DATA_DIR`). The local file is the PC's protected recovery backup; it is excluded from Git and downloadable project packages. The key stays unchanged across restarts. Copying this security file to a machine with a different host/network identity causes a new PC key to be generated.

Before you need recovery, sign in as an administrator, open **Settings → Security**, enter the current administrator password and choose **Download Backup Key**. Keep the downloaded file private: it is an administrator recovery credential for accounts on this server PC. A downloaded project ZIP never contains a ready-made recovery key; your PC generates its own.

On the login screen choose **Forgot Password**, enter the account username, the current PC recovery key, and the new password twice. Successful recovery invalidates the previous password, revokes that account's sessions and rotates the PC recovery key. The form downloads the replacement backup and provides a manual download button. The replacement key works for future recovery; the old key cannot be reused. Administrators can also explicitly generate a replacement key in Security settings. Failed recovery does not consume a key, and invalid attempts are rate limited.

Database backups/restores do not replace the PC's `.security` key file, so restoring an old database cannot revive an old recovery key. When updating this app on the same PC, retain the complete existing `data/` folder, including `.security/`. When moving to a new PC, use the known administrator password to sign in and download that PC's newly generated key.

## China payments and QR uploads

**Settings → Payments → China** includes Alipay, WeChat Pay, UnionPay, Chinese bank transfer and cash. China non-cash methods start disabled with blank beneficiary details. Configure your merchant account and choose **Configure / Upload QR** to upload a bank/merchant-issued PNG, JPEG or WebP image (maximum 2 MB). The image previews before saving, can be removed/replaced, and is retained in database backups. Existing image URLs remain supported. **Use China Payment Profile** selects these channels independently of the manual currency setting; choose CNY in Currency settings when needed. Chinese language selects China channels when payment-profile mode follows language.

The configured merchant QR appears when a cashier selects that method on a service job. Record the bank/wallet reference and verify actual receipt before collecting payment. These are merchant configuration and manual confirmation features; no bank settlement API is connected.

## Cashier dashboard, profiles and photo ID cards

The cashier dashboard is a separate overview: today's shop intake, that cashier's collections grouped by currency, payment queue, ready-for-pickup count, and recent receipt actions. **Service Jobs** remains the full jobs table. Payments store the cashier's persistent user ID, so profile/name changes preserve attribution.

In **Cashier Accounts**, choose **Edit Profile** to save name, phone, email, address and an uploaded portrait (PNG/JPEG/WebP, up to 2 MB). Choose **Generate ID Card** to preview, download a self-contained SVG card or print it at 85.6 × 54 mm. The card includes the photo, staff ID/QR, role, shop branding and contact details. Cashiers can edit their own profile and access **My ID Card** from their dashboard or user profile. The card QR carries the persistent staff ID; card exports contain profile/display information.

### Long lists and About

Repair history, income/expenses, customers, devices, technicians, and workload/payment/audit reports now use numbered pages. The default is 20 records per page; choose 50 or 100, use previous/next, or jump directly to a page. Search and filter changes return to page 1. Row numbers continue across pages, and deleted records automatically clamp the current page. Customer/technician select-all applies to the current page; previously selected records remain selected and the bulk-action count includes them.

Financial totals continue to use every matching record. Printing includes all matching records and restores the selected page afterward. About describes the current roles, payment channels, language/currency settings, backups, password recovery and workshop contact details.

### Cashier search, receipts and workshop identity

The header search now opens Service Jobs and shares its search query with the jobs list. Search matches service number, customer name/phone, device and IMEI; surrounding whitespace is ignored. Cashier Service Jobs use the same numbered pagination as other lists.

Receipts show the recorded payment receiver for each payment and the staff member who accepted intake. Intake deposits now record the actual cashier identity instead of a fixed administrator name. Save JPEG downloads a high-resolution `.jpg` of the complete A4 or 80mm receipt. Printing uses a separate receipt document, with shop branding/contact details and recorded totals. Deleted payments are omitted.

Shop Settings now opens first, validates contact/tax/logo fields, previews the receipt/card contact details, and reports save success or failure. Logo uploads accept PNG, JPEG and WebP up to 2 MB. LAN clients refresh workshop settings every 30 seconds while visible and when refocused. Unsaved shop edits are preserved.

Cashier accounts receive intake/status notifications and their own payment notifications. Other cashiers receive intake/status notices but not another cashier's payment notification. Inactive cashiers receive no new events; read/dismiss operations remain recipient-specific.

Existing cashier accounts automatically receive a persistent short display code such as `CASH-0001`. Profile, account list and ID cards show this code; internal record IDs and QR identifiers retain their original values. Cards now show workshop name, phone, email and address.

`npm run test:cashier:browser` runs real headless Chromium checks using fixture data, including actual JPEG downloads and image dimensions. Set `CHROMIUM_PATH` if Chromium is not located at `/usr/bin/chromium`. The standard `npm test` suite uses isolated HTTP/component fixtures and does not require Chromium.

### Login security, themes and user roles

Login, Navbar and Appearance Settings offer Light, Dark and System modes. Dark styling follows the selected application theme.

Login မှားယွင်းမှု ၅ ကြိမ်ဖြစ်ပါက ထိုအကောင့်/စက်အတွက် ၁၅ မိနစ် ကန့်သတ်ထားသည်။ Admin က **Account Management** မှ role၊ account enable/disable နှင့် password reset စီမံနိုင်သည်။ ကိုယ်ပိုင် Admin လုပ်ပိုင်ခွင့်ပိတ်ခြင်းနှင့် နောက်ဆုံး Admin ဖယ်ရှားခြင်းကို ကာကွယ်ထားသည်။ Role ပြောင်းပြီးနောက် သက်ဆိုင်ရာ user ကို Login ပြန်ဝင်စေသည်။

Five failed logins for an account/IP trigger a 15-minute cooldown, with a broader IP limit against username spraying. Successful login clears that account’s failure count. User access changes revoke affected sessions. Admins cannot disable/demote themselves or the last active admin; technician roles require a linked technician profile. Sessions are checked on browser focus and every 30 seconds. Default-password session switching was removed; account switching requires signing in normally.

## License / လိုင်စင်

This project is licensed under the [MIT License](LICENSE). You may use, modify and distribute it, including commercially, while retaining the copyright and license notice.

ဤ project ကို [MIT License](LICENSE) ဖြင့် အသုံးပြု၊ ပြင်ဆင်၊ ပြန်လည်ဖြန့်ဝေနိုင်ပြီး စီးပွားရေးအတွက်လည်း အသုံးပြုနိုင်ပါသည်။ Copyright နှင့် license စာသားကို ဆက်လက်ထည့်ထားရပါမည်။

## Telegram daily schedules / အချိန်သတ်မှတ်ပို့ခြင်း

Save the bot token and recipient first. In Settings → Telegram → Daily Summary & Delivery History, choose time, time zone and summary language. Enable scheduled summaries and save; automatic Telegram alerts must also be enabled. The server must remain running with Internet access. Scheduling starts disabled. One scheduled attempt is made per local calendar day, including after server restart; inspect failures in Delivery History and retry manually if needed. Previewing never sends a message. Deleted payments are excluded and totals stay separated by currency.

Bot/recipient ကို Save လုပ်ပြီး Daily Summary panel မှ အချိန်၊ timezone နှင့် ဘာသာစကား ရွေးကာ schedule ကို ဖွင့်ပြီး Save လုပ်ပါ။ Automatic Telegram alerts ကိုလည်း ဖွင့်ထားရမည်။ Server နှင့် Internet အလုပ်လုပ်နေမှ ပို့နိုင်သည်။ တစ်ရက်တစ်ကြိမ်သာ ကြိုးစားပြီး failure ကို Delivery History မှ ကြည့်နိုင်သည်။ Preview သည် စာမပို့ပါ။

The PHP switch controls the managed PHP endpoint; the Node backend remains required. PHP Off closes its port. Manually started PHP processes must be stopped from their own terminal. Physical LAN connectivity and printer-driver margins should be checked on the destination PC.


Finance uses a selectable ledger currency so totals never add different currencies together. The currency selector also sets the currency of newly recorded income and expenses; editing an existing expense preserves its original currency.

Fonts are bundled locally under `public/fonts/` and their SIL Open Font License notices are included. They are separate from the application MIT license.
