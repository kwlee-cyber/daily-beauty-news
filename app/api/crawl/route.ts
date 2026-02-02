import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { Redis } from '@upstash/redis';

// 1. RSS 파서 설정 (숨겨진 이미지까지 샅샅이 찾도록 설정)
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

const redis = Redis.fromEnv();

// 2. RSS 소스 리스트 (이미지 잘 나오는 매체 위주)
const RSS_SOURCES = [
  { name: 'Instagram 1', url: 'https://rss.app/feeds/5m99kXlkM6N99jIe.xml' },
  { name: 'Instagram 2', url: 'https://rss.app/feeds/dFjmfkZ6nHTvI9KE.xml' },
  { name: 'Vogue', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure', url: 'https://www.allure.com/feed/rss' },
  { name: 'Cosmopolitan', url: 'https://www.cosmopolitan.com/rss/style-beauty.xml' },
  { name: 'Elle', url: 'https://www.elle.com/rss/beauty.xml' },
  { name: 'Marie Claire', url: 'https://www.marieclaire.com/rss/beauty.xml' },
];

// 3. 이미지 추출 도우미 함수
function findImage(item: any): string | null {
  // 1순위: media:content (고화질)
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaContent?.url) return item.mediaContent.url;
  
  // 2순위: enclosure (첨부파일)
  if (item.enclosure?.url) return item.enclosure.url;
  
  // 3순위: media:thumbnail
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.mediaThumbnail?.url) return item.mediaThumbnail.url;

  // 4순위: 본문 태그 검색
  const content = item.contentEncoded || item.content || item.description || "";
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];

  return null;
}

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;

  try {
    // 💡 DB 키 변경(v3) -> 기존 '이미지 없는 데이터' 무시하고 새로 수집
    const DB_KEY = 'beauty_news_list_v3';
    const existingNews: any[] = (await redis.get(DB_KEY)) || [];

    // RSS 크롤링 시작
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 3).map(item => { 
          return {
            id: item.guid || item.link,
            title: item.title || "No Title",
            content: (item.contentEncoded || item.content || item.contentSnippet || "").substring(0, 500),
            source: source.name,
            link: item.link,
            thumbnail: findImage(item), // 강화된 이미지 찾기 적용
            pubDate: item.pubDate || new Date().toISOString()
          };
        });
      } catch (e) { 
        console.error(`Error crawling ${source.name}:`, e);
        return []; 
      }
    });

    const crawledNews = (await Promise.all(requests)).flat();

    // 중복 제거
    const newItems = crawledNews.filter(
      (crawled) => !existingNews.some((existing) => existing.id === crawled.id)
    );

    // 새 뉴스가 없으면 기존 데이터 반환
    if (newItems.length === 0) {
      return NextResponse.json(existingNews);
    }

    // AI 요약 (최신 5개)
    const summarizedNewItems = await Promise.all(newItems.slice(0, 5).map(async (news) => {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{
              role: "user", 
              content: `너는 뷰티 에디터야. 다음 뉴스를 한국어로 요약해.
              [제목]: (한글 제목)
              [요약]: 
              1. (핵심1)
              2. (핵심2)
              3. (핵심3)
              
              기사: ${news.title} / ${news.content}`
            }],
            temperature: 0.3
          })
        });
        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || "";
        
        const titleMatch = aiResponse.match(/\[제목\]:(.*)/);
        const finalTitle = titleMatch ? titleMatch[1].trim() : news.title;
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;

        return { ...news, title: finalTitle, summary: summaryPart.trim() };
      } catch (e) {
        return { ...news, summary: "요약 정보를 불러오는 중입니다..." };
      }
    }));

    // 최신순 정렬 및 저장
    const updatedList = [...summarizedNewItems, ...existingNews].slice(0, 100);
    await redis.set(DB_KEY, updatedList);

    return NextResponse.json(updatedList);

  } catch (error: any) {
    return NextResponse.json({ error: "Server Error", message: error.message }, { status: 500 });
  }
}