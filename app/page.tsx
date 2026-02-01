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
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-rose-500 tracking-tighter">BEAUTY TECH</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Science Update</p>
          </div>
          {!loading && (
            <button onClick={fetchNews} className="text-sm font-bold border-b-2 border-black pb-1 hover:text-rose-500 hover:border-rose-500 transition-all">
              REFRESH
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="mt-6 font-medium text-gray-400 animate-pulse text-sm">ANALYZING TRENDS...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {news.map((item: any, index: number) => (
              <article key={index} className="group cursor-pointer">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  <div className="relative h-[300px] w-full overflow-hidden rounded-2xl mb-6 shadow-xl">
                    <img 
                      src={item.thumbnail || `https://loremflickr.com/600/800/skincare,cosmetics?lock=${index}`} 
                      alt="thumbnail" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e:any) => e.target.src = "https://images.unsplash.com/photo-1596462502278-27bfac44221b?w=800"}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">
                        {item.source}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-rose-500 transition-colors">
                    {item.title}
                  </h2>
                  <div className="border-l-2 border-gray-200 pl-4 py-1">
                    <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-4 font-medium">
                      {item.summary}
                    </p>
                  </div>
                </a>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
