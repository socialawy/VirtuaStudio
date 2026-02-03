/**
 * @fileoverview Type definitions for VirtuaStudio module system.
 * 
 * @description
 * This file defines the contract that all scene modules must follow.
 * Modules are self-contained 3D scenes that can be loaded dynamically.
 * 
 * @version 2.0
 * @author VirtuaStudio
 */

import * as THREE from 'three';
import React from 'react';

// ============================================================================
// MODULE SYSTEM
// ============================================================================

export interface SceneModule {
  /** Unique identifier (e.g., 'AOB_VOID_V1') */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Brief description for library browser */
  description: string;
  
  /** Module category */
  type: 'PLAYGROUND' | 'PRODUCTION';
  
  /** Searchable tags */
  tags: string[];
  
  /** Optional thumbnail path */
  thumbnail?: string;
  
  /** Lifecycle: Initialize scene objects */
  init: (
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) => ModuleContext;
  
  /** Lifecycle: Per-frame update */
  update: (ctx: ModuleContext, time: number, deltaTime: number) => void;
  
  /** Lifecycle: Cleanup */
  dispose: (ctx: ModuleContext) => void;
  
  /** Optional custom UI panel */
  UI?: React.FC<ModuleUIProps>;
  
  /** What this module can export */
  deliverables: DeliverableSpec[];
  
  /** Shot definitions (production modules) */
  shots?: ShotSpec[];
}

// ============================================================================
// MODULE CONTEXT
// ============================================================================

export interface ModuleContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  
  /** Module-specific state */
  [key: string]: any;
}

export interface ModuleUIProps {
  ctx: ModuleContext;
  onUpdate: (newCtx: ModuleContext) => void;
  engineAPI: EngineAPI;
}

// ============================================================================
// ENGINE API
// ============================================================================

export interface EngineAPI {
  isRecording: boolean;
  startRecording: (filename: string) => void;
  stopRecording: () => void;
  saveJSON: (filename: string, data: any) => void;
  setCameraMode: (mode: 'orbit' | 'scripted') => void;
}

// ============================================================================
// DELIVERABLES
// ============================================================================

export interface DeliverableSpec {
  /** Unique ID within module */
  id: string;
  
  /** Output filename (supports {PROJECT} token) */
  filename: string;
  
  /** Asset type */
  type: 'VIDEO_PLATE' | 'VFX_ELEMENT' | 'METADATA';
  
  /** Duration in seconds (for video types) */
  duration?: number;
  
  /** Human-readable description */
  description: string;
  
  /** Associated shot ID (for production modules) */
  shotId?: string;
}

// ============================================================================
// SHOTS (Production Modules)
// ============================================================================

export interface ShotSpec {
  id: string;
  slug: string;
  duration: number;
  camera: {
    lens: number;
    posStart: [number, number, number];
    posEnd: [number, number, number];
    lookAt: [number, number, number];
  };
}

// ============================================================================
// PRESETS
// ============================================================================

export interface ParticlePreset {
  count: number;
  size: number;
  speed: number;
  color?: number;
}

export interface ScenePreset {
  background: number;
  fogDensity: number;
  particles: keyof typeof PARTICLE_PRESETS;
}

export const PARTICLE_PRESETS: Record<string, ParticlePreset> = {
  SHIMMER: { count: 8000, size: 0.05, speed: 0.05 },
  DUST: { count: 2000, size: 0.02, speed: 0.01 },
  STARS: { count: 500, size: 0.08, speed: 0.001 },
  DENSE_FOG: { count: 15000, size: 0.03, speed: 0.02 }
};

export const SCENE_PRESETS: Record<string, ScenePreset> = {
  VOID_ABSTRACT: { background: 0x000000, fogDensity: 0.05, particles: 'SHIMMER' },
  DAWN_EXTERIOR: { background: 0x87ceeb, fogDensity: 0.012, particles: 'DUST' },
  NIGHT_INTERIOR: { background: 0x050a15, fogDensity: 0.08, particles: 'DENSE_FOG' }
};