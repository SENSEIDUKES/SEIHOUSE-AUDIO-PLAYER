# Importing Sea-Workshop-Light Skins

SAP includes a scaffolding CLI that takes a Sea-Workshop-Light export and
generates the adapter, scoped CSS, registration, and review files needed to
mount it as a visual component.

## Supported Export Formats

| # | Format | Input | Notes |
|---|--------|-------|-------|
| 1 | **Split HTML/CSS/JS** | Directory with `*.html` + `*.css` + `*.js` | Most reliable. Vanilla web — uses a `ref` + `dangerouslySetInnerHTML` bridge. |
| 2 | **Structured React** | `.tsx` / `.jsx` file | Best fit for SAP. Clean functional component + hooks. |
| 3 | **Typed React + Tailwind** | `.tsx` / `.jsx` file with Tailwind utilities | ⚠️ Best-effort. Tailwind utilities won't render unless the build is configured for it. Recommend exporting as format #2. |

## CLI Usage

```bash
npm run skin:import -- --in <path> --slot <slot> --name "<Name>"
```

### Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--in <path>` | ✅ | — | `.tsx`/`.jsx` file (formats #2/#3) or directory (format #1). |
| `--slot <slot>` | | `seiCanvas` | `seiCanvas`, `scrubberCanvas`, or `controllerPanel`. |
| `--name "<Name>"` | ✅ | — | Display name; id is auto-slugified unless `--id` is given. |
| `--id <id>` | | *(from name)* | Override the auto-slugified id. |
| `--format <fmt>` | | `auto` | `auto`, `react`, `split`, or `tailwind`. |
| `--force` | | `false` | Overwrite an existing skin folder. |

### Example

```bash
npm run skin:import -- \
  --in ~/exports/my-visualiser.tsx \
  --slot seiCanvas \
  --name "My Visualiser"
```

This creates:

```
src/audio-player/visual-slots/components/imported/my-visualiser/
├── raw.tsx            # verbatim copy of the export
├── MyVisualiser.tsx   # adapter implementing VisualComponentDefinition
├── my-visualiser.css  # scoped CSS (if a co-located .css was found)
└── README.md          # review checklist
```

And regenerates `importedSkins.generated.ts` so the skin is registered
automatically.

## Post-Import Review

After importing, open the generated `<Pascal>.tsx` adapter and:

1. **Map props** in the `// TODO(skin): map props` block. Wire `settings` and
   `playback` to the raw component's props.
2. **Add default settings** in `<camel>DefaultSettings`. These seed the
   per-player settings store.
3. **Build the SettingsPanel** stub. Add controls for each setting so users
   can tune the visual from the workspace sheet.
4. **Check scoped CSS** — open `<id>.css` and look at the header comment for
   any selectors that couldn't be automatically scoped.

## CSS Scoping

The CLI runs every imported CSS file through a scoping transform that:

- Prefixes every top-level selector with `.sap-visual-<id>`.
- Rewrites `:root`, `html`, `body`, `*` to the scope root.
- Namespaces `@keyframes <name>` → `sap-<id>-<name>` and rewrites matching
  `animation` references.
- Preserves `@media` queries but scopes their inner selectors.
- Emits a header comment listing anything it couldn't confidently scope.

## Format #1 (Split) Caveats

The split adapter injects HTML via `dangerouslySetInnerHTML` and runs
`behavior.js` against the container DOM node using `new Function()`.

**Known limitations:**
- `behavior.js` cannot use ES module `import`/`export`.
- Global event listeners (`window.addEventListener`) will persist across
  mounts — clean up in a returned function or refactor to format #2.
- The script runs once on mount; it does not re-run when settings change.

## Registration

Imported skins are registered through the auto-generated
`importedSkins.generated.ts` barrel, which is spread into `builtins.ts`. The
CLI rewrites this file on every run by globbing `components/imported/*/`.
**Never edit `importedSkins.generated.ts` by hand** — your changes will be
overwritten.
