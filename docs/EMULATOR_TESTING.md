# Visual Layout Testing on Emulators/Simulators

This guide outlines how to test Stegnocchi’s UI on popular mobile screen sizes using Android Emulator, iOS Simulator, and web responsive tools.

## Prerequisites

- Expo CLI installed (`npm i -g @expo/cli`)
- Android Studio with an AVD configured (Pixel 5/6 recommended)
- On macOS: Xcode with iOS Simulator (iPhone 8/SE, iPhone 13/14, iPad)
- Node.js v18+

## Start the project

```bash
npm install
npm start
```

## Android Emulator (Windows/macOS/Linux)

1. Open Android Studio > Device Manager
2. Create/start an AVD (e.g., Pixel 5 @ 1080x2340)
3. From terminal:
   ```bash
   npm run android
   ```
4. Verify key screens:
   - Main screen layout on portrait/landscape
   - Touch targets >= 44px
   - Toggle states and buttons

Recommended sizes:
- Small: 360x640 (hdpi)
- Medium: 411x891 (xxhdpi)
- Large: 480x960

## iOS Simulator (macOS)

1. Open Xcode > Developer Tools > Simulator
2. Boot a device (e.g., iPhone SE, iPhone 13 Pro Max, iPad 9th gen)
3. From terminal:
   ```bash
   npm run ios
   ```
4. Validate:
   - Safe area insets
   - Font scaling/accessibility
   - Dark mode appearance

## Web (Responsive Testing)

1. Start web server:
   ```bash
   npm run web
   ```
2. Open the app in the browser and use DevTools > Responsive Design Mode:
   - iPhone SE (375x667)
   - iPhone 14 Pro Max (430x932)
   - Pixel 5 (393x851)
   - iPad (768x1024)
   - Desktop breakpoints (1024+, 1280+)

## Visual Checklist

- Headers and footers are visible and not overlapped by notches/cutouts
- Interactive elements meet minimum touch size (44px)
- Text wraps and remains readable at different DPIs
- Reduced-motion setting disables non-essential animations
- Light/dark themes render correctly

## Troubleshooting

- If emulator doesn’t connect:
  - Ensure Metro bundler is running
  - Verify adb (Android) connection: `adb devices`
- On iOS, if build doesn’t boot:
  - Ensure Xcode command-line tools are set
  - Restart Simulator

## Notes

- For performance profiling, prefer physical devices where possible
- Keep animations minimal on low-end devices and use the reduced motion setting 