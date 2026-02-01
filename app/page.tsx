'use client';

import { useState, useEffect } from 'react';

export default function BeautyNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 접속하자마자 뉴스를 가져오는 기능
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crawl');
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error("뉴스 로드 실패", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <header className="bg-white border-b py-8 mb-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">✨ Beauty Tech Daily</h1>
          <p className="mt-2 text-gray-500 text-sm">AI가 선별한 오늘의 글로벌 뷰티 사이언스</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            <p className="mt-4 text-gray-500">최신 뉴스를 분석 중입니다...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item: any, index: number) => (
              <article key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                {/* 썸네일 대용 이미지 (랜덤 뷰티 이미지) */}
                <div className="h-48 bg-rose-100 flex items-center justify-center overflow-hidden">
                   <img 
                    src={`https://source.unsplash.com/featured/?cosmetics,beauty&sig=${index}`} 
                    alt="beauty" 
                    className="w-full h-full object-cover"
                    onError={(e:any) => e.target.src = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500"}
                  />
                </div>
                
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded">
                      {item.source}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-snug">
                    {item.title}
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {item.summary}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* 하단 새로고침 버튼 */}
      {!loading && (
        <button 
          onClick={fetchNews}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-full shadow-2xl hover:bg-gray-800 transition-all font-medium"
        >
          뉴스 새로고침 🔄
        </button>
      )}
    </div>
  );
}
