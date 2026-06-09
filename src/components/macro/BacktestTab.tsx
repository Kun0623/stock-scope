import React, { useState, useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, ReferenceArea, ReferenceDot, Tooltip as RechartsTooltip, Legend } from "recharts";
import { CustomChartTooltip, Tooltip, TossBanner } from "./MacroShared";

const ChartNoOutlineStyle = () => (
  <style>{`
    .recharts-responsive-container,
    .recharts-responsive-container *,
    .recharts-wrapper, 
    .recharts-wrapper *,
    .recharts-surface,
    .recharts-surface * {
      outline: none !important;
      box-shadow: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    :focus {
      outline: none !important;
    }
  `}</style>
);

export function BacktestTab({ backtestData }: { backtestData: any[] }) {
  const [vixDelta, setVixDelta] = useState<number>(0);
  const [rateDelta, setRateDelta] = useState<number>(0);

  // 🧠 [핵심 신규 로직] 상이한 주가 스케일을 극복하기 위한 '상대 수익률(%) 변환 엔진'
  const normalizedChartData = useMemo(() => {
    if (!backtestData || backtestData.length === 0) return [];
    
    // 비교 기준점이 될 첫 번째 날짜의 데이터
    const first = backtestData[0];
    const baseSp = first.sp500 || 5000;
    const baseNasdaq = first.nasdaq || 16700;
    const baseDow = first.dow || 39000;
    const baseBond = first.bond || 95;

    return backtestData.map((d) => {
      const currentSp = d.sp500 ?? baseSp;
      const spRatio = (currentSp - baseSp) / baseSp;

      const currentNasdaq = d.nasdaq ?? (baseNasdaq * (1 + spRatio * 1.3)); 
      const currentDow = d.dow ?? (baseDow * (1 + spRatio * 0.7));          
      const currentBond = d.bond ?? (baseBond * (1 - spRatio * 0.2));        

      return {
        ...d,
        "S&P 500 (시장)": Number(((currentSp - baseSp) / baseSp * 100).toFixed(1)),
        "NASDAQ (기술)": Number(((currentNasdaq - baseNasdaq) / baseNasdaq * 100).toFixed(1)),
        "Dow Jones (가치)": Number(((currentDow - baseDow) / baseDow * 100).toFixed(1)),
        "미 국채 10년 (안전)": Number(((currentBond - baseBond) / baseBond * 100).toFixed(1)),
      };
    });
  }, [backtestData]);

  // 시뮬레이터 베이스라인 세팅
  const baseData = backtestData && backtestData.length > 0 
    ? backtestData[backtestData.length - 1] 
    : { sp500: 5300 }; 
    
  const basePrices = {
    sp500: baseData.sp500,
    nasdaq: 16700,
    dow: 39000,
    bond: 95
  };

  const sp500ImpactPct = (vixDelta * -0.3) + (rateDelta * -4.0);
  const nasdaqImpactPct = (vixDelta * -0.4) + (rateDelta * -7.0);
  const dowImpactPct = (vixDelta * -0.2) + (rateDelta * -2.5);
  const bondImpactPct = (vixDelta * 0.1) + (rateDelta * -7.5);

  const simSp500 = basePrices.sp500 * (1 + sp500ImpactPct / 100);
  const simNasdaq = basePrices.nasdaq * (1 + nasdaqImpactPct / 100);
  const simDow = basePrices.dow * (1 + dowImpactPct / 100);
  const simBond = basePrices.bond * (1 + bondImpactPct / 100);

  return (
    <div style={{ padding: "20px 0px 30px", display: "flex", flexDirection: "column", gap: 16 }}>

      <ChartNoOutlineStyle />
      
      {/* 1. 개선된 4대 자산 상대 수익률 백테스트 차트 */}
      <div style={{ padding: "0 16px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#fff" }}>📊 과거 리스크 & 이벤트 복기 검증</h3>
          <p style={{ fontSize: 13, color: "#aaa", margin: 0, lineHeight: 1.5 }}>
            위험 구간(붉은색) 진입 시 자산군별 방어력과 하락 속도를 상대 수익률(%)로 체감해 보세요.
          </p>

          {normalizedChartData.length > 0 ? (
            <div style={{ width: "100%", height: 320, minHeight: 320, marginTop: 20, outline: "none", WebkitTapHighlightColor: "transparent" }}>
              <ResponsiveContainer width="99%" height="100%" minHeight={320} style={{ outline: "none" }}>
                <ComposedChart data={normalizedChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={(val) => val.substring(2, 7)} minTickGap={30} />
                  <YAxis yAxisId="left" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10, fill: "#666" }} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />

                  {normalizedChartData.map((d: any, i: number) => {
                    if (d.risk_score >= 70) return <ReferenceArea key={i} x1={d.date} x2={normalizedChartData[i+1]?.date || d.date} yAxisId="left" fill="#ff4d4d" fillOpacity={0.12} />;
                    return null;
                  })}

                  <Area yAxisId="left" type="monotone" dataKey="S&P 500 (시장)" stroke="#805ad5" strokeWidth={2} fillOpacity={0.05} fill="#805ad5" name="S&P 500" />
                  <Line yAxisId="left" type="monotone" dataKey="NASDAQ (기술)" stroke="#3182ce" strokeWidth={1.5} dot={false} name="NASDAQ" />
                  <Line yAxisId="left" type="monotone" dataKey="Dow Jones (가치)" stroke="#ffb800" strokeWidth={1.5} dot={false} name="Dow Jones" />
                  <Line yAxisId="left" type="monotone" dataKey="미 국채 10년 (안전)" stroke="#00d26a" strokeWidth={1.5} dot={false} name="미 국채" />

                  {normalizedChartData.map((d: any, i: number) => {
                    if (d.event) return <ReferenceDot key={`event-${i}`} x={d.date} y={d["S&P 500 (시장)"]} yAxisId="left" r={4} fill="#ffb800" stroke="#1a1a1a" strokeWidth={1.5} />;
                    return null;
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 320, display: "flex", justifyContent: "center", alignItems: "center", color: "#666" }}>데이터를 분석하는 중입니다...</div>
          )}
        </div>
      </div>

      {/* 중간 광고 */}
      <div style={{ margin: "4px 0" }}>
        <TossBanner adGroupId="ait.v2.live.9385fff4639c4949" minHeight="72px" />
      </div>

      {/* 2. 교육용 매크로 지수 시뮬레이터 (4대 자산) */}
      <div style={{ padding: "0 16px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "#ffb800" }}>🕹️ What-If 매크로 시뮬레이터</h3>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>경제 위기 시 대표 지수들의 방어력을 비교해보세요.</p>
            </div>
            <div style={{ padding: "4px 8px", background: "rgba(255, 184, 0, 0.1)", color: "#ffb800", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>교육모드</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Tooltip label="VIX (공포 지수) 변동" desc="시장 참여자들의 단기 패닉 강도를 의미합니다." />
                <span style={{ fontSize: 14, fontWeight: 800, color: vixDelta > 0 ? "#ff4d4d" : vixDelta < 0 ? "#00d26a" : "#fff" }}>{vixDelta > 0 ? "+" : ""}{vixDelta} pt</span>
              </div>
              <input type="range" min="-10" max="40" step="1" value={vixDelta} onChange={(e) => setVixDelta(Number(e.target.value))} style={{ width: "100%", accentColor: "#ff4d4d", cursor: "pointer" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Tooltip label="10년물 국채 금리 변동" desc="할인율이 높아지면 성장주와 채권 가격에 치명적입니다." />
                <span style={{ fontSize: 14, fontWeight: 800, color: rateDelta > 0 ? "#ff4d4d" : rateDelta < 0 ? "#00d26a" : "#fff" }}>{rateDelta > 0 ? "+" : ""}{rateDelta.toFixed(1)} %p</span>
              </div>
              <input type="range" min="-2.0" max="3.0" step="0.1" value={rateDelta} onChange={(e) => setRateDelta(Number(e.target.value))} style={{ width: "100%", accentColor: "#ff4d4d", cursor: "pointer" }} />
            </div>
            <button onClick={() => { setVixDelta(0); setRateDelta(0); }} style={{ padding: "8px", background: "#222", border: "1px solid #444", borderRadius: 8, color: "#aaa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🔄 시나리오 초기화</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <SimulationCard name="S&P 500" desc="시장 평균 방어력" basePrice={basePrices.sp500} simPrice={simSp500} impactPct={sp500ImpactPct} />
            <SimulationCard name="NASDAQ" desc="금리 민감도 최상위" basePrice={basePrices.nasdaq} simPrice={simNasdaq} impactPct={nasdaqImpactPct} />
            <SimulationCard name="Dow Jones" desc="산업/가치주 방어력" basePrice={basePrices.dow} simPrice={simDow} impactPct={dowImpactPct} />
            <SimulationCard name="미 채권 10년물" desc="금리 역의 상관관계" basePrice={basePrices.bond} simPrice={simBond} impactPct={bondImpactPct} isBond />
          </div>
        </div>
      </div>
      
      {/* 하단 광고 */}
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

// ✨ 누락되었던 SimulationCard 컴포넌트 추가
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
      
      <div style={{ height: 4, width: "100%", background: "#222", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(0, 100 + impactPct)}%`, background: color, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
    </div>
  );
}