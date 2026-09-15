# Backend

Node.js API and AWS Lambda handler for direct browser-to-S3 image uploads.

## Local setup

1. Copy `.env.example` to `.env` and set `S3_BUCKET_NAME`.
2. Ensure PostgreSQL is running and the `presigned_url` database exists.
3. Run `npm install`, then `npm run db:init`.
4. Start the API with `npm run dev`.

AWS credentials are resolved by the AWS SDK default credential chain. The runtime role needs `s3:PutObject` for the bucket. Configure S3 CORS to allow `PUT` from the frontend origin and expose `ETag` if needed.

The `src/handler.js` file is the Lambda entry point. `src/server.js` wraps the same handler for local development.
