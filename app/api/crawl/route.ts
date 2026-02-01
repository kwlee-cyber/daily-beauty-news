import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_SOURCES = [
  { name: 'Vogue Beauty', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure', url: 'https://www.allure.com/feed/rss' },
  { name: 'Global Cosmetics News', url: 'https://www.globalcosmeticsnews.com/feed/' },
  { name: 'C&T Science', url: 'https://www.cosmeticsandtoiletries.com/rss/all.xml' },
  { name: 'Beauty Packaging', url: 'https://www.beautypackaging.com/rss/all.xml' }
];

export async function GET() {
  // 1. API 키 존재 여부 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Vercel 설정에 GEMINI_API_KEY가 없습니다." }, { status: 500 });
  }

  try {
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 1).map(item => {
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const match = item.content?.match(imgRegex) || item['content:encoded']?.match(imgRegex);
          return {
            title: item.title || "No Title",
            content: item.contentSnippet || item.snippet || "",
            source: source.name,
            link: item.link,
            thumbnail: match ? match[1] : null
          };
        });
      } catch (e) { return []; }
    });

    const results = await Promise.all(requests);
    const rawNews = results.flat();

    const summarizedNews = await Promise.all(rawNews.map(async (news: any) => {
      try {
        // 제미나이 API 호출 (안정적인 v1 버전 사용)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `너는 전문 뷰티 기술 에디터야. 다음 뉴스를 한국어로 분석해서 반드시 아래 '형식'대로만 출력해.

[제목]: (한글 번역 제목)
[요약]:
1. (핵심 내용 요약)
2. (산업 영향 분석)
3. (전문가 인사이트)

뉴스 원문 제목: ${news.title}
뉴스 원문 내용: ${news.content}`
              }]
            }]
          })
        });
        
        const data = await response.json();

        // 구글 서버 에러 메시지 처리
        if (data.error) {
          return { ...news, summary: `구글 API 에러: ${data.error.message}` };
        }

        const aiResponse = data.candidates[0].content.parts[0].text;

        // 제목 및 요약 분리 가공
        const titleMatch = aiResponse.match(/\[제목\]:(.*)/);
        const finalTitle = titleMatch ? titleMatch[1].trim() : news.title;
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;

        return { 
          ...news, 
          title: finalTitle, 
          summary: summaryPart.trim() 
        };
      } catch (e) {
        return { ...news, summary: "데이터 처리 중 오류가 발생했습니다." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error: any) { 
    return NextResponse.json({ error: "뉴스 수집 실패" }, { status: 500 });
  }
}