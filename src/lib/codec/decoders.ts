/**
 * MIME-registered decoders.
 * Default includes:
 *  - svgDecoder: dedicated SVG sizing + rasterization
 *  - rasterBrowserDecoder: generic path via createImageBitmap → canvas
 */

export type InputMime = string;

export interface Decoder {
  mimes: InputMime[]; // exact mime matches (lowercase)
  decode(file: File): Promise<ImageData>;
}

const registry: Decoder[] = [];

export function registerDecoder(decoder: Decoder) {
  registry.push(decoder);
}

export async function decodeFile(file: File): Promise<ImageData> {
  const mime = (file.type || "").toLowerCase();
  const found = registry.find((d) => d.mimes.includes(mime));
  if (found) return found.decode(file);
  // fallback: raster
  return rasterBrowserDecoder.decode(file);
}

// ===== Built-in decoders =====

const rasterBrowserDecoder: Decoder = {
  mimes: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/avif",
    "image/gif",
    "image/bmp",
  ],
  async decode(file: File): Promise<ImageData> {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建绘图上下文");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    bitmap.close();
    return imageData;
  },
};

const svgDecoder: Decoder = {
  mimes: ["image/svg+xml"],
  async decode(file: File): Promise<ImageData> {
    const svgText = await file.text();
    const { width, height } = parseSvgSize(svgText);

    // Inject explicit width/height into data URL to get high-fidelity rasterization at target size
    const svgWithSize = ensureSvgSize(svgText, width, height);
    const blob = new Blob([svgWithSize], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = await loadHtmlImage(url);
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法创建绘图上下文");
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return ctx.getImageData(0, 0, width, height);
    } finally {
      URL.revokeObjectURL(url);
    }
  },
};

function parseSvgSize(svg: string): { width: number; height: number } {
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const el = doc.documentElement as unknown as SVGSVGElement;
    const widthAttr = el.getAttribute("width");
    const heightAttr = el.getAttribute("height");
    const viewBox = el.getAttribute("viewBox");

    function toPx(v: string | null): number | null {
      if (!v) return null;
      const m = v.trim().match(/([0-9.]+)/);
      if (!m) return null;
      const n = parseFloat(m[1]);
      if (!isFinite(n) || n <= 0) return null;
      return Math.round(n);
    }

    let w = toPx(widthAttr);
    let h = toPx(heightAttr);
    if (!w || !h) {
      if (viewBox) {
        const parts = viewBox.trim().split(/\s+/).map((x) => parseFloat(x));
        if (parts.length === 4) {
          const vbw = Math.max(1, Math.round(parts[2]));
          const vbh = Math.max(1, Math.round(parts[3]));
          w = w || vbw;
          h = h || vbh;
        }
      }
    }
    if (!w || !h) {
      // fallback
      w = 512;
      h = 512;
    }
    return { width: w, height: h };
  } catch {
    return { width: 512, height: 512 };
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function ensureSvgSize(svg: string, width: number, height: number): string {
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const el = doc.documentElement as unknown as SVGSVGElement;
    el.setAttribute("width", String(width));
    el.setAttribute("height", String(height));
    const ser = new XMLSerializer();
    return ser.serializeToString(el);
  } catch {
    return svg;
  }
}

// auto-register built-ins (svg first, then raster)
registerDecoder(svgDecoder);
registerDecoder(rasterBrowserDecoder);

// Backwards-compatible helper
export async function decodeToImageData(file: File): Promise<ImageData> {
  return decodeFile(file);
}


