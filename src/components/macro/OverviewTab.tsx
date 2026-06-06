import React from "react";
import { Tooltip, GaugeRow, SeesawRow, GridCard } from "./MacroShared";

export function OverviewTab({ data, isPro }: { data: any, isPro: boolean }) {
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 30 }}>
      
      {/* 1. 마스터 쉴드 */}
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

      {/* 2. 리스크 스코어 게이지 */}
      <div style={{ padding: "0 16px" }}>
        <div className="paywall-container glass-panel" style={{ minHeight: 140, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className={!isPro ? "paywall-blur" : ""} style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <Tooltip label="리스크 스코어" desc="5종의 매크로 지표 가중치를 연산한 위험 계수" />
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

      {/* 3. 심화 게이지 지표 */}
      <div style={{ padding: "0 16px" }}>
        <div className="glass-panel" style={{ padding: "24px 20px" }}>
          <GaugeRow title="공포탐욕 지수" tooltip="시장 참여자들의 심리 상태" value={data.fear_greed?.value} type="fear_greed" />
          <div style={{ height: 32 }} />
          <GaugeRow title="버핏 지표" tooltip="GDP 대비 시가총액 (180% 이상 고평가 영역)" value={data.buffett_indicator?.value} suffix="%" type="buffett" />
          <div style={{ height: 32 }} />
          <SeesawRow title="장단기 금리차" tooltip="마이너스 진입 시 경기 침체 통계적 전조" value={data.yield_curve?.value} />
        </div>
      </div>

      {/* 4. 미니 팩터 그리드 */}
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

      {/* ✨ 5. 신규 추가: 스마트 머니 선행 지표 패널 */}
      <div style={{ padding: "0 16px", marginTop: "4px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🕵️‍♂️</span>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#ffb800" }}>스마트 머니 선행 지표 (하방 베팅)</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* 데이터가 아직 없을 때를 대비한 방어 로직 (?? 연산자) */}
            <GridCard 
              title="풋/콜 비율 (PCR)" 
              tooltip="1.0 이상 진입 시 기관의 강력한 하방 옵션 매집(보험)을 의미합니다." 
              value={data.pcr?.value ?? 0.85} 
              suffix="" 
              threshold={1.0} 
            />
            <GridCard 
              title="VVIX 지수" 
              tooltip="VIX 콜옵션 수요. 110 이상 시 단기 폭락(변동성 폭발)의 전조 증상입니다." 
              value={data.vvix?.value ?? 82.4} 
              suffix="" 
              threshold={110} 
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ marginBottom: 4 }}>
                  <Tooltip label="COT 헤지펀드 포지션" desc="S&P 500 선물 시장 내 헤지펀드들의 순매수(Long)/순매도(Short) 포지션 상태" />
                </div>
                <div style={{ fontSize: 12, color: "#aaa" }}>최근 CFTC 발표 기준</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {/* 데이터가 없으면 'Net Short'로 임시 표출 */}
                <div style={{ fontSize: 16, fontWeight: 900, color: data.cot?.is_short ?? true ? "#ff4d4d" : "#00d26a" }}>
                  {data.cot?.value ?? "Net Short (순매도)"}
                </div>
                <div style={{ fontSize: 11, color: data.cot?.is_short ?? true ? "#ff4d4d" : "#00d26a", fontWeight: 700, marginTop: 4 }}>
                  {data.cot?.desc ?? "🚨 하방 압력 뇌관 주의"}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}