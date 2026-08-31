---
name: Clinical Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4a607c'
  primary: '#001a33'
  on-primary: '#ffffff'
  primary-container: '#182f49'
  on-primary-container: '#8197b6'
  inverse-primary: '#b2c8e9'
  secondary: '#7b5800'
  on-secondary: '#ffffff'
  secondary-container: '#febb06'
  on-secondary-container: '#6c4d00'
  tertiary: '#001f03'
  on-tertiary: '#ffffff'
  tertiary-container: '#003709'
  on-tertiary-container: '#58a756'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#b2c8e9'
  on-primary-fixed: '#021c36'
  on-primary-fixed-variant: '#324863'
  secondary-fixed: '#ffdea4'
  secondary-fixed-dim: '#febb06'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#a3f69c'
  tertiary-fixed-dim: '#88d982'
  on-tertiary-fixed: '#002204'
  on-tertiary-fixed-variant: '#005312'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  baseline: 4px
  xs: 0.5rem
  sm: 0.75rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  sidebar-width: 260px
---

## Brand & Style

The design system is engineered for high-stakes healthcare environments where clarity, speed of cognition, and trust are paramount. The brand personality is **authoritative yet empathetic**, balancing the sterile precision of medical technology with the accessibility required for long-shift administrative and clinical use.

The visual style follows a **Corporate / Modern** aesthetic with elements of **Minimalism**. It prioritizes information density without sacrificing legibility. The UI utilizes a structured layering system to separate navigation, global controls, and primary data workspaces, ensuring that users can manage complex hospital workflows with minimal cognitive load.

**Key Principles:**
- **Clinical Clarity:** High contrast between text and background for accessibility.
- **Operational Efficiency:** Dense but breathable layouts tailored for expert users.
- **Reliability:** A solid, structured grid that communicates stability and professionalism.

## Colors

The palette is anchored by **Deep Navy (#182F49)**, providing a robust sense of authority and institutional trust. **Amber Gold (#FCB900)** is used sparingly as a high-visibility accent for calls to action, urgent alerts, and status indicators that require immediate attention.

**Functional Color Application:**
- **Primary (Deep Navy):** Used for global navigation, headers, and primary branding elements.
- **Accent (Amber Gold):** Used for warnings, "Pending" states, and critical notification badges.
- **Success (Emerald):** Defined as a tertiary green for "Completed" or "Active" states.
- **Error (Crimson):** For critical failures or "Critical" priority indicators.
- **Surface & Backgrounds:** The main workspace uses a very light cool gray (`#F8FAFC`) to reduce eye strain, while cards and containers use pure white (`#FFFFFF`) to create distinct content islands.

## Typography

This design system uses a dual-font strategy. **Plus Jakarta Sans** is employed for headings to provide a modern, approachable character. **Inter** is used for all body text and data-heavy interfaces due to its exceptional legibility and support for tabular figures.

**Key Implementation Rules:**
- **Tabular Data:** Use `data-tabular` for all numeric values in tables (IDs, Dates, Times, Quantities) to ensure vertical alignment of digits.
- **Labels:** Use uppercase `label-lg` for section headers within cards or table headers to create clear visual hierarchy.
- **Hierarchy:** Maintain at least an 8px difference between primary and secondary headlines to ensure clear content scaffolding.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for the main content area, anchored by a fixed-width left navigation sidebar. 

**Structure:**
- **Global Sidebar:** 260px width, containing nested navigation and facility operations.
- **Top Bar:** 64px height, housing breadcrumbs, global search, and user profile.
- **Content Area:** 24px-32px padding on all sides.
- **Grid:** Use a 24px (`lg`) gutter between major components like dashboard cards. Use a 16px (`md`) gutter for smaller elements within cards.

**Reflow Rules:**
- **Desktop:** Full sidebar and multi-column dashboard cards.
- **Tablet:** Sidebar collapses to an icon-only rail; cards stack into 2-column or 1-column layouts based on content complexity.
- **Mobile:** Navigation moves to a bottom bar or hamburger menu; data tables convert to expandable list items.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and **Ambient Shadows**. The design avoids heavy, dark shadows in favor of subtle, diffused lifts that distinguish interactive surfaces from the background.

- **Level 0 (Background):** `#F8FAFC` - The base canvas.
- **Level 1 (Cards/Containers):** Pure white with a 1px border (`#E2E8F0`) and a subtle shadow (4px blur, 2% opacity black).
- **Level 2 (Hover/Active):** Slightly deeper shadow (8px blur, 4% opacity black) to indicate interactivity.
- **Level 3 (Modals/Popovers):** Focused elevation with a 16px blur shadow and a semi-transparent `#182F49` backdrop (20% opacity) to maintain clinical focus.

## Shapes

The design system employs a **Rounded** shape language (`0.5rem` / 8px) to soften the clinical environment and make the UI feel modern and accessible.

- **Standard Buttons & Inputs:** 8px corner radius.
- **Main Content Cards:** 12px or 16px corner radius to clearly define major data sections.
- **Status Badges/Chips:** Full pill-shape (circular ends) to distinguish them from interactive buttons.
- **Checkboxes:** Small 4px radius to maintain a precise, clickable look.

## Components

### Buttons
- **Primary:** Deep Navy background, white text. 8px radius.
- **Secondary:** White background, Deep Navy border and text.
- **Accent/Action:** Amber Gold background for specific workflows like "New Request" or "Admit Patient."
- **Ghost:** No background or border, used for utility actions (e.g., "Cancel," "View All").

### Tables
- **Header:** Light gray background (`#F1F5F9`), `label-md` bold text, 1px bottom border.
- **Rows:** 48px minimum height. Zebra striping is not required; use subtle hover states instead.
- **Cells:** Vertical alignment centered. Priority or Status columns should use Chips.

### Status Chips
- **Pending/Scheduled:** Amber Gold background (10% opacity) with dark gold text.
- **Completed/Active:** Green background (10% opacity) with dark green text.
- **Critical/Emergency:** Red background (10% opacity) with dark red text.

### Form Inputs
- **Style:** 1px border (`#E2E8F0`), 8px radius, white background.
- **Focus:** 2px solid Deep Navy border or a soft navy glow.
- **Labels:** Always placed above the input field, `label-md` weight.

### KPI Cards (Dashboard)
- Large numerical value (`headline-xl`) paired with a descriptive label.
- Top-right icon placement using a tonal background color that matches the metric's health/status.