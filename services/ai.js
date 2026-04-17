const config = require('../config/default');

async function generateStory({ date, location, tags, imageDescription }) {
  if (!config.ai.apiKey) {
    return generateFallback({ date, location, tags });
  }

  const systemPrompt = `你是一位温暖而克制的日记作者，为一对情侣的博客撰写故事。
要求：
- 使用中文
- 用"我们"的第一人称复数视角
- 风格真实、克制、温暖，像日记而非营销文案
- 2-3段，每段2-3句话
- 避免夸张和华丽辞藻
- 注重细节和感受`;

  const userMessage = `请根据以下信息写一段日记：
时间：${date || '未指定'}
地点：${location || '未指定'}
标签：${(tags || []).join('、') || '无'}
${imageDescription ? `图片描述：${imageDescription}` : ''}

请写出真实、克制、温暖的叙事短文。`;

  try {
    const response = await fetch(config.ai.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      return generateFallback({ date, location, tags });
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    return generateFallback({ date, location, tags });
  }
}

function generateFallback({ date, location, tags }) {
  const loc = location ? `在${location}` : '在那个地方';
  const d = date || '那一天';
  const tagHints = (tags && tags.length > 0) ? tags.slice(0, 2) : [];

  const templates = [
    `${d}，我们${loc}。\n\n阳光很好，空气里有一种说不出的味道，让人想慢下来。\n\n我们没有说太多话，只是走在一起，感受着周围的一切。${tagHints.length > 0 ? `\n\n关于${tagHints.join('和')}的记忆，就这样安静地留了下来。` : ''}`,
    `来到${location || '这里'}的时候，天色正好。\n\n${d}的光线落在所有东西上，让一切都变得柔和。\n\n我们在这里走了很久，没有目的地，只是想一起多待一会儿。`,
    `${location || '那个地方'}给人一种安静的感觉。\n\n${d}，我们到达的时候，周围很少有人。\n\n我们找了一个地方坐下来，看着远处，什么也没说，但心里很满。`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

module.exports = { generateStory };
