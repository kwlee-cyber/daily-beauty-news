import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_SOURCES = [
  { name: 'Vogue Beauty', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure', url: 'https://www.allure.com/feed/rss' },
  { name: 'Global Cosmetics News', url: 'https://www.globalcosmeticsnews.com/feed/' },
  { name: 'C&T Science', url: 'https://www.cosmeticsandtoiletries.com/rss/all.xml' }
];

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json([{ title: "설정 오류", summary: "Vercel에 GEMINI_API_KEY를 등록해주세요.", source: "System" }]);
  }

  try {
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 1).map(item => ({
          title: item.title || "No Title",
          content: (item.contentSnippet || item.snippet || "").substring(0, 1000),
          source: source.name,
          link: item.link,
          thumbnail: (item.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1] || null
        }));
      } catch (e) { return []; }
    });

    const rawNews = (await Promise.all(requests)).flat();

    const summarizedNews = await Promise.all(rawNews.map(async (news: any) => {
      try {
        // 가장 안정적인 주소 형식으로 시도 (v1beta)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Translate title to Korean and summarize in 3 bullet points in Korean.\n\nTitle: ${news.title}\nContent: ${news.content}` }] }]
          })
        });
        
        const data = await response.json();

        // 🚨 구체적인 에러 메시지를 사용자에게 보여줍니다.
        if (data.error) {
          return { ...news, summary: `구글 에러(${data.error.code}): ${data.error.message}` };
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        return { ...news, summary: aiResponse };
      } catch (e) {
        return { ...news, summary: "연결 실패: API 키나 네트워크를 확인하세요." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error) { 
    return NextResponse.json({ error: "뉴스 로드 실패" }, { status: 500 });
  }
}