import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_SOURCES = [
  { name: 'Vogue', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure', url: 'https://www.allure.com/feed/rss' },
  { name: 'Cosmetics News', url: 'https://www.globalcosmeticsnews.com/feed/' }
];

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY; // 다시 그록 키를 사용합니다.
  if (!apiKey) return NextResponse.json([{ title: "키 오류", summary: "Vercel 설정에 GROQ_API_KEY가 없습니다.", source: "System" }]);

  try {
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 1).map(item => ({
          title: item.title || "No Title",
          content: (item.contentSnippet || "").substring(0, 500),
          source: source.name,
          link: item.link,
          thumbnail: (item.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1] || null
        }));
      } catch (e) { return []; }
    });

    const rawNews = (await Promise.all(requests)).flat();

    const summarizedNews = await Promise.all(rawNews.map(async (news: any) => {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: `한글로 번역 및 요약해줘.\n[제목]: 한글제목\n[요약]: 요약내용\n\n제목: ${news.title}\n내용: ${news.content}` }]
          })
        });
        
        const data = await response.json();
        if (data.error) return { ...news, summary: "그록 할당량 초과(내일 다시 시도)" };

        const aiResponse = data.choices[0].message.content;
        return { ...news, summary: aiResponse };
      } catch (e) { return { ...news, summary: "요약 실패" }; }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error) { return NextResponse.json({ error: "실패" }, { status: 500 }); }
}