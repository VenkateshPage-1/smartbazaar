import { z } from 'zod';
import { prisma } from '../db.js';
import { authHook } from '../auth.js';

export default async function shopRoutes(app) {
  // Create or update your shop.
  app.post('/shops', { preHandler: authHook }, async (req) => {
    const data = z.object({
      name: z.string().min(2).max(60),
      description: z.string().default(''),
      category: z.string().default('general'),
      phone: z.string().min(10),
      address: z.string().default(''),
      city: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      deliveryKm: z.number().int().default(5),
      deliveryNote: z.string().default(''),
      logo: z.string().optional(),
    }).parse(req.body);

    return prisma.shop.upsert({
      where: { ownerId: req.userId },
      update: data,
      create: { ...data, ownerId: req.userId },
    });
  });

  // Get my shop.
  app.get('/shops/mine', { preHandler: authHook }, async (req, reply) => {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return reply.code(404).send({ error: 'no shop yet' });
    return shop;
  });

  // Browse all nearby shops.
  app.get('/shops', async (req) => {
    const { city, lat, lng } = req.query;
    const where = { active: true };
    if (city) where.city = city;
    let shops = await prisma.shop.findMany({
      where,
      include: {
        owner: { select: { name: true, trustScore: true, verified: true } },
        _count: { select: { listings: { where: { status: 'active' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lat && lng) {
      const uLat = parseFloat(lat), uLng = parseFloat(lng);
      const toRad = (x) => (x * Math.PI) / 180;
      const haversine = (lat1, lng1, lat2, lng2) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
      };
      shops = shops.map((s) => ({
        ...s,
        distanceKm: (s.lat != null && s.lng != null) ? Math.round(haversine(uLat, uLng, s.lat, s.lng) * 10) / 10 : null,
      }));
      shops.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return shops;
  });

  // View a single shop + its catalogue.
  app.get('/shops/:id', async (req, reply) => {
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { name: true, trustScore: true, verified: true } },
      },
    });
    if (!shop) return reply.code(404).send({ error: 'shop not found' });
    const items = await prisma.listing.findMany({
      where: { shopId: shop.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return {
      ...shop,
      items: items.map((l) => ({ ...l, images: JSON.parse(l.images || '[]') })),
    };
  });

  // Add item to shop catalogue (with stock count).
  app.post('/shops/items', { preHandler: authHook }, async (req, reply) => {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return reply.code(400).send({ error: 'create a shop first' });

    const data = z.object({
      title: z.string().min(1).max(80),
      description: z.string().default(''),
      category: z.string().default('other'),
      price: z.number().int().positive(),
      stock: z.number().int().min(0).default(1),
      condition: z.string().default('new'),
      images: z.array(z.string()).default([]),
      city: z.string().optional(),
    }).parse(req.body);

    return prisma.listing.create({
      data: {
        ...data,
        images: JSON.stringify(data.images),
        sellerId: req.userId,
        shopId: shop.id,
        city: data.city || shop.city,
      },
    });
  });

  // Update stock count for an item.
  app.patch('/shops/items/:id/stock', { preHandler: authHook }, async (req, reply) => {
    const item = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!item) return reply.code(404).send({ error: 'item not found' });
    if (item.sellerId !== req.userId) return reply.code(403).send({ error: 'not your item' });
    const { stock } = z.object({ stock: z.number().int().min(0) }).parse(req.body);
    return prisma.listing.update({
      where: { id: req.params.id },
      data: { stock, status: stock === 0 ? 'sold' : 'active' },
    });
  });
}
