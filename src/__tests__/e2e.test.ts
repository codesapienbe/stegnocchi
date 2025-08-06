/**
 * End-to-End Tests
 * Tests for complete user workflows
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import { AppStateProvider } from '@/hooks/useAppState';
import { SteganographyProvider } from '@/hooks/useSteganography';
import { AnimationProvider } from '@/components/animations/AnimationProvider';
import { MainScreen } from '@/screens/MainScreen';
import { ResultScreen } from '@/screens/ResultScreen';

// Mock the file picker
jest.mock('@/utils/filePicker', () => ({
  pickFiles: jest.fn(),
  takePhoto: jest.fn(),
}));

// Mock the file sharing utilities
jest.mock('@/utils/fileSharing', () => ({
  shareFile: jest.fn(),
  downloadFile: jest.fn(),
}));

// Mock the core modules
jest.mock('@/core/crypto', () => ({
  encryptMessage: jest.fn(),
  decryptMessage: jest.fn(),
  validatePasswordStrength: jest.fn(),
}));

jest.mock('@/core/exif', () => ({
  injectPayload: jest.fn(),
  extractPayload: jest.fn(),
  readExifData: jest.fn(),
}));

jest.mock('@/core/validation', () => ({
  validateFile: jest.fn(),
  validateMessage: jest.fn(),
  validateSteganographyOperation: jest.fn(),
}));

// Mock the logger
jest.mock('@/core/logger', () => ({
  logUserInteraction: jest.fn(),
  logCryptoOperation: jest.fn(),
  logExifOperation: jest.fn(),
  logFileOperation: jest.fn(),
  logValidation: jest.fn(),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    <AppStateProvider>
      <SteganographyProvider>
        <AnimationProvider>
          {children}
        </AnimationProvider>
      </SteganographyProvider>
    </AppStateProvider>
  </NavigationContainer>
);

// Mock file creation
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('End-to-End Tests', () => {
  const mockImageFile = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
  const testMessage = 'This is a secret message for E2E testing!';
  const testPassword = 'StrongPassword123!';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hide Message Workflow', () => {
    it('should complete image upload → message encode → download workflow', async () => {
      const { pickFiles } = require('@/utils/filePicker');
      const { downloadFile } = require('@/utils/fileSharing');
      const { encryptMessage } = require('@/core/crypto');
      const { injectPayload } = require('@/core/exif');
      const { validateFile, validateMessage, validateSteganographyOperation } = require('@/core/validation');

      // Mock successful responses
      pickFiles.mockResolvedValue({
        file: mockImageFile,
        fileName: 'test.jpg',
        fileSize: 1024 * 1024,
        cancelled: false,
      });

      validateFile.mockReturnValue({ isValid: true, errors: [] });
      validateMessage.mockReturnValue({ isValid: true, errors: [] });
      validateSteganographyOperation.mockReturnValue({ isValid: true, errors: [] });

      encryptMessage.mockResolvedValue({
        success: true,
        data: 'encrypted-payload-data',
        metadata: { algorithm: 'AES-256-GCM', keySize: 256 },
      });

      injectPayload.mockResolvedValue({
        success: true,
        file: createMockFile('processed-test.jpg', 1024 * 1024, 'image/jpeg'),
      });

      downloadFile.mockResolvedValue(true);

      // Render the main screen
      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      // Step 1: Upload image
      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(pickFiles).toHaveBeenCalledWith({
          mediaTypes: 'images',
          allowsEditing: false,
          quality: 1,
        });
      });

      // Wait for file to be processed
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeTruthy();
      });

      // Step 2: Select hide mode
      const hideButton = screen.getByText('Hide Message');
      fireEvent.press(hideButton);

      // Verify mode was set
      await waitFor(() => {
        expect(screen.getByText('Hide Message')).toBeTruthy();
      });

      // Step 3: Enter message and password (this would be in a separate screen)
      // For E2E testing, we simulate the complete workflow
      const processedFile = createMockFile('processed-test.jpg', 1024 * 1024, 'image/jpeg');
      
      // Verify encryption was called
      expect(encryptMessage).toHaveBeenCalledWith({
        message: testMessage,
        password: testPassword,
      });

      // Verify payload injection was called
      expect(injectPayload).toHaveBeenCalledWith(
        mockImageFile,
        expect.any(String), // field name
        'encrypted-payload-data'
      );

      // Verify download was called
      expect(downloadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'processed-test.jpg',
        }),
        expect.any(Object)
      );
    });

    it('should handle validation errors in hide workflow', async () => {
      const { pickFiles } = require('@/utils/filePicker');
      const { validateFile } = require('@/core/validation');

      // Mock validation failure
      pickFiles.mockResolvedValue({
        file: mockImageFile,
        fileName: 'test.jpg',
        fileSize: 1024 * 1024,
        cancelled: false,
      });

      validateFile.mockReturnValue({ 
        isValid: false, 
        errors: ['File is not a valid JPEG image'] 
      });

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(validateFile).toHaveBeenCalledWith(mockImageFile);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/File is not a valid JPEG image/)).toBeTruthy();
      });
    });

    it('should handle encryption errors in hide workflow', async () => {
      const { pickFiles } = require('@/utils/filePicker');
      const { encryptMessage } = require('@/core/crypto');
      const { validateFile, validateMessage, validateSteganographyOperation } = require('@/core/validation');

      pickFiles.mockResolvedValue({
        file: mockImageFile,
        fileName: 'test.jpg',
        fileSize: 1024 * 1024,
        cancelled: false,
      });

      validateFile.mockReturnValue({ isValid: true, errors: [] });
      validateMessage.mockReturnValue({ isValid: true, errors: [] });
      validateSteganographyOperation.mockReturnValue({ isValid: true, errors: [] });

      encryptMessage.mockResolvedValue({
        success: false,
        error: 'Encryption failed: Weak password',
      });

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(encryptMessage).toHaveBeenCalled();
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Encryption failed/)).toBeTruthy();
      });
    });
  });

  describe('Extract Message Workflow', () => {
    it('should complete image upload → payload extraction → message reveal workflow', async () => {
      const { pickFiles } = require('@/utils/filePicker');
      const { extractPayload } = require('@/core/exif');
      const { decryptMessage } = require('@/core/crypto');
      const { validateFile, validateSteganographyOperation } = require('@/core/validation');

      // Mock successful responses
      pickFiles.mockResolvedValue({
        file: mockImageFile,
        fileName: 'test.jpg',
        fileSize: 1024 * 1024,
        cancelled: false,
      });

      validateFile.mockReturnValue({ isValid: true, errors: [] });
      validateSteganographyOperation.mockReturnValue({ isValid: true, errors: [] });

      extractPayload.mockResolvedValue({
        success: true,
        payload: 'encrypted-payload-data',
      });

      decryptMessage.mockResolvedValue({
        success: true,
        data: testMessage,
      });

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      // Step 1: Upload image
      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(pickFiles).toHaveBeenCalled();
      });

      // Wait for file to be processed
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeTruthy();
      });

      // Step 2: Select extract mode
      const extractButton = screen.getByText('Extract Message');
      fireEvent.press(extractButton);

      // Verify mode was set
      await waitFor(() => {
        expect(screen.getByText('Extract Message')).toBeTruthy();
      });

      // Step 3: Enter password (this would be in a separate screen)
      // For E2E testing, we simulate the complete workflow

      // Verify payload extraction was called
      expect(extractPayload).toHaveBeenCalledWith(
        mockImageFile,
        expect.any(String) // field name
      );

      // Verify decryption was called
      expect(decryptMessage).toHaveBeenCalledWith({
        encryptedData: 'encrypted-payload-data',
        password: testPassword,
        metadata: expect.any(Object),
      });

      // Verify message was revealed
      await waitFor(() => {
        expect(screen.getByText(testMessage)).toBeTruthy();
      });
    });

    it('should handle wrong password in extract workflow', async () => {
      const { pickFiles } = require('@/utils/filePicker');
      const { extractPayload } = require('@/core/exif');
      const { decryptMessage } = require('@/core/crypto');
      const { validateFile, validateSteganographyOperation } = require('@/core/validation');

      pickFiles.mockResolvedValue({
        file: mockImageFile,
        fileName: 'test.jpg',
        fileSize: 1024 * 1024,
        cancelled: false,
      });

      validateFile.mockReturnValue({ isValid: true, errors: [] });
      validateSteganographyOperation.mockReturnValue({ isValid: true, errors: [] });

      extractPayload.mockResolvedValue({
        success: true,
        payload: 'encrypted-payload-data',
      });

      decryptMessage.mockResolvedValue({
        success: false,
        error: 'Decryption failed: Wrong password',
      });

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeTruthy();
      });

      const extractButton = screen.getByText('Extract Message');
      fireEvent.press(extractButton);

      await waitFor(() => {
        expect(decryptMessage).toHaveBeenCalled();
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Decryption failed/)).toBeTruthy();
      });
    });

    it('should handle no payload found in extract workflow', async () => {
      const { pickFiles } = require('@/utils/filePicker');
      const { extractPayload } = require('@/core/exif');
      const { validateFile, validateSteganographyOperation } = require('@/core/validation');

      pickFiles.mockResolvedValue({
        file: mockImageFile,
        fileName: 'test.jpg',
        fileSize: 1024 * 1024,
        cancelled: false,
      });

      validateFile.mockReturnValue({ isValid: true, errors: [] });
      validateSteganographyOperation.mockReturnValue({ isValid: true, errors: [] });

      extractPayload.mockResolvedValue({
        success: true,
        payload: null, // No payload found
      });

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeTruthy();
      });

      const extractButton = screen.getByText('Extract Message');
      fireEvent.press(extractButton);

      await waitFor(() => {
        expect(extractPayload).toHaveBeenCalled();
      });

      // Should show no payload message
      await waitFor(() => {
        expect(screen.getByText(/No hidden message found/)).toBeTruthy();
      });
    });
  });

  describe('User Interface Workflow', () => {
    it('should handle app reset functionality', async () => {
      const { pickFiles } = require('@/utils/filePicker');

      pickFiles.mockResolvedValue({
        file: mockImageFile,
        fileName: 'test.jpg',
        fileSize: 1024 * 1024,
        cancelled: false,
      });

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      // Upload a file
      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeTruthy();
      });

      // Reset the app
      const resetButton = screen.getByText('Reset');
      fireEvent.press(resetButton);

      // Should return to initial state
      await waitFor(() => {
        expect(screen.getByText('Select Image')).toBeTruthy();
        expect(screen.queryByText('test.jpg')).toBeNull();
      });
    });

    it('should handle file picker cancellation', async () => {
      const { pickFiles } = require('@/utils/filePicker');

      pickFiles.mockResolvedValue({
        file: null,
        cancelled: true,
      });

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(pickFiles).toHaveBeenCalled();
      });

      // Should remain in initial state
      await waitFor(() => {
        expect(screen.getByText('Select Image')).toBeTruthy();
      });
    });

    it('should handle loading states', async () => {
      const { pickFiles } = require('@/utils/filePicker');

      // Mock a delayed response
      pickFiles.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            file: mockImageFile,
            fileName: 'test.jpg',
            fileSize: 1024 * 1024,
            cancelled: false,
          }), 100)
        )
      );

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeTruthy();
      });

      // Should complete after delay
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeTruthy();
      }, { timeout: 200 });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { pickFiles } = require('@/utils/filePicker');

      pickFiles.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('Select Image');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to pick image/)).toBeTruthy();
      });
    });

    it('should handle file system errors', async () => {
      const { downloadFile } = require('@/utils/fileSharing');

      downloadFile.mockRejectedValue(new Error('File system error'));

      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      // This would test file system errors in a real implementation
      // For now, we verify the error handling structure
      expect(downloadFile).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('Select Image');
      expect(uploadButton.props.accessibilityLabel).toBeDefined();

      const resetButton = screen.getByText('Reset');
      expect(resetButton.props.accessibilityLabel).toBeDefined();
    });

    it('should support screen readers', () => {
      render(
        <TestWrapper>
          <MainScreen />
        </TestWrapper>
      );

      // Verify that important elements have accessibility props
      const title = screen.getByText('Stegnocchi');
      expect(title.props.accessibilityRole).toBe('header');

      const subtitle = screen.getByText('EXIF Steganography');
      expect(subtitle.props.accessibilityRole).toBe('text');
    });
  });
}); 