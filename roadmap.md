# Mentor4You Roadmap

## In progress
- **Security & structural audit** (requested 2026-08-29)
  - RLS coverage on every public table; tighten permissive policies
  - Anon-role read/write test per table and storage bucket
  - Server-side auth enforcement for signup / login / password reset
  - Data-ownership review for all user-generated content
  - Review service-role / SECURITY DEFINER code paths for caller validation
  - Scan client code for leaked keys and credentials
  - Produce a table-by-table access-rule record

## Recently shipped
- Nearby maps for Mentors and Partners: own-location marker, radius ring,
  distance labels, radius filters (10/50/200/1000 km), recenter control.
