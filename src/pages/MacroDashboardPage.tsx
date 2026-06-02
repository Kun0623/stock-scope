import { useEffect, useState } from "react";

export function MacroDashboardPage() {
  const [macroData, setMacroData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 👇 [핵심 수정] 아래 주소를 대표님의 깃허브 Raw URL로 교체해 주세요!
        const GITHUB_RAW_URL = "https://raw.githubusercontent.com/Kun0623/6ff77031bd5979e9177a21272fac7018/raw/macro_status.json";
        
        // 캐싱 방지를 위해 파라미터를 붙여 항상 최신 데이터를 강제로 가져옵니다.
        const response = await fetch(`${GITHUB_RAW_URL}?t=${new Date().getTime()}`);
        
        if (!response.ok) {
          throw new Error("네트워크 응답이 정상이 아닙니다.");
        }
        
        const data = await response.json();
        setMacroData(data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };
    fetchData();
  }, []);

  if (!macroData) {
    return <div style={{ padding: 20, textAlign: "center", color: "#888", background: "#0d0d0d", minHeight: "100vh" }}>데이터를 불러오는 중...</div>;
  }

  // 위험 벌점 계산
  let dangerCount = 0;
  if (macroData.fear_greed?.value <= 25) dangerCount++;
  if (macroData.buffett_indicator?.value >= 180) dangerCount++;
  if (macroData.sahm_rule?.value >= 0.5) dangerCount++;
  if (macroData.high_yield_spread?.value >= 5.0) dangerCount++;
  if (macroData.yield_curve?.value < 0) dangerCount++;
  if (macroData.vix?.value >= 25) dangerCount++;

  let shieldStatus = { title: "안정 구간", desc: "적극적인 시장 참여가 가능한 환경입니다", color: "#00d26a", bgColor: "#00d26a15", level: "green" };
  if (dangerCount >= 3) {
    shieldStatus = { title: "위험 구간 진입", desc: "현금 비중을 늘리고 보수적으로 접근하세요", color: "#ff4d4d", bgColor: "#ff4d4d15", level: "red" };
  } else if (dangerCount >= 1) {
    shieldStatus = { title: "주의 구간 진입", desc: "분할 매수 전략 유지 — 추가 매수는 신호 확인 후 진행하세요", color: "#ffb800", bgColor: "#ffb80015", level: "yellow" };
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f5f5f5", fontFamily: "'Pretendard', sans-serif", paddingBottom: 140 }}>
      
      {/* ── 상단 쉴드 배너 ── */}
      <div style={{ padding: "20px 16px 6px" }}>
        <div style={{ background: shieldStatus.bgColor, border: `1px solid ${shieldStatus.color}30`, borderRadius: 16, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, paddingRight: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: shieldStatus.color }}>매크로 쉴드 가이드</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>{shieldStatus.title}</h2>
              <p style={{ fontSize: 14, color: "#ccc", margin: 0, lineHeight: 1.5, wordBreak: "keep-all" }}>{shieldStatus.desc}</p>
            </div>
            <div style={{ display: "flex", gap: 6, background: "#111", padding: "8px 12px", borderRadius: 20, border: "1px solid #333", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: shieldStatus.level === "red" ? "#ff4d4d" : "#222", boxShadow: shieldStatus.level === "red" ? "0 0 12px #ff4d4d" : "none" }} />
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: shieldStatus.level === "yellow" ? "#ffb800" : "#222", boxShadow: shieldStatus.level === "yellow" ? "0 0 12px #ffb800" : "none" }} />
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: shieldStatus.level === "green" ? "#00d26a" : "#222", boxShadow: shieldStatus.level === "green" ? "0 0 12px #00d26a" : "none" }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 20px 14px", textAlign: "right" }}>
        <span style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          마지막 업데이트: {macroData.updated_at ? new Date(macroData.updated_at).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
        </span>
      </div>

      {/* ── 핵심 매크로 지표 (개별 맞춤 UI) ── */}
      <div style={{ padding: "0 16px 0" }}>
        <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "18px" }}>
          
          {/* 1. 공포탐욕 지수 (스펙트럼 게이지) */}
          {macroData.fear_greed && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>공포탐욕 지수</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>시장 참여자들의 심리 상태</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: macroData.fear_greed.value <= 25 ? "#ff4d4d" : "#00d26a" }}>
                  {macroData.fear_greed.value}
                </div>
              </div>
              <div style={{ position: "relative", width: "100%", height: 8, borderRadius: 4, background: "linear-gradient(to right, #ff4d4d, #ffb800, #00d26a)", marginBottom: 8 }}>
                <div style={{ position: "absolute", left: `${macroData.fear_greed.value}%`, top: -4, bottom: -4, width: 4, background: "#fff", borderRadius: 2, boxShadow: "0 0 6px rgba(0,0,0,0.5)", transition: "left 0.5s ease-out" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#777", fontWeight: 600 }}>
                <span>극단적 공포</span><span>중립</span><span>극단적 탐욕</span>
              </div>
            </div>
          )}

          {/* 2. 버핏 지표 (과열도 온도계) */}
          {macroData.buffett_indicator && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>버핏 지표</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>GDP 대비 시가총액 (버블 측정)</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: macroData.buffett_indicator.value >= 180 ? "#ff4d4d" : "#ffb800" }}>
                  {macroData.buffett_indicator.value}%
                </div>
              </div>
              <div style={{ position: "relative", width: "100%", height: 8, borderRadius: 4, background: "linear-gradient(to right, #00d26a 30%, #ffb800 60%, #ff4d4d 90%)", marginBottom: 8 }}>
                <div style={{ position: "absolute", left: `${Math.min(100, (macroData.buffett_indicator.value / 250) * 100)}%`, top: -4, bottom: -4, width: 4, background: "#fff", borderRadius: 2, boxShadow: "0 0 6px rgba(0,0,0,0.5)", transition: "left 0.5s ease-out" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#777", fontWeight: 600 }}>
                <span>저평가</span><span>180% (위험선)</span><span>초과열</span>
              </div>
            </div>
          )}

          {/* 3. 장단기 금리차 (제로 베이스 시소) */}
          {macroData.yield_curve && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>장단기 금리차 (10Y-2Y)</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>마이너스 진입 시 침체 경보</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: macroData.yield_curve.value < 0 ? "#ff4d4d" : "#00d26a" }}>
                  {macroData.yield_curve.value > 0 ? "+" : ""}{macroData.yield_curve.value}%p
                </div>
              </div>
              <div style={{ position: "relative", width: "100%", height: 8, background: "#333", borderRadius: 4, marginBottom: 8 }}>
                <div style={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: 2, background: "#888", zIndex: 2 }} />
                <div style={{ 
                  position: "absolute",
                  left: macroData.yield_curve.value < 0 ? `${Math.max(0, 50 + macroData.yield_curve.value * 25)}%` : "50%",
                  width: `${Math.min(50, Math.abs(macroData.yield_curve.value) * 25)}%`,
                  height: "100%", background: macroData.yield_curve.value < 0 ? "#ff4d4d" : "#00d26a", borderRadius: 4, transition: "all 0.5s"
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#777", fontWeight: 600 }}>
                <span style={{ color: macroData.yield_curve.value < 0 ? "#ff4d4d" : "#777" }}>역전 (비정상)</span>
                <span>0%p 기준선</span>
                <span style={{ color: macroData.yield_curve.value >= 0 ? "#00d26a" : "#777" }}>정상</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 그리드형 리스크 모니터 (경고등 패널 스타일) ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MiniRiskCard title="숌 룰 지수" value={macroData.sahm_rule?.value} suffix="%" threshold={0.5} isLowerWorse={false} desc="침체 확률" />
          <MiniRiskCard title="하이일드" value={macroData.high_yield_spread?.value} suffix="%" threshold={5.0} isLowerWorse={false} desc="신용 경색" />
          <MiniRiskCard title="VIX 지수" value={macroData.vix?.value} suffix="" threshold={25} isLowerWorse={false} desc="시장 변동성" />
          
          {/* 달러/환율 카드 (그리드 통합) */}
          <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "16px", border: "1px solid #2a2a2a", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>원/달러 환율</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#ffb800", marginTop: 8 }}>{macroData.fx?.usd_krw}원</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>DXY: {macroData.fx?.dxy}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 글로벌 자금 흐름 ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "18px 18px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: "#f5f5f5" }}>🌍 글로벌 주도 섹터</h3>
          {macroData.sectors && macroData.sectors.map((sector: any, index: number) => {
            const isPos = sector.change_pct >= 0;
            return (
              <div key={sector.ticker} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "14px 16px", background: "#222", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: index === 0 ? "#ffb800" : "#888", width: 20, textAlign: "center" }}>{index + 1}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{sector.name}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{sector.ticker}</div>
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isPos ? "#ff4d4d" : "#4d94ff", background: `${isPos ? "#ff4d4d" : "#4d94ff"}15`, padding: "4px 10px", borderRadius: 8 }}>
                  {isPos ? "+" : ""}{sector.change_pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 하단 고정 버튼 ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px 32px", background: "linear-gradient(to top, rgba(13,13,13,1) 60%, rgba(13,13,13,0))", zIndex: 50, display: "flex", justifyContent: "center" }}>
        <button style={{ width: "100%", maxWidth: 600, padding: "18px 0", background: "#00d26a", color: "#000", fontSize: 16, fontWeight: 800, border: "none", borderRadius: 16, cursor: "pointer", boxShadow: "0 8px 16px rgba(0, 210, 106, 0.2)" }}>
          ✅ 오늘의 시장 점검 완료하기
        </button>
      </div>
    </div>
  );
}

// 2x2 그리드용 미니 경보 카드 컴포넌트
function MiniRiskCard({ title, value, suffix, threshold, isLowerWorse, desc }: any) {
  if (value === null || value === undefined) return null;
  const isDanger = isLowerWorse ? value <= threshold : value >= threshold;
  const color = isDanger ? "#ff4d4d" : "#00d26a";

  return (
    <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "16px", border: `1px solid ${isDanger ? '#ff4d4d40' : '#2a2a2a'}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>{title}</span>
        {isDanger && <span style={{ fontSize: 10, background: "#ff4d4d20", color: "#ff4d4d", padding: "2px 6px", borderRadius: 10, fontWeight: 800 }}>경고</span>}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: color }}>{value}{suffix}</div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{desc}</div>
      </div>
    </div>
  );
}