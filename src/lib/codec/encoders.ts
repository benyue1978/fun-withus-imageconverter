export type OutputFormat =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/avif"
  | "image/qoi";

function bytesToBlob(bytes: Uint8Array | ArrayBuffer, mime: string): Blob {
  let buf: ArrayBuffer;
  if (bytes instanceof Uint8Array) {
    buf = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
  } else {
    buf = bytes;
  }
  return new Blob([buf], { type: mime });
}

/**
 * Encode ImageData to target mime using WASM encoders (jSquash)
 * qualityNormalized: 0..1
 */
export async function encodeImage(
  imageData: ImageData,
  mime: OutputFormat,
  qualityNormalized: number
): Promise<Blob> {
  const q100 = Math.max(1, Math.min(100, Math.round(qualityNormalized * 100)));
  switch (mime) {
    case "image/webp": {
      const mod = (await import("@jsquash/webp")) as unknown as {
        encode: (img: ImageData, opts?: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
      };
      const bytes = await mod.encode(imageData, { quality: q100 });
      return bytesToBlob(bytes, mime);
    }
    case "image/jpeg": {
      const mod = (await import("@jsquash/jpeg")) as unknown as {
        encode: (img: ImageData, opts?: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
      };
      const bytes = await mod.encode(imageData, { quality: q100 });
      return bytesToBlob(bytes, mime);
    }
    case "image/avif": {
      const mod = (await import("@jsquash/avif")) as unknown as {
        encode: (img: ImageData, opts?: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
      };
      // Map normalized quality to cqLevel 0..63 (lower is better quality)
      const cqLevel = Math.max(0, Math.min(63, Math.round((1 - qualityNormalized) * 63)));
      const bytes = await mod.encode(imageData, { cqLevel });
      return bytesToBlob(bytes, mime);
    }
    case "image/png": {
      const mod = (await import("@jsquash/png")) as unknown as {
        encode: (img: ImageData, opts?: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
      };
      const bytes = await mod.encode(imageData, {});
      return bytesToBlob(bytes, mime);
    }
    case "image/qoi": {
      const mod = (await import("@jsquash/qoi")) as unknown as {
        encode: (img: ImageData, opts?: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
      };
      const bytes = await mod.encode(imageData);
      return bytesToBlob(bytes, mime);
    }
    default:
      throw new Error("Unsupported output format: " + mime);
  }
}


