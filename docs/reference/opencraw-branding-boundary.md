---
summary: "OpenCraw visible-branding scope, source assets, compatibility boundary, and reconciliation rules"
title: "OpenCraw visible-branding boundary"
read_when:
  - Changing OpenCraw names, logos, icons, or public presentation
  - Reconciling Control UI, README, or container metadata from openclaw/openclaw
  - Deciding whether an OpenClaw identifier is branding or a compatibility contract
---

# OpenCraw visible-branding boundary

This record defines the deliberately narrow branding layer maintained by the
OpenCraw fork. It makes OpenCraw the default visible product identity without
renaming upstream compatibility contracts or obscuring OpenClaw attribution.

## Pre-implementation inventory

The inventory was fixed before application edits on 2026-07-26. The starting
OpenCraw commit was `4c10561ebcc9f3bdc30ff40da3bce7ea172dc1e5`.
The configured upstream reference was refreshed without merging from
`913a6a83c54c2c255bcb3ab7f17c075e579bdd9e` to
`01f8bd9d12d25b616f4c16773b019d0816d42040`. The affected README, Docker,
Control UI shell, service worker, locale, and About-page files all differ from
current upstream, so future synchronization must reconcile behavior and this
branding boundary rather than reuse the current patch mechanically.

### Visible surfaces in scope

- the GitHub README, repository description, and topics;
- browser title and mount-recovery fallback copy;
- PWA name, short name, icons, favicons, Apple touch icon, and default
  notification identity;
- connecting, login, approval, top-bar, sidebar, and default-avatar imagery;
- accessible product labels in those surfaces;
- product-semantic Control UI English copy, including onboarding, chat,
  approval, memory import, connection, task, and error states;
- the visible system-agent identity in prompts, greetings, setup, rescue,
  approval, diagnostics, errors, and the interactive TUI;
- the About page product name, CrawCraw artwork, fork repository link, upstream
  links, and attribution statement;
- fork-owned Docker/OCI title, description, source, and documentation labels;
- narrow regression controls for the visible boundary and retained contracts.

### Imagery to replace

- the animated OpenClaw favicon/Clawd mark used by browser, loading, login, and
  approval surfaces;
- the OpenClaw Apple touch icon used by the top bar, sidebar, assistant-avatar
  fallback, approval page, PWA, and notifications;
- the generated crimson Clawd hero on the About page;
- the OpenClaw-first README presentation.

The animated chat welcome mascot, Lobsterdex visits, dreaming lobster,
configuration palette previews, and channel empty-state mascot are feature
surfaces rather than passive product logos. They remain deferred until a
CrawCraw-compatible animation implementation can preserve drag/drop, tease,
catch, sleep, palette, visit, and other feature behavior. Native application
artwork and display names also remain deferred until OpenCraw owns a supported
native build, signing, update, and distribution path.

### Visible text to replace

Visible product identity uses `OpenCraw`; browser and Control UI identity uses
`OpenCraw Control`. Product-semantic uses such as `Ask OpenClaw`, `Message
OpenClaw`, onboarding copy, product-authored status/error copy, and fork-owned
container descriptions become OpenCraw wording.

OpenClaw wording remains when it identifies a literal command, configuration
or state contract, an upstream runtime/application, or an external upstream
resource. The official OpenClaw mobile and desktop applications remain labeled
as OpenClaw products.

The system agent therefore presents itself as OpenCraw while retaining the
reserved `openclaw` agent/session IDs, the `openclaw` tool and command, and the
OpenClaw configuration/state contracts used underneath that visible identity.

English remains the Control UI source locale and the default product-language
surface. Non-English sentence-level branding changes are deferred to the
maintained translation workflow; broad token replacement would incorrectly
rename upstream products and compatibility identifiers inside translated text.

## Authoritative assets and generation

`docs/assets/opencraw/opencraw-crawcraw-source.png` is an exact repository copy
of the U/D-approved `CrawCraw1.png` and is the visual authority. Its SHA-256 is
`7dc41edc8522df5badb7e73e1d91908e2c8a80fff9216c4ad5bcfc8c1b8f3aaf`.

The approved transparent mark, favicon, and wordmark derivatives preserve the
same character and visual direction. They are maintained as intentionally
raster sources because converting the illustrated CrawCraw artwork to paths
would constitute a material redesign. Bitmap data must not be embedded in an
SVG merely to obtain an SVG filename.

| Maintained source              | Dimensions / content     | SHA-256                                                            |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------ |
| `opencraw-crawcraw-source.png` | 1024×1536 RGBA           | `7dc41edc8522df5badb7e73e1d91908e2c8a80fff9216c4ad5bcfc8c1b8f3aaf` |
| `opencraw-wordmark.png`        | 1768×363 RGBA            | `9f85267862b384c9d0e0c3f59864032c936d2e079834ba07ded0c3f23b562331` |
| `opencraw-mark-180.png`        | 180×180 RGBA             | `85ef8a0dd5b0d0fbcfaae7cab002e072347893338bd76773161b5d27cf551415` |
| `opencraw-mark-32.png`         | 32×32 RGBA               | `5a5de424316037890600602ac9707ce41be2bcc59324e3ca6e5b94bf36dbd104` |
| `opencraw-favicon.ico`         | 16/32/48/64/128/256 RGBA | `5f5d279d1194e93c99897b77a9103cc368f4ebe2e1ac9c299e3b8244dcd4a7ab` |

The repository-relative asset generator copies the approved, size-specific
source files into their compatibility-facing Control UI slots. It also creates
the 192×192 and 512×512 installable-PWA icons by applying a centered square
`cover` transform directly to the authoritative 1024×1536 source. The transform
uses Rastermill's pinned internal Photon backend, strips metadata, and uses a
fixed PNG compression level. It has no absolute paths, font dependency, network
dependency, or native-tool fallback. Check mode regenerates the PWA bytes in
memory and compares every output byte with the tracked asset.

Generated PWA assets use the stable `opencraw-pwa-192.png` and
`opencraw-pwa-512.png` names. New maintained source assets use stable
`opencraw-*` filenames; legacy public slot names remain only where
browser/application compatibility benefits from them.

| Generated asset        | Dimensions | SHA-256                                                            |
| ---------------------- | ---------- | ------------------------------------------------------------------ |
| `opencraw-pwa-192.png` | 192×192    | `0ab68fc382dc013a1653a06c1a27528d6e954193803ed28147de7dc74b9bad0f` |
| `opencraw-pwa-512.png` | 512×512    | `3e4e07dca61f071b681104892fb215fb89baa2388e7cdb02ee74cd23d72276f2` |

The artwork was supplied and approved by the U/D for OpenCraw use. No external
font file is distributed or required: the approved wordmark is a final raster
asset, not live font-rendered output. Any material change to CrawCraw's
appearance or typography requires renewed U/D review.

## Compatibility identifiers that remain OpenClaw

The following categories are not display-branding defects and must not be
changed by a branding-only patch:

- the `openclaw` command and `openclaw.mjs` launcher;
- `openclaw.json`, `.openclaw`, `OPENCLAW_*`, schema keys, state paths, and
  database names;
- package names, `@openclaw/*` scopes, plugin manifests, extension IDs, and
  published-artifact identities;
- protocol routes, headers, model IDs, client IDs, discovery names, and deep
  links;
- browser-storage keys, custom elements, CSS/runtime identifiers, service
  worker cache/tag identifiers, and native bridge events;
- bundle IDs, signing identities, app groups, keychains, and update channels;
- upstream official application names and ClawHub.

Internal identifiers may continue to contain `openclaw`, `OpenClaw`, `clawd`,
or `lobster` where they implement one of these contracts or the deferred
mascot features. No repository-wide prohibition on the word `OpenClaw` is
permitted.

## Attribution that remains

- the MIT license and OpenClaw Foundation copyright notice;
- third-party notices, source headers, history, and changelog;
- the GitHub fork relationship and explicit README attribution;
- clearly labeled upstream OpenClaw source, website, documentation, community,
  release, official-app, and ClawHub links.

The About page must distinguish the OpenCraw fork repository from upstream
OpenClaw resources and state that OpenCraw is based on OpenClaw. Upstream links
must never be relabeled as OpenCraw-owned services.

## Validation and reconciliation rules

Every branding change must prove:

1. generated assets are byte-deterministic and have the declared PNG/ICO
   dimensions and formats;
2. visible OpenCraw names and approved assets are present in source and built
   Control UI surfaces, and the visible system-agent identity remains OpenCraw;
3. primary OpenClaw product artwork does not return to the approved passive
   branding slots;
4. retained commands, configuration, state, package, protocol, storage, and
   native identifiers remain unchanged;
5. upstream links, MIT license text, notices, and attribution remain intact;
6. desktop/mobile and dark/light rendering, accessibility labels, fallback,
   connection, login, About, approval, and notification states remain usable;
7. existing browser storage and persisted runtime state require no migration.

On each upstream synchronization, compare this record with upstream changes to
the affected surfaces. Retain the visible OpenCraw layer, adapt it to current
upstream structure, and accept an upstream replacement only when it preserves
the same visible identity, compatibility boundary, attribution, and validation
coverage.
