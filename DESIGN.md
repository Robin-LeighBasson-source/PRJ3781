# Morrow Design System

## Direction

Morrow uses the clarity of a career platform with the visual confidence of a premium culture brand. The public homepage is image-led, spacious, and direct; routed product pages shift to denser lists, forms, and workspaces without losing the light-sage identity. The system avoids corporate job-board blue, generic SaaS card grids, fake statistics, and unverified partner claims.

## Colour

All interface colours are expressed in OKLCH tokens in `src/styles.css`.

- Light sage is the main brand field and signature colour.
- A darker moss green carries readable headings and primary actions.
- True white and near-black form the architectural base.
- Coral and sky blue appear as controlled status and content accents.
- Semantic tints distinguish matches, statuses, and frontend notices.

## Typography

Manrope Variable is hosted locally through `@fontsource-variable/manrope`. Marketing display headings use fluid scale contrast and tight but legible tracking. Product pages use a fixed rem-based hierarchy for predictable workspace layouts. Body copy stays at or above `1rem` where sustained reading is expected.

## Layout

- Mobile-first CSS with content-driven changes at `40rem` and `64rem`.
- A 4-point spacing family underpins gaps and padding.
- Marketing sections use fluid spacing; product lists and forms use a denser rhythm.
- Desktop workspaces use purposeful two-column structures where secondary context helps.
- Mobile becomes a deliberate single-column composition with 44px touch targets.

## Components

- Sticky navigation with stateful candidate, employer, and discovery menus, a direct Jobs route, and separate Log in and Sign up actions.
- Mobile keeps Sign up visible in the header and places both account actions at the top of the full-screen menu.
- Search shell with role, location, type, setup, and sort filters.
- Responsive job, candidate, event, certificate, course, and project rows.
- Candidate resume, employer job-posting, authentication, portfolio-builder, and filter form shells.
- Module status strips for job, hackathon, and certification crawlers plus product requests.
- Portal motif built in CSS so it remains sharp at every size.
- Near-black footer with working internal navigation and a newsletter placeholder.
- Toast feedback explains where future backend behaviour will connect.

## Interaction

Controls have visible keyboard focus and minimum touch-friendly sizing. Native labels, selects, file inputs, checkboxes, radios, and tab semantics are used where appropriate. Motion is limited to the initial hero composition, menu transitions, button feedback, and toast feedback. `prefers-reduced-motion` removes non-essential animation.
