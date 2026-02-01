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
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans text-[#1A1A1A]">
      <header className="bg-white py-12 mb-10 border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-[900] tracking-tighter mb-2 italic">BEAUTY TECH AI</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Daily Science Briefing</p>
          <div className="w-12 h-1 bg-rose-500 mt-6"></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="mt-6 font-black text-gray-300 tracking-widest text-[10px]">COLLECTING SOURCES...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {news.map((item: any, index: number) => (
              <article key={index} className="group bg-white rounded-[32px] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl border border-gray-50">
                {/* 썸네일 및 출처 배지 */}
                <div className="relative h-80 w-full bg-gray-100">
                  <img 
                    src={item.thumbnail || `https://loremflickr.com/800/600/beauty,skincare?lock=${index}`} 
                    alt="thumb" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* 여기가 수정된 출처 표시(배지) 부분입니다 */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="bg-rose-500 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                      {item.source}
                    </span>
                    <span className="bg-white/80 backdrop-blur text-black text-[9px] font-bold px-3 py-1 rounded-full w-fit shadow-sm">
                      LATEST NEWS
                    </span>
                  </div>
                </div>
                
                <div className="p-10 flex-grow">
                  <h2 className="text-2xl font-bold leading-[1.3] mb-8 text-black tracking-tight group-hover:text-rose-600 transition-colors">
                    {item.title}
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-grow bg-gray-100"></div>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">AI Summary</p>
                      <div className="h-[1px] flex-grow bg-gray-100"></div>
                    </div>
                    <div className="text-[15px] leading-relaxed text-gray-600 whitespace-pre-wrap font-medium">
                      {item.summary}
                    </div>
                  </div>
                </div>

                <div className="px-10 pb-10 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-gray-300 italic">Global Beauty Tech Report</span>
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-rose-600 transition-all flex items-center gap-3"
                  >
                    READ MORE <span>→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {!loading && (
        <button 
          onClick={fetchNews}
          className="fixed bottom-10 right-10 bg-white border border-gray-100 text-black w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all z-50 group"
        >
          <span className="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
        </button>
      )}
    </div>
  );
}