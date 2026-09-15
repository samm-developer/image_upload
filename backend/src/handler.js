import crypto from 'node:crypto';
import { createPresignedUploadUrl } from './s3.js';
import { completeUpload, createUpload } from './db.js';
import { assertConfig, config } from './config.js';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.frontendOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  },
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    assertConfig();
    if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
      return json(204, {});
    }

    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path || '';
    const payload = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body) : {};

    if (method === 'POST' && path.endsWith('/uploads/presigned-url')) {
      const fileName = String(payload.fileName || '').trim();
      const contentType = String(payload.contentType || '').trim();
      const fileSize = Number(payload.fileSize);
      if (!fileName || !contentType.startsWith('image/') || !Number.isSafeInteger(fileSize) || fileSize <= 0) {
        return json(400, { error: 'A valid image file is required.' });
      }

      const id = crypto.randomUUID();
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
      const objectKey = `uploads/${id}-${safeName}`;
      const upload = await createUpload({ id, fileName, objectKey, contentType, fileSize });
      const uploadUrl = await createPresignedUploadUrl(objectKey, contentType);
      return json(201, { uploadId: upload.id, uploadUrl, objectKey: upload.object_key });
    }

    const completeMatch = path.match(/\/uploads\/([^/]+)\/complete$/);
    if (method === 'POST' && completeMatch) {
      const upload = await completeUpload(completeMatch[1]);
      return upload ? json(200, { upload }) : json(404, { error: 'Upload was not found or already completed.' });
    }

    return json(404, { error: 'Route not found.' });
  } catch (error) {
    console.error(error);
    return json(500, { error: 'Unable to process upload request.' });
  }
}
