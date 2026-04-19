import { GoogleGenerativeAI } from '@google/generative-ai';

const key = process.env.GEMINI_API_KEY;
const genAI = key ? new GoogleGenerativeAI(key) : null;

const PROMPT = `You are an expert at creating second-hand marketplace listings for Indian users.
Look at the image and return ONLY valid JSON (no markdown, no code fence) with keys:
  title (string, <=60 chars, specific — include brand/model if visible),
  description (string, 2-3 sentences, honest about condition),
  category (one of: electronics, mobiles, vehicles, furniture, appliances, fashion, books, farm, livestock, other),
  condition (one of: new, like-new, good, fair, for-parts),
  suggestedPriceINR (integer, realistic Indian second-hand market price),
  priceRangeINR ([min, max] integers).
If the image is unclear or not a sellable product, return {"error":"unclear"}.`;

export async function generateListingFromImage(imageBase64, mimeType = 'image/jpeg') {
  if (!genAI) throw new Error('GEMINI_API_KEY not configured');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent([
    PROMPT,
    { inlineData: { data: imageBase64, mimeType } },
  ]);
  const text = result.response.text().trim().replace(/^```json\s*|\s*```$/g, '');
  return JSON.parse(text);
}
