# Cross-Browser Compatibility Testing

This guide outlines recommended targets, tools, and a checklist to verify Stegnocchi’s behavior across modern browsers.

## Target Browsers

- Chrome (latest 2) — Windows, macOS
- Firefox (latest 2) — Windows, macOS
- Safari (latest 2) — macOS, iOS Safari
- Edge (latest 2) — Windows

Optional (usage-dependent):
- Chrome on Android
- Safari on iPadOS

## Test Setup

- Use local dev server: `npm run web`
- Enable HTTPS locally when feasible (self-signed) to test secure contexts
- Tools:
  - Browser DevTools (network, performance, memory, console)
  - Lighthouse for PWA and performance signals
  - Axe or equivalent for accessibility spot checks

## Functional Checklist

- File upload and EXIF read/write workflows
- .jpgv encode/decode and download flows
- Clipboard operations (if applicable) within secure context restrictions
- Drag-and-drop, gestures, and keyboard navigation
- Internationalization (i18n) rendering and RTL layout
- Voice input (if supported): detect gracefully when SpeechRecognition is unavailable

## Performance Checklist

- Initial load time and code-splitting behavior
- Memory usage when processing large images
- Smoothness of animations with reduced-motion enabled/disabled

## Security Checklist

- All requests over HTTPS; no mixed content
- CSP-compatible (avoid unsafe-inline where possible)
- No sensitive data in logs or error messages

## Troubleshooting Tips

- Polyfills: ensure required APIs (Blob, File, crypto subtle) are present or polyfilled
- MIME handling: verify download behavior (blob URLs) across browsers
- Input constraints: file pickers may differ by platform; test fallback UI

## CI Considerations

- Use Playwright or WebDriver to automate basic cross-browser smoke tests
- Collect screenshots for visual diffs where feasible 