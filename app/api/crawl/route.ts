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
              content: `너는 뷰티 기술 에디터야. 다음 뉴스를 분석해서 반드시 아래 '구분자'를 사용해 한국어로 출력해줘. 한자는 쓰지 마.

[KOR_TITLE] (여기에 한글 번역 제목 작성)
[KOR_SUMMARY]
1. (첫 번째 요약)
2. (두 번째 요약)
3. (세 번째 요약)

원문 제목: ${news.title}
원문 내용: ${news.content}`
            }]
          })
        });
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // 구분자를 기준으로 제목과 요약을 더 정확하게 분리합니다.
        const titlePart = aiResponse.split('[KOR_SUMMARY]')[0].replace('[KOR_TITLE]', '').trim();
        const summaryPart = aiResponse.split('[KOR_SUMMARY]')[1]?.trim() || "요약 생성 실패";

        return { 
          ...news, 
          title: titlePart || news.title, 
          summary: summaryPart 
        };
      } catch (e) {
        return { ...news, summary: "요약 생성 중 오류가 발생했습니다." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error: any) { 
    return NextResponse.json({ error: "뉴스 수집 중 오류 발생" }, { status: 500 });
  }
}