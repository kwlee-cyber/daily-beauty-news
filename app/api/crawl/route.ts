// file: app/api/crawl/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json({ success: false, error: "API 키 없음" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "전문 뷰티 에디터로서 '2026년 봄 트렌드'를 한국어로 3줄 요약해줘.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text();

    return NextResponse.json({
      success: true,
      data: {
        title: "2026 Spring Trend",
        summary: summaryText,
        thumbnail: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500"
      }
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "에러 발생" }, { status: 500 });
  }
}
