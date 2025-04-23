/**
 * BraveBunny Story Generation API
 * Generates children's stories using the Deepseek Chat API
 */

import axios from 'axios';

/**
 * Story generation API endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Story prompt is required' });
    }

    // Prepare the request to Deepseek API
    const payload = {
      model: "deepseek-chat",
      messages: [
        { 
          role: "user", 
          content: `Create a children's bedtime story based on this prompt: ${prompt}. The story should be gentle, imaginative, and around 300-500 words.`
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    };

    // Call Deepseek API
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        validateStatus: false // Don't throw on non-2xx status
      }
    );

    // Handle non-200 responses from Deepseek
    if (response.status !== 200) {
      console.error('Deepseek API error:', response.status, response.data);
      return res.status(500).json({ 
        error: 'Story generation service is temporarily unavailable' 
      });
    }

    // Ensure we have a valid response structure
    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('Invalid Deepseek response structure:', response.data);
      return res.status(500).json({ 
        error: 'Received invalid response from story generation service' 
      });
    }

    // Extract story content
    const storyText = response.data.choices[0].message.content.trim();
    
    // Split into title and content
    const lines = storyText.split('\n').filter(line => line.trim());
    
    // Extract title (first non-empty line)
    const title = lines[0].replace(/^#\s*|^Title:\s*/i, '').trim();
    
    // Combine remaining lines as content
    const content = lines.slice(1).join('\n').trim();

    // Return formatted story
    return res.status(200).json({
      title,
      content
    });

  } catch (error) {
    // Log the full error for debugging
    console.error('Story generation error:', error);

    // Return user-friendly error message
    return res.status(500).json({
      error: 'Failed to generate story. Please try again later.'
    });
  }
}