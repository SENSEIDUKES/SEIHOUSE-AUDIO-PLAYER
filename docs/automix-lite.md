# AutoMix Lite Compatibility

AutoMix Lite is now the default mode of the unified AutoMix plugin:

```tsx
createAutomixPlugin()
createAutomixPlugin({ mode: "lite" })
```

The old `automix` prop and session toggle still create an internal Lite-mode
plugin for compatibility. New integrations should pass
`createAutomixPlugin({ mode: "lite" })` in the `plugins` array.

See [`automix.md`](./automix.md) for the current AutoMix API, fallback behavior,
and compatibility notes.
