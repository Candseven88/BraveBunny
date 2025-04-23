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
    // API key format validation
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.error('Invalid API Key:', apiKey ? `${apiKey.slice(0, 8)}...` : 'undefined');
      return res.status(500).json({
        error: 'Story service configuration error'
      });
    }
    
    // Remove these Chinese comment blocks
    // 新增 JSON 响应强制解析
    // Remove this entire transformResponse block
    // 删除这个残留的transformResponse配置块（65-73行）
    transformResponse: [data => {
      try {
        return JSON.parse(data);
      } catch (e) {
        return { error: `Invalid JSON response: ${data.substring(0, 100)}` };
      }
    }]

    // Prepare DeepSeek API request payload
    const payload = {
      model: 'deepseek-chat',  // 修正模型名称
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
    // 修正后的API调用配置（移除残留的transformResponse）
    console.log('Calling DeepSeek API at:', DEEPSEEK_API_URL);
    console.log('API Request Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.slice(0, 8)}...`
    });
    
    // Remove all transformResponse blocks
    const response = await axios.post(DEEPSEEK_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      responseType: 'json',
      validateStatus: () => true,
      timeout: 10000  // 新增超时设置
    });

    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', response.headers);

    // 删除残留的重复配置
    if (!response.data || typeof response.data !== 'object') {
      console.error('Invalid API response:', response.data);
      return res.status(500).json({ 
        error: 'Story generation service unavailable' 
      });
    }

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
    let errorMessage;
    try {
      errorMessage = JSON.stringify({
        type: error.name,
        message: error.message,
        stack: error.stack
      });
    } catch {
      errorMessage = '"Unknown error"';
    }
    
    return res.status(500).json({
      error: errorMessage.substring(0, 200)
    });
  }
}