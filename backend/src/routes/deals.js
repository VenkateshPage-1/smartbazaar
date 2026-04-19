import { z } from 'zod';
import { prisma } from '../db.js';
import { authHook } from '../auth.js';

export default async function dealRoutes(app) {
  // Seller sends payment request after negotiation in chat.
  app.post('/deals', { preHandler: authHook }, async (req, reply) => {
    const { listingId, buyerId, agreedPrice } = z.object({
      listingId: z.string(),
      buyerId: z.string(),
      agreedPrice: z.number().int().positive(),
    }).parse(req.body);

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return reply.code(404).send({ error: 'listing not found' });
    if (listing.sellerId !== req.userId) return reply.code(403).send({ error: 'only seller can send payment request' });
    if (buyerId === req.userId) return reply.code(400).send({ error: 'cannot create deal with yourself' });

    const deal = await prisma.deal.create({
      data: { listingId, sellerId: req.userId, buyerId, agreedPrice },
    });
    return deal;
  });

  // Buyer sees pending payment request.
  app.get('/deals/my', { preHandler: authHook }, async (req) => {
    return prisma.deal.findMany({
      where: { OR: [{ buyerId: req.userId }, { sellerId: req.userId }] },
      include: {
        listing: { select: { id: true, title: true, images: true } },
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  // Buyer "pays" — in dev, just mark as paid. In prod, verify Razorpay payment.
  app.post('/deals/:id/pay', { preHandler: authHook }, async (req, reply) => {
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!deal) return reply.code(404).send({ error: 'deal not found' });
    if (deal.buyerId !== req.userId) return reply.code(403).send({ error: 'only buyer can pay' });
    if (deal.status !== 'requested') return reply.code(400).send({ error: `deal is ${deal.status}, not payable` });

    // In production: verify Razorpay payment ID here.
    const { paymentId } = z.object({ paymentId: z.string().default('dev_simulated') }).parse(req.body || {});

    return prisma.deal.update({
      where: { id: deal.id },
      data: { status: 'paid', paymentId },
    });
  });

  // Buyer confirms item received and is good.
  app.post('/deals/:id/confirm', { preHandler: authHook }, async (req, reply) => {
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!deal) return reply.code(404).send({ error: 'deal not found' });
    if (deal.buyerId !== req.userId) return reply.code(403).send({ error: 'only buyer can confirm' });
    if (deal.status !== 'paid') return reply.code(400).send({ error: 'payment not completed yet' });

    await prisma.$transaction([
      prisma.deal.update({ where: { id: deal.id }, data: { status: 'confirmed' } }),
      prisma.listing.update({ where: { id: deal.listingId }, data: { status: 'sold' } }),
      prisma.user.update({ where: { id: deal.sellerId }, data: { trustScore: { increment: 2 } } }),
      prisma.user.update({ where: { id: deal.buyerId }, data: { trustScore: { increment: 1 } } }),
    ]);
    // In production: trigger Razorpay Route transfer to seller here.
    return { status: 'confirmed', message: 'Payment released to seller' };
  });

  // Buyer raises dispute.
  app.post('/deals/:id/dispute', { preHandler: authHook }, async (req, reply) => {
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!deal) return reply.code(404).send({ error: 'deal not found' });
    if (deal.buyerId !== req.userId) return reply.code(403).send({ error: 'only buyer can dispute' });
    if (deal.status !== 'paid') return reply.code(400).send({ error: 'payment not completed yet' });

    return prisma.deal.update({
      where: { id: deal.id },
      data: { status: 'disputed' },
    });
  });
}
