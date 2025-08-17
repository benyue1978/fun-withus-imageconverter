"use client";

import React, { useEffect, useMemo, useState } from "react";
import BeforeAfter from "@/components/BeforeAfter";
import DropHint from "@/components/DropHint";
import Controls from "@/components/Controls";
import { type OutputFormat } from "@/lib/codec/encoders";
import { decodeToImageData } from "@/lib/codec/decoders";
import { useConverter } from "@/lib/hooks/useConverter";
import { computeResolvedSize } from "@/lib/utils/size";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import FeedbackButton from "@/components/FeedbackButton";

export default function Page() {
  // ====== State ======
  const [file, setFile] = useState<File | null>(null);
  const [srcURL, setSrcURL] = useState<string | null>(null);
  const [imgBitmap, setImgBitmap] = useState<ImageBitmap | null>(null);

  const [targetW, setTargetW] = useState<number | "auto">("auto");
  const [targetH, setTargetH] = useState<number | "auto">("auto");
  const [keepAspect, setKeepAspect] = useState(true);
  const [maxKB, setMaxKB] = useState<number>(1024); // default 1MB
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [quality, setQuality] = useState<number>(0.85);

  const { processing, error, outBlob, outURL, convert, clearOutput } = useConverter();
  const [loadError, setLoadError] = useState<string | null>(null);
  const t = useTranslations();

  const [sliderPct, setSliderPct] = useState(50);

  // 不再依赖浏览器能力检测；统一走 WASM 编码

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
      setLoadError(null);
      if (!file) return;
      if (srcURL) URL.revokeObjectURL(srcURL);
      if (imgBitmap) imgBitmap.close();
      const url = URL.createObjectURL(file);
      setSrcURL(url);
      try {
        // unified decode to ImageData via decoder module, then to ImageBitmap for drawing/preview
        const decoded = await decodeToImageData(file);
        const bitmap = await createImageBitmap(decoded);
        setImgBitmap(bitmap);
        setTargetW(bitmap.width);
        setTargetH(bitmap.height);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setLoadError("无法读取图片：" + (msg || "未知错误"));
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
      if (f && (f.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|avif|bmp|svg|ico)$/i.test(f.name))) {
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
    clearOutput();
    if (imgBitmap) imgBitmap.close();
    setImgBitmap(null);
    setLoadError(null);
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
    input.accept = "image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.ico";
    input.onchange = () => {
      const f = (input.files && input.files[0]) || null;
      if (f) setFile(f);
    };
    input.click();
  }

  // Compute target size maintaining aspect
  const resolvedTarget = useMemo(() => computeResolvedSize(imgBitmap, keepAspect, targetW, targetH), [imgBitmap, keepAspect, targetW, targetH]);

  // Core conversion: resize + format + max size constraint
  async function doConvert() {
    if (!imgBitmap) return;
    const { w, h } = resolvedTarget;
    await convert({ imgBitmap, file, srcURL, width: w, height: h, format, quality, maxKB });
    setSliderPct(50);
  }

  // ====== UI ======
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">🖼️ {t("title")}</h1>
        <div className="flex items-center gap-3">
          <button onClick={pickFile} className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-[.99]">{t("upload")}</button>
          <button onClick={resetAll} className="px-3 py-2 rounded-xl border hover:bg-gray-100">{t("reset")}</button>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Content area */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* 移除 SupportCheck 展示组件 */}
        {!file && (
          <DropHint onPick={pickFile} />
        )}

        {file && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls */}
            <section className="lg:col-span-4">
              <Controls
                targetW={targetW}
                targetH={targetH}
                keepAspect={keepAspect}
                setTargetW={setTargetW}
                setTargetH={setTargetH}
                setKeepAspect={setKeepAspect}
                imgBitmap={imgBitmap}
                resolvedTarget={resolvedTarget}
                format={format}
                setFormat={setFormat}
                quality={quality}
                setQuality={setQuality}
                maxKB={maxKB}
                setMaxKB={setMaxKB}
                onConvert={doConvert}
                processing={processing}
                onResetFile={() => setFile(null)}
                error={loadError || error}
              />
            </section>

            {/* Preview */}
            <section className="lg:col-span-8">
              <div className="rounded-2xl border bg-white p-3 shadow-sm">
                <h2 className="text-lg font-medium mb-3">{t("preview")}</h2>
                {!outURL ? (
                  <div className="aspect-video w-full grid place-items-center text-sm text-gray-500 border border-dashed rounded-xl">
                  {srcURL ? "" : t("upload")}
                  </div>
                ) : (
                  (format === "image/qoi") ? (
                    <div className="aspect-video w-full grid place-items-center text-sm text-gray-600 border rounded-xl">
                      {t("cannotPreview")}
                    </div>
                  ) : (
                    <BeforeAfter
                      original={srcURL!}
                      converted={outURL}
                      sliderPct={sliderPct}
                      onSliderChange={setSliderPct}
                    />
                  )
                )}

                {outBlob && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-600 space-x-3">
                      {file && <span>{t("originalSize")}：{(file.size / 1024).toFixed(1)} KB</span>}
                      <span>{t("outputSize")}：{(outBlob.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <a
                      href={outURL!}
                      download={downloadName(file, format)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                    >{t("download")}</a>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Feedback Button */}
      <FeedbackButton />
    </main>
  );
}

function downloadName(file: File | null, mime: string) {
  const base = (file?.name || "image").replace(/\.[^.]+$/, "");
  let ext = mime.split("/")[1].replace("jpeg", "jpg");
  if (mime === "image/qoi") ext = "qoi";
  return `${base}.${ext}`;
}
