# Color Tokens

All tokens are defined in `ui/src/styles/base.css` under `:root` (dark mode default) and `:root[data-theme-mode="light"]` (light override). Theme families may override accent tokens while keeping shared surface tokens.

> Contrast ratios are measured against `--bg` (`#0e1015`) in dark mode using WCAG relative luminance formula. AA requires ≥4.5:1 for normal text, ≥3:1 for large text and UI components.

---

## Background Scale

| Token           | Dark Value | Light Value | Use                           | Don't                          |
| --------------- | ---------- | ----------- | ----------------------------- | ------------------------------ |
| `--bg`          | `#0e1015`  | `#f7faff`   | Page root, deepest layer      | Never use on elevated surfaces |
| `--bg-accent`   | `#13151b`  | `#eef4fb`   | Sidebar, secondary panels     | Not for interactive card hover |
| `--bg-elevated` | `#191c24`  | `#ffffff`   | Raised panels, modals         | Not for inline elements        |
| `--bg-hover`    | `#1f2330`  | `#e8f1fa`   | List item hover state         | Not for default state          |
| `--bg-muted`    | `#1f2330`  | `#e8f1fa`   | Subtle fills, disabled states | Not for focus states           |

Light mode uses cool cloud surfaces, blue-gray borders, and a contrast-adjusted
`#0068c9` accent (5.2:1 on `--bg`). Dark mode uses the production wordmark blue
`#0088ff` (5.4:1 on `--bg`).

## Surface / Card

| Token                  | Dark Value               | Light Value           | Use                           | Don't           |
| ---------------------- | ------------------------ | --------------------- | ----------------------------- | --------------- |
| `--card`               | `#161920`                | `#ffffff`             | Card backgrounds, composer    | Avoid as border |
| `--card-foreground`    | `#f0f0f2`                | `#172230`             | Text on cards                 | —               |
| `--card-highlight`     | `rgba(255,255,255,0.04)` | `rgba(31,64,97,0.03)` | Inner highlight on hover      | Not for text    |
| `--popover`            | `#191c24`                | `#ffffff`             | Dropdown, tooltip backgrounds | —               |
| `--popover-foreground` | `#f0f0f2`                | `#172230`             | Text inside popovers          | —               |

## Text

| Token            | Dark Value | Contrast on `--bg` | Use                      |
| ---------------- | ---------- | ------------------ | ------------------------ |
| `--text`         | `#d4d4d8`  | ~12.9:1 ✅         | Body copy, labels        |
| `--text-strong`  | `#f4f4f5`  | ~17.3:1 ✅         | Headings, emphasis       |
| `--muted`        | `#8b8b94`  | ~5.7:1 ✅          | Placeholder, metadata    |
| `--muted-strong` | `#898990`  | ~5.6:1 ✅          | Secondary text, captions |

## Craw Accent

| Token                   | Dark Value            | Light Value            | Use                                            |
| ----------------------- | --------------------- | ---------------------- | ---------------------------------------------- |
| `--accent` / `--ring`   | `#0088ff`             | `#0068c9`              | Primary text, active indicator, and focus ring |
| `--accent-hover`        | `#33a0ff`             | `#0057aa`              | Hover state of accent elements                 |
| `--accent-subtle`       | `rgba(0,136,255,0.1)` | `rgba(0,104,201,0.08)` | Active and selected tinted fills               |
| `--accent-glow`         | `rgba(0,136,255,0.2)` | `rgba(0,104,201,0.12)` | Focus and elevation glow                       |
| `--primary`             | `#0088ff`             | `#0068c9`              | Filled primary controls                        |
| `--primary-hover`       | `#33a0ff`             | `#0057aa`              | Filled primary control hover                   |
| `--primary-foreground`  | `#061524`             | `#ffffff`              | Text and icons on primary fills                |
| `--selection-bg` / `fg` | `#0068c9` / `#ffffff` | `#0068c9` / `#ffffff`  | Selected text                                  |

## Secondary Accent

| Token               | Dark Value             | Light Value           | Use                           |
| ------------------- | ---------------------- | --------------------- | ----------------------------- |
| `--accent-2`        | `#5bbcff`              | `#005ea8`             | Secondary emphasis and badges |
| `--accent-2-muted`  | `rgba(91,188,255,0.7)` | `rgba(0,94,168,0.75)` | Muted secondary emphasis      |
| `--accent-2-subtle` | `rgba(91,188,255,0.1)` | `rgba(0,94,168,0.08)` | Tinted secondary background   |

## Semantic

| Token           | Dark Value | Light Value | Contrast on `--bg` | Use                                           |
| --------------- | ---------- | ----------- | ------------------ | --------------------------------------------- |
| `--ok`          | `#22c55e`  | `#15803d`   | ~8.4:1 ✅          | Success states, token meter low               |
| `--warn`        | `#f59e0b`  | `#b45309`   | ~8.9:1 ✅          | Warnings, degraded states                     |
| `--danger`      | `#ef4444`  | `#dc2626`   | ~5.1:1 ✅          | Errors, destructive actions, token meter high |
| `--info`        | `#3b82f6`  | `#2563eb`   | ~5.2:1 ✅          | Informational, token meter mid                |
| `--destructive` | `#ef4444`  | —           | ~5.1:1 ✅          | Destructive action labels                     |

## Border

| Token             | Dark Value | Light Value | Use                              |
| ----------------- | ---------- | ----------- | -------------------------------- |
| `--border`        | `#1b2a3a`  | `#dfe7f0`   | Default subtle borders, dividers |
| `--border-strong` | `#2d4359`  | `#c7d3df`   | Active/focused borders           |
| `--border-hover`  | `#516c87`  | `#74889d`   | Hover-state borders              |

## Focus

| Token          | Value                                                                             | Use                            |
| -------------- | --------------------------------------------------------------------------------- | ------------------------------ |
| `--ring`       | `#0088ff`                                                                         | Dark-mode focus ring colour    |
| `--focus-ring` | `0 0 0 2px var(--bg), 0 0 0 3px color-mix(in srgb, var(--ring) 80%, transparent)` | Standard focus ring box-shadow |
| `--focus-glow` | `0 0 0 2px var(--bg), 0 0 0 3px var(--ring), 0 0 16px var(--accent-glow)`         | Elevated interactive elements  |

---

## Anti-Patterns

- ❌ Hardcoded hex colours in component CSS — always use tokens
- ❌ `--accent-subtle` as text colour — fails contrast on dark backgrounds
- ❌ Using `--accent-2` for success — use `--ok` only
- ❌ Using `--danger` for non-error states (e.g. "hot feature") — reserve for errors and destructive actions
- ❌ `--muted-strong` for normal body text — reserve it for secondary text and use `--text` for body copy
