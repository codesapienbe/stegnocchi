import { DocumentationSystem, APIDocumentation, TutorialStep } from '../core/documentationSystem';

describe('DocumentationSystem', () => {
  let docSystem: DocumentationSystem;

  beforeEach(() => {
    docSystem = new DocumentationSystem({
      apiVersion: '1.0.0',
      baseUrl: 'https://api.test.com',
      languages: ['en'],
      autoGenerate: true,
      interactiveTutorials: true,
      searchEnabled: true,
      analytics: true
    });
  });

  describe('API Documentation', () => {
    it('should generate API documentation', () => {
      const apis = docSystem.getAPIDocumentation();
      expect(apis).toBeInstanceOf(Map);
      expect(apis.size).toBeGreaterThan(0);
    });

    it('should return specific API documentation', () => {
      const encryptAPI = docSystem.getAPIDocumentation('/api/v1/encrypt');
      expect(encryptAPI).toBeDefined();
      expect(encryptAPI?.method).toBe('POST');
      expect(encryptAPI?.parameters).toHaveLength(3);
    });

    it('should return null for non-existent API', () => {
      const nonExistentAPI = docSystem.getAPIDocumentation('/api/v1/nonexistent');
      expect(nonExistentAPI).toBeNull();
    });
  });

  describe('Tutorials', () => {
    it('should generate tutorials', () => {
      const tutorials = docSystem.getAllTutorials();
      expect(tutorials).toBeInstanceOf(Map);
      expect(tutorials.size).toBeGreaterThan(0);
    });

    it('should return specific tutorial', () => {
      const gettingStarted = docSystem.getTutorial('getting-started');
      expect(gettingStarted).toBeDefined();
      expect(gettingStarted).toHaveLength(4);
      expect(gettingStarted![0].title).toBe('Welcome to Stegnocchi');
    });

    it('should return null for non-existent tutorial', () => {
      const nonExistentTutorial = docSystem.getTutorial('non-existent');
      expect(nonExistentTutorial).toBeNull();
    });
  });

  describe('Search', () => {
    it('should search documentation', () => {
      const results = docSystem.searchDocumentation('encrypt');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = docSystem.searchDocumentation('nonexistentterm');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should search case-insensitive', () => {
      const results = docSystem.searchDocumentation('ENCRYPT');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics', () => {
    it('should track page views', () => {
      const initialMetrics = docSystem.getMetrics();
      docSystem.trackPageView('/test-page');
      const updatedMetrics = docSystem.getMetrics();
      expect(updatedMetrics.pageViews).toBe(initialMetrics.pageViews + 1);
    });

    it('should track search queries', () => {
      const initialMetrics = docSystem.getMetrics();
      docSystem.searchDocumentation('test');
      const updatedMetrics = docSystem.getMetrics();
      expect(updatedMetrics.searchQueries).toBe(initialMetrics.searchQueries + 1);
    });
  });

  describe('API Documentation Generation', () => {
    it('should generate OpenAPI specification', () => {
      const openAPIDoc = docSystem.generateAPIDoc();
      expect(typeof openAPIDoc).toBe('string');
      
      const parsed = JSON.parse(openAPIDoc);
      expect(parsed.openapi).toBe('3.0.0');
      expect(parsed.info.title).toBe('Stegnocchi API');
      expect(parsed.paths).toBeDefined();
    });
  });

  describe('Documentation Export', () => {
    it('should export as JSON', () => {
      const jsonExport = docSystem.exportDocumentation('json');
      expect(typeof jsonExport).toBe('string');
      
      const parsed = JSON.parse(jsonExport);
      expect(parsed.apis).toBeDefined();
      expect(parsed.tutorials).toBeDefined();
      expect(parsed.metrics).toBeDefined();
    });

    it('should export as Markdown', () => {
      const markdownExport = docSystem.exportDocumentation('markdown');
      expect(typeof markdownExport).toBe('string');
      expect(markdownExport).toContain('# Stegnocchi Documentation');
      expect(markdownExport).toContain('## API Reference');
    });

    it('should export as HTML', () => {
      const htmlExport = docSystem.exportDocumentation('html');
      expect(typeof htmlExport).toBe('string');
      expect(htmlExport).toContain('<!DOCTYPE html>');
      expect(htmlExport).toContain('<title>Stegnocchi Documentation</title>');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        docSystem.exportDocumentation('unsupported' as any);
      }).toThrow('Unsupported format: unsupported');
    });
  });

  describe('Configuration', () => {
    it('should initialize with provided config', () => {
      const customConfig = {
        apiVersion: '2.0.0',
        baseUrl: 'https://custom.api.com',
        languages: ['en', 'es'],
        autoGenerate: false,
        interactiveTutorials: false,
        searchEnabled: false,
        analytics: false
      };

      const customDocSystem = new DocumentationSystem(customConfig);
      const metrics = customDocSystem.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
}); 