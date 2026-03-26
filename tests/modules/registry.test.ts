import { describe, it, expect } from 'vitest';
import { listModules, getModule, listModulesByType, listModulesByTag } from '../../modules/index';
import libraryJson from '../../library/index.json';

describe('VirtuaStudio Engine Checks', () => {

  describe('1. Registry Integrity', () => {
    it('contains all expected modules', () => {
      const allModules = listModules();
      const EXPECTED_COUNT = 5;
      const EXPECTED_IDS = [
        'AOB_VOID_V1',
        'DEMO_STUDIO_V1',
        'OCEAN_SUNSET_V1',
        'CITY_FLYOVER_V1',
        'TEASER_PLATE_V1'
      ];

      expect(allModules.length).toBe(EXPECTED_COUNT);

      const missingModules = EXPECTED_IDS.filter(id => !getModule(id));
      expect(missingModules).toEqual([]);
    });

    it('can retrieve module by ID', () => {
      const module = getModule('AOB_VOID_V1');
      expect(module).toBeDefined();
      expect(module?.id).toBe('AOB_VOID_V1');
    });
  });

  describe('2. Module Categories and Tags', () => {
    it('returns modules by type', () => {
      const playground = listModulesByType('PLAYGROUND');
      const production = listModulesByType('PRODUCTION');

      expect(playground.length).toBe(4);
      expect(production.length).toBe(1);
    });

    it('returns modules by tag', () => {
      const cityModules = listModulesByTag('city');
      expect(cityModules.length).toBeGreaterThan(0);
      expect(cityModules.some(m => m.id === 'CITY_FLYOVER_V1')).toBe(true);
    });
  });

  describe('3. Module Interface Compliance', () => {
    it('every module implements SceneModule interface', () => {
      const allModules = listModules();

      allModules.forEach(m => {
        expect(typeof m.init).toBe('function');
        expect(typeof m.update).toBe('function');
        expect(typeof m.dispose).toBe('function');
        expect(Array.isArray(m.deliverables)).toBe(true);
      });
    });
  });

  describe('4. Library JSON Sync', () => {
    it('matches MODULE_REGISTRY entries', () => {
      const allModules = listModules();
      const libraryModules = libraryJson.modules;

      expect(allModules.length).toBe(libraryModules.length);

      const registryIds = allModules.map(m => m.id).sort();
      const libraryIds = libraryModules.map((m: any) => m.id).sort();

      expect(registryIds).toEqual(libraryIds);
    });
  });

});
