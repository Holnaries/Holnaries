# Honlaris Wellness website — plan

## Product and implementation

Build a responsive single-page wellness and aesthetics clinic website guided by the supplied Honlaris reference: editorial luxury, a generous cream canvas, forest-green actions, large serif headlines, and warm clinical photography. Deliver a static Vite/React build. When configured, the site reads shared copy, services, testimonials, and settings from one Supabase `home` JSONB record; otherwise it falls back to bundled starter content.

The page includes brand/navigation, hero and consultation actions, reassurance strip, consultation process, services, clinic/about story, patient experiences, booking banner, and contact/footer. The `/admin` panel uses Supabase email/password authentication to edit visible public copy and images, action destinations, repeatable steps/services/stories, clinic details and links. Repeatable content supports adding, editing, removal, and visibility controls. Authenticated users must be explicitly allow-listed in `admin_users`; SQL row-level security independently enforces admin writes. Public site code uses only the public Supabase anon/publishable key, never a service-role key. Example patient stories and clinic contact fields are kept unpublished/unset until the clinic supplies approved content.

Supabase project URL and anon key are not yet available. Keep them as browser-safe `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` build inputs, document their setup, and show an unconfigured-state guide in the admin. Do not simulate global persistence with localStorage.

## Project structure

- `client/src/pages/Home.tsx`: public page composition and rendering.
- `client/src/pages/Admin.tsx`: authenticated Supabase content editor.
- `client/src/lib/content.ts`: domain types and default content.
- `client/src/lib/supabase.ts`: optional Supabase client, reads/writes, admin check, and upload adapter.
- `client/src/index.css`: responsive public and admin design system.
- `client/public/`: route manifest, favicon, setup guide and downloadable SQL schema.
- `supabase/schema.sql`: content/admin tables, RLS policies, grants and media bucket setup.
- `SUPABASE_SETUP.md`: project configuration, admin bootstrap, launch checklist and static-host notes.

## Design direction

- **Design movement:** Editorial medical luxury, guided by the user's reference.
- **Core principles:** Calm confidence; high-end but human; clinical clarity without sterile UI; restrained, purposeful motion.
- **Color philosophy:** Soft ivory and warm mineral neutrals create daylight and ease; dark botanical green anchors trust; muted brass/taupe adds gentle luxury.
- **Layout paradigm:** Asymmetric editorial sections with alternating image/text balance, generous white space, narrow trust/process bands, and a compact service-card row.
- **Signature elements:** Oversized serif headline with italic phrase; a fine-line botanical-heart mark; pill-shaped deep-green consultation actions.
- **Interaction philosophy:** Clear anchors, tactile hover states, direct consultation actions, and explicit save/visibility feedback in admin.
- **Animation:** Subtle fades and small upward reveals; short transitions; respect reduced-motion preferences; avoid distracting parallax.
- **Typography system:** Refined high-contrast serif for editorial headings and clean sans serif for navigation, labels, forms, and supporting copy.
- **Brand essence:** Thoughtful skin and aesthetics care for people who value clear guidance and natural-looking results; refined, reassuring, precise.
- **Brand voice:** Warm, plainspoken, and considered. Example lines: “Confidence begins with clarity.” “A more thoughtful way to wellness.”
- **Wordmark & logo:** A fine-line botanical-heart emblem paired with spaced small-cap HONLARIS and WELLNESS.
- **Signature brand color:** Deep botanical green.
