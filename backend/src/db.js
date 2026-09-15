import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function createUpload(upload) {
  const result = await pool.query(
    `INSERT INTO uploads (id, file_name, object_key, content_type, file_size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, file_name, object_key, content_type, file_size, status, created_at`,
    [upload.id, upload.fileName, upload.objectKey, upload.contentType, upload.fileSize],
  );
  return result.rows[0];
}

export async function completeUpload(id) {
  const result = await pool.query(
    `UPDATE uploads
     SET status = 'uploaded', uploaded_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING id, file_name, object_key, content_type, file_size, status, uploaded_at`,
    [id],
  );
  return result.rows[0] || null;
}

export async function listUploads() {
  const result = await pool.query(
    `SELECT id, file_name, object_key, content_type, file_size, uploaded_at
     FROM uploads
     WHERE status = 'uploaded'
     ORDER BY uploaded_at DESC`,
  );
  return result.rows;
}
