document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('cover-generator');
  const imageInput = document.getElementById('cover-image');
  const promptInput = document.getElementById('cover-prompt');
  const generateBtn = document.getElementById('generate-btn');
  const resultContainer = document.getElementById('cover-result');
  const loadingSpinner = document.getElementById('loading-spinner');

  generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert('Please enter a story prompt');
      return;
    }

    loadingSpinner.style.display = 'block';
    resultContainer.innerHTML = '';

    try {
      let imageBase64 = null;
      if (imageInput.files[0]) {
        imageBase64 = await convertToBase64(imageInput.files[0]);
      }

      const response = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          imageBase64
        }),
      });

      const { imageUrl, error } = await response.json();
      if (error) throw new Error(error);

      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = 'Generated cover image';
      img.className = 'generated-cover';
      resultContainer.appendChild(img);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate cover. Please try again.');
    } finally {
      loadingSpinner.style.display = 'none';
    }
  });
});

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}