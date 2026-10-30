"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/** Légère inclinaison 3D qui suit le pointeur (désactivée au tactile / reduced-motion). */
export function Tilt({ children, className = "", max = 6 }: { children: ReactNode; className?: string; max?: number }) {
  const el = useRef<HTMLDivElement>(null);

  const ok = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches;

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = el.current;
    if (!node || !ok()) return;
    const r = node.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(node, {
      rotateY: px * max,
      rotateX: -py * max,
      transformPerspective: 900,
      duration: 0.6,
      ease: "power3.out",
    });
    node.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
    node.style.setProperty("--my", `${(py + 0.5) * 100}%`);
  };
  const leave = () => {
    if (el.current) gsap.to(el.current, { rotateX: 0, rotateY: 0, duration: 0.9, ease: "power3.out" });
  };

  return (
    <div ref={el} onPointerMove={move} onPointerLeave={leave} className={`[transform-style:preserve-3d] ${className}`}>
      {children}
    </div>
  );
}
