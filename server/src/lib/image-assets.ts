import sharp from "sharp";

import { fetchBuffer } from "./http.js";

const MAX_INPUT_PIXELS = 4096 * 4096;
const DEFAULT_FETCH_TIMEOUT_MS = 20_000;

export interface OptimizedRasterImage {
  buffer: Buffer;
  extension: string;
  mediaType: string;
  width: number;
  height: number;
}

function decodeDataUri(rawValue: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(rawValue.trim());
  if (!match) {
    throw new Error("Unsupported data URI");
  }

  const mediaType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || "";
  return {
    mediaType,
    buffer: isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8")
  };
}

async function loadImageBuffer(
  sourceUrl: string,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
  headers?: Record<string, string>
) {
  if (/^data:/i.test(sourceUrl)) {
    return decodeDataUri(sourceUrl);
  }

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const buffer = await fetchBuffer(
        sourceUrl,
        headers
          ? {
              headers
            }
          : undefined,
        timeoutMs
      );
      return {
        mediaType: "",
        buffer
      };
    } catch (error) {
      lastError = error;
      if (attempt >= 3) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to load image buffer");
}

async function buildBasePipeline(
  sourceUrl: string,
  maxWidth: number,
  maxHeight: number,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
  headers?: Record<string, string>
) {
  const input = await loadImageBuffer(sourceUrl, timeoutMs, headers);
  return sharp(input.buffer, {
    animated: false,
    limitInputPixels: MAX_INPUT_PIXELS
  })
    .rotate()
    .flatten({ background: "#ffffff" })
    .greyscale()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true
    });
}

function buildGrayscaleBmp(buffer: Buffer, width: number, height: number, channels: number) {
  const bytesPerPixel = Math.max(1, channels);
  const rowSize = width;
  const paddedRowSize = (rowSize + 3) & ~3;
  const paletteSize = 256 * 4;
  const pixelArraySize = paddedRowSize * height;
  const fileSize = 14 + 40 + paletteSize + pixelArraySize;
  const output = Buffer.alloc(fileSize);

  let offset = 0;
  output.writeUInt16LE(0x4d42, offset);
  offset += 2;
  output.writeUInt32LE(fileSize, offset);
  offset += 4;
  output.writeUInt16LE(0, offset);
  offset += 2;
  output.writeUInt16LE(0, offset);
  offset += 2;
  output.writeUInt32LE(14 + 40 + paletteSize, offset);
  offset += 4;

  output.writeUInt32LE(40, offset);
  offset += 4;
  output.writeInt32LE(width, offset);
  offset += 4;
  output.writeInt32LE(height, offset);
  offset += 4;
  output.writeUInt16LE(1, offset);
  offset += 2;
  output.writeUInt16LE(8, offset);
  offset += 2;
  output.writeUInt32LE(0, offset);
  offset += 4;
  output.writeUInt32LE(pixelArraySize, offset);
  offset += 4;
  output.writeInt32LE(2835, offset);
  offset += 4;
  output.writeInt32LE(2835, offset);
  offset += 4;
  output.writeUInt32LE(256, offset);
  offset += 4;
  output.writeUInt32LE(256, offset);
  offset += 4;

  for (let index = 0; index < 256; index += 1) {
    output[offset + index * 4] = index;
    output[offset + index * 4 + 1] = index;
    output[offset + index * 4 + 2] = index;
    output[offset + index * 4 + 3] = 0;
  }
  offset += paletteSize;

  for (let row = 0; row < height; row += 1) {
    const srcRow = height - row - 1;
    const rowOffset = srcRow * width * bytesPerPixel;
    const destRowOffset = offset + row * paddedRowSize;
    for (let column = 0; column < width; column += 1) {
      output[destRowOffset + column] = buffer[rowOffset + column * bytesPerPixel] ?? 255;
    }
  }

  return output;
}

export async function buildEpubImageAsset(
  sourceUrl: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    timeoutMs?: number;
    headers?: Record<string, string>;
  }
): Promise<OptimizedRasterImage> {
  const pipeline = await buildBasePipeline(
    sourceUrl,
    options?.maxWidth ?? 1200,
    options?.maxHeight ?? 1600,
    options?.timeoutMs,
    options?.headers
  );
  const { data, info } = await pipeline
    .png({
      compressionLevel: 9,
      effort: 10,
      palette: true
    })
    .toBuffer({ resolveWithObject: true });
  const width = info.width ?? 0;
  const height = info.height ?? 0;

  return {
    buffer: data,
    extension: ".png",
    mediaType: "image/png",
    width,
    height
  };
}

export async function buildBmpImageAsset(
  sourceUrl: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    timeoutMs?: number;
    headers?: Record<string, string>;
  }
): Promise<OptimizedRasterImage> {
  const pipeline = await buildBasePipeline(
    sourceUrl,
    options?.maxWidth ?? 1200,
    options?.maxHeight ?? 1600,
    options?.timeoutMs,
    options?.headers
  );
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const width = info.width ?? 0;
  const height = info.height ?? 0;

  return {
    buffer: buildGrayscaleBmp(data, width, height, info.channels),
    extension: ".bmp",
    mediaType: "image/bmp",
    width,
    height
  };
}
