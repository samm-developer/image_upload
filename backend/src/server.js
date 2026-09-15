import cors from 'cors';
import express from 'express';
import { handler } from './handler.js';
import { config } from './config.js';

const app = express();
app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(async (request, response) => {
  const result = await handler({
    httpMethod: request.method,
    path: request.path,
    body: JSON.stringify(request.body),
    requestContext: { http: { method: request.method } },
  });
  response.status(result.statusCode).set(result.headers).send(result.body);
});

app.listen(config.port, () => {
  console.log(`Upload API listening on http://localhost:${config.port}`);
});
