import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_SOURCES = [
  { name: 'Vogue Beauty', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure', url: 'https://www.allure.com/feed/rss' },
  { name: 'Global Cosmetics News', url: 'https://www.globalcosmeticsnews.com/feed/' },
  { name: 'C&T Science', url: 'https://www.cosmeticsandtoiletries.com/rss/all.xml' },
  { name: 'Wired Science', url: 'https://www.wired.com/feed/category/science/latest/rss' }
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
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{
              role: "user", 
              content: `너는 전문 뷰티 기술 에디터야. 다음 뉴스 내용을 한국어로 분석해줘.

형식:
[제목]: 한글 번역 제목
[요약]:
1. 첫 번째 요약
2. 두 번째 요약
3. 세 번째 요약

뉴스 제목: ${news.title}
뉴스 내용: ${news.content}`
            }]
          })
        });
        
        const data = await response.json();
        
        // API 키 오류나 할당량 초과 확인
        if (data.error) {
          return { ...news, summary: `API 에러: ${data.error.message}` };
        }

        const aiResponse = data.choices[0].message.content;

        // 텍스트 추출 로직 강화
        const titleLine = aiResponse.split('\n').find((l: string) => l.includes('[제목]')) || "";
        const finalTitle = titleLine.replace('[제목]:', '').replace('[제목]', '').trim();
        
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;

        return { 
          ...news, 
          title: finalTitle || news.title, 
          summary: summaryPart.trim() 
        };
      } catch (e) {
        return { ...news, summary: "네트워크 오류로 요약을 생성하지 못했습니다." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error: any) { 
    return NextResponse.json({ error: "뉴스 수집 실패" }, { status: 500 });
  }
}