# VirtuaStudio // AOB Engine v2.0

**Status:** Production Ready
**Version:** 2.0.0
**Engine:** React + Three.js (r162)

## Overview

VirtuaStudio is a lightweight, browser-based virtual production engine designed for rapid shot blocking, procedural asset generation, and camera sequencing. It features a modular architecture that allows different scenes ("modules") to be loaded dynamically into a shared rendering shell.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment (Optional)**
   For GenAI features in `DemoStudioModule` "modules\demo-studio.tsx.onlineAI", add your API key:
   ```bash
   echo "GEMINI_API_KEY=your_key_here" > .env
   ```
   *Note: The engine runs in "Auto-Pilot" mode if no key is provided (Local/Offline Mode).* 

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Run System Checks**
   ```bash
   npx tsx test-modules.ts
   ```

## 📦 Active Modules

| Module ID | Type | Description |
|-----------|------|-------------|
| **AOB_VOID_V1** | Production | Abstract particle environments with camera sequencing and batch export. |
| **DEMO_STUDIO_V1** | Playground | GenAI-powered asset generation (Online) or Cinematic Auto-Pilot (Local). |
| **OCEAN_SUNSET_V1** | Playground | Procedural water shader and dynamic time-of-day lighting system. |
| **CITY_FLYOVER_V1** | Playground | Instanced geometry stress test featuring 400+ buildings and HDRI lighting. |

## 🛠 Architecture

### Core System
- **`index.tsx`**: Main application shell. Handles the React root, Three.js renderer lifecycle, and module switching.
- **`core/types.ts`**: TypeScript definitions enforcing the `SceneModule` interface contract.
- **`core/genai.ts`**: Wrapper for Google Gemini API to generate procedural Three.js code.

### Module Structure
Each module is a self-contained unit located in `modules/`:
```typescript
{
  init: (scene, camera) => context,    // Setup scene
  update: (ctx, time, delta) => void,  // Render loop
  dispose: (ctx) => void,              // Cleanup
  UI: ReactComponent                   // Custom React controls
}
```
## VirtuaStudio Module Development Guide

### Quick Start

1. Copy `modules/_template.tsx` (create from Stage 2 module)
2. Implement the `SceneModule` interface
3. Register in `modules/index.ts`
4. Run `npm run dev` to test

### Module Interface

```typescript
interface SceneModule {
  id: string;           // Unique ID (e.g., 'MY_MODULE_V1')
  name: string;         // Display name
  description: string;  // Brief description
  type: 'PLAYGROUND' | 'PRODUCTION';
  tags: string[];       // For filtering
  
  init(scene, camera, renderer) → context;
  update(context, time, delta) → void;
  dispose(context) → void;
  
  UI?: React.FC<ModuleUIProps>;  // Optional custom controls
  deliverables: DeliverableSpec[];
  shots?: ShotSpec[];
}
```
### Available Presets
- Particles
SHIMMER: 8000 particles, soft glow
DUST: 2000 particles, slow drift
STARS: 500 particles, static
DENSE_FOG: 15000 particles, atmospheric
Scenes
VOID_ABSTRACT: Black void, particles
DAWN_EXTERIOR: Blue sky, terrain
NIGHT_INTERIOR: Dark interior, fog

### Adding a New Module
#### 1. Create file
```bash
cp modules/_template.tsx modules/my-scene.
```
#### 2. Implement
```typescript
export const MySceneModule: SceneModule = {
  id: 'MY_SCENE_V1',
  // ... implement interface
};
```
#### 3. Register
```typescript
// modules/index.ts
import { MySceneModule } from './my-scene';

export const MODULE_REGISTRY = {
  // ...existing
  [MySceneModule.id]: MySceneModule,
};
```
#### 4. Test
Scene loads from landing page
Custom UI renders (if any)
Deliverables export correctly

## 🤖 GenAI Integration

The **Demo Studio** module features a "Generate Prop" panel.
- **Online (or local with API Key):** Generates 3D assets via Gemini 3.o Flash.
- **Offline/Local:** UI gracefully handles missing keys; module falls back to standard "Auto-Pilot" character animation and procedural environment.

### 📄 Deliverables

The AOB Production module supports automated batch exporting:
- **Video Plates:** WebM (VP9) recordings of camera moves.
- **Metadata:** JSON exports of camera tracking data and particle clouds.

## 🧪 Testing

Run the module integrity suite to verify registry status and type safety:
```bash
npx tsx test-modules.ts
```
