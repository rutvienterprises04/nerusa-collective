import sharp from "sharp";
import { SITE_NAME } from "@/lib/siteConfig";

/**
 * Product photo pipeline.
 *
 * Phase 1 (now): a free, local "luxury polish" — auto white-balance/contrast,
 * gentle sharpening, a soft vignette + frame, and a brand watermark. Runs
 * instantly on upload, no external API, no per-image cost.
 *
 * Phase 2 (later, opt-in): swap `applyLuxuryBackdrop()` below for a real call
 * to an AI image-editing API (e.g. to place the product on a styled
 * marble/silk backdrop) once you're ready to pay per-image. Nothing else in
 * the upload flow needs to change — this file is the single place that
 * touches product photos.
 */

const OUTPUT_SIZE = 1200; // square, matches the catalog card aspect ratio

export async function enhanceAndWatermark(inputBuffer: Buffer): Promise<Buffer> {
  const polished = await applyBasicLuxuryPolish(inputBuffer);
  const withBackdrop = await applyLuxuryBackdrop(polished); // no-op today, see below
  return addWatermark(withBackdrop);
}

/** Free, local enhancement: crop to square, balance light/contrast, sharpen, soft vignette. */
async function applyBasicLuxuryPolish(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .rotate() // respect EXIF orientation
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover", position: "attention" })
    .normalise() // auto white-balance/contrast stretch
    .modulate({ saturation: 1.08, brightness: 1.02 }) // subtle richness boost
    .sharpen({ sigma: 1 })
    .composite([{ input: vignetteSvg(OUTPUT_SIZE), blend: "multiply" }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Placeholder for the AI-generated backdrop step. Returns the image
 * unchanged today. Once you have an image-editing API key, replace this
 * body with a call to that provider (send `imageBuffer`, get back the
 * product composited onto a styled background) and everything downstream
 * (watermark, storage, catalog) keeps working unmodified.
 */
async function applyLuxuryBackdrop(imageBuffer: Buffer): Promise<Buffer> {
  return imageBuffer;
}

async function addWatermark(inputBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(inputBuffer).metadata();
  const width = meta.width ?? OUTPUT_SIZE;
  const height = meta.height ?? OUTPUT_SIZE;

  return sharp(inputBuffer)
    .composite([{ input: watermarkSvg(width, height), gravity: "southeast" }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

function vignetteSvg(size: number): Buffer {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="50%" r="75%">
          <stop offset="70%" stop-color="white" stop-opacity="0"/>
          <stop offset="100%" stop-color="white" stop-opacity="0.35"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#v)"/>
    </svg>`;
  return Buffer.from(svg);
}

function watermarkSvg(width: number, height: number): Buffer {
  const label = escapeXml(SITE_NAME);
  const fontSize = Math.round(width * 0.032);
  const paddingX = Math.round(width * 0.03);
  const paddingY = Math.round(height * 0.035);

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wm { font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px;
              fill: white; fill-opacity: 0.85; font-style: italic; }
        .wm-shadow { font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px;
              fill: black; fill-opacity: 0.35; font-style: italic; }
      </style>
      <text x="${width - paddingX + 1}" y="${height - paddingY + 1}" text-anchor="end" class="wm-shadow">${label}</text>
      <text x="${width - paddingX}" y="${height - paddingY}" text-anchor="end" class="wm">${label}</text>
    </svg>`;
  return Buffer.from(svg);
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
