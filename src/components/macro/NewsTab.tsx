import React from "react";
// ✨ 토스 공통 배너 컴포넌트 임포트 추가
import { TossBanner } from "./MacroShared"; 

export function NewsTab({ data, isPro }: { data: any, isPro: boolean }) {
  if (!data.ai_sentiment) return null;
  
  // 뉴스 데이터가 배열로 올 경우를 대비한 방어 로직 & 기본 더미 데이터
  const rawNews = data.ai_sentiment?.news_sources || data.ai_sentiment?.news || data.news;
  // 실제 수집된 뉴스만 보여 준다 (예시 기사를 언론사 이름으로 보여 주지 않음)
  const newsSources = Array.isArray(rawNews) ? rawNews : [];

  return (
    // ✨ 변경: 전체 좌우 패딩을 빼고(0px) gap으로 간격 제어. TossBanner의 내장 마진과 충돌 방지!
    <div style={{ padding: "20px 0px 30px", display: "flex", flexDirection: "column", gap: 12 }}> 
      
      {/* 1. AI 마켓 센티먼트 요약 패널 */}
      <div style={{ padding: "0 16px" }}>
        <div className="paywall-container glass-panel">
          <div className={!isPro ? "paywall-blur" : ""} style={{ padding: "22px 20px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #3182ce, #805ad5)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 14, boxShadow: "0 2px 8px rgba(128, 90, 213, 0.4)" }}>✨</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#fff", letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>시장 분위기</h3>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#b197fc", background: "rgba(128,90,213,0.18)", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>AI 요약</span>
              </div>
              
              {/* 센티먼트 원형 게이지 차트 */}
              {(() => {
                const sScore = data.ai_sentiment.sentiment_score ?? 50;
                const isGood = sScore >= 60;
                const isBad = sScore <= 40;
                const sColor = isGood ? "#00d26a" : isBad ? "#ff4d4d" : "#ffb800";
                const sText = isGood ? "탐욕" : isBad ? "공포" : "중립";
                const r = 16;
                const circ = 2 * Math.PI * r;

                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", padding: "6px 14px 6px 6px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ position: "relative", width: 36, height: 36 }}>
                      <svg width="36" height="36" viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="20" cy="20" r={r} fill="none" stroke="#2a2a2a" strokeWidth="4" />
                        <circle cx="20" cy="20" r={r} fill="none" stroke={sColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - sScore / 100)} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 11, fontWeight: 900, color: sColor }}>{sScore}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#ccc", whiteSpace: "nowrap" }}>투심 {sText}</span>
                  </div>
                );
              })()}
            </div>
            
            <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5, marginBottom: 14, wordBreak: "keep-all" }}>생성형 AI(Google Gemini)가 해외 뉴스 제목을 바탕으로 요약했어요. 사실과 다를 수 있으니 원문을 함께 확인해 주세요.</div>
            {/* AI 3줄 요약 텍스트 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {data.ai_sentiment.summary?.map((line: string, idx: number) => (
                <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#805ad5", marginTop: 7, flexShrink: 0, boxShadow: "0 0 8px rgba(128, 90, 213, 0.8)" }} />
                  <p style={{ margin: 0, fontSize: 14, color: "#eee", lineHeight: 1.6, wordBreak: "keep-all", letterSpacing: "-0.3px" }}>
                    {line.replace(/^[0-9]+\.\s*/, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✨ [신규] 섹션 중간: 리스트형 광고 삽입 구역 (AI 요약과 외신 기사 사이의 시각적 쉼표 역할) */}
      <div style={{ margin: "4px 0" }}>
        <TossBanner 
          adGroupId="ait.v2.live.9385fff4639c4949" 
          minHeight="72px"
        />
      </div>

      {/* 2. 주요 외신 기사 리스트 */}
      {newsSources.length > 0 && (
        <div style={{ padding: "0 16px" }}>
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16 }}>🗞️</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>주요 외신 및 근거 자료</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {newsSources.map((news: any, idx: number) => (
                <div key={idx} style={{ 
                  paddingBottom: 16, 
                  borderBottom: idx !== newsSources.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", 
                  marginBottom: idx !== newsSources.length - 1 ? 0 : -16 
                }}>
                  <div style={{ fontSize: 11, color: "#805ad5", fontWeight: 800, marginBottom: 6 }}>
                    {news.source || news.provider || "Global News"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#eee", marginBottom: 6, lineHeight: 1.4, wordBreak: "keep-all" }}>
                    {news.title}
                  </div>
                  {news.summary && (
                    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, wordBreak: "keep-all" }}>
                      <span style={{ color: "#b197fc", fontWeight: 700 }}>AI 요약 · </span>{news.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✨ [신규] 맨 하단: 피드형(대형) 광고 삽입 구역 (기사 소비 완료 후 가장 이탈이 많이 일어나는 곳에 배치) */}
      <div style={{ marginTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 16px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Sponsor</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
        </div>
        <TossBanner adGroupId="ait.v2.live.2a44e2b76a1e4173" minHeight="250px" />
      </div>

    </div>
  );
}