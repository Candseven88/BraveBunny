async function generateStory() {
  const prompt = document.getElementById('prompt').value;
  const resultDiv = document.getElementById('result');
  
  try {
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    
    if (response.ok) {
      resultDiv.innerHTML = `
        <h3>${data.title}</h3>
        <p>${data.content.replace(/\n/g, '<br>')}</p>
      `;
      resultDiv.className = 'success';
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
    resultDiv.className = 'error';
  }
  resultDiv.classList.remove('hidden');
}