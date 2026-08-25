# Reader App — endpoints assumed by the Aug 2026 redesign

Everything below is called from the app but wasn't visible as an existing
NestJS route from this build. Each is written against a reasonable guessed
contract (matching the style of the real endpoints it sits next to) so the
screens are fully wired and testable the moment a matching route exists —
but the exact path, payload shape, and response should be confirmed with
whoever owns `backend/src` and adjusted if they differ.

| Endpoint | Called from | Payload | Notes |
|---|---|---|---|
| `POST /reports/citizen` | `src/screens/PostNewsScreen.tsx` → `submitCitizenReport()` | multipart form: `headline`, `content`, `categoryId`, `districtId?`, `media?` (image/video file) | Citizen quick-post from the edge rail's FAB. Should land in the same verification queue as the Reporter App's news uploads (admin panel → verification queue), so if that module already exists under a different path, point this at it instead. |
| `POST /reports/content` | `src/screens/ReportContentScreen.tsx` → `submitReport()` | JSON: `articleId`, `reason`, `detail` | "Report this article" — content moderation, not the citizen-report pipeline above. Reached from `MoreActionsSheet`'s report row via `/report/[id]`. |
| `PATCH /users/profile` | `src/screens/EditProfileScreen.tsx` | JSON: `name` | Updates display name. Sits next to the existing `PATCH /users/preferences` (language) and `PATCH /users/push-token` — same auth context, just a different field set. |

## Not backend gaps, just flagged as local-only by design

These didn't get an endpoint because there's no reasonable one to guess —
they're intentionally local/device-only until a real feature is scoped:

- **Article comments** (`ArticleDetailScreen.tsx`) — in-memory only, resets on reload.
- **Article likes** (`ArticleCard.tsx`) — randomized on mount, not persisted.
- **Reading history** (`src/store/history.store.ts`) — AsyncStorage, per-device.
- **Reporter follow** (`ArticleDetailScreen.tsx`, `ReporterProfileScreen.tsx`) — AsyncStorage, per-device.
- **Gold/silver rate ticker** (`src/components/ui/RateTicker.tsx`) — static placeholder figures.
- **Reels / Jobs** (`ReelsScreen.tsx`, `JobsScreen.tsx`) — "coming soon" screens; no data model exists yet for either.

## Version gate

`app/_layout.tsx` reads `remoteConfig.minSupportedVersion` (from `GET /config`,
already a real endpoint) and blocks the app behind `ForceUpdateScreen` when
the installed version is below it. That field already existed on
`app.store.ts`'s `RemoteConfig` type — just confirm the admin panel actually
has a control to set it, since this build didn't touch the admin panel.
