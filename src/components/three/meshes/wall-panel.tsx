'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createPlasterMaterial } from '../shaders/wall/plaster-shader';

export interface WallPanelHandle {
  /**
   * Stamp paint into the mask render target at a wall-UV coordinate.
   * u, v are 0..1 across the plane; intensity is 0..1 (additive contribution
   * per call). The actual material rebinds happen each useFrame, so calling
   * paintAt during a useFrame on another component is safe.
   */
  paintAt: (u: number, v: number, intensity?: number) => void;
}

export interface WallPanelProps {
  size?: [number, number];
  subdivisions?: [number, number];
  plasterColor?: string;
  paintColor?: string;
  plasterDepth?: number;
  position?: [number, number, number];
  /** Render-target resolution. Default [1024, 512] (matches the 20:12 wall). */
  maskResolution?: [number, number];
  /** Width/height in UV space of each paint stamp. Default [0.025, 0.13]. */
  stampSize?: [number, number];
}

const STAMP_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STAMP_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform float uIntensity;
  void main() {
    // Soft-edge stamp: oval falloff with smoothstep so accumulated stamps
    // blend without hard edges. R-channel = paint amount (sampled in the
    // wall shader); A-channel matches so AdditiveBlending works as expected.
    vec2 d = vUv - 0.5;
    float r = length(d * vec2(2.0, 0.7));
    float a = smoothstep(0.55, 0.05, r) * uIntensity;
    gl_FragColor = vec4(a, 0.0, 0.0, a);
  }
`;

/**
 * WallPanel — plaster wall with an additive paint-mask render target.
 *
 *   1. The wall shader (plaster-shader.ts) samples uPaintMask.r to mix paint
 *      over plaster and to drop roughness on painted areas.
 *   2. uPaintMask is bound to a WebGLRenderTarget owned by this component.
 *   3. Each frame, any calls to paintAt() since the previous frame stamp into
 *      that render target via a tiny secondary scene with an orthographic
 *      camera in UV space (0..1 on each axis). Stamps blend additively, so
 *      repeated calls at the same UV saturate toward 1.0 = fully painted.
 *
 * The render target is RGBA UnsignedByte to keep mobile compat. We only ever
 * read the R channel; the rest is wasted but it costs ~2MB at 1024x512 which
 * is fine. R-only formats (RED) require WebGL2 + extension dance and aren't
 * worth the complexity.
 */
export const WallPanel = forwardRef<WallPanelHandle, WallPanelProps>(
  (
    {
      size = [20, 12],
      subdivisions = [256, 160],
      plasterColor = '#F2EDE2',
      paintColor = '#1F3F6E',
      plasterDepth = 0.15,
      position = [0, 0, 0],
      maskResolution = [1024, 512],
      stampSize = [0.025, 0.13]
    },
    ref
  ) => {
    const { gl } = useThree();
    const pendingStampsRef = useRef<{ u: number; v: number; intensity: number }[]>([]);

    // Render target: holds the accumulating paint mask.
    const renderTarget = useMemo(() => {
      const rt = new THREE.WebGLRenderTarget(maskResolution[0], maskResolution[1], {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false
      });
      rt.texture.wrapS = THREE.ClampToEdgeWrapping;
      rt.texture.wrapT = THREE.ClampToEdgeWrapping;
      return rt;
    }, [maskResolution]);

    // Stamp scene: a 1×1 orthographic-camera scene we keep adding stamps into.
    const stampScene = useMemo(() => new THREE.Scene(), []);
    const stampCamera = useMemo(
      () => new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1),
      []
    );

    // The stamp mesh is reused — one PlaneGeometry, one ShaderMaterial, we
    // just re-position and re-render it for each pending stamp.
    const stampMesh = useMemo(() => {
      const geom = new THREE.PlaneGeometry(stampSize[0], stampSize[1]);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        uniforms: { uIntensity: { value: 0.5 } },
        vertexShader: STAMP_VERTEX,
        fragmentShader: STAMP_FRAGMENT
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.frustumCulled = false;
      return mesh;
    }, [stampSize]);

    const geometry = useMemo(
      () => new THREE.PlaneGeometry(size[0], size[1], subdivisions[0], subdivisions[1]),
      [size, subdivisions]
    );

    const material = useMemo(
      () =>
        createPlasterMaterial({
          plasterColor,
          plasterDepth,
          paintColor,
          paintMask: renderTarget.texture
        }),
      [plasterColor, plasterDepth, paintColor, renderTarget.texture]
    );

    // Clear the mask on mount so we don't inherit GPU memory garbage.
    // useLayoutEffect (not useEffect) so the clear runs synchronously after
    // commit, before the browser's next paint and before R3F's first rAF
    // tick — guarantees the wall shader never sees uninitialized memory.
    // Clears all three buffers (true, true, true) for belt-and-suspenders
    // even though the RT has no depth/stencil buffers attached.
    useEffect(() => {
      const prevTarget = gl.getRenderTarget();
      const prevClearColor = new THREE.Color();
      gl.getClearColor(prevClearColor);
      const prevClearAlpha = gl.getClearAlpha();
      gl.setRenderTarget(renderTarget);
      gl.setClearColor(0x000000, 0);
      gl.clear(true, true, true);
      gl.setRenderTarget(prevTarget);
      gl.setClearColor(prevClearColor, prevClearAlpha);
    }, [gl, renderTarget]);

    useImperativeHandle(
      ref,
      () => ({
        paintAt(u: number, v: number, intensity = 0.5) {
          pendingStampsRef.current.push({ u, v, intensity });
          // Flip the gate on so the wall shader starts sampling the mask.
          // Idempotent — setting to true repeatedly is free.
          const u_ = (material as { userData: { uniforms: { uHasPaint: { value: boolean } } } })
            .userData.uniforms.uHasPaint;
          if (!u_.value) u_.value = true;
        }
      }),
      [material]
    );

    // Apply queued stamps to the render target each frame. Priority 1 so
    // this fires AFTER HeroStage's priority-0 useFrame writes its stamp
    // for the current frame — no one-frame lag.
    useFrame(({ gl: glx }) => {
      if (pendingStampsRef.current.length === 0) return;

      const prevTarget = glx.getRenderTarget();
      const prevAutoClear = glx.autoClear;
      glx.autoClear = false; // additive: preserve previous frames' paint
      glx.setRenderTarget(renderTarget);

      for (const { u, v, intensity } of pendingStampsRef.current) {
        stampMesh.position.set(u, v, 0);
        (stampMesh.material as THREE.ShaderMaterial).uniforms.uIntensity.value =
          intensity;
        stampScene.add(stampMesh);
        glx.render(stampScene, stampCamera);
        stampScene.remove(stampMesh);
      }

      pendingStampsRef.current.length = 0;

      glx.setRenderTarget(prevTarget);
      glx.autoClear = prevAutoClear;
    }, 1);

    // Cleanup on unmount — important because we own GPU resources.
    useEffect(() => {
      return () => {
        renderTarget.dispose();
        geometry.dispose();
        material.dispose();
        (stampMesh.material as THREE.ShaderMaterial).dispose();
        stampMesh.geometry.dispose();
      };
    }, [renderTarget, geometry, material, stampMesh]);

    return (
      <mesh
        geometry={geometry}
        material={material}
        position={position}
        receiveShadow
      />
    );
  }
);
WallPanel.displayName = 'WallPanel';
