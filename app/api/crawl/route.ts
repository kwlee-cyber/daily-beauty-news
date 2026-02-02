import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { Redis } from '@upstash/redis';

const parser = new Parser();
const redis = Redis.fromEnv();

const RSS_SOURCES = [
  { name: 'Instagram 1', url: 'https://rss.app/feeds/5m99kXlkM6N99jIe.xml' },
  { name: 'Instagram 2', url: 'https://rss.app/feeds/dFjmfkZ6nHTvI9KE.xml' },
  { name: 'Cosmopolitan', url: 'https://www.cosmopolitan.com/rss/style-beauty.xml' },
  { name: 'Vogue', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure', url: 'https://www.allure.com/feed/rss' },
  { name: 'Global Cosmetics', url: 'https://www.globalcosmeticsnews.com/feed/' },
  { name: 'Cosmetics & Toiletries', url: 'https://www.cosmeticsandtoiletries.com/rss/all.xml' },
  { name: 'Beauty Packaging', url: 'https://www.beautypackaging.com/rss/all.xml' }
];

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;

  try {
    const existingNews: any[] = (await redis.get('beauty_news_list')) || [];

    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 3).map(item => {
          const content = item['content:encoded'] || item.content || "";
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const match = content.match(imgRegex);
          return {
            id: item.guid || item.link,
            title: item.title || "No Title",
            content: (item.contentSnippet || "").substring(0, 500),
            source: source.name,
            link: item.link,
            thumbnail: match ? match[1] : (item.enclosure ? item.enclosure.url : null),
            pubDate: item.pubDate || new Date().toISOString()
          };
        });
      } catch (e) { return []; }
    });

    const crawledNews = (await Promise.all(requests)).flat();

    // 💡 에러가 났던 지점: newItems 변수를 정확히 정의합니다.
    const newItems = crawledNews.filter(
      (crawled) => !existingNews.some((existing) => existing.id === crawled.id)
    );

    if (newItems.length === 0) {
      return NextResponse.json(existingNews);
    }

    // 4. 새로운 아이템 요약 시도 (장남님이 원하신 한글 제목 + 3줄 요약)
    const summarizedNewItems = await Promise.all(newItems.slice(0, 5).map(async (news) => {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{
              role: "user", 
              content: `너는 뷰티 에디터야. 다음 뉴스를 반드시 한국어로 요약해.
              
              형식:
              [제목]: (매력적인 한글 제목으로 번역)
              [요약]: 
              1. (핵심 내용 첫 번째)
              2. (핵심 내용 두 번째)
              3. (핵심 내용 세 번째)

              제목: ${news.title}
              내용: ${news.content}`
            }],
            temperature: 0.5
          })
        });
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        const titleMatch = aiResponse.match(/\[제목\]:(.*)/);
        const finalTitle = titleMatch ? titleMatch[1].trim() : news.title;
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;

        return { ...news, title: finalTitle, summary: summaryPart.trim() };
      } catch (e) {
        return { ...news, summary: "요약 로딩 중 오류가 발생했습니다." };
      }
    }));

    const updatedList = [...summarizedNewItems, ...existingNews].slice(0, 100);
    await redis.set('beauty_news_list', updatedList);

    return NextResponse.json(updatedList);
  } catch (error: any) {
    return NextResponse.json({ error: "Server Error", message: error.message }, { status: 500 });
  }
}