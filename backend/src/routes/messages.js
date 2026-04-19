import { z } from 'zod';
import { prisma } from '../db.js';
import { authHook } from '../auth.js';

export default async function messageRoutes(app) {
  app.post('/messages', { preHandler: authHook }, async (req, reply) => {
    const { listingId, body } = z.object({
      listingId: z.string(),
      body: z.string().min(1).max(2000),
    }).parse(req.body);
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return reply.code(404).send({ error: 'listing not found' });
    let toId;
    if (listing.sellerId === req.userId) {
      const lastMsg = await prisma.message.findFirst({
        where: { listingId, toId: req.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (!lastMsg) return reply.code(400).send({ error: 'no buyer to reply to yet' });
      toId = lastMsg.fromId;
    } else {
      toId = listing.sellerId;
    }
    return prisma.message.create({
      data: { listingId, fromId: req.userId, toId, body },
    });
  });

  app.get('/messages/:listingId', { preHandler: authHook }, async (req) => {
    return prisma.message.findMany({
      where: {
        listingId: req.params.listingId,
        OR: [{ fromId: req.userId }, { toId: req.userId }],
      },
      orderBy: { createdAt: 'asc' },
    });
  });
}
