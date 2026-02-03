//#!/usr/bin/env node

import { listModules, getModule, listModulesByType } from './modules/index';

console.log('=== VirtuaStudio Engine Checks ===\n');

// ============================================================================
// CHECK 1: MODULE REGISTRY
// ============================================================================
console.log('1. Registry Integrity');
const allModules = listModules();
const EXPECTED_COUNT = 4;
const EXPECTED_IDS = [
    'AOB_VOID_V1',
    'DEMO_STUDIO_V1',
    'OCEAN_SUNSET_V1',
    'CITY_FLYOVER_V1'
];

console.log(`   Count: ${allModules.length} (Expected: ${EXPECTED_COUNT})`);
const missingModules = EXPECTED_IDS.filter(id => !getModule(id));

if (allModules.length === EXPECTED_COUNT && missingModules.length === 0) {
    console.log(`   ✓ Registry contains all required modules`);
} else {
    console.log(`   ✗ Mismatch! Missing: ${missingModules.join(', ')}`);
    console.log(`   Found: ${allModules.map(m => m.id).join(', ')}`);
}
console.log('');

// ============================================================================
// CHECK 2: MODULE CATEGORIES
// ============================================================================
console.log('2. Module Categories');
const playground = listModulesByType('PLAYGROUND');
const production = listModulesByType('PRODUCTION');

console.log(`   Playground: ${playground.length} (Expected 3)`);
console.log(`   Production: ${production.length} (Expected 1)`);

if (playground.length === 3 && production.length === 1) {
    console.log(`   ✓ Category distribution correct`);
} else {
    console.log(`   ✗ Category count mismatch`);
}
console.log('');

// ============================================================================
// CHECK 3: API SURFACE
// ============================================================================
console.log('3. Module Interface Compliance');
let interfaceErrors = 0;
allModules.forEach(m => {
    const checks = [
        typeof m.init === 'function',
        typeof m.update === 'function',
        typeof m.dispose === 'function',
        Array.isArray(m.deliverables)
    ];
    if (checks.every(Boolean)) {
        // Valid
    } else {
        console.log(`   ✗ ${m.id} has invalid interface`);
        interfaceErrors++;
    }
});

if (interfaceErrors === 0) {
    console.log(`   ✓ All modules implement SceneModule interface`);
}
console.log('');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('=== Final Verdict ===');
const passed = allModules.length === EXPECTED_COUNT && missingModules.length === 0 && interfaceErrors === 0;

if (passed) {
    console.log('✅ ENGINE READY FOR DELIVERY');
    process.exit(0);
} else {
    console.log('❌ CHECKS FAILED');
    process.exit(1);
}