import { logInfo, Component } from '../core/logger';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  required: boolean;
  completed: boolean;
  order: number;
  category: string;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  version: string;
  enabled: boolean;
}

export interface OnboardingConfig {
  enabled: boolean;
  autoStart: boolean;
  showProgress: boolean;
  allowSkip: boolean;
  rememberProgress: boolean;
  resetOnVersionChange: boolean;
}

export interface OnboardingProgress {
  flowId: string;
  completedSteps: string[];
  currentStep: string;
  startedAt: number;
  completedAt?: number;
  version: string;
}

/**
 * Onboarding flow utility with interactive tutorials
 */
export class OnboardingFlow {
  private config: OnboardingConfig;
  private flows: Map<string, OnboardingFlow> = new Map();
  private progress: Map<string, OnboardingProgress> = new Map();
  private currentFlow?: string;
  private isActive: boolean = false;

  constructor(config?: Partial<OnboardingConfig>) {
    this.config = {
      enabled: true,
      autoStart: true,
      showProgress: true,
      allowSkip: true,
      rememberProgress: true,
      resetOnVersionChange: true,
      ...config,
    };

    this.initializeDefaultFlows();
  }

  /**
   * Initialize default onboarding flows
   */
  private initializeDefaultFlows(): void {
    const welcomeFlow: OnboardingFlow = {
      id: 'welcome',
      name: 'Welcome to Stegnocchi',
      description: 'Get started with steganography basics',
      version: '1.0.0',
      enabled: true,
      steps: [
        {
          id: 'welcome-intro',
          title: 'Welcome to Stegnocchi',
          description: 'Learn how to hide messages in images',
          content: 'Stegnocchi is an advanced steganography application that lets you hide secret messages in images using EXIF metadata.',
          position: 'center',
          required: true,
          completed: false,
          order: 1,
          category: 'introduction',
        },
        {
          id: 'upload-image',
          title: 'Upload an Image',
          description: 'Select an image to work with',
          content: 'Click the upload button to select a JPEG image. The image will be used to hide your secret message.',
          targetElement: 'upload-button',
          position: 'bottom',
          required: true,
          completed: false,
          order: 2,
          category: 'basic',
        },
        {
          id: 'enter-message',
          title: 'Enter Your Message',
          description: 'Type the message you want to hide',
          content: 'Enter your secret message in the text area. This message will be encrypted and hidden in the image.',
          targetElement: 'message-input',
          position: 'top',
          required: true,
          completed: false,
          order: 3,
          category: 'basic',
        },
        {
          id: 'set-password',
          title: 'Set a Password',
          description: 'Choose a strong password for encryption',
          content: 'Set a strong password to encrypt your message. This ensures only you can decrypt the hidden message.',
          targetElement: 'password-input',
          position: 'bottom',
          required: true,
          completed: false,
          order: 4,
          category: 'security',
        },
        {
          id: 'encode-process',
          title: 'Encode the Message',
          description: 'Hide your message in the image',
          content: 'Click the encode button to hide your message in the image using advanced steganography techniques.',
          targetElement: 'encode-button',
          position: 'top',
          required: true,
          completed: false,
          order: 5,
          category: 'basic',
        },
        {
          id: 'download-result',
          title: 'Download Your Image',
          description: 'Save the image with hidden message',
          content: 'Download your processed image. The hidden message is now securely embedded in the image metadata.',
          targetElement: 'download-button',
          position: 'bottom',
          required: true,
          completed: false,
          order: 6,
          category: 'basic',
        },
        {
          id: 'decode-intro',
          title: 'Decoding Messages',
          description: 'Learn how to extract hidden messages',
          content: 'To extract a hidden message, upload the image and enter the password used during encoding.',
          position: 'center',
          required: false,
          completed: false,
          order: 7,
          category: 'advanced',
        },
        {
          id: 'security-tips',
          title: 'Security Best Practices',
          description: 'Keep your messages secure',
          content: 'Use strong passwords, avoid sharing encoded images publicly, and regularly update your security settings.',
          position: 'center',
          required: false,
          completed: false,
          order: 8,
          category: 'security',
        },
      ],
    };

    const advancedFlow: OnboardingFlow = {
      id: 'advanced',
      name: 'Advanced Features',
      description: 'Master advanced steganography techniques',
      version: '1.0.0',
      enabled: true,
      steps: [
        {
          id: 'batch-processing',
          title: 'Batch Processing',
          description: 'Process multiple images at once',
          content: 'Use batch processing to encode or decode multiple images simultaneously.',
          position: 'center',
          required: false,
          completed: false,
          order: 1,
          category: 'advanced',
        },
        {
          id: 'custom-settings',
          title: 'Custom Settings',
          description: 'Configure advanced options',
          content: 'Adjust image quality, compression settings, and other advanced options.',
          position: 'center',
          required: false,
          completed: false,
          order: 2,
          category: 'advanced',
        },
        {
          id: 'key-management',
          title: 'Key Management',
          description: 'Manage encryption keys securely',
          content: 'Learn about secure key storage and backup options.',
          position: 'center',
          required: false,
          completed: false,
          order: 3,
          category: 'security',
        },
      ],
    };

    this.flows.set('welcome', welcomeFlow);
    this.flows.set('advanced', advancedFlow);
  }

  /**
   * Start onboarding flow
   */
  startFlow(flowId: string): boolean {
    const flow = this.flows.get(flowId);
    if (!flow || !flow.enabled) {
      return false;
    }

    this.currentFlow = flowId;
    this.isActive = true;

    // Initialize progress
    const progress: OnboardingProgress = {
      flowId,
      completedSteps: [],
      currentStep: flow.steps[0].id,
      startedAt: Date.now(),
      version: flow.version,
    };

    this.progress.set(flowId, progress);

    logInfo(Component.UI, 'Onboarding flow started', {
      flowId,
      flowName: flow.name,
      totalSteps: flow.steps.length,
    });

    return true;
  }

  /**
   * Complete current step
   */
  completeStep(stepId: string): boolean {
    if (!this.currentFlow) {
      return false;
    }

    const flow = this.flows.get(this.currentFlow);
    const progress = this.progress.get(this.currentFlow);
    
    if (!flow || !progress) {
      return false;
    }

    const step = flow.steps.find(s => s.id === stepId);
    if (!step) {
      return false;
    }

    step.completed = true;
    progress.completedSteps.push(stepId);

    logInfo(Component.UI, 'Onboarding step completed', {
      flowId: this.currentFlow,
      stepId,
      stepTitle: step.title,
    });

    // Move to next step
    const nextStep = this.getNextStep(flow, stepId);
    if (nextStep) {
      progress.currentStep = nextStep.id;
    } else {
      // Flow completed
      this.completeFlow();
    }

    return true;
  }

  /**
   * Skip current step
   */
  skipStep(stepId: string): boolean {
    if (!this.config.allowSkip) {
      return false;
    }

    const step = this.getCurrentStep();
    if (step && step.required) {
      return false; // Cannot skip required steps
    }

    return this.completeStep(stepId);
  }

  /**
   * Get current step
   */
  getCurrentStep(): OnboardingStep | null {
    if (!this.currentFlow) {
      return null;
    }

    const flow = this.flows.get(this.currentFlow);
    const progress = this.progress.get(this.currentFlow);
    
    if (!flow || !progress) {
      return null;
    }

    return flow.steps.find(s => s.id === progress.currentStep) || null;
  }

  /**
   * Get next step
   */
  private getNextStep(flow: OnboardingFlow, currentStepId: string): OnboardingStep | null {
    const currentStep = flow.steps.find(s => s.id === currentStepId);
    if (!currentStep) {
      return null;
    }

    const nextStep = flow.steps.find(s => s.order === currentStep.order + 1);
    return nextStep || null;
  }

  /**
   * Complete current flow
   */
  private completeFlow(): void {
    if (!this.currentFlow) {
      return;
    }

    const progress = this.progress.get(this.currentFlow);
    if (progress) {
      progress.completedAt = Date.now();
    }

    this.isActive = false;
    
    logInfo(Component.UI, 'Onboarding flow completed', {
      flowId: this.currentFlow,
      duration: progress ? progress.completedAt! - progress.startedAt : 0,
    });

    this.currentFlow = undefined;
  }

  /**
   * Stop current flow
   */
  stopFlow(): void {
    this.isActive = false;
    this.currentFlow = undefined;
    
    logInfo(Component.UI, 'Onboarding flow stopped', {});
  }

  /**
   * Reset flow progress
   */
  resetFlow(flowId: string): boolean {
    const flow = this.flows.get(flowId);
    if (!flow) {
      return false;
    }

    // Reset step completion
    flow.steps.forEach(step => {
      step.completed = false;
    });

    // Remove progress
    this.progress.delete(flowId);

    logInfo(Component.UI, 'Onboarding flow reset', { flowId });
    return true;
  }

  /**
   * Get flow progress
   */
  getFlowProgress(flowId: string): OnboardingProgress | null {
    return this.progress.get(flowId) || null;
  }

  /**
   * Get all flows
   */
  getAllFlows(): OnboardingFlow[] {
    return Array.from(this.flows.values());
  }

  /**
   * Get available flows for user
   */
  getAvailableFlows(): OnboardingFlow[] {
    return Array.from(this.flows.values())
      .filter(flow => flow.enabled)
      .sort((a, b) => {
        const aProgress = this.getFlowProgress(a.id);
        const bProgress = this.getFlowProgress(b.id);
        
        // Show incomplete flows first
        if (!aProgress && bProgress) return -1;
        if (aProgress && !bProgress) return 1;
        
        return a.steps[0].order - b.steps[0].order;
      });
  }

  /**
   * Add custom flow
   */
  addFlow(flow: OnboardingFlow): void {
    this.flows.set(flow.id, flow);
    
    logInfo(Component.UI, 'Custom onboarding flow added', {
      flowId: flow.id,
      flowName: flow.name,
      stepsCount: flow.steps.length,
    });
  }

  /**
   * Remove flow
   */
  removeFlow(flowId: string): boolean {
    const removed = this.flows.delete(flowId);
    this.progress.delete(flowId);
    
    if (removed) {
      logInfo(Component.UI, 'Onboarding flow removed', { flowId });
    }
    
    return removed;
  }

  /**
   * Check if flow is completed
   */
  isFlowCompleted(flowId: string): boolean {
    const flow = this.flows.get(flowId);
    const progress = this.progress.get(flowId);
    
    if (!flow || !progress) {
      return false;
    }

    return progress.completedSteps.length === flow.steps.length;
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(flowId: string): number {
    const flow = this.flows.get(flowId);
    const progress = this.progress.get(flowId);
    
    if (!flow || !progress) {
      return 0;
    }

    return (progress.completedSteps.length / flow.steps.length) * 100;
  }

  /**
   * Check if onboarding is active
   */
  isActive(): boolean {
    return this.isActive;
  }

  /**
   * Get current flow ID
   */
  getCurrentFlowId(): string | undefined {
    return this.currentFlow;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OnboardingConfig>): void {
    this.config = { ...this.config, ...config };
    
    logInfo(Component.UI, 'Onboarding config updated', {
      config: this.config,
    });
  }
}

// Export singleton instance
export const onboardingFlow = new OnboardingFlow(); 