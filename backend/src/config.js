import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL?.replace(
  'postgresql+psycopg://',
  'postgresql://',
);

export const config = {
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  bucketName: process.env.S3_BUCKET_NAME,
  databaseUrl,
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  presignedUrlExpiresIn: Number(process.env.PRESIGNED_URL_EXPIRES_IN || 900),
};

export function assertConfig() {
  const missing = ['bucketName', 'databaseUrl'].filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
