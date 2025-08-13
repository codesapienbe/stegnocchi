# QA: React Native Encode/Decode Workflows

This checklist validates end-to-end encode/decode flows on React Native (Android/iOS emulators and devices).

## Setup

- Install dependencies: `npm install`
- Start Metro bundler: `npm start`
- Android: `npm run android` (AVD running)
- iOS (macOS): `npm run ios` (Simulator running)

## Encode Flow (Mobile)

- Pick an image from gallery (permissions requested once)
- Enter message; verify password strength and validation errors
- Toggle “Include Vector Metadata” and proceed
- Confirm progress indicators render
- Share/save output file; check file name suffix

Assertions:
- No red screen crashes
- Logs show INFO for file/crypto/exif operations
- Output can be viewed in system gallery/app

## Decode Flow (Mobile)

- Select processed file
- Extract message; wrong password yields a clear error, correct password succeeds
- If vector metadata included: faces/objects/scene previews present in result screen

## Accessibility & UX

- Touch targets >= 44px; gestures work (scroll, back nav)
- Dark mode appearances are correct
- Reduced-motion setting minimizes animations

## Performance

- Encode times acceptable for 4–10MB images
- No ANRs (Android) or hangs on older devices

## Regression Notes

- Capture device model/OS and screenshots
- Include relevant JSON log snippets 