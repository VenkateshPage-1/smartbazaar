import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import awsLambdaFastify from '@fastify/aws-lambda';
import { ZodError } from 'zod';
import authRoutes from '../src/routes/auth.js';
import listingRoutes from '../src/routes/listings.js';
import wantRoutes from '../src/routes/wants.js';
import messageRoutes from '../src/routes/messages.js';
import shopRoutes from '../src/routes/shops.js';
import uploadRoutes from '../src/routes/upload.js';
import webRoutes from '../src/web/pages.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

app.setErrorHandler((err, req, reply) => {
  if (err instanceof ZodError) {
    const msg = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return reply.code(400).send({ error: msg });
  }
  req.log.error(err);
  reply.code(err.statusCode || 500).send({ error: err.message });
});

app.get('/health', async () => ({ ok: true, service: 'smartbazaar', ts: Date.now() }));
app.get('/', async () => ({ ok: true, service: 'smartbazaar' }));

await app.register(authRoutes);
await app.register(listingRoutes);
await app.register(wantRoutes);
await app.register(messageRoutes);
await app.register(shopRoutes);
await app.register(uploadRoutes);
await app.register(webRoutes);

const proxy = awsLambdaFastify(app);

export default async (req, res) => {
  const event = {
    httpMethod: req.method,
    path: req.url,
    headers: req.headers,
    queryStringParameters: Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams),
    body: await new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => resolve(data || null));
    }),
    isBase64Encoded: false,
    requestContext: {},
  };

  const result = await proxy(event);

  res.statusCode = result.statusCode;
  for (const [key, value] of Object.entries(result.headers || {})) {
    res.setHeader(key, value);
  }
  if (result.isBase64Encoded) {
    res.end(Buffer.from(result.body, 'base64'));
  } else {
    res.end(result.body);
  }
};
