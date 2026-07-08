
# Feed-first experience + Projects, Maps, Institutions

## 1. Feed becomes the landing page after login
- `/` (root of `_authenticated`) and post-login redirect land on `/feed` instead of `/dashboard`.
- Bottom nav becomes: **Feed · Institutions · Mentors · Partners · Dashboard** (5 pills, same fluid expand-on-hover behavior, Dashboard added as requested).
- Login/signup success → `navigate({ to: "/feed" })`.

## 2. Feed = Instagram-style scroll of projects
Reusing the existing `posts` table (per your choice), with an added link to a project:
- New column `posts.project_id uuid null` → references `projects(id)`.
- Feed composer gets a "Link a project" picker (choose one of your own projects).
- Feed cards render richer when a project is attached: cover image, project title, tags, and a "View project" button that opens `/project/$id`.
- Card interactions kept: like, comment, repost, share. Comments panel already exists.
- Infinite scroll (load 25 more on scroll-bottom).

## 3. Project profiles & upload
- Reuse existing `projects` table (already has title, description, tags, cover_image_url, status, needs, etc.).
- `/projects/new` — clean upload form: cover image (uploads to `covers` bucket), title, one-line pitch, description (markdown), tags, looking-for chips, location (optional, lat/lng via map click or geocode input).
- `/project/$id` — public project page: cover hero, description, team members, updates, comment thread. "Follow project" and "Message owner" actions.
- Add `projects.latitude numeric`, `projects.longitude numeric`, `projects.location_label text` (nullable).

## 4. User profiles
- `/u/$id` already exists — polish it: cover + avatar, headline, bio, skills, location on a mini-map, list of published projects, follow/unfollow, message.

## 5. Explorable map on Mentors & Partners
- Leaflet + OpenStreetMap (no API key; `bun add leaflet react-leaflet`).
- Toggle at top of `/mentors` and `/partners`: **List | Map**.
- Map markers from `profiles.latitude`/`profiles.longitude` (add these columns, nullable). Clicking a marker opens a popup card with avatar, name, headline, and "View profile" / "Connect".
- Onboarding + settings: add optional location field (city search → geocode via Nominatim, stored as lat/lng + label). No key needed.

## 6. Institutions module
- New nav tab **Institutions** with its own feed of research/position postings.
- Data model:
  - `app_role` enum gains `'institution'`.
  - `institutions` table: `id`, `owner_id` (auth.users), `name`, `logo_url`, `website`, `description`, `location_label`, `latitude`, `longitude`, `verified boolean default false`.
  - `institution_positions` table: `id`, `institution_id`, `title`, `field`, `description`, `type` (research/phd/postdoc/internship), `location_label`, `remote boolean`, `deadline date`, `apply_url`, `created_at`.
  - `position_interactions`: like/save/comment (same shape as posts).
- RLS:
  - Anyone signed in can SELECT institutions + positions.
  - Only users with `has_role(auth.uid(), 'institution')` AND `owner_id = auth.uid()` can INSERT/UPDATE/DELETE their own institution and its positions.
- Regular users see the Institutions feed, can like/save/comment, and click through to the institution page and position detail.
- Institution sign-up: separate route `/signup/institution` — collects institution name, contact, website, and requests verification. Creates a pending record; an admin manually grants the `institution` role (Cloud users have no dashboard, so we ship an admin-only grant migration + a note in settings). Verified institutions get a distinct posting UI at `/institution/dashboard`.

## 7. Auth hardening (from previous phase)
- HIBP leaked-password check enabled.
- Zod validation + strength meter on signup/reset.
- Email verification required on signup.
- Google sign-in button on `/login` and `/signup`.

## 8. Error & legal pages
- `notFoundComponent` on `__root` → 404 page.
- `errorComponent` on `__root` → friendly 500 with "Try again" (calls `router.invalidate()`).
- Privacy, Terms, GDPR refreshed to reflect: location data, institution postings, project uploads, cookie use.

## Technical notes
- Migrations (single batch): `posts.project_id`, `projects` lat/lng/location_label, `profiles` lat/lng/location_label, `app_role += 'institution'`, `institutions`, `institution_positions`, `position_reactions`, `position_comments`, `position_saves`, RLS + GRANTs for all new tables.
- New files: `src/lib/institutions.ts`, `src/lib/geo.ts`, `src/components/LocationMap.tsx` (wraps Leaflet), `src/components/LocationPicker.tsx`, `src/components/PostCard.tsx` (extract from feed to reuse for institutions), route files `_authenticated/institutions.tsx`, `_authenticated/institution.$id.tsx`, `_authenticated/institution.position.$id.tsx`, `_authenticated/institution/dashboard.tsx`, `signup/institution.tsx`, `projects.new.tsx`.
- Nav: 5-pill floating bar remains centered; on very narrow widths (<380px), icons only.
- Realtime bell bug fix: register `postgres_changes` handler BEFORE `.subscribe()` (current code chains them correctly but the channel reuses the name across StrictMode remounts — add a cleanup guard).
- Leaflet CSS imported once in `__root.tsx`.

## Out of scope for this pass
- Direct-message media attachments.
- Institution-side applicant tracking.
- Payments/paid postings.
