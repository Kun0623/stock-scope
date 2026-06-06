import React, { useEffect, useState, useRef } from "react";
// 분리한 컴포넌트들을 불러옵니다.
import { OverviewTab } from "../components/macro/OverviewTab";
import { NewsTab } from "../components/macro/NewsTab";
import { IndicatorsTab } from "../components/macro/IndicatorsTab";
import { BacktestTab } from "../components/macro/BacktestTab";
import { TabButton } from "../components/macro/MacroShared";

// ==========================================
// 1. 글로벌 CSS
// ==========================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; overflow: hidden; background: #0a0a0a; color: #f5f5f5; font-family: 'Pretendard', sans-serif; } 
    .fade-in { animation: fadeIn 0.4s ease-out; display: flex; flex-direction: column; min-height: 100%; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulseLive { 0% { opacity: 1; box-shadow: 0 0 8px #00d26a; } 50% { opacity: 0.3; box-shadow: none; } 100% { opacity: 1; box-shadow: 0 0 8px #00d26a; } }
    .skeleton { background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 8px; }
    @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `}</style>
);

// ==========================================
// 2. 로딩 상태 UX 
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
// 3. 메인 대시보드 페이지 (라우터 역할)
// ==========================================
export function MacroDashboardPage() {
  const [macroData, setMacroData] = useState<any>(null);
  const [backtestData, setBacktestData] = useState<any[]>([]); 
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isPro] = useState<boolean>(true); 
  const [lastCheckedTime, setLastCheckedTime] = useState<Date>(new Date());
  
  const lastUpdateTimeRef = useRef<string>(""); 

  useEffect(() => {
    // 실시간 매크로 데이터 패칭
    const fetchData = async () => {
      try {
        const TARGET_URL = "https://gist.githubusercontent.com/Kun0623/6ff77031bd5979e9177a21272fac7018/raw/macro_status.json";
        const response = await fetch(`${TARGET_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("네트워크 오류");
        
        // ✨ JSON으로 바로 변환하지 않고 텍스트로 먼저 받습니다.
        const textData = await response.text(); 
        
        // ✨ 파이썬이 보낸 불법 데이터(NaN)를 합법적인 데이터(null)로 교체합니다.
        const sanitizedText = textData.replace(/:\s*NaN/g, ': null'); 
        
        // ✨ 그 다음에 안전하게 JSON으로 파싱합니다.
        const data = JSON.parse(sanitizedText);

        if (data.updated_at !== lastUpdateTimeRef.current) {
          lastUpdateTimeRef.current = data.updated_at;
          setMacroData(data);
          setLastCheckedTime(new Date());
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };

    // 백테스트 시계열 데이터 패칭
    const fetchBacktest = async () => {
      try {
        const res = await fetch(`/backtest_data.json?t=${new Date().getTime()}`);
        if (res.ok) {
          const data = await res.json();
          setBacktestData(data);
        }
      } catch (e) { console.error("백테스트 로드 실패", e); }
    };

    fetchData();
    fetchBacktest(); 
    const intervalId = setInterval(fetchData, 30000); 
    return () => clearInterval(intervalId);
  }, []);

  const dataDateString = macroData?.updated_at 
    ? new Date(macroData.updated_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : "로딩중...";

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#0a0a0a" }}>
      <GlobalStyles />
      
      {/* 🚀 글로벌 네비게이션 헤더 */}
      <div style={{ flexShrink: 0, width: "100%", padding: "10px 16px", background: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 13, color: "#eee", fontWeight: 700 }}>데이터 기준: {dataDateString}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d26a", animation: "pulseLive 2s infinite" }} />
            <span style={{ fontSize: 10, color: "#00d26a", fontWeight: 600 }}>자동 스캔 중 (최근: {lastCheckedTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})</span>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #3182ce, #805ad5)", color: "#fff", padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
          <span>✨</span> 베타 프리패스
        </div>
      </div>
      
      {/* 🚀 분기 처리로 엄청나게 깔끔해진 본문 영역 */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {!macroData ? <SkeletonLoadingUI /> : (
          <div className="fade-in" style={{ paddingBottom: 100 }}>
            {activeTab === "overview" && <OverviewTab data={macroData} isPro={isPro} />}
            {activeTab === "news" && <NewsTab data={macroData} isPro={isPro} />}
            {activeTab === "indicators" && <IndicatorsTab data={macroData} isPro={isPro} />}
            {activeTab === "backtest" && <BacktestTab backtestData={backtestData} />}
          </div>
        )}
      </div>

      {/* 🚀 하단 탭 바 (공유 컴포넌트 사용) */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-around", alignItems: "center", paddingBottom: "env(safe-area-inset-bottom)", zIndex: 9999 }}>
        <TabButton id="overview" icon="🌎" label="오버뷰" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="news" icon="📰" label="AI 뉴스" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="indicators" icon="📊" label="지표상세" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="backtest" icon="⏱️" label="백테스트" activeTab={activeTab} onClick={setActiveTab} />
      </div>
    </div>
  );
}