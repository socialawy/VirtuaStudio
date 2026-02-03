/**
 * @fileoverview VirtuaStudio Main Application Shell
 * 
 * @description
 * Lightweight shell that loads and manages scene modules.
 * All scene logic is delegated to modules in ./modules/
 * 
 * @version 2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { SceneModule, EngineAPI } from './core/types';
import { listModules, listModulesByType } from './modules';

// ============================================================================
// MAIN ENGINE COMPONENT
// ============================================================================

const VirtualStudio: React.FC = () => {
  const [activeModule, setActiveModule] = useState<SceneModule | null>(null);
  const [moduleContext, setModuleContext] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Engine refs
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingNameRef = useRef<string>("video.webm");
  
  // Context ref for render loop
  const contextRef = useRef<any>(null);
  useEffect(() => { contextRef.current = moduleContext; }, [moduleContext]);

  // ============================================================================
  // ENGINE API
  // ============================================================================

  const engineAPI: EngineAPI = useMemo(() => ({
    isRecording,
    startRecording: (filename) => {
      if (!rendererRef.current) return;
      recordingNameRef.current = filename;
      try {
        const stream = rendererRef.current.domElement.captureStream(30);
        const rec = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        chunksRef.current = [];
        rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = recordingNameRef.current;
          a.click();
          setIsRecording(false);
        };
        rec.start();
        recorderRef.current = rec;
        setIsRecording(true);
      } catch (err) { console.error("Recording error", err); }
    },
    stopRecording: () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    },
    saveJSON: (filename, data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    },
    setCameraMode: (mode) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = (mode === 'orbit');
        if (mode === 'scripted') controlsRef.current.reset();
      }
    }
  }), [isRecording]);

  // ============================================================================
  // MODULE LOADING
  // ============================================================================

  const loadModule = (module: SceneModule) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    // 1. Synchronously block the render loop from accessing the old context
    contextRef.current = null;

    // 2. Cleanup previous resources
    if (activeModule && moduleContext) {
      try {
        activeModule.dispose(moduleContext);
      } catch (e) {
        console.warn("Module dispose error:", e);
      }
    }
    
    // 3. Reset Engine State
    sceneRef.current.clear();
    sceneRef.current.background = new THREE.Color(0x000000);
    sceneRef.current.fog = null;
    sceneRef.current.environment = null;

    // 4. Initialize new module
    const ctx = module.init(sceneRef.current, cameraRef.current, rendererRef.current);
    setModuleContext(ctx);
    setActiveModule(module);
  };

  // ============================================================================
  // ENGINE SETUP
  // ============================================================================

  useEffect(() => {
    if (!mountRef.current) return;
    if (rendererRef.current) return; // Prevent double-init (StrictMode)

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mountRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    return () => {
      renderer.dispose();
      controls.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  // ============================================================================
  // RESIZE HANDLER
  // ============================================================================

  useEffect(() => {
    if (!mountRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      if (width === 0 || height === 0) return;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    });
    
    resizeObserver.observe(mountRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // ============================================================================
  // RENDER LOOP
  // ============================================================================

  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    const clock = new THREE.Clock();
    let running = true;
    
    const loop = () => {
      if (!running) return;
      requestAnimationFrame(loop);
      
      const time = clock.getElapsedTime();
      const delta = clock.getDelta();
      
      // Safety: Only update if we have a valid context for the CURRENT active module
      if (activeModule && contextRef.current) {
         try {
             activeModule.update(contextRef.current, time, delta);
         } catch (e) {
             console.error("Render Loop Error:", e);
             running = false; // Stop loop on crash
         }
      }
      
      if (controlsRef.current) controlsRef.current.update();
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    };
    
    loop();
    return () => { running = false; };
  }, [activeModule]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const playgroundModules = listModulesByType('PLAYGROUND');
  const productionModules = listModulesByType('PRODUCTION');
  const ActiveUI = activeModule?.UI;

  return (
    <div className="engine-container">
      <div ref={mountRef} className="viewport" />
      
      <header className="engine-header">
        <div className="brand">VIRTUASTUDIO // ENGINE v2.0</div>
        <div className="project-switcher">
          {playgroundModules.map(m => (
            <button 
              key={m.id}
              className={activeModule?.id === m.id ? 'active' : ''} 
              onClick={() => loadModule(m)}
            >
              {m.name.toUpperCase()}
            </button>
          ))}
          {productionModules.map(m => (
            <button 
              key={m.id}
              className={activeModule?.id === m.id ? 'active' : ''} 
              onClick={() => loadModule(m)}
            >
              {m.name.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {ActiveUI && moduleContext && (
        <ActiveUI ctx={moduleContext} onUpdate={setModuleContext} engineAPI={engineAPI} />
      )}

      {!activeModule && (
        <div className="landing-screen">
          <h2>SELECT MODULE</h2>
          <p>Load a scene module to initialize the engine.</p>
          <div className="cards">
            {listModules().map(m => (
              <div 
                key={m.id} 
                className={`card ${m.type === 'PRODUCTION' ? 'prod' : ''}`} 
                onClick={() => loadModule(m)}
              >
                <h3>{m.name}</h3>
                <p>{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MOUNT
// ============================================================================

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <VirtualStudio />
  </React.StrictMode>
);