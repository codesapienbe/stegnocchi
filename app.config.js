/**
 * Expo App Configuration
 * Handles platform-specific configuration and Metro bundler setup
 */

module.exports = {
  name: 'Stegnocchi',
  slug: 'stegnocchi',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/logo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.stegnocchi.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/logo.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.stegnocchi.app'
  },
  web: {
    favicon: './assets/logo.png',
    bundler: 'metro'
  },
  plugins: [
    // Using React Navigation instead of Expo Router
  ],
  // Experiments configuration removed - using React Navigation instead of Expo Router
  extra: {
    eas: {
      projectId: 'your-project-id'
    }
  },
  // Disable Node.js externals for Windows compatibility
  metro: {
    resolver: {
      alias: {
        // Disable problematic Node.js built-in modules
        'node:fs': false,
        'node:path': false,
        'node:crypto': false,
        'node:buffer': false,
        'node:stream': false,
        'node:util': false,
        'node:events': false,
        'node:url': false,
        'node:querystring': false,
        'node:os': false,
        'node:child_process': false,
        'node:cluster': false,
        'node:dgram': false,
        'node:dns': false,
        'node:domain': false,
        'node:http': false,
        'node:https': false,
        'node:net': false,
        'node:punycode': false,
        'node:readline': false,
        'node:repl': false,
        'node:string_decoder': false,
        'node:tls': false,
        'node:tty': false,
        'node:v8': false,
        'node:vm': false,
        'node:zlib': false,
        'node:assert': false,
        'node:constants': false,
        'node:module': false,
        'node:process': false,
        'node:timers': false,
        'node:worker_threads': false,
        'node:perf_hooks': false,
        'node:async_hooks': false,
        'node:inspector': false,
        'node:fs/promises': false,
        'node:path/posix': false,
        'node:path/win32': false,
      }
    }
  }
}; 