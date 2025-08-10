"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { encodeImage, type OutputFormat } from "@/lib/codec/encoders";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    type ImageCtor = new (width?: number, height?: number) => HTMLImageElement;
    const ctor: ImageCtor | null =
      typeof window !== "undefined" && typeof (window as Window & { Image: ImageCtor }).Image === "function"
        ? ((window as Window & { Image: ImageCtor }).Image)
        : (typeof Image !== "undefined" ? (Image as unknown as ImageCtor) : null);
    const img: HTMLImageElement = ctor ? new ctor() : (document.createElement("img") as HTMLImageElement);
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export interface ConvertParams {
  imgBitmap: ImageBitmap;
  file: File | null;
  srcURL: string | null;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number; // 0..1
  maxKB: number;
}

export function useConverter() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [outURL, setOutURL] = useState<string | null>(null);

  const lastURL = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (lastURL.current) URL.revokeObjectURL(lastURL.current);
    };
  }, []);

  const clearOutput = useCallback(() => {
    setOutBlob(null);
    setError(null);
    setProcessing(false);
    setOutURL((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    lastURL.current = null;
  }, []);

  const convert = useCallback(async (p: ConvertParams) => {
    const { imgBitmap, file, srcURL, width: w, height: h, format, quality, maxKB } = p;
    setProcessing(true);
    setError(null);
    setOutBlob(null);
    setOutURL((u) => { if (u) URL.revokeObjectURL(u); return null; });

    try {
      const canvas: HTMLCanvasElement | OffscreenCanvas =
        "OffscreenCanvas" in window ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
      if (!(canvas instanceof OffscreenCanvas)) {
        canvas.width = w; (canvas as HTMLCanvasElement).height = h;
      }
      const ctx = canvas instanceof OffscreenCanvas
        ? canvas.getContext("2d", { alpha: true })
        : (canvas as HTMLCanvasElement).getContext("2d", { alpha: true });
      if (!ctx) throw new Error("无法创建绘图上下文");
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      (ctx as unknown as { imageSmoothingQuality?: string }).imageSmoothingQuality = "high";
      if (file && file.type === "image/svg+xml" && srcURL) {
        const svgImg = await loadImage(srcURL);
        ctx.drawImage(svgImg, 0, 0, w, h);
      } else {
        ctx.drawImage(imgBitmap, 0, 0, w, h);
      }
      const imageData: ImageData = ctx.getImageData(0, 0, w, h);

      const maxBytes = Math.max(1, Math.round(maxKB * 1024));

      async function exportOnce(q: number): Promise<Blob> {
        return encodeImage(imageData, format, q);
      }

      let blob: Blob;
      if (format === "image/png") {
        blob = await exportOnce(1);
        if (blob.size > maxBytes) {
          setError("PNG 无法通过质量参数压缩到指定大小，请尝试 JPEG/WebP/AVIF。");
        }
      } else {
        let low = 0.3;
        let high = quality;
        let best: Blob | null = null;
        const test = await exportOnce(high);
        if (test.size > maxBytes) {
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
          blob = test;
        }
      }

      setOutBlob(blob);
      const url = URL.createObjectURL(blob);
      if (lastURL.current) URL.revokeObjectURL(lastURL.current);
      lastURL.current = url;
      setOutURL(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "转换失败");
    } finally {
      setProcessing(false);
    }
  }, []);

  return { processing, error, outBlob, outURL, convert, clearOutput };
}


