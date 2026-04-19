import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { ZodError } from 'zod';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import wantRoutes from './routes/wants.js';
import messageRoutes from './routes/messages.js';
import shopRoutes from './routes/shops.js';
import uploadRoutes from './routes/upload.js';
import webRoutes from './web/pages.js';
// import dealRoutes from './routes/deals.js'; // Uncomment when ready for escrow

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
// await app.register(dealRoutes);

const port = parseInt(process.env.PORT || '4000', 10);
await app.listen({ port, host: '0.0.0.0' });
