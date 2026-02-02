// app/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crawl')
      .then(res => res.json())
      .then(data => {
        setNewsList(data);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <span className="loading loading-spinner loading-lg text-black"></span>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F9F9F9] py-12 px-6">
      {/* 고정 상단 헤더: 잡지 느낌 폰트 */}
      <header className="max-w-7xl mx-auto mb-16 text-center border-b-2 border-black pb-8">
        <h1 className="text-6xl font-black text-black mb-2 tracking-tighter uppercase italic italic-font">
          BEAUTY ARCHIVE
        </h1>
        <p className="text-black font-medium tracking-[0.3em] text-xs">GLOBAL TRENDS & AI INSIGHTS</p>
      </header>

      {/* 핵심: 3열 그리드 시스템 (md:grid-cols-3) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {newsList.map((news, index) => (
          <article key={index} className="group flex flex-col bg-white border border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            {/* 이미지 섹션: 비율 고정 */}
            <div className="relative aspect-[4/3] overflow-hidden border-b border-black">
              <img 
                src={news.thumbnail || "https://via.placeholder.com/400x300?text=Beauty+Archive"} 
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                {news.source}
              </div>
            </div>

            {/* 텍스트 섹션 */}
            <div className="p-7 flex flex-col flex-grow">
              <h2 className="text-2xl font-bold leading-tight mb-5 text-black group-hover:underline decoration-2">
                <a href={news.link} target="_blank" rel="noopener noreferrer">
                  {news.title}
                </a>
              </h2>
              
              {/* AI 요약: 번호 매기기 스타일 */}
              <div className="text-[13px] text-gray-700 leading-relaxed mb-6 flex-grow whitespace-pre-line">
                {news.summary}
              </div>

              <div className="mt-auto pt-5 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                  Full Report →
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}