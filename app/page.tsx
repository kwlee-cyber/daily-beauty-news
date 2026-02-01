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
    <div className="min-h-screen bg-[#F0F2F5] pb-20 font-sans text-[#333]">
      <header className="bg-white py-12 mb-10 shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-black">BEAUTY NEWS AI</h1>
          <p className="text-gray-400 font-medium tracking-tight">AI Powered Global Beauty Science Briefing</p>
          <div className="w-16 h-1 bg-black mt-6"></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-black rounded-full animate-spin"></div>
            <p className="mt-6 font-bold text-gray-400 tracking-widest text-xs">LOADING BRIEFING...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {news.map((item: any, index: number) => (
              <article key={index} className="bg-white rounded-[40px] overflow-hidden shadow-sm flex flex-col border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-72 w-full bg-gray-100">
                  <img 
                    src={item.thumbnail || `https://loremflickr.com/800/600/skincare,beauty?lock=${index}`} 
                    alt="thumb" 
                    className="w-full h-full object-cover"
                    onError={(e:any) => e.target.src = "https://images.unsplash.com/photo-1596462502278-27bfac44221b?w=800"}
                  />
                  <div className="absolute top-6 left-6">
                    <span className="bg-white/90 backdrop-blur-md text-black text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                      {item.source}
                    </span>
                  </div>
                </div>
                
                <div className="p-10 flex-grow">
                  <h2 className="text-2xl font-bold leading-tight mb-8 text-black tracking-tight">
                    {item.title}
                  </h2>
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b border-gray-50 pb-3">Analysis Summary</p>
                    <div className="text-[15px] leading-relaxed text-gray-600 whitespace-pre-wrap font-medium">
                      {item.summary}
                    </div>
                  </div>
                </div>

                <div className="px-10 pb-10 flex justify-end">
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[#E8EEF9] text-[#4A6FA5] px-7 py-3 rounded-2xl font-bold text-xs hover:bg-[#DDE5F4] transition-all flex items-center gap-3 group"
                  >
                    원문 보기 <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
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
          className="fixed bottom-10 right-10 bg-white border border-gray-100 text-black w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
          title="새로고침"
        >
          <span className="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
        </button>
      )}
    </div>
  );
}