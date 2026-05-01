# Phase 2 — Full procedural 3D layer (no assets, code-only)

> **Mission**: Replace the visual asset pipeline with **fully procedural, code-generated 3D meshes** rendered through React Three Fiber. No GLB models, no marketplace assets, no CC0 imports. Every roller, brush, paint can, drip, splash, and wall surface must be born from `THREE.BufferGeometry`, custom shaders, and parametric construction.
>
> **Quality bar**: top-tier portfolio piece. The kind of work that ends up on Awwwards Site of the Day. Treat constraints (no Blender, no marketplace) as an artistic discipline, not a limitation.

---

## 0. Why procedural?

Procedural is not "second best because we couldn't find assets." It's a deliberate decision because:

1. **Portfolio reads stronger** — "this person can build 3D from raw geometry" outranks "this person bought assets and integrated them"
2. **Total parameter control** — every dimension, color, texture, and animation is a JS variable; ten variations are zero extra files
3. **File size near zero** — no GLB downloads, no texture transfer, only shader code over the wire
4. **Single source of truth** — geometry and animation live in the same component file
5. **Deterministic** — no asset versioning, no licensing footnotes, no broken texture paths

Lean into this. Don't apologise for "no realistic textures" — make the procedural surfaces *desirable*.

---

## 1. Tech additions to the stack

Add to `package.json`:
- `three` — core (likely pulled in transitively, but explicit)
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — helpers (OrbitControls only in dev, never in prod)
- `@react-three/postprocessing` — bloom, SSAO, tonemapping
- `leva` — runtime parameter tweaking, **dev-only** (NEVER ships to production; gate with `process.env.NODE_ENV === 'development'`)
- `maath` — easing and noise helpers (smaller than full Simplex libs)

No HDRI files. No texture files. No GLB. If a spec line ever calls for one, replace with a procedural equivalent.

---

## 2. Architecture — single Canvas, scroll-driven scene composition

The entire site shares **one** `<Canvas>` mounted in the root layout (`[locale]/layout.tsx`), positioned `fixed inset-0 z-0 pointer-events-none`. Page content (text, forms, footers) sits on a transparent layer above it (`z-10`).

The Canvas runs a single `<Scene />` component that:
- Reads scroll progress via Lenis (`useLenis(({ scroll }) => …)`)
- Maps scroll progress to **camera position**, **scene state**, and **per-section object visibility**
- Triggers section-specific animations via GSAP timelines bound to ScrollTrigger markers

This pattern (single Canvas, scroll-orchestrated camera) is how Lusion / Active Theory / Bruno Simon do it. It avoids:
- Multiple WebGL contexts (browser limit ~16, fragile)
- Re-mounting Canvas per route (kills perf)
- Z-index battles between Canvas and DOM

The scene itself is divided into **stages** at distinct world-space positions:
- `stage-hero` at `(0, 0, 0)`
- `stage-services` at `(0, -10, 0)`
- `stage-process` at `(0, -25, 0)`
- `stage-portfolio` at `(0, -40, 0)`
- `stage-palette` at `(0, -55, 0)`
- `stage-testimonials` at `(0, -65, 0)`
- `stage-contact` at `(0, -75, 0)`

Camera tweens between stages on scroll. Each stage has its own meshes that stay culled (`visible={false}`) until camera enters its frustum bubble.

---

## 3. Procedural mesh library — `/components/three/meshes/*`

Every shape is a React component returning JSX-Three. Each accepts `color`, `scale`, `roughness`, and any shape-specific params.

### 3.1 `<Roller />` — paint roller
**Construction:**
- Sleeve: `CylinderGeometry(0.18, 0.18, 1.4, 64, 1, true)` with custom shader for soft fabric texture (procedural noise via `glsl-noise` snippet → roughness variation)
- End caps: two flat circles via `CircleGeometry`, plastic black material
- Frame: bent steel — `TubeGeometry` along a bezier curve through 5 control points (cage shape), `MeshStandardMaterial` with metalness 1.0, roughness 0.35
- Handle: `CapsuleGeometry(0.06, 0.18)` with wood-grain shader (procedural sin-based bands + fbm noise), warm omberbruin (#5E4632) base
- Group: `<group>` with all parts, exposes `paintLevel` prop (0–1) that drives a fragment shader on the sleeve to "wet" the surface — when paintLevel > 0, sleeve picks up the paint color with a roughness shift toward shiny

**Procedural detail trick**: instead of normal maps, use **vertex displacement** in the sleeve's vertex shader — slight radial wobble based on noise to suggest fabric weave. The sleeve becomes the most expensive mesh; budget ~3000 verts for it.

### 3.2 `<Brush />` — paint brush
**Construction:**
- Bristle bundle: `THREE.InstancedMesh` of 200 thin `CylinderGeometry` instances arranged in an oval cross-section, each tip slightly randomized for chaos. Use `frustumCulled = false`, render as a single drawcall
- Ferrule: `CylinderGeometry` open-ended, brushed metal shader (anisotropic highlight via custom material extending `MeshStandardMaterial`)
- Handle: tapered using a custom `LatheGeometry` from a 6-point profile, dark walnut shader (same wood approach as roller)
- Animation: bristle bundle accepts a `pressure` prop (0–1) that compresses the InstancedMesh y-scale and fans out the bottom row

### 3.3 `<PaintCan />` — paint can
**Construction:**
- Body: `CylinderGeometry(0.5, 0.5, 0.7, 48)` with brushed-metal shader (two-octave noise on roughness), galvanized steel look
- Lid: separate cylinder, slightly recessed, with a procedural ring detail
- Handle: a U-shaped wire via `TubeGeometry` along a bezier
- Label: a `RingGeometry` band wrapping the body, base color = the palette color it represents, with a custom shader drawing the Caveat-font color name procedurally (use `troika-three-text` if pure shader text proves too hard)
- Animation: `tilt` prop rotates the can, `pourLevel` (0–1) reveals a paint surface inside via a clipping plane

### 3.4 `<PaintDrip />` — drip
**Construction:**
- `LatheGeometry` from a teardrop profile (12 control points)
- Animated via vertex shader: time-driven elongation along Y axis, with noise on the lower bulb for surface tension wobble
- Material: high-clearcoat custom shader — `MeshPhysicalMaterial` with `clearcoat: 1.0`, `clearcoatRoughness: 0.05`, `transmission: 0.3` for that subsurface-translucent paint look

### 3.5 `<PaintSplash />` — splash
**Construction:**
- A `Points` cloud (~80 particles) + 6–10 elongated blob `Sphere` instances
- Particles use a custom point shader: each particle has a per-vertex `aSeed` attribute that drives a unique trajectory
- Splash radiates from origin; lifetime 1.2s, then fades. Driven by GSAP timeline, not autonomous

### 3.6 `<WallPanel />` — painted wall
**Construction:**
- Plane `(20, 12, 128, 64)` with a custom material:
  - Base: procedural plaster shader — multi-octave noise → bumpy displacement, soft subsurface tint
  - Paint layer: a second pass with a `paintMask` uniform (R channel mask of where paint has been applied), tied to a render target updated by the roller's contact point
  - "Wet" patches: roughness drops where mask is fresh, then eases back to matte over 2s

This is the **showcase shader of the demo**. Plan to spend 2–3 days on it. The wall is the hero — every other mesh paints onto it.

### 3.7 `<DripCanvas />` — pourable paint geometry
For the moment in §6.5 when a can pours: a `MeshLine` (from `meshline` package or custom `BufferGeometry` that grows over time) traces the pour arc, with the same physical-paint shader as `<PaintDrip />`.

---

## 4. Custom shader library — `/components/three/shaders/*`

Every custom material lives here as a `shaderMaterial` from drei (`drei.shaderMaterial`), which auto-creates a class extending `THREE.ShaderMaterial`.

### 4.1 `paintMaterial.glsl`
The flagship shader. Used on roller sleeves, drips, and the wall's paint layer.
- Inputs: `uColor`, `uRoughness`, `uWetness`, `uTime`, `uNoiseScale`
- Output: physically-plausible matte-to-glossy paint based on `uWetness`. Slight subsurface scatter using `step` and `smoothstep` faked SSS at fresnel angles
- ~120 lines of GLSL. Document inline.

### 4.2 `wallShader.glsl`
- Multi-octave plaster noise (3 octaves of FBM)
- Roughness varied by noise amplitude
- Mask layer for paint application (`uPaintMask` sampler2D from a render target)

### 4.3 `woodShader.glsl`
- Procedural wood grain (sine bands + fbm distortion)
- Warm tone control via `uWarmth`

### 4.4 `metalShader.glsl`
- Two-octave noise on roughness
- Optional anisotropic highlight (controlled by `uAnisotropy`)

### 4.5 `bristleShader.glsl`
- Per-instance color variation (`aSeed` → small hue shift)
- Tip transparency falloff

All shaders share a common `uniforms.glsl` chunk for `uTime`, `uResolution`, etc.

---

## 5. Lighting & post-processing

**Lights** (no HDRI, no environment map):
- Key: `directionalLight` from `(5, 8, 5)`, intensity `1.5`, soft shadow map (`PCFSoftShadowMap`, 1024×1024)
- Fill: `directionalLight` from `(-4, 2, -2)`, intensity `0.4`, no shadows, slightly warm tint (`#FFE7C2`)
- Rim: `directionalLight` from `(0, 4, -8)`, intensity `0.8`, slight cool tint (`#9DB5D9`)
- Ambient: very low `ambientLight` at `0.15` to avoid pure-black shadows
- Hemisphere optional, sky `#F2EDE2`, ground `#1F3F6E` at `0.2`

**Post-processing** (via `@react-three/postprocessing`):
- `Bloom` — threshold 0.85, intensity 0.4, scattering 0.7. Subtle, never blown out
- `SSAO` — radius 0.4, intensity 1.0. Crucial for procedural meshes; it's what makes vertex-displaced wall actually look 3D
- `Vignette` — darkness 0.3, offset 0.3
- `ChromaticAberration` — modulationOffset 0.0, offset (0.0008, 0.0008). Almost imperceptible, just enough to read as cinematic
- `ToneMapping` — `ACESFilmicToneMapping`, exposure 1.1
- `Noise` — premultiply: false, opacity 0.04. The film grain over everything

These six effects together **are** the cinematic signature. They cost 4–6ms/frame combined on M1, ~12ms on mid-range mobile. Budget accordingly.

---

## 6. Per-section choreography

### §6.1 Hero
- Camera at `(0, 0, 6)`, looking at origin
- `<WallPanel />` fills the frame, plaster-only (paint mask empty)
- Off-screen-right: `<Roller />` pre-loaded with Delft Blue paint
- On scroll progress 0 → 0.4: roller sweeps diagonally across, contact point updates `uPaintMask` via render target. Wall fills with Delft Blue from top-left to bottom-right
- Headline DOM text (`z-10` over Canvas) fades in inside the painted region using a CSS `mask-image` synced to the same scroll progress
- Drips (`<PaintDrip />`) spawn at 3 random points along the painted edge, stretch then ease back

### §6.2 Services
- Camera tweens to `(0, -10, 8)` and rotates 15° downward (overhead-ish)
- 6 floating `<PaintCan />` instances arranged in a 3×2 grid, each with a different palette color
- Cans gently bob via a sine-time on Y position (offset per index)
- Service DOM cards sit beside each can in DOM space; CSS connects them visually with a thin painted line drawn between can-position and card-edge (line is SVG in DOM, can position projected from world space via `useThree(({camera}) => camera.project(canPosition))`)

### §6.3 Process — the pinned showcase
- This is the demo's centerpiece. Camera pins at `(0, -25, 5)`
- Single massive `<WallPanel />` with 4 distinct paint zones (one per stage: Inspectie → Voorbereiding → Schilderen → Oplevering)
- A single roller, controlled by scroll progress 0 → 1, traces a path across the wall, leaving each stage's color behind it
- Wall's `uPaintMask` accumulates — it's a multi-layer composition by the time scroll completes
- Stage labels (DOM, `z-10`) fade in/out at scroll thresholds 0/0.25/0.5/0.75

### §6.4 Portfolio
- Camera moves to `(0, -40, 7)`
- 6 `<PaintSplash />` instances pre-positioned in a hex grid, frozen at lifetime 0
- On scroll-into-view per item: GSAP timeline animates each splash through its lifetime, revealing a project image (DOM, `z-10`) inside the splash's clipping mask

### §6.5 Palette
- Camera dollies to `(0, -55, 4)` close-up
- 6 `<PaintCan />` arranged horizontally on a virtual shelf
- Hover (raycast via `useThree`): the hovered can lifts slightly + tilts toward camera
- Click: triggers can pour animation (`pourLevel` 0→1 over 0.6s) → spawn a `<DripCanvas />` arcing toward camera → on contact, full-screen CSS overlay sweeps the new accent color across the site (via CSS variable swap on `:root`)

### §6.6 Testimonials
- Camera at `(0, -65, 6)`
- Three `<WallPanel />` segments stacked at angles (like leaves of a folding screen)
- Each panel has a fully-painted texture in a different palette color
- DOM testimonial cards ride on the panel surfaces via CSS 3D transform sync'd to the panels' world-to-screen projection

### §6.7 Contact
- Camera at `(0, -75, 5)`, looking at a single fully-painted dark wall
- A `<Brush />` rests on a small ledge in front of the wall; on form submit, brush lifts off the ledge and paints a "Bedankt" word across the wall procedurally (each letter is a series of stroke segments, drawn via shader signed-distance-field text)

---

## 7. Performance budget

Hard targets (Lighthouse mobile):
- Performance ≥ 75
- LCP ≤ 3.0s
- CLS < 0.05
- JS first-load ≤ 350KB gzipped (Three.js + R3F + drei + postprocessing core)

Strategies:
- **DPR clamp**: `<Canvas dpr={[1, 1.5]}>` — never render at native retina (waste); 1.5 is the visual sweet spot
- **Frame on demand** in dev only via `frameloop="demand"`; keep `"always"` in prod for animation
- **Suspense boundaries** per stage so off-screen meshes don't allocate vertex buffers until camera approaches
- **Conditional postprocessing**: SSAO + Bloom only on desktop (`window.matchMedia('(min-width: 768px)')`); mobile gets just ToneMapping + Vignette
- **Reduced-motion**: replace the entire Canvas with a static painted-wall hero image (rendered once on the server via a build-time script that renders the scene to PNG via headless three). All motion stops.
- **Memoize geometry**: every shape uses `useMemo` to build geometry once. No per-frame BufferGeometry rebuilds anywhere.
- **Single InstancedMesh per repeated mesh** — bristles, drips during splash, paint particles all share one drawcall

---

## 8. Sandbox additions

Extend `/sandbox` with a 3D section showing each procedural mesh in isolation:
- Mini Canvas per mesh (300×300, OrbitControls in dev)
- Three states each: `idle` (no animation), `animating` (loop), `reduced-motion` (static frame)
- Live `leva` controls in dev: paint level, color, scale, wetness — for visual tuning during build

---

## 9. Phased delivery

**Phase 2.0** — Three.js scaffolding
- Install deps, set up root `<Canvas>` in layout, wire Lenis → camera scroll
- Build single empty `<Scene />` that responds to scroll
- Add ToneMapping + Vignette (cheapest pp) + lights
- Deploy preview

**Phase 2.1** — wall + roller (~2 days)
- `<WallPanel />` with full plaster shader + paint mask layer
- `<Roller />` with sleeve, frame, handle, paint shader
- Hero scene: roller paints wall on scroll. Should already feel premium.
- Deploy preview

**Phase 2.2** — paint can + brush + drip (~2 days)
- All three meshes built, dropped into sandbox
- Paint can pour animation working in isolation
- Drip elongation with paint shader

**Phase 2.3** — splash + post-processing (~1 day)
- `<PaintSplash />` particle system
- Add Bloom + SSAO + ChromaticAberration + Noise
- Sandbox shows full visual signature

**Phase 2.4** — section choreography (~3-4 days)
- Wire all 7 sections to scene stages
- Camera scroll choreography per §6
- DOM-WebGL projection sync

**Phase 2.5** — palette switcher live (~1-2 days)
- Hover + click raycasting
- Pour → drip → CSS variable swap
- Reduced-motion fallback

**Phase 2.6** — performance pass
- Mobile testing, conditional pp, dpr tuning
- Static reduced-motion render fallback

After each sub-phase: preview URL + 1-min video clip + Lighthouse mobile + any divergence notes. Wait for "go" between sub-phases.

---

## 10. Things that do NOT belong in Phase 2

- Asset imports of any kind (.glb, .gltf, .fbx, .obj)
- HDRI files, equirect environment maps
- External textures (.jpg, .png from third parties — internal generated noise textures via `THREE.DataTexture` are fine)
- Any reference to Sketchfab, Fab, Polyhaven, Quaternius, Poly Pizza
- "TODO: replace with real model" comments

If any of these creep in, we've drifted from the brief. Push back, don't accept.

---

## 11. What success looks like

A reviewer scrolls the live URL and reaches the bottom thinking:
- "This entire thing is built from code. No assets."
- "The wall paint shader alone is portfolio-worthy."
- "Cinematic feel without a single megabyte of texture."
- "Probably the best procedural 3D site I've seen this year."

If we're not aiming for that, we're aiming wrong.
