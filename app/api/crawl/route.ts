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
              content: `너는 전문 뷰티 기술 분석가야. 다음 뉴스 내용을 분석해서 반드시 아래 '형식'대로만 출력해줘. 다른 말은 하지 마.

형식:
1. (핵심 내용 요약 문장)
2. (AI 관점의 분석이나 영향 분석 문장)
3. (관련 업계나 사용자를 위한 인사이트 문장)

뉴스 제목: ${news.title}
뉴스 내용: ${news.content}`
            }]
          })
        });
        const data = await response.json();
        return { ...news, summary: data.choices[0].message.content };
      } catch (e) {
        return { ...news, summary: "1. 요약 생성 중 오류가 발생했습니다.\n2. API 키 설정을 확인해주세요.\n3. 잠시 후 다시 시도해주세요." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error: any) { 
    return NextResponse.json({ error: "뉴스 수집 중 오류 발생" }, { status: 500 });
  }
}
