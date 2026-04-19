import { z } from 'zod';
import { prisma } from '../db.js';
import { authHook } from '../auth.js';
import { generateListingFromImage } from '../ai.js';

const ListingInput = z.object({
  title: z.string().min(1).max(80),
  description: z.string().default(''),
  category: z.string().default('other'),
  price: z.number().int().positive(),
  condition: z.string().default('used'),
  images: z.array(z.string()).default([]),
  lat: z.number().optional(),
  lng: z.number().optional(),
  city: z.string().optional(),
  aiGenerated: z.boolean().default(false),
});

// Haversine distance in km
const distKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371, toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export default async function listingRoutes(app) {
  app.get('/listings', async (req) => {
    const { q, category, city, lat, lng, radiusKm, shopIds } = req.query;
    const where = { status: 'active' };
    if (category) where.category = category;
    if (city) where.city = city;
    if (shopIds) where.shopId = { in: shopIds.split(',') };
    if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];

    let items = await prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, trustScore: true, verified: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    items = items.map((l) => ({ ...l, images: JSON.parse(l.images || '[]') }));

    if (lat && lng && radiusKm) {
      const la = parseFloat(lat), lo = parseFloat(lng), r = parseFloat(radiusKm);
      items = items
        .filter((l) => l.lat != null && l.lng != null)
        .map((l) => ({ ...l, distanceKm: distKm(la, lo, l.lat, l.lng) }))
        .filter((l) => l.distanceKm <= r)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return items;
  });

  app.get('/listings/:id', async (req, reply) => {
    const l = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { seller: { select: { id: true, name: true, trustScore: true, verified: true } } },
    });
    if (!l) return reply.code(404).send({ error: 'not found' });
    return { ...l, images: JSON.parse(l.images || '[]') };
  });

  app.post('/listings', { preHandler: authHook }, async (req) => {
    const data = ListingInput.parse(req.body);
    return prisma.listing.create({
      data: { ...data, images: JSON.stringify(data.images), sellerId: req.userId },
    });
  });

  app.patch('/listings/:id', { preHandler: authHook }, async (req, reply) => {
    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.code(404).send({ error: 'not found' });
    if (existing.sellerId !== req.userId) return reply.code(403).send({ error: 'forbidden' });
    const patch = ListingInput.partial().parse(req.body);
    if (patch.images) patch.images = JSON.stringify(patch.images);
    return prisma.listing.update({ where: { id: req.params.id }, data: patch });
  });

  // The AI differentiator: point camera → get a ready-to-post listing.
  app.post('/ai/analyze-image', { preHandler: authHook }, async (req, reply) => {
    const { imageBase64, mimeType } = z.object({
      imageBase64: z.string().min(100),
      mimeType: z.string().default('image/jpeg'),
    }).parse(req.body);
    try {
      const result = await generateListingFromImage(imageBase64, mimeType);
      return result;
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: 'ai analysis failed', detail: err.message });
    }
  });
}
