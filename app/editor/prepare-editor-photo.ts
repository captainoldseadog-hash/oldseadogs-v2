export const editorPhotoAccept = "image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";

const directTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const longestEdgeLimit = 2000;
const targetBytes = 1_500_000;

type LoadedPhoto = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

export function isHeicPhoto(file: File) {
  const type = file.type.toLowerCase();
  return type === "image/heic" || type === "image/heif" || /\.heic$|\.heif$/i.test(file.name);
}

export function looksLikeEditorPhoto(file: File) {
  const type = file.type.toLowerCase();
  if (!type && !file.name) return false;
  if (type === "image/svg+xml") return false;
  if (type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|gif|bmp|avif)$/i.test(file.name);
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The editor could not prepare this photo for upload."));
    }, "image/jpeg", quality);
  });
}

async function loadPhoto(file: File): Promise<LoadedPhoto> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Chrome on a desktop cannot decode HEIC. Fall through to an Image element, then a clear error.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("unreadable"));
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function jpegName(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "photo"}.jpg`;
}

export async function prepareEditorPhoto(file: File): Promise<{ file: File; note: string }> {
  if (!looksLikeEditorPhoto(file)) {
    throw new Error("Choose a photo. JPEG, PNG, WebP and iPhone HEIC photos are accepted when this browser can read them.");
  }
  if (file.size <= 0) {
    throw new Error("That photo is empty. Please choose another.");
  }

  const declared = file.type.toLowerCase();
  const heic = isHeicPhoto(file);
  const direct = directTypes.has(declared) && !heic;
  if (direct && file.size <= targetBytes) {
    return { file, note: "" };
  }

  let loaded: LoadedPhoto;
  try {
    loaded = await loadPhoto(file);
  } catch {
    if (heic) {
      throw new Error("This iPhone HEIC photo could not be read in this browser. On iPhone, choose it again from Photos, or export a JPEG.");
    }
    throw new Error("The editor could not read this photo. Please choose a JPEG, PNG or WebP image.");
  }

  try {
    const longest = Math.max(loaded.width, loaded.height);
    if (direct && longest <= longestEdgeLimit && file.size <= targetBytes) {
      return { file, note: "" };
    }
    const scale = longest > longestEdgeLimit ? longestEdgeLimit / longest : 1;
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The editor could not prepare this photo for upload.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(loaded.source, 0, 0, width, height);
    let quality = 0.82;
    let blob = await canvasToJpeg(canvas, quality);
    while (blob.size > targetBytes && quality > 0.55) {
      quality = Math.round((quality - 0.08) * 100) / 100;
      blob = await canvasToJpeg(canvas, quality);
    }
    const next = new File([blob], jpegName(file.name), { type: "image/jpeg", lastModified: Date.now() });
    const note = heic
      ? `Converted an iPhone photo to a ${width}×${height} JPEG.`
      : `Resized this photo to ${width}×${height} before upload.`;
    return { file: next, note };
  } finally {
    loaded.close();
  }
}
