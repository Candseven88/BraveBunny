import Replicate from 'replicate';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, imageBase64 } = req.body;
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    let output;
    if (imageBase64) {
      // Image-to-image generation
      output = await replicate.run(
        "stability-ai/realistic-vision-v6.0-b1",
        {
          input: {
            image: imageBase64,
            prompt: `Children's book cover featuring: ${prompt}`,
            strength: 0.7,
            guidance_scale: 10
          }
        }
      );
    } else {
      // Text-to-image generation
      output = await replicate.run(
        "stability-ai/sdxl",
        {
          input: {
            prompt: `Children's book cover illustration of: ${prompt}, fairy tale style, colorful, magical`,
            negative_prompt: "text, watermark, signature"
          }
        }
      );
    }

    return res.status(200).json({ imageUrl: output[0] });
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ error: 'Failed to generate cover' });
  }
}