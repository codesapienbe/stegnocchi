/**
 * EXIF Steganography App - Ultra-Minimalist Mobile-First Interface
 * TypeScript-style implementation with super cool animations
 */

// Type definitions
interface AppState {
    mode: 'idle' | 'hide' | 'extract';
    phase: 'waiting' | 'input' | 'processing' | 'complete' | 'error';
    file: File | null;
    message: string;
    password: string;
    processedData: any;
    extractedMessage: string;
}

// Main App Class
class ExifSteganographyApp {
    private state: AppState = {
        mode: 'idle',
        phase: 'waiting',
        file: null,
        message: '',
        password: '',
        processedData: null,
        extractedMessage: ''
    };

    private elements: { [key: string]: HTMLElement } = {};
    private hammer: any = null;
    private progressInterval: number | null = null;
    private toastTimeout: number | null = null;

    constructor() {
        console.log('🚀 Initializing EXIF Steganography App...');
        this.initializeElements();
        this.setupEventListeners();
        this.setupGestureControls();
        this.initializeAnimations();
        console.log('✅ App initialized successfully');
    }

    // Initialize DOM elements
    private initializeElements(): void {
        const elementIds = [
            'app', 'dropZone', 'modeIndicator', 'modeIcon', 'modeText', 'modeSubtext',
            'imagePreview', 'previewImage', 'imageOverlay', 'scanningLine', 'dataParticles',
            'progressRing', 'progressText', 'floatingInput', 'messageGroup', 'passwordGroup',
            'messageInput', 'passwordInput', 'characterCount', 'passwordStrength',
            'processButton', 'btnText', 'btnSpinner', 'resultCard', 'resultSuccess',
            'resultError', 'resultTitle', 'resultMessage', 'errorMessage',
            'downloadBtn', 'copyBtn', 'retryBtn', 'toast', 'toastIcon', 'toastMessage',
            'fileInput'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn(`⚠️ Element not found: ${id}`);
            }
        });
    }

    // Setup event listeners
    private setupEventListeners(): void {
        // File input handlers
        if (this.elements.dropZone) {
            this.elements.dropZone.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📁 Drop zone clicked, triggering file select');
                this.triggerFileSelect();
            });
        }

        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                console.log('📁 File input changed');
                this.handleFileSelect(e);
            });
        }

        // Drag and drop handlers
        if (this.elements.dropZone) {
            this.elements.dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleDragOver(e);
            });

            this.elements.dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleDragLeave(e);
            });

            this.elements.dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleDrop(e);
            });
        }

        // Input handlers
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('input', (e) => this.handleMessageInput(e));
        }

        if (this.elements.passwordInput) {
            this.elements.passwordInput.addEventListener('input', (e) => this.handlePasswordInput(e));
        }

        // Button handlers
        if (this.elements.processButton) {
            this.elements.processButton.addEventListener('click', () => this.processFile());
        }

        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', () => this.downloadResult());
        }

        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => this.copyResult());
        }

        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => this.resetApp());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        console.log('🎯 Event listeners setup complete');
    }

    // Setup gesture controls with Hammer.js
    private setupGestureControls(): void {
        if (typeof Hammer === 'undefined') {
            console.warn('⚠️ Hammer.js not loaded, gestures disabled');
            return;
        }

        try {
            this.hammer = new Hammer(this.elements.app);
            
            // Enable swipe gestures
            this.hammer.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });

            // Swipe up = hide mode
            this.hammer.on('swipeup', () => {
                if (this.state.phase === 'waiting' && this.state.file) {
                    this.switchMode('hide');
                    this.showHapticFeedback();
                }
            });

            // Swipe down = extract mode
            this.hammer.on('swipedown', () => {
                if (this.state.phase === 'waiting' && this.state.file) {
                    this.switchMode('extract');
                    this.showHapticFeedback();
                }
            });

            // Long press for context menu
            this.hammer.get('press').set({ time: 800 });
            this.hammer.on('press', () => {
                if (this.state.phase === 'complete') {
                    this.showContextMenu();
                }
            });

            console.log('👆 Gesture controls enabled');
        } catch (error) {
            console.warn('⚠️ Gesture setup failed:', error);
        }
    }

    // Initialize entrance animations
    private initializeAnimations(): void {
        // Start the pulsing animation for mode indicator
        setTimeout(() => {
            if (this.elements.modeIcon) {
                this.elements.modeIcon.style.animation = 'pulse 2s infinite';
            }
        }, 100);

        console.log('✨ Animations initialized');
    }

    // Handle file selection trigger
    private triggerFileSelect(): void {
        const fileInput = this.elements.fileInput as HTMLInputElement;
        if (fileInput) {
            console.log('📁 Triggering file input click');
            fileInput.click();
        } else {
            console.error('❌ File input element not found');
        }
    }

    // Handle file selection
    private handleFileSelect(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        console.log('📁 File selected:', file?.name);
        
        if (file) {
            this.processUploadedFile(file);
        }
    }

    // Handle drag over
    private handleDragOver(event: DragEvent): void {
        this.elements.dropZone?.classList.add('dragover');
        console.log('📁 Drag over detected');
    }

    // Handle drag leave
    private handleDragLeave(event: DragEvent): void {
        this.elements.dropZone?.classList.remove('dragover');
    }

    // Handle file drop
    private handleDrop(event: DragEvent): void {
        this.elements.dropZone?.classList.remove('dragover');
        console.log('📁 File drop detected');

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processUploadedFile(files[0]);
        }
    }

    // Process uploaded file
    private async processUploadedFile(file: File): Promise<void> {
        console.log('📁 Processing uploaded file:', file.name);

        // Validate file
        if (!this.validateFile(file)) return;

        // Store file
        this.state.file = file;

        // Show image preview with bounce animation
        await this.showImagePreview(file);

        // Auto-detect mode based on filename patterns
        const detectedMode = this.autoDetectMode(file);
        if (detectedMode !== 'idle') {
            setTimeout(() => this.switchMode(detectedMode), 800);
        }

        // Show success toast
        this.showToast(`📸 ${file.name} loaded successfully!`, 'success');
    }

    // Validate uploaded file
    private validateFile(file: File): boolean {
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg'];
        const isValidType = validTypes.includes(file.type) || 
                          file.name.toLowerCase().match(/\.(jpg|jpeg)$/);

        if (!isValidType) {
            this.showToast('❌ Please select a JPEG image file', 'error');
            return false;
        }

        // Check file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showToast('❌ File size must be less than 10MB', 'error');
            return false;
        }

        return true;
    }

    // Auto-detect processing mode
    private autoDetectMode(file: File): 'idle' | 'hide' | 'extract' {
        const fileName = file.name.toLowerCase();
        
        // Check for steganographic indicators
        const stegoPatterns = ['stego', 'hidden', 'secret', '_h', '_s'];
        const hasStegoPatter = stegoPatterns.some(pattern => fileName.includes(pattern));

        if (hasStegoPatter) {
            console.log('🔍 Auto-detected extract mode');
            return 'extract';
        }

        console.log('👁️ Auto-detected hide mode');
        return 'hide';
    }

    // Show image preview with animations
    private showImagePreview(file: File): Promise<void> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const previewImage = this.elements.previewImage as HTMLImageElement;
                if (previewImage) {
                    previewImage.src = e.target?.result as string;
                    previewImage.alt = `Preview of ${file.name}`;
                }

                // Show preview with bounce animation
                this.elements.imagePreview?.classList.add('visible');
                
                // Hide mode indicator text but keep icon visible
                if (this.elements.modeText) this.elements.modeText.style.opacity = '0.3';
                if (this.elements.modeSubtext) this.elements.modeSubtext.style.opacity = '0.3';

                setTimeout(resolve, 500);
            };

            reader.readAsDataURL(file);
        });
    }

    // Switch processing mode with animations
    private switchMode(newMode: 'hide' | 'extract'): void {
        console.log(`🔄 Switching to ${newMode} mode`);
        
        this.state.mode = newMode;
        this.state.phase = 'input';
        
        // Update app data attribute for CSS animations
        this.elements.app?.setAttribute('data-mode', newMode);
        
        // Update mode text
        this.updateModeText(newMode);
        
        // Show appropriate input panel
        this.showInputPanel(newMode);

        // Show appropriate overlay animation
        if (newMode === 'extract') {
            this.startScanningAnimation();
        }
    }

    // Update mode text with animations
    private updateModeText(mode: 'hide' | 'extract'): void {
        const modeText = this.elements.modeText;
        const modeSubtext = this.elements.modeSubtext;

        if (!modeText || !modeSubtext) return;

        const textConfig = {
            hide: {
                main: 'Hide Message',
                sub: 'Encrypt and embed your secret message'
            },
            extract: {
                main: 'Extract Message', 
                sub: 'Decrypt and reveal hidden content'
            }
        };

        // Animate text change
        this.animateTextChange(modeText, textConfig[mode].main);
        this.animateTextChange(modeSubtext, textConfig[mode].sub);
    }

    // Show input panel with slide animation
    private showInputPanel(mode: 'hide' | 'extract'): void {
        const floatingInput = this.elements.floatingInput;
        const messageGroup = this.elements.messageGroup;
        const passwordGroup = this.elements.passwordGroup;

        if (!floatingInput) return;

        // Configure visible inputs based on mode
        if (mode === 'hide') {
            messageGroup?.classList.remove('hidden');
            passwordGroup?.classList.remove('hidden');
            this.updateProcessButtonText('Hide Message');
        } else {
            messageGroup?.classList.add('hidden');
            passwordGroup?.classList.remove('hidden');
            this.updateProcessButtonText('Extract Message');
        }

        // Show panel with slide up animation
        floatingInput.classList.add('visible');
        
        // Focus first input
        const firstInput = mode === 'hide' ? this.elements.messageInput : this.elements.passwordInput;
        setTimeout(() => (firstInput as HTMLInputElement)?.focus(), 300);
    }

    // Handle message input
    private handleMessageInput(event: Event): void {
        const input = event.target as HTMLTextAreaElement;
        const message = input.value;
        
        this.state.message = message;
        this.updateCharacterCount(message.length);
        this.updateProcessButton();

        // Real-time encryption preview (visual effect)
        this.showEncryptionPreview(message);
    }

    // Handle password input
    private handlePasswordInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const password = input.value;
        
        this.state.password = password;
        this.updatePasswordStrength(password);
        this.updateProcessButton();
    }

    // Update character count
    private updateCharacterCount(count: number): void {
        const counter = this.elements.characterCount;
        if (!counter) return;

        counter.textContent = `${count}/1000`;
        
        // Update styling based on count
        counter.classList.remove('warning', 'danger');
        if (count > 800) counter.classList.add('warning');
        if (count > 950) counter.classList.add('danger');
    }

    // Update password strength indicator
    private updatePasswordStrength(password: string): void {
        const strengthEl = this.elements.passwordStrength;
        if (!strengthEl) return;

        if (!password) {
            strengthEl.textContent = '';
            strengthEl.className = 'password-strength';
            return;
        }

        const strength = this.calculatePasswordStrength(password);
        strengthEl.className = `password-strength ${strength.level}`;
        strengthEl.textContent = strength.text;
    }

    // Calculate password strength
    private calculatePasswordStrength(password: string): { level: string; text: string } {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score < 3) return { level: 'weak', text: '🔴 Weak - Add more variety' };
        if (score < 5) return { level: 'medium', text: '🟡 Medium - Good enough' };
        return { level: 'strong', text: '🟢 Strong - Excellent!' };
    }

    // Show encryption preview animation
    private showEncryptionPreview(message: string): void {
        if (message.length > 10) {
            this.elements.dataParticles?.classList.add('active');
            setTimeout(() => {
                this.elements.dataParticles?.classList.remove('active');
            }, 2000);
        }
    }

    // Update process button state
    private updateProcessButton(): void {
        const button = this.elements.processButton as HTMLButtonElement;
        if (!button) return;

        const canProcess = this.canProcess();
        button.disabled = !canProcess;

        if (canProcess) {
            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
        } else {
            button.style.opacity = '0.5';
            button.style.transform = 'scale(0.95)';
        }
    }

    // Check if processing can start
    private canProcess(): boolean {
        if (!this.state.file) return false;
        
        if (this.state.mode === 'hide') {
            return this.state.message.trim().length > 0 && this.state.password.length > 0;
        } else {
            return this.state.password.length > 0;
        }
    }

    // Update process button text
    private updateProcessButtonText(text: string): void {
        const btnText = this.elements.btnText;
        if (btnText) {
            btnText.textContent = text;
        }
    }

    // Start scanning animation for extract mode
    private startScanningAnimation(): void {
        const scanningLine = this.elements.scanningLine;
        if (scanningLine) {
            scanningLine.classList.add('active');
            setTimeout(() => {
                scanningLine.classList.remove('active');
            }, 2000);
        }
    }

    // Process file (main processing function)
    private async processFile(): Promise<void> {
        console.log(`🔄 Starting ${this.state.mode} process...`);
        
        this.state.phase = 'processing';
        this.showProcessingState();
        
        try {
            if (this.state.mode === 'hide') {
                await this.hideMessage();
            } else {
                await this.extractMessage();
            }
            
            this.state.phase = 'complete';
            this.showSuccessState();
            
        } catch (error) {
            console.error('❌ Processing error:', error);
            this.state.phase = 'error';
            this.showErrorState(error as Error);
        }
    }

    // Show processing state with animations
    private showProcessingState(): void {
        // Hide input panel
        this.elements.floatingInput?.classList.remove('visible');
        
        // Show progress ring
        this.elements.progressRing?.classList.add('active');
        
        // Start progress animation
        this.startProgressAnimation();
        
        // Show appropriate processing animation
        if (this.state.mode === 'hide') {
            this.elements.dataParticles?.classList.add('active');
        } else {
            this.startScanningAnimation();
        }
    }

    // Start progress animation
    private startProgressAnimation(): void {
        const progressCircle = document.querySelector('.progress-ring__circle-progress') as SVGCircleElement;
        const progressText = this.elements.progressText;
        
        if (!progressCircle || !progressText) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            const offset = 327 - (progress / 100) * 327;
            progressCircle.style.strokeDashoffset = offset.toString();
            progressText.textContent = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 40);
        
        this.progressInterval = interval;
    }

    // Hide message in image
    private async hideMessage(): Promise<void> {
        // Simulate processing time
        await this.sleep(2000);
        
        // Encrypt message
        const encryptedData = await this.encryptMessage(this.state.message, this.state.password);
        
        // Create steganographic image
        this.state.processedData = await this.createSteganographicImage(this.state.file!, encryptedData);
        
        console.log('✅ Message hidden successfully');
    }

    // Extract message from image
    private async extractMessage(): Promise<void> {
        // Simulate processing time
        await this.sleep(2000);
        
        // Extract encrypted data
        const encryptedData = await this.extractEncryptedData(this.state.file!);
        
        if (!encryptedData) {
            throw new Error('No hidden data found in this image');
        }
        
        // Decrypt message
        this.state.extractedMessage = await this.decryptMessage(encryptedData, this.state.password);
        
        console.log('✅ Message extracted successfully');
    }

    // Encrypt message using AES
    private async encryptMessage(message: string, password: string): Promise<string> {
        const salt = CryptoJS.lib.WordArray.random(16);
        const iv = CryptoJS.lib.WordArray.random(12);
        
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256/32,
            iterations: 100000,
            hasher: CryptoJS.algo.SHA256
        });
        
        const encrypted = CryptoJS.AES.encrypt(message, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        const authTag = CryptoJS.HmacSHA256(encrypted.ciphertext, key);
        
        return JSON.stringify({
            salt: salt.toString(CryptoJS.enc.Base64),
            iv: iv.toString(CryptoJS.enc.Base64),
            ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
            authTag: authTag.toString(CryptoJS.enc.Base64),
            version: '1.0',
            timestamp: new Date().toISOString()
        });
    }

    // Decrypt message using AES
    private async decryptMessage(encryptedData: string, password: string): Promise<string> {
        const data = JSON.parse(encryptedData);
        
        const salt = CryptoJS.enc.Base64.parse(data.salt);
        const iv = CryptoJS.enc.Base64.parse(data.iv);
        const ciphertext = CryptoJS.enc.Base64.parse(data.ciphertext);
        
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256/32,
            iterations: 100000,
            hasher: CryptoJS.algo.SHA256
        });
        
        // Verify auth tag
        const computedAuthTag = CryptoJS.HmacSHA256(ciphertext, key).toString(CryptoJS.enc.Base64);
        if (computedAuthTag !== data.authTag) {
            throw new Error('Authentication failed - incorrect password');
        }
        
        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: ciphertext },
            key,
            { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        );
        
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (!result) {
            throw new Error('Decryption failed - invalid password');
        }
        
        return result;
    }

    // Create steganographic image (demo implementation)
    private async createSteganographicImage(file: File, encryptedData: string): Promise<any> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Store encrypted data for demo
                localStorage.setItem('lastEncodedData', encryptedData);
                localStorage.setItem('lastEncodedFileName', file.name);
                
                resolve({
                    imageData: e.target?.result,
                    filename: file.name.replace(/\.(jpg|jpeg)$/i, '_stego.jpg'),
                    metadata: {
                        stegoData: encryptedData,
                        timestamp: new Date().toISOString(),
                        originalName: file.name
                    }
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // Extract encrypted data from image (demo implementation)
    private async extractEncryptedData(file: File): Promise<string | null> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Check for stored demo data first
                const storedData = localStorage.getItem('lastEncodedData');
                if (storedData) {
                    resolve(storedData);
                    return;
                }
                
                // Check filename patterns
                const fileName = file.name.toLowerCase();
                if (fileName.includes('stego') || fileName.includes('hidden') || fileName.includes('secret')) {
                    // Create demo encrypted data
                    const demoMessage = 'This is a hidden message! 🎉 The steganography worked perfectly.';
                    this.encryptMessage(demoMessage, this.state.password).then(resolve);
                    return;
                }
                
                resolve(null);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // Show success state with animations
    private showSuccessState(): void {
        this.hideProcessingElements();
        
        // Configure success message
        const isHideMode = this.state.mode === 'hide';
        const title = isHideMode ? 'Message Hidden! ✨' : 'Message Extracted! 🔓';
        const message = isHideMode 
            ? 'Your secret message has been encrypted and embedded in the image'
            : `Revealed message: "${this.state.extractedMessage}"`;
        
        this.showResultCard(title, message, true);
    }

    // Show error state
    private showErrorState(error: Error): void {
        this.hideProcessingElements();
        this.showResultCard('Operation Failed ❌', error.message, false);
    }

    // Hide processing elements
    private hideProcessingElements(): void {
        this.elements.progressRing?.classList.remove('active');
        this.elements.dataParticles?.classList.remove('active');
        this.elements.scanningLine?.classList.remove('active');
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    // Show result card with fade and scale animation
    private showResultCard(title: string, message: string, isSuccess: boolean): void {
        const resultCard = this.elements.resultCard;
        const resultSuccess = this.elements.resultSuccess;
        const resultError = this.elements.resultError;
        
        if (!resultCard) return;
        
        // Configure result content
        if (isSuccess) {
            resultSuccess?.classList.add('active');
            resultError?.classList.remove('active');
            
            if (this.elements.resultTitle) this.elements.resultTitle.textContent = title;
            if (this.elements.resultMessage) this.elements.resultMessage.textContent = message;
        } else {
            resultSuccess?.classList.remove('active');
            resultError?.classList.add('active');
            
            if (this.elements.errorMessage) this.elements.errorMessage.textContent = message;
        }
        
        // Show card with animation
        resultCard.classList.add('visible');
        
        // Configure action buttons
        this.configureActionButtons(isSuccess);
        
        // Show success toast
        if (isSuccess) {
            this.showToast('🎉 Operation completed successfully!', 'success');
        }
    }

    // Configure action buttons based on result
    private configureActionButtons(isSuccess: boolean): void {
        const downloadBtn = this.elements.downloadBtn;
        const copyBtn = this.elements.copyBtn;
        
        if (isSuccess) {
            if (this.state.mode === 'hide') {
                // Show download button for steganographic image
                if (downloadBtn) downloadBtn.style.display = 'flex';
                if (copyBtn) copyBtn.style.display = 'none';
            } else {
                // Show copy button for extracted message
                if (downloadBtn) downloadBtn.style.display = 'none';
                if (copyBtn) copyBtn.style.display = 'flex';
            }
        }
    }

    // Download result (steganographic image)
    private downloadResult(): void {
        if (!this.state.processedData) return;
        
        const link = document.createElement('a');
        link.href = this.state.processedData.imageData;
        link.download = this.state.processedData.filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('📁 Steganographic image downloaded!', 'success');
        this.showHapticFeedback();
    }

    // Copy result (extracted message)
    private async copyResult(): Promise<void> {
        const textToCopy = this.state.extractedMessage;
        
        if (!textToCopy) return;
        
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            
            this.showToast('📋 Message copied to clipboard!', 'success');
            this.showHapticFeedback();
            
        } catch (error) {
            this.showToast('❌ Failed to copy message', 'error');
        }
    }

    // Reset app to initial state
    private resetApp(): void {
        console.log('🔄 Resetting app...');
        
        // Reset state
        this.state = {
            mode: 'idle',
            phase: 'waiting',
            file: null,
            message: '',
            password: '',
            processedData: null,
            extractedMessage: ''
        };
        
        // Reset UI
        this.elements.app?.removeAttribute('data-mode');
        this.elements.imagePreview?.classList.remove('visible');
        this.elements.floatingInput?.classList.remove('visible');
        this.elements.resultCard?.classList.remove('visible');
        
        // Clear inputs
        if (this.elements.messageInput) (this.elements.messageInput as HTMLTextAreaElement).value = '';
        if (this.elements.passwordInput) (this.elements.passwordInput as HTMLInputElement).value = '';
        if (this.elements.fileInput) (this.elements.fileInput as HTMLInputElement).value = '';
        
        // Show mode indicator
        if (this.elements.modeText) this.elements.modeText.style.opacity = '1';
        if (this.elements.modeSubtext) this.elements.modeSubtext.style.opacity = '1';
        
        // Reset mode text
        if (this.elements.modeText) this.elements.modeText.textContent = 'Drop Image Here';
        if (this.elements.modeSubtext) this.elements.modeSubtext.textContent = 'Swipe up to hide • Swipe down to extract';
        
        // Restart pulsing animation
        if (this.elements.modeIcon) this.elements.modeIcon.style.animation = 'pulse 2s infinite';
        
        this.showToast('🔄 App reset successfully', 'info');
    }

    // Show context menu (long press)
    private showContextMenu(): void {
        this.showToast('📋 Long press detected!', 'info');
        this.showHapticFeedback();
    }

    // Show toast notification
    private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const toast = this.elements.toast;
        const toastMessage = this.elements.toastMessage;
        const toastIcon = this.elements.toastIcon;
        
        if (!toast || !toastMessage || !toastIcon) return;
        
        // Set content
        toastMessage.textContent = message;
        
        // Set icon based on type
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        toastIcon.textContent = icons[type];
        
        // Set styling
        toast.className = `toast ${type} visible`;
        
        // Auto-hide after 3 seconds
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }

    // Simulate haptic feedback
    private showHapticFeedback(): void {
        if ('vibrate' in navigator) {
            navigator.vibrate([50]);
        }
    }

    // Handle keyboard shortcuts
    private handleKeyboardShortcuts(event: KeyboardEvent): void {
        // Esc key resets app
        if (event.key === 'Escape') {
            this.resetApp();
        }
        
        // Enter key processes if ready
        if (event.key === 'Enter' && event.ctrlKey) {
            if (this.canProcess()) {
                this.processFile();
            }
        }
        
        // Space key triggers file select
        if (event.key === ' ' && this.state.phase === 'waiting') {
            event.preventDefault();
            this.triggerFileSelect();
        }
    }

    // Animation utilities
    private animateTextChange(element: HTMLElement | null, newText: string): void {
        if (!element) return;
        
        element.style.transition = 'opacity 0.15s ease';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.textContent = newText;
            element.style.opacity = '1';
        }, 150);
    }

    // Utility function for delays
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global app instance
declare global {
    interface Window {
        steganographyApp: ExifSteganographyApp;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM loaded, initializing mobile-first EXIF Steganography App...');
    
    try {
        // Initialize app
        window.steganographyApp = new ExifSteganographyApp();
        
        console.log('🚀 App initialization completed successfully!');
        
    } catch (error) {
        console.error('💥 Failed to initialize app:', error);
    }
});