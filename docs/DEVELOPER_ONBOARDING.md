# Developer Onboarding Guide

## Welcome to Stegnocchi!

This guide will help you get started with development on the Stegnocchi EXIF Steganography project. Whether you're working on web, mobile, or both platforms, this guide covers everything you need to know.

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Expo CLI** (`npm install -g @expo/cli`)
- **React Native CLI** (optional, for bare React Native development)

### Platform-Specific Requirements

#### Web Development
- **Modern Browser**: Chrome, Firefox, Safari, or Edge
- **Web Developer Tools**: Browser dev tools for debugging

#### iOS Development
- **macOS**: Required for iOS development
- **Xcode** (latest version)
- **iOS Simulator** or physical iOS device
- **CocoaPods** (`sudo gem install cocoapods`)

#### Android Development
- **Android Studio** (latest version)
- **Android SDK** (API level 21 or higher)
- **Android Emulator** or physical Android device
- **Java Development Kit** (JDK 11 or higher)

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/stegnocchi.git
cd stegnocchi
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 4. Start Development Server

#### For Web Development
```bash
npm run web
# or
yarn web
```

#### For iOS Development
```bash
npm run ios
# or
yarn ios
```

#### For Android Development
```bash
npm run android
# or
yarn android
```

#### For Expo Development
```bash
npm run expo
# or
yarn expo
```

## Project Structure

### Core Architecture
```
src/
├── core/                 # Platform-agnostic business logic
│   ├── crypto.ts        # Cryptographic operations
│   ├── exif.ts          # EXIF manipulation
│   ├── validation.ts    # Input validation
│   ├── logger.ts        # Structured logging
│   └── index.ts         # Core module exports
├── web/                 # Web-specific implementations
├── native/              # React Native implementations
├── platform/            # Platform abstraction layer
├── components/          # Shared UI components
├── hooks/               # Shared React hooks
├── navigation/          # Navigation configuration
├── screens/             # Application screens
├── utils/               # Shared utilities
├── types/               # TypeScript type definitions
└── __tests__/           # Test files
```

### Key Files
- `src/App.tsx`: Main application component
- `src/index.js`: Application entry point
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `metro.config.js`: React Native bundler configuration
- `babel.config.js`: Babel transpilation configuration
- `.eslintrc.js`: Code linting rules
- `.prettierrc.js`: Code formatting rules

## Development Workflow

### 1. Code Quality Tools

#### Linting
```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix
```

#### Type Checking
```bash
# Check TypeScript types
npm run type-check

# Watch for type errors
npm run type-check:watch
```

#### Formatting
```bash
# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

### 2. Testing

#### Run All Tests
```bash
npm test
```

#### Run Tests with Coverage
```bash
npm run test:coverage
```

#### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

#### Watch Mode
```bash
npm run test:watch
```

### 3. Building

#### Development Build
```bash
# Web development build
npm run build:web:dev

# iOS development build
npm run build:ios:dev

# Android development build
npm run build:android:dev
```

#### Production Build
```bash
# Web production build
npm run build:web:prod

# iOS production build
npm run build:ios:prod

# Android production build
npm run build:android:prod
```

## Platform-Specific Development

### Web Development

#### Getting Started
```bash
# Start web development server
npm run web

# Open in browser
open http://localhost:19006
```

#### Web-Specific Features
- **File API**: Drag-and-drop file upload
- **Web Animations**: Framer Motion and Lottie
- **Browser Storage**: LocalStorage and IndexedDB
- **Web Workers**: Background processing

#### Web Debugging
```bash
# Open browser dev tools
# Chrome: F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
# Firefox: F12 or Cmd+Option+K (Mac) / Ctrl+Shift+K (Windows)
```

### iOS Development

#### Getting Started
```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Start iOS development
npm run ios
```

#### iOS-Specific Features
- **Camera Access**: Native camera integration
- **Photo Library**: Native photo picker
- **Biometric Authentication**: Touch ID / Face ID
- **Haptic Feedback**: Native haptic responses

#### iOS Debugging
```bash
# Open Xcode
open ios/stegnocchi.xcworkspace

# Use Xcode debugger and console
```

### Android Development

#### Getting Started
```bash
# Start Android development
npm run android
```

#### Android-Specific Features
- **Camera Access**: Native camera integration
- **File System**: Native file operations
- **Biometric Authentication**: Fingerprint / Face unlock
- **Haptic Feedback**: Native vibration

#### Android Debugging
```bash
# Open Android Studio
open android/

# Use Android Studio debugger and logcat
```

## Code Standards

### TypeScript
- **Strict Mode**: All TypeScript strict options enabled
- **No Any**: Avoid `any` type, use proper typing
- **Interface First**: Prefer interfaces over types
- **Explicit Returns**: Explicit return types for functions

### React/React Native
- **Functional Components**: Use functional components with hooks
- **Props Interface**: Define interfaces for all component props
- **State Management**: Use Context API for global state
- **Performance**: Use React.memo and useMemo appropriately

### File Naming
- **PascalCase**: React components (e.g., `MainScreen.tsx`)
- **camelCase**: Utilities and hooks (e.g., `useAppState.tsx`)
- **kebab-case**: CSS files and assets (e.g., `main-screen.css`)

### Import Organization
```typescript
// 1. React and React Native imports
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party library imports
import { useNavigation } from '@react-navigation/native';

// 3. Internal imports (alphabetical)
import { useAppState } from '@/hooks/useAppState';
import { MainScreen } from '@/screens/MainScreen';
import { validateFile } from '@/utils/validation';
```

## Security Guidelines

### Cryptographic Operations
- **Never Log Secrets**: Never log passwords, keys, or sensitive data
- **Secure Memory**: Clear sensitive data from memory after use
- **Input Validation**: Validate all user inputs before processing
- **Error Messages**: Don't reveal sensitive information in error messages

### Platform Security
- **Permissions**: Request only necessary permissions
- **Secure Storage**: Use platform-appropriate secure storage
- **Network Security**: Use HTTPS for all network requests
- **Code Obfuscation**: Obfuscate production builds

## Testing Guidelines

### Unit Testing
- **Core Functions**: Test all core business logic functions
- **Edge Cases**: Test boundary conditions and error cases
- **Mocking**: Mock external dependencies appropriately
- **Coverage**: Maintain 80%+ code coverage

### Integration Testing
- **Workflow Testing**: Test complete user workflows
- **Platform Testing**: Test platform-specific functionality
- **Error Handling**: Test error scenarios and recovery
- **Performance**: Test performance under load

### E2E Testing
- **User Journeys**: Test complete user experiences
- **Cross-Platform**: Test on multiple platforms
- **Accessibility**: Test with screen readers and assistive technology
- **Real Devices**: Test on physical devices when possible

## Debugging

### Common Issues

#### Build Errors
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

#### Metro Bundler Issues
```bash
# Reset Metro cache
npx react-native start --reset-cache
```

#### iOS Build Issues
```bash
# Clean iOS build
cd ios && xcodebuild clean && cd ..
npm run ios
```

#### Android Build Issues
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
npm run android
```

### Debugging Tools
- **React Native Debugger**: Standalone debugging app
- **Flipper**: Mobile app debugging platform
- **Chrome DevTools**: Web debugging
- **Xcode Debugger**: iOS debugging
- **Android Studio Debugger**: Android debugging

## Performance Optimization

### Bundle Size
- **Code Splitting**: Split code by platform and feature
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Optimize images and assets
- **Lazy Loading**: Load components on demand

### Runtime Performance
- **Memory Management**: Monitor memory usage
- **Animation Performance**: Optimize for 60fps
- **Network Optimization**: Minimize network requests
- **Caching**: Implement strategic caching

## Deployment

### Web Deployment
```bash
# Build for production
npm run build:web:prod

# Deploy to hosting service
npm run deploy:web
```

### Mobile Deployment
```bash
# Build for app stores
npm run build:ios:prod
npm run build:android:prod

# Submit to app stores
npm run submit:ios
npm run submit:android
```

## Contributing

### Git Workflow
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Implement your feature
3. **Run Tests**: `npm test`
4. **Check Code Quality**: `npm run lint && npm run type-check`
5. **Commit Changes**: `git commit -m "feat: add your feature"`
6. **Push Branch**: `git push origin feature/your-feature`
7. **Create Pull Request**: Submit PR for review

### Commit Message Format
```
type(scope): description

feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Code Review Checklist
- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Accessibility requirements met

## Resources

### Documentation
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Security Documentation](./SECURITY.md)
- [Testing Documentation](./TESTING.md)

### External Resources
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Navigation Documentation](https://reactnavigation.org/)

### Community
- [GitHub Issues](https://github.com/your-org/stegnocchi/issues)
- [Discord Community](https://discord.gg/your-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stegnocchi)

## Support

### Getting Help
1. **Check Documentation**: Review this guide and other docs
2. **Search Issues**: Look for similar issues on GitHub
3. **Ask Community**: Post in Discord or Stack Overflow
4. **Create Issue**: Create a GitHub issue for bugs
5. **Contact Team**: Reach out to the development team

### Emergency Contacts
- **Technical Lead**: [email@example.com]
- **Security Issues**: [security@example.com]
- **Infrastructure**: [devops@example.com]

---

**Happy Coding! 🚀**

Remember: Security first, user experience second, performance third. Always consider the impact of your changes on the overall system security and user privacy. 