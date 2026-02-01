import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_SOURCES = [
  { name: 'Global Cosmetics News', url: 'https://www.globalcosmeticsnews.com/feed/' },
  { name: 'C&T Science', url: 'https://www.cosmeticsandtoiletries.com/rss/all.xml' },
  { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/health_medicine/skin_care.xml' },
  { name: 'Wired Beauty', url: 'https://www.wired.com/feed/category/science/latest/rss' },
  { name: 'Beauty Packaging', url: 'https://www.beautypackaging.com/rss/all.xml' },
  { name: 'Vogue Science', url: 'https://www.vogue.com/feed/rss/beauty' }
];

export async function GET() {
  try {
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 1).map(item => {
          // 뉴스 본문 내 <img> 태그에서 주소 추출 시도
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const match = item.content?.match(imgRegex) || item['content:encoded']?.match(imgRegex);
          const thumbnailUrl = match ? match[1] : null;

          return {
            title: item.title,
            content: item.contentSnippet || item.snippet || "",
            source: source.name,
            link: item.link,
            thumbnail: thumbnailUrl
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
              content: `너는 전문 뷰티 과학 에디터야. 다음 뉴스 내용을 뷰티 성분 및 기술 관점에서 한국어로 친절하게 3줄 요약해줘.\n제목: ${news.title}\n내용: ${news.content}`
            }]
          })
        });
        const data = await response.json();
        return { ...news, summary: data.choices[0].message.content };
      } catch (e) {
        return { ...news, summary: "요약 실패 (키 설정을 확인하세요)" };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error: any) { 
    return NextResponse.json({ error: "뉴스 수집 중 오류 발생" }, { status: 500 });
  }
}
