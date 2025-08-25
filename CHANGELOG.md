# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-01-XX - Modular Architecture Refactor

### Added

#### Core Infrastructure
- **Modular Architecture**: Restructured codebase into logical modules (`@/core`, `@/web`, `@/native`, `@/api`, `@/cli`, `@/platform`)
- **Centralized Configuration**: Added `@/core/config` with environment-specific settings and type-safe configuration management
- **Platform Abstraction Layer**: Created `@/platform` module for unified cross-platform API access
- **Core Sub-modules**: Organized core functionality into logical groups (crypto, vectors, AI, monitoring, etc.)

#### Development Experience
- **ESLint Import Boundaries**: Comprehensive lint rules to enforce module separation and prevent architectural violations
- **Path Aliases**: Added module aliases (`@/core/*`, `@/web/*`, `@/native/*`, `@/api/*`, `@/cli/*`, `@/platform/*`) for cleaner imports
- **TypeScript Configuration**: Enhanced TypeScript config with new module resolution and strict boundary enforcement
- **Jest Multi-project Setup**: Configured Jest for module-specific testing with per-module coverage thresholds

#### Documentation
- **Migration Guide**: Comprehensive guide for migrating to modular architecture (`MIGRATION_GUIDE.md`)
- **Boundary Rules Documentation**: Detailed explanation of import restrictions and architectural guidelines (`.eslint-boundaries.md`)
- **Module API Documentation**: Clear documentation of each module's public interface and responsibilities

#### Security & Performance
- **Enhanced KDF Configuration**: Centralized key derivation function settings with environment-specific optimization
- **Secure Module Boundaries**: Prevented cross-contamination between platform-specific implementations
- **Tree-shaking Optimization**: Improved bundle size through better module organization and unused code elimination

### Changed

#### Breaking Changes
- **Import Paths**: All imports must now use module aliases instead of relative paths
- **Platform-specific Utilities**: Moved `*.web.ts` and `*.native.ts` files to their respective module directories
- **Configuration Access**: Replaced scattered constants with centralized configuration system
- **File Operations**: Direct platform imports replaced with `PlatformAPI` abstraction layer

#### Improved Architecture
- **Core Module Isolation**: Core business logic no longer imports platform-specific code
- **Platform Separation**: Web, native, API, and CLI modules are strictly separated
- **Cleaner Dependencies**: Reduced circular dependencies and improved module cohesion
- **Better Type Safety**: Enhanced TypeScript types with proper module boundaries

#### Refactored Components
- **Screen Components**: Updated to use `PlatformAPI` instead of direct platform imports
- **Crypto Operations**: Organized into logical sub-modules with better API surface
- **Vector Processing**: Grouped vector-related functionality into dedicated sub-module
- **File Handling**: Centralized through platform abstraction with fallback implementations

### Moved

#### File Relocations
- `src/utils/filePicker.web.ts` → `src/web/utils/filePicker.web.ts`
- `src/utils/fileSharing.web.ts` → `src/web/utils/fileSharing.web.ts`
- `src/utils/fileDownload.web.ts` → `src/web/utils/fileDownload.web.ts`
- `src/utils/userPreferences.web.ts` → `src/web/utils/userPreferences.web.ts`
- `src/core/kdf.web.ts` → `src/web/utils/kdf.ts`
- `src/core/secureDeletion.web.ts` → `src/web/utils/secureDeletion.ts`

#### Module Organization
- Created `src/core/crypto/index.ts` for crypto sub-module exports
- Created `src/core/vectors/index.ts` for vector processing sub-module exports
- Added `src/api/index.ts` and `src/cli/index.ts` as module entry points
- Enhanced `src/web/index.ts` and `src/native/index.ts` with proper platform abstractions

### Removed

#### Deprecated Exports
- Direct exports of platform-specific utilities from core module
- Scattered configuration constants throughout the codebase
- Cross-platform file operation implementations in shared utilities
- Legacy import patterns using relative paths

#### Cleanup
- Removed duplicate platform detection logic
- Eliminated circular dependencies between modules
- Removed unused exports and dead code through better linting

### Fixed

#### Architecture Issues
- **Circular Dependencies**: Eliminated circular imports between modules
- **Platform Contamination**: Prevented platform-specific code from leaking into core business logic
- **Import Inconsistencies**: Standardized import patterns across the entire codebase
- **Configuration Scatter**: Consolidated all configuration into a single, type-safe system

#### Build and Testing
- **Metro Configuration**: Updated to properly resolve new module aliases
- **Jest Setup**: Fixed module resolution for tests with new path structure
- **TypeScript Compilation**: Resolved module boundary issues and type conflicts
- **Linting Errors**: Fixed all existing lint violations and added boundary enforcement

### Security

#### Enhanced Security Model
- **Module Isolation**: Core cryptographic operations isolated from platform-specific code
- **Secure Configuration**: Environment-specific security settings with proper defaults
- **Dependency Boundaries**: Prevented unauthorized access between security-sensitive modules
- **Audit Trail**: Enhanced logging for module interactions and boundary crossings

### Performance

#### Optimization Improvements
- **Bundle Size Reduction**: Better tree-shaking through modular architecture
- **Build Performance**: Parallel compilation of independent modules
- **Runtime Efficiency**: Reduced runtime overhead through proper module boundaries
- **Caching Improvements**: Module-level cache invalidation for faster rebuilds

### Migration Notes

For developers upgrading from v1.x:

1. **Update Dependencies**: Install `eslint-plugin-import@^2.29.1`
2. **Run Migration Checks**: Use `npm run lint:boundaries` to identify issues
3. **Update Imports**: Replace relative imports with module aliases
4. **Use Platform Abstraction**: Replace direct platform imports with `@/platform` API
5. **Update Configuration**: Use `@/core/config` instead of hardcoded constants

See `MIGRATION_GUIDE.md` for detailed migration instructions.

---

## [1.5.0] - 2024-01-XX - Pre-Modular Release

### Added
- Enhanced EXIF steganography with multiple field support
- Improved error handling and logging
- Cross-platform file picker and sharing utilities
- Comprehensive test suite with coverage reporting

### Changed
- Updated to React Native 0.73.6
- Enhanced TypeScript configuration
- Improved build and deployment processes

### Fixed
- Cross-platform compatibility issues
- Memory leaks in crypto operations
- UI responsiveness on various screen sizes

---

## [1.0.0] - 2023-XX-XX - Initial Release

### Added
- AES-256-GCM encryption for message security
- PBKDF2 key derivation with 100,000 iterations
- EXIF metadata steganography
- Cross-platform support (iOS, Android, Web)
- React Navigation for screen management
- TypeScript for type safety
- Expo development platform integration

### Features
- Hide encrypted messages in image metadata
- Extract messages from steganographically encoded images
- Password-based encryption and decryption
- Real-time validation and error handling
- Beautiful gnocchi-themed UI design 