'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crawl')
      .then(res => res.json())
      .then(data => {
        // 데이터가 배열인지 확인하고 저장 (중요!)
        if (Array.isArray(data)) {
          setNewsList(data);
        } else {
          setNewsList([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F9F9F9] py-12 px-6">
      <header className="max-w-7xl mx-auto mb-16 text-center border-b-2 border-black pb-8">
        <h1 className="text-6xl font-black text-black mb-2 tracking-tighter uppercase italic">
          BEAUTY ARCHIVE
        </h1>
        <p className="text-black font-medium tracking-[0.3em] text-[10px]">GLOBAL TRENDS & AI INSIGHTS</p>
      </header>

      {/* newsList가 있을 때만 map 실행 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {newsList && newsList.length > 0 ? (
          newsList.map((news, index) => (
            <article key={index} className="group flex flex-col bg-white border border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-black bg-gray-100">
                <img 
                  src={news.thumbnail || "https://via.placeholder.com/400x300?text=Beauty+Archive"} 
                  alt={news.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase">
                  {news.source}
                </div>
              </div>
              <div className="p-7 flex flex-col flex-grow">
                <h2 className="text-xl font-bold leading-tight mb-5 text-black">
                  <a href={news.link} target="_blank" rel="noopener noreferrer">{news.title}</a>
                </h2>
                <div className="text-[13px] text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                  {news.summary}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-500">
            새로운 뉴스를 수집하고 있습니다. 잠시만 기다려주세요!
          </div>
        )}
      </div>
    </main>
  );
}