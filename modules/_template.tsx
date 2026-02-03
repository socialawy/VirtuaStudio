import * as THREE from 'three';
import React from 'react';
import { SceneModule } from '../core/types';

export const TemplateModule: SceneModule = {
  id: 'TEMPLATE_V1',
  name: 'Module Name',
  description: 'What this scene does',
  type: 'PLAYGROUND', // or 'PRODUCTION'
  tags: ['abstract', 'particles', 'environment'],
  
  deliverables: [
    { 
      id: 'PLATE_01', 
      filename: '{PROJECT}_PLATE_v001.webm', 
      type: 'VIDEO_PLATE', 
      duration: 10, 
      description: 'Main plate' 
    },
    { 
      id: 'CAM_DATA', 
      filename: '{PROJECT}_CAM_v001.json', 
      type: 'METADATA', 
      description: 'Camera tracking' 
    },
  ],

  init: (scene, camera, renderer) => {
    // Scene setup
    camera.position.set(0, 5, 10);
    scene.background = new THREE.Color(0x000000);
    
    // Your objects here
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // Return context (anything the update loop needs)
    return { scene, camera, cube, params: { speed: 1.0 } };
  },

  update: (ctx, time, delta) => {
    ctx.cube.rotation.y = time * ctx.params.speed;
  },

  dispose: (ctx) => {
    ctx.scene.clear();
  },

  // Optional UI
  UI: ({ ctx, onUpdate }) => {
    return (
      <div className="module-ui">
        <div className="panel-header">TEMPLATE CONTROLS</div>
        <div className="control-row">
            <label>Speed: {ctx.params.speed.toFixed(1)}</label>
            <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.1"
                value={ctx.params.speed}
                onChange={(e) => {
                    ctx.params.speed = parseFloat(e.target.value);
                    onUpdate({...ctx});
                }}
            />
        </div>
      </div>
    );
  }
};

export default TemplateModule;