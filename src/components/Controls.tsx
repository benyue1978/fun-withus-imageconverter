"use client";

import React, { useMemo } from "react";
import type { OutputFormat } from "@/lib/codec/encoders";
import { computeResolvedSize } from "@/lib/utils/size";

export interface ControlsProps {
  targetW: number | "auto";
  targetH: number | "auto";
  keepAspect: boolean;
  setTargetW: (v: number | "auto") => void;
  setTargetH: (v: number | "auto") => void;
  setKeepAspect: (checked: boolean) => void;
  imgBitmap: ImageBitmap | null;
  resolvedTarget?: { w: number; h: number };

  format: OutputFormat;
  setFormat: (v: OutputFormat) => void;
  quality: number;
  setQuality: (v: number) => void;
  maxKB: number;
  setMaxKB: (v: number) => void;

  onConvert: () => void;
  processing: boolean;
  onResetFile: () => void;
  error: string | null;
}

export default function Controls(props: ControlsProps) {
  const {
    targetW, targetH, keepAspect, setTargetW, setTargetH, setKeepAspect, imgBitmap, resolvedTarget,
    format, setFormat, quality, setQuality, maxKB, setMaxKB,
    onConvert, processing, onResetFile, error,
  } = props;

  function handleWidthChange(v: number | "auto") {
    setTargetW(v);
    if (keepAspect && imgBitmap && typeof v === "number") {
      const aspect = imgBitmap.width / imgBitmap.height;
      const newH = Math.max(1, Math.round(v / aspect));
      setTargetH(newH);
    }
  }

  function handleHeightChange(v: number | "auto") {
    setTargetH(v);
    if (keepAspect && imgBitmap && typeof v === "number") {
      const aspect = imgBitmap.width / imgBitmap.height;
      const newW = Math.max(1, Math.round(v * aspect));
      setTargetW(newW);
    }
  }

  const computed = useMemo(() => computeResolvedSize(imgBitmap, keepAspect, targetW, targetH), [imgBitmap, keepAspect, targetW, targetH]);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-medium mb-3">转换参数</h2>
      <div className="space-y-4">
        <fieldset className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-600 col-span-2">目标尺寸（px）</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              placeholder="自动"
              value={targetW === "auto" ? "" : targetW}
              onChange={(e) => handleWidthChange(e.target.value ? parseInt(e.target.value) : "auto")}
              className="w-full rounded-xl border px-3 py-2"
            />
            <span className="text-sm text-gray-500">宽</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              placeholder="自动"
              value={targetH === "auto" ? "" : targetH}
              onChange={(e) => handleHeightChange(e.target.value ? parseInt(e.target.value) : "auto")}
              className="w-full rounded-xl border px-3 py-2"
            />
            <span className="text-sm text-gray-500">高</span>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={keepAspect}
              onChange={(e) => {
                const next = e.target.checked;
                setKeepAspect(next);
                if (next && imgBitmap) {
                  const aspect = imgBitmap.width / imgBitmap.height;
                  if (typeof targetW === "number") {
                    setTargetH(Math.max(1, Math.round(targetW / aspect)));
                  } else if (typeof targetH === "number") {
                    setTargetW(Math.max(1, Math.round(targetH * aspect)));
                  }
                }
              }}
            />
            保持长宽比
          </label>
          {imgBitmap && (
            <p className="col-span-2 text-xs text-gray-500">原始尺寸：{imgBitmap.width}×{imgBitmap.height} → 输出：{(resolvedTarget?.w ?? computed.w)}×{(resolvedTarget?.h ?? computed.h)}</p>
          )}
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-600 col-span-2">输出格式</label>
          <select
            className="col-span-2 rounded-xl border px-3 py-2"
            value={format}
            onChange={(e) => setFormat(e.target.value as OutputFormat)}
          >
            <option value="image/webp">WebP（推荐）</option>
            <option value="image/avif">AVIF</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/qoi">QOI</option>
          </select>
        </fieldset>

        {format !== "image/png" && (
          <fieldset className="grid grid-cols-1 gap-2">
            <label className="text-sm text-gray-600">画质（0.3–0.95）</label>
            <input type="range" min={0.3} max={0.95} step={0.01} value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))} />
            <div className="text-xs text-gray-500">当前：{quality.toFixed(2)}</div>
          </fieldset>
        )}

        <fieldset className="grid grid-cols-1 gap-2">
          <label className="text-sm text-gray-600">最大文件大小（KB）</label>
          <input type="number" min={1} value={maxKB} onChange={(e) => setMaxKB(Math.max(1, parseInt(e.target.value || "1")))} className="rounded-xl border px-3 py-2" />
          <p className="text-xs text-gray-500">若导出超过此大小，将自动降低画质（PNG 除外）。</p>
        </fieldset>

        <div className="flex gap-3 pt-2">
          <button onClick={onConvert} disabled={processing} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
            {processing ? "转换中…" : "开始转换"}
          </button>
          <button onClick={onResetFile} className="px-4 py-2 rounded-xl border">重新选择图片</button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}


