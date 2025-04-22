/**
 * BraveBunny Cover Image Generator
 * Generates story cover images using the Replicate API
 */

const axios = require('axios');

/**
 * Generates a cover image for a bedtime story
 * @param {Object} options - The generation options
 * @param {string} options.prompt - The text prompt describing the desired image
 * @param {string} [options.imageBase64] - Optional base64 encoded image for image-to-image transformation
 * @returns {Promise<Object>} - Object containing the image URL or error
 */
async function generateCover(options) {
  try {
    // Validate input
    if (!options || !options.prompt) {
      throw new Error('A prompt is required for image generation');
    }

    // Determine which model to use based on whether an image was provided
    const modelData = options.imageBase64 
      ? {
          model: "fofr/become-image",
          version: "a5b28021d5a8e428de6ed5b9a1fbc7b0a2d4545e1a16e0bb3fcd718e533f2c39", // Current version as of implementation
          input: {
            prompt: options.prompt,
            image: options.imageBase64,
            strength: 0.7 // Adjust the strength of transformation as needed
          }
        }
      : {
          model: "stability-ai/sdxl",
          version: "a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5", // Current version as of implementation
          input: {
            prompt: options.prompt,
            negative_prompt: "low quality, blurry, distorted, deformed",
            width: 768,
            height: 768,
            num_outputs: 1
          }
        };

    // Make the API request to start the prediction
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelData.version,
        input: modelData.input
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`
        }
      }
    );

    // Get the prediction ID from the response
    const predictionId = response.data.id;
    
    // Poll for the prediction result
    const imageUrl = await pollForResult(predictionId);
    
    return { imageUrl };
  } catch (error) {
    console.error('Error generating cover image:', error);
    return { error: `Failed to generate cover image: ${error.message}` };
  }
}

/**
 * Polls the Replicate API for the prediction result
 * @param {string} predictionId - The ID of the prediction to poll for
 * @returns {Promise<string>} - The URL of the generated image
 */
async function pollForResult(predictionId) {
  const maxAttempts = 30;
  const pollingInterval = 2000; // 2 seconds
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );
      
      const prediction = response.data;
      
      // Check if the prediction is complete
      if (prediction.status === 'succeeded') {
        // Return the first output image URL
        return prediction.output[0];
      } else if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error || 'Unknown error'}`);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    } catch (error) {
      throw new Error(`Error polling for prediction result: ${error.message}`);
    }
  }
  
  throw new Error('Prediction timed out after maximum polling attempts');
}

module.exports = { generateCover };