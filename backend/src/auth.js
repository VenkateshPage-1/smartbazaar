import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(userId) {
  return jwt.sign({ uid: userId }, SECRET, { expiresIn: '30d' });
}

export async function authHook(req, reply) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return reply.code(401).send({ error: 'missing token' });
  try {
    const { uid } = jwt.verify(h.slice(7), SECRET);
    req.userId = uid;
  } catch {
    return reply.code(401).send({ error: 'invalid token' });
  }
}
