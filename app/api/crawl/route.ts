import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_SOURCES = [
  { name: 'Instagram - Feed 1', url: 'https://rss.app/feeds/5m99kXlkM6N99jIe.xml' },
  { name: 'Instagram - Feed 2', url: 'https://rss.app/feeds/dFjmfkZ6nHTvI9KE.xml' },
  { name: 'Cosmopolitan Beauty', url: 'https://www.cosmopolitan.com/rss/style-beauty.xml' },
  { name: 'Vogue Beauty', url: 'https://www.vogue.com/feed/rss/beauty' },
  { name: 'Allure News', url: 'https://www.allure.com/feed/rss' },
  { name: 'Global Cosmetics News', url: 'https://www.globalcosmeticsnews.com/feed/' },
  { name: 'Cosmetics & Toiletries', url: 'https://www.cosmeticsandtoiletries.com/rss/all.xml' },
  { name: 'Beauty Packaging', url: 'https://www.beautypackaging.com/rss/all.xml' }
];

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY; 
  if (!apiKey) return NextResponse.json([{ title: "설정 오류", summary: "Vercel Settings에서 GROQ_API_KEY를 확인해주세요.", source: "System" }]);

  try {
    const requests = RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.slice(0, 15).map(item => {
          // 💡 이미지 추출 로직 강화 (인스타 등 다양한 포맷 대응)
          const imgRegex = /<img[^>]+src="([^">]+)"/;
          const content = item['content:encoded'] || item.content || "";
          const match = content.match(imgRegex);
          
          return {
            title: item.title || "No Title",
            content: (item.contentSnippet || item.snippet || "").substring(0, 800),
            source: source.name,
            link: item.link,
            thumbnail: match ? match[1] : (item.enclosure ? item.enclosure.url : null)
          };
        });
      } catch (e) { return []; }
    });

    const rawNews = (await Promise.all(requests)).flat();

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
              content: `너는 전문 뷰티 에디터야. 다음 뉴스 내용을 한글로 분석해서 반드시 아래 형식을 지켜서 출력해. 텍스트 이외의 말은 하지 마.

[제목]: (한글 번역 제목)
[요약]:
1. (핵심 내용 요약)
2. (특징 및 산업 영향)
3. (에디터의 한줄 평)

뉴스 정보:
제목: ${news.title}
내용: ${news.content}`
            }],
            max_tokens: 800,
            temperature: 0.5 // 일관된 답변을 위해 낮춤
          })
        });
        
        const data = await response.json();
        
        if (data.error) return { ...news, summary: "Groq API 한도 초과. 잠시 후 시도해주세요." };

        const aiResponse = data.choices[0].message.content;
        
        // 💡 제목과 요약 추출 로직
        const titleMatch = aiResponse.match(/\[제목\]:(.*)/);
        const finalTitle = titleMatch ? titleMatch[1].trim() : news.title;
        const summaryPart = aiResponse.split('[요약]')[1] || aiResponse;

        return { 
          ...news, 
          title: finalTitle, 
          summary: summaryPart.trim() 
        };
      } catch (e) {
        return { ...news, summary: "요약 로딩 중 오류가 발생했습니다." };
      }
    }));

    return NextResponse.json(summarizedNews);
  } catch (error) {
    return NextResponse.json({ error: "데이터 로드 실패" }, { status: 500 });
  }
}