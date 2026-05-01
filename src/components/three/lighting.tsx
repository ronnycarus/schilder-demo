'use client';

/**
 * Three-point + ambient + hemisphere rig for the procedural Plaster White
 * stage. No HDRI per spec §1; this rig has to do all the global illumination
 * work.
 *
 *  Key   (5, 8, 5)  intensity 1.5  white   castShadow
 *  Fill  (-4, 2, -2) intensity 0.4  warm    no shadow
 *  Rim   (0, 4, -8)  intensity 0.8  cool    no shadow
 *  Ambient                 0.15           keeps shadows from going black
 *  Hemisphere sky/ground   0.2            soft global tint matching palette
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <hemisphereLight args={['#F2EDE2', '#1F3F6E', 0.2]} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-4, 2, -2]}
        intensity={0.4}
        color="#FFE7C2"
      />
      <directionalLight
        position={[0, 4, -8]}
        intensity={0.8}
        color="#9DB5D9"
      />
    </>
  );
}
