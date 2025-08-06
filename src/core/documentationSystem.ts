/**
 * Documentation System
 * Comprehensive documentation management and generation
 */

import { logger } from './logger';

export interface DocumentationConfig {
  apiVersion: string;
  baseUrl: string;
  languages: string[];
  autoGenerate: boolean;
  interactiveTutorials: boolean;
  searchEnabled: boolean;
  analytics: boolean;
}

export interface APIDocumentation {
  endpoint: string;
  method: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
  rateLimits?: RateLimitInfo;
  authentication?: AuthInfo;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: any;
  examples: any[];
}

export interface APIExample {
  title: string;
  description: string;
  request: any;
  response: any;
  codeSnippet: string;
}

export interface RateLimitInfo {
  requests: number;
  window: string;
  headers: string[];
}

export interface AuthInfo {
  type: 'bearer' | 'api_key' | 'oauth2';
  scopes?: string[];
  description: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  interactive: boolean;
  codeExample?: string;
  expectedOutcome?: string;
  hints?: string[];
  nextStep?: string;
  previousStep?: string;
}

export interface DocumentationMetrics {
  totalPages: number;
  totalAPIs: number;
  totalTutorials: number;
  lastUpdated: Date;
  searchQueries: number;
  pageViews: number;
  averageTimeOnPage: number;
}

export class DocumentationSystem {
  private config: DocumentationConfig;
  private apiDocs: Map<string, APIDocumentation> = new Map();
  private tutorials: Map<string, TutorialStep[]> = new Map();
  private metrics: DocumentationMetrics;

  constructor(config: DocumentationConfig) {
    this.config = config;
    this.metrics = {
      totalPages: 0,
      totalAPIs: 0,
      totalTutorials: 0,
      lastUpdated: new Date(),
      searchQueries: 0,
      pageViews: 0,
      averageTimeOnPage: 0
    };
    this.initializeDocumentation();
  }

  private initializeDocumentation(): void {
    logger.info('Initializing documentation system', {
      component: 'DocumentationSystem',
      config: this.config
    });

    this.generateAPIDocumentation();
    this.generateTutorials();
    this.setupSearchIndex();
  }

  private generateAPIDocumentation(): void {
    // Core API documentation
    const coreAPIs: APIDocumentation[] = [
      {
        endpoint: '/api/v1/encrypt',
        method: 'POST',
        description: 'Encrypt a message and inject it into image EXIF data',
        parameters: [
          {
            name: 'image',
            type: 'File',
            required: true,
            description: 'JPEG image file to process',
            validation: [
              { type: 'required', value: true, message: 'Image file is required' },
              { type: 'pattern', value: /\.(jpg|jpeg)$/i, message: 'Only JPEG files are supported' }
            ]
          },
          {
            name: 'message',
            type: 'string',
            required: true,
            description: 'Message to encrypt and hide',
            validation: [
              { type: 'required', value: true, message: 'Message is required' },
              { type: 'max', value: 1000, message: 'Message must be less than 1000 characters' }
            ]
          },
          {
            name: 'password',
            type: 'string',
            required: true,
            description: 'Encryption password',
            validation: [
              { type: 'required', value: true, message: 'Password is required' },
              { type: 'min', value: 8, message: 'Password must be at least 8 characters' }
            ]
          }
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Successfully encrypted and processed image',
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                processedImage: { type: 'string' },
                metadata: { type: 'object' }
              }
            },
            examples: [{
              success: true,
              processedImage: 'data:image/jpeg;base64,...',
              metadata: {
                originalSize: 1024000,
                processedSize: 1024500,
                exifFields: ['UserComment', 'ImageDescription']
              }
            }]
          },
          {
            statusCode: 400,
            description: 'Invalid input parameters',
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                details: { type: 'object' }
              }
            },
            examples: [{
              error: 'Invalid file format',
              details: { field: 'image', expected: 'JPEG', received: 'PNG' }
            }]
          }
        ],
        examples: [
          {
            title: 'Basic Encryption',
            description: 'Encrypt a simple message in an image',
            request: {
              image: 'file.jpg',
              message: 'Hello, World!',
              password: 'securePassword123'
            },
            response: {
              success: true,
              processedImage: 'data:image/jpeg;base64,...'
            },
            codeSnippet: `
const response = await fetch('/api/v1/encrypt', {
  method: 'POST',
  body: formData
});
const result = await response.json();
            `
          }
        ],
        rateLimits: {
          requests: 10,
          window: '1 minute',
          headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
        },
        authentication: {
          type: 'bearer',
          description: 'JWT token required for authenticated requests'
        }
      },
      {
        endpoint: '/api/v1/decrypt',
        method: 'POST',
        description: 'Extract and decrypt hidden message from image EXIF data',
        parameters: [
          {
            name: 'image',
            type: 'File',
            required: true,
            description: 'JPEG image file containing hidden data',
            validation: [
              { type: 'required', value: true, message: 'Image file is required' },
              { type: 'pattern', value: /\.(jpg|jpeg)$/i, message: 'Only JPEG files are supported' }
            ]
          },
          {
            name: 'password',
            type: 'string',
            required: true,
            description: 'Decryption password',
            validation: [
              { type: 'required', value: true, message: 'Password is required' }
            ]
          }
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Successfully extracted and decrypted message',
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                metadata: { type: 'object' }
              }
            },
            examples: [{
              success: true,
              message: 'Hello, World!',
              metadata: {
                exifFields: ['UserComment'],
                encryptionMethod: 'AES-256-GCM'
              }
            }]
          },
          {
            statusCode: 400,
            description: 'Invalid password or corrupted data',
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            },
            examples: [{
              error: 'Invalid password or corrupted data'
            }]
          }
        ],
        examples: [
          {
            title: 'Basic Decryption',
            description: 'Extract hidden message from an image',
            request: {
              image: 'processed_image.jpg',
              password: 'securePassword123'
            },
            response: {
              success: true,
              message: 'Hello, World!'
            },
            codeSnippet: `
const response = await fetch('/api/v1/decrypt', {
  method: 'POST',
              body: formData
});
const result = await response.json();
            `
          }
        ]
      }
    ];

    coreAPIs.forEach(api => {
      this.apiDocs.set(api.endpoint, api);
    });

    this.metrics.totalAPIs = this.apiDocs.size;
    logger.info('Generated API documentation', {
      component: 'DocumentationSystem',
      apiCount: this.apiDocs.size
    });
  }

  private generateTutorials(): void {
    const tutorials: Map<string, TutorialStep[]> = new Map();

    // Getting Started Tutorial
    const gettingStarted: TutorialStep[] = [
      {
        id: 'gs-1',
        title: 'Welcome to Stegnocchi',
        description: 'Learn the basics of EXIF steganography',
        content: 'Stegnocchi is a secure application that allows you to hide messages within image files using EXIF metadata. This tutorial will guide you through the process.',
        interactive: false,
        nextStep: 'gs-2'
      },
      {
        id: 'gs-2',
        title: 'Understanding EXIF Steganography',
        description: 'How data hiding works in image metadata',
        content: 'EXIF (Exchangeable Image File Format) metadata contains information about images. We use specific fields like UserComment and ImageDescription to store encrypted messages.',
        interactive: false,
        codeExample: `
// Example: EXIF field structure
{
  "UserComment": "encrypted_message_here",
  "ImageDescription": "another_encrypted_message",
  "Artist": "hidden_data"
}
        `,
        nextStep: 'gs-3',
        previousStep: 'gs-1'
      },
      {
        id: 'gs-3',
        title: 'Your First Encryption',
        description: 'Hide a message in an image',
        content: 'Let\'s start by encrypting a simple message. Select an image file and enter your message and password.',
        interactive: true,
        expectedOutcome: 'A processed image with hidden data',
        hints: [
          'Use a strong password (8+ characters)',
          'JPEG files work best',
          'Keep your password safe - you\'ll need it to decrypt'
        ],
        nextStep: 'gs-4',
        previousStep: 'gs-2'
      },
      {
        id: 'gs-4',
        title: 'Extracting Your Message',
        description: 'Retrieve hidden messages from images',
        content: 'Now let\'s extract the message from the processed image. Upload the image and enter the same password.',
        interactive: true,
        expectedOutcome: 'Your original message displayed',
        hints: [
          'Use the exact same password',
          'The image must be the processed version',
          'Check that the file wasn\'t corrupted'
        ],
        previousStep: 'gs-3'
      }
    ];

    // Advanced Features Tutorial
    const advancedFeatures: TutorialStep[] = [
      {
        id: 'adv-1',
        title: 'Advanced Security Features',
        description: 'Learn about enterprise-grade security',
        content: 'Stegnocchi includes advanced security features like rate limiting, secure storage, and hardware acceleration.',
        interactive: false,
        nextStep: 'adv-2'
      },
      {
        id: 'adv-2',
        title: 'Rate Limiting',
        description: 'Understanding abuse prevention',
        content: 'Rate limiting prevents abuse of cryptographic operations. Each platform has different limits based on device capabilities.',
        interactive: false,
        codeExample: `
// Rate limiting configuration
{
  "web": { "requests": 10, "window": "1 minute" },
  "mobile": { "requests": 5, "window": "1 minute" },
  "desktop": { "requests": 20, "window": "1 minute" }
}
        `,
        nextStep: 'adv-3',
        previousStep: 'adv-1'
      },
      {
        id: 'adv-3',
        title: 'Secure Storage',
        description: 'How your data is protected',
        content: 'Sensitive data is stored using platform-specific secure storage mechanisms like iOS Keychain or Android Keystore.',
        interactive: false,
        nextStep: 'adv-4',
        previousStep: 'adv-2'
      },
      {
        id: 'adv-4',
        title: 'Hardware Acceleration',
        description: 'Performance optimization',
        content: 'Stegnocchi automatically detects and uses hardware acceleration when available for better performance.',
        interactive: false,
        previousStep: 'adv-3'
      }
    ];

    tutorials.set('getting-started', gettingStarted);
    tutorials.set('advanced-features', advancedFeatures);

    this.tutorials = tutorials;
    this.metrics.totalTutorials = tutorials.size;
    this.metrics.totalPages = gettingStarted.length + advancedFeatures.length;

    logger.info('Generated tutorials', {
      component: 'DocumentationSystem',
      tutorialCount: tutorials.size,
      totalSteps: this.metrics.totalPages
    });
  }

  private setupSearchIndex(): void {
    // Implementation for search indexing
    logger.info('Setting up search index', {
      component: 'DocumentationSystem'
    });
  }

  public getAPIDocumentation(endpoint?: string): APIDocumentation | Map<string, APIDocumentation> {
    if (endpoint) {
      return this.apiDocs.get(endpoint) || null;
    }
    return this.apiDocs;
  }

  public getTutorial(tutorialId: string): TutorialStep[] | null {
    return this.tutorials.get(tutorialId) || null;
  }

  public getAllTutorials(): Map<string, TutorialStep[]> {
    return this.tutorials;
  }

  public searchDocumentation(query: string): any[] {
    this.metrics.searchQueries++;
    
    const results: any[] = [];
    
    // Search in API documentation
    this.apiDocs.forEach((api, endpoint) => {
      if (api.description.toLowerCase().includes(query.toLowerCase()) ||
          api.endpoint.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: 'api',
          title: api.endpoint,
          description: api.description,
          url: `/api-docs${api.endpoint}`
        });
      }
    });

    // Search in tutorials
    this.tutorials.forEach((steps, tutorialId) => {
      steps.forEach(step => {
        if (step.title.toLowerCase().includes(query.toLowerCase()) ||
            step.description.toLowerCase().includes(query.toLowerCase()) ||
            step.content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: 'tutorial',
            title: step.title,
            description: step.description,
            url: `/tutorials/${tutorialId}/${step.id}`
          });
        }
      });
    });

    logger.info('Documentation search performed', {
      component: 'DocumentationSystem',
      query,
      resultCount: results.length
    });

    return results;
  }

  public trackPageView(page: string): void {
    this.metrics.pageViews++;
    
    logger.info('Page view tracked', {
      component: 'DocumentationSystem',
      page,
      totalViews: this.metrics.pageViews
    });
  }

  public getMetrics(): DocumentationMetrics {
    return { ...this.metrics };
  }

  public generateAPIDoc(): string {
    const doc = {
      openapi: '3.0.0',
      info: {
        title: 'Stegnocchi API',
        version: this.config.apiVersion,
        description: 'EXIF Steganography API for secure message hiding'
      },
      paths: {}
    };

    this.apiDocs.forEach((api, endpoint) => {
      const path = endpoint.replace('/api/v1', '');
      doc.paths[path] = {
        [api.method.toLowerCase()]: {
          summary: api.description,
          parameters: api.parameters.map(param => ({
            name: param.name,
            in: 'body',
            required: param.required,
            schema: { type: param.type }
          })),
          responses: api.responses.reduce((acc, response) => {
            acc[response.statusCode] = {
              description: response.description,
              content: {
                'application/json': {
                  schema: response.schema,
                  examples: response.examples
                }
              }
            };
            return acc;
          }, {})
        }
      };
    });

    return JSON.stringify(doc, null, 2);
  }

  public exportDocumentation(format: 'json' | 'markdown' | 'html'): string {
    const exportData = {
      apis: Array.from(this.apiDocs.values()),
      tutorials: Array.from(this.tutorials.entries()),
      metrics: this.metrics,
      generatedAt: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'markdown':
        return this.generateMarkdown(exportData);
      case 'html':
        return this.generateHTML(exportData);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private generateMarkdown(data: any): string {
    let markdown = '# Stegnocchi Documentation\n\n';
    
    // API Documentation
    markdown += '## API Reference\n\n';
    data.apis.forEach((api: APIDocumentation) => {
      markdown += `### ${api.method} ${api.endpoint}\n\n`;
      markdown += `${api.description}\n\n`;
      
      if (api.parameters.length > 0) {
        markdown += '#### Parameters\n\n';
        api.parameters.forEach(param => {
          markdown += `- **${param.name}** (${param.type})${param.required ? ' *required*' : ''}: ${param.description}\n`;
        });
        markdown += '\n';
      }
    });

    // Tutorials
    markdown += '## Tutorials\n\n';
    data.tutorials.forEach(([tutorialId, steps]: [string, TutorialStep[]]) => {
      markdown += `### ${tutorialId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n`;
      steps.forEach(step => {
        markdown += `#### ${step.title}\n\n`;
        markdown += `${step.description}\n\n`;
        markdown += `${step.content}\n\n`;
      });
    });

    return markdown;
  }

  private generateHTML(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Stegnocchi Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .api-endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        .tutorial-step { border-left: 3px solid #007acc; padding-left: 15px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>Stegnocchi Documentation</h1>
    <div id="content">
        <!-- Content would be generated here -->
    </div>
</body>
</html>
    `;
  }
}

// Export singleton instance
export const documentationSystem = new DocumentationSystem({
  apiVersion: '1.0.0',
  baseUrl: 'https://api.stegnocchi.com',
  languages: ['en', 'es', 'fr', 'de'],
  autoGenerate: true,
  interactiveTutorials: true,
  searchEnabled: true,
  analytics: true
}); 