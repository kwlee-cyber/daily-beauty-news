// file: app/api/crawl/route.ts

import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { Redis } from '@upstash/redis';

const parser = new Parser();
const redis = Redis.fromEnv(); // Vercel 환경변수 자동 로드

const RSS_SOURCES = [
  // 사용자가 요청한 모든 소스 리스트
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
    // 1. 기존 DB 데이터 가져오기 (없으면 빈 배열)
    const existingNews: any[] = (await redis.get('beauty_news_list')) || [];

    // 2. RSS 소스들로부터 데이터 읽어오기
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
            pubDate: item.pubDate || new Date().toISOString(),
            summary: "기사 원문을 확인해 보세요." // 요약 전 기본 문구
          };
        });
      } catch (e) {
        console.error(`${source.name} 수집 실패:`, e);
        return [];
      }
    });

    const crawledNews = (await Promise.all(requests)).flat();

    // 3. 중복 제거 (이미 저장된 ID 제외)
    const newItems = crawledNews.filter(
      (crawled) => !existingNews.some((existing) => existing.id === crawled.id)
    );