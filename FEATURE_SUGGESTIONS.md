# AturMabar feature suggestions

These ideas are recommendations only. None of them are implemented in this change.

## Highest-value product improvements

| Priority | Feature | Why it matters | Suggested first version |
|---|---|---|---|
| P0 | Reliable data validation and migration tools | Prevents issues such as legacy gender values, inconsistent skill levels, and incomplete member records from resurfacing. | Add server-side enum validation, a one-time data normalizer, an admin data-quality report, and a safe preview before migration. |
| P0 | Session setup wizard | SessionDetails currently carries many operational tasks in one screen, which can feel dense for new organizers. | Guide the organizer through session name, date, courts, fees, roster, and matching preferences in a short step-by-step flow. |
| P0 | Mobile-first live session mode | Match operations happen while people are moving around, so quick actions are more valuable than dense tables. | Provide a simplified “now playing” view with large score controls, queue status, court assignment, and undo. |
| P1 | Notifications and reminders | Members need timely information about upcoming sessions, payment status, and schedule changes. | Start with in-app notifications and optional email reminders for registration, session changes, and unpaid membership periods. |
| P1 | Attendance and RSVP workflow | A roster alone does not show who plans to attend a specific session. | Add invite, RSVP, waitlist, check-in, and late-arrival states connected to each session. |
| P1 | Payment tracking and receipts | Membership periods already contain payment concepts, so a clearer financial workflow would reduce manual follow-up. | Add payment method, amount, due date, payment history, receipt export, and an organizer-only balance summary. |
| P1 | Recurring sessions | Community organizers often repeat the same schedule and rules. | Allow a weekly or custom recurrence template that creates draft sessions for review. |

## Operations and organizer experience

| Feature | Benefit | Design note |
|---|---|---|
| Saved matching rules | Reuses preferred court count, match type, skill balance, and partner/opponent avoidance settings. | Let organizers save named presets such as “Tuesday social” or “Saturday competitive.” |
| Session templates | Reduces setup time for recurring formats. | Include default courts, fees, duration, and match rules, with a clear “duplicate and edit” action. |
| Audit log | Makes changes to scores, attendance, payments, and member details traceable. | Show who changed what and when, with filters and an export option. |
| Bulk member import/export | Makes onboarding an existing community much easier. | Support CSV template download, validation preview, duplicate detection, and reversible import. |
| Role-based administration | Enables trusted assistants without sharing owner credentials. | Define organizer, scorekeeper, treasurer, and read-only roles with narrowly scoped permissions. |
| Offline-friendly scoring | Protects live play when venue connectivity is unreliable. | Cache the active session locally and reconcile changes when the connection returns. |

## Member-facing experience

| Feature | Benefit | Design note |
|---|---|---|
| Member self-service profile | Reduces organizer data entry and keeps contact details current. | Allow members to update approved fields while protecting organizer-only skill and matching fields. |
| Personal history | Gives members a reason to return between sessions. | Show attendance, matches, scores, win rate, recent partners, and improvement over time. |
| Player availability | Improves matching quality before the session starts. | Add available, maybe, unavailable, and preferred playing time windows. |
| Fairness and rotation insights | Helps organizers explain why a queue or pairing was selected. | Show court turns, rest time, partner repetition, and opponent repetition with neutral wording. |
| Private community announcements | Keeps logistics in one place. | Add pinned announcements, acknowledgements, and an archive rather than a full social feed. |

## Reporting and retention

| Feature | Benefit | Suggested scope |
|---|---|---|
| Organizer dashboard metrics | Turns raw session data into decisions. | Track attendance, repeat participation, court utilization, average rest time, and unpaid balances. |
| Exportable reports | Supports community administration and sharing. | Offer CSV/PDF exports for roster, attendance, session results, and payments. |
| Leaderboard periods | Makes rankings meaningful for different seasons. | Add date range, minimum games, rating method, and archived seasons. |
| Community health snapshot | Helps organizers notice churn early. | Show active members, dormant members, newcomer retention, and session fill rate. |
| Feedback after sessions | Captures operational problems while they are fresh. | Use a short optional survey for venue, scheduling, fairness, and overall satisfaction. |

## Recommended order of consideration

Start with **data validation and migration tools**, because reliable data improves every other feature. Next, prioritize a **session setup wizard** and a **mobile-first live session mode**, because these address the most operationally complex parts of the current product. Then consider **attendance/RSVP**, **notifications**, and **payment tracking**, which can create a complete loop from planning through follow-up. More advanced analytics, offline reconciliation, and self-service features should follow after the core workflows are stable.
