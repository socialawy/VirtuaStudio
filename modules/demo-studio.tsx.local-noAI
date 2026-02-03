// modules/.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneModule } from '../core/types';

export const DemoStudioModule: SceneModule = {
  id: 'DEMO_STUDIO_V1',
  name: 'VirtuaStudio Demo',
  description: 'Animated character, trees, cinematic controls',
  type: 'PLAYGROUND',
  tags: ['demo', 'character', 'animation', 'cinematic'],
  deliverables: [],

  init: (scene, camera) => {
    // --- Scene Setup ---
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    camera.position.set(0, 5, -10);
    camera.fov = 75;
    camera.updateProjectionMatrix();

    // --- Lighting ---
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    // --- Terrain ---
    const terrainSize = 120;
    const getTerrainHeight = (x: number, z: number) => {
      return (Math.sin(x / 8) + Math.cos(z / 8)) * 2.5;
    };

    const terrainGeom = new THREE.PlaneGeometry(terrainSize, terrainSize, 120, 120);
    terrainGeom.rotateX(-Math.PI / 2);
    const positions = terrainGeom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      positions.setY(i, getTerrainHeight(x, z));
    }
    terrainGeom.computeVertexNormals();

    const terrain = new THREE.Mesh(
      terrainGeom,
      new THREE.MeshStandardMaterial({ color: 0x558833, roughness: 0.8, flatShading: true })
    );
    terrain.receiveShadow = true;
    scene.add(terrain);

    // --- Grid ---
    const grid = new THREE.GridHelper(terrainSize, 20, 0x000000, 0x000000);
    grid.position.y = 0.1;
    (grid.material as THREE.Material).opacity = 0.1;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // --- Character ---
    const character = new THREE.Group();
    const charMat = new THREE.MeshStandardMaterial({ color: 0xff6347, roughness: 0.4 });

    const createLimb = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), charMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      return mesh;
    };

    const head = createLimb(0.6, 0.6, 0.6, 0, 2.3, 0);
    const torso = createLimb(0.8, 1, 0.4, 0, 1.5, 0);
    const leftArm = createLimb(0.25, 0.8, 0.25, -0.525, 1.6, 0);
    const rightArm = createLimb(0.25, 0.8, 0.25, 0.525, 1.6, 0);
    const leftLeg = createLimb(0.4, 1, 0.4, -0.25, 0.5, 0);
    const rightLeg = createLimb(0.4, 1, 0.4, 0.25, 0.5, 0);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);
    leftEye.position.set(-0.15, 2.35, 0.3);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);
    rightEye.position.set(0.15, 2.35, 0.3);

    character.add(head, torso, leftArm, rightArm, leftLeg, rightLeg, leftEye, rightEye);
    scene.add(character);

    // --- Trees ---
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const treeLeafMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const treeTrunkGeom = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 6);
    const treeLeafGeom = new THREE.ConeGeometry(1, 2.5, 6);

    for (let i = 0; i < 40; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(treeTrunkGeom, treeTrunkMat);
      trunk.position.y = 0.75;
      trunk.castShadow = true;
      const leaves = new THREE.Mesh(treeLeafGeom, treeLeafMat);
      leaves.position.y = 2;
      leaves.castShadow = true;
      tree.add(trunk, leaves);

      let tx = 0, tz = 0;
      do {
        tx = (Math.random() - 0.5) * terrainSize * 0.8;
        tz = (Math.random() - 0.5) * terrainSize * 0.8;
      } while (Math.sqrt(tx * tx + tz * tz) < 15);

      const ty = getTerrainHeight(tx, tz);
      if (ty > -2) {
        tree.position.set(tx, ty, tz);
        const scale = 0.8 + Math.random() * 0.4;
        tree.scale.set(scale, scale, scale);
        scene.add(tree);
      }
    }

    return {
      scene,
      camera,
      sun,
      terrain,
      character,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      getTerrainHeight,
      params: {
        isPlaying: true,
        camMode: 'TRACKING' as 'TRACKING' | 'DRONE',
        timeOfDay: 50,
        aspectRatio: '16:9' as '16:9' | '2.35:1'
      },
      animState: { angle: 0 }
    };
  },

  update: (ctx, time, delta) => {
    const { params, animState, character, leftArm, rightArm, leftLeg, rightLeg, sun, scene, camera } = ctx;

    // Walk animation
    if (params.isPlaying) {
      animState.angle += 0.01;
      character.position.y += Math.sin(animState.angle * 10) * 0.02;
      leftArm.rotation.x = Math.sin(animState.angle * 10) * 0.5;
      rightArm.rotation.x = -Math.sin(animState.angle * 10) * 0.5;
      leftLeg.rotation.x = -Math.sin(animState.angle * 10) * 0.5;
      rightLeg.rotation.x = Math.sin(animState.angle * 10) * 0.5;
    }

    // Character path
    const radius = 20;
    const x = Math.sin(animState.angle) * radius;
    const z = Math.cos(animState.angle) * radius;
    const y = ctx.getTerrainHeight(x, z);
    character.position.set(x, y, z);

    // Look forward
    const lookX = Math.sin(animState.angle + 0.1) * radius;
    const lookZ = Math.cos(animState.angle + 0.1) * radius;
    character.lookAt(lookX, y, lookZ);

    // Time of day lighting
    const t = params.timeOfDay / 100;
    const sunX = Math.sin((t - 0.5) * Math.PI) * 100;
    const sunY = Math.cos((t - 0.5) * Math.PI) * 100;
    sun.position.set(sunX, sunY, 25);

    if (t < 0.2 || t > 0.8) {
      sun.color.setHSL(0.6, 0.5, 0.2);
      (scene.background as THREE.Color).setHex(0x0a1a2a);
      if (scene.fog) scene.fog.color.setHex(0x0a1a2a);
    } else if (t < 0.3 || t > 0.7) {
      sun.color.setHSL(0.1, 0.8, 0.6);
      (scene.background as THREE.Color).setHex(0xffaa55);
      if (scene.fog) scene.fog.color.setHex(0xffaa55);
    } else {
      sun.color.setHSL(0.1, 0.1, 1.0);
      (scene.background as THREE.Color).setHex(0x87ceeb);
      if (scene.fog) scene.fog.color.setHex(0x87ceeb);
    }

    // Camera tracking
    if (params.camMode === 'TRACKING') {
      const offset = new THREE.Vector3(0, 5, -10);
      offset.applyQuaternion(character.quaternion);
      const targetPos = character.position.clone().add(offset);
      camera.position.lerp(targetPos, 0.05);
      camera.lookAt(character.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }
  },

  dispose: (ctx) => {
    ctx.scene.clear();
  },

  UI: ({ ctx, onUpdate, engineAPI }) => {
    return (
      <div className="module-ui">
        <div className="panel-header">STUDIO CONTROLS</div>
        
        <div className="control-row">
          <label>ACTION</label>
          <div className="btn-group">
            <button 
              className={!ctx.params.isPlaying ? 'active' : ''} 
              onClick={() => { ctx.params.isPlaying = false; onUpdate({...ctx}); }}
            >CUT</button>
            <button 
              className={ctx.params.isPlaying ? 'active' : ''} 
              onClick={() => { ctx.params.isPlaying = true; onUpdate({...ctx}); }}
            >ACTION</button>
          </div>
        </div>

        <div className="control-row">
          <label>CAMERA RIG</label>
          <div className="btn-group">
            <button 
              className={ctx.params.camMode === 'TRACKING' ? 'active' : ''} 
              onClick={() => { ctx.params.camMode = 'TRACKING'; engineAPI.setCameraMode('scripted'); onUpdate({...ctx}); }}
            >TRACKING</button>
            <button 
              className={ctx.params.camMode === 'DRONE' ? 'active' : ''} 
              onClick={() => { ctx.params.camMode = 'DRONE'; engineAPI.setCameraMode('orbit'); onUpdate({...ctx}); }}
            >DRONE</button>
          </div>
        </div>

        <div className="control-row">
          <label>TIME OF DAY: {ctx.params.timeOfDay}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={ctx.params.timeOfDay} 
            onChange={(e) => { ctx.params.timeOfDay = parseInt(e.target.value); onUpdate({...ctx}); }} 
          />
        </div>
      </div>
    );
  }
};

export default DemoStudioModule;