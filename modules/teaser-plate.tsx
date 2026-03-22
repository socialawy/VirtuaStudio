import * as THREE from 'three';
import React from 'react';
import { SceneModule } from '../core/types';

export const TeaserPlateModule: SceneModule = {
  id: 'TEASER_PLATE_V1',
  name: 'Teaser Plate',
  description: 'Teaser Plate Showcase Module',
  type: 'PLAYGROUND',
  tags: ['teaser', 'presentation', 'showcase'],

  deliverables: [
    {
      id: 'PLATE_01',
      filename: '{PROJECT}_TEASER_PLATE_v001.webm',
      type: 'VIDEO_PLATE',
      duration: 10,
      description: 'Teaser plate'
    },
    {
      id: 'CAM_DATA',
      filename: '{PROJECT}_TEASER_CAM_v001.json',
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

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Return context (anything the update loop needs)
    return { scene, camera, cube, geometry, material, params: { speed: 1.0 } };
  },

  update: (ctx, time, delta) => {
    ctx.cube.rotation.y = time * ctx.params.speed;
  },

  dispose: (ctx) => {
    ctx.geometry.dispose();
    ctx.material.dispose();
    ctx.scene.clear();
  },

  // Optional UI
  UI: ({ ctx, onUpdate }) => {
    return (
      <div className="module-ui">
        <div className="panel-header">TEASER PLATE CONTROLS</div>
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

export default TeaserPlateModule;