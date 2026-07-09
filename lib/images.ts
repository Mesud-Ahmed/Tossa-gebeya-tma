import imageCompression from "browser-image-compression";

export async function compressListingImage(file: File) {
  return imageCompression(file, {
    maxSizeMB: 0.22,
    maxWidthOrHeight: 960,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.72
  });
}
