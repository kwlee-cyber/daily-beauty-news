import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { Redis } from '@upstash/redis';

const parser = new Parser();
const redis = Redis.fromEnv(); // Vercel에 연결된 환경변수를 자동으로 읽음

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
  if (!apiKey) return NextResponse.json({ error: "API Key Missing" });

  try {
    // 1. 기존 DB에 저장된 뉴스 가져오기
    const existingNews: any[] = (await redis.get('beauty_news_list')) || [];

    // 2. 새로운 RSS 뉴스 긁어오기 (소스당 3개씩만 새로 확인)
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 3).map(item => {
          const content = item['content:encoded'] || item.content || "";
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const match = content.match(imgRegex);
          return {
            id: item.guid || item.link, // 중복 체크용 고유 ID
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

    // 3. 중복 제거 (이미 DB에 있는 ID는 제외)
    const newItems = crawledNews.filter(
      (crawled) => !existingNews.some((existing) => existing.id === crawled.id)
    );

    // 4. 새로운 아이템만 요약 시도 (Groq 부하 방지: 최대 5개씩만)
    const summarizedNewItems = await Promise.all(newItems.slice(0, 5).map(async (news) => {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{
              role: "user", 
              content: `너는 뷰티 에디터야. 한국어로 요약해.\n[제목]: 번역\n[요약]: 1. 2. 3. 번호붙여 3줄요약\n\n제목: ${news.title}\n내용: ${news.content}`
            }],
            max_tokens: 500
          })
        });
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        const titleMatch = aiResponse.match(/\[제목\]:(.*)/);
        const finalTitle = titleMatch ? titleMatch[1].trim() : news.title;
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;
        return { ...news, title: finalTitle, summary: summaryPart.trim() };
      } catch (e) {
        return { ...news, summary: "요약 생략됨" };
      }
    }));

    // 5. 합치기: [새 뉴스 + 기존 뉴스] 순서로 합치고 최대 100개만 유지
    const updatedList = [...summarizedNewItems, ...existingNews].slice(0, 100);

    // 6. DB에 최종 저장
    await redis.set('beauty_news_list', updatedList);

    return NextResponse.json(updatedList);
  } catch (error) {
    return NextResponse.json({ error: "System Error" }, { status: 500 });
  }
}