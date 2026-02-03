// file: app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// 소스별 색상 매핑
const getSourceColor = (source: string) => {
  const colorMap: Record<string, string> = {
    'Vogue': 'bg-gradient-to-r from-rose-500 to-pink-600',
    'Allure': 'bg-gradient-to-r from-purple-500 to-indigo-600',
    'Cosmopolitan': 'bg-gradient-to-r from-pink-500 to-rose-600',
    'Elle': 'bg-gradient-to-r from-amber-500 to-orange-600',
    'Marie Claire': 'bg-gradient-to-r from-cyan-500 to-blue-600',
    'Instagram 1': 'bg-gradient-to-r from-purple-500 to-pink-600',
    'Instagram 2': 'bg-gradient-to-r from-orange-500 to-red-600',
  };
  return colorMap[source] || 'bg-gradient-to-r from-gray-700 to-gray-900';
};

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {newsList.map((news, index) => (
              <article 
                key={news.id || news.link} 
                className="group flex flex-col bg-white border border-black/10 hover:border-black/20 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 rounded-lg overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
              >
                
                {/* 🖼️ 이미지 섹션 (세련된 버전) */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
                  {news.thumbnail ? (
                    <>
                      <Image
                        src={news.thumbnail}
                        alt={news.title || 'Beauty Archive News'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out animate-blur-to-clear"
                        referrerPolicy="no-referrer"
                        unoptimized
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                      />
                      {/* 그라데이션 오버레이 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-gray-400 text-sm font-medium">No Image</span>
                    </div>
                  )}
                  {/* 소스별 색상 배지 */}
                  <div className={`absolute top-4 left-4 ${getSourceColor(news.source)} text-white px-3 py-1.5 text-[10px] font-bold uppercase z-10 rounded-full shadow-lg backdrop-blur-sm`}>
                    {news.source}
                  </div>
                </div>

                {/* 카드 본문 내용 */}
                <div className="p-6 md:p-7 flex flex-col flex-grow">
                  <h2 className="text-lg md:text-xl font-bold leading-tight mb-4 md:mb-5 text-gray-900 group-hover:text-rose-600 transition-colors duration-300 line-clamp-2">
                    <a href={news.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {news.title}
                    </a>
                  </h2>

                  {/* 3줄 요약 섹션 */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-5 border-l-4 border-rose-400 mb-4 rounded-r-md shadow-sm">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase mb-2.5 text-gray-500 tracking-widest">3줄 요약</p>
                    <div className="text-xs md:text-[13px] text-gray-700 leading-relaxed whitespace-pre-line font-medium">
                      {news.summary}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{news.source}</span>
                    <span className="text-[9px] md:text-[10px] text-gray-400 font-medium">
                      {new Date(news.pubDate).toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
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