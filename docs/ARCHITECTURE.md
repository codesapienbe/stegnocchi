# Stegnocchi Architecture Documentation

## Overview

Stegnocchi is a cross-platform EXIF steganography application built with React Native and Expo. The architecture is designed to support both web and mobile platforms while maintaining a clean separation of concerns and maximizing code reuse.

## Architecture Principles

### 1. Platform-Agnostic Core
- **Core Module**: Contains all business logic, cryptography, and EXIF manipulation
- **No Platform Dependencies**: Core functionality has no DOM, Node.js, or platform-specific dependencies
- **Pure Functions**: All core functions are pure and testable
- **Type Safety**: Full TypeScript coverage with strict typing

### 2. Platform Abstraction Layer
- **Unified APIs**: Common interfaces for web and native platforms
- **Platform Detection**: Automatic platform detection and capability checking
- **Feature Flags**: Platform-specific feature availability
- **Error Handling**: Platform-specific error messages and handling

### 3. Modular Design
- **Separation of Concerns**: Clear boundaries between core, web, native, and platform layers
- **Dependency Injection**: Platform-specific implementations injected at runtime
- **Loose Coupling**: Modules communicate through well-defined interfaces
- **High Cohesion**: Related functionality grouped together

## Directory Structure

```
src/
├── core/                 # Platform-agnostic business logic
│   ├── crypto.ts        # Cryptographic operations
│   ├── exif.ts          # EXIF manipulation
│   ├── validation.ts    # Input validation
│   ├── logger.ts        # Structured logging
│   └── index.ts         # Core module exports
├── web/                 # Web-specific implementations
│   ├── components/      # Web UI components
│   ├── animations/      # Web animation libraries
│   ├── hooks/           # Web-specific hooks
│   ├── utils/           # Web utilities
│   └── index.ts         # Web module exports
├── native/              # React Native implementations
│   ├── components/      # Native UI components
│   ├── animations/      # Native animation libraries
│   ├── hooks/           # Native-specific hooks
│   ├── utils/           # Native utilities
│   └── index.ts         # Native module exports
├── platform/            # Platform abstraction layer
│   └── index.ts         # Unified platform APIs
├── components/          # Shared UI components
│   ├── animations/      # Cross-platform animations
│   └── layout/          # Layout components
├── hooks/               # Shared React hooks
├── navigation/          # Navigation configuration
├── screens/             # Application screens
├── utils/               # Shared utilities
├── types/               # TypeScript type definitions
└── __tests__/           # Test files
```

## Core Module Architecture

### Cryptography (`src/core/crypto.ts`)
- **AES-256-GCM Encryption**: Industry-standard encryption algorithm
- **PBKDF2 Key Derivation**: Secure password-based key derivation
- **Salt/IV Generation**: Cryptographically secure random generation
- **Memory Management**: Secure clearing of sensitive data

### EXIF Manipulation (`src/core/exif.ts`)
- **Field Reading**: Extract EXIF data from JPEG files
- **Field Writing**: Inject data into EXIF fields
- **Payload Management**: Handle encrypted payload storage
- **Validation**: Ensure EXIF data integrity

### Validation (`src/core/validation.ts`)
- **File Validation**: Check file type, size, and integrity
- **Password Validation**: Strength checking and common password detection
- **Message Validation**: Length and content validation
- **Operation Validation**: Complete workflow validation

### Logging (`src/core/logger.ts`)
- **Structured Logging**: JSON-formatted logs with consistent fields
- **Log Levels**: ERROR, WARN, INFO, DEBUG with appropriate filtering
- **Correlation IDs**: Request tracing and debugging
- **Security**: Sensitive data sanitization

## Platform Abstraction Layer

### Platform Detection
```typescript
export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
```

### Platform Capabilities
```typescript
export const PlatformCapabilities = {
  hasFileAPI: isWeb,
  hasCamera: isNative,
  hasSharing: isNative,
  hasBiometrics: isNative,
  hasHapticFeedback: isNative,
  hasClipboard: true,
  hasGeolocation: true,
};
```

### Unified APIs
```typescript
export const PlatformAPI = {
  pickFiles: platformModule.pickFilesWeb || platformModule.pickFilesNative,
  shareFile: platformModule.shareFileNative,
  downloadFile: platformModule.downloadFileWeb,
  animations: platformModule.WebAnimations || platformModule.NativeAnimations,
  // ... more APIs
};
```

## Component Architecture

### Animation Components
- **Cross-Platform**: Use React Native Animated API
- **Reduced Motion**: Accessibility support for motion-sensitive users
- **Performance**: Optimized for 60fps animations
- **Configurable**: Animation variants and timing controls

### Layout Components
- **Responsive Design**: Mobile-first with responsive breakpoints
- **Safe Areas**: Platform-specific safe area handling
- **Touch Targets**: 44px+ minimum touch targets for accessibility
- **Scroll Handling**: Optimized scrolling for both platforms

### File Handling Components
- **Drag & Drop**: Web drag-and-drop support
- **Camera Integration**: Native camera access
- **Progress Indicators**: Upload/download progress
- **Error Handling**: User-friendly error messages

## State Management

### App State (`src/hooks/useAppState.tsx`)
- **Global State**: Application-wide state management
- **Phase Management**: Application workflow phases
- **File State**: Current file and processing state
- **Error State**: Error handling and display

### Steganography State (`src/hooks/useSteganography.tsx`)
- **Operation State**: Current steganography operation
- **Progress Tracking**: Operation progress and status
- **Result Management**: Operation results and metadata
- **Validation State**: Input validation results

## Navigation Architecture

### Stack Navigation
- **Main Screen**: File selection and mode switching
- **Input Screen**: Message and password input
- **Processing Screen**: Operation progress and status
- **Result Screen**: Operation results and file download

### Navigation Guards
- **Validation Guards**: Prevent navigation with invalid state
- **Permission Guards**: Check platform permissions
- **Error Handling**: Graceful error recovery

## Security Architecture

### Cryptographic Security
- **AES-256-GCM**: Authenticated encryption with associated data
- **PBKDF2**: Password-based key derivation with 100,000 iterations
- **Random Generation**: Cryptographically secure random values
- **Memory Management**: Secure clearing of sensitive data

### Platform Security
- **Permission Management**: Platform-specific permission handling
- **Secure Storage**: Platform-appropriate secure storage
- **Network Security**: HTTPS enforcement and certificate validation
- **Input Validation**: Comprehensive input sanitization

### Data Protection
- **PII Handling**: Personal data protection and anonymization
- **Log Sanitization**: Sensitive data removal from logs
- **Error Messages**: Non-revealing error messages
- **Session Management**: Secure session handling

## Testing Architecture

### Unit Testing
- **Core Functions**: All core functions have unit tests
- **Mock System**: Comprehensive mocking of external dependencies
- **Coverage**: 80%+ code coverage requirements
- **Performance**: Performance testing for critical paths

### Integration Testing
- **Workflow Testing**: Complete user workflow testing
- **Platform Testing**: Platform-specific integration tests
- **Error Testing**: Comprehensive error scenario testing
- **Security Testing**: Security validation and penetration testing

### E2E Testing
- **User Journey Testing**: Complete user experience testing
- **Cross-Platform Testing**: Web and mobile platform testing
- **Accessibility Testing**: Screen reader and accessibility compliance
- **Performance Testing**: Real-world performance validation

## Build and Deployment

### Development Environment
- **Hot Reloading**: Fast development iteration
- **Type Checking**: Real-time TypeScript validation
- **Linting**: ESLint with platform-specific rules
- **Formatting**: Prettier for consistent code style

### Production Build
- **Code Splitting**: Platform-specific code splitting
- **Tree Shaking**: Unused code elimination
- **Minification**: Code and asset minification
- **Source Maps**: Production source map generation

### Platform-Specific Builds
- **Web Build**: Optimized for web browsers
- **iOS Build**: iOS-specific optimizations
- **Android Build**: Android-specific optimizations
- **Expo Build**: Expo-managed builds

## Performance Optimization

### Bundle Optimization
- **Code Splitting**: Platform-specific code splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and asset optimization
- **Caching**: Strategic caching strategies

### Runtime Performance
- **Memory Management**: Efficient memory usage
- **Animation Performance**: 60fps animation optimization
- **File Processing**: Efficient file handling
- **Network Optimization**: Optimized network requests

### Platform-Specific Optimization
- **Web Optimization**: Browser-specific optimizations
- **Mobile Optimization**: Mobile-specific performance tuning
- **Battery Optimization**: Mobile battery usage optimization
- **Storage Optimization**: Efficient storage usage

## Migration Strategy

### From Web to Mobile
1. **Core Logic**: No changes required (platform-agnostic)
2. **UI Components**: Replace web components with React Native equivalents
3. **File Handling**: Replace web File API with Expo Image Picker
4. **Animations**: Replace web animations with React Native Animated
5. **Navigation**: Replace web routing with React Navigation

### From Mobile to Web
1. **Core Logic**: No changes required (platform-agnostic)
2. **UI Components**: Replace React Native components with web equivalents
3. **File Handling**: Replace Expo Image Picker with web File API
4. **Animations**: Replace React Native Animated with web animation libraries
5. **Navigation**: Replace React Navigation with web routing

### Shared Code Migration
- **Type Definitions**: Shared across all platforms
- **Business Logic**: Core module shared across all platforms
- **Validation Logic**: Shared validation across all platforms
- **Error Handling**: Shared error handling patterns

## Best Practices

### Code Organization
- **Feature-Based Structure**: Organize by feature rather than type
- **Platform Separation**: Clear separation between platform-specific code
- **Dependency Management**: Minimize cross-platform dependencies
- **Type Safety**: Comprehensive TypeScript coverage

### Performance
- **Lazy Loading**: Load components and modules on demand
- **Memoization**: Use React.memo and useMemo appropriately
- **Bundle Analysis**: Regular bundle size analysis
- **Performance Monitoring**: Real-world performance monitoring

### Security
- **Input Validation**: Validate all user inputs
- **Output Encoding**: Encode all user outputs
- **Authentication**: Secure authentication mechanisms
- **Authorization**: Proper authorization checks

### Accessibility
- **Screen Reader Support**: Full screen reader compatibility
- **Keyboard Navigation**: Complete keyboard navigation support
- **Color Contrast**: WCAG AA color contrast compliance
- **Touch Targets**: 44px+ minimum touch targets

## Troubleshooting

### Common Issues
- **Platform Detection**: Ensure proper platform detection
- **Module Resolution**: Check module alias configuration
- **Type Errors**: Verify TypeScript configuration
- **Build Errors**: Check platform-specific build requirements

### Debugging
- **Logging**: Use structured logging for debugging
- **Error Boundaries**: Implement error boundaries for graceful error handling
- **Performance Profiling**: Use performance profiling tools
- **Memory Leaks**: Monitor for memory leaks in long-running operations

### Platform-Specific Issues
- **Web Issues**: Browser compatibility and web API support
- **iOS Issues**: iOS-specific permissions and capabilities
- **Android Issues**: Android-specific permissions and capabilities
- **Expo Issues**: Expo SDK version compatibility

## Future Considerations

### Scalability
- **Microservices**: Consider microservice architecture for backend
- **Caching**: Implement strategic caching strategies
- **CDN**: Use CDN for static assets
- **Load Balancing**: Implement load balancing for high traffic

### Extensibility
- **Plugin Architecture**: Consider plugin architecture for extensions
- **API Versioning**: Implement API versioning strategy
- **Feature Flags**: Use feature flags for gradual rollouts
- **A/B Testing**: Implement A/B testing framework

### Maintenance
- **Dependency Updates**: Regular dependency updates and security patches
- **Code Reviews**: Comprehensive code review process
- **Documentation**: Keep documentation up to date
- **Testing**: Maintain comprehensive test coverage 