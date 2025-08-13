# Biometric Key Management Testing (Mobile)

This guide verifies biometric-protected key access (Face ID / Touch ID / Android Biometric) and fallback behavior on devices that support secure hardware (Keychain/Keystore/Secure Enclave).

## Prerequisites

- Real device preferred (simulators may not support biometrics end-to-end)
- iOS with Face ID or Touch ID configured
- Android device with fingerprint/biometric configured
- Expo/React Native build running on device

## Test Scenarios

1) Initial Key Creation (Protected)
- Action: Trigger a flow that creates or stores a key with biometric protection enabled (SecureStore/Keychain/Keystore).
- Verify: System biometric prompt appears.
- Expect: Success when user authenticates; cancellation reported when user cancels.

2) Key Retrieval (Protected)
- Action: Attempt to read or use the protected key.
- Verify: Biometric prompt appears.
- Expect: Key material/use succeeds only after successful biometric auth.

3) Failed Authentication
- Action: Provide wrong biometric or cancel the prompt.
- Expect: Operation fails gracefully; sensitive data not leaked in logs or UI.

4) Device Without Biometrics
- Action: Run on a device without biometrics or with biometrics disabled.
- Expect: App uses fallback (PIN/password or disables the feature) with clear messaging.

5) Lockout/Multiple Failures
- Action: Trigger multiple failed biometric attempts leading to lockout.
- Expect: App detects lockout and offers secure fallback; no sensitive info disclosed.

6) OS Upgrade/Settings Change
- Action: Change biometric settings (add/remove fingerprint/face) and retry.
- Expect: Previously saved key access is revalidated; prompts occur as needed; stale keys are handled safely.

## Observability

- All events should be logged via structured logging (see `src/core/logger.ts`)
  - Do not log PII, keys, or raw secrets.
  - Include fields: `component`, `message`, `level`, `correlation_id`, `user_id` (if available).
  - Example metadata: `{ operation: 'biometric-key-read', success: true }`.

## Security Checks

- Ensure key material is never printed or stored in logs.
- Verify that memory is cleared after use (where applicable).
- Confirm prompts appear consistently on access attempts.

## Platform Notes

iOS:
- Prefer Keychain with `kSecAccessControlBiometryCurrentSet` or equivalent via library.
- If using Secure Enclave, ensure fallback behavior is implemented when unavailable.

Android:
- Use Keystore with `setUserAuthenticationRequired(true)` via library abstraction.
- Handle device credentials fallback if biometrics disabled.

## Pass/Fail Criteria

Pass:
- Biometric prompts appear for key operations on supported devices.
- Cancellations and failures handled gracefully; no sensitive data leaked.
- Fallbacks are secure and clearly communicated to the user.

Fail:
- Key operations succeed without required biometrics.
- Sensitive data exposed in logs or UI.
- Crashes, ANRs, or unhandled errors during biometric flows. 