# Stegnocchi - EXIF Steganography App

A cross-platform React Native application for hiding encrypted messages in image metadata using EXIF steganography techniques.

## 🚀 Features

- **AES-256-GCM Encryption**: Military-grade encryption for message security
- **PBKDF2 Key Derivation**: Secure password-based key generation (100,000 iterations)
- **EXIF Field Manipulation**: Hide data in UserComment, ImageDescription, Artist, and Copyright fields
- **Cross-Platform**: Works on iOS, Android, and Web
- **Custom Logo**: Beautiful gnocchi-themed branding with SVG graphics
- **Real-time Validation**: File format, password strength, and message validation
- **Structured Logging**: JSON-formatted logs for monitoring and debugging
- **TypeScript**: Full type safety and better development experience

## 📱 Supported Platforms

- iOS (via Expo)
- Android (via Expo)
- Web (via Expo Web)

## 🛠️ Technology Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation between screens
- **Expo Crypto** - Cryptographic operations
- **Expo Image Picker** - Image selection
- **React Native Gesture Handler** - Touch gestures

## 📦 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git** for version control

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/stegnocchi.git
   cd stegnocchi
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit environment variables
   nano .env
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

### Platform-Specific Setup

#### Web Development

```bash
# Start web development server
npm run web

# Open in browser
open http://localhost:19006
```

#### iOS Development

```bash
# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Start iOS development
npm run ios
```

#### Android Development

```bash
# Start Android development
npm run android
```

#### Expo Development

```bash
# Start Expo development
npm run expo
```

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

## 🔧 Development Setup

### Available Scripts

#### Development

```bash
# Start development server
npm start

# Start specific platform
npm run web          # Web development
npm run ios          # iOS development
npm run android      # Android development
npm run expo         # Expo development
```

#### Building

```bash
# Development builds
npm run build:web:dev
npm run build:ios:dev
npm run build:android:dev

# Production builds
npm run build:web:prod
npm run build:ios:prod
npm run build:android:prod
```

#### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode
npm run test:watch
```

#### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
npm run type-check:watch

# Formatting
npm run format
npm run format:check
```

#### Utilities

```bash
# Clean build artifacts
npm run clean

# Reset cache
npm run reset-cache

# Generate documentation
npm run docs:generate
```

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git** for version control

### Project Structure

```
stegnocchi/
├── src/
│   ├── core/           # Core business logic
│   │   ├── crypto.ts   # Cryptographic operations
│   │   ├── exif.ts     # EXIF manipulation
│   │   ├── logger.ts   # Structured logging
│   │   └── validation.ts # Input validation
│   ├── hooks/          # React hooks
│   │   ├── useAppState.tsx
│   │   └── useSteganography.tsx
│   ├── navigation/     # Navigation setup
│   │   └── Navigation.tsx
│   ├── screens/        # Screen components
│   │   ├── MainScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── types/          # TypeScript interfaces
│   │   └── index.ts
│   └── App.tsx         # Main app component
├── assets/             # Static assets
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## 🔐 Security Features

### Cryptographic Schemes

#### AES-256-GCM Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **Mode**: Authenticated encryption with associated data
- **Security**: Military-grade encryption standard
- **Benefits**: Provides both confidentiality and authenticity

#### PBKDF2 Key Derivation

- **Algorithm**: PBKDF2 (Password-Based Key Derivation Function 2)
- **Hash Function**: SHA-256
- **Iterations**: 100,000 iterations (configurable)
- **Salt**: 32-byte cryptographically secure random salt
- **Purpose**: Converts user passwords into cryptographic keys

#### Security Parameters

```typescript
const SECURITY_CONFIG = {
  keySize: 256,           // AES-256
  iterations: 100000,     // PBKDF2 iterations
  saltLength: 32,         // Salt length in bytes
  ivLength: 12,          // GCM IV length in bytes
  tagLength: 16,         // GCM authentication tag length
};
```

### EXIF Field Strategies

#### Supported EXIF Fields

- **UserComment**: Primary field for steganography (max 65535 bytes)
- **ImageDescription**: Secondary field for additional data (max 65535 bytes)
- **Artist**: Metadata field for attribution (max 255 bytes)
- **Copyright**: Legal information field (max 255 bytes)
- **Software**: Application identification (max 255 bytes)

#### Field Selection Strategy

1. **Primary Field**: UserComment (largest capacity)
2. **Secondary Fields**: ImageDescription, Artist, Copyright
3. **Fallback**: Software field for small payloads
4. **Multiple Fields**: Distribute large payloads across multiple fields

#### Data Format

```typescript
interface ExifPayload {
  version: string;        // Protocol version
  timestamp: number;      // Creation timestamp
  algorithm: string;      // Encryption algorithm
  keySize: number;        // Key size used
  iterations: number;     // PBKDF2 iterations
  salt: string;          // Base64 encoded salt
  iv: string;            // Base64 encoded IV
  data: string;          // Base64 encoded encrypted data
  tag: string;           // GCM authentication tag
}
```

### Security Best Practices

#### Input Validation

- **File Validation**: JPEG format, size limits, integrity checks
- **Password Validation**: Strength requirements, common password detection
- **Message Validation**: Length limits, content sanitization
- **Operation Validation**: Complete workflow validation

#### Memory Management

- **Secure Clearing**: Sensitive data cleared from memory after use
- **No Logging**: Passwords and keys never logged
- **Garbage Collection**: Prompt cleanup of sensitive objects
- **Buffer Protection**: Protected memory for cryptographic operations

#### Error Handling

- **Non-Revealing Errors**: Error messages don't leak sensitive information
- **Graceful Degradation**: Fail securely without exposing vulnerabilities
- **Audit Logging**: Security-relevant events logged for monitoring
- **Exception Safety**: Cryptographic operations are exception-safe

### Platform Security

#### Web Security

- **HTTPS Enforcement**: All network requests use HTTPS
- **CSP Headers**: Content Security Policy for XSS protection
- **Secure Storage**: Browser secure storage for sensitive data
- **Input Sanitization**: All user inputs sanitized and validated

#### Mobile Security

- **Biometric Authentication**: Touch ID / Face ID integration
- **Secure Storage**: Platform-specific secure storage (Keychain / Keystore)
- **Permission Management**: Minimal permission requests
- **Code Obfuscation**: Production builds obfuscated

#### Cross-Platform Security

- **Consistent Validation**: Same validation logic across platforms
- **Unified Error Handling**: Consistent error handling patterns
- **Shared Security Config**: Common security configuration
- **Audit Trail**: Comprehensive security audit logging

## 📊 Logging and Monitoring

The app uses structured JSON logging with consistent fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "component": "crypto",
  "message": "Encryption operation completed successfully",
  "correlationId": "corr_1705312200000_abc123",
  "metadata": {
    "operation": "encrypt",
    "duration": 150,
    "messageLength": 256
  }
}
```

### Log Levels

- **ERROR**: Actionable errors requiring attention
- **WARN**: Concerning issues that should be monitored
- **INFO**: Business events and operations
- **DEBUG**: Technical details for development

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📝 Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run build` - Build for production

## 🔄 TODO Progress

### ✅ Completed (Batch 1)

- [x] Define TypeScript interfaces for app state
- [x] Define TypeScript interfaces for cryptographic operations
- [x] Define TypeScript interfaces for EXIF field manipulation
- [x] Define TypeScript interfaces for animation variants
- [x] Implement AES-256-GCM encryption in TypeScript
- [x] Implement PBKDF2 key derivation in TypeScript
- [x] Write functions to inject payloads into EXIF fields
- [x] Write functions to extract payloads from EXIF fields
- [x] Add error handling for corrupted/malformed files
- [x] Add error handling for missing EXIF data
- [x] Add error handling for incorrect password attempts
- [x] Add password strength validator
- [x] Validate uploaded file is JPEG format
- [x] Clear sensitive data from memory after operations
- [x] Implement structured logging with JSON format
- [x] Create React Native app structure with TypeScript
- [x] Set up cross-platform navigation
- [x] Implement basic UI components

### 🚧 Next Batches

- **Batch 2**: Animations & User Experience
- **Batch 3**: Mobile-First & Cross-Platform
- **Batch 4**: Testing & Quality Assurance
- **Batch 5**: DevOps & Migration
- **Batch 6**: Documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security Considerations

- All cryptographic operations use industry-standard algorithms
- Sensitive data is cleared from memory after use
- Input validation prevents common attack vectors
- Logs are sanitized to prevent information leakage
- No sensitive data is stored persistently

## 🆘 Support

For support and questions:

1. Check the [Issues](../../issues) page
2. Review the documentation
3. Contact the development team

---

**Note**: This is a development version. Production use requires additional security audits and testing.
