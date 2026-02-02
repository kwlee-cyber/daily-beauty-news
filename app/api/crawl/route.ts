// file: app/api/crawl/route.ts

import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { Redis } from '@upstash/redis';

// 뉴스 데이터 규격 정의
interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  link: string;
  thumbnail: string | null;
  pubDate: string;
  summary: string;
}

const parser = new Parser();

// RSS 소스 리스트
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
  try {
    const redis = Redis.fromEnv();
    const apiKey = process.env.GROQ_API_KEY;

    // 1. 기존 데이터 불러오기
    const savedData = await redis.get('beauty_news_list');
    const existingNews: NewsItem[] = Array.isArray(savedData) ? savedData : [];

    // 2. 신규 RSS 데이터 수집
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 3).map((item) => {
          const content = item['content:encoded'] || item.content || "";
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const match = content.match(imgRegex);
          
          return {
            id: String(item.guid || item.link),
            title: String(item.title || "No Title"),
            content: String(item.contentSnippet || "").substring(0, 500),
            source: source.name,
            link: String(item.link || "#"),
            thumbnail: match ? match[1] : (item.enclosure ? item.enclosure.url : null),
            pubDate: String(item.pubDate || new Date().toISOString()),
            summary: "기사 원문을 확인해 보세요."
          };
        });
      } catch (e) {
        return [];
      }
    });

    const crawledResults = await Promise.all(requests);
    const crawledNews: NewsItem[] = crawledResults.flat();

    // 3. 중복 제거
    const newItems = crawledNews.filter((newItem) => {
      return !existingNews.some((oldItem) => oldItem.id === newItem.id);
    });

    // 4. 새로운 뉴스가 없으면 즉시 반환
    if (newItems.length === 0) {
      return NextResponse.json(existingNews);
    }

    // 5. 요약 처리 (최대 3개로 축소하여 안정성 확보)
    let summarizedItems = newItems;
    if (apiKey) {
      const toSummarize = newItems.slice(0, 3);
      summarizedItems = await Promise.all(toSummarize.map(async (news) => {
        try {
          const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${apiKey}`, 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{
                role: "user", 
                content: `한국어로 3줄 요약해줘.\n제목: ${news.title}\n내용: ${news.content}`
              }]
            })
          });
          const aiData = await aiRes.json();
          const summary = aiData.choices[0]?.message?.content || "요약 실패";
          return { ...news, summary };
        } catch (e) {
          return news;
        }
      }));
    }

    // 6. 합치기 및 저장
    const finalData = [...summarizedItems, ...existingNews].slice(0, 50);
    await redis.set('beauty_news_list', finalData);

    return NextResponse.json(finalData);

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}