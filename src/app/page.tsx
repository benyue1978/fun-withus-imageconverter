"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Drop this in app/page.tsx of a Next.js (App Router) project with Tailwind.
 * It resizes & converts an image client‑side and shows an interactive before/after slider.
 */
export default function Page() {
  // ====== State ======
  const [file, setFile] = useState<File | null>(null);
  const [srcURL, setSrcURL] = useState<string | null>(null);
  const [imgBitmap, setImgBitmap] = useState<ImageBitmap | null>(null);

  const [targetW, setTargetW] = useState<number | "auto">("auto");
  const [targetH, setTargetH] = useState<number | "auto">("auto");
  const [keepAspect, setKeepAspect] = useState(true);
  const [maxKB, setMaxKB] = useState<number>(1024); // default 1MB
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp" | "image/avif">("image/webp");
  const [quality, setQuality] = useState<number>(0.85);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [outURL, setOutURL] = useState<string | null>(null);

  const [sliderPct, setSliderPct] = useState(50);

  // ====== Capability detection ======
  const supportsAVIF = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const c = document.createElement("canvas");
    // @ts-ignore - some browsers support avif
    return c.toDataURL && c.toDataURL("image/avif").startsWith("data:image/avif");
  }, []);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (srcURL) URL.revokeObjectURL(srcURL);
      if (outURL) URL.revokeObjectURL(outURL);
      if (imgBitmap) imgBitmap.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load bitmap when file set
  useEffect(() => {
    (async () => {
      setError(null);
      if (!file) return;
      if (srcURL) URL.revokeObjectURL(srcURL);
      if (imgBitmap) imgBitmap.close();
      const url = URL.createObjectURL(file);
      setSrcURL(url);
      try {
        const bitmap = await createImageBitmap(file);
        setImgBitmap(bitmap);
        // Default output dimension = original
        setTargetW(bitmap.width);
        setTargetH(bitmap.height);
      } catch (e: any) {
        setError("无法读取图片：" + (e?.message || "未知错误"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Drop anywhere handlers
  useEffect(() => {
    function onDragOver(e: DragEvent) {
      e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f && f.type.startsWith("image/")) {
        setFile(f);
      }
    }
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  // ====== Helpers ======
  function resetAll() {
    setFile(null);
    setSrcURL((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
    setOutURL((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
    setOutBlob(null);
    if (imgBitmap) imgBitmap.close();
    setImgBitmap(null);
    setError(null);
    setSliderPct(50);
    setTargetW("auto");
    setTargetH("auto");
    setKeepAspect(true);
    setMaxKB(1024);
    setFormat("image/webp");
    setQuality(0.85);
  }

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const f = (input.files && input.files[0]) || null;
      if (f) setFile(f);
    };
    input.click();
  }

  // Compute target size maintaining aspect
  const resolvedTarget = useMemo(() => {
    if (!imgBitmap) return { w: 0, h: 0 };
    let w: number;
    let h: number;
    if (keepAspect) {
      const aspect = imgBitmap.width / imgBitmap.height;
      if (targetW === "auto" && targetH === "auto") {
        w = imgBitmap.width;
        h = imgBitmap.height;
      } else if (targetW === "auto" && typeof targetH === "number") {
        h = Math.max(1, targetH);
        w = Math.max(1, Math.round(h * aspect));
      } else if (targetH === "auto" && typeof targetW === "number") {
        w = Math.max(1, targetW);
        h = Math.max(1, Math.round(w / aspect));
      } else {
        // both provided: fit into box
        const boxW = Math.max(1, targetW as number);
        const boxH = Math.max(1, targetH as number);
        if (boxW / boxH > aspect) {
          h = boxH;
          w = Math.round(h * aspect);
        } else {
          w = boxW;
          h = Math.round(w / aspect);
        }
      }
    } else {
      w = Math.max(1, targetW === "auto" ? imgBitmap.width : (targetW as number));
      h = Math.max(1, targetH === "auto" ? imgBitmap.height : (targetH as number));
    }
    return { w, h };
  }, [imgBitmap, keepAspect, targetW, targetH]);

  // Core conversion: resize + format + max size constraint
  async function convert() {
    if (!imgBitmap) return;
    setProcessing(true);
    setError(null);
    setOutBlob(null);
    setOutURL((url) => { if (url) URL.revokeObjectURL(url); return null; });

    try {
      const { w, h } = resolvedTarget;
      // Use OffscreenCanvas when available for better perf
      const canvas: HTMLCanvasElement | OffscreenCanvas =
        "OffscreenCanvas" in window ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
      if (!(canvas instanceof OffscreenCanvas)) {
        canvas.width = w; (canvas as HTMLCanvasElement).height = h;
      }
      const ctx = (canvas as any).getContext("2d", { alpha: true });
      if (!ctx) throw new Error("无法创建绘图上下文");
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imgBitmap, 0, 0, w, h);

      // Export with optional binary search on quality for size cap
      const maxBytes = Math.max(1, Math.round(maxKB * 1024));

      async function exportOnce(q: number): Promise<Blob> {
        const mime = format === "image/avif" && !supportsAVIF ? "image/webp" : format;
        const blob: Blob | null = await new Promise((resolve) => {
          if (canvas instanceof OffscreenCanvas) {
            canvas.convertToBlob({ type: mime, quality: q }).then(resolve);
          } else {
            (canvas as HTMLCanvasElement).toBlob(resolve, mime, q);
          }
        });
        if (!blob) throw new Error("导出失败");
        return blob;
      }

      let blob: Blob;
      if (format === "image/png") {
        // PNG quality param is ignored; export once
        blob = await exportOnce(1);
        if (blob.size > maxBytes) {
          setError("PNG 无法通过质量参数压缩到指定大小，请尝试 JPEG/WebP/AVIF。");
        }
      } else {
        let low = 0.3; // lower bound to keep some quality
        let high = quality; // start from user-chosen quality
        let best: Blob | null = null;

        // If starting quality already below cap, do a quick probe upwards
        let test = await exportOnce(high);
        if (test.size > maxBytes) {
          // binary search down
          for (let i = 0; i < 12; i++) {
            const mid = (low + high) / 2;
            const b = await exportOnce(mid);
            if (b.size <= maxBytes) {
              best = b;
              high = mid - 0.02;
            } else {
              low = mid + 0.02;
            }
          }
          blob = best || test;
        } else {
          // try to nudge up towards user's target quality if room
          blob = test;
        }
      }

      setOutBlob(blob);
      const url = URL.createObjectURL(blob);
      setOutURL(url);
      setSliderPct(50);
    } catch (e: any) {
      setError(e?.message || "转换失败");
    } finally {
      setProcessing(false);
    }
  }

  // ====== UI ======
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">🖼️ Image Resizer & Converter</h1>
        <div className="flex items-center gap-3">
          <button onClick={pickFile} className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-[.99]">上传图片</button>
          <button onClick={resetAll} className="px-3 py-2 rounded-xl border hover:bg-gray-100">重新开始</button>
        </div>
      </header>

      {/* Content area */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        {!file && (
          <DropHint onPick={pickFile} />
        )}

        {file && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls */}
            <section className="lg:col-span-4">
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
                        onChange={(e) => setTargetW(e.target.value ? parseInt(e.target.value) : "auto")}
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
                        onChange={(e) => setTargetH(e.target.value ? parseInt(e.target.value) : "auto")}
                        className="w-full rounded-xl border px-3 py-2"
                      />
                      <span className="text-sm text-gray-500">高</span>
                    </div>
                    <label className="col-span-2 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} />
                      保持长宽比
                    </label>
                    {imgBitmap && (
                      <p className="col-span-2 text-xs text-gray-500">原始尺寸：{imgBitmap.width}×{imgBitmap.height} → 输出：{resolvedTarget.w}×{resolvedTarget.h}</p>
                    )}
                  </fieldset>

                  <fieldset className="grid grid-cols-2 gap-3">
                    <label className="text-sm text-gray-600 col-span-2">输出格式</label>
                    <select
                      className="col-span-2 rounded-xl border px-3 py-2"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                    >
                      <option value="image/webp">WebP（推荐）</option>
                      {supportsAVIF && <option value="image/avif">AVIF</option>}
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/png">PNG</option>
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
                    <button onClick={convert} disabled={processing} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
                      {processing ? "转换中…" : "开始转换"}
                    </button>
                    <button onClick={() => setFile(null)} className="px-4 py-2 rounded-xl border">重新选择图片</button>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
              </div>
            </section>

            {/* Preview */}
            <section className="lg:col-span-8">
              <div className="rounded-2xl border bg-white p-3 shadow-sm">
                <h2 className="text-lg font-medium mb-3">预览</h2>
                {!outURL ? (
                  <div className="aspect-video w-full grid place-items-center text-sm text-gray-500 border border-dashed rounded-xl">
                    {srcURL ? "点击开始转换以查看效果" : "请上传图片"}
                  </div>
                ) : (
                  <BeforeAfter
                    original={srcURL!}
                    converted={outURL}
                    sliderPct={sliderPct}
                    onSliderChange={setSliderPct}
                  />
                )}

                {outBlob && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      输出大小：{(outBlob.size / 1024).toFixed(1)} KB
                    </div>
                    <a
                      href={outURL!}
                      download={downloadName(file, format)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                    >下载转换后的图片</a>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function downloadName(file: File | null, mime: string) {
  const base = (file?.name || "image").replace(/\.[^.]+$/, "");
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  return `${base}.${ext}`;
}

function DropHint({ onPick }: { onPick: () => void }) {
  return (
    <div className="relative grid place-items-center rounded-3xl border-2 border-dashed p-16 text-center bg-white/60">
      <div className="space-y-3">
        <p className="text-xl font-medium">拖拽图片到页面任意位置</p>
        <p className="text-sm text-gray-600">或</p>
        <button onClick={onPick} className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800">选择文件</button>
        <p className="text-xs text-gray-500 max-w-md mx-auto">支持 PNG / JPEG / WebP /（浏览器支持时）AVIF。所有处理在浏览器本地完成，不会上传到服务器。</p>
      </div>
    </div>
  );
}

function BeforeAfter({ original, converted, sliderPct, onSliderChange }: {
  original: string;
  converted: string;
  sliderPct: number;
  onSliderChange: (v: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function pctFromEvent(e: React.MouseEvent | MouseEvent | TouchEvent) {
    const el = containerRef.current!;
    const rect = el.getBoundingClientRect();
    let x: number;
    if (e instanceof TouchEvent) {
      x = e.touches[0].clientX;
    } else {
      // @ts-ignore
      x = e.clientX;
    }
    const p = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    return Math.round(p * 100);
  }

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
  }, [dragging, onSliderChange]);

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden border aspect-video select-none">
      {/* Original as background */}
      <img src={original} alt="original" className="absolute inset-0 h-full w-full object-contain bg-gray-50" />

      {/* Converted clipped to slider */}
      <div className="absolute inset-0" style={{ width: `${sliderPct}%`, overflow: "hidden" }}>
        <img src={converted} alt="converted" className="h-full w-full object-contain bg-gray-50" />
      </div>

      {/* Vertical divider + handle */}
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={sliderPct}
        aria-label="对比滑块"
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
