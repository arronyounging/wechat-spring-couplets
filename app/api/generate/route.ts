import { NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: Request) {
  try {
    const { keywords } = await req.json();

    if (!keywords || typeof keywords !== 'string') {
      return NextResponse.json(
        { error: '请输入关键词' },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      );
    }

    const prompt = `作为一个专业的春联创作助手，请根据关键词"${keywords}"创作4副新年春联。

要求如下：

格式规范：
1. 每副春联分上下联，字数相等
2. 每联最多7个汉字（保证显示效果）
3. 上下联用逗号分隔，每副春联占一行
4. 严格遵守对仗规则，音律和谐
5. 确保吉利祥和，寓意积极向上

风格类型（每种风格各生成一副）：
1. 网感春联：运用当代网络流行语，富有新意
2. 梗图春联：基于流行梗图和段子，幽默有趣
3. 职场春联：反映当代职场生活，共鸣感强
4. 生活春联：贴近年轻人日常，轻松温暖

参考示例（仅供格式参考）：
摸鱼整天不加班，躺平全年能发财
早起刷题不秃头，晚来追剧能自愈
效率爆表KPI高，晋升加薪两不误
外卖早午配晚餐，快乐又胖两相宜

注意事项：
1. 直接输出4行春联，不要其他任何文字
2. 确保每副春联独立成行
3. 避免重复或相似的内容
4. 保持语言简洁有力
5. 融入关键词相关元素

请基于以上要求创作4副春联：`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.SITE_URL || '',
          'X-Title': process.env.SITE_NAME || '新年头像编辑器',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专门创作春联的AI助手，特别擅长创作有趣、吉利、朗朗上口的春联。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 200,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const couplets = data.choices[0].message.content?.trim().split('\n');

      if (!couplets || couplets.length === 0) {
        throw new Error('No couplets generated');
      }

      return NextResponse.json({ couplets });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: '生成超时，请重试' },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating couplets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成春联失败，请重试' },
      { status: 500 }
    );
  }
}
