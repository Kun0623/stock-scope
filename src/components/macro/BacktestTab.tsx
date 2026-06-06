import React, { useState } from "react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, ReferenceArea, ReferenceDot, Tooltip as RechartsTooltip } from "recharts";
import { CustomChartTooltip, Tooltip } from "./MacroShared";

export function BacktestTab({ backtestData }: { backtestData: any[] }) {
  // 시뮬레이터 조작 상태 (슬라이더 값)
  const [vixDelta, setVixDelta] = useState<number>(0);
  const [rateDelta, setRateDelta] = useState<number>(0);

  // 시뮬레이션 베이스라인 (백테스트 데이터 마지막 날짜 기준, 없으면 임의의 최근 지수값 세팅)
  const baseData = backtestData && backtestData.length > 0 
    ? backtestData[backtestData.length - 1] 
    : { sp500: 5300 }; 
    
  const basePrices = {
    sp500: baseData.sp500,
    nasdaq: 16700, // 나스닥 임시 기준선
    dow: 39000,    // 다우존스 임시 기준선
    bond: 95       // 미국 장기채 ETF(예: TLT) 기준가
  };

  // 🧠 자산별 시뮬레이션 핵심 연산 로직 (민감도 차등 적용)
  // 1. S&P 500: 표준 민감도
  const sp500ImpactPct = (vixDelta * -0.3) + (rateDelta * -4.0);
  // 2. 나스닥: 금리에 매우 취약 (기술주/성장주 특성)
  const nasdaqImpactPct = (vixDelta * -0.4) + (rateDelta * -7.0);
  // 3. 다우존스: 금리 방어력이 상대적으로 높음 (가치주/산업재 특성)
  const dowImpactPct = (vixDelta * -0.2) + (rateDelta * -2.5);
  // 4. 미국 국채 (채권 가격): 금리 상승 시 채권 가격은 무조건 하락 (듀레이션 반영), 공포(VIX) 상승 시 안전자산 선호로 약한 상승 방어
  const bondImpactPct = (vixDelta * 0.1) + (rateDelta * -7.5);

  const simSp500 = basePrices.sp500 * (1 + sp500ImpactPct / 100);
  const simNasdaq = basePrices.nasdaq * (1 + nasdaqImpactPct / 100);
  const simDow = basePrices.dow * (1 + dowImpactPct / 100);
  const simBond = basePrices.bond * (1 + bondImpactPct / 100);

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      
      {/* 1. 기존 과거 백테스트 차트 영역 */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#fff" }}>📊 과거 리스크 & 이벤트 검증</h3>
        <p style={{ fontSize: 13, color: "#aaa", margin: 0, lineHeight: 1.5 }}>
          과거 퀀트 스코어 위험 구간(붉은색) 진입 시 실제 자산의 하락폭을 확인하세요.
        </p>

        {backtestData && backtestData.length > 0 ? (
          <div style={{ width: "100%", height: 300, minHeight: 300, marginTop: 20 }}>
             <ResponsiveContainer width="99%" height="100%" minHeight={300}>
               <ComposedChart data={backtestData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorSp" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#805ad5" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#805ad5" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={(val) => val.substring(2, 7)} minTickGap={30} />
                 <YAxis yAxisId="left" domain={['dataMin - 200', 'dataMax + 200']} tick={{ fontSize: 10, fill: "#666" }} />
                 <RechartsTooltip content={<CustomChartTooltip />} />

                 {backtestData.map((d: any, i: number) => {
                   if (d.risk_score >= 70) return <ReferenceArea key={i} x1={d.date} x2={backtestData[i+1]?.date || d.date} yAxisId="left" fill="#ff4d4d" fillOpacity={0.15} />;
                   return null;
                 })}
                 <Area yAxisId="left" type="monotone" dataKey="sp500" stroke="#805ad5" strokeWidth={2} fillOpacity={1} fill="url(#colorSp)" />
                 <Line yAxisId="left" type="monotone" dataKey="nvda" stroke="#00d26a" strokeWidth={1.5} dot={false} />

                 {backtestData.map((d: any, i: number) => {
                   if (d.event) return <ReferenceDot key={`event-${i}`} x={d.date} y={d.sp500} yAxisId="left" r={5} fill="#ffb800" stroke="#1a1a1a" strokeWidth={2} />;
                   return null;
                 })}
               </ComposedChart>
             </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 300, display: "flex", justifyContent: "center", alignItems: "center", color: "#666" }}>데이터를 불러오는 중입니다...</div>
        )}
      </div>

      {/* 2. ✨ 신규: 교육용 매크로 지수 시뮬레이터 (4대 자산) */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "#ffb800" }}>🕹️ What-If 매크로 시뮬레이터</h3>
            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>경제 위기 시 대표 지수들의 방어력을 비교해보세요.</p>
          </div>
          <div style={{ padding: "4px 8px", background: "rgba(255, 184, 0, 0.1)", color: "#ffb800", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
            교육모드
          </div>
        </div>

        {/* 조작 슬라이더 영역 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Tooltip label="VIX (공포 지수) 변동" desc="시장 참여자들의 단기 패닉 강도를 의미합니다." />
              <span style={{ fontSize: 14, fontWeight: 800, color: vixDelta > 0 ? "#ff4d4d" : vixDelta < 0 ? "#00d26a" : "#fff" }}>
                {vixDelta > 0 ? "+" : ""}{vixDelta} pt
              </span>
            </div>
            <input type="range" min="-10" max="40" step="1" value={vixDelta} onChange={(e) => setVixDelta(Number(e.target.value))} style={{ width: "100%", accentColor: "#ff4d4d", cursor: "pointer" }} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Tooltip label="10년물 국채 금리 변동" desc="할인율이 높아지면 성장주와 채권 가격에 치명적입니다." />
              <span style={{ fontSize: 14, fontWeight: 800, color: rateDelta > 0 ? "#ff4d4d" : rateDelta < 0 ? "#00d26a" : "#fff" }}>
                {rateDelta > 0 ? "+" : ""}{rateDelta.toFixed(1)} %p
              </span>
            </div>
            <input type="range" min="-2.0" max="3.0" step="0.1" value={rateDelta} onChange={(e) => setRateDelta(Number(e.target.value))} style={{ width: "100%", accentColor: "#ff4d4d", cursor: "pointer" }} />
          </div>
          
          <button 
            onClick={() => { setVixDelta(0); setRateDelta(0); }}
            style={{ padding: "8px", background: "#222", border: "1px solid #444", borderRadius: 8, color: "#aaa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            🔄 시나리오 초기화
          </button>
        </div>

        {/* 4대 주요 자산 결과 투영 패널 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <SimulationCard name="S&P 500" desc="시장 평균 방어력" basePrice={basePrices.sp500} simPrice={simSp500} impactPct={sp500ImpactPct} />
          <SimulationCard name="NASDAQ" desc="금리 민감도 최상위" basePrice={basePrices.nasdaq} simPrice={simNasdaq} impactPct={nasdaqImpactPct} />
          <SimulationCard name="Dow Jones" desc="산업/가치주 방어력" basePrice={basePrices.dow} simPrice={simDow} impactPct={dowImpactPct} />
          <SimulationCard name="미 채권 10년물" desc="금리 역의 상관관계" basePrice={basePrices.bond} simPrice={simBond} impactPct={bondImpactPct} isBond />
        </div>

      </div>
    </div>
  );
}

// 4대 지수 시뮬레이션 결과 카드 컴포넌트
function SimulationCard({ name, desc, basePrice, simPrice, impactPct, isBond = false }: { name: string, desc: string, basePrice: number, simPrice: number, impactPct: number, isBond?: boolean }) {
  const isDanger = impactPct < 0;
  const isNeutral = impactPct === 0;
  const color = isNeutral ? "#fff" : isDanger ? "#ff4d4d" : "#00d26a";
  const sign = isDanger ? "" : "+";

  return (
    <div style={{ padding: "14px 12px", background: "rgba(0,0,0,0.3)", border: `1px solid ${isNeutral ? '#333' : color + '40'}`, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#eee" }}>{name}</div>
        {isBond && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.1)", borderRadius: 4, color: "#aaa" }}>안전자산</span>}
      </div>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 12 }}>{desc}</div>
      
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
          {simPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: color }}>
        {isNeutral ? "변동 없음" : `예상 ${sign}${impactPct.toFixed(1)}%`}
      </div>
      
      {/* 바 차트 시각화 */}
      <div style={{ height: 4, width: "100%", background: "#222", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(0, 100 + impactPct)}%`, background: color, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
    </div>
  );
}