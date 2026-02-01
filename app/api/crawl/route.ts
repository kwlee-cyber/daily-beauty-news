import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_SOURCES = [
  // 📱 인스타그램 소셜 피드
  { name: 'Instagram - Feed 1', url: 'https://rss.app/feeds/5m99kXlkM6N99jIe.xml' },
  { name: 'Instagram - Feed 2', url: 'https://rss.app/feeds/dFjmfkZ6nHTvI9KE.xml' },
  
  // 💄 글로벌 뷰티 매거진
  { name: 'Cosmopolitan Beauty', url: 'https://www.cosmopolitan.com/rss/style-beauty.xml' },
  { name: 'Vogue Beauty', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure News', url: 'https://www.allure.com/feed/rss' },
  
  // 🔬 산업 및 전문지
  { name: 'Global Cosmetics News', url: 'https://www.globalcosmeticsnews.com/feed/' },
  { name: 'Cosmetics & Toiletries', url: 'https://www.cosmeticsandtoiletries.com/rss/all.xml' },
  { name: 'Beauty Packaging', url: 'https://www.beautypackaging.com/rss/all.xml' }
];

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY; // Vercel에 설정된 Groq 키 사용
  if (!apiKey) return NextResponse.json([{ title: "설정 오류", summary: "Vercel에 GROQ_API_KEY를 등록해주세요.", source: "System" }]);

  try {
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 1).map(item => {
          // 이미지 추출 로직 (img 태그 및 enclosure 대응)
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const match = item.content?.match(imgRegex) || 
                        item['content:encoded']?.match(imgRegex) || 
                        (item.enclosure ? {1: item.enclosure.url} : null);
          
          return {
            title: item.title || "No Title",
            content: (item.contentSnippet || item.snippet || "").substring(0, 500),
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
            "Authorization": `Bearer ${apiKey}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{
              role: "user", 
              content: `너는 뷰티 에디터야. 다음 뉴스/포스트를 한국어로 요약해.
[제목]: 자연스러운 한국어 번역
[요약]: 핵심 포인트 3줄 (1. 2. 3. 번호 붙여서)

제목: ${news.title}
내용: ${news.content}`
            }],
            max_tokens: 500
          })
        });
        
        const data = await response.json();
        if (data.error) return { ...news, summary: "요약 한도 초과. 잠시 후 다시 시도하세요." };

        const aiResponse = data.choices[0].message.content;
        const titleLine = aiResponse.split('\n').find((l: string) => l.includes('[제목]')) || "";
        const finalTitle = titleLine.replace('[제목]:', '').replace('[제목]', '').trim();
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;

        return { 
          ...news, 
          title: finalTitle || news.title, 
          summary: summaryPart.trim() 
        };
      } catch (e) { return { ...news, summary: "요약 로딩 실패" }; }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error) { 
    return NextResponse.json({ error: "데이터 로드 실패" }, { status: 500 }); 
  }
}