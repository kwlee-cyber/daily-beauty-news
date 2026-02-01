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
  if (!apiKey) return NextResponse.json([{ title: "환경변수 오류", summary: "Vercel 설정에 GEMINI_API_KEY가 없습니다.", source: "System" }]);

  try {
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 1).map(item => {
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const match = item.content?.match(imgRegex) || item['content:encoded']?.match(imgRegex);
          return {
            title: item.title || "No Title",
            content: (item.contentSnippet || item.snippet || item.content || "").substring(0, 1000),
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
        // 💡 중요: 주소 형식을 아래와 같이 정확히 맞춰야 1.5-flash 모델이 응답합니다.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `너는 뷰티 에디터야. 아래 내용을 한국어로 분석해서 출력해. 
                1. [제목]: 한글로 번역한 핵심 제목
                2. [요약]: 기사 내용을 3줄로 요약한 것 (1. 2. 3. 번호 붙여서)

                기사 제목: ${news.title}
                기사 내용: ${news.content}`
              }]
            }]
          })
        });
        
        const data = await response.json();

        // 🚨 여전히 에러가 난다면 구체적인 원인을 화면에 띄웁니다.
        if (data.error) {
          return { ...news, summary: `구글 API 서버 응답 실패: ${data.error.message}` };
        }

        const aiText = data.candidates[0].content.parts[0].text;
        
        // 텍스트에서 [제목]과 [요약]을 정확히 뜯어내는 로직
        const titleMatch = aiText.match(/\[제목\]:(.*)/);
        const finalTitle = titleMatch ? titleMatch[1].trim() : news.title;
        const summaryPart = aiText.split('[요약]')[1] || aiText;

        return { 
          ...news, 
          title: finalTitle, 
          summary: summaryPart.trim() 
        };
      } catch (e) {
        return { ...news, summary: "AI 요약 처리 중 기술적 오류가 발생했습니다." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error) {
    return NextResponse.json({ error: "시스템 로드 실패" }, { status: 500 });
  }
}