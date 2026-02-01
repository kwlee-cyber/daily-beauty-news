import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_SOURCES = [
  { name: 'Instagram - Feed 1', url: 'https://rss.app/feeds/5m99kXlkM6N99jIe.xml' },
  { name: 'Instagram - Feed 2', url: 'https://rss.app/feeds/dFjmfkZ6nHTvI9KE.xml' },
  { name: 'Cosmopolitan Beauty', url: 'https://www.cosmopolitan.com/rss/style-beauty.xml' },
  { name: 'Vogue Beauty', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure News', url: 'https://www.allure.com/feed/rss' },
  { name: 'Global Cosmetics News', url: 'https://www.globalcosmeticsnews.com/feed/' },
  { name: 'Cosmetics & Toiletries', url: 'https://www.cosmeticsandtoiletries.com/rss/all.xml' },
  { name: 'Beauty Packaging', url: 'https://www.beautypackaging.com/rss/all.xml' }
];

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json([{ title: "Key Missing", summary: "Vercel 설정에 GEMINI_API_KEY가 없습니다.", source: "System" }]);

  try {
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 1).map(item => {
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const match = item.content?.match(imgRegex) || item['content:encoded']?.match(imgRegex);
          return {
            title: item.title || "No Title",
            content: (item.contentSnippet || item.snippet || "").substring(0, 800),
            source: source.name,
            link: item.link,
            thumbnail: match ? match[1] : (item.enclosure ? item.enclosure.url : null)
          };
        });
      } catch (e) { return []; }
    });

    const rawNews = (await Promise.all(requests)).flat();

    const summarizedNews = await Promise.all(rawNews.map(async (news: any) => {
      try {
        // 주소에 v1beta와 모델명을 정확히 명시합니다.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `너는 뷰티 전문 에디터야. 다음 뉴스/포스트를 한국어로 분석해서 출력해. 반드시 아래 형식을 지켜.
[제목]: 자연스러운 한국어 번역 제목
[요약]: 핵심 내용 3줄 요약

뉴스 원문:
${news.title}
${news.content}`
              }]
            }]
          })
        });
        
        const data = await response.json();
        
        if (data.error) {
          return { ...news, summary: `Gemini API Error: ${data.error.message}` };
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        const titleMatch = aiResponse.match(/\[제목\]:(.*)/);
        const finalTitle = titleMatch ? titleMatch[1].trim() : news.title;
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;

        return { ...news, title: finalTitle, summary: summaryPart.trim() };
      } catch (e) {
        return { ...news, summary: "AI 요약 처리 중 오류가 발생했습니다." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error) {
    return NextResponse.json({ error: "데이터 로드 실패" }, { status: 500 });
  }
}