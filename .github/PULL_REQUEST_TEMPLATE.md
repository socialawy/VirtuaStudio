## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New module
- [ ] Module enhancement
- [ ] Core/types change
- [ ] GenAI integration
- [ ] Documentation
- [ ] Dependencies

## Module(s) Affected
- [ ] AOB Void
- [ ] Demo Studio
- [ ] Ocean Sunset
- [ ] City Flyover
- [ ] Teaser Plate
- [ ] Core types/genai
- [ ] Module registry

## Checklist
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run test` passes
- [ ] New modules implement full SceneModule interface (init, update, dispose)
- [ ] Three.js resources properly disposed (geometry, material, texture)
- [ ] No console errors in browser
- [ ] Module registered in `modules/index.ts` and `library/index.json`

## Three.js Specifics
- [ ] All geometries disposed in `dispose()`
- [ ] All materials disposed in `dispose()`
- [ ] All textures disposed in `dispose()`
- [ ] No objects created per-frame in `update()`
- [ ] Animation frames cancelled on cleanup

## Screenshots / Recording
If visual changes.

## Related Issues
Closes #
