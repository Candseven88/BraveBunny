/**
 * BraveBunny Story Generation API
 * Generates children's stories using the DeepSeek Chat API
 */

import axios from 'axios';

// Constants
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const SYSTEM_PROMPT = 'You are a helpful assistant that writes bedtime stories for children aged 4-8. Keep it friendly, simple, and imaginative.';

/**
 * Story generation API endpoint handler
 * @param {Object} req - Next.js/Express request object
 * @param {Object} res - Next.js/Express response object
 */
export default async function handler(req, res) {
  // Set response header
  res.setHeader('Content-Type', 'application/json');

  // Validate request method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Please use POST.'
    });
  }

  try {
    // Validate request body and prompt
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Please provide a valid story prompt.'
      });
    }

    // Validate API key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Story generation service is not properly configured.'
      });
    }

    // Prepare DeepSeek API request payload
    const payload = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    };

    // Call DeepSeek API
    const response = await axios.post(DEEPSEEK_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      validateStatus: null // Allow any status code
    });

    // Handle API errors
    if (response.status !== 200) {
      console.error('DeepSeek API error:', {
        status: response.status,
        data: response.data
      });

      // Handle specific error cases
      switch (response.status) {
        case 401:
          return res.status(500).json({
            error: 'Story generation service authentication failed.'
          });
        case 429:
          return res.status(429).json({
            error: 'Too many requests. Please try again later.'
          });
        default:
          return res.status(500).json({
            error: 'Failed to generate story. Please try again later.'
          });
      }
    }

    // Validate response structure
    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('Invalid DeepSeek response structure:', response.data);
      return res.status(500).json({
        error: 'Received invalid response from story service.'
      });
    }

    // Extract and clean up the story
    const story = response.data.choices[0].message.content.trim();

    // Return the story
    return res.status(200).json({ story });

  } catch (error) {
    // Log error for debugging
    console.error('Story generation error:', error);

    // Return user-friendly error message
    return res.status(500).json({
      error: 'An unexpected error occurred while generating your story. Please try again.'
    });
  }
}