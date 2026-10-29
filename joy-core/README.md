# JOY CORE

Standalone cinematic 3D AI nucleus built with **Vite + Three.js + TypeScript**.

This project is intentionally **not** integrated into the Expo/React Native Joy app yet.
The engine (`src/core/JoyCore.ts`) keeps scene logic reusable for a later native bridge
(e.g. expo-gl), while the debug UI remains web-only.

## Run (lab)

```bash
cd joy-core
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Integrate into the Joy Expo app

The Expo app already wires this engine through:

- Web: `src/design-system/JoyCoreView.web.tsx` (direct Three.js canvas)
- Native: `src/design-system/JoyCoreView.tsx` (WebView → this Vite app)

1. Keep this lab running (`npm run dev`) when testing native WebView in `__DEV__`.
2. On the Expo Home screen, `<JoyCoreView state="idle" />` mounts the core.
3. Drive it from chat/voice later with:

```tsx
<JoyCoreView state="listening" audioLevel={amplitude} size={300} />
```

4. For production native builds, host `joy-core/dist` and set:

```bash
EXPO_PUBLIC_JOY_CORE_URL=https://your.cdn/joy-core/
```

Phase 2 (optional): replace the native WebView with `expo-gl` + the same `JoyCore` class.

## Features

- Metallic rounded-triangular chassis (tube geometry)
- Red energy crystal with custom shader + refractive glass shell
- Orbiting energy rings with audio-reactive streaks
- Additive red particle field
- Cinematic lighting + Unreal bloom
- States: `IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `EXECUTING`, `ERROR`
- Debug panel for state + simulated audio amplitude
- Automatic quality scaling when frame time degrades

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build
