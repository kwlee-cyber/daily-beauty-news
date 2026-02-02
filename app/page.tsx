// file: app/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 데이터를 가져오는 함수
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/crawl');
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setNewsList(data);
          setError(false);
        } else {
          // 데이터가 비어있는 경우
          setNewsList([]);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // 1. 로딩 중일 때 화면
  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#F9F9F9]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
      <p className="font-bold text-black italic">BEAUTY ARCHIVE 수집 중...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F9F9F9] py-12 px-6">
      {/* 헤더 섹션 */}
      <header className="max-w-7xl mx-auto mb-16 text-center border-b-2 border-black pb-8">
        <h1 className="text-6xl font-black text-black mb-2 tracking-tighter uppercase italic">
          BEAUTY ARCHIVE
        </h1>
        <p className="text-black font-medium tracking-[0.3em] text-[10px]">GLOBAL TRENDS & AI INSIGHTS</p>
      </header>

      <div className="max-w-7xl mx-auto">
        {newsList.length > 0 ? (
          // 2. 데이터가 있을 때: 뉴스 카드 그리드
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {newsList.map((news, index) => (
              <article key={index} className="group flex flex-col bg-white border border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden border-b border-black bg-gray-100">
                  <img 
                    src={news.thumbnail || "https://via.placeholder.com/400x300?text=Beauty+Archive"} 
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase">
                    {news.source}
                  </div>
                </div>
                <div className="p-7 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold leading-tight mb-5 text-black group-hover:underline">
                    <a href={news.link} target="_blank" rel="noopener noreferrer">{news.title}</a>
                  </h2>
                  <div className="text-[13px] text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                    {news.summary}
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-100 text-[11px] text-gray-400">
                    {new Date(news.pubDate).toLocaleDateString()}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          // 3. 데이터가 없을 때 화면
          <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <p className="text-xl font-bold text-black mb-2">표시할 뉴스가 아직 없습니다.</p>
            <p className="text-gray-500 mb-8">잠시 후 새로고침을 하거나, 수집기 설정을 확인해 주세요.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-black text-white font-black uppercase italic hover:bg-gray-800 transition-all"
            >
              다시 시도하기
            </button>
          </div>
        )}
      </div>
    </main>
  );
}