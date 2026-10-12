# FixFlow bug-fix report — 2026-10-10

## Verified result

- Dependency installation succeeds after fixing the Vite/esbuild peer-version conflict; an npm lockfile is included.
- TypeScript check: `npm run lint` passed.
- Production UI build: passed; compiled `dist/` included.
- Existing functional suite: **38 passed, 0 failed**.
- Regression suite including notification API tests: **143 passed**.
- Notification component interaction suite: **19 passed**.
- Telegram transport unit suite: **9 passed**.
- Quick registration component interaction suite: **8 passed**.
- Total: **217 passing checks**.
- Original database and all 58 original backup files are byte-for-byte preserved.
- Test output is included in `test-results.txt`.

## Quick registration and FREE Telegram

See REGISTER-TELEGRAM.md for administrator quick technician registration, removal of Telegram plan restrictions, delivery fixes, safe credential handling and validation.

## New feature: Notification System

A persistent, recipient-specific inbox is available from the navbar bell. It covers new tickets, assignments/reassignments, repair status changes and received payments. The interface includes an unread badge, All/Unread filters, read/dismiss controls, automatic refresh, and links to current tickets. English, Myanmar and Thai notification text is included.

Notifications are saved with the underlying job/payment update, included in backups and isolated by authenticated user. Assignment/status events reach the relevant technician; financial notifications remain administrator-only. Read/dismiss state survives restart and synchronizes across devices. Each account retains its latest 250 events.

Forty added API regression checks cover recipient access, event generation, duplicate suppression, read/dismiss actions, backup compatibility, restart persistence and retention. Nineteen component interaction checks cover bell/filter behavior, badge updates, errors, ticket opening, keyboard/outside dismissal, Myanmar labels and account changes. See NOTIFICATIONS.md for usage.

## Corrected behavior

| Area | Problem | Correction |
| --- | --- | --- |
| Installation | Vite 8 dependency resolution failed against esbuild 0.25 | Compatible esbuild version and reproducible npm lockfile |
| Login | Omitting a password bypassed verification | Username and password required; malformed inputs rejected |
| Authentication | User IDs, usernames and technician identity headers impersonated accounts | Random server-issued bearer sessions with expiry, logout revocation and account checks |
| Passwords/accounts | Resetting a password or disabling an account left sessions usable | Sessions check current credentials and technician status; password reset invalidates older sessions |
| API responses | User/technician passwords leaked, including nested job records | Credentials removed from UI responses; administrator backups remain complete |
| Permissions | Customer/device writes, archive downloads and PHP server controls lacked administrator checks | Administrator checks enforced on those routes |
| Profile editing | Duplicate usernames and partial profile updates caused identity/field problems | Duplicate-name rejection; omitted fields preserved; empty optional fields can be cleared |
| IDs | Array length generated duplicate IDs after deletion | Maximum existing sequence plus persistent counters; counters retained across backup restore |
| Job references | Repairs/devices accepted invalid customer/device references; deletion orphaned records | Validate owner relationships and block deletion of linked customers, devices and technicians |
| Parts | Invalid quantities/prices and supplied totals corrupted repair costs | Input validation and totals calculated from quantity × unit cost |
| Payment balances | A stale repair modal overwrote a later receipt; adding parts did not update paid/partial status | Receipt ledger remains authoritative; changes recalculate balances and payment status |
| Payment edits | Receipts could be moved to nonexistent repairs or edited after deletion | Validate target job and reject edits to deleted receipts |
| Warranty/status | Zero warranty became 30 days; invalid statuses were persisted | Preserve zero; validate warranty and both status update endpoints |
| Finance | Invalid edited amounts and arbitrary identity fields were persisted | Validate positive finite amounts and restrict update fields |
| Database restart | Empty finance arrays repopulated demo records | Persist intentionally empty collections and clear settlements with demo data |
| Database persistence | Corrupt databases were replaced by seed data; write errors looked successful | Fail without overwriting corrupt input; atomic temporary-file replacement; report write errors |
| Restore | Malformed collections, duplicate IDs, invalid users and broken references were accepted | Validate before restoration; preserve a safety snapshot |
| API errors | Unknown endpoints and malformed JSON could return HTML | Consistent JSON error responses |
| Settings | Save confirmation appeared before persistence succeeded | Await successful save; show save failures; payment configuration retains the modal on error |
| Payment QR | All banking methods generated a QR containing a website URL with a fallback demo account | Display configured bank-issued QR images; remove fabricated QR and fallback account destinations |
| Licensing | Arbitrary strings unlocked PAID, revoked keys reactivated, repeated activation reset expiry | Registered active keys required; revocation disables installed key; first expiry retained |
| License verification | Local-only verification claimed owner-server verification | Clearly reports local verification and does not claim owner verification |
| Production startup | Even a production launch started Vite development middleware | Production start serves the compiled SPA |
| Windows/PHP | Launchers depended on the current directory; static containment used an unsafe prefix | Launchers change to their project directory; static containment requires a directory boundary |

## Operational changes

Sign in again after updating; legacy tokens that were simply user IDs no longer work. Sessions last 12 hours and do not survive a server restart. Accounts and their existing passwords were not modified in the supplied database.

The current database already has 23 technician accounts sharing one username (22 duplicate occurrences). This revision prevents new duplicates through account/profile editing and technician creation. Existing accounts were preserved; assign distinct usernames through Technician Management rather than automatically merging people or their repair history.

Unknown license strings are no longer accepted. Use the local administrator license registry. This implementation does not integrate an authenticated remote owner service; local verification is now described accurately.

## Verification limits

No browser visual/end-to-end run completed: a browser executable was unavailable and its download failed. UI source was type-checked and production-built; API workflows, production HTML serving, and DOM-based notification component interactions were tested. The DOM tests mock the app context/API and do not verify pixel layout or real browser behavior.

PHP CLI is unavailable here, so the PHP router and Windows batch files were inspected but not executed. Physical LAN/firewall behavior, real bank scanning/settlement and live Telegram delivery require testing on the destination machine/services. Telegram tests use mocked API responses and never contact a live bot.

This review is not a claim that every possible bug is eliminated. The database still uses a single-process JSON store, and existing stored passwords retain the project's legacy storage format; newly registered, changed or reset passwords use salted scrypt hashes. Do not run multiple backend processes against the same data folder.
