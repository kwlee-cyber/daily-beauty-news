// app/page.tsx (주요 부분)

export default function Home() {
  // ... 기존 데이터 fetch 로직 ...

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 md:px-10">
      {/* 상단 헤더 섹션 */}
      <header className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">
          Beauty News Daily
        </h1>
        <p className="text-slate-500 uppercase tracking-widest text-sm">Global Beauty Trends & Insights</p>
        <div className="divider"></div>
      </header>

      {/* 3열 그리드 레이아웃 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {newsList.map((news, index) => (
          <div key={index} className="group bg-white overflow-hidden border border-slate-200 hover:shadow-2xl transition-all duration-300 flex flex-col">
            {/* 이미지 영역 */}
            <div className="relative h-64 overflow-hidden bg-slate-200">
              <img 
                src={news.thumbnail || "https://via.placeholder.com/400x300?text=Beauty+News"} 
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-tighter">
                  {news.source}
                </span>
              </div>
            </div>

            {/* 텍스트 영역 */}
            <div className="p-6 flex-grow flex flex-col">
              <h2 className="text-xl font-bold leading-tight mb-4 text-slate-900 group-hover:text-blue-600 transition-colors">
                <a href={news.link} target="_blank" rel="noopener noreferrer">
                  {news.title}
                </a>
              </h2>
              
              {/* 요약 내용 (번호 포함) */}
              <div className="text-sm text-slate-600 leading-relaxed mb-4 flex-grow italic">
                {news.summary}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Read More
                </span>
                <button className="btn btn-ghost btn-xs btn-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}