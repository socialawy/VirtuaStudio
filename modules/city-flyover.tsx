// city-flyover.ts - v3 OPTIMIZED

import * as THREE from 'three';
// Three.js 0.182+ wants HDRLoader again (they keep flip-flopping)
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { SceneModule } from '../core/types';

// ============================================================================
// TEXTURE GENERATOR (unchanged)
// ============================================================================
function createBuildingTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, 64, 128);

    for (let y = 0; y < 16; y++) {
        const floorLit = Math.random() > 0.35;
        for (let x = 0; x < 4; x++) {
            if (floorLit && Math.random() > 0.25) {
                ctx.fillStyle = Math.random() > 0.3 ? '#ffeebb' : '#bbddff';
                ctx.fillRect(x * 16 + 3, y * 8 + 2, 10, 4);
            }
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// ============================================================================
// MODULE
// ============================================================================
export const CityFlyoverModule: SceneModule = {
    id: 'CITY_FLYOVER_V1',
    name: 'City Flyover',
    description: 'Auto-flying city tour with instanced buildings',
    type: 'PLAYGROUND',
    tags: ['city', 'night', 'flight', 'instanced'],
    deliverables: [],

    init: (scene, camera, renderer) => {
        console.log('[CityFlyover] Initializing...');

        // === RENDERER (perf tuned for GTX 1650 Ti) ===
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;
        renderer.setPixelRatio(1); // Force 1x for performance

        // === CAMERA ===
        camera.near = 1;
        camera.far = 1200;
        camera.fov = 60;
        camera.position.set(0, 40, 100);
        camera.updateProjectionMatrix();

        // === FOG & BACKGROUND ===
        scene.background = new THREE.Color(0x030308);
        scene.fog = new THREE.FogExp2(0x030308, 0.0022);

        // === LIGHTS (simple, no shadows) ===
        scene.add(new THREE.AmbientLight(0x404060, 0.4));

        // === HDRI (non-blocking, with proper loader) ===
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();

        new HDRLoader()
            .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/')
            .load('shanghai_bund_1k.hdr', (texture) => {
                scene.environment = pmrem.fromEquirectangular(texture).texture;
                texture.dispose();
                pmrem.dispose();
                console.log('[CityFlyover] HDRI loaded');
            });

        // === GROUND (minimal) ===
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(1500, 1500, 1, 1).rotateX(-Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.3 })
        );
        scene.add(ground);

        // === BUILDINGS (reduced for perf) ===
        const tex = createBuildingTexture();
        const geo = new THREE.BoxGeometry(1, 1, 1);
        geo.translate(0, 0.5, 0);

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            emissiveMap: tex,
            emissive: 0xffffff,
            emissiveIntensity: 1.0,
            roughness: 0.6,
            metalness: 0.4,
        });

        const COUNT = 400; // Reduced from 600
        const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
        mesh.frustumCulled = true;
        
        const dummy = new THREE.Object3D();
        let idx = 0;
        
        for (let x = 0; x < 12; x++) {
            for (let z = 0; z < 35; z++) {
                const wx = (x - 6) * 20 + (Math.random() - 0.5) * 6;
                const wz = -z * 22 - 50;

                if (Math.abs(wx) < 15) continue;

                dummy.position.set(wx, 0, wz);
                dummy.scale.set(
                    6 + Math.random() * 4,
                    20 + Math.pow(Math.random(), 2) * 50,
                    6 + Math.random() * 4
                );
                dummy.rotation.y = Math.random() * 0.1;
                dummy.updateMatrix();
                mesh.setMatrixAt(idx++, dummy.matrix);
            }
        }
        
        mesh.count = idx;
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);

        console.log(`[CityFlyover] ${idx} buildings created`);

        // === STATE ===
        const state = {
            scene,
            camera,
            mesh,
            clock: new THREE.Clock(true), // Auto-start
            params: {
                speed: 25,
                flyHeight: 40,
                isPlaying: true,
            },
        };

        console.log('[CityFlyover] Ready - flight controlled by update()');
        return state;
    },

    // === THIS IS NOW THE ONLY ANIMATION SOURCE ===
    update: (ctx, _time, _delta) => {
        // Use internal clock for reliable delta (engine may not pass it correctly)
        const delta = ctx.clock.getDelta();
        const elapsed = ctx.clock.getElapsedTime();

        if (!ctx.params.isPlaying || delta <= 0 || delta > 0.5) return;

        // === FLIGHT ===
        ctx.camera.position.z -= ctx.params.speed * delta;

        // Smooth altitude
        ctx.camera.position.y = THREE.MathUtils.lerp(
            ctx.camera.position.y,
            ctx.params.flyHeight,
            delta * 2.5
        );

        // Gentle sway
        ctx.camera.position.x = Math.sin(elapsed * 0.12) * 4;

        // Look ahead
        ctx.camera.lookAt(
            ctx.camera.position.x * 0.3,
            ctx.params.flyHeight * 0.5,
            ctx.camera.position.z - 70
        );

        // === LOOP ===
        if (ctx.camera.position.z < -700) {
            ctx.camera.position.z = 100;
        }

        // === DYNAMIC FOV ===
        const targetFOV = 55 + ctx.params.speed * 0.2;
        ctx.camera.fov = THREE.MathUtils.lerp(ctx.camera.fov, targetFOV, delta * 2);
        ctx.camera.updateProjectionMatrix();
    },

    dispose: (ctx) => {
        console.log('[CityFlyover] Disposing...');
        ctx.clock.stop();
        ctx.mesh.geometry.dispose();
        (ctx.mesh.material as THREE.Material).dispose();
        ctx.scene.environment?.dispose();
    },

    UI: ({ ctx, onUpdate }) => (
        <div className="module-ui">
            <div className="panel-header">FLIGHT CONTROLS</div>

            <div className="control-row">
                <label>SPEED: {ctx.params.speed}</label>
                <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={ctx.params.speed}
                    onChange={(e) => {
                        ctx.params.speed = parseFloat(e.target.value);
                        onUpdate({ ...ctx });
                    }}
                />
            </div>

            <div className="control-row">
                <label>ALTITUDE: {ctx.params.flyHeight}m</label>
                <input
                    type="range"
                    min="15"
                    max="120"
                    step="5"
                    value={ctx.params.flyHeight}
                    onChange={(e) => {
                        ctx.params.flyHeight = parseFloat(e.target.value);
                        onUpdate({ ...ctx });
                    }}
                />
            </div>

            <div className="control-row">
                <button
                    onClick={() => {
                        ctx.params.isPlaying = !ctx.params.isPlaying;
                        onUpdate({ ...ctx });
                    }}
                >
                    {ctx.params.isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
                </button>

                <button
                    onClick={() => {
                        ctx.camera.position.set(0, ctx.params.flyHeight, 100);
                        onUpdate({ ...ctx });
                    }}
                >
                    ↺ RESET
                </button>
            </div>

            <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px' }}>
                Z: {ctx.camera.position.z.toFixed(0)}
            </div>
        </div>
    ),
};

export default CityFlyoverModule;