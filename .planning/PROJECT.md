# Bullion Tracker — Radial Photo Gallery

## What This Is

A premium, scroll-driven radial photo gallery for the Bullion Collection Tracker. Replaces the existing grid-based collage page with an interactive wheel that rotates coin photography as users scroll—like flipping through a collector's display case.

## Core Value

Showcase coin photography beautifully. The radial wheel animation is a means to this end, not the end itself. Every design decision should enhance how the images look.

## Requirements

### Validated

- ✓ Collection item data model with images array — existing (`bullion-tracker/prisma/schema.prisma`)
- ✓ useCollection hook for fetching items — existing (`bullion-tracker/src/hooks/useCollection.ts`)
- ✓ Collage page structure with header/navigation — existing (`bullion-tracker/src/app/collage/page.tsx`)
- ✓ Lightbox modal for fullscreen image viewing — existing (current collage page)
- ✓ Metal type badges (gold/silver/platinum) — existing pattern in codebase
- ✓ Tailwind CSS styling system — existing (`bullion-tracker/package.json`)

### Active

- [ ] RadialScrollGallery component with GSAP scroll-driven animation
- [ ] CollectionPhotoCard component with metal badge, image, title, grade, weight
- [ ] Photos page integrating gallery with collection data
- [ ] Lightbox modal for item detail view (multi-image swipe + metadata)
- [ ] Empty state for collections without photos
- [ ] Mobile-responsive radius and touch interactions

### Out of Scope

- Filter pills (Gold/Silver/Platinum buttons) — defer to future version
- Tab navigation changes — use existing collage route
- Mobile app (React Native) version — web only for this feature

## Context

**Existing collage page:**
- Location: `bullion-tracker/src/app/collage/page.tsx`
- Current implementation: Grid layout with filter buttons and basic lightbox
- User feedback: "Functional but uninspiring" — works but doesn't showcase photography well

**Data structure:**
- Collection items have `images: string[]` (base64 URLs currently)
- Items have `metal`, `title`, `weight`, `grade` fields
- Items with category "NUMISMATIC" have additional grading info

**Component to integrate:**
- RadialScrollGallery using GSAP + ScrollTrigger
- Requires: `gsap`, `@gsap/react`, `class-variance-authority`
- Badge component for metal type labels

## Constraints

- **Mobile**: Must work on touch devices with responsive radius (desktop: ~450px, mobile: ~200px)
- **UI consistency**: Match existing design system colors and patterns (#F8F7F4 background, card styles)
- **Performance**: GSAP animations must respect `prefers-reduced-motion`
- **Accessibility**: Keyboard navigation support (Enter/Space to select)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace collage page, not add new route | User wants upgraded experience, not separate feature | — Pending |
| GSAP over Framer Motion for scroll animation | ScrollTrigger provides precise scrubbing; existing Framer Motion is for simpler animations | — Pending |
| Skip filter pills in v1 | Focus on core gallery experience first | — Pending |
| Include lightbox in v1 | Essential for viewing item details and multiple images | — Pending |

---
*Last updated: 2026-01-09 after initialization*
