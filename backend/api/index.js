import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
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

await app.register(authRoutes);
await app.register(listingRoutes);
await app.register(wantRoutes);
await app.register(messageRoutes);
await app.register(shopRoutes);
await app.register(uploadRoutes);
await app.register(webRoutes);

await app.ready();

export default async (req, res) => {
  app.server.emit('request', req, res);
};
