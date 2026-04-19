import { z } from 'zod';
import { prisma } from '../db.js';
import { signToken } from '../auth.js';

export default async function authRoutes(app) {
  // Dev flow: request OTP. In prod, wire MSG91/Twilio here.
  app.post('/auth/request-otp', async (req, reply) => {
    const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60_000);
    await prisma.otpCode.upsert({
      where: { phone },
      update: { code, expiresAt },
      create: { phone, code, expiresAt },
    });
    // Dev only — return code in response. Remove before shipping.
    return { ok: true, devCode: code };
  });

  app.post('/auth/quick-register', async (req) => {
    const { phone, name } = z.object({
      phone: z.string().min(10),
      name: z.string().min(1),
    }).parse(req.body);

    const user = await prisma.user.upsert({
      where: { phone },
      update: { name },
      create: { phone, name },
    });
    return { token: signToken(user.id), user };
  });

  app.post('/auth/verify-otp', async (req, reply) => {
    const { phone, code, name } = z.object({
      phone: z.string().min(10),
      code: z.string().length(6),
      name: z.string().optional(),
    }).parse(req.body);

    const row = await prisma.otpCode.findUnique({ where: { phone } });
    if (!row || row.code !== code || row.expiresAt < new Date()) {
      return reply.code(401).send({ error: 'invalid or expired code' });
    }
    await prisma.otpCode.delete({ where: { phone } });

    const user = await prisma.user.upsert({
      where: { phone },
      update: name ? { name } : {},
      create: { phone, name, verified: true },
    });
    return { token: signToken(user.id), user };
  });
}
