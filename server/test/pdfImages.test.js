import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isImageAttachment, loadPhoto, captionFor } from '../pdfImages.js';

const fmt = (iso) => `at ${new Date(iso).toISOString()}`;

test('isImageAttachment recognises pictures by mime type or file extension, not PDFs', () => {
  assert.equal(isImageAttachment({ mime_type: 'image/jpeg', file_name: 'x' }), true);
  assert.equal(isImageAttachment({ mime_type: null, file_name: 'BEFORE_1.JPG' }), true);
  assert.equal(isImageAttachment({ mime_type: 'application/pdf', file_name: 'report.pdf' }), false);
});

test('captionFor reads capture time and GPS from the mobile app file name', () => {
  const c = captionFor({ file_name: 'AFTER_20261012T090000Z_5.60000_-0.20000.jpg' }, fmt);
  assert.equal(c, 'at 2026-10-12T09:00:00.000Z · 5.60000, -0.20000');
});

test('captionFor omits GPS when the app had no fix (0,0) and falls back to upload time for web uploads', () => {
  assert.equal(captionFor({ file_name: 'EHS_20261012T090500Z_0_0.jpg' }, fmt), 'at 2026-10-12T09:05:00.000Z');
  assert.equal(captionFor({ file_name: 'site.jpg', uploaded_at: '2026-10-12T10:00:00Z' }, fmt), 'at 2026-10-12T10:00:00.000Z');
  assert.equal(captionFor({ file_name: 'site.jpg' }, fmt), '');
});

test('loadPhoto returns null for a missing file instead of throwing', async () => {
  assert.equal(await loadPhoto('/uploads/definitely-not-here.jpg'), null);
  assert.equal(await loadPhoto('/uploads/../../etc/passwd'), null);
});
