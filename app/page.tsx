// file: app/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/crawl');
        const data = await res.json();
        if (Array.isArray(data)) {
          setNewsList(data);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#F9F9F9]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
      <p className="font-bold text-black italic text-sm">BEAUTY ARCHIVE 뉴스를 수집 중입니다...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F9F9F9] py-12 px-6 font-sans">
      <header className="max-w-7xl mx-auto mb-16 text-center border-b-2 border-black pb-8">
        <h1 className="text-6xl font-black text-black mb-2 tracking-tighter uppercase italic">
          BEAUTY ARCHIVE
        </h1>
        <p className="text-black font-medium tracking-[0.3em] text-[10px]">GLOBAL TRENDS & AI INSIGHTS</p>
      </header>

      <div className="max-w-7xl mx-auto">
        {newsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {newsList.map((news, index) => (
              <article key={index} className="group flex flex-col bg-white border border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                
                {/* 🖼️ 이미지 섹션 (강력해진 버전) */}
                <div className="relative aspect-[4/3] overflow-hidden border-b border-black bg-gray-200">
                  <img 
                    src={news.thumbnail || "https://via.placeholder.com/400x300?text=Beauty+Archive"} 
                    alt={news.title}
                    // 💡 핵심: "나 어디서 왔는지 비밀이야!"라고 브라우저에 말해서 차단을 뚫습니다.
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      // 그래도 이미지가 깨지면 깔끔한 대체 이미지로 바꿉니다.
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image";
                      // 무한 루프 방지 (대체 이미지도 깨질 경우를 대비)
                      (e.target as HTMLImageElement).onerror = null;
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase">
                    {news.source}
                  </div>
                </div>

                {/* 카드 본문 내용 */}
                <div className="p-7 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold leading-tight mb-5 text-black group-hover:text-blue-600 transition-colors line-clamp-2">
                    <a href={news.link} target="_blank" rel="noopener noreferrer">
                      {news.title}
                    </a>
                  </h2>

                  {/* 3줄 요약 섹션 */}
                  <div className="bg-gray-50 p-4 border-l-4 border-black mb-4">
                    <p className="text-[10px] font-bold uppercase mb-2 text-gray-400 tracking-widest">3줄 요약</p>
                    <div className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                      {news.summary}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{news.source}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(news.pubDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-xl font-bold text-black mb-2">표시할 뉴스가 없습니다.</p>
            <p className="text-gray-500 mb-8">잠시 후 새로고침을 해주세요.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-black text-white font-black hover:bg-gray-800 transition-all"
            >
              다시 불러오기
            </button>
          </div>
        )}
      </div>
    </main>
  );
}