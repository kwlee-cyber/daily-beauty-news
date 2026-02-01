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
  if (!apiKey) return NextResponse.json([{ title: "환경변수 오류", summary: "Vercel 설정에 GEMINI_API_KEY가 없습니다.", source: "System" }]);

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
        // v1beta 주소와 gemini-1.5-flash 모델의 조합이 가장 확실합니다.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `너는 뷰티 기술 에디터야. 다음 뉴스를 한글로 요약해줘.\n\n제목: ${news.title}\n내용: ${news.content}`
              }]
            }]
          })
        });
        
        const data = await response.json();

        if (data.error) {
          return { ...news, summary: `구글 에러: ${data.error.message}` };
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        return { ...news, summary: aiResponse };
      } catch (e) {
        return { ...news, summary: "AI 서버 연결에 실패했습니다." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error) { 
    return NextResponse.json({ error: "뉴스 수집 실패" }, { status: 500 });
  }
}