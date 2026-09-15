# Backend

Node.js API and AWS Lambda handler for direct browser-to-S3 image uploads.

## Local setup

1. Copy `.env.example` to `.env` and set `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Ensure PostgreSQL is running and the `presigned_url` database exists.
3. Run `npm install`, then `npm run db:init`.
4. Start the API with `npm run dev`.

For local development, credentials can stay in the ignored `backend/.env` file; no system-wide AWS CLI configuration is required. An optional `AWS_SESSION_TOKEN` is needed for temporary credentials. The runtime role needs `s3:PutObject` for the bucket. Configure S3 CORS to allow `PUT` from the frontend origin and expose `ETag` if needed. Never commit `.env` or expose these credentials in the frontend.

The `src/handler.js` file is the Lambda entry point. `src/server.js` wraps the same handler for local development.
