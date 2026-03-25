import { JSDOM } from 'jsdom';

// Setup basic JSDOM to mock document and window for modules that rely on DOM
const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="canvas"></canvas></body></html>');
(global as any).window = dom.window;
(global as any).document = dom.window.document;

// Mock canvas getContext
const originalGetContext = (global as any).window.HTMLCanvasElement.prototype.getContext;
(global as any).window.HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
  if (type === '2d') {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
      // Properties
      canvas: this,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      globalAlpha: 1,
    };
  }
  return originalGetContext.call(this, type, ...args);
};

Object.defineProperty(global, 'navigator', {
  value: { userAgent: 'node.js' },
  writable: true
});

// Thresholds
const THRESHOLD_INIT = 2000;
const THRESHOLD_UPDATE_AVG = 16;
const THRESHOLD_DISPOSE = 1000;
const UPDATE_FRAMES = 100;

interface BenchmarkResult {
  id: string;
  init_ms: number;
  update_avg_ms: number;
  dispose_ms: number;
  passed: boolean;
  errors: string[];
}

async function runBenchmarks() {
  const THREE = await import('three');
  const { listModules } = await import('../../modules/index');

  console.log('=== Running Module Performance Benchmarks ===\n');
  const modules = listModules();
  const results: BenchmarkResult[] = [];
  let allPassed = true;

  for (const mod of modules) {
    const errors: string[] = [];
    let passed = true;

    // Setup dummy environment
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    // Mock WebGLRenderer
    const renderer = {
      domElement: document.createElement('canvas'),
      setSize: () => {},
      setPixelRatio: () => {},
      setClearColor: () => {},
      render: () => {},
      dispose: () => {},
      compile: () => {},
      info: {
        memory: { geometries: 0, textures: 0 },
        render: { calls: 0, triangles: 0, points: 0, lines: 0, frame: 0 },
      },
    } as unknown as THREE.WebGLRenderer;

    try {
      // 1. Benchmark init()
      const t0_init = performance.now();
      const ctx = mod.init(scene, camera, renderer);
      const t1_init = performance.now();
      const init_ms = t1_init - t0_init;

      if (init_ms > THRESHOLD_INIT) {
        errors.push(`init() took ${init_ms.toFixed(2)}ms (Threshold: ${THRESHOLD_INIT}ms)`);
        passed = false;
      }

      // 2. Benchmark update() over 100 frames
      const t0_update = performance.now();
      let time = 0;
      const deltaTime = 0.016; // 60fps
      for (let i = 0; i < UPDATE_FRAMES; i++) {
        mod.update(ctx, time, deltaTime);
        time += deltaTime;
      }
      const t1_update = performance.now();
      const update_avg_ms = (t1_update - t0_update) / UPDATE_FRAMES;

      if (update_avg_ms > THRESHOLD_UPDATE_AVG) {
        errors.push(`update() avg took ${update_avg_ms.toFixed(2)}ms (Threshold: ${THRESHOLD_UPDATE_AVG}ms)`);
        passed = false;
      }

      // 3. Benchmark dispose()
      const t0_dispose = performance.now();
      mod.dispose(ctx);
      const t1_dispose = performance.now();
      const dispose_ms = t1_dispose - t0_dispose;

      if (dispose_ms > THRESHOLD_DISPOSE) {
        errors.push(`dispose() took ${dispose_ms.toFixed(2)}ms (Threshold: ${THRESHOLD_DISPOSE}ms)`);
        passed = false;
      }

      results.push({
        id: mod.id,
        init_ms,
        update_avg_ms,
        dispose_ms,
        passed,
        errors,
      });

      if (!passed) {
        allPassed = false;
      }

    } catch (err: any) {
      results.push({
        id: mod.id,
        init_ms: 0,
        update_avg_ms: 0,
        dispose_ms: 0,
        passed: false,
        errors: [`Exception during benchmark: ${err.message}`],
      });
      allPassed = false;
    }
  }

  // Output JSON
  console.log(JSON.stringify(results, null, 2));

  if (!allPassed) {
    console.error('\n❌ Benchmarks failed. One or more modules exceeded thresholds.');
    process.exit(1);
  } else {
    console.log('\n✅ All benchmarks passed.');
    process.exit(0);
  }
}

runBenchmarks().catch((err) => {
  console.error('Fatal error running benchmarks:', err);
  process.exit(1);
});
