/**
 * Compresses an image file using the browser Canvas API.
 * Videos and non-image files are returned unchanged.
 *
 * @param file     The original File from an <input type="file">
 * @param maxWidth Longest edge capped at this many pixels (default 1200)
 * @param quality  JPEG quality 0–1 (default 0.82 ≈ ~85% smaller than raw)
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality  = 0.82,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width  = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          const outName = file.name.replace(/\.\w+$/, ".jpg");
          resolve(new File([blob], outName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}
