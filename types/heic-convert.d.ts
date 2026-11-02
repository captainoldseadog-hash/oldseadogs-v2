declare module "heic-convert" {
  type HeicConvertOptions = {
    buffer: Buffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  };
  type HeicConvert = (options: HeicConvertOptions) => Promise<ArrayBuffer>;
  const convert: HeicConvert;
  export default convert;
}
