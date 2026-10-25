// Photo helpers for the work order PDF export: read an uploaded picture off
// disk, shrink it to something sensible for print, and work out a caption
// from the metadata the mobile app encodes in the file name.
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

sharp.cache(false);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
// A grid cell in the PDF is ~160pt wide (about 2 inches); 1200px is plenty at
// print resolution and keeps a 30-photo report to a few MB instead of the
// 3-8 MB each that raw phone pictures weigh.
const MAX_EDGE = 1200;

export const isImageAttachment = (a) =>
  /^image\//i.test(a.mime_type || '') || /\.(jpe?g|png|webp|gif)$/i.test(a.file_name || '');

// Returns a JPEG buffer, or null when the file is missing / not a readable
// picture, so one bad photo never sinks the whole report. `.rotate()` applies
// the camera's EXIF orientation so portrait shots aren't drawn sideways, and
// converting to JPEG also covers WEBP/GIF/PNG, which PDFKit can't all embed.
export async function loadPhoto(filePath) {
  try {
    const file = path.join(UPLOAD_DIR, path.basename(String(filePath || '')));
    const raw = await fs.readFile(file);
    return await sharp(raw)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 78 })
      .toBuffer();
  } catch {
    return null;
  }
}

const META = /_(\d{8}T\d{6}Z)_(-?\d+(?:\.\d+)?)_(-?\d+(?:\.\d+)?)\.[a-z0-9]+$/i;

// Photos taken in the mobile app are named LABEL_YYYYMMDDTHHMMSSZ_lat_lon.jpg.
// Show when/where they were taken; fall back to the upload time for anything
// uploaded from the web.
export function captionFor(a, fmtDateTime) {
  const m = META.exec(a.file_name || '');
  if (m) {
    const t = m[1];
    const iso = `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T${t.slice(9, 11)}:${t.slice(11, 13)}:${t.slice(13, 15)}Z`;
    const lat = Number(m[2]); const lon = Number(m[3]);
    const gps = lat || lon ? ` · ${lat.toFixed(5)}, ${lon.toFixed(5)}` : '';
    return `${fmtDateTime(iso)}${gps}`;
  }
  return a.uploaded_at ? fmtDateTime(a.uploaded_at) : '';
}
