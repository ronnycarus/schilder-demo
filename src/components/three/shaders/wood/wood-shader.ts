import * as THREE from 'three';
import { SIMPLEX_2D_GLSL } from '../glsl/simplex2d.glsl';

/**
 * Wood shader — extends MeshStandardMaterial via onBeforeCompile.
 *
 *  Vertex
 *  ------
 *  Pass local position through to fragment so we can compute the grain
 *  pattern in object space. (UV-based wood would be wrong on a capsule —
 *  the cap-to-cylinder transition would show seams.)
 *
 *  Fragment
 *  --------
 *  Sin-based bands along the long axis (local Y for default-orientation
 *  capsules), distorted by 3-octave FBM so the rings waver organically:
 *    distort = fbm(localXY * 4) * 0.4
 *    band    = sin(y * uGrainFreq + distort * 8)
 *    band    = smoothstep(-0.3, 0.3, band)
 *    color   = mix(darkWood, lightWood, band)
 *
 *  The smoothstep gives soft band edges; without it the pattern reads as
 *  hard zebra stripes. distort * 8 is the trick that bends the rings —
 *  doubling that multiplier makes the wood look knotty, halving it makes
 *  it read as straight-grain dowel. 8 is the dial for "turned wood handle."
 */

export interface WoodUniforms {
  uLightWood: { value: THREE.Color };
  uDarkWood: { value: THREE.Color };
  uGrainFreq: { value: number };
}

export interface CreateWoodMaterialOptions {
  lightWood?: string;
  darkWood?: string;
  /** Band frequency along the long axis. Default 30. */
  grainFreq?: number;
}

export function createWoodMaterial({
  lightWood = '#7A5A3F',
  darkWood = '#3F2D1F',
  grainFreq = 30.0
}: CreateWoodMaterialOptions = {}): THREE.MeshStandardMaterial & {
  userData: { uniforms: WoodUniforms };
} {
  const uniforms: WoodUniforms = {
    uLightWood: { value: new THREE.Color(lightWood) },
    uDarkWood: { value: new THREE.Color(darkWood) },
    uGrainFreq: { value: grainFreq }
  };

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.0
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        varying vec3 vWoodPos;
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        vWoodPos = position;
        `
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        ${SIMPLEX_2D_GLSL}
        uniform vec3 uLightWood;
        uniform vec3 uDarkWood;
        uniform float uGrainFreq;
        varying vec3 vWoodPos;

        float woodFbm(vec2 p) {
          float total = 0.0;
          float amp = 1.0;
          float freq = 1.0;
          for (int i = 0; i < 3; i++) {
            total += snoise(p * freq) * amp;
            amp *= 0.5;
            freq *= 2.0;
          }
          return total;
        }
        `
      )
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        #include <map_fragment>
        vec2 _wp = vWoodPos.xy;
        float _distort = woodFbm(_wp * 4.0) * 0.4;
        float _band = sin(vWoodPos.y * uGrainFreq + _distort * 8.0);
        _band = smoothstep(-0.3, 0.3, _band);
        diffuseColor.rgb = mix(uDarkWood, uLightWood, _band);
        `
      );
  };

  material.userData.uniforms = uniforms;
  return material as THREE.MeshStandardMaterial & {
    userData: { uniforms: WoodUniforms };
  };
}
