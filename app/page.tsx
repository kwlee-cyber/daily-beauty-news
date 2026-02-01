'use client';

import { useState, useEffect } from 'react';

export default function BeautyNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crawl');
      const data = await response.json();
      setNews(data);
    } catch (error) { console.error("뉴스 로드 실패", error); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] pb-20 font-sans text-[#222]">
      <header className="bg-white py-14 mb-12 border-b-4 border-black">
        <div className="max-w-6xl mx-auto px-8 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-[1000] tracking-tighter leading-none mb-3">BEAUTY NEWS</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Selected Global Science Briefing</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase">Edition 2026</p>
            <p className="text-[10px] text-gray-400 font-bold">Updated Every Hour</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-1 bg-black animate-pulse"></div>
            <p className="mt-4 font-black text-black tracking-widest text-xs uppercase">Connecting to Sources...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-16">
            {news.map((item: any, index: number) => (
              <article key={index} className="flex flex-col group border-t border-black pt-8">
                {/* 매체 이름 표시 - 가장 상단에 배치 */}
                <div className="mb-4">
                  <span className="bg-black text-white text-[11px] font-black px-3 py-1 uppercase tracking-tighter inline-block">
                    {item.source || "Global Media"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="relative h-[280px] w-full overflow-hidden bg-gray-200">
                    <img 
                      src={item.thumbnail || `https://loremflickr.com/800/800/beauty,science?lock=${index}`} 
                      alt="thumb" 
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black leading-tight mb-6 hover:underline decoration-4">
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="text-[14px] leading-relaxed text-gray-600 font-medium border-l-2 border-black pl-4">
                        {item.summary}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {!loading && (
        <button 
          onClick={fetchNews}
          className="fixed bottom-12 right-12 bg-black text-white px-8 py-4 font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-rose-600 transition-all z-50"
        >
          Update News 🔄
        </button>
      )}
    </div>
  );
}