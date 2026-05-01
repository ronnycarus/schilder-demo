import * as THREE from 'three';
import { SIMPLEX_2D_GLSL } from '../glsl/simplex2d.glsl';

/**
 * Plaster + paint shader — extends MeshStandardMaterial via onBeforeCompile
 * so the wall keeps Three's full PBR pipeline (key + fill + rim directionals,
 * shadows, ACES tonemap, hemisphere) and we only inject what's custom.
 *
 *  Vertex side
 *  -----------
 *  - 3-octave FBM of 2D simplex noise on the plane's UV
 *  - Each octave: amplitude *= 0.5, frequency *= 2.0
 *  - Output scaled to ~[-0.5, 0.5]
 *  - Displace each vertex along its normal by `fbm(uv) * uPlasterDepth`
 *  - Pass the height to fragment as vDisplacement and the UV as vWallUv
 *
 *  Fragment side (paint-aware as of commit 2)
 *  ------------------------------------------
 *  - Sample uPaintMask at vWallUv; .r is the accumulated paint amount [0..1]
 *  - Plaster base: uPlasterColor tinted by 0.92 + vDisplacement * 0.18
 *  - Mix toward uPaintColor by paintAmount → diffuseColor
 *  - Roughness drops from 0.92 (matte plaster) to 0.42 (semi-gloss paint)
 *    proportional to paintAmount → freshly painted areas catch a soft
 *    specular highlight; dry plaster stays flat
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
  uPaintMask: { value: THREE.Texture | null };
  uPaintColor: { value: THREE.Color };
}

export interface CreatePlasterMaterialOptions {
  plasterColor?: string;
  /** Max vertex displacement in world units (default 0.04 = 4cm). */
  plasterDepth?: number;
  paintColor?: string;
  paintMask?: THREE.Texture | null;
}

export function createPlasterMaterial({
  plasterColor = '#F2EDE2',
  plasterDepth = 0.04,
  paintColor = '#1F3F6E',
  paintMask = null
}: CreatePlasterMaterialOptions = {}): THREE.MeshStandardMaterial & {
  userData: { uniforms: PlasterUniforms };
} {
  const uniforms: PlasterUniforms = {
    uPlasterColor: { value: new THREE.Color(plasterColor) },
    uPlasterDepth: { value: plasterDepth },
    uPaintMask: { value: paintMask },
    uPaintColor: { value: new THREE.Color(paintColor) }
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
        uniform vec3 uPaintColor;
        uniform sampler2D uPaintMask;
        varying float vDisplacement;
        varying vec2  vWallUv;
        `
      )
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        #include <map_fragment>
        // Sample the accumulated paint mask. .r is the paint coverage.
        vec4 _maskSample = texture2D(uPaintMask, vWallUv);
        float _paintAmount = clamp(_maskSample.r, 0.0, 1.0);

        // Plaster base: tint diffuse by displacement-driven brightness.
        float _plasterTint = 0.92 + vDisplacement * 0.18;
        vec3 _plaster = uPlasterColor * _plasterTint;

        diffuseColor.rgb = mix(_plaster, uPaintColor, _paintAmount);
        `
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `
        #include <roughnessmap_fragment>
        // Painted areas are slightly glossier than dry plaster.
        // 0.92 (matte) -> 0.42 (semi-gloss) is enough range for the key
        // light to pick up a subtle highlight on fresh paint without
        // reading as wet enamel.
        vec4 _maskRough = texture2D(uPaintMask, vWallUv);
        roughnessFactor = mix(0.92, 0.42, clamp(_maskRough.r, 0.0, 1.0));
        `
      );
  };

  material.userData.uniforms = uniforms;
  return material as THREE.MeshStandardMaterial & {
    userData: { uniforms: PlasterUniforms };
  };
}
