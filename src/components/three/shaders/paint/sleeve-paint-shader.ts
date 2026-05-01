import * as THREE from 'three';
import { SIMPLEX_2D_GLSL } from '../glsl/simplex2d.glsl';

/**
 * Sleeve paint shader — extends MeshStandardMaterial via onBeforeCompile so
 * the roller sleeve participates in the full PBR + shadow + tonemap pipeline,
 * and we only inject:
 *
 *  Vertex
 *  ------
 *  - Subtle radial wobble: snoise(uv * (8, 24)) * uWobbleAmplitude, displaced
 *    along the existing normal. Default cylinder normals point radially
 *    outward, so this perturbs the side surface in/out by ~5–6mm at peak.
 *    The asymmetric frequency (lower in u, higher in v) gives a cross-hatch
 *    pattern that reads as fabric weave once specular hits the surface.
 *  - 64 radial segments + 1 height segment = 130 verts; the wobble cost is
 *    negligible.
 *
 *  Fragment
 *  --------
 *  - Dry sleeve: uFabricColor with fine high-frequency noise modulation so
 *    it doesn't read as flat plastic
 *  - Mix toward uPaintColor by uPaintLevel (0..1)
 *  - Roughness 0.95 (dry/matte) → 0.40 (wet/semi-gloss) at uPaintLevel 1
 *
 *  Why not vertex displacement instead of normal maps
 *  --------------------------------------------------
 *  Spec §3.1 explicitly: "instead of normal maps, use vertex displacement in
 *  the sleeve's vertex shader". Normal maps would imply a texture asset; we
 *  generate the surface variation procedurally so there's nothing to ship.
 */

export interface SleevePaintUniforms {
  uPaintColor: { value: THREE.Color };
  uPaintLevel: { value: number };
  uFabricColor: { value: THREE.Color };
  uWobbleAmplitude: { value: number };
}

export interface CreateSleevePaintMaterialOptions {
  paintColor?: string;
  paintLevel?: number;
  fabricColor?: string;
  /** Radial wobble amplitude in world units. Default 0.006 (~6mm). */
  wobbleAmplitude?: number;
}

export function createSleevePaintMaterial({
  paintColor = '#1F3F6E',
  paintLevel = 0,
  fabricColor = '#9CA0A6',
  wobbleAmplitude = 0.006
}: CreateSleevePaintMaterialOptions = {}): THREE.MeshStandardMaterial & {
  userData: { uniforms: SleevePaintUniforms };
} {
  const uniforms: SleevePaintUniforms = {
    uPaintColor: { value: new THREE.Color(paintColor) },
    uPaintLevel: { value: paintLevel },
    uFabricColor: { value: new THREE.Color(fabricColor) },
    uWobbleAmplitude: { value: wobbleAmplitude }
  };

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
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
        uniform float uWobbleAmplitude;
        varying vec2 vSleeveUv;
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        vSleeveUv = uv;
        // Asymmetric frequency: 8 along width (u), 24 along length (v).
        // Reads as a tight cross-hatch fabric weave.
        float _sleeveWobble = snoise(vec2(uv.x * 8.0, uv.y * 24.0)) * uWobbleAmplitude;
        transformed += normal * _sleeveWobble;
        `
      );

    // ── Fragment ────────────────────────────────────────────────────────
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        ${SIMPLEX_2D_GLSL}
        uniform vec3 uPaintColor;
        uniform vec3 uFabricColor;
        uniform float uPaintLevel;
        varying vec2 vSleeveUv;
        `
      )
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        #include <map_fragment>
        // Dry fabric: high-frequency noise modulation to break up flatness.
        float _fabricN = snoise(vSleeveUv * vec2(60.0, 18.0)) * 0.5 + 0.5;
        vec3 _fabric = mix(uFabricColor * 0.85, uFabricColor * 1.05, _fabricN);
        diffuseColor.rgb = mix(_fabric, uPaintColor, clamp(uPaintLevel, 0.0, 1.0));
        `
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `
        #include <roughnessmap_fragment>
        // 0.95 (matte fabric) → 0.40 (wet paint). Enough range that the
        // key light picks up a soft highlight on the painted sleeve
        // without reading as glossy plastic.
        roughnessFactor = mix(0.95, 0.40, clamp(uPaintLevel, 0.0, 1.0));
        `
      );
  };

  material.userData.uniforms = uniforms;
  return material as THREE.MeshStandardMaterial & {
    userData: { uniforms: SleevePaintUniforms };
  };
}
