import React, { useEffect, useState, useRef } from "react";
// 분리한 컴포넌트들을 불러옵니다.
import { OverviewTab } from "../components/macro/OverviewTab";
import { NewsTab } from "../components/macro/NewsTab";
import { IndicatorsTab } from "../components/macro/IndicatorsTab";
import { BacktestTab } from "../components/macro/BacktestTab";
import { TabButton, DisclaimerTicker } from "../components/macro/MacroShared";

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
    
    /* ✨ 수정: 색상은 인라인 스타일로 제어하고 투명도만 깜빡이도록 변경 */
    @keyframes pulseLive { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    
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
  
  const lastUpdateTimeRef = useRef<string>(""); 

  // ✨ 신규: 서머타임 자동 적용 미국장 상태 판별기
  const getUSMarketStatus = () => {
    const now = new Date();
    // 뉴욕 현지 시간으로 변환 (서머타임 자동 계산)
    const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    
    const day = nyTime.getDay(); // 0: 일요일, 6: 토요일
    const hours = nyTime.getHours();
    const minutes = nyTime.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // 1. 주말 휴장
    if (day === 0 || day === 6) {
      return { text: "미국장 휴장 (주말)", color: "#888", isBlinking: false };
    }

    // 시간대 정의 (뉴욕 기준 분 단위)
    const PRE_MARKET_START = 4 * 60;          // 04:00
    const REGULAR_START = 9 * 60 + 30;        // 09:30
    const REGULAR_END = 16 * 60;              // 16:00
    const AFTER_HOURS_END = 20 * 60;          // 20:00

    // 2. 시간대별 상태 매핑
    if (timeInMinutes >= PRE_MARKET_START && timeInMinutes < REGULAR_START) {
      return { text: "🇺🇸 미국 프리마켓", color: "#ffb800", isBlinking: true }; // 노란불
    } else if (timeInMinutes >= REGULAR_START && timeInMinutes < REGULAR_END) {
      return { text: "🇺🇸 미국 정규장 진행중", color: "#00d26a", isBlinking: true }; // 초록불
    } else if (timeInMinutes >= REGULAR_END && timeInMinutes < AFTER_HOURS_END) {
      return { text: "🇺🇸 미국 애프터마켓", color: "#3182ce", isBlinking: true }; // 파란불
    } else {
      return { text: "미국장 휴장", color: "#888", isBlinking: false }; // 회색불
    }
  };

  const [marketStatus, setMarketStatus] = useState(getUSMarketStatus());

  useEffect(() => {
    // 실시간 매크로 데이터 패칭
    const fetchData = async () => {
      try {
        const TARGET_URL = "https://gist.githubusercontent.com/Kun0623/6ff77031bd5979e9177a21272fac7018/raw/macro_status.json";
        const response = await fetch(`${TARGET_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("네트워크 오류");
        
        const textData = await response.text(); 
        const sanitizedText = textData.replace(/:\s*NaN/g, ': null'); 
        const data = JSON.parse(sanitizedText);

        if (data.updated_at !== lastUpdateTimeRef.current) {
          lastUpdateTimeRef.current = data.updated_at;
          setMacroData(data);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };

    // 백테스트 시계열 데이터 패칭
    const fetchBacktest = async () => {
      try {
        // 앱 번들 정적 파일 대신 macro_status.json과 동일한 Gist에서 실시간으로 가져옴
        // (앱 재빌드 없이는 정적 파일이 갱신되지 않아 데이터가 멈춰 보이는 문제 수정)
        const BACKTEST_URL = "https://gist.githubusercontent.com/Kun0623/6ff77031bd5979e9177a21272fac7018/raw/backtest_data.json";
        const res = await fetch(`${BACKTEST_URL}?t=${new Date().getTime()}`);
        if (res.ok) {
          const data = await res.json();
          setBacktestData(data);
        }
      } catch (e) { console.error("백테스트 로드 실패", e); }
    };

    fetchData();
    fetchBacktest(); 
    
    // 데이터 갱신 타이머 (30초)
    const dataIntervalId = setInterval(fetchData, 30000); 
    
    // ✨ 시장 상태 갱신 타이머 (1분)
    const statusIntervalId = setInterval(() => {
      setMarketStatus(getUSMarketStatus());
    }, 60000); 

    // 클린업 함수 통합
    return () => {
      clearInterval(dataIntervalId);
      clearInterval(statusIntervalId);
    };
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
          
          {/* ✨ UI 변경: 쓸데없는 시간 표시 대신 시장 상태 표시 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ 
              width: 6, height: 6, borderRadius: "50%", 
              background: marketStatus.color, 
              animation: marketStatus.isBlinking ? "pulseLive 2s infinite" : "none",
              boxShadow: marketStatus.isBlinking ? `0 0 6px ${marketStatus.color}` : "none" 
            }} />
            <span style={{ fontSize: 11, color: marketStatus.color, fontWeight: 700 }}>
              {marketStatus.text}
            </span>
          </div>
        </div>
        
        <div style={{ background: "linear-gradient(135deg, #3182ce, #805ad5)", color: "#fff", padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
          <span>✨</span> 베타 서비스
        </div>
      </div>
      
      {/* 🚀 분기 처리로 엄청나게 깔끔해진 본문 영역 */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {!macroData ? <SkeletonLoadingUI /> : (
          <div className="fade-in" style={{ paddingBottom: 120 }}>
            {activeTab === "overview" && <OverviewTab data={macroData} isPro={isPro} />}
            {activeTab === "news" && <NewsTab data={macroData} isPro={isPro} />}
            {activeTab === "indicators" && <IndicatorsTab data={macroData} isPro={isPro} />}
            {activeTab === "backtest" && <BacktestTab backtestData={backtestData} />}
          </div>
        )}
      </div>

      {/* 🚀 하단 탭 바 & 전광판 통합 컨테이너 */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
        
        <DisclaimerTicker />

        <div style={{ height: 80, background: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-around", alignItems: "center", paddingBottom: "env(safe-area-inset-bottom)" }}>
          <TabButton id="overview" icon="🌎" label="오버뷰" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton id="news" icon="📰" label="AI 뉴스" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton id="indicators" icon="📊" label="지표상세" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton id="backtest" icon="⏱️" label="백테스트" activeTab={activeTab} onClick={setActiveTab} />
        </div>
        
      </div>
    </div>
  );
}