"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { useTranslations } from "next-intl";

export interface BeforeAfterProps {
  original: string;
  converted: string;
  sliderPct: number;
  onSliderChange: (v: number) => void;
}

export default function BeforeAfter({ original, converted, sliderPct, onSliderChange }: BeforeAfterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const t = useTranslations();

  const getClientX = useCallback((e: React.MouseEvent | MouseEvent | TouchEvent): number => {
    if (e instanceof TouchEvent) return e.touches[0].clientX;
    if (e instanceof MouseEvent) return e.clientX;
    if (typeof (e as React.MouseEvent).clientX === "number") return (e as React.MouseEvent).clientX;
    return 0;
  }, []);

  const pctFromEvent = useCallback((e: React.MouseEvent | MouseEvent | TouchEvent) => {
    const el = containerRef.current!;
    const rect = el.getBoundingClientRect();
    const x = getClientX(e);
    const p = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    return Math.round(p * 100);
  }, [getClientX]);

  useEffect(() => {
    function onMove(ev: MouseEvent | TouchEvent) {
      if (!dragging) return;
      onSliderChange(pctFromEvent(ev));
    }
    function onUp() { setDragging(false); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, onSliderChange, pctFromEvent]);

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden border aspect-video select-none">
      {/* Converted as background (full) */}
      <NextImage
        src={converted}
        alt="converted"
        fill
        sizes="100vw"
        className="object-contain bg-gray-50"
        unoptimized
        priority={false}
      />

      {/* Original clipped to slider (left side) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - sliderPct}% 0 0)`,
          WebkitClipPath: `inset(0 ${100 - sliderPct}% 0 0)`,
        }}
      >
        <NextImage
          src={original}
          alt="original"
          fill
          sizes="100vw"
          className="object-contain bg-gray-50"
          unoptimized
          priority={false}
        />
      </div>

      {/* Vertical divider + handle */}
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={sliderPct}
        aria-label={t("slider.aria")}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onSliderChange(Math.max(0, sliderPct - 2));
          if (e.key === "ArrowRight") onSliderChange(Math.min(100, sliderPct + 2));
        }}
        onMouseDown={(e) => { setDragging(true); onSliderChange(pctFromEvent(e)); }}
        onTouchStart={(e) => { setDragging(true); onSliderChange(pctFromEvent(e.nativeEvent)); }}
        className="absolute top-0 z-10 h-full"
        style={{ left: `calc(${sliderPct}% - 10px)` }}
      >
        <div className="relative h-full w-5 cursor-col-resize">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-0.5 bg-white/80 mix-blend-difference" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white/90 shadow p-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5"><path d="M9 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
