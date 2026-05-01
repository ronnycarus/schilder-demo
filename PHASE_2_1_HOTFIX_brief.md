# Phase 2.1 hotfix — fix the hero before adding more meshes

> **Mission**: Phase 2.1 is committed and deployed but it ships with serious visual bugs. The wall reads gray, the plaster has no texture, the roller floats mid-air at the wrong scale, the headline mask is broken, and no paint trail appears when scrolling. Fix all six issues below and redeploy. **Phase 2.2 is paused until this passes QA.**
>
> User QA evidence (3 screenshots described to you in chat): at scroll=0 the entire viewport reads as gray with vertical streaking artifacts and the headline already shows the letter "S"; mid-scroll the Plaster White appears but the wall has no visible texture, the roller is tiny and floating, no paint trail; at post-scroll same flat wall, headline cropped to "Stu" mid-mask.

---

## 0. Working agreement for this hotfix

- **Don't rebuild from scratch.** All six issues are in existing files. Diagnose, edit in place, commit each fix separately so we can bisect.
- **Don't add new meshes, new shaders, new effects.** The fix list is the scope. If you find a 7th issue while debugging the listed six, flag it but don't fix it without my approval.
- **Don't widen the patch.** "While I was in there" refactors get rejected. Minimum diff.
- **Verify visually after each fix.** You can't render screenshots in your environment, but you CAN write a quick test page (`/sandbox/hero-debug`) that renders the hero scene at a fixed scroll position with debug overlays. Use it.
- **Build green between every commit.** No "I'll fix the type errors at the end."

---

## 1. The six bugs, ordered by dependency

Fix in order — bugs 1–2 are environmental and will mask 3–6 if left in place.

### Bug 1 — Wall reads as gray instead of Plaster White at scroll=0

**Symptom**: At page load, the entire viewport is mid-gray (~#888) with what look like motion-blur streaks. Plaster White (#F2EDE2) only appears AFTER the user scrolls past the hero stage. The body's CSS `background-color: var(--color-canvas)` is fine elsewhere — the gray only appears where the WebGL canvas overlaps the visible area.

**Likely root causes** (investigate in order):
1. The `<Canvas alpha={true}>` setting may not be propagating; if alpha is false, the renderer clears each frame to its `clearColor` (default 0x000000 with the renderer's own tonemapping applied → mid-gray after Vignette). Confirm `gl={{ alpha: true }}` actually produces a transparent background by temporarily setting `<div style={{ background: 'red' }}>` behind the Canvas.
2. The Vignette post-fx pass (`darkness: 0.3, offset: 0.3`) may be applying to transparent pixels too, darkening the body's Plaster White into gray. Vignette in `postprocessing` operates on the framebuffer; if alpha is being multiplied incorrectly, the canvas pixels read as `mix(transparent, dark, vignette)` and result in gray. Test: temporarily disable Vignette and reload.
3. ACES Filmic ToneMapping is being applied through the post-fx pass while the renderer ALSO has a default tonemap → double tonemapping. We previously set renderer to `NoToneMapping` to avoid this; verify `gl={{ toneMapping: THREE.NoToneMapping }}` is actually in effect at runtime (log `gl.toneMapping` in a `useEffect` inside the Canvas).

**Fix path**: Whichever cause is confirmed, the fix is one of:
- Force `<Canvas gl={{ alpha: true, toneMapping: THREE.NoToneMapping }} flat>` — `flat` skips internal tonemap.
- Move ToneMapping pass to render only the lit scene, not the transparent background. Use a `RenderPass` with `clearAlpha: 0`.
- Drop Vignette for now if it can't be made alpha-aware — we can re-introduce it as a CSS overlay (`radial-gradient` on a fixed pseudo-element) that doesn't touch the WebGL framebuffer. This is actually a cleaner architecture and worth doing.

Commit message: `fix(scene): wall background renders Plaster White (alpha-aware post-fx)`.

### Bug 2 — Vertical streaking / smear artifacts on the canvas

**Symptom**: At scroll=0, the canvas shows long vertical streaks/columns of varying gray, like the framebuffer was cleared with a gradient or like motion-blur is sampling history. We have no motion blur effect installed.

**Likely root causes**:
1. The render target for the paint mask is being read before it's ever written → uninitialized GPU memory. Check the WallPanel mount-time clear: are we calling `gl.clear(true, false, false)` with the render target bound? Add `gl.setClearColor(0x000000, 0); gl.setRenderTarget(rt); gl.clear(true, true, true); gl.setRenderTarget(null);` to be explicit.
2. The stamp scene's accumulating render target has `autoClear: false` per design (so stamps accumulate). But on first frame, before any stamps are written, the texture is whatever was there before — and on some GPUs that's pattern-noise from previous allocations. The mount-time clear must run BEFORE first frame.
3. The wall shader samples `uPaintMask` even when the mask is empty. Add a `uniform bool uHasPaint` that's false until first stamp; in fragment, skip the texture sample entirely when false.

**Fix path**: All three. Mount-time clear with `gl.clear(true, true, true)`, plus the `uHasPaint` guard, plus making sure the render target is RGBA cleared to `(0,0,0,0)`.

Commit message: `fix(wall): clear paint-mask render target before first frame, skip sample when empty`.

### Bug 3 — Wall has no visible plaster texture

**Symptom**: The wall reads as a flat gradient at every scroll position. The 3-octave FBM vertex displacement is not producing visible surface variation.

**Likely root causes** (probably all of them, simultaneously):
1. `uPlasterDepth: 0.04` (4cm) is too small at the current camera distance (z=6) and FOV (45°). At that distance, 4cm of displacement is roughly 1px of silhouette change. Raise to **0.15** (15cm), tested upper bound. Real plaster is ~2-5mm in displacement but procedural plaster needs amplification to read.
2. PlaneGeometry subdivisions `[128, 64]` may not be enough — the displacement is per-vertex, and at 8,256 vertices spread across 20×12 world units, each vertex is ~15cm apart. The FBM frequency `* 4 * 16 = 64` cycles across the wall, but with only 128 horizontal segments, we get severe undersampling. Raise to **[256, 160]** (41,000 verts; still cheap on M1).
3. Lighting is currently flat across the wall — the key light hits at ~30° but with no normal recalculation post-displacement, the shading still uses the original flat plane normals. THIS IS THE BIG ONE. After displacing vertices, the normals must be recomputed in the shader for the lighting to actually shade the bumps. Currently we displace `transformed` but never touch `vNormal`. Fix: recompute normals via finite differences in the vertex shader.

**Fix path**:
```glsl
// In plaster-shader.ts vertex section, after displacement:
float _h = plasterFbm(uv);
float _hX = plasterFbm(uv + vec2(0.001, 0.0));
float _hY = plasterFbm(uv + vec2(0.0, 0.001));
vec3 _displacedNormal = normalize(vec3(
  (_h - _hX) * uPlasterDepth * 1000.0,
  (_h - _hY) * uPlasterDepth * 1000.0,
  1.0
));
// Inject into the standard pipeline:
vNormal = normalMatrix * _displacedNormal;
```

Plus raise `uPlasterDepth` to 0.15 and subdivisions to [256, 160]. The combination is what makes the wall actually look like plaster instead of paper.

Commit message: `fix(wall): recompute normals after FBM displacement; raise depth and subdivisions`.

### Bug 4 — Roller is tiny and floating mid-air

**Symptom**: The roller appears as a small object hovering far from the wall, looking like a paint-tipped matchstick rather than a real roller painting a real wall.

**Two scale issues** to fix simultaneously:

**Scale ratio**: Current sleeve length 1.4 against wall height 12 = 11% of wall height. A real paint roller is ~25cm against a typical 2.4m wall = 10%. So the ratio is actually correct for the world geometry. The problem is **camera framing**, not roller size.

The hero camera is at z=6 looking at the wall at z=0 with FOV 45°. At z=6 the visible vertical span is `2 * 6 * tan(45°/2)` = ~5 world units. So we see roughly 40% of the 12-unit wall height — and the 1.4-unit roller fits in that view at ~28% of viewport height. That should LOOK fine.

But the screenshots show the roller at ~5% of viewport height. That means **the camera is much further away than z=6**, OR the world transform on the roller has a hidden scale factor, OR the roller geometry's actual rendered size doesn't match the constructor args.

**Fix path**:
1. Add a debug log inside `<Roller />` mount: `console.log('roller world position', group.getWorldPosition(new Vector3()), 'scale', group.scale)`. Verify it's `(0, hero.y, 0.18)` with scale `(1, 1, 1)`.
2. Verify camera with `console.log('camera position', camera.position, 'fov', camera.fov)`.
3. If both look correct but roller still looks small: the issue is the camera is at the **homepage scroll runway position**, not stage-hero. Lenis-driven camera Y might be moving the camera below the hero stage on first paint because the runway makes scroll progress already non-zero. Verify scroll=0 actually puts camera at y=0 (hero), not y=-5.
4. If camera is correct: the roller is correctly small relative to the wall, but the camera is looking at empty space. **Reduce camera z to 4** to bring the wall and roller fully into frame.

**Z-position issue**: Sleeve radius is 0.18, so the cylinder surface at the front is at z=0.18 (when the roller's transform is at z=0.18). But the wall is at z=0. So the sleeve is `0.18 - 0.18 = 0` — touching, technically. But because the cylinder's local Y axis is the sleeve length (vertical) and its local Z axis is depth, when we rotate the roller the contact point shifts.

Actually: the sleeve is at world (rollerX, rollerY, 0.18). Sleeve radius is 0.18. So the sleeve's most-forward surface (toward camera) is at z=0.36, and the most-rearward surface (toward wall) is at z=0.0. So the rear surface IS touching the wall plane. Correct.

But visually the roller looks "in front" of the wall, not "on" it, because:
- The roller is small enough that the gap from sleeve-front to wall is dominant
- There's no contact shadow at the touch point

**Fix path for visual contact**:
- Bring roller to z=0.05 (much closer; sleeve back will go INTO the wall by 0.13, but that's fine — the wall is opaque and the cylinder's back side won't render)
- Add a small `<ContactShadow />` from drei BELOW the roller's contact point, ~30% opacity, blur 1.5

Commit message: `fix(roller): camera framing + roller-on-wall contact (z proximity + contact shadow)`.

### Bug 5 — Headline mask is broken

**Symptom**: The `<ScrollDrivenMask>` wrapping the headline shows partial text ("Stu" instead of fully hidden or fully visible at appropriate scroll positions).

**Likely root cause**: The mask SVG is sized via `viewBox="0 0 200 100" preserveAspectRatio="none"`, but the headline's natural width is ~600px wide and ~120px tall. When the SVG is stretched to fit the headline's bounding box, the brush-stroke shape compresses horizontally and elongates vertically, producing partial coverage.

**Confirm via DevTools**: Inspect the wrapper element. Check:
- `mask-image` is set (data URL with the SVG path)
- `mask-size` shows a calc() with `--mp`
- `--mp` value at scroll=0 is `0`
- Visually, the mask shape covers the right area

**Fix path**:
1. Test with the simplest possible mask first — a solid black rect: `<svg viewBox='0 0 100 100'><rect width='100' height='100' fill='black'/></svg>` — and confirm the wrapper hides/shows correctly. If the rect mask works but the brush mask doesn't, it's a path geometry issue.
2. If the wrapper itself isn't sizing correctly: add `display: block; width: fit-content` to the wrapper so it shrink-wraps the headline rather than stretching to parent width.
3. If `--mp` isn't initializing to 0: the `useEffect` that sets `--mp: 0` runs after first paint. Add an inline `style={{ '--mp': 0 }}` to the wrapper div as a SSR-safe initial value.
4. Consider replacing the brush-stroke mask with a clean rectangle mask for the hero (the brush-edge effect is nice but causes the partial-letter bug). The brush shape can come back in Phase 2.6 polish.

Commit message: `fix(mask): headline reveals correctly from scroll=0; SSR-safe --mp init`.

### Bug 6 — No paint trail appears when roller moves

**Symptom**: Scrolling moves the roller across the wall, but the wall remains entirely Plaster White. No Delft Blue trail accumulates.

**Likely root causes** (investigate in order):

1. **UV projection is off**. The current code:
   ```ts
   const u = tmpVec.x / WALL_W + 0.5;
   const v = (tmpVec.y - STAGES.hero.y) / WALL_H + 0.5;
   ```
   `tmpVec.y - STAGES.hero.y` — fine, normalizes against wall center. But `WALL_W = 20` and `WALL_H = 12` are the wall's full dimensions; the formula maps roller world (-10, +10) X to UV (0, 1). The roller path is `ROLLER_START.x = -8` to `ROLLER_END.x = +8`, so u goes from `(-8/20)+0.5=0.1` to `(8/20)+0.5=0.9`. That's correct.
   
   Y projection: `ROLLER_START.y = hero.y + 3 = 3`, end `hero.y - 3 = -3`. So `(3 - 0)/12 + 0.5 = 0.75` to `(-3 - 0)/12 + 0.5 = 0.25`. Also correct.
   
   So the projection is RIGHT. The bug is elsewhere.

2. **Stamp size too small**. `stampSize: [0.025, 0.13]` in UV space at 1024×512 mask resolution = 25.6 × 66.6 pixels. That's visible. But the stamp shader uses `smoothstep(0.55, 0.05, length(d * vec2(2.0, 0.7)))` where `d = vUv - 0.5`. The length at edges is `length(0.5 * vec2(2.0, 0.7)) = length(vec2(1.0, 0.35)) = 1.06`. The smoothstep range is `(0.55, 0.05)` — both well below 1.06. So the **entire stamp falls outside the smoothstep range and outputs 0**. THAT'S THE BUG.

   Fix: the smoothstep must use a range that encompasses the stamp's UV extent. Change to `smoothstep(1.0, 0.0, r)` (full stamp opacity at center, falling off to edge), and verify by sampling the stamp shader output directly into a debug texture.

3. **Render target not being read by wall material**. The `uPaintMask` uniform is set at material creation time. If the render target's `.texture` reference changes (e.g., resize), the uniform points to a stale texture. Verify the texture object identity is stable across the lifetime of the component.

4. **Material recompilation losing the uniform**. `onBeforeCompile` injects uniforms via `Object.assign(shader.uniforms, uniforms)`. If Three rebuilds the shader (which it does on certain prop changes), the injected uniforms might be lost. Verify by logging `material.uniforms` after first render and confirming `uPaintMask` is present and points to the live texture.

**Add a debug overlay to verify**: Render the paint-mask render target's texture as a 2D inset in the bottom-right corner of the canvas (using a fullscreen ortho quad or a flat plane in the corner of view). This will show you whether stamps are landing or not, completely independent of whether the wall shader is reading them.

Commit message: `fix(wall): stamp shader range covers full stamp + debug mask overlay`.

After confirming stamps land correctly: a separate commit removes the debug overlay before merge: `chore(wall): remove paint-mask debug overlay`.

---

## 2. Verification plan

After all six commits, run a smoke test on the new deploy:

1. **Hard refresh** the live URL with cache disabled.
2. **Scroll = 0**: confirm Plaster White wall fills the frame, plaster texture is visible (raking light shows bumps), roller is properly sized and visibly touching the wall in the upper-left, headline is **fully hidden**.
3. **Slow scroll to ~25%**: roller halfway across, Delft Blue paint trail clearly visible behind it on the wall, headline ~50% revealed left-to-right.
4. **Scroll to ~40%**: roller exiting lower-right, full diagonal paint stripe on the wall, headline 100% visible.
5. **Scroll past hero**: scene exits frame as camera descends.

If any of those checkpoints fail, name the bug, link the commit, redo.

---

## 3. Things to leave alone in this hotfix

- Sleeve perpendicular-to-motion rotation (Phase 2.6 polish)
- Full wall coverage (Phase 2.6 polish)  
- Stamp orientation rotating with motion (Phase 2.6 polish)
- Drips spawning at painted edges (Phase 2.2)
- Paint level draining over the sweep (Phase 2.5)
- The Phase 1 SVG primitives (separate workstream)
- Any new mesh, shader, or post-fx effect

These are all noted but not in scope. Do not touch.

---

## 4. Final report format

Post after the new deploy:

- Live preview URL
- Six fix commits in chronological order with one-line summary each
- For each bug: "Root cause was X. Fix was Y. Verified by Z."
- Any divergences from this brief, with reasoning

Then stop and wait for QA before Phase 2.2.

---

## 5. If a bug turns out to be unsolvable in this scope

Don't paper over it. Tell me. Show me the code, what you tried, what didn't work. We'll decide together whether to descope, escalate, or change approach.

The honest answer "I can't get the wall normals to recompute correctly without breaking the shadow pipeline" is more useful than a hidden hack that breaks Phase 2.2.
