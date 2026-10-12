# Quick registration and FREE Telegram Bot

## Quick user register

Sign in as an administrator, open the account menu in the upper right, and choose **Quick user register**. Enter the technician's full name, a unique username (3–32 letters, digits, dot, underscore or hyphen), an 8–128 character password, and an optional phone number. Registration creates an active technician and linked login account immediately. The staff list refreshes automatically.

Registration is administrator-only. This does not introduce public self-signup or administrator account creation. Duplicate usernames are rejected case-insensitively and the existing `tech1` alias is reserved. New passwords, changed passwords and administrator password resets use salted scrypt hashes. Existing uploaded accounts and passwords are preserved, with legacy login compatibility.

## Telegram is FREE

Telegram configuration, connection testing, Chat ID detection, job/status/payment alerts, and manual daily summaries are available on both FREE and PAID plans. Income reports retain their existing license rules. Bot tools and tokens are restricted to administrators.

1. In Telegram, create a bot using **@BotFather** and copy its token.
2. Open **Settings → Telegram Bot Service**. Enter the token.
3. Send `/start` to your bot, or add the bot to your workshop group and send a message. Use Chat ID detection to select the destination. A channel requires permission for the bot to post.
4. Select desired alert types and enable automatic alerts. Save the configuration.
5. Test the connection. The saved configuration becomes verified only after test message delivery succeeds, including an optional configured channel.
6. Use **Send Daily Summary Now** for a manual summary. No automatic daily scheduler is installed. Summary dates use UTC and payment totals remain separated by currency.

Testing a draft does not replace the saved token, chat or verification. Changing a saved destination clears previous verification. Disable automatic alerts and save to stop event alerts. Manual test/summary buttons explicitly send messages even while automatic alerts are disabled.

## Repairs

- Removed frontend and backend PAID gating for Telegram.
- Blocked technician access to the token endpoint; validated configuration fields and prevented clients from setting verification metadata.
- Added a 10-second request timeout, safe network/JSON errors and token redaction.
- Escaped customer/job text for Telegram HTML; retry plain text only on definite HTML parsing rejection, never on rate limiting or delivery failures.
- Added Telegram dispatch to the dedicated job status endpoint, without duplicate sends when status does not change.
- Connection tests now report delivery failure honestly; draft tests cannot mark another configuration as connected.
- Chat detection includes edited messages, channel updates and callback chats, deduplicates destinations, and explains webhook/polling conflicts without changing another integration's webhook.
- Daily summaries report partial delivery failure and currency-specific totals.
- Configuration fields synchronize after loading; save failures are visible; automatic alerts can be disabled; summaries require saved destination fields.

## Verification

`npm run lint` passed. `npm test` passed 217 checks: 38 existing functional, 143 API regressions, 19 notification UI, 9 Telegram transport, and 8 registration UI checks. All Telegram traffic in tests is mocked; no live bot or recipient was contacted. The original database and original backups are preserved. Browser rendering, Windows/PHP and live Telegram permissions/network delivery still need checking on the destination machine.

Telegram API reference: https://core.telegram.org/bots/api
