/**
 * BraveBunny Frontend Controller
 * Manages user flow and integrates all modules for the story generation app
 */

// Import required modules
import { initializeAuth } from './auth.js';
import { canGenerate, recordGeneration, recordShare, getUsageStats } from './usage-limiter.js';
import { generateStory } from './story-api.js';
import { generateCover } from './generate-cover.js';
import { generatePDF, generateShareImage } from './pdf-generator.js';

// Store user UID globally after authentication
let currentUserUID = null;

// DOM Elements
const storyForm = document.getElementById('storyForm');
const generateButton = document.getElementById('generateButton');
const shareButton = document.getElementById('shareButton');
const storyContainer = document.getElementById('storyContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');

/**
 * Initializes the application
 */
async function initializeApp() {
  try {
    // Initialize Firebase authentication
    currentUserUID = await initializeAuth();
    
    // Enable form after authentication
    storyForm.classList.remove('disabled');
    
    // Update UI based on usage limits
    await updateUsageUI();
  } catch (error) {
    showError('Failed to initialize app. Please refresh the page.');
    console.error('Initialization error:', error);
  }
}

/**
 * Updates UI elements based on current usage limits
 */
async function updateUsageUI() {
  try {
    const canGenerateStory = await canGenerate(currentUserUID);
    generateButton.disabled = !canGenerateStory;
    
    const stats = await getUsageStats(currentUserUID);
    updateStatsDisplay(stats);
  } catch (error) {
    console.error('Error updating UI:', error);
  }
}

/**
 * Handles story generation form submission
 * @param {Event} event - Form submission event
 */
async function handleStoryGeneration(event) {
  event.preventDefault();
  
  // Show loading state
  setLoadingState(true);
  
  try {
    // Check if user can generate
    if (!await canGenerate(currentUserUID)) {
      showError('Monthly story limit reached. Share stories to unlock more!');
      return;
    }
    
    // Get form data
    const formData = new FormData(storyForm);
    const storyData = {
      name: formData.get('childName'),
      gender: formData.get('gender'),
      keywords: formData.get('keywords')
    };
    
    // Generate story
    const story = await generateStory(storyData);
    if (story.error) throw new Error(story.error);
    
    // Generate cover image
    const imageFile = formData.get('childImage');
    const coverOptions = {
      prompt: `A children's story about ${storyData.name}: ${storyData.keywords}`,
      imageBase64: imageFile ? await convertToBase64(imageFile) : null
    };
    const cover = await generateCover(coverOptions);
    if (cover.error) throw new Error(cover.error);
    
    // Generate downloadable files
    await Promise.all([
      generatePDF({ 
        title: story.title, 
        content: story.content, 
        imageUrl: cover.imageUrl 
      }),
      generateShareImage({ 
        title: story.title, 
        excerpt: story.content.substring(0, 100) + '...', 
        imageUrl: cover.imageUrl 
      })
    ]);
    
    // Record generation
    await recordGeneration(currentUserUID);
    
    // Update UI
    renderStory(story, cover.imageUrl);
    await updateUsageUI();
    
  } catch (error) {
    showError('Failed to generate story. Please try again.');
    console.error('Generation error:', error);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Handles social media share button click
 */
async function handleShare() {
  setLoadingState(true, shareButton);
  
  try {
    await recordShare(currentUserUID);
    await updateUsageUI();
    showSuccess('Thank you for sharing! You\'ve unlocked additional story generations.');
  } catch (error) {
    showError('Failed to record share. Please try again.');
    console.error('Share error:', error);
  } finally {
    setLoadingState(false, shareButton);
  }
}

/**
 * Renders the story and cover image in the UI
 * @param {Object} story - Story object with title and content
 * @param {string} coverUrl - URL of the cover image
 */
function renderStory(story, coverUrl) {
  storyContainer.innerHTML = `
    <img src="${coverUrl}" alt="Story Cover" class="story-cover">
    <h1>${story.title}</h1>
    <div class="story-content">${story.content}</div>
  `;
  storyContainer.classList.remove('hidden');
}

/**
 * Updates the display of usage statistics
 * @param {Object} stats - Usage statistics object
 */
function updateStatsDisplay(stats) {
  const statsElement = document.getElementById('usageStats');
  statsElement.textContent = `Stories this month: ${stats.monthlyGenerations}/6 | Shares: ${stats.shareCount}`;
}

/**
 * Converts a file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string
 */
function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Shows an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
  errorAlert.textContent = message;
  errorAlert.classList.remove('hidden');
  setTimeout(() => errorAlert.classList.add('hidden'), 5000);
}

/**
 * Shows a success message to the user
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
  // Assuming you have a success alert element
  const successAlert = document.getElementById('successAlert');
  successAlert.textContent = message;
  successAlert.classList.remove('hidden');
  setTimeout(() => successAlert.classList.add('hidden'), 5000);
}

/**
 * Sets loading state for buttons
 * @param {boolean} isLoading - Whether loading state should be shown
 * @param {HTMLElement} [button] - Specific button to update (optional)
 */
function setLoadingState(isLoading, button = generateButton) {
  button.disabled = isLoading;
  loadingSpinner.classList.toggle('hidden', !isLoading);
  button.textContent = isLoading ? 'Please wait...' : button.dataset.originalText;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
storyForm.addEventListener('submit', handleStoryGeneration);
shareButton.addEventListener('click', handleShare);

// Store original button text
document.querySelectorAll('button').forEach(button => {
  button.dataset.originalText = button.textContent;
});