/**
 * BraveBunny PDF and Share Image Generator
 * Generates downloadable PDFs and social media share images for children's stories
 */

// Import required libraries
import { jsPDF } from 'jspdf';
import domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';

// PDF styling constants
const PDF_STYLES = {
  titleFont: 'Comic Sans MS',
  contentFont: 'Arial',
  titleSize: 24,
  contentSize: 14,
  margin: 20,
  imageWidth: 170,
  imageHeight: 170,
  pageWidth: 210,
  lineHeight: 1.5
};

/**
 * Generates a PDF file containing the story cover image and content
 * @param {Object} options - The PDF generation options
 * @param {string} options.title - The story title
 * @param {string} options.content - The story content
 * @param {string} options.imageUrl - URL of the story cover image
 * @returns {Promise<void>} - Resolves when PDF is downloaded
 */
export async function generatePDF({ title, content, imageUrl }) {
  try {
    const doc = new jsPDF();
    const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;

    // Load and add the cover image
    const image = await loadImage(imageUrl);
    doc.addImage(
      image,
      'JPEG',
      (PDF_STYLES.pageWidth - PDF_STYLES.imageWidth) / 2,
      PDF_STYLES.margin,
      PDF_STYLES.imageWidth,
      PDF_STYLES.imageHeight
    );

    // Add title
    doc.setFont(PDF_STYLES.titleFont);
    doc.setFontSize(PDF_STYLES.titleSize);
    doc.text(title, PDF_STYLES.margin, PDF_STYLES.margin * 2 + PDF_STYLES.imageHeight);

    // Add content with word wrapping and pagination
    doc.setFont(PDF_STYLES.contentFont);
    doc.setFontSize(PDF_STYLES.contentSize);
    const startY = PDF_STYLES.margin * 2.5 + PDF_STYLES.imageHeight;
    const splitText = doc.splitTextToSize(
      content,
      doc.internal.pageSize.width - PDF_STYLES.margin * 2
    );

    doc.text(splitText, PDF_STYLES.margin, startY);

    // Save the PDF
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generates a square share image for social media
 * @param {Object} options - The share image generation options
 * @param {string} options.title - The story title
 * @param {string} options.excerpt - Short excerpt or summary of the story
 * @param {string} options.imageUrl - URL of the story cover image
 * @returns {Promise<void>} - Resolves when image is downloaded
 */
export async function generateShareImage({ title, excerpt, imageUrl }) {
  try {
    // Create temporary container
    const container = createShareImageContainer(title, excerpt, imageUrl);
    document.body.appendChild(container);

    // Generate image
    const dataUrl = await domtoimage.toPng(container, {
      width: 1080,
      height: 1080,
      quality: 1.0,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });

    // Clean up temporary container
    document.body.removeChild(container);

    // Download image
    const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-share.png`;
    saveAs(dataUrl, fileName);
  } catch (error) {
    console.error('Error generating share image:', error);
    throw new Error('Failed to generate share image');
  }
}

/**
 * Creates a DOM container for the share image
 * @private
 */
function createShareImageContainer(title, excerpt, imageUrl) {
  const container = document.createElement('div');
  container.style.cssText = `
    width: 1080px;
    height: 1080px;
    background: white;
    position: fixed;
    top: -9999px;
    left: -9999px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    box-sizing: border-box;
    font-family: 'Comic Sans MS', cursive;
  `;

  // Add image
  const img = document.createElement('img');
  img.src = imageUrl;
  img.style.cssText = `
    width: 600px;
    height: 600px;
    object-fit: cover;
    border-radius: 20px;
    margin-bottom: 30px;
  `;
  container.appendChild(img);

  // Add title
  const titleElement = document.createElement('h1');
  titleElement.textContent = title;
  titleElement.style.cssText = `
    font-size: 48px;
    color: #333;
    margin: 0 0 20px 0;
    text-align: center;
    max-width: 900px;
  `;
  container.appendChild(titleElement);

  // Add excerpt
  const excerptElement = document.createElement('p');
  excerptElement.textContent = excerpt;
  excerptElement.style.cssText = `
    font-size: 24px;
    color: #666;
    margin: 0;
    text-align: center;
    max-width: 800px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `;
  container.appendChild(excerptElement);

  return container;
}

/**
 * Loads an image from a URL
 * @private
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}