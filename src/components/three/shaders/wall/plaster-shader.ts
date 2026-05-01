import * as THREE from 'three';
import { SIMPLEX_2D_GLSL } from '../glsl/simplex2d.glsl';

/**
 * Plaster shader — extends MeshStandardMaterial via onBeforeCompile so the
 * wall keeps Three's full PBR pipeline (key + fill + rim directionals,
 * shadows, ACES tonemap, hemisphere) and we only inject what's custom:
 *
 *  Vertex side
 *  -----------
 *  - 3-octave FBM of 2D simplex noise on the plane's UV
 *  - Each octave: amplitude *= 0.5, frequency *= 2.0
 *  - Output scaled to ~[-0.5, 0.5]
 *  - Displace each vertex along its normal by `fbm(uv) * uPlasterDepth`
 *  - Pass the height to fragment as vDisplacement and the UV as vWallUv
 *
 *  Fragment side
 *  -------------
 *  - Tint diffuseColor by 0.92 + vDisplacement * 0.18  (low spots = darker)
 *  - Roughness left at MeshStandardMaterial default (this shader is
 *    plaster-only; the paint mask layer overrides roughness in the next
 *    commit)
 *
 *  Why 3 octaves and not more
 *  --------------------------
 *  Each octave is a snoise() call (~25 ops). 3 gives the rough+fine surface
 *  variation that reads as plaster; a 4th costs another ~25 ops per pixel
 *  for diminishing visual return. 128x64 plane subdivisions = 8,256 vertex
 *  shader runs per frame, well within budget on M1.
 */

export interface PlasterUniforms {
  uPlasterColor: { value: THREE.Color };
  uPlasterDepth: { value: number };
}

export interface CreatePlasterMaterialOptions {
  plasterColor?: string;
  /** Max vertex displacement in world units (default 0.04 = 4cm). */
  plasterDepth?: number;
}

export function createPlasterMaterial({
  plasterColor = '#F2EDE2',
  plasterDepth = 0.04
}: CreatePlasterMaterialOptions = {}): THREE.MeshStandardMaterial & {
  userData: { uniforms: PlasterUniforms };
} {
  const uniforms: PlasterUniforms = {
    uPlasterColor: { value: new THREE.Color(plasterColor) },
    uPlasterDepth: { value: plasterDepth }
  };

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // overridden in shader
    roughness: 0.92,
    metalness: 0.0
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    // ── Vertex ──────────────────────────────────────────────────────────
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        ${SIMPLEX_2D_GLSL}

        uniform float uPlasterDepth;
        varying float vDisplacement;
        varying vec2  vWallUv;

        // 3-octave fractional Brownian motion.
        // amp=1,freq=4 -> amp=0.5,freq=8 -> amp=0.25,freq=16
        // sum range ≈ [-1.75, 1.75], scaled to ≈ [-0.5, 0.5]
        float plasterFbm(vec2 uv) {
          float total = 0.0;
          float amp = 1.0;
          float freq = 4.0;
          for (int i = 0; i < 3; i++) {
            total += snoise(uv * freq) * amp;
            amp *= 0.5;
            freq *= 2.0;
          }
          return total * 0.286; // 1.0 / (1 + 0.5 + 0.25) ≈ 0.286
        }
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        float _plasterH = plasterFbm(uv);
        vDisplacement = _plasterH;
        vWallUv = uv;
        transformed += normal * _plasterH * uPlasterDepth;
        `
      );

    // ── Fragment ────────────────────────────────────────────────────────
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform vec3 uPlasterColor;
        varying float vDisplacement;
        varying vec2  vWallUv;
        `
      )
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        #include <map_fragment>
        // Plaster base: tint the diffuse with displacement-driven brightness.
        // Low spots (negative displacement) read slightly darker, like real
        // plaster catching less light. 0.18 is the sweet spot between
        // visible and overwrought.
        float _plasterTint = 0.92 + vDisplacement * 0.18;
        diffuseColor.rgb = uPlasterColor * _plasterTint;
        `
      );
  };

  material.userData.uniforms = uniforms;
  return material as THREE.MeshStandardMaterial & {
    userData: { uniforms: PlasterUniforms };
  };
}
