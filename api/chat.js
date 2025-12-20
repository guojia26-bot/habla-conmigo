export default async function handler(req, res) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ 
      content: [{ text: '请求格式错误，请重试' }] 
    });
  }

  const fullMessages = system 
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return res.status(200).json({ 
      content: [{ text: '服务器配置错误：缺少API密钥，请联系管理员' }] 
    });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // 快速响应模型
        messages: fullMessages,
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API Error:', data);
      return res.status(200).json({
        content: [{ text: `AI服务暂时不可用: ${data.error?.message || '请稍后重试'}` }]
      });
    }

    const text = data.choices?.[0]?.message?.content || '抱歉，我没有理解，请再说一次。';

    return res.status(200).json({
      content: [{ text }]
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(200).json({
      content: [{ text: '网络连接失败，请检查网络后重试' }]
    });
  }
}
