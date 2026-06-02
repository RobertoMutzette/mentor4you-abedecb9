# Mentor4You — Platform Expansion Plan

This is a large scope. To keep things shippable and avoid a half-built mess, I'll break it into phases and ship them iteratively. We already have: auth, onboarding, profiles, matching engine, partners discovery, projects CRUD, connection requests.

## Phase 1 — Profile depth + richer discovery (this turn)
What's missing from profiles vs. your spec: education, professional experience, industries of interest, project preferences. Without these the "intelligent recommendations" can't actually be intelligent.

- Extend `profiles` table: `education` (jsonb[]), `experience` (jsonb[]), `industries` (text[]), `project_preferences` (text[]), `headline` (text), `avatar_url` (text)
- Update onboarding to collect these in a multi-step wizard
- Add a public **Profile page** (`/u/$id`) — view anyone's full profile, with Connect / Message buttons
- Upgrade matching to weight industries + project_preferences
- Role-aware dashboard: mentors see mentee suggestions, mentees see mentors + partners + opportunities

## Phase 2 — Messaging (next turn)
- `conversations` + `messages` tables, RLS scoped to participants
- Realtime via Supabase Realtime
- Inbox UI, threaded chat, unread badge
- Message button unlocks only after a connection is **accepted**

## Phase 3 — Project workspaces (next turn)
- `project_members` (roles: owner, co-founder, collaborator), `project_invites`, `project_updates`, `project_comments`, `project_files` (Supabase Storage), `project_milestones`
- Dedicated workspace route `/projects/$id` with tabs: Overview · Team · Milestones · Updates · Discussion · Files
- Public showcase view for non-members with comments/feedback
- Funding tracker (already partially there)

## Phase 4 — Opportunities (later turn)
- `organizations` table + `opportunities` table (type: internship, fellowship, research, competition, grant, …)
- `opportunity_applications` table
- Browse / filter page, application flow

## Phase 5 — Notifications + polish (later turn)
- `notifications` table, bell icon, realtime push for: new request, request accepted, new message, project invite, comment on your project, application status

---

## Technical notes
- All new tables: RLS + GRANTs + service_role
- Storage bucket `project-files` (private) for Phase 3
- Realtime publication for `messages` and `notifications`
- Matching algorithm in `src/lib/matching.ts` extended; pure function, no schema lock-in
- Keep edits surgical: existing routes stay, new fields are additive (nullable defaults), no breaking migrations

## What I'll ship in THIS turn (Phase 1)
1. DB migration: add profile fields
2. Rewrite onboarding as a 4-step wizard (Basics → Background → Interests → Preferences)
3. New `/u/$id` public profile route
4. Upgrade matching weights for industries + preferences
5. Role-aware dashboard tweaks (mentor vs mentee CTAs)

Then we ship Phase 2–5 in follow-up turns so each one gets proper attention and testing.

**Confirm and I'll start with Phase 1, or tell me to reorder.**
