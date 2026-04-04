import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as THREE from 'three';
import { listModules } from '../../modules/index';

describe('Module Performance Benchmarks', () => {
  const modules = listModules();

  beforeAll(() => {
    // Mock canvas context for JSDOM
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function(
      this: HTMLCanvasElement,
      contextId: string,
      options?: any
    ) {
      if (contextId === '2d') {
        return {
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
          putImageData: vi.fn(),
          createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
          setTransform: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          fillText: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          measureText: vi.fn(() => ({ width: 0 })),
          transform: vi.fn(),
          rect: vi.fn(),
          clip: vi.fn(),
          canvas: this,
        } as any;
      } else if (contextId === 'webgl' || contextId === 'webgl2') {
        return {
          getExtension: vi.fn(() => ({})),
          getParameter: vi.fn(() => 0),
          getShaderPrecisionFormat: vi.fn(() => ({ precision: 1, rangeMin: 1, rangeMax: 1 })),
          enable: vi.fn(),
          disable: vi.fn(),
          clear: vi.fn(),
          clearColor: vi.fn(),
          blendFunc: vi.fn(),
          blendEquation: vi.fn(),
          bindTexture: vi.fn(),
          activeTexture: vi.fn(),
          viewport: vi.fn(),
          scissor: vi.fn(),
          scissorTest: vi.fn(),
          getContextAttributes: vi.fn(() => ({})),
          createTexture: vi.fn(),
          bindFramebuffer: vi.fn(),
          texParameteri: vi.fn(),
          texImage2D: vi.fn(),
          canvas: this,
        } as any;
      }
      return originalGetContext.call(this, contextId, options);
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('All modules meet performance thresholds', () => {
    const results: any[] = [];
    const thresholds = {
      init: 2000,
      update: 16,
      dispose: 1000
    };

    // Minimal mock renderer
    const renderer = {
      domElement: document.createElement('canvas'),
      render: vi.fn(),
      setSize: vi.fn(),
      dispose: vi.fn(),
      info: {
        render: { calls: 0, triangles: 0, points: 0, lines: 0, frame: 0 },
        memory: { geometries: 0, textures: 0 },
        programs: null,
      },
      capabilities: { maxTextures: 16, maxVertexTextures: 16, maxTextureSize: 4096, maxCubemapSize: 4096, maxAttributes: 16, maxVertexUniforms: 256, maxVaryings: 16, maxFragmentUniforms: 256, vertexTextures: true, floatFragmentTextures: true, floatVertexTextures: true, maxSamples: 4 },
      setClearColor: vi.fn(),
      getClearColor: vi.fn(() => new THREE.Color()),
      setClearAlpha: vi.fn(),
      getClearAlpha: vi.fn(() => 1),
      clear: vi.fn(),
      clearColor: vi.fn(),
      clearDepth: vi.fn(),
      clearStencil: vi.fn(),
      clearTarget: vi.fn(),
      getContext: vi.fn(() => ({})),
      getContextAttributes: vi.fn(() => ({})),
      forceContextLoss: vi.fn(),
      forceContextRestore: vi.fn(),
      getPixelRatio: vi.fn(() => 1),
      setPixelRatio: vi.fn(),
      getSize: vi.fn(() => new THREE.Vector2()),
      setDrawingBufferSize: vi.fn(),
      getDrawingBufferSize: vi.fn(() => new THREE.Vector2()),
      setScissor: vi.fn(),
      setScissorTest: vi.fn(),
      getScissor: vi.fn(() => new THREE.Vector4()),
      getScissorTest: vi.fn(() => false),
      setViewport: vi.fn(),
      getViewport: vi.fn(() => new THREE.Vector4()),
      readRenderTargetPixels: vi.fn(),
      copyFramebufferToTexture: vi.fn(),
      copyTextureToTexture: vi.fn(),
      copyTextureToTexture3D: vi.fn(),
      initTexture: vi.fn(),
      resetGLState: vi.fn(),
      compile: vi.fn(),
      setAnimationLoop: vi.fn(),
      clearAnimationLoop: vi.fn(),
      renderBufferDirect: vi.fn(),
      setOpaqueSort: vi.fn(),
      setTransparentSort: vi.fn(),
      getSort: vi.fn(() => null),
      setSort: vi.fn(),
      getOpaqueSort: vi.fn(() => null),
      getTransparentSort: vi.fn(() => null),
      autoClear: true,
      autoClearColor: true,
      autoClearDepth: true,
      autoClearStencil: true,
      sortObjects: true,
      clippingPlanes: [],
      localClippingEnabled: false,
      outputColorSpace: THREE.SRGBColorSpace,
      toneMapping: THREE.NoToneMapping,
      toneMappingExposure: 1.0,
      xr: { enabled: false, getCamera: vi.fn(() => new THREE.PerspectiveCamera()), setAnimationLoop: vi.fn(), setFramebufferScaleFactor: vi.fn(), setReferenceSpaceType: vi.fn(), getReferenceSpace: vi.fn(() => null), getSession: vi.fn(() => null), setSession: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() },
      shadowMap: { enabled: false, autoUpdate: true, needsUpdate: false, type: THREE.PCFShadowMap },
      state: { buffers: { color: { setMask: vi.fn(), setLocked: vi.fn(), setClear: vi.fn(), reset: vi.fn() }, depth: { setTest: vi.fn(), setMask: vi.fn(), setFunc: vi.fn(), setLocked: vi.fn(), setClear: vi.fn(), reset: vi.fn() }, stencil: { setTest: vi.fn(), setMask: vi.fn(), setFunc: vi.fn(), setOp: vi.fn(), setLocked: vi.fn(), setClear: vi.fn(), reset: vi.fn() } }, reset: vi.fn(), enable: vi.fn(), disable: vi.fn(), setFlipSided: vi.fn(), setCullFace: vi.fn(), setLineWidth: vi.fn(), setPolygonOffset: vi.fn(), setScissorTest: vi.fn(), activeTexture: vi.fn(), bindTexture: vi.fn(), unbindTexture: vi.fn(), compressedTexImage2D: vi.fn(), texImage2D: vi.fn(), texImage3D: vi.fn(), scissor: vi.fn(), viewport: vi.fn() }
    } as unknown as THREE.WebGLRenderer;

    for (const module of modules) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);

      // 1. Benchmark init()
      const initStart = performance.now();
      const ctx = module.init(scene, camera, renderer);
      const initTime = performance.now() - initStart;

      // 2. Benchmark update() over 100 frames
      const frameCount = 100;
      const delta = 1 / 60; // Simulate 60fps
      let totalUpdateTime = 0;

      for (let i = 0; i < frameCount; i++) {
        const updateStart = performance.now();
        module.update(ctx, i * delta, delta);
        totalUpdateTime += (performance.now() - updateStart);
      }
      const updateAvgTime = totalUpdateTime / frameCount;

      // 3. Benchmark dispose()
      const disposeStart = performance.now();
      module.dispose(ctx);
      const disposeTime = performance.now() - disposeStart;

      const result = {
        moduleId: module.id,
        init_ms: initTime,
        update_avg_ms: updateAvgTime,
        dispose_ms: disposeTime
      };

      results.push(result);
      console.log(`Module ${module.id} Results:`, JSON.stringify(result, null, 2));

      // 4. Assert thresholds
      expect(initTime).toBeLessThanOrEqual(thresholds.init);
      expect(updateAvgTime).toBeLessThanOrEqual(thresholds.update);
      expect(disposeTime).toBeLessThanOrEqual(thresholds.dispose);
    }

    console.log('All Benchmark Results:');
    console.log(JSON.stringify(results, null, 2));
  });
});
