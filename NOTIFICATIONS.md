# Notification System

The bell in the top navigation opens your personal inbox. New activity updates automatically within 15 seconds while the app is visible, and immediately after ticket/payment actions in the current tab. Opening the bell or returning to the app also refreshes the inbox.

## Events

| Event | Administrator | Assigned technician |
| --- | --- | --- |
| New repair ticket | New-ticket alert | Assignment alert |
| Initial intake deposit | Payment alert with amount/currency | — |
| Technician reassigned | Reassignment alert | New technician receives assignment alert |
| Repair status changed | Old and new status | Old and new status |
| Receipt recorded | Payment alert with amount/currency | — |

Both status-update endpoints generate alerts. Saving notes or repeating an unchanged status does not produce duplicate status alerts. A technician who no longer owns a ticket does not receive its later updates.

## Using the inbox

- The red badge shows unread alerts; values above 99 appear as `99+`.
- Use **All** or **Unread** to filter the list.
- Click an alert to mark it read and open its current repair ticket.
- The check button marks one alert read without opening it.
- **Mark all read** clears your own unread badge.
- The X beside an alert dismisses it. **Clear read** dismisses only read alerts.
- Read/dismiss actions are saved to the server and synchronize across devices at the next refresh.
- Escape or clicking outside closes the panel. Escape restores focus to the bell.

Alerts are private to the receiving account, including read/dismiss controls. An administrator cannot use these inbox endpoints to change a technician's inbox. Current ticket permissions are checked again when an alert is opened; deleted or reassigned tickets show an availability message.

The inbox keeps the latest 250 events per account, including dismissed history. Older events are pruned when new events arrive. It starts empty for an existing database: historical jobs are not treated as newly created tickets. Notifications are included in backups, survive server restarts, and are cleared by the existing Clear Demo Data operation. Backups from before this feature remain compatible and restore an empty inbox.

Notification interface text is available in English, Myanmar and Thai. Other app languages use English for the new notification strings, with existing localized repair-status labels.

This is an in-app inbox. The app must be open for automatic refresh; it does not register OS/browser push notifications, play sounds, or send customer messages. The existing Telegram configuration remains a separate feature.

## Developer verification

`npm test` runs the existing functional suite, isolated API regressions, and notification component interaction tests. `npm run test:notifications:ui` runs the component interaction tests independently with a mocked app context/API; it needs no running server or browser executable.

API endpoints:

| Method | Path | Action |
| --- | --- | --- |
| GET | `/api/notifications` | Current user's inbox and unread count |
| PUT | `/api/notifications/:id/read` | Read one current-user alert |
| PUT | `/api/notifications/read-all` | Read all current-user alerts |
| DELETE | `/api/notifications/:id` | Dismiss one current-user alert |
| DELETE | `/api/notifications/read` | Dismiss current user's read alerts |

All endpoints require the existing opaque bearer session. Notification creation is part of the same JSON database write as its job/payment event.
