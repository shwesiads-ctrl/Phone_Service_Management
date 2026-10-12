# FixFlow Repair & Service Manager

[Download updated source ZIP](downloads/FixFlow-LAN-Work-Updated.zip?raw=true)

The published package excludes saved Telegram credentials. Re-enter your bot token in Telegram Settings after installation.

Quick technician registration and FREE Telegram Bot are now available; see REGISTER-TELEGRAM.md. Reviewed and corrected on 2026-10-10; an in-app notification system has now been added. See NOTIFICATIONS.md for the new bell, recipient rules and inbox controls. See BUGFIX_REPORT.md for changes, validation and limits, and QUICKSTART-MM.md for Burmese instructions.

## Start

Use Node.js 22.12 or newer (Node.js 24 recommended).

```sh
npm ci
npm run build
npm run start:production
```

Open http://localhost:3000. Other devices on the same LAN use the host computer's IP address on port 3000. Build `dist/` before the first production startup. After changing source code, run `npm run build` before production startup.

For development, use `npm run dev`. Use `PORT` to override port 3000. PHP forwarding inherits `PORT` when started by the Node server.

Existing accounts and passwords are preserved. Accounts without a saved custom password still use the existing defaults: `admin` / `admin123`, or a technician username / `tech123`. The `tech1` alias resolves to `kyawzin`. After installing this revision, sign in again: old user-ID-based sessions are no longer accepted. Sessions expire after 12 hours and on server restart.

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

The original `data/db.json` and every `data/backups/` file are included unchanged. When updating an existing installation, keep that installation's current `data/` folder rather than replacing newer records with the uploaded snapshot.

Payment QR configuration accepts a bank-issued image URL or a PNG/JPEG/WebP base64 image. Unconfigured methods show account details and a prompt to configure the real bank QR. The application does not manufacture banking QR codes from an account number. Payment confirmation is still a manual cashier action; it is not bank settlement verification.

Licenses are managed by the existing local administrator registry. Unknown/revoked keys are rejected, and reactivation preserves the first expiry date. Verification explicitly reports that no remote owner-server verification occurred. A local registry is not a remote licensing authority.

The supplied database already contains repeated technician usernames from earlier test runs. No accounts were merged or removed. An administrator can assign each affected account a distinct username in Technician Management.

## Account, demo and close controls

Default login hints are obtained from the server. An account's hint disappears once its password is changed or reset, including on other LAN clients and after server restart. No custom passwords are returned by the hint endpoint.

In **Technician Management**, administrators can use **Add Demo User** to create `demo_tech` (initial password `tech123`). Repeated adds reuse the same demo account. **Delete Demo Users** asks for confirmation and deletes only accounts created with the demo marker; regular users, customers and financial records are retained. Reassign any repair jobs belonging to demo accounts before deleting them. Existing sample technicians are treated as regular accounts to avoid accidental deletion.

The desktop app asks before closing; Cancel is the default. Signed-in browser sessions request the browser's standard leave-page confirmation, which can also appear on refresh/navigation. Browsers control its wording and may suppress it before the user interacts with the page.

New payment profiles contain no sample beneficiary names, bank accounts or wallet numbers. Cash is enabled; configure and enable other methods using your own verified account/QR information. On loading older data, exact known sample beneficiary pairs without a configured QR are cleared and disabled. Custom account details and configured QR images are preserved. Historical backups remain unchanged.

## Delete customers with linked repair records

In **Customers**, click the customer's delete button or select customers and choose **Delete Selected**. The confirmation dialog shows the customer names and counts of devices, repair jobs, parts, payments, linked income records and notifications. Tick the acknowledgement and choose **Delete All Listed Records** to remove the entire selected graph. Other customers and user accounts remain unchanged. Payment/income totals change; historical settlements, expenses and audit logs remain.

A full safety backup is required and saved to `data/backups/before_customer_delete_*.json` before deletion. If a related record changes after preview, close the dialog and review again. Backup/save failures leave the database intact. The original simple DELETE endpoint still refuses linked customers; the UI uses a separate explicit confirmation operation.
