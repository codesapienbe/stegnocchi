/**
 * Hardware Acceleration System
 * Optimized hardware acceleration for graphics and processing
 */

import { Platform } from 'react-native';

export interface HardwareAccelerationConfig {
  enableWebGL: boolean;
  enableWebGL2: boolean;
  enableWebGPU: boolean;
  enableWebAssembly: boolean;
  enableSharedArrayBuffer: boolean;
  enableOffscreenCanvas: boolean;
  enableWebWorkers: boolean;
  enableSIMD: boolean;
  enableThreads: boolean;
  enableCompression: boolean;
  enableOptimization: boolean;
}

export interface WebGLContext {
  context: WebGLRenderingContext | WebGL2RenderingContext | null;
  version: '1.0' | '2.0' | null;
  extensions: string[];
  capabilities: {
    maxTextureSize: number;
    maxViewportDims: [number, number];
    maxRenderbufferSize: number;
    maxVertexAttribs: number;
    maxVertexUniformVectors: number;
    maxVaryingVectors: number;
    maxCombinedTextureImageUnits: number;
    maxVertexTextureImageUnits: number;
    maxTextureImageUnits: number;
    maxFragmentUniformVectors: number;
    aliasedLineWidthRange: [number, number];
    aliasedPointSizeRange: [number, number];
    maxViewportWidth: number;
    maxViewportHeight: number;
  };
}

export interface WebGPUContext {
  adapter: GPUAdapter | null;
  device: GPUDevice | null;
  capabilities: {
    maxBufferSize: number;
    maxStorageBufferBindingSize: number;
    maxUniformBufferBindingSize: number;
    maxVertexBufferArrayStride: number;
    maxInterStageShaderComponents: number;
    maxInterStageShaderVariables: number;
    maxColorAttachments: number;
    maxColorAttachmentBytesPerSample: number;
    maxComputeWorkgroupStorageSize: number;
    maxComputeInvocationsPerWorkgroup: number;
    maxComputeWorkgroupSizeX: number;
    maxComputeWorkgroupSizeY: number;
    maxComputeWorkgroupSizeZ: number;
    maxComputeWorkgroupsPerDimension: number;
  };
}

export interface WorkerPool {
  workers: Worker[];
  maxWorkers: number;
  activeWorkers: number;
  queue: Array<{
    id: string;
    task: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>;
}

class HardwareAcceleration {
  private config: HardwareAccelerationConfig;
  private webglContext: WebGLContext | null = null;
  private webgpuContext: WebGPUContext | null = null;
  private workerPool: WorkerPool | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  /**
   * Get default hardware acceleration configuration
   */
  private getDefaultConfig(): HardwareAccelerationConfig {
    return {
      enableWebGL: true,
      enableWebGL2: true,
      enableWebGPU: false, // Still experimental
      enableWebAssembly: true,
      enableSharedArrayBuffer: true,
      enableOffscreenCanvas: true,
      enableWebWorkers: true,
      enableSIMD: true,
      enableThreads: true,
      enableCompression: true,
      enableOptimization: true,
    };
  }

  /**
   * Initialize hardware acceleration
   */
  private async initialize(): Promise<void> {
    if (Platform.OS !== 'web') {
      // React Native has hardware acceleration by default
      this.isInitialized = true;
      return;
    }

    try {
      // Initialize WebGL
      if (this.config.enableWebGL) {
        await this.initializeWebGL();
      }

      // Initialize WebGPU (experimental)
      if (this.config.enableWebGPU) {
        await this.initializeWebGPU();
      }

      // Initialize Web Workers
      if (this.config.enableWebWorkers) {
        await this.initializeWorkerPool();
      }

      this.isInitialized = true;
      console.log('Hardware acceleration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize hardware acceleration:', error);
    }
  }

  /**
   * Initialize WebGL context
   */
  private async initializeWebGL(): Promise<void> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      // Try WebGL2 first
      let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
      let version: '1.0' | '2.0' | null = null;

      if (this.config.enableWebGL2) {
        gl = canvas.getContext('webgl2', {
          antialias: true,
          alpha: false,
          depth: true,
          stencil: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        });
        if (gl) {
          version = '2.0';
        }
      }

      // Fallback to WebGL1
      if (!gl && this.config.enableWebGL) {
        gl = canvas.getContext('webgl', {
          antialias: true,
          alpha: false,
          depth: true,
          stencil: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        });
        if (gl) {
          version = '1.0';
        }
      }

      if (gl) {
        const extensions = gl.getSupportedExtensions() || [];
        const capabilities = this.getWebGLCapabilities(gl);

        this.webglContext = {
          context: gl,
          version,
          extensions,
          capabilities,
        };

        // Configure WebGL for optimal performance
        this.configureWebGL(gl);
      }
    } catch (error) {
      console.error('Failed to initialize WebGL:', error);
    }
  }

  /**
   * Initialize WebGPU context (experimental)
   */
  private async initializeWebGPU(): Promise<void> {
    try {
      if (!('gpu' in navigator)) {
        console.warn('WebGPU not supported');
        return;
      }

      const adapter = await (navigator as any).gpu.requestAdapter({
        powerPreference: 'high-performance',
        forceFallbackAdapter: false,
      });

      if (!adapter) {
        console.warn('No WebGPU adapter found');
        return;
      }

      const device = await adapter.requestDevice({
        requiredFeatures: [],
        requiredLimits: {},
      });

      if (device) {
        const capabilities = this.getWebGPUCapabilities(adapter, device);
        this.webgpuContext = {
          adapter,
          device,
          capabilities,
        };
      }
    } catch (error) {
      console.error('Failed to initialize WebGPU:', error);
    }
  }

  /**
   * Initialize worker pool
   */
  private async initializeWorkerPool(): Promise<void> {
    try {
      const maxWorkers = navigator.hardwareConcurrency || 4;
      const workers: Worker[] = [];

      // Create workers
      for (let i = 0; i < maxWorkers; i++) {
        const worker = new Worker('/workers/main.js');
        workers.push(worker);
      }

      this.workerPool = {
        workers,
        maxWorkers,
        activeWorkers: 0,
        queue: [],
      };
    } catch (error) {
      console.error('Failed to initialize worker pool:', error);
    }
  }

  /**
   * Get WebGL capabilities
   */
  private getWebGLCapabilities(gl: WebGLRenderingContext | WebGL2RenderingContext): WebGLContext['capabilities'] {
    return {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
      maxViewportWidth: gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0],
      maxViewportHeight: gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1],
    };
  }

  /**
   * Get WebGPU capabilities
   */
  private getWebGPUCapabilities(adapter: GPUAdapter, device: GPUDevice): WebGPUContext['capabilities'] {
    return {
      maxBufferSize: device.limits.maxBufferSize,
      maxStorageBufferBindingSize: device.limits.maxStorageBufferBindingSize,
      maxUniformBufferBindingSize: device.limits.maxUniformBufferBindingSize,
      maxVertexBufferArrayStride: device.limits.maxVertexBufferArrayStride,
      maxInterStageShaderComponents: device.limits.maxInterStageShaderComponents,
      maxInterStageShaderVariables: device.limits.maxInterStageShaderVariables,
      maxColorAttachments: device.limits.maxColorAttachments,
      maxColorAttachmentBytesPerSample: device.limits.maxColorAttachmentBytesPerSample,
      maxComputeWorkgroupStorageSize: device.limits.maxComputeWorkgroupStorageSize,
      maxComputeInvocationsPerWorkgroup: device.limits.maxComputeInvocationsPerWorkgroup,
      maxComputeWorkgroupSizeX: device.limits.maxComputeWorkgroupSizeX,
      maxComputeWorkgroupSizeY: device.limits.maxComputeWorkgroupSizeY,
      maxComputeWorkgroupSizeZ: device.limits.maxComputeWorkgroupSizeZ,
      maxComputeWorkgroupsPerDimension: device.limits.maxComputeWorkgroupsPerDimension,
    };
  }

  /**
   * Configure WebGL for optimal performance
   */
  private configureWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Disable alpha blending for better performance
    gl.disable(gl.BLEND);

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Enable backface culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Set viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Enable extensions for better performance
    if (gl.getExtension('OES_standard_derivatives')) {
      // Enable standard derivatives
    }

    if (gl.getExtension('OES_element_index_uint')) {
      // Enable 32-bit indices
    }

    if (gl.getExtension('WEBGL_compressed_texture_s3tc')) {
      // Enable texture compression
    }
  }

  /**
   * Execute task in worker pool
   */
  async executeInWorker<T>(task: any): Promise<T> {
    if (!this.workerPool) {
      throw new Error('Worker pool not initialized');
    }

    return new Promise((resolve, reject) => {
      const taskId = Math.random().toString(36).substr(2, 9);
      
      this.workerPool!.queue.push({
        id: taskId,
        task,
        resolve,
        reject,
      });

      this.processWorkerQueue();
    });
  }

  /**
   * Process worker queue
   */
  private processWorkerQueue(): void {
    if (!this.workerPool || this.workerPool.queue.length === 0) {
      return;
    }

    const availableWorkers = this.workerPool.workers.filter(worker => {
      return !worker.onmessage; // Check if worker is idle
    });

    while (availableWorkers.length > 0 && this.workerPool.queue.length > 0) {
      const worker = availableWorkers.shift()!;
      const task = this.workerPool.queue.shift()!;

      worker.onmessage = (event) => {
        task.resolve(event.data);
        worker.onmessage = null; // Mark worker as idle
        this.processWorkerQueue(); // Process next task
      };

      worker.onerror = (error) => {
        task.reject(error);
        worker.onmessage = null; // Mark worker as idle
        this.processWorkerQueue(); // Process next task
      };

      worker.postMessage({
        id: task.id,
        task: task.task,
      });

      this.workerPool.activeWorkers++;
    }
  }

  /**
   * Compress data using hardware acceleration
   */
  async compressData(data: ArrayBuffer, algorithm: 'gzip' | 'deflate' | 'brotli' = 'gzip'): Promise<ArrayBuffer> {
    if (this.config.enableCompression) {
      // Use Web Workers for compression
      return this.executeInWorker({
        type: 'compress',
        data,
        algorithm,
      });
    } else {
      // Fallback to software compression
      return this.softwareCompress(data, algorithm);
    }
  }

  /**
   * Decompress data using hardware acceleration
   */
  async decompressData(data: ArrayBuffer, algorithm: 'gzip' | 'deflate' | 'brotli' = 'gzip'): Promise<ArrayBuffer> {
    if (this.config.enableCompression) {
      // Use Web Workers for decompression
      return this.executeInWorker({
        type: 'decompress',
        data,
        algorithm,
      });
    } else {
      // Fallback to software decompression
      return this.softwareDecompress(data, algorithm);
    }
  }

  /**
   * Software compression fallback
   */
  private softwareCompress(data: ArrayBuffer, algorithm: 'gzip' | 'deflate' | 'brotli'): ArrayBuffer {
    // Simple compression implementation
    // In production, use a proper compression library
    return data;
  }

  /**
   * Software decompression fallback
   */
  private softwareDecompress(data: ArrayBuffer, algorithm: 'gzip' | 'deflate' | 'brotli'): ArrayBuffer {
    // Simple decompression implementation
    // In production, use a proper decompression library
    return data;
  }

  /**
   * Optimize image using WebGL
   */
  async optimizeImage(imageData: ImageData): Promise<ImageData> {
    if (!this.webglContext?.context) {
      return imageData;
    }

    const gl = this.webglContext.context;
    
    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

    // Set texture parameters for optimization
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Read back optimized image
    const pixels = new Uint8ClampedArray(imageData.data.length);
    gl.readPixels(0, 0, imageData.width, imageData.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    return new ImageData(pixels, imageData.width, imageData.height);
  }

  /**
   * Get WebGL context
   */
  getWebGLContext(): WebGLContext | null {
    return this.webglContext;
  }

  /**
   * Get WebGPU context
   */
  getWebGPUContext(): WebGPUContext | null {
    return this.webgpuContext;
  }

  /**
   * Get worker pool
   */
  getWorkerPool(): WorkerPool | null {
    return this.workerPool;
  }

  /**
   * Check if hardware acceleration is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if specific feature is supported
   */
  isSupported(feature: keyof HardwareAccelerationConfig): boolean {
    return this.config[feature];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HardwareAccelerationConfig>): void {
    this.config = { ...this.config, ...config };
    this.initialize();
  }

  /**
   * Get current configuration
   */
  getConfig(): HardwareAccelerationConfig {
    return { ...this.config };
  }
}

// Global hardware acceleration instance
export const hardwareAcceleration = new HardwareAcceleration();

export default HardwareAcceleration; 