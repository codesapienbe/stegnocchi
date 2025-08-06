import { logger } from './logger';

export interface HelpConfig {
  enableTooltips: boolean;
  enableContextualHelp: boolean;
  enableSearch: boolean;
  enableVideoTutorials: boolean;
  languages: string[];
}

export interface HelpTopic {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedTopics: string[];
  videoUrl?: string;
  lastUpdated: Date;
}

export interface TooltipConfig {
  elementId: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  trigger: 'hover' | 'click' | 'focus';
  delay: number;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
}

export interface TroubleshootingStep {
  step: number;
  title: string;
  description: string;
  action: string;
  expectedResult: string;
  ifNotWorking: string;
}

export class HelpSystem {
  private config: HelpConfig;
  private topics: Map<string, HelpTopic> = new Map();
  private tooltips: Map<string, TooltipConfig> = new Map();
  private faqs: FAQItem[] = [];
  private troubleshootingGuides: Map<string, TroubleshootingStep[]> = new Map();

  constructor(config: HelpConfig) {
    this.config = config;
    this.initializeHelpContent();
  }

  private initializeHelpContent(): void {
    logger.info('Initializing help system', {
      component: 'HelpSystem',
      config: this.config
    });

    this.generateHelpTopics();
    this.generateTooltips();
    this.generateFAQs();
    this.generateTroubleshootingGuides();
  }

  private generateHelpTopics(): void {
    const topics: HelpTopic[] = [
      {
        id: 'getting-started',
        title: 'Getting Started with Stegnocchi',
        description: 'Learn the basics of hiding messages in images',
        content: `
# Getting Started with Stegnocchi

Stegnocchi is a secure application that allows you to hide messages within image files using EXIF metadata. This guide will walk you through the basic process.

## What is EXIF Steganography?

EXIF (Exchangeable Image File Format) metadata contains information about images, such as camera settings, date taken, and location. Stegnocchi uses specific EXIF fields to store encrypted messages, making them invisible to the naked eye.

## Basic Workflow

1. **Select an Image**: Choose a JPEG image file
2. **Enter Your Message**: Type the message you want to hide
3. **Set a Password**: Create a strong password for encryption
4. **Process the Image**: The app will encrypt and inject your message
5. **Download the Result**: Save the processed image with hidden data

## Security Features

- AES-256-GCM encryption
- PBKDF2 key derivation
- Secure random number generation
- Rate limiting to prevent abuse
- Platform-specific secure storage

## Supported Formats

Currently, Stegnocchi supports JPEG images. The app will validate file formats and provide clear error messages for unsupported files.
        `,
        category: 'basics',
        tags: ['introduction', 'security', 'workflow'],
        difficulty: 'beginner',
        relatedTopics: ['security-features', 'file-formats', 'encryption-methods'],
        lastUpdated: new Date()
      },
      {
        id: 'security-features',
        title: 'Security Features and Best Practices',
        description: 'Understanding the security measures in place',
        content: `
# Security Features and Best Practices

Stegnocchi implements enterprise-grade security measures to protect your data and ensure privacy.

## Encryption Standards

### AES-256-GCM
- Advanced Encryption Standard with 256-bit keys
- Galois/Counter Mode for authenticated encryption
- Provides both confidentiality and integrity

### PBKDF2 Key Derivation
- Password-Based Key Derivation Function 2
- Configurable iteration count (default: 100,000)
- Salt generation for each operation
- Protects against rainbow table attacks

## Secure Storage

### Platform-Specific Implementation
- **iOS**: iOS Keychain integration
- **Android**: Android Keystore integration
- **Web**: Encrypted localStorage with key rotation
- **Desktop**: Platform-specific secure storage APIs

## Rate Limiting

Prevents abuse and brute-force attacks:
- **Web**: 10 requests per minute
- **Mobile**: 5 requests per minute
- **Desktop**: 20 requests per minute

## Best Practices

1. **Strong Passwords**: Use at least 8 characters with mixed case, numbers, and symbols
2. **Unique Passwords**: Don't reuse passwords across different services
3. **Secure Transmission**: Always use HTTPS when available
4. **Regular Updates**: Keep the app updated for security patches
5. **Backup Strategy**: Securely backup your encryption keys

## Privacy Features

- Zero-knowledge architecture
- No data sent to servers
- Local processing only
- Secure deletion of temporary files
- Audit logging for compliance
        `,
        category: 'security',
        tags: ['encryption', 'privacy', 'best-practices'],
        difficulty: 'intermediate',
        relatedTopics: ['getting-started', 'compliance', 'troubleshooting'],
        lastUpdated: new Date()
      },
      {
        id: 'file-formats',
        title: 'Supported File Formats and Limitations',
        description: 'Understanding which files work and why',
        content: `
# Supported File Formats and Limitations

## Currently Supported

### JPEG (.jpg, .jpeg)
- **Primary format** for EXIF steganography
- Rich EXIF metadata support
- Widely compatible across platforms
- Good compression ratios

### Why JPEG?
- EXIF metadata is natively supported
- Metadata survives most image operations
- Standard format for digital photography
- Excellent compatibility with social media and sharing

## Limitations

### File Size
- **Minimum**: 1KB (for basic metadata)
- **Maximum**: 50MB (platform-dependent)
- **Recommended**: 1MB - 10MB for optimal performance

### Image Quality
- JPEG compression may affect hidden data
- Avoid multiple compression cycles
- Use high-quality JPEGs when possible

### Metadata Preservation
- Some platforms strip EXIF data
- Social media sites often remove metadata
- Cloud storage may modify file properties

## Future Support

Planned formats for future releases:
- **PNG**: Limited EXIF support
- **HEIC**: Modern image format with metadata
- **WebP**: Web-optimized format
- **TIFF**: Professional format with rich metadata

## Best Practices

1. **Use Original Files**: Avoid re-compressed images
2. **Check Compatibility**: Verify metadata preservation
3. **Test Before Sharing**: Ensure hidden data survives
4. **Backup Originals**: Keep unmodified copies
5. **Document Format**: Note which format was used
        `,
        category: 'technical',
        tags: ['formats', 'limitations', 'compatibility'],
        difficulty: 'beginner',
        relatedTopics: ['getting-started', 'troubleshooting', 'best-practices'],
        lastUpdated: new Date()
      }
    ];

    topics.forEach(topic => {
      this.topics.set(topic.id, topic);
    });

    logger.info('Generated help topics', {
      component: 'HelpSystem',
      topicCount: topics.length
    });
  }

  private generateTooltips(): void {
    const tooltipConfigs: TooltipConfig[] = [
      {
        elementId: 'file-upload',
        content: 'Select a JPEG image file to process. Only JPEG files are currently supported.',
        position: 'bottom',
        trigger: 'hover',
        delay: 500
      },
      {
        elementId: 'message-input',
        content: 'Enter the message you want to hide. Maximum 1000 characters allowed.',
        position: 'top',
        trigger: 'focus',
        delay: 0
      },
      {
        elementId: 'password-input',
        content: 'Create a strong password (8+ characters). This will be used to encrypt your message.',
        position: 'top',
        trigger: 'focus',
        delay: 0
      },
      {
        elementId: 'encrypt-button',
        content: 'Click to encrypt your message and inject it into the image EXIF data.',
        position: 'left',
        trigger: 'hover',
        delay: 300
      },
      {
        elementId: 'decrypt-button',
        content: 'Click to extract and decrypt the hidden message from the image.',
        position: 'left',
        trigger: 'hover',
        delay: 300
      },
      {
        elementId: 'download-button',
        content: 'Download the processed image with hidden data.',
        position: 'bottom',
        trigger: 'hover',
        delay: 200
      }
    ];

    tooltipConfigs.forEach(tooltip => {
      this.tooltips.set(tooltip.elementId, tooltip);
    });

    logger.info('Generated tooltips', {
      component: 'HelpSystem',
      tooltipCount: tooltipConfigs.length
    });
  }

  private generateFAQs(): void {
    this.faqs = [
      {
        question: 'What file formats does Stegnocchi support?',
        answer: 'Currently, Stegnocchi supports JPEG (.jpg, .jpeg) files. This is because JPEG files have rich EXIF metadata support, which is essential for hiding encrypted messages.',
        category: 'technical',
        tags: ['formats', 'compatibility'],
        helpful: 45,
        notHelpful: 2
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes, Stegnocchi uses AES-256-GCM encryption with PBKDF2 key derivation. All processing happens locally on your device, and no data is sent to external servers.',
        category: 'security',
        tags: ['encryption', 'privacy'],
        helpful: 67,
        notHelpful: 1
      },
      {
        question: 'What happens if I forget my password?',
        answer: 'Unfortunately, if you forget your password, the hidden message cannot be recovered. This is by design for security reasons. Always keep your password safe and consider using a password manager.',
        category: 'security',
        tags: ['password', 'recovery'],
        helpful: 38,
        notHelpful: 5
      },
      {
        question: 'Can I use the same image multiple times?',
        answer: 'Yes, you can hide multiple messages in the same image, but each message will overwrite the previous one. For multiple messages, use different images or different EXIF fields.',
        category: 'usage',
        tags: ['multiple-messages', 'workflow'],
        helpful: 29,
        notHelpful: 3
      },
      {
        question: 'Will the hidden message survive social media uploads?',
        answer: 'Most social media platforms strip EXIF metadata for privacy reasons, so hidden messages will likely be lost. Use direct file sharing methods instead.',
        category: 'compatibility',
        tags: ['social-media', 'metadata'],
        helpful: 52,
        notHelpful: 4
      },
      {
        question: 'How large can my hidden message be?',
        answer: 'The maximum message size depends on the image and available EXIF fields. Generally, messages up to 1000 characters work reliably. Larger messages may require multiple images.',
        category: 'technical',
        tags: ['message-size', 'limitations'],
        helpful: 41,
        notHelpful: 2
      }
    ];

    logger.info('Generated FAQs', {
      component: 'HelpSystem',
      faqCount: this.faqs.length
    });
  }

  private generateTroubleshootingGuides(): void {
    const guides: Map<string, TroubleshootingStep[]> = new Map();

    // Common Issues Guide
    guides.set('common-issues', [
      {
        step: 1,
        title: 'File Format Error',
        description: 'The app says my file format is not supported',
        action: 'Check that your file is a JPEG (.jpg or .jpeg) format. Convert other formats to JPEG first.',
        expectedResult: 'File uploads successfully',
        ifNotWorking: 'Try using a different image or convert the file using an image editor'
      },
      {
        step: 2,
        title: 'Password Error',
        description: 'I can\'t decrypt my message - password error',
        action: 'Double-check your password. Passwords are case-sensitive and must match exactly.',
        expectedResult: 'Message decrypts successfully',
        ifNotWorking: 'If you\'re sure the password is correct, the image may have been corrupted or modified'
      },
      {
        step: 3,
        title: 'Large File Error',
        description: 'File is too large to process',
        action: 'Use a smaller image file (under 50MB). Compress the image or use a lower resolution version.',
        expectedResult: 'File processes successfully',
        ifNotWorking: 'Try using a different image or reduce the file size further'
      },
      {
        step: 4,
        title: 'Rate Limit Error',
        description: 'Too many requests - rate limit exceeded',
        action: 'Wait for the rate limit window to reset (usually 1 minute). Reduce the frequency of operations.',
        expectedResult: 'Operations resume normally',
        ifNotWorking: 'Consider upgrading to a higher tier or contact support if this is a legitimate use case'
      }
    ]);

    // Performance Issues Guide
    guides.set('performance-issues', [
      {
        step: 1,
        title: 'Slow Processing',
        description: 'Encryption/decryption is taking too long',
        action: 'Check your device\'s available memory and close unnecessary applications. Use smaller image files.',
        expectedResult: 'Processing completes in reasonable time',
        ifNotWorking: 'Try restarting the app or using a different device'
      },
      {
        step: 2,
        title: 'App Crashes',
        description: 'The app crashes during processing',
        action: 'Update to the latest version of the app. Clear app cache and restart.',
        expectedResult: 'App runs stably',
        ifNotWorking: 'Check device storage space and available memory'
      }
    ]);

    this.troubleshootingGuides = guides;

    logger.info('Generated troubleshooting guides', {
      component: 'HelpSystem',
      guideCount: guides.size
    });
  }

  public getHelpTopic(topicId: string): HelpTopic | null {
    return this.topics.get(topicId) || null;
  }

  public getAllTopics(): Map<string, HelpTopic> {
    return this.topics;
  }

  public getTopicsByCategory(category: string): HelpTopic[] {
    return Array.from(this.topics.values()).filter(topic => topic.category === category);
  }

  public searchHelp(query: string): HelpTopic[] {
    const results: HelpTopic[] = [];
    const searchTerm = query.toLowerCase();

    this.topics.forEach(topic => {
      if (topic.title.toLowerCase().includes(searchTerm) ||
          topic.description.toLowerCase().includes(searchTerm) ||
          topic.content.toLowerCase().includes(searchTerm) ||
          topic.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
        results.push(topic);
      }
    });

    logger.info('Help search performed', {
      component: 'HelpSystem',
      query,
      resultCount: results.length
    });

    return results;
  }

  public getTooltip(elementId: string): TooltipConfig | null {
    return this.tooltips.get(elementId) || null;
  }

  public getAllTooltips(): Map<string, TooltipConfig> {
    return this.tooltips;
  }

  public getFAQs(category?: string): FAQItem[] {
    if (category) {
      return this.faqs.filter(faq => faq.category === category);
    }
    return this.faqs;
  }

  public getTroubleshootingGuide(guideId: string): TroubleshootingStep[] | null {
    return this.troubleshootingGuides.get(guideId) || null;
  }

  public getAllTroubleshootingGuides(): Map<string, TroubleshootingStep[]> {
    return this.troubleshootingGuides;
  }

  public markFAQHelpful(question: string, helpful: boolean): void {
    const faq = this.faqs.find(f => f.question === question);
    if (faq) {
      if (helpful) {
        faq.helpful++;
      } else {
        faq.notHelpful++;
      }
    }
  }

  public getContextualHelp(context: string): HelpTopic[] {
    // Return relevant help topics based on current context
    const contextualTopics: HelpTopic[] = [];
    
    switch (context) {
      case 'file-upload':
        contextualTopics.push(
          this.topics.get('file-formats')!,
          this.topics.get('getting-started')!
        );
        break;
      case 'encryption':
        contextualTopics.push(
          this.topics.get('security-features')!,
          this.topics.get('getting-started')!
        );
        break;
      case 'error':
        contextualTopics.push(
          this.topics.get('troubleshooting')!,
          this.topics.get('file-formats')!
        );
        break;
      default:
        contextualTopics.push(this.topics.get('getting-started')!);
    }

    return contextualTopics.filter(Boolean);
  }
}

// Export singleton instance
export const helpSystem = new HelpSystem({
  enableTooltips: true,
  enableContextualHelp: true,
  enableSearch: true,
  enableVideoTutorials: true,
  languages: ['en', 'es', 'fr', 'de']
}); 