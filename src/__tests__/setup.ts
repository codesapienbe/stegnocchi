/**
 * Test Setup
 * Global test configuration and mocks
 */

import '@testing-library/jest-native/extend-expect';

// Mock React Native components
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'images',
    Videos: 'videos',
    All: 'all',
  },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
  PanGestureHandler: ({ children }: any) => children,
  State: {
    UNDETERMINED: 0,
    FAILED: 1,
    BEGAN: 2,
    CANCELLED: 3,
    ACTIVE: 4,
    END: 5,
  },
}));

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock React Native Toast Message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mock crypto APIs for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      importKey: jest.fn(),
      deriveBits: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  },
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = class TextEncoder {
  encode(text: string): Uint8Array {
    return new Uint8Array(Buffer.from(text, 'utf8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(buffer: Uint8Array): string {
    return Buffer.from(buffer).toString('utf8');
  }
};

// Mock File API
global.File = class File {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(bits: any[], name: string, options?: any) {
    this.name = name;
    this.size = bits.length;
    this.type = options?.type || 'application/octet-stream';
    this.lastModified = Date.now();
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  text(): Promise<string> {
    return Promise.resolve('');
  }

  slice(): File {
    return this;
  }
};

// Mock Blob API
global.Blob = class Blob {
  size: number;
  type: string;

  constructor(parts: any[], options?: any) {
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
    this.type = options?.type || 'application/octet-stream';
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  text(): Promise<string> {
    return Promise.resolve('');
  }

  slice(): Blob {
    return this;
  }
};

// Mock URL API
global.URL = class URL {
  href: string;

  constructor(url: string, base?: string) {
    this.href = base ? new URL(url, base).href : url;
  }

  static createObjectURL(blob: Blob): string {
    return `blob:mock-${Date.now()}`;
  }

  static revokeObjectURL(url: string): void {
    // Mock implementation
  }
};

// Mock console methods to prevent noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock fetch for testing
global.fetch = jest.fn();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({
    width: 375,
    height: 812,
    scale: 3,
    fontScale: 1,
  }),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

// Mock StatusBar
jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => ({
  setBarStyle: jest.fn(),
  setHidden: jest.fn(),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock Keyboard
jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => ({
  dismiss: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
}));

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
}));

// Mock Share
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(),
}));

// Mock Clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(),
}));

// Mock Permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
  request: jest.fn(),
  check: jest.fn(),
})); 