/**
 * BraveBunny Story Generator API
 * Generates personalized bedtime stories for children using the DeepSeek API
 */

const axios = require('axios');

/**
 * Generates a personalized bedtime story based on the provided data
 * @param {Object} data - The story parameters
 * @param {string} data.name - Child's name
 * @param {string} data.gender - Child's gender
 * @param {string} data.keywords - Keywords to include in the story
 * @returns {Promise<Object>} - Object containing title and content, or error
 */
async function generateStory(data) {
  try {
    // Validate input data
    if (!data || !data.name || !data.gender || !data.keywords) {
      throw new Error('Missing required story parameters');
    }

    // Create the prompt for the story generation
    const prompt = `Create a bedtime story where a brave ${data.gender} named ${data.name} goes on a magical adventure. Include: ${data.keywords}. The story should be inspirational, imaginative, gentle, and around 300–500 words.`;

    // Prepare the request payload
    const payload = {
      model: "deepseek-chat",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1000
    };

    // Make the API request
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    // Extract the story content from the response
    const storyText = response.data.choices[0].message.content;
    
    // Process the story to extract title and content
    const { title, content } = extractTitleAndContent(storyText, data.name);

    return { title, content };
  } catch (error) {
    console.error('Error generating story:', error);
    return { error: `Failed to generate story: ${error.message}` };
  }
}

/**
 * Extracts title and content from the generated story text
 * @param {string} storyText - The raw story text from the API
 * @param {string} name - The child's name (for fallback title)
 * @returns {Object} - Object with title and content properties
 */
function extractTitleAndContent(storyText, name) {
  // Check if the story has a clear title-content separation
  if (storyText.includes('\n\n')) {
    const [title, ...contentParts] = storyText.split('\n\n');
    return {
      title: title.replace(/^#\s*|^Title:\s*/i, '').trim(),
      content: contentParts.join('\n\n').trim()
    };
  }
  
  // Try to extract the first line as title
  const lines = storyText.split('\n');
  const firstLine = lines[0].trim();
  
  // If first line looks like a title (short, no period at end)
  if (firstLine.length < 100 && !firstLine.endsWith('.')) {
    return {
      title: firstLine.replace(/^#\s*|^Title:\s*/i, ''),
      content: lines.slice(1).join('\n').trim()
    };
  }
  
  // Fallback: create a generic title and use the whole text as content
  return {
    title: `${name}'s Magical Adventure`,
    content: storyText.trim()
  };
}

module.exports = { generateStory };