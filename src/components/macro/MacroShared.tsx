import React from "react";
import { TossAds } from '@apps-in-toss/web-framework';
import { useEffect, useRef } from "react";

// ✨ 툴팁 전용 전역 스타일 (마우스 오버 이벤트 처리를 위해 필수)
const TooltipStyles = () => (
  <style>{`
    .tooltip-wrapper { position: relative; display: inline-flex; cursor: help; align-items: center; gap: 4px; }
    .tooltip-box { 
      position: absolute; bottom: 100%; left: 0; margin-bottom: 8px; opacity: 0; visibility: hidden; 
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(30, 30, 30, 0.95); 
      border: 1px solid #444; backdrop-filter: blur(4px); padding: 10px 14px; border-radius: 8px; 
      font-size: 12px; font-weight: 500; color: #eee; width: max-content; max-width: 220px; 
      z-index: 9999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.5); line-height: 1.4; word-break: keep-all;
    }
    .tooltip-box::after { 
      content: ''; position: absolute; top: 100%; left: 20px; margin-left: -5px; border-width: 5px; 
      border-style: solid; border-color: rgba(30, 30, 30, 0.95) transparent transparent transparent; 
    }
    .tooltip-wrapper:hover .tooltip-box { opacity: 1; visibility: visible; transform: translateY(-4px); }
  `}</style>
);

// ✨ 변경점: Tooltip에 badge 속성 추가 및 렌더링 로직 추가
export function Tooltip({ label, desc, badge }: { label: string, desc: string, badge?: string }) {
  return (
    <div className="tooltip-wrapper">
      <TooltipStyles />
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#888", borderBottom: "1px dotted #666" }}>{label}</span>
        <span style={{ fontSize: "14px", color: "#666" }}>ⓘ</span>
        {badge && (
          <span style={{ marginLeft: 2, fontSize: 9, fontWeight: 900, color: "#00d26a", background: "rgba(0, 210, 106, 0.15)", padding: "2px 5px", borderRadius: 4 }}>
            {badge}
          </span>
        )}
      </div>
      <div className="tooltip-box">{desc}</div>
    </div>
  );
}

export function TabButton({ id, icon, label, activeTab, onClick }: any) {
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

// ✨ 변경점: GaugeRow에 badge 속성 추가
export function GaugeRow({ title, tooltip, value, suffix = "", type = "default", badge }: any) {
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
        <Tooltip label={title} desc={tooltip} badge={badge} />
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

// ✨ 변경점: SeesawRow에 badge 속성 추가
export function SeesawRow({ title, tooltip, value, badge }: any) {
  if (value === undefined) return null;
  const isInv = value < 0;
  const leftPos = isInv ? `${Math.max(0, 50 + value * 25)}%` : "50%";
  const barWidth = `${Math.min(50, Math.abs(value) * 25)}%`;
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 16 }}>
        <Tooltip label={title} desc={tooltip} badge={badge} />
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

// ✨ 변경점: GridCard에 badge 속성 추가 및 위험(빨간점) 표시 위치 조정
export function GridCard({ title, tooltip, value, suffix, warningThreshold, dangerThreshold, badge }: any) {
  if (value === undefined) return null;
  
  const isDanger = value >= dangerThreshold;
  const isWarning = !isDanger && value >= warningThreshold;

  // 상태에 따른 색상 결정
  const statusColor = isDanger ? "#ff4d4d" : isWarning ? "#ffb800" : "#fff";
  const dotColor = isDanger ? "#ff4d4d" : isWarning ? "#ffb800" : "transparent";

  return (
    <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: isWarning || isDanger ? `1px solid ${dotColor}40` : "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Tooltip label={title} desc={tooltip} badge={badge} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, boxShadow: dotColor !== "transparent" ? `0 0 10px ${dotColor}` : "none", marginTop: 4 }} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: statusColor, marginTop: 12 }}>{value}{suffix}</div>
    </div>
  );
}

export function TrendRow({ item }: { item: any }) {
  const hasData = item.change_pct !== null && item.change_pct !== undefined && !isNaN(item.change_pct);
  const isPos = hasData && item.change_pct >= 0;
  
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
      
      <div style={{ 
        fontSize: 15, fontWeight: 800, 
        color: hasData ? (isPos ? "#ff4d4d" : "#4d94ff") : "#888", 
        background: hasData ? (isPos ? "rgba(255,77,77,0.1)" : "rgba(77,148,255,0.1)") : "rgba(255,255,255,0.05)", 
        padding: "6px 12px", borderRadius: 8 
      }}>
        {hasData ? `${isPos ? "+" : ""}${item.change_pct}%` : "-"}
      </div>
    </div>
  );
}

export function SectorTile({ item, rank }: { item: any, rank: number }) {
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

export function MajorIndexTile({ item }: { item: any }) {
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

export const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: "rgba(20,20,20,0.95)", border: "1px solid #444", borderRadius: "12px", padding: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>S&P 500: {data.sp500.toLocaleString()}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#00d26a", marginTop: 4 }}>NVDA: ${data.nvda}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: data.risk_score >= 70 ? "#ff4d4d" : "#ffb800", marginTop: 8 }}>
          리스크 스코어: {data.risk_score}점
        </div>
        {data.event && (
          <div style={{ marginTop: 12, padding: "8px", background: "rgba(255, 184, 0, 0.1)", borderLeft: "3px solid #ffb800", borderRadius: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#ffb800", marginBottom: 4 }}>📍 {data.event.title}</div>
            <div style={{ fontSize: 11, color: "#ddd" }}>{data.event.desc}</div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function TossBanner({ adGroupId, minHeight = "96px" }: { adGroupId: string, minHeight?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let adInstance: any = null;

    try {
      adInstance = TossAds.attachBanner(adGroupId, containerRef.current, {
        theme: 'dark',
        tone: 'blackAndWhite',
        variant: 'expanded'
      });
    } catch (error) {
      console.error("광고 로드 실패:", error);
    }

    return () => {
      if (adInstance && typeof adInstance.destroy === 'function') {
        adInstance.destroy();
      }
    };
  }, [adGroupId]);

  return (
    // ✨ 변경: width를 100%가 아닌 auto로 두고, margin을 0 16px로 줘서 양옆 여백을 강제합니다.
    <div style={{ 
      margin: "0 16px", 
      minHeight, 
      borderRadius: "16px", // 피드형에 어울리게 테두리도 더 둥글게(16px) 처리
      overflow: "hidden", 
      background: "rgba(255,255,255,0.02)", 
      border: "1px solid rgba(255,255,255,0.05)"
    }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

// ✨ 신규: 하단 전광판(Ticker) 면책 조항 컴포넌트
export const DisclaimerTicker = () => (
  <div style={{
    width: "100%",
    background: "rgba(20, 20, 20, 0.9)",
    borderTop: "1px solid rgba(255, 184, 0, 0.2)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.02)",
    padding: "6px 0",
    overflow: "hidden",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 -4px 10px rgba(0,0,0,0.3)" // 살짝 위로 그림자를 줘서 네비게이션과 구분
  }}>
    <style>{`
      @keyframes ticker-scroll {
        0% { transform: translateX(100vw); }
        100% { transform: translateX(-150%); }
      }
      .ticker-content {
        display: inline-block;
        white-space: nowrap;
        animation: ticker-scroll 18s linear infinite; /* 18초 속도로 일정하게 무한 반복 */
        color: #888;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        will-change: transform; /* 모바일 배터리 최적화 및 렌더링 가속 */
      }
    `}</style>
    <div className="ticker-content">
      <span style={{ color: "#ffb800", marginRight: "6px" }}>⚠️</span>
      본 대시보드에서 제공하는 모든 매크로 데이터 및 퀀트 분석 정보는 투자 참고용이며, 최종적인 투자 결정과 그 결과에 대한 책임은 전적으로 투자자 본인에게 있습니다.
      <span style={{ margin: "0 40px", color: "#444" }}>|</span>
      <span style={{ color: "#ffb800", marginRight: "6px" }}>💡</span>
      데이터는 기본 15분 단위로 업데이트되며, 시장 상황에 따라 지연될 수 있습니다.
    </div>
  </div>
);