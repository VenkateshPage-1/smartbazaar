import { v2 as cloudinary } from 'cloudinary';
import { authHook } from '../auth.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function uploadRoutes(app) {
  // Upload base64 image → returns Cloudinary URL.
  app.post('/upload', { preHandler: authHook }, async (req, reply) => {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) return reply.code(400).send({ error: 'imageBase64 required' });

    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'smartbazaar',
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    });
    return { url: result.secure_url };
  });
}
