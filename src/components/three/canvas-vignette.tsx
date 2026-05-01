/**
 * CSS Vignette — a fixed radial-gradient overlay that darkens the page edges
 * without touching the WebGL framebuffer.
 *
 * Why not @react-three/postprocessing's Vignette
 * ----------------------------------------------
 * The post-fx Vignette pass operates on the rendered framebuffer and darkens
 * transparent pixels along with opaque ones. With <Canvas alpha:true>, that
 * turns the page's Plaster White body background into mid-gray wherever the
 * canvas overlays empty space. Doing the vignette in DOM avoids the problem
 * entirely and is cheaper anyway (one paint, no GPU cost).
 *
 * Stacking
 * --------
 * z-[1] sits above the WebGL canvas (z-0) and below the canvas grain texture
 * (bumped to z-[2]) and DOM content (z-10). mix-blend-multiply darkens
 * whatever's painted underneath without the gradient becoming a visible
 * solid color.
 */
export function CanvasVignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background:
          'radial-gradient(ellipse at center, transparent 45%, rgba(10, 10, 14, 0.32) 100%)',
        mixBlendMode: 'multiply'
      }}
    />
  );
}
