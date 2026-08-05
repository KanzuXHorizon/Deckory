# Deckory Studio Modern Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inappropriate Studio dropdowns with accessible icon-led controls and complete responsive inspector behavior.

**Architecture:** Add focused reusable controls for icon choices, boolean toggles, and labeled command grids. Keep Studio responsible for document mutations while control primitives own semantics, keyboard behavior, and presentation. Extend the existing responsive layout with a controlled inspector drawer rather than hiding editing capability.

**Tech Stack:** React 19, TypeScript 5.9, Next.js 16, Lucide React, Vitest, CSS.

## Global Constraints

- Work directly on the current `main` checkout and preserve unrelated dirty changes.
- Do not add dependencies.
- Do not remove labels solely to make controls compact.
- Keep text and numeric values in native inputs.
- Minimum touch target is 44px for coarse pointers.
- All popovers and drawers support Escape and focus restoration.
- Do not commit unless explicitly requested.

---

### Task 1: Reusable Studio Controls

**Files:**
- Create: `apps/present/components/studio-controls.tsx`
- Create: `apps/present/components/studio-controls.test.tsx`

**Interfaces:**
- Produces `IconChoiceGroup`, `BooleanChoice`, `CommandGrid`, and typed option contracts.

- [ ] Add static-render tests for labels, selected state, disabled state, accessible names, and option descriptions.
- [ ] Implement semantic fieldset/radiogroup controls and command buttons using Lucide icons supplied by callers.
- [ ] Verify focused tests and typecheck.

### Task 2: Studio Icon Vocabulary and Integration

**Files:**
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/components/component-inspector.tsx`
- Test: `apps/present/components/studio-controls.test.tsx`

**Interfaces:**
- Consumes reusable controls from Task 1.
- Replaces layout, variant, transition, effect, chart type, tone, boolean, process icon, and accent selects where choices are fixed and visual.

- [ ] Define one icon/label/description vocabulary for layouts, variants, transitions, effects, components, tones, and process icons.
- [ ] Replace new-slide select with a command popover and explicit add action.
- [ ] Replace component palette with a labeled command grid that explains incompatibility.
- [ ] Replace inspector selects with icon choice groups or boolean controls while retaining native number/text fields.
- [ ] Verify tests and typecheck.

### Task 3: Responsive Inspector Drawer

**Files:**
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/app/globals.css`

**Interfaces:**
- Produces controlled `inspectorOpen` behavior with desktop persistence and mobile/tablet drawer presentation.

- [ ] Add an Inspector toggle in the canvas toolbar and top toolbar where needed.
- [ ] Add backdrop, close action, Escape handling, and focus restoration.
- [ ] Replace mobile `display:none` with a full-height drawer/sheet.
- [ ] Ensure slide rail, canvas, toolbar, and drawer remain usable at 320, 375, 768, 1024, and 1440 pixels.

### Task 4: Visual Polish and Verification

**Files:**
- Modify: `apps/present/app/globals.css`

**Interfaces:**
- Adds shared styles for icon choices, command grids, tooltips, selected/disabled states, and coarse-pointer targets.

- [ ] Add coherent hover, focus-visible, active, disabled, and reduced-motion states.
- [ ] Run `pnpm test`, `pnpm typecheck`, and `pnpm build`.
- [ ] Run the Impeccable detector once on changed UI targets.
- [ ] Run Playwright smoke at desktop, tablet, and mobile sizes; verify keyboard, drawer, popovers, overflow, and console output.
- [ ] Inspect final diff and `git diff --check`.
