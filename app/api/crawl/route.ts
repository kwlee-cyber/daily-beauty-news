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
        // 제미나이 API 호출 (안정적인 무료 혜택)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `너는 전문 뷰티 기술 에디터야. 다음 뉴스 내용을 한국어로 분석해서 반드시 아래 '형식'대로만 출력해. 한자나 깨진 글자는 절대 쓰지 마.

[제목]: (영문 제목을 한국어로 자연스럽고 매력적으로 번역)
[요약]:
1. (핵심 내용 요약 문장)
2. (산업에 미치는 영향 분석)
3. (전문가적 시사점 및 인사이트)

뉴스 제목: ${news.title}
뉴스 내용: ${news.content}`
              }]
            }]
          })
        });
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // 제목과 요약을 분리하는 로직
        const titleLine = aiResponse.split('\n').find((l: string) => l.includes('[제목]')) || "";
        const finalTitle = titleLine.replace('[제목]:', '').replace('[제목]', '').trim();
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;

        return { 
          ...news, 
          title: finalTitle || news.title, 
          summary: summaryPart.trim() 
        };
      } catch (e) {
        return { ...news, summary: "제미나이 요약 생성 중 잠시 오류가 발생했습니다." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error: any) { 
    return NextResponse.json({ error: "뉴스 수집 실패" }, { status: 500 });
  }
}