import * as THREE from 'three';
import React from 'react';
import { SceneModule } from '../core/types';

// ============================================================================
// SHADERS
// ============================================================================

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uWaveHeight;
  
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  // Simple, robust wave function ensuring compilation on all devices
  float getWaveHeight(vec3 p, float t) {
    float elevation = sin(p.x * 0.02 + t * 0.5) * 1.0;
    elevation += sin(p.z * 0.01 + t * 0.2) * 1.0;
    elevation += sin(p.x * 0.05 + p.z * 0.05 + t * 1.0) * 0.25;
    return elevation;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Calculate elevation
    float elevation = getWaveHeight(pos, uTime) * uWaveHeight;
    pos.y += elevation;
    vElevation = elevation;
    
    // Standard Three.js coordinate calculation
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz; // View position is negative Z in camera space
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColorWater;
  uniform vec3 uColorFoam;
  uniform vec3 uSunPosition;
  uniform vec3 uSunColor;
  uniform vec3 fogColor;
  uniform float fogDensity;
  
  varying float vElevation;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    // 1. Base Color Mixing based on height
    float mixStrength = smoothstep(-2.0, 2.0, vElevation);
    vec3 baseColor = mix(uColorWater, uColorFoam, mixStrength * 0.5);
    
    // 2. Normal Calculation using derivatives (Flat/Faceted look)
    // Requires OES_standard_derivatives or WebGL 2
    vec3 fdx = dFdx(vWorldPosition);
    vec3 fdy = dFdy(vWorldPosition);
    vec3 normal = normalize(cross(fdx, fdy));

    // 3. Specular Sun Reflection (Blinn-Phong)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 sunDir = normalize(uSunPosition - vWorldPosition);
    vec3 halfDir = normalize(sunDir + viewDir);
    
    float NdotH = max(0.0, dot(normal, halfDir));
    float specular = pow(NdotH, 200.0); // Sharp, wet highlight
    vec3 specColor = uSunColor * specular * 2.0;

    vec3 finalColor = baseColor + specColor;

    // 4. Fog (Exponential Squared) matches THREE.FogExp2
    float depth = length(vViewPosition);
    float fogFactor = 1.0 - exp( - (fogDensity * depth) * (fogDensity * depth) );
    
    gl_FragColor = vec4(mix(finalColor, fogColor, fogFactor), 1.0);
  }
`;

// ============================================================================
// MODULE
// ============================================================================

export const OceanSunsetModule: SceneModule = {
  id: 'OCEAN_SUNSET_V1',
  name: 'Ocean Sunset',
  description: 'Procedural water shader with dynamic time-of-day',
  type: 'PLAYGROUND',
  tags: ['water', 'sunset', 'shader', 'calm'],
  deliverables: [],

  init: (scene, camera) => {
    // Cam Setup
    camera.position.set(0, 8, 30);
    camera.lookAt(0, 0, -50);

    // Initial Sky & Fog
    const skyColor = new THREE.Color(0x332244);
    scene.background = skyColor;
    // We match the shader fog density to the scene fog for consistency
    scene.fog = new THREE.FogExp2(0x332244, 0.002);

    // Sun Mesh - Basic Material with fog:false ensures it glows through the atmosphere
    const sunGeom = new THREE.SphereGeometry(60, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ 
        color: 0xff4400,
        fog: false 
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    scene.add(sunMesh);

    // Sun Light (for other objects if added)
    const sunLight = new THREE.DirectionalLight(0xff8800, 1.5);
    scene.add(sunLight);

    // Water Plane
    // High segment count for vertex displacement
    const geometry = new THREE.PlaneGeometry(2000, 2000, 128, 128);
    geometry.rotateX(-Math.PI / 2);

    const uniforms = {
        uTime: { value: 0 },
        uWaveHeight: { value: 2.5 },
        uColorWater: { value: new THREE.Color(0x001133) }, 
        uColorFoam: { value: new THREE.Color(0x004455) }, 
        uSunPosition: { value: new THREE.Vector3(0, 50, -500) },
        uSunColor: { value: new THREE.Color(0xff4400) },
        fogColor: { value: skyColor },
        fogDensity: { value: 0.002 }
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        side: THREE.FrontSide,
        wireframe: false,
        // derivatives: true is automatically enabled by Three.js when it detects dFdx/dFdy in the shader
    });

    const water = new THREE.Mesh(geometry, material);
    scene.add(water);

    return {
        scene, camera,
        sunMesh, sunLight, water, material,
        params: {
            sunHeight: 0.25,
            isPlaying: true,
            waveHeight: 2.5
        }
    };
  },

  update: (ctx, time, delta) => {
    ctx.material.uniforms.uTime.value = time;
    ctx.material.uniforms.uWaveHeight.value = ctx.params.waveHeight;

    // Sun Animation
    const h = ctx.params.sunHeight; // 0.0 to 1.0
    // Map 0..1 to a Y range that dips below horizon and goes high up
    const sunY = (h - 0.1) * 400; 
    const sunZ = -500;
    
    ctx.sunMesh.position.set(0, sunY, sunZ);
    ctx.sunLight.position.set(0, sunY, sunZ);
    ctx.material.uniforms.uSunPosition.value.copy(ctx.sunMesh.position);

    // Dynamic Colors based on Sun Height
    const night = new THREE.Color(0x020205);
    const sunset = new THREE.Color(0x441122); 
    const orange = new THREE.Color(0xff6600);
    const day = new THREE.Color(0x87ceeb);
    const sunRed = new THREE.Color(0xff0000);
    const sunYellow = new THREE.Color(0xffffaa);

    let currentSky = new THREE.Color();
    let currentSun = new THREE.Color();

    if (h < 0.2) {
        // Night -> Sunset
        currentSky.copy(night).lerp(sunset, h * 5); // 0.0 - 0.2 maps to 0 - 1
        currentSun.copy(sunRed);
    } else if (h < 0.4) {
        // Sunset -> Orange
        currentSky.copy(sunset).lerp(orange, (h - 0.2) * 5);
        currentSun.copy(sunRed).lerp(sunYellow, (h - 0.2) * 5);
    } else {
        // Orange -> Day
        currentSky.copy(orange).lerp(day, (h - 0.4) * 2);
        currentSun.copy(sunYellow);
    }

    ctx.scene.background = currentSky;
    if (ctx.scene.fog) ctx.scene.fog.color.copy(currentSky);
    
    // Update Shader Uniforms
    ctx.material.uniforms.fogColor.value.copy(currentSky);
    ctx.material.uniforms.uSunColor.value.copy(currentSun);
    (ctx.sunMesh.material as THREE.MeshBasicMaterial).color.copy(currentSun);

    // Subtle Camera Bob
    if (ctx.params.isPlaying) {
        ctx.camera.position.z += delta * 2.0;
        ctx.camera.position.y = 8 + Math.sin(time * 0.5) * 1.0;
        if (ctx.camera.position.z > 100) ctx.camera.position.z = 0;
    }
  },

  dispose: (ctx) => {
    ctx.scene.clear();
    ctx.water.geometry.dispose();
    ctx.material.dispose();
  },

  UI: ({ ctx, onUpdate }) => {
    return (
        <div className="module-ui">
            <div className="panel-header">OCEAN CONTROLS</div>
            
            <div className="control-row">
                <label>SUN POSITION</label>
                <input 
                    type="range" min="0" max="1" step="0.01"
                    value={ctx.params.sunHeight}
                    onChange={(e) => {
                        ctx.params.sunHeight = parseFloat(e.target.value);
                        onUpdate({...ctx});
                    }}
                />
            </div>

            <div className="control-row">
                <label>WAVE INTENSITY</label>
                <input 
                    type="range" min="0" max="1" step="0.1"
                    value={ctx.params.waveHeight}
                    onChange={(e) => {
                        ctx.params.waveHeight = parseFloat(e.target.value);
                        onUpdate({...ctx});
                    }}
                />
            </div>

            <div className="control-row">
                <div className="btn-group">
                    <button 
                        className={ctx.params.isPlaying ? 'active' : ''}
                        onClick={() => {
                            ctx.params.isPlaying = !ctx.params.isPlaying;
                            onUpdate({...ctx});
                        }}
                    >
                        {ctx.params.isPlaying ? 'PAUSE' : 'PLAY'}
                    </button>
                </div>
            </div>
        </div>
    );
  }
};

export default OceanSunsetModule;