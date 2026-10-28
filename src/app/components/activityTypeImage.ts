export const cropActivityTypeImage = async (
  file: File,
  zoom: number,
  offsetX: number,
  offsetY: number
): Promise<File> => {
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("No se pudo leer la imagen."));
      image.src = sourceUrl;
    });

    const width = 1400;
    const height = 560;
    const baseScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const scale = baseScale * zoom;
    const renderedWidth = image.naturalWidth * scale;
    const renderedHeight = image.naturalHeight * scale;
    const horizontalTravel = Math.max(0, (renderedWidth - width) / 2);
    const verticalTravel = Math.max(0, (renderedHeight - height) / 2);
    const drawX = (width - renderedWidth) / 2 - (offsetX / 100) * horizontalTravel;
    const drawY = (height - renderedHeight) / 2 - (offsetY / 100) * verticalTravel;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la imagen.");

    context.drawImage(image, drawX, drawY, renderedWidth, renderedHeight);

    const mimeType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error("No se pudo procesar la imagen.")),
        mimeType,
        0.9
      );
    });

    const extension = mimeType === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "actividad";
    return new File([blob], `${baseName}.${extension}`, { type: mimeType });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};
