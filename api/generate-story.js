// ... existing code ...

// 修改系统提示词为英文
const SYSTEM_PROMPT = `You are a children's story author. Create engaging fairy tales in English for ages 4-8. 
Format: First line as story title (without markdown), then the story content.`;

// 修改返回格式
const storyParts = story.split('\n');
return res.status(200).json({ 
  title: storyParts[0] || 'Untitled Story',
  content: storyParts.slice(1).join('\n') 
});

// 错误处理标准化
} catch (error) {
  console.error('API Error Details:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  return res.status(500).json({
    error: 'Story service temporarily unavailable',
    code: 'SERVICE_ERROR',
    requestId: req.headers['x-vercel-id'] || 'unknown'
  });
}
// ... existing code ...