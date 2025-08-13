# Device Compatibility Testing Matrix

This matrix lists recommended devices/OS versions for compatibility testing. Adjust as needed for your target audience.

## iOS (Simulator/Devices)

- iPhone SE (2nd/3rd gen) — iOS 15/16
- iPhone 12/13/14 — iOS 16/17
- iPhone 14 Pro Max — iOS 17
- iPad (9th gen) — iPadOS 16
- iPad Air (M1) — iPadOS 17

Focus: safe area insets, dynamic type, dark mode, performance on older CPUs.

## Android (Emulator/Devices)

- Pixel 3 — Android 11
- Pixel 5 — Android 12
- Pixel 6/7 — Android 13
- Samsung Galaxy A series — Android 12 (lower-tier device)
- Samsung Galaxy S22/S23 — Android 13

Focus: varied DPIs, OEM skins, permissions, background tasks.

## Web (Desktop/Mobile)

- Chrome (latest) — Windows/macOS
- Firefox (latest) — Windows/macOS
- Safari (latest) — macOS/iOS
- Edge (latest) — Windows

Focus: responsive layouts (320, 375, 390, 768, 1024, 1280+), keyboard navigation, reduced motion.

## Feature Check Matrix (sample)

- EXIF read/write — iOS, Android, Web
- .jpgv encode/decode — iOS, Android, Web
- Voice input — Web (SpeechRecognition), mobile: off by default
- Hardware security (Face ID/Touch ID/Android Biometric) — iOS/Android
- Offline & PWA — Web

## Notes

- Prefer physical devices for performance and hardware validation
- Track issues by device/OS; include screenshots and logs
- Keep this matrix updated per analytics on active users 