import { z } from 'zod';
import { prisma } from '../db.js';
import { authHook } from '../auth.js';

// Reverse marketplace: buyer posts need, we match against active listings.
export default async function wantRoutes(app) {
  app.post('/wants', { preHandler: authHook }, async (req) => {
    const data = z.object({
      query: z.string().min(2),
      maxPrice: z.number().int().positive().optional(),
      category: z.string().optional(),
      city: z.string().optional(),
    }).parse(req.body);
    return prisma.want.create({ data: { ...data, buyerId: req.userId } });
  });

  app.get('/wants/:id/matches', { preHandler: authHook }, async (req, reply) => {
    const want = await prisma.want.findUnique({ where: { id: req.params.id } });
    if (!want) return reply.code(404).send({ error: 'not found' });
    const where = { status: 'active' };
    if (want.category) where.category = want.category;
    if (want.city) where.city = want.city;
    if (want.maxPrice) where.price = { lte: want.maxPrice };
    where.OR = [
      { title: { contains: want.query } },
      { description: { contains: want.query } },
    ];
    const items = await prisma.listing.findMany({ where, take: 50, orderBy: { createdAt: 'desc' } });
    return items.map((l) => ({ ...l, images: JSON.parse(l.images || '[]') }));
  });
}
