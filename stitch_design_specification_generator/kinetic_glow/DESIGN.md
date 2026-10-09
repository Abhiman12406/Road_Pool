---
name: Kinetic Glow
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#3e484f'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#6e7980'
  outline-variant: '#bdc8d1'
  surface-tint: '#00668a'
  primary: '#00668a'
  on-primary: '#ffffff'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#7bd0ff'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed01b'
  on-secondary-container: '#6f5900'
  tertiary: '#4d661c'
  on-tertiary: '#ffffff'
  tertiary-container: '#9ebc67'
  on-tertiary-container: '#344b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#ffe083'
  secondary-fixed-dim: '#eec200'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ceee93'
  tertiary-fixed-dim: '#b3d17a'
  on-tertiary-fixed: '#131f00'
  on-tertiary-fixed-variant: '#364e03'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

The design system is crafted for contemporary micro-mobility, telemetry, and smart vehicle sharing platforms. It blends technical precision with an approachable, lifestyle-driven aesthetic. The interface evokes a sense of effortless motion, warmth, clarity, and vitality.

The visual style merges modern soft-minimalism and frosted glassmorphism with high-tactile pill surfaces. Key visual principles include:
- **Warm Atmosphere:** Soft apricot, peachy gradients provide an inviting canvas, moving away from cold, clinical enterprise palettes.
- **Glass & Floating Slabs:** Pure white floating surfaces, backdrop blurs, and organic pill silhouettes structure both spatial metrics and real-time telemetry.
- **Electric Accent Signals:** High-visibility lemon yellows, soft lime pastels, and sky/cyan electric tones draw immediate visual focus to essential status alerts, active selection, and live route paths.
- **Ultra-Clean Geometry:** Crisp grotesque typography paired with continuous rounded corner radii creates an ergonomic, welcoming feel across both digital dashboards and mobile companions.

## Colors

The palette leverages a warm, sunlit backdrop balanced by crisp whites and functional signals.

- **Primary (`#38BDF8`):** Electric Sky. Used for active navigation paths, user location halos, selected navigation state pills, and directional prompts. An accompanying deeper hue (`#0284C7`) handles high-contrast active icons and selected interactive states.
- **Secondary (`#FACC15`):** Radiant Amber/Yellow. Used for key status indicators, highlight badges (e.g., condition pills, total stat backdrops, distance banners), and primary vehicle branding.
- **Tertiary (`#D9F99D`):** Soft Citrus Lime. Indicates operational availability, optimal battery levels, and nearest transit options.
- **Neutral (`#1E293B`):** Deep Slate Ink. Provides contrast for titles, metric values, vehicle imagery, and primary iconography. Paired with secondary text in `#64748B` and `#94A3B8`.
- **Canvas & Surfaces:** 
  - Outer Canvas: Radiant peach-cream gradient (`#FED7AA` to `#FDBA74`).
  - Base Dashboard Container: Soft white translucent surface (`rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(24px)`).
  - Floating Elements: Solid pure white (`#FFFFFF`) with ultra-soft ambient occlusion shadows.

## Typography

The typography system relies on **Plus Jakarta Sans**, offering geometric clarity, contemporary warmth, and high legibility across small metric readouts and prominent product titles.

- Large telemetry counts (e.g., total fleet counts, speed figures) use heavy weights (`700` and `800`) with tight letter spacing (`-0.02em`) for an athletic, precision feel.
- Meta labels and sub-labels under telemetry points employ medium weights (`500`) in slate gray hues (`#64748B`) to establish a clear visual hierarchy.
- Badge indicators use bold, semi-condensed styling with generous internal pill padding.

## Layout & Spacing

The layout is built upon an adaptive split-viewport architecture surrounded by generous outer canvas margins:

- **Outer Enclosure:** A rounded application canvas floating on a warm background with `2rem` (32px) margins on desktop screens.
- **Two-Column Master Split:**
  - **Left Column (Telemetry & Product Showcase):** Flexible width (~52–56%) containing an integrated vertical dock rail, vehicle hero presentation, primary stats grid, and vehicle health badges.
  - **Right Column (Interactive Map & Cartography Panel):** Dedicated map canvas (~44–48%) with internal floating HUD panels, floating search bar, layer counts, and bottom turn-by-turn instruction pills.
- **Rhythm:** Spacing follows an 8pt base grid. Fine internal grouping uses `space-xs` (6px) and `space-sm` (12px), while major dashboard card compartments use `space-lg` (24px) to `space-xl` (36px).
- **Responsive Adaptations:**
  - On screens narrower than 1024px, the split view collapses into a stacked tabbed hierarchy or bottom-sheet drawer system where the map acts as the viewport foundation and bike telemetry cards slide over as a modal sheet.

## Elevation & Depth

Visual depth is achieved through translucent surfaces, stacked pill containers, and warm ambient shadows rather than harsh borders:

- **Level 0 (Atmosphere):** Gradient peachy backdrop with subtle radial light diffusion.
- **Level 1 (App Shell):** Frosted glass panel with `backdrop-filter: blur(28px)`, filled with `rgba(255, 255, 255, 0.90)`, bordered by a 1px inner stroke of `rgba(255, 255, 255, 0.6)`. Shadows are long and warm: `0 24px 48px -12px rgba(234, 88, 12, 0.12)`.
- **Level 2 (Panels & Controls):** Floating islands (rail bars, search capsules, HUD overlays, map zoom buttons) use solid `#FFFFFF` with smooth drop shadows: `0 8px 24px -4px rgba(15, 23, 42, 0.06)`.
- **Level 3 (Active Overlays & Waypoints):** Map pins, active pills, and floating notifications feature crisp contrast with `0 12px 28px -6px rgba(0, 0, 0, 0.12)`.

## Shapes

The shape system embraces continuous curvature and organic, pill-shaped silhouettes (`roundedness: 3`):

- **Main Container:** Large, sweeping rounded corners (`2.5rem` / 40px) that frame the main dashboard screen.
- **Interactive Controls & Chips:** Fully rounded pills (`border-radius: 9999px`) for navigation badges, search inputs, zoom clusters, icon docks, and status pills.
- **Map Viewport Inset:** Rounded at `2rem` (32px), cleanly distinguishing cartography from dashboard white-space.

## Components

### Buttons & Icon Controls
- **Pill Dock Buttons:** Vertical pill container hosting neutral stroke icons (20px, 1.75px stroke width). Active item receives an electric sky background (`#38BDF8`), pure white icon, and full pill shape.
- **Round Action Nodes:** Map zoom (+/-) and action toggles are pure white circles (`44px × 44px`) with soft ambient drop shadows and centered slate icons (`#475569`).

### Status Badges & Chips
- **Telemetry Chips:** Pill badges featuring a solid indicator dot (`6px × 6px`) followed by uppercase/title text (e.g., lime chip `#D9F99D` with green dot `#15803D`, or yellow chip `#FEF08A` with deep amber text `#854D0E`).
- **Telemetry Metric Blocks:** Value paired with small descriptive label below, organized in horizontal multi-column rows.

### Search Inputs
- **Search Capsule:** High-radius pill field (`48px` height) with white background, subtle inner shadow or 1px border `rgba(241, 245, 249, 0.8)`, housing a circular primary-colored search icon button on the left and muted placeholder text.

### Turn-by-Turn Wayfinding Banner
- **Directional Card:** Floating pill at the bottom of the map view. Left side features an electric sky rounded icon container (`#38BDF8`) with turn arrow glyph, adjacent to clear sans-serif route distance copy (`Turn right in 30 m`).

### Map Pins & Route Line
- **Interactive Vehicle Pins:** Miniature bike illustrations enclosed in pure white micro-pills with attached yellow/lime distance tags.
- **Active Route Polyline:** High-contrast solid dark path (`#0F172A`) paired with a luminous electric blue section (`#38BDF8`) with radial translucent halo denoting current user GPS bearing.