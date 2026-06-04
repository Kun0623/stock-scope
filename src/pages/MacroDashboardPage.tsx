import React, { useEffect, useState } from "react";

// ==========================================
// 1. 글로벌 CSS
// ==========================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; overflow: hidden; background: #0a0a0a; } 
    
    .fade-in { animation: fadeIn 0.4s ease-out; display: flex; flex-direction: column; min-height: 100%; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    
    .skeleton { background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 8px; }
    @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .tooltip-wrapper { position: relative; display: inline-flex; cursor: help; align-items: center; gap: 4px; }
    .tooltip-wrapper:hover .tooltip-box { opacity: 1; visibility: visible; transform: translateY(-4px); }
    
    .tooltip-box { 
      position: absolute; bottom: 100%; left: 0; margin-bottom: 8px; opacity: 0; visibility: hidden; 
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(30, 30, 30, 0.95); 
      border: 1px solid #444; backdrop-filter: blur(4px); padding: 10px 14px; border-radius: 8px; 
      font-size: 12px; font-weight: 500; color: #eee; white-space: normal; word-break: keep-all; 
      width: max-content; max-width: 220px; z-index: 50; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.5); line-height: 1.4;
    }
    .tooltip-box::after { 
      content: ''; position: absolute; top: 100%; left: 20px; margin-left: -5px; border-width: 5px; 
      border-style: solid; border-color: rgba(30, 30, 30, 0.95) transparent transparent transparent; 
    }

    .glass-panel { background: #161616; border: 1px solid #262626; border-radius: 16px; transition: transform 0.2s, box-shadow 0.2s; }
    .glass-panel:hover { border-color: #333; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }

    .paywall-container { position: relative; border-radius: 16px; } 
    .paywall-blur { filter: blur(6px) brightness(0.6); pointer-events: none; user-select: none; }
    .paywall-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(10, 10, 10, 0.4); z-index: 10; padding: 20px; text-align: center; border-radius: 16px; }
  `}</style>
);

// ==========================================
// 2. 메인 대시보드 페이지 컴포넌트
// ==========================================
export function MacroDashboardPage() {
  const [macroData, setMacroData] = useState<any>(null);
  const [isPro] = useState<boolean>(true); 
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    // ✨ 1번 사안: 데이터를 주기적으로 불러오는 함수
    const fetchData = async () => {
      try {
        const GITHUB_RAW_URL = "https://gist.githubusercontent.com/Kun0623/6ff77031bd5979e9177a21272fac7018/raw/macro_status.json";
        const response = await fetch(`${GITHUB_RAW_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("네트워크 응답 오류");
        const data = await response.json();
        setMacroData(data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };

    fetchData(); // 컴포넌트가 켜질 때 최초 1회 즉시 실행
    
    // 60,000ms(1분)마다 fetchData를 백그라운드에서 다시 실행하여 자동 갱신
    const intervalId = setInterval(fetchData, 60000); 

    // 컴포넌트가 화면에서 사라질 때 타이머 청소
    return () => clearInterval(intervalId);
  }, []);

  const updateTimeString = macroData?.updated_at 
    ? `업데이트: ${new Date(macroData.updated_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : "데이터 로딩중...";

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Pretendard', sans-serif" }}>
      <GlobalStyles />
      
      {/* 🚀 상단 고정 네비게이션 바 */}
      <div style={{ 
        flexShrink: 0, width: "100%", padding: "12px 16px", 
        background: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)", 
        display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100
      }}>
        <span style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>{updateTimeString}</span>
        
        <div style={{ background: "linear-gradient(135deg, #3182ce, #805ad5)", color: "#fff", padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, boxShadow: "0 2px 8px rgba(128, 90, 213, 0.4)", display: "flex", alignItems: "center", gap: 4 }}>
          <span>✨</span> 베타 프리패스
        </div>
      </div>

      {/* 🚀 스크롤 가능한 본문 데이터 영역 */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {!macroData ? (
          <SkeletonLoadingUI />
        ) : (
          <DashboardContent data={macroData} isPro={isPro} activeTab={activeTab} />
        )}
        <div style={{ height: 100 }} />
      </div>

      {/* 🚀 하단 탭 바 */}
      <div style={{ 
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80, 
        background: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom)", zIndex: 9999 
      }}>
        <TabButton id="overview" icon="🌎" label="오버뷰" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="news" icon="📰" label="AI 뉴스" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="indicators" icon="📊" label="지표상세" activeTab={activeTab} onClick={setActiveTab} />
      </div>

    </div>
  );
}

// ==========================================
// 3. 로딩 상태 UX (Skeleton UI)
// ==========================================
function SkeletonLoadingUI() {
  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
      <div className="skeleton" style={{ height: 70, borderRadius: 16 }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
      </div>
    </div>
  );
}

// ==========================================
// 4. 데이터 렌더링 본문
// ==========================================
function DashboardContent({ data, isPro, activeTab }: { data: any, isPro: boolean, activeTab: string }) {
  let dangerCount = 0;
  if (data.fear_greed?.value <= 25) dangerCount++;
  if (data.buffett_indicator?.value >= 180) dangerCount++;
  if (data.sahm_rule?.value >= 0.5) dangerCount++;
  if (data.high_yield_spread?.value >= 5.0) dangerCount++;
  if (data.yield_curve?.value < 0) dangerCount++;
  if (data.vix?.value >= 25) dangerCount++;

  let shield = { title: "안정적 추세 구간", desc: "주요 거시 지표가 장기 평균치에 수렴하는 안정적인 흐름을 보이고 있습니다.", color: "#00d26a", bg: "#00d26a10", level: "green" };
  if (dangerCount >= 3) {
    shield = { title: "고변동성 국면 진입", desc: "과거 통계상 마켓 스트레스 지수가 상위 15%에 위치한 고위험 구간입니다.", color: "#ff4d4d", bg: "#ff4d4d10", level: "red" };
  } else if (dangerCount >= 1) {
    shield = { title: "추세 전환 모니터링", desc: "지표 간 디커플링으로 인해 단기 변동성 추세가 관측되는 구간입니다.", color: "#ffb800", bg: "#ffb80010", level: "yellow" };
  }

  const riskScore = data.quant_risk_score ?? 50;
  const scoreColor = riskScore >= 65 ? "#ff4d4d" : riskScore >= 35 ? "#ffb800" : "#00d26a";
  
  const rawNews = data.ai_sentiment?.news_sources || data.ai_sentiment?.news || data.news;
  const newsSources = (rawNews && rawNews.length > 0) ? rawNews : [
    { provider: "Bloomberg", title: "기술주 전반에 걸친 선별적 강세 지속", summary: "AI 모멘텀이 시장을 주도하는 가운데 차별화 장세가 펼쳐지고 있습니다." },
    { provider: "Reuters", title: "스페이스X 초대형 상장 추진... 시장 낙관론 강화", summary: "대어급 IPO 소식이 투자 심리를 긍정적으로 자극하고 있습니다." },
    { provider: "WSJ", title: "중동 지정학적 긴장 고조, 증시 하방 압력", summary: "거시경제 환경의 리스크가 커지며 단기적인 시장 변동성이 확대될 수 있습니다." }
  ];

  // ✨ 3번 사안: 실제 파이썬 백엔드 연동 전까지 화면을 꽉 채워줄 주요 지표 더미 데이터 (백엔드에 data.major_indices 가 생기면 자동 대체됨)
  const majorIndices = data.major_indices || [
    { name: "KOSPI", value: 2680.12, change: 1.24, change_pct: 0.05 },
    { name: "S&P 500", value: 5304.72, change: -10.5, change_pct: -0.20 },
    { name: "NASDAQ", value: 16736.03, change: 45.2, change_pct: 0.27 },
    { name: "WTI 원유", value: 78.45, change: 1.2, change_pct: 1.50 },
    { name: "금 (Gold)", value: 2350.20, change: -5.4, change_pct: -0.23 },
    { name: "미 10년물 국채", value: 4.45, change: -0.02, change_pct: -0.02 },
  ];

  return (
    <div className="fade-in">
      
      {/* 📱 탭 1: 오버뷰 */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 마스터 쉴드 */}
          <div style={{ padding: "20px 16px 0px" }}>
            <div style={{ background: shield.bg, border: `1px solid ${shield.color}30`, borderRadius: 16, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: shield.color, marginBottom: 8 }}>매크로 스트레스 가이드</div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#fff" }}>{shield.title}</h2>
                  <p style={{ fontSize: 14, color: "#aaa", margin: 0, wordBreak: "keep-all" }}>{shield.desc}</p>
                </div>
                <div style={{ display: "flex", gap: 6, background: "#000", padding: "8px 12px", borderRadius: 20, border: "1px solid #333" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: shield.level === "red" ? "#ff4d4d" : "#222", boxShadow: shield.level === "red" ? "0 0 10px #ff4d4d" : "none" }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: shield.level === "yellow" ? "#ffb800" : "#222", boxShadow: shield.level === "yellow" ? "0 0 10px #ffb800" : "none" }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: shield.level === "green" ? "#00d26a" : "#222", boxShadow: shield.level === "green" ? "0 0 10px #00d26a" : "none" }} />
                </div>
              </div>
            </div>
          </div>

          {/* 퀀트 스코어 */}
          <div style={{ padding: "0 16px" }}>
            <div className="paywall-container glass-panel" style={{ minHeight: 140, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className={!isPro ? "paywall-blur" : ""} style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <Tooltip label="통합 마켓 스코어" desc="5종의 매크로 지표 가중치를 연산한 위험 계수" />
                  <div style={{ fontSize: 12, color: "#888", fontWeight: 500, wordBreak: "keep-all" }}>현재 시장 위험도 종합 수치</div>
                </div>
                
                {(() => {
                  const markerX = 100 - 80 * Math.cos((riskScore / 100) * Math.PI);
                  const markerY = 100 - 80 * Math.sin((riskScore / 100) * Math.PI);
                  return (
                    <div style={{ position: "relative", width: "140px", height: "90px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginRight: "10px" }}>
                      <svg width="130" height="80" viewBox="0 0 200 120" style={{ overflow: "visible" }}>
                        <defs>
                          <linearGradient id="scoreZones" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00d26a" stopOpacity="0.25" />
                            <stop offset="27.3%" stopColor="#00d26a" stopOpacity="0.25" />
                            <stop offset="27.3%" stopColor="#ffb800" stopOpacity="0.25" />
                            <stop offset="72.7%" stopColor="#ffb800" stopOpacity="0.25" />
                            <stop offset="72.7%" stopColor="#ff4d4d" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#ff4d4d" stopOpacity="0.25" />
                          </linearGradient>
                        </defs>
                        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#scoreZones)" strokeWidth="18" strokeLinecap="round" />
                        <path d="M 67.8 36.8 L 59.6 20.7" fill="none" stroke="#161616" strokeWidth="4" />
                        <path d="M 132.2 36.8 L 140.4 20.7" fill="none" stroke="#161616" strokeWidth="4" />
                        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={scoreColor} strokeWidth="18" strokeLinecap="round" strokeDasharray={Math.PI * 80} strokeDashoffset={(Math.PI * 80) * (1 - riskScore / 100)} style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                        <circle cx={markerX} cy={markerY} r="12" fill={scoreColor} opacity="0.4" style={{ transition: "cx 1.5s cubic-bezier(0.4, 0, 0.2, 1), cy 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                        <circle cx={markerX} cy={markerY} r="6" fill="#fff" style={{ transition: "cx 1.5s cubic-bezier(0.4, 0, 0.2, 1), cy 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                      </svg>
                      <div style={{ position: "absolute", top: "50%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: 26, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{riskScore}</span>
                      </div>
                      <div style={{ position: "absolute", bottom: 0, width: "100%", display: "flex", justifyContent: "space-between", padding: "0 5px" }}>
                        <span style={{ fontSize: 10, color: "#00d26a", fontWeight: 700 }}>안정</span>
                        <span style={{ fontSize: 10, color: "#ff4d4d", fontWeight: 700 }}>위험</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 홈 화면 심화 게이지 지표 */}
          <div style={{ padding: "0 16px" }}>
            <div className="glass-panel" style={{ padding: "24px 20px" }}>
              <GaugeRow title="공포탐욕 지수" tooltip="시장 참여자들의 심리 상태" value={data.fear_greed?.value} type="fear_greed" />
              <div style={{ height: 32 }} />
              <GaugeRow title="버핏 지표" tooltip="GDP 대비 시가총액 (180% 이상 고평가 영역)" value={data.buffett_indicator?.value} suffix="%" type="buffett" />
              <div style={{ height: 32 }} />
              <SeesawRow title="장단기 금리차" tooltip="마이너스 진입 시 경기 침체 통계적 전조" value={data.yield_curve?.value} />
            </div>
          </div>

          {/* 홈 화면 미니 팩터 그리드 */}
          <div style={{ padding: "0 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <GridCard title="숌 룰 지수" tooltip="실업률 기반 침체 확률 (0.5% 임계치)" value={data.sahm_rule?.value} suffix="%" threshold={0.5} />
              <GridCard title="하이일드" tooltip="기업 신용 경색 지표 (5.0% 임계치)" value={data.high_yield_spread?.value} suffix="%" threshold={5.0} />
              <GridCard title="VIX 지수" tooltip="S&P 500 변동성 (25 이상 고변동성)" value={data.vix?.value} suffix="" threshold={25} />
              <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Tooltip label="원/달러 환율" desc="DXY 달러 인덱스 연동" />
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{data.fx?.usd_krw?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>달러 인덱스: {data.fx?.dxy}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📱 탭 2: AI 뉴스 브리핑 */}
      {activeTab === "news" && data.ai_sentiment && (
        <div style={{ padding: "20px 16px 12px", display: "flex", flexDirection: "column", gap: 12 }}> 
          <div className="paywall-container glass-panel">
            <div className={!isPro ? "paywall-blur" : ""} style={{ padding: "22px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #3182ce, #805ad5)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 14, boxShadow: "0 2px 8px rgba(128, 90, 213, 0.4)" }}>✨</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#fff", letterSpacing: "-0.5px" }}>AI 마켓 센티먼트</h3>
                </div>
                
                {(() => {
                  const sScore = data.ai_sentiment.sentiment_score;
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
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#ccc" }}>투심 {sText}</span>
                    </div>
                  );
                })()}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.ai_sentiment.summary.map((line: string, idx: number) => (
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

          {/* 주요 외신 출처(타이틀 및 요약) 리스트 노출 영역 */}
          {newsSources.length > 0 && (
            <div className="glass-panel" style={{ padding: "20px", marginTop: "4px" }}>
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
                        {news.summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📱 탭 3: 지표상세 (주요지표, 테마, 섹터) */}
      {activeTab === "indicators" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 20 }}>
          <div style={{ padding: "0 16px" }}>
            
            {/* ✨ 3번 사안: 주요 핵심 지표 대시보드 추가 */}
            <div className="glass-panel" style={{ padding: "20px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#fff" }}>📈 주요 핵심 지표</h3>
                <span style={{ fontSize: 11, color: "#666" }}>글로벌 자산 동향</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {majorIndices.map((idxItem: any, i: number) => (
                  <MajorIndexTile key={i} item={idxItem} />
                ))}
              </div>
            </div>

            {data.theme_trends && (
              <div className="paywall-container glass-panel" style={{ marginBottom: 12 }}>
                <div className={!isPro ? "paywall-blur" : ""} style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#ffb800" }}>💡 글로벌 테마 매트릭스</h3>
                    <span style={{ fontSize: 11, color: "#666" }}>메가 트렌드 vs 단기 모멘텀</span>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#888", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>🚀</span> 장기 구조적 주도 테마 (Mega)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {data.theme_trends.mega?.map((t: any) => (
                        <TrendRow key={t.ticker} item={t} /> 
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#888", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>🔥</span> 이머징 & 핫 모멘텀 테마 (Recent)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {data.theme_trends.recent?.map((t: any) => (
                        <TrendRow key={t.ticker} item={t} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#fff" }}>🌍 GICS 12개 상세 섹터</h3>
                <span style={{ fontSize: 11, color: "#666" }}>최근 2영업일 기준</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {data.sectors?.map((s: any, idx: number) => (
                  <SectorTile key={s.ticker} item={s} rank={idx + 1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ 모든 화면 최하단에 공통으로 노출되는 법적 면책 조항 */}
      <div style={{ padding: "24px 20px 32px", textAlign: "justify", marginTop: "auto" }}>
        <p style={{ fontSize: 10, color: "#555", lineHeight: 1.5, margin: 0 }}>
          <strong>면책 조항:</strong> 본 서비스가 제공하는 모든 매크로 점수 및 테마 등락률 정보는 오픈 API를 기반으로 연산된 단순 통계 데이터이며, 어떠한 경우에도 특정 자산의 매수/매도 권유 또는 투자 자문을 구성하지 않습니다. 모든 투자 결정의 최종 책임은 사용자 본인에게 있습니다.
        </p>
      </div>

    </div>
  );
}

// ==========================================
// 5. 잘게 쪼갠 UI 하위 컴포넌트들
// ==========================================

function TabButton({ id, icon, label, activeTab, onClick }: any) {
  const isActive = activeTab === id;
  const color = isActive ? "#00d26a" : "#666"; 
  
  return (
    <div onClick={() => onClick(id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", width: 70, transition: "all 0.2s" }}>
      <div style={{ fontSize: 22, filter: isActive ? "drop-shadow(0 0 8px rgba(0, 210, 106, 0.4))" : "none", transform: isActive ? "scale(1.15) translateY(-2px)" : "scale(1)", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 600, color }}>{label}</span>
    </div>
  );
}

function Tooltip({ label, desc }: { label: string, desc: string }) {
  return (
    <div className="tooltip-wrapper">
      <span style={{ fontSize: 13, fontWeight: 700, color: "#888", borderBottom: "1px dotted #666" }}>{label}</span>
      <span style={{ fontSize: 14, color: "#666" }}>ⓘ</span>
      <div className="tooltip-box">{desc}</div>
    </div>
  );
}

function GaugeRow({ title, tooltip, value, suffix = "", type = "default" }: any) {
  if (value === undefined) return null;
  let percent = 50, gradient = "", statusText = "", statusColor = "#fff", leftLabel = "", rightLabel = "";

  if (type === "fear_greed") {
    percent = Math.max(0, Math.min(100, value));
    gradient = "linear-gradient(90deg, #ff4d4d 0%, #ffb800 25%, #00d26a 50%, #ffb800 75%, #ff4d4d 100%)";
    leftLabel = "극단적 공포"; rightLabel = "극단적 탐욕 (버블)";
    if (value <= 25) { statusText = "극단적 공포"; statusColor = "#ff4d4d"; }
    else if (value <= 45) { statusText = "공포 구간"; statusColor = "#ffb800"; }
    else if (value <= 55) { statusText = "중립"; statusColor = "#aaa"; }
    else if (value <= 75) { statusText = "건강한 탐욕"; statusColor = "#00d26a"; }
    else { statusText = "과열 / 버블 경고"; statusColor = "#ff4d4d"; }
  } else if (type === "buffett") {
    percent = Math.max(0, Math.min(100, ((value - 50) / 150) * 100));
    gradient = "linear-gradient(90deg, #00d26a 0%, #ffb800 60%, #ff4d4d 100%)";
    leftLabel = "저평가 (50%)"; rightLabel = "고평가 (200%+)";
    if (value <= 100) { statusText = "저평가 구간"; statusColor = "#00d26a"; }
    else if (value <= 130) { statusText = "적정 가치"; statusColor = "#aaa"; }
    else if (value <= 180) { statusText = "경계 구간"; statusColor = "#ffb800"; }
    else { statusText = "심각 고평가"; statusColor = "#ff4d4d"; }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 16 }}>
        <Tooltip label={title} desc={tooltip} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: statusColor, letterSpacing: "-0.5px" }}>{value}{suffix}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: statusColor, opacity: 0.9, marginTop: 4 }}>{statusText}</div>
        </div>
      </div>
      <div style={{ position: "relative", width: "100%", height: 10, borderRadius: 10, background: gradient, marginBottom: 10, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)" }}>
        <div style={{ position: "absolute", left: `calc(${percent}% - 8px)`, top: -4, width: 18, height: 18, background: "#fff", borderRadius: "50%", border: `4px solid ${statusColor}`, boxShadow: "0 2px 8px rgba(0,0,0,0.6)", transition: "left 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#666" }}>
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

function SeesawRow({ title, tooltip, value }: any) {
  if (value === undefined) return null;
  const isInv = value < 0;
  const leftPos = isInv ? `${Math.max(0, 50 + value * 25)}%` : "50%";
  const barWidth = `${Math.min(50, Math.abs(value) * 25)}%`;
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 16 }}>
        <Tooltip label={title} desc={tooltip} />
        <div style={{ textAlign: "right" }}>
           <div style={{ fontSize: 24, fontWeight: 900, color: isInv ? "#ff4d4d" : "#00d26a", letterSpacing: "-0.5px" }}>{value > 0 ? "+" : ""}{value}%p</div>
           <div style={{ fontSize: 13, fontWeight: 800, color: isInv ? "#ff4d4d" : "#00d26a", opacity: 0.9, marginTop: 4 }}>{isInv ? "금리 역전 (침체 경고)" : "정상 구간"}</div>
        </div>
      </div>
      <div style={{ position: "relative", width: "100%", height: 10, background: "#222", borderRadius: 10, marginBottom: 10, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: 2, background: "#666", zIndex: 2, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: leftPos, width: barWidth, height: "100%", background: isInv ? "linear-gradient(90deg, #ff4d4d, #ff7676)" : "linear-gradient(90deg, #00d26a, #4ade80)", borderRadius: 10, transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#666" }}>
        <span>역전 (비정상)</span><span>정상 (성장)</span>
      </div>
    </div>
  );
}

function GridCard({ title, tooltip, value, suffix, threshold }: any) {
  if (value === undefined) return null;
  const isDanger = value >= threshold;
  return (
    <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Tooltip label={title} desc={tooltip} />
        {isDanger && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4d4d", boxShadow: "0 0 8px #ff4d4d" }} />}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: isDanger ? "#ff4d4d" : "#fff", marginTop: 12 }}>{value}{suffix}</div>
    </div>
  );
}

// ✨ 2번 사안: TrendRow 컴포넌트에서 뱃지 관련 로직 완전 제거
function TrendRow({ item }: { item: any }) {
  const isPos = item.change_pct >= 0;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 12, fontWeight: 800, color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>{item.ticker}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eee" }}>{item.name}</div>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>테마 주도 자산</div>
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: isPos ? "#ff4d4d" : "#4d94ff", background: isPos ? "rgba(255,77,77,0.1)" : "rgba(77,148,255,0.1)", padding: "6px 12px", borderRadius: 8 }}>{isPos ? "+" : ""}{item.change_pct}%</div>
    </div>
  );
}

function SectorTile({ item, rank }: { item: any, rank: number }) {
  const isPos = item.change_pct >= 0;
  const isTop = rank <= 3;
  return (
    <div style={{ padding: "14px 12px", background: isTop ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", borderRadius: 12, border: isTop ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.04)", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: isTop ? "#ffb800" : "#888", width: 16 }}>{rank}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{item.ticker}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: isPos ? "#ff4d4d" : "#4d94ff" }}>{isPos ? "+" : ""}{item.change_pct}%</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", paddingLeft: 24, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
    </div>
  );
}

// ✨ 3번 사안: 주요 핵심 지표 렌더링용 신규 컴포넌트
function MajorIndexTile({ item }: { item: any }) {
  const isPos = item.change_pct >= 0;
  const color = isPos ? "#ff4d4d" : "#4d94ff";
  const sign = isPos ? "+" : "";
  
  const formatValue = (val: any, name: string) => {
    if (typeof val === 'string') return val;
    if (name.includes('WTI') || name.includes('금')) return `$${val.toLocaleString()}`;
    if (name.includes('국채')) return `${val.toFixed(3)}%`;
    return val.toLocaleString();
  };

  return (
    <div style={{ padding: "14px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#aaa", marginBottom: 8 }}>{item.name}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.5px" }}>{formatValue(item.value, item.name)}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: color }}>
        {sign}{item.change} ({sign}{item.change_pct}%)
      </div>
    </div>
  );
}