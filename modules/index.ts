/**
 * @fileoverview Module Registry
 * 
 * @description
 * Central registry for all available scene modules.
 * Import modules here to make them available in the library.
 */

import { SceneModule } from '../core/types';
import { AOBVoidModule } from './aob-void';
import { DemoStudioModule } from './demo-studio';
import { OceanSunsetModule } from './ocean-sunset';
import { CityFlyoverModule } from './city-flyover';

// ============================================================================
// MODULE REGISTRY
// ============================================================================

export const MODULE_REGISTRY: Record<string, SceneModule> = {
  [AOBVoidModule.id]: AOBVoidModule,
  [DemoStudioModule.id]: DemoStudioModule,
  [OceanSunsetModule.id]: OceanSunsetModule,
  [CityFlyoverModule.id]: CityFlyoverModule,
};

// ============================================================================
// HELPERS
// ============================================================================

export function getModule(id: string): SceneModule | undefined {
  return MODULE_REGISTRY[id];
}

export function listModules(): SceneModule[] {
  return Object.values(MODULE_REGISTRY);
}

export function listModulesByTag(tag: string): SceneModule[] {
  return listModules().filter(m => m.tags.includes(tag));
}

export function listModulesByType(type: 'PLAYGROUND' | 'PRODUCTION'): SceneModule[] {
  return listModules().filter(m => m.type === type);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { AOBVoidModule } from './aob-void';
export { DemoStudioModule } from './demo-studio';
export { OceanSunsetModule } from './ocean-sunset';
export { CityFlyoverModule } from './city-flyover';