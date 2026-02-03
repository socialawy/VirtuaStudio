// modules/aob-void.tsx
import React, { useEffect } from 'react';
import * as THREE from 'three';
import { 
    SceneModule, 
    DeliverableSpec,
    ShotSpec,
    PARTICLE_PRESETS, 
    SCENE_PRESETS 
} from '../core/types';

// =============================================================================
// DELIVERABLES & SHOTS (Exact copy from v1.5)
// =============================================================================

const DELIVERABLES: DeliverableSpec[] = [
    { id: 'del_01', filename: 'AOB_SEQ01_S01_SH01_PLATE_v001.webm', type: 'VIDEO_PLATE', shotId: 'SH01', description: 'BLACK HOLD' },
    { id: 'del_02', filename: 'AOB_SEQ01_S01_SH02_PLATE_v001.webm', type: 'VIDEO_PLATE', shotId: 'SH02', description: 'SHIMMER EMERGE' },
    { id: 'del_03', filename: 'AOB_SEQ01_S01_SH03_PLATE_v001.webm', type: 'VIDEO_PLATE', shotId: 'SH03', description: 'ABSTRACT DENSITY' },
    { id: 'del_04', filename: 'AOB_PTC_SHIMMER_01_v001.webm', type: 'VFX_ELEMENT', description: 'Particle Pass (12s)' },
    { id: 'del_05', filename: 'AOB_SEQ01_CAM_DATA.json', type: 'METADATA', description: 'Camera Tracking JSON' },
    { id: 'del_06', filename: 'AOB_SEQ01_PARTICLES.json', type: 'METADATA', description: 'Particle Positions for Polishing/Post' }
];

const SHOT_SPECS: ShotSpec[] = [
    { id: "SH01", slug: "SH01", duration: 3.0, camera: { lens: 50, posStart: [0,0,5], posEnd: [0,0,0], lookAt: [0,0,0] } },
    { id: "SH02", slug: "SH02", duration: 12.0, camera: { lens: 35, posStart: [0,0,6], posEnd: [0,0,0], lookAt: [0,0,0] } },
    { id: "SH03", slug: "SH03", duration: 20.0, camera: { lens: 28, posStart: [0,1.5,5], posEnd: [0,0.8,0], lookAt: [0,0.8,0] } }
];

// =============================================================================
// PARTICLE SYSTEM (Exact copy from v1.5)
// =============================================================================

const createParticleSystem = (presetName: keyof typeof PARTICLE_PRESETS) => {
    const preset = PARTICLE_PRESETS[presetName] || PARTICLE_PRESETS.SHIMMER;
    const pCount = preset.count;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pSizes = new Float32Array(pCount);
    
    for(let i=0; i<pCount; i++) {
        const r = 8 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        pPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pPos[i*3+2] = r * Math.cos(phi);
        pSizes[i] = (Math.random() * 0.5 + 0.5) * preset.size;
    }
    
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeom.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));
    
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) }
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = 1.0;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    return { system: new THREE.Points(pGeom, starMaterial), preset };
};

// =============================================================================
// MODULE DEFINITION
// =============================================================================

export const AOBVoidModule: SceneModule = {
    id: 'AOB_VOID_V1',
    name: 'AOB Production (Seq 01)',
    description: 'Sequence 01 Assets',
    type: 'PRODUCTION',
    tags: ['production', 'AOB'],
    deliverables: DELIVERABLES,
    shots: SHOT_SPECS,

    init: (scene, camera) => {
        camera.position.set(0, 2, 10);
        camera.lookAt(0, 0, 0);
        camera.fov = 45;
        camera.updateProjectionMatrix();

        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.FogExp2(0x000000, 0.05);

        const rim = new THREE.DirectionalLight(0x2A6F8F, 2.0);
        rim.position.set(0, 10, -5);
        scene.add(rim);
        const fill = new THREE.AmbientLight(0xffffff, 0.1);
        scene.add(fill);

        const { system, preset } = createParticleSystem('SHIMMER');
        scene.add(system);

        return {
            scene, camera, particleSystem: system,
            activeShotId: null,
            isPlaying: false,
            startTime: 0,
            progress: 0,
            trackingData: [] as any[],
            batch: { active: false, index: 0, status: 'IDLE' },
            onSignal: null,
            preset: preset,
            activeScenePreset: 'VOID_ABSTRACT'
        };
    },

    update: (ctx, time, delta) => {
        if (ctx.particleSystem && ctx.preset) {
            ctx.particleSystem.rotation.y = time * ctx.preset.speed;
        }

        const setOpacity = (val: number) => {
            if (ctx.particleSystem.material.uniforms && ctx.particleSystem.material.uniforms.color) {
                 ctx.particleSystem.material.uniforms.color.value.setScalar(val);
            } else {
                 ctx.particleSystem.material.opacity = val;
            }
        };

        if (ctx.activeShotId === 'SH01') {
             if (ctx.particleSystem) setOpacity(0.1);
        } else if (ctx.activeShotId === 'SH03') {
             if (ctx.particleSystem) {
                setOpacity(0.8);
                ctx.particleSystem.rotation.y = time * (ctx.preset.speed * 2);
             }
        }

        if (ctx.isPlaying && ctx.activeShotId) {
            const shot = SHOT_SPECS.find(s => s.id === ctx.activeShotId);
            const isVFX = ctx.activeShotId === 'VFX_PASS';
            const duration = isVFX ? 12.0 : (shot ? shot.duration : 0);

            if (duration > 0) {
                const elapsed = (performance.now() - ctx.startTime) / 1000;
                const t = Math.min(elapsed / duration, 1.0);
                ctx.progress = Math.round(t * 100);

                if (!isVFX && shot) {
                    const pA = new THREE.Vector3(...shot.camera.posStart);
                    const pB = new THREE.Vector3(...shot.camera.posEnd);
                    ctx.camera.position.lerpVectors(pA, pB, t);
                    ctx.camera.lookAt(new THREE.Vector3(...shot.camera.lookAt));
                    
                    if (shot.id === 'SH02' && ctx.particleSystem) setOpacity(t * 0.8);

                    if (ctx.batch.active) {
                        if (!ctx.trackingData) ctx.trackingData = [];
                        ctx.trackingData.push({
                            shotId: shot.id,
                            frame: Math.floor(elapsed * 30),
                            time: elapsed,
                            pos: ctx.camera.position.toArray(),
                            rot: ctx.camera.rotation.toArray(),
                            fov: ctx.camera.fov
                        });
                    }
                }

                if (t >= 1.0) {
                    ctx.isPlaying = false;
                    if (ctx.onSignal) ctx.onSignal();
                }
            }
        }
    },

    dispose: (ctx) => { ctx.scene.clear(); },

    UI: ({ ctx, onUpdate, engineAPI }) => {
        useEffect(() => {
            ctx.onSignal = () => { onUpdate({ ...ctx }); };
            return () => { ctx.onSignal = null; };
        }, [ctx, onUpdate]);

        useEffect(() => {
            if (!ctx.batch.active) return;
            if (ctx.batch.status === 'COMPLETE') return;

            const job = DELIVERABLES[ctx.batch.index];
            if (!job) {
                ctx.batch.status = 'COMPLETE';
                ctx.batch.active = false;
                onUpdate({ ...ctx });
                return;
            }

            if (!ctx.isPlaying && engineAPI.isRecording) {
                engineAPI.stopRecording();
                ctx.batch.index++;
                setTimeout(() => onUpdate({ ...ctx }), 500);
                return;
            }

            if (!ctx.isPlaying && !engineAPI.isRecording && ctx.batch.status === 'PROCESSING') {
                if (job.type === 'METADATA') {
                    if (job.filename.includes('PARTICLES')) {
                        const positions: number[][] = [];
                        const posArray = ctx.particleSystem.geometry.attributes.position.array;
                        for (let i = 0; i < posArray.length; i += 3) {
                            positions.push([posArray[i], posArray[i+1], posArray[i+2]]);
                        }
                        engineAPI.saveJSON(job.filename, { 
                            projectId: 'AOB_VOID_V1',
                            count: positions.length,
                            preset: ctx.activeScenePreset,
                            particles: positions 
                        });
                    } else {
                        engineAPI.saveJSON(job.filename, { 
                            projectId: 'AOB_VOID_V1', 
                            generated: new Date().toISOString(),
                            cameraData: ctx.trackingData 
                        });
                    }
                    ctx.batch.index++;
                    onUpdate({ ...ctx });
                } else {
                    if (job.type === 'VIDEO_PLATE') {
                        const shot = SHOT_SPECS.find(s => s.id === job.shotId);
                        if (shot) {
                            ctx.activeShotId = shot.id;
                            ctx.camera.fov = shot.camera.lens;
                            ctx.camera.updateProjectionMatrix();
                            ctx.camera.position.set(...shot.camera.posStart);
                            ctx.camera.lookAt(new THREE.Vector3(...shot.camera.lookAt));
                        }
                    } else if (job.type === 'VFX_ELEMENT') {
                        ctx.activeShotId = 'VFX_PASS';
                        ctx.camera.position.set(0, 0, 10);
                        ctx.camera.lookAt(0,0,0);
                        if (ctx.particleSystem) {
                             if (ctx.particleSystem.material.uniforms) ctx.particleSystem.material.uniforms.color.value.setScalar(1.0);
                             else ctx.particleSystem.material.opacity = 1.0;
                        }
                    }
                    engineAPI.startRecording(job.filename);
                    ctx.startTime = performance.now();
                    ctx.isPlaying = true;
                    onUpdate({ ...ctx });
                }
            }
        }, [ctx.batch.active, ctx.batch.index, ctx.isPlaying, engineAPI.isRecording]);

        const startBatch = () => {
            ctx.trackingData = []; 
            ctx.batch.active = true;
            ctx.batch.index = 0;
            ctx.batch.status = 'PROCESSING';
            engineAPI.setCameraMode('scripted');
            onUpdate({ ...ctx });
        };

        const playPreview = (shotId: string) => {
            const shot = SHOT_SPECS.find(s => s.id === shotId);
            if (!shot) return;
            ctx.activeShotId = shotId;
            ctx.isPlaying = true;
            ctx.startTime = performance.now();
            engineAPI.setCameraMode('scripted');
            ctx.camera.fov = shot.camera.lens;
            ctx.camera.updateProjectionMatrix();
            ctx.camera.position.set(...shot.camera.posStart);
            ctx.camera.lookAt(new THREE.Vector3(...shot.camera.lookAt));
            onUpdate({...ctx});
        };

        const switchScenePreset = (presetKey: string) => {
            const config = SCENE_PRESETS[presetKey];
            if (!config) return;

            if (ctx.scene.background instanceof THREE.Color) ctx.scene.background.setHex(config.background);
            if (ctx.scene.fog) {
                ctx.scene.fog.color.setHex(config.background);
                (ctx.scene.fog as THREE.FogExp2).density = config.fogDensity; 
            }

            if (ctx.particleSystem) {
                ctx.scene.remove(ctx.particleSystem);
                ctx.particleSystem.geometry.dispose();
                (ctx.particleSystem.material as THREE.Material).dispose();
            }

            const { system, preset } = createParticleSystem(config.particles);
            ctx.particleSystem = system;
            ctx.preset = preset;
            ctx.activeScenePreset = presetKey;
            ctx.scene.add(system);
            
            onUpdate({...ctx});
        };

        return (
            <div className="module-ui production-ui">
                <div className="panel-header">SCENE STUDIO (BLOCKING)</div>
                <div className="btn-group" style={{marginBottom: '15px'}}>
                    {Object.keys(SCENE_PRESETS).map(key => (
                        <button 
                            key={key} 
                            className={ctx.activeScenePreset === key ? 'active' : ''}
                            onClick={() => switchScenePreset(key)}
                        >
                            {key.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="panel-header">AOB DELIVERABLES (SEQ01)</div>
                <div className="blueprint-info">
                    <strong>STATUS:</strong> {ctx.batch.active ? `BATCHING ${ctx.batch.index + 1}/${DELIVERABLES.length}` : 'READY'}<br/>
                    <small>Auto-Export: WebM (VP9) + JSON Metadata</small>
                </div>

                <div className="shot-list">
                    {DELIVERABLES.map((item, idx) => (
                        <div key={item.filename} className={`shot-row ${ctx.batch.index===idx && ctx.batch.active ? 'active' : ''}`}>
                            <div className="shot-meta">
                                <span className="id" style={{fontSize:'10px'}}>{item.filename}</span>
                                <span className="desc">{item.type} - {item.description}</span>
                            </div>
                            {item.type === 'VIDEO_PLATE' && (
                                <button disabled={ctx.batch.active} onClick={() => playPreview(item.shotId!)}>PREVIEW</button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pipeline-status">
                     <div className="progress-track">
                        <div className="progress-fill" style={{width: `${ctx.progress}%`}}></div>
                    </div>
                    <button 
                        className={`action-btn ${ctx.batch.active ? 'danger' : ''}`}
                        onClick={startBatch}
                        disabled={ctx.batch.active}
                    >
                        {ctx.batch.active ? 'RENDERING BATCH...' : 'START AUTOMATED DELIVERY'}
                    </button>
                </div>
            </div>
        );
    }
};

export default AOBVoidModule;