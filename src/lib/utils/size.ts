export type AutoNumber = number | "auto";

export function computeResolvedSize(
  imgBitmap: ImageBitmap | null,
  keepAspect: boolean,
  targetW: AutoNumber,
  targetH: AutoNumber
): { w: number; h: number } {
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
}


