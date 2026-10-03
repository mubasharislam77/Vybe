# VYBE — 3D models

## Currently in use: `hoodie.glb`

**"Hoodie Character" by Quaternius** — CC0 (public domain), via [Poly Pizza](https://poly.pizza/m/gKLBoRsyKe).
Rigged low-poly figure wearing a hoodie (~1.46 MB, ~1.87u tall, 24 clips; we play
`Idle_Neutral`). Wired in `src/components/reveal/Model.tsx`, rendered by `RevealScene.tsx`.

A **procedural mannequin** (`src/components/reveal/Mannequin.tsx`) is kept as a
fallback / offline placeholder — swap it back by importing `Mannequin` instead of
`Model` in `RevealScene.tsx`.

## Swapping in a real free 3D model

1. Download a `.glb` (glTF binary) of a hoodie / figure wearing apparel.
2. Save it here as `hoodie.glb`.
3. In `src/components/reveal/RevealScene.tsx`:
   - import `Model` instead of `Mannequin`
   - render `<Model progress={progress} />`
4. Tune `scale` / `position` in `Model.tsx` to frame it.

### Good free sources (check the license — prefer CC0 / CC-BY)

| Source | URL | Notes |
| --- | --- | --- |
| Poly Pizza | https://poly.pizza | CC0 / CC-BY, one-click `.glb` download |
| Sketchfab | https://sketchfab.com (filter: Downloadable + CC) | huge library, export `.glb` |
| Quaternius | https://quaternius.com | CC0 character/clothing packs |
| Khronos glTF samples | https://github.com/KhronosGroup/glTF-Sample-Assets | reliable test models |

### Tips
- Keep it **< ~5 MB** for fast mobile loads. Compress with
  [`gltf-transform`](https://gltf-transform.dev): `gltf-transform optimize in.glb out.glb`.
- If the model faces the wrong way, add a base rotation to the `<group>` in `Model.tsx`.
- For a turning garment specifically, a rigged/A-pose figure or a mannequin torso
  reads best. A flat-lay garment won't have a convincing "back".
