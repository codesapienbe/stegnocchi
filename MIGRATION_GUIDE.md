# Migration Guide: Modular Architecture Refactor

This guide helps developers migrate their code to the new modular architecture introduced in version 2.0.0.

## Overview

The codebase has been refactored from a monolithic structure to a modular architecture with clear separation of concerns:

- **`@/core`**: Platform-agnostic business logic
- **`@/web`**: Web-specific implementations  
- **`@/native`**: React Native-specific implementations
- **`@/api`**: Server/API functionality
- **`@/cli`**: Command-line interface
- **`@/platform`**: Abstraction layer for cross-platform code

## Quick Migration Checklist

- [ ] Update imports to use new module aliases
- [ ] Replace direct platform imports with `@/platform` abstraction
- [ ] Move platform-specific code to appropriate modules
- [ ] Update configuration to use centralized `@/core/config`
- [ ] Run `npm run lint:boundaries` to check compliance
- [ ] Update tests to use new module structure

## Import Changes

### Before (v1.x)
```typescript
// Old imports
import { encrypt } from '../core/crypto';
import { pickFiles } from '../utils/filePicker.web';
import { logger } from '../core/logger';
```

### After (v2.x)
```typescript
// New imports with aliases
import { encrypt } from '@/core/crypto';
import { PlatformAPI } from '@/platform';
import { logInfo, Component } from '@/core/logger';

// Use platform abstraction
const filePicker = PlatformAPI.useFilePicker();
```

## Platform-Specific Code Migration

### File Operations

#### Before
```typescript
// Direct platform imports (now forbidden)
import { pickFiles } from '@/utils/filePicker.web';
import { shareFile } from '@/utils/fileSharing.native';

const handleFilePick = async () => {
  const result = await pickFiles({ mediaTypes: 'images' });
  // ...
};
```

#### After
```typescript
// Use platform abstraction
import { PlatformAPI } from '@/platform';

const handleFilePick = async () => {
  const pickFiles = PlatformAPI.useFilePicker();
  const result = await pickFiles({ mediaTypes: 'images' });
  // ...
};
```

### Configuration Access

#### Before
```typescript
// Scattered configuration
const maxFileSize = 50 * 1024 * 1024;
const kdfIterations = 100000;
```

#### After
```typescript
// Centralized configuration
import { getCoreConfig } from '@/core/config';

const config = getCoreConfig();
const maxFileSize = config.images.maxFileSize;
const kdfIterations = config.crypto.defaultKdfIterations;
```

### Crypto Operations

#### Before
```typescript
// Direct crypto imports
import { deriveKeyKdf } from '@/core/kdf';
import { encrypt } from '@/core/crypto';
```

#### After
```typescript
// Use organized crypto sub-module
import { CoreCrypto } from '@/core';
// or
import { deriveKeyKdf } from '@/core/crypto';
import { encrypt } from '@/core/crypto';
```

## Module-Specific Migrations

### Core Module Changes

The core module now has organized sub-modules:

```typescript
// Before
import { encrypt } from '@/core/crypto';
import { vectorSearch } from '@/core/vectorSearch';

// After - can still use direct imports
import { encrypt } from '@/core/crypto';
import { vectorSearch } from '@/core/vectorSearch';

// Or use sub-module imports for better organization
import { CoreCrypto, CoreVectors } from '@/core';
const encrypted = await CoreCrypto.encrypt(data);
const results = await CoreVectors.vectorSearch(query);
```

### Web Module Changes

Web-specific utilities have been moved:

```typescript
// Before
import { downloadFile } from '@/utils/fileDownload.web';

// After
import { downloadFileWeb } from '@/web';
// or through platform abstraction
import { PlatformAPI } from '@/platform';
const download = PlatformAPI.useDownload();
```

### Component Changes

UI components should use platform abstraction:

```typescript
// Before
import { pickFiles } from '@/utils/filePicker';

// After
import { PlatformAPI } from '@/platform';

const MyComponent = () => {
  const pickFiles = PlatformAPI.useFilePicker();
  
  const handlePick = async () => {
    const result = await pickFiles({ mediaTypes: 'images' });
    // ...
  };
};
```

## Breaking Changes

### Removed Direct Exports

The following imports are no longer available and must be migrated:

| Old Import | New Import | Notes |
|------------|------------|-------|
| `@/utils/filePicker.web` | `@/web/utils/filePicker` or `@/platform` | Use platform abstraction |
| `@/utils/fileSharing.web` | `@/web/utils/fileSharing` or `@/platform` | Use platform abstraction |
| `@/core/kdf.web` | `@/web/utils/kdf` | Moved to web module |
| `@/core/secureDeletion.web` | `@/web/utils/secureDeletion` | Moved to web module |

### Configuration Changes

```typescript
// Before - scattered constants
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// After - centralized config
import { getCoreConfig } from '@/core/config';
const config = getCoreConfig();
const maxFileSize = config.images.maxFileSize;
```

### Platform Detection Changes

```typescript
// Before
import { Platform } from 'react-native';
const isWeb = Platform.OS === 'web';

// After
import { PlatformAPI } from '@/platform';
const platformInfo = PlatformAPI.getPlatformInfo();
const isWeb = platformInfo.isWeb;
```

## Testing Changes

### Jest Configuration

The Jest configuration has been updated for modular testing:

```javascript
// New module-specific test patterns
"testMatch": [
  "src/**/__tests__/**/*.test.{ts,tsx}",
  "src/**/*.test.{ts,tsx}"
],
"collectCoverageFrom": [
  "src/core/**/*.{ts,tsx}",
  "src/web/**/*.{ts,tsx}",
  "src/native/**/*.{ts,tsx}",
  "!src/**/index.ts"
]
```

### Test Imports

```typescript
// Before
import { encrypt } from '../../../core/crypto';

// After
import { encrypt } from '@/core/crypto';
```

## Environment Configuration

### Development

```typescript
import { updateCoreConfig, getEnvironmentConfig } from '@/core/config';

// Apply development-specific settings
updateCoreConfig(getEnvironmentConfig('development'));
```

### Production

```typescript
import { updateCoreConfig, getEnvironmentConfig } from '@/core/config';

// Apply production-specific settings
updateCoreConfig(getEnvironmentConfig('production'));
```

## Step-by-Step Migration Process

### 1. Update Package Dependencies
```bash
npm install eslint-plugin-import@^2.29.1
```

### 2. Run Automated Migration (if available)
```bash
# Future: automated migration script
npm run migrate:modular
```

### 3. Update Imports
```bash
# Use find/replace in your editor
# Replace '../core/' with '@/core/'
# Replace '../utils/' with '@/utils/' or '@/platform'
```

### 4. Fix Platform-Specific Code
```bash
# Check for boundary violations
npm run lint:boundaries

# Fix any violations using platform abstraction
```

### 5. Update Tests
```bash
# Run tests to check for import issues
npm test

# Update any failing tests with new imports
```

### 6. Verify Build
```bash
# Check TypeScript compilation
npm run type-check

# Verify builds work
npm run build
```

## Common Issues and Solutions

### Issue: "Cannot resolve module '@/platform'"
**Solution**: Ensure your TypeScript/Metro config includes the new path aliases.

### Issue: "import/no-restricted-paths" lint error
**Solution**: Use platform abstraction instead of direct platform imports:
```typescript
// Bad
import { pickFiles } from '@/web/utils/filePicker';

// Good
import { PlatformAPI } from '@/platform';
const pickFiles = PlatformAPI.useFilePicker();
```

### Issue: Core module importing UI components
**Solution**: Move UI-related code out of core or use dependency injection:
```typescript
// Bad
import { Button } from '@/components/Button';

// Good - use interfaces
interface UIHandler {
  showButton(config: ButtonConfig): void;
}
```

### Issue: Circular dependency detected
**Solution**: Extract shared types to a separate module or use dynamic imports:
```typescript
// Bad
// A imports B, B imports A

// Good - extract shared types
// types.ts exports interfaces
// A and B both import from types.ts
```

## Getting Help

1. **Lint Errors**: Run `npm run lint:boundaries` for specific guidance
2. **Type Errors**: Check the new module exports in `src/*/index.ts`
3. **Build Issues**: Verify path aliases in `tsconfig.json` and `metro.config.js`
4. **Documentation**: See `.eslint-boundaries.md` for detailed rules

## Rollback Plan

If you need to rollback:

1. Restore from git before migration:
   ```bash
   git checkout pre-modular-refactor
   ```

2. Or manually revert specific changes:
   - Restore old import paths
   - Move files back to original locations
   - Remove new configuration files

## Performance Improvements

The new architecture provides:

- **Better tree-shaking**: Unused modules are eliminated from bundles
- **Faster builds**: Parallel compilation of independent modules
- **Improved caching**: Module-level cache invalidation
- **Reduced bundle size**: Platform-specific code only included when needed

## Next Steps

After migration:

1. **Optimize imports**: Use sub-module imports for better tree-shaking
2. **Add module tests**: Create module-specific test suites
3. **Customize configuration**: Adjust `@/core/config` for your needs
4. **Extend platform abstraction**: Add new platform-specific functionality

## Support

For issues with migration:
- Check existing GitHub issues
- Create new issue with "migration" label
- Include error messages and code samples 