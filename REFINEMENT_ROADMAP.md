# AturMabar refinement roadmap

## What was improved

The authentication experience was refreshed around a clearer community-management story rather than a generic centered form. The new responsive layout introduces a stronger brand header, contextual benefit cards, improved hierarchy, softer surfaces, more intentional blue/lime accents, and better light/dark presentation. The form now includes helper copy, leading icons, visible focus states, accessible labels, localized password visibility controls, inline success/error feedback, a forgot-password route, and immediate post-login navigation.

The frontend shell was also cleaned up by removing unused imports, improving button and input defaults, adding reduced-motion support, improving text rendering and selection styles, and removing the public-route admin redirect bounce. The backend compiler configuration now uses the supported Node16 module resolution mode, and the dual Neon/local database wrapper exposes a schema-aware shared type. Authentication queries were made explicit against the imported schema so both registration and login compile reliably.

## Verification

| Area | Result | Notes |
|---|---:|---|
| Frontend production build | Passed | `npm run build` completes successfully. |
| Backend TypeScript build | Passed | `npm run build` completes successfully after the database typing cleanup. |
| Login browser review | Passed | `/login` renders the refreshed layout and localized controls on the local Vite server. |
| Frontend lint | Needs follow-up | Existing project-wide lint debt remains: explicit `any` usage, state updates inside effects, and unused error variables across older pages. |

## Prioritized feature suggestions

| Priority | Feature | Why it matters | Suggested first slice |
|---|---|---|---|
| P0 | Attendance and RSVP flow | Makes session planning reliable before players arrive. | Add a shareable session link with RSVP states: going, maybe, unavailable. |
| P0 | Role-based permissions | Protects community data as more organizers join. | Add organizer, scorekeeper, and viewer roles with route-level and action-level permissions. |
| P0 | Automated session reminders | Reduces no-shows and manual follow-up. | Add configurable email or WhatsApp reminders 24 hours and 2 hours before a session. |
| P1 | Live session control board | Turns the current session detail page into the organizer’s command center. | Add live attendance count, court availability, queue status, and a “next match” emphasis mode. |
| P1 | Player self-service profile | Keeps phone numbers, skill levels, and availability current. | Add a player-facing profile link with editable contact details and pairing preferences. |
| P1 | Payment tracking improvements | Makes membership and session finance easier to reconcile. | Add payment history, receipt export, outstanding balance filters, and CSV export. |
| P1 | Matchmaking explainability | Builds trust in automatic pairings. | Show a short reason for each pairing, including skill balance and restriction checks. |
| P2 | Community analytics | Helps organizers understand engagement over time. | Add monthly attendance, active-player, repeat-session, and revenue trend cards. |
| P2 | Import and export | Reduces setup friction for existing communities. | Support CSV roster import with preview, validation, duplicate detection, and export. |
| P2 | Progressive web app support | Makes the app easier to use courtside on mobile. | Add install metadata, offline shell caching, and a reconnect state for active sessions. |

## Recommended technical cleanup sequence

First, introduce shared TypeScript models for `User`, `Community`, `Member`, `Session`, `Attendance`, and `Match` so the current `any`-heavy pages can converge on one contract. Second, centralize API error handling and replace browser `alert`/`confirm` calls with one accessible toast and confirmation-dialog pattern. Third, split large screens such as `SessionDetails.tsx` into feature modules for attendance, courts, matches, history, and billing. Fourth, add request cancellation and loading/error/empty state primitives for list pages. Finally, add component tests for route guards, login failure/success, session creation, matchmaking restrictions, and score submission before changing the data model.

## Known follow-ups

The frontend lint command still reports legacy issues across `Dashboard`, `Members`, `Sessions`, `SessionDetails`, `Leaderboard`, and verification screens. These are not blocking the production build, but they should be addressed in a dedicated typed-refactor pass rather than hidden by weakening the lint configuration. The frontend production bundle also reports a large-chunk warning, so route-level lazy loading for `AdminDashboard`, `SessionDetails`, and PDF-related code would be a sensible performance follow-up.
