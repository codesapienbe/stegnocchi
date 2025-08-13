# QA: Web Encode/Decode Workflows

This checklist validates end-to-end encode/decode flows on web (desktop and mobile emulation).

## Setup

- Start web server: `npm run web`
- Use HTTPS if possible for clipboard/voice features
- Open DevTools for logs and performance traces

## Encode Flow (Web)

- Upload JPEG via click and via drag-and-drop
- Enter message; validate password strength feedback
- Toggle “Include Vector Metadata” and proceed
- Confirm progress indicators render (encryption/injection)
- Download output JPEG/.jpgv and verify file name pattern

Assertions:
- No console errors
- JSON logs show INFO for crypto/exif operations
- Output opens in standard viewer; file size change reasonable

## Decode Flow (Web)

- Load previously generated file (JPEG or .jpgv)
- Extract message; verify password prompt and error on wrong password
- If vector metadata included: preview faces/objects/scene sections appear

Assertions:
- No sensitive data in logs
- Errors are non-revealing and actionable

## Mobile Emulation (Browser DevTools)

- Test common sizes (375x667, 390x844, 411x891)
- Verify touch targets (>= 44px) and scroll behaviors
- Check reduced-motion toggles disable non-essential animations

## Accessibility & i18n (Spot Checks)

- Keyboard navigation focus states
- Screen reader announces button labels
- Switch locale (where supported) and verify content updates

## Performance

- Measure time-to-first-interaction and encode time for ~4–10MB images
- Ensure UI remains responsive; avoid long main-thread blocks

## Regression Notes

- Keep screenshots for visual diffs
- Capture `application.log` JSON excerpts for key steps 