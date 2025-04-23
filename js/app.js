async function generateStory() {
  const prompt = document.getElementById('prompt').value;
  const resultDiv = document.getElementById('result');
  
  try {
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    // 添加响应内容类型检查
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Invalid response: ${text.substring(0, 100)}`);
    }

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
    resultDiv.innerHTML = `Error: ${error.message.replace(/"/g, '')}`;
    resultDiv.className = 'error';
  }
  resultDiv.classList.remove('hidden');
}