import { useEffect, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent, RefObject } from "react";

export type Box = [number, number, number, number];

/**
 * Pan and zoom for an SVG chart in map units: drag, wheel, pinch and double-click,
 * and an animated flight to a box (instant under reduced motion).
 */
export function usePanZoom(svgRef: RefObject<SVGSVGElement | null>, W: number, H: number, start: Box, minW = 60) {
  const maxW = Math.max(W * 1.25, start[2]);
  const [vb, setVb] = useState<Box>(start);
  const vbRef = useRef(vb); vbRef.current = vb;
  const anim = useRef<number | null>(null);
  const clamp = (b: Box): Box => {
    const w = Math.min(maxW, Math.max(minW, b[2])), h = w * (b[3] / b[2]);
    const x = Math.min(W - w * 0.25, Math.max(-w * 0.75, b[0])), y = Math.min(H - h * 0.25, Math.max(-h * 0.75, b[1]));
    return [x, y, w, h];
  };
  const flyTo = (to: Box, ms = 600) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    const from = vbRef.current, t0 = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (t: number) => {
      const u = reduce ? 1 : Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - u, 3);
      setVb(clamp(from.map((v, n) => v + (to[n] - v) * e) as Box));
      if (u < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };
  const toSvg = (cx: number, cy: number) => {
    const svg = svgRef.current!; const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const zoomAt = (cx: number, cy: number, f: number) => {
    const p = toSvg(cx, cy), [x, y, w, h] = vbRef.current;
    const nw = Math.min(maxW, Math.max(minW, w * f)), r = nw / w;
    setVb(clamp([p.x - (p.x - x) * r, p.y - (p.y - y) * r, nw, h * r]));
  };
  const zoomCentre = (f: number) => { const r = svgRef.current!.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, f); };
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (anim.current) cancelAnimationFrame(anim.current);
      const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(e.clientX, e.clientY, Math.exp(d * 0.0015));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ moved: boolean; x: number; y: number; vb: Box; a: number; pinch?: number } | null>(null);
  const onPointerDown = (e: RPointerEvent<SVGSVGElement>) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = svgRef.current!.getScreenCTM()!.a;
    if (ptrs.current.size === 2) {
      const [p, q] = [...ptrs.current.values()];
      drag.current = { moved: true, x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, vb: vbRef.current, a, pinch: Math.hypot(p.x - q.x, p.y - q.y) };
    } else drag.current = { moved: false, x: e.clientX, y: e.clientY, vb: vbRef.current, a };
  };
  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = drag.current; if (!d) return;
    if (d.pinch && ptrs.current.size === 2) {
      const [p, q] = [...ptrs.current.values()];
      setVb(d.vb); zoomAt((p.x + q.x) / 2, (p.y + q.y) / 2, d.pinch / Math.hypot(p.x - q.x, p.y - q.y));
      return;
    }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    if (!d.moved) { d.moved = true; svgRef.current!.setPointerCapture(e.pointerId); if (anim.current) cancelAnimationFrame(anim.current); }
    setVb(clamp([d.vb[0] - dx / d.a, d.vb[1] - dy / d.a, d.vb[2], d.vb[3]]));
  };
  const onPointerUp = (e: RPointerEvent<SVGSVGElement>) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) setTimeout(() => { drag.current = null; }, 0);
  };
  const dragging = () => !!drag.current?.moved;
  return {
    vb, flyTo, zoomAt, zoomCentre, dragging,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDoubleClick: (e: { clientX: number; clientY: number }) => zoomAt(e.clientX, e.clientY, 0.55) },
  };
}
