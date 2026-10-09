# Design System: Kinetic Flow (Trek E-MTB Telemetry & Mobility Dashboard)

Extracted from the high-fidelity Trek E-MTB bike telemetry, sharing, and navigation interface.

---

## 1. Visual Theme & Philosophy

- **Aesthetic**: Neumorphic-influenced modern software UI combining soft depth, ambient shadows, high-contrast typography, and playful tactile pill shapes.
- **Atmosphere**: Clean, energetic, high-tech micromobility experience blending precise mechanical metrics with intuitive outdoor navigation.
- **Depth & Surfaces**: Multi-layered rounded floating cards (`rounded-[32px]` / `rounded-[40px]`), ultra-soft ambient drop shadows, frosted glass cues, and subtle off-white elevation against warm tinted canvas backdrops.

---

## 2. Color Palette & Tokens

### Canvas & Backgrounds
| Token | Value | Description |
|---|---|---|
| `canvas-backdrop` | `#F8BA7B` / `#F5AB66` | Warm apricot/peach ambient canvas backdrop |
| `surface-main` | `#FFFFFF` | Crisp white main dashboard container |
| `surface-subtle` | `#F8FAFC` | Light cool-grey secondary panels |
| `surface-pill` | `#F1F5F9` | Neutral grey pill container for secondary inputs |
| `surface-pill-hover` | `#E2E8F0` | Hover/active state for neutral buttons |

### Brand & Accents
| Token | Value | Description |
|---|---|---|
| `accent-primary-yellow` | `#FEEF72` / `#FACC15` | Vibrant electric yellow (Trek frame match, badges, counters) |
| `accent-lemon-tint` | `#FEF9C3` | Soft pastel yellow container / badge fill |
| `accent-electric-blue` | `#38BDF8` | Active navigation path, GPS marker, and active tab indicator |
| `accent-blue-subtle` | `#E0F2FE` | Soft blue pill highlight container |
| `accent-lime` | `#BEF264` | High battery status badge (`95%` pill) |
| `accent-lime-tint` | `#ECFCCB` | Soft lime container background |

### Typography & Neutrals
| Token | Value | Description |
|---|---|---|
| `text-primary` | `#0F172A` | Deep charcoal / near black for main headers and focal metrics |
| `text-secondary` | `#475569` | Medium slate for secondary labels and metadata |
| `text-muted` | `#94A3B8` | Light slate for sub-labels, search placeholders, and timestamps |
| `stroke-subtle` | `#E2E8F0` | Hairline border dividers and pill outlines |

---

## 3. Typography Scale

- **Primary Typeface**: Plus Jakarta Sans / Inter (Clean grotesque geometric sans-serif)

| Level | Size / Line-Height | Weight | Tracking | Usage |
|---|---|---|---|---|
| **Display / Hero** | `36px` / `44px` | `800` (Extrabold) | `-0.02em` | Main bike title (`Trek E-MTB`), Key Stat (`36`) |
| **Headline** | `20px` / `28px` | `700` (Bold) | `-0.01em` | Metric values (`25 km/h`, `Excellent`) |
| **Subhead** | `15px` / `22px` | `500` (Medium) | `0em` | Category label (`Mountain E-Bike`) |
| **Body / Labels** | `13px` / `18px` | `500` / `600` | `+0.01em` | Badge text (`• Available`, `Good Condition`, `Last Ride`) |
| **Caption / Meta** | `11px` / `14px` | `500` (Medium) | `+0.02em` | Sub-metrics (`(128 rides)`, `Top Speed`) |

---

## 4. Elevation & Radii

### Border Radii
- **Dashboard Outer Frame**: `rounded-[40px]`
- **Content Cards / Sections**: `rounded-[32px]`
- **Floating Controls / Badges / Pills**: `rounded-full` (`9999px`)
- **Inner Buttons / Micro-Cards**: `rounded-2xl` (`16px`)

### Elevation & Shadows
- **Card Shadow (Soft Lift)**: `0 20px 40px -15px rgba(0, 0, 0, 0.08)`
- **Pill / Floating Button Shadow**: `0 4px 12px rgba(0, 0, 0, 0.05)`
- **Map Floating Tool Shadow**: `0 8px 24px rgba(15, 23, 42, 0.08)`

---

## 5. UI Components & Layout Structure

### 1. Left Vertical Nav Rail
- **Width**: `72px`
- **Elements**:
  - Brand Logo at top (`rounded-full` or dynamic bike glyph)
  - Back circular button (`w-10 h-10 rounded-full bg-white shadow-sm`)
  - Vertical Icon Stack: Home, Map, Bike (Active state with soft blue pill background `#38BDF8`), Battery/Cards
  - Bottom Utility Stack: Notification bell with badge count (`2`), Settings cog, User avatar thumbnail

### 2. Left Telemetry & Showcase Column
- **Hero Title & Taxonomy**:
  - `h1`: Bold title + subtitle
  - Status Pills: Flex row with dot indicators (`• Available` in soft lime/green, `Good Condition` in soft yellow)
- **Primary Metric Cluster**:
  - 3-column inline grid (`Top Speed`, `Battery Health`, `Last Ride`) with mini stroked outline icons
- **Product Showcase**:
  - Centered isolated transparent cutout of the E-Bike
- **Bottom Status Floating Bar**:
  - Dual pill: Battery percentage (`95%` in lime badge) + Rating pill (`★ 4.7 (128 rides)`)

### 3. Right Map & Navigation Column
- **Background**: Soft desaturated grayscale / cream vector map with building footprints and arterial roads
- **Header Floating Controls**:
  - Search Pill: Glassmorphism/white pill input (`rounded-full`) with search icon
  - Fleet Stats Bar: Mini bike silhouettes with quantity counters (`2`, `8`, `12`, `14`) flanking a prominent `36 Total` badge in bright yellow
- **Route & Telemetry Layer**:
  - Active waypoint polyline with directional black line transition into electric blue route
  - Custom map pin badges displaying distance (`320 m`), "Nearest", and "You" pulses
- **Navigation Action Bar**:
  - Bottom turn-by-turn instruction banner (`Turn right in 30 m`) with directional turn icon
  - Map zoom controls (`+` / `-`) floating vertically stacked on the bottom right
