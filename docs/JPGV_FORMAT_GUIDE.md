# .jpgv Format Developer Guide

This guide documents the `.jpgv` container implemented in `src/core/jpgv.ts` for storing vector metadata alongside a standard JPEG.

## Overview

- `.jpgv` stores a small trailer after the JPEG image data.
- The trailer begins with magic bytes `JPGV` followed by a compact header and a Base64-encoded payload (vector metadata, possibly compressed and/or encrypted).
- The original JPEG bytes are preserved intact, ensuring backward compatibility with standard viewers (which typically stop at JPEG EOI).

## Header

- Magic: `0x4A 0x50 0x47 0x56` (ASCII `JPGV`)
- Version: 1 byte (current `1`)
- Flags: 1 byte
  - Bit 0 (0x01): `isCompressed`
  - Bit 1 (0x02): `isEncrypted`
- Payload Length: 4 bytes, big-endian unsigned integer

Total header size: 10 bytes.

## Trailer Layout

```
[JPEG BYTES][JPGV HEADER (10 bytes)][PAYLOAD BYTES]
```

- `PAYLOAD BYTES` is the UTF-8 encoding of the Base64 string that represents the vector payload.
- If `isCompressed` is true, the payload Base64 represents compressed bytes; otherwise, it represents plain JSON bytes.
- If `isEncrypted` is true, the payload Base64 represents encrypted content per the crypto module.

## Functions

- `encodeJpgv(jpegBytes, vectorPayloadBase64, { isCompressed, isEncrypted })`
  - Appends header and payload to the JPEG bytes and returns a `.jpgv` byte array.
- `decodeJpgv(bytes)`
  - Returns `{ jpegBytes, vectorPayloadBase64, header }`.
- `stripJpgv(bytes)`
  - Returns the original JPEG bytes by removing the trailer.
- `validateJpgv(bytes)`
  - Validates magic, header bounds, payload length, and warns if JPEG EOI marker is missing before trailer.
- `detectImageContainer(bytes)`
  - Identifies `jpgv`, `jpeg`, or `unknown`.
- `isBackwardCompatibleJpeg(bytes)`
  - Verifies EOI is present before the trailer to ensure viewer compatibility.

## Flags and Versioning

- Current version is `1`. Unknown versions are permitted but produce a warning.
- Flags field encodes compression and encryption.

## Payload

- The payload is a Base64 string of either raw JSON bytes or compressed/encrypted bytes per configuration.
- For vector metadata preparation and encryption, see `src/core/vectorMetadata.ts` and related utilities.

## Backward Compatibility

- The implementation appends the trailer after the JPEG EOI marker, making `.jpgv` readable by standard viewers (which ignore trailing data).
- `isBackwardCompatibleJpeg` helps confirm this property.

## Error Handling & Logging

- All encode/decode operations log structured entries with component `exif` for observability.
- Sensitive data (raw embeddings, keys) must not be logged.

## Example Flow

1. Serialize and optionally compress vector metadata to bytes.
2. Convert to Base64 string.
3. Call `encodeJpgv(jpegBytes, base64, { isCompressed, isEncrypted })`.
4. To decode, call `decodeJpgv(bytes)` and reverse steps based on header flags.

## Security Notes

- If `isEncrypted` is set, payload confidentiality depends on upstream crypto (`AES-256-GCM` + `PBKDF2` in this project).
- Do not store secrets in plaintext in the payload. Follow least-privilege and secure memory handling. 