// file: app/page.tsx
"use client";
import { useState } from 'react';

export default function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setNews([]); 
    setLoading(true);
    try {
      const res = await fetch('/api/crawl');
      const data = await res.json();
      setNews(data);
    } catch (error) {
      alert("AI 뉴스 수집 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-pink-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-pink-500 mb-2 text-center">🧪 Beauty Tech Daily</h1>
        <p className="text-center text-gray-500 mb-8">AI가 성분 과학과 기술 뉴스를 한국어로 요약해드립니다.</p>
        
        <div className="text-center mb-10">
          <button 
            onClick={fetchNews} 
            disabled={loading}
            className={`btn btn-wide btn-lg ${loading ? 'loading' : ''} bg-pink-500 hover:bg-pink-600 border-none text-white shadow-lg`}
          >
            {loading ? 'AI 비서가 요약 중...' : '🔥 실시간 전문 뉴스 수집'}
          </button>
        </div>

        <div className="grid gap-6">
          {news.map((item: any, idx) => (
            <div key={idx} className="card bg-white shadow-md p-6 rounded-2xl border-l-8 border-pink-400">
              <div className="badge badge-outline text-pink-500 border-pink-500 font-bold">{item.source}</div>
              <h2 className="card-title text-gray-800 mt-3 text-lg leading-tight">{item.title}</h2>
              {/* 아래 부분이 AI가 요약한 한글 내용입니다 */}
              <p className="bg-pink-50 p-4 rounded-lg text-gray-700 mt-3 text-sm whitespace-pre-line leading-relaxed">
                {item.summary || "내용을 가져오는 중..."}
              </p>
              <div className="card-actions justify-end mt-4">
                <a href={item.link} target="_blank" className="btn btn-ghost btn-sm text-gray-400 underline">원문 보기</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
