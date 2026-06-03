import { useEffect, useState } from "react";

// ==========================================
// 1. 글로벌 CSS 주입 (애니메이션 & 툴팁 제어용)
// ==========================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    
    /* 스켈레톤 애니메이션 */
    .skeleton { background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 8px; }
    @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* 고급 툴팁 (마우스 호버 시 노출) */
    .tooltip-wrapper { position: relative; display: inline-flex; cursor: help; align-items: center; gap: 4px; }
    .tooltip-wrapper:hover .tooltip-box { opacity: 1; visibility: visible; transform: translate(-50%, -4px); }
    .tooltip-box { position: absolute; bottom: 100%; left: 50%; transform: translate(-50%, 0); opacity: 0; visibility: hidden; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(30, 30, 30, 0.95); border: 1px solid #444; backdrop-filter: blur(4px); padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; color: #eee; white-space: nowrap; z-index: 50; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .tooltip-box::after { content: ''; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: rgba(30, 30, 30, 0.95) transparent transparent transparent; }

    /* 글래스모피즘 패널 */
    .glass-panel { background: #161616; border: 1px solid #262626; border-radius: 16px; transition: transform 0.2s, box-shadow 0.2s; }
    .glass-panel:hover { border-color: #333; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  `}</style>
);

// ==========================================
// 2. 메인 대시보드 페이지 컴포넌트
// ==========================================
export function MacroDashboardPage() {
  const [macroData, setMacroData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const GITHUB_RAW_URL = "https://gist.githubusercontent.com/Kun0623/6ff77031bd5979e9177a21272fac7018/raw/macro_status.json";
        const response = await fetch(`${GITHUB_RAW_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("네트워크 응답 오류");
        const data = await response.json();
        
        // 스켈레톤 UI를 체감할 수 있도록 아주 짧은 의도적 지연(UX) 부여
        setTimeout(() => setMacroData(data), 300);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Pretendard', sans-serif", paddingBottom: 140 }}>
      <GlobalStyles />
      {!macroData ? <SkeletonLoadingUI /> : <DashboardContent data={macroData} />}
    </div>
  );
}

// ==========================================
// 3. 로딩 상태 UX (Skeleton UI)
// ==========================================
function SkeletonLoadingUI() {
  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 쉴드 배너 스켈레톤 */}
      <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
      {/* 퀀트 스코어 스켈레톤 */}
      <div className="skeleton" style={{ height: 70, borderRadius: 16 }} />
      {/* 게이지 차트 스켈레톤 */}
      <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />
      {/* 2x2 그리드 스켈레톤 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
      </div>
    </div>
  );
}

// ==========================================
// 4. 데이터 렌더링 본문 (Progressive Disclosure 적용)
// ==========================================
function DashboardContent({ data }: { data: any }) {
  // 위험 벌점 계산
  let dangerCount = 0;
  if (data.fear_greed?.value <= 25) dangerCount++;
  if (data.buffett_indicator?.value >= 180) dangerCount++;
  if (data.sahm_rule?.value >= 0.5) dangerCount++;
  if (data.high_yield_spread?.value >= 5.0) dangerCount++;
  if (data.yield_curve?.value < 0) dangerCount++;
  if (data.vix?.value >= 25) dangerCount++;

  let shield = { title: "안정 구간", desc: "적극적인 시장 참여가 가능한 환경입니다", color: "#00d26a", bg: "#00d26a10", level: "green" };
  if (dangerCount >= 3) {
    shield = { title: "위험 구간 진입", desc: "현금 비중을 늘리고 보수적으로 접근하세요", color: "#ff4d4d", bg: "#ff4d4d10", level: "red" };
  } else if (dangerCount >= 1) {
    shield = { title: "주의 구간 진입", desc: "분할 매수 전략 유지 — 신호 확인 후 추가 진입", color: "#ffb800", bg: "#ffb80010", level: "yellow" };
  }

  const riskScore = data.quant_risk_score ?? 50;
  const scoreColor = riskScore >= 65 ? "#ff4d4d" : riskScore >= 35 ? "#ffb800" : "#00d26a";

  return (
    <div className="fade-in">
      {/* ── 1. 마스터 쉴드 & 퀀트 스코어 ── */}
      <div style={{ padding: "20px 16px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
        
        <div style={{ background: shield.bg, border: `1px solid ${shield.color}30`, borderRadius: 16, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: shield.color, marginBottom: 8 }}>매크로 쉴드 가이드</div>
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

        <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tooltip label="통합 마켓 스코어" desc="5종의 매크로 지표 가중치를 연산한 위험 계수" />
          <div>
            <span style={{ fontSize: 28, fontWeight: 900, color: scoreColor }}>{riskScore}</span>
            <span style={{ fontSize: 14, color: "#666", fontWeight: 700 }}> / 100</span>
          </div>
        </div>
        
        <div style={{ textAlign: "right", paddingRight: 4 }}>
          <span style={{ fontSize: 11, color: "#555" }}>
            업데이트: {data.updated_at ? new Date(data.updated_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
          </span>
        </div>
      </div>

      {/* ── 2. 심화 게이지 지표 ── */}
      <div style={{ padding: "0 16px 12px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          <GaugeRow title="공포탐욕 지수" tooltip="시장 참여자들의 심리 상태" value={data.fear_greed?.value} isReversed={true} />
          <div style={{ height: 24 }} />
          <GaugeRow title="버핏 지표" tooltip="GDP 대비 시가총액 (180% 이상 위험)" value={data.buffett_indicator?.value} suffix="%" />
          <div style={{ height: 24 }} />
          <SeesawRow title="장단기 금리차" tooltip="마이너스 진입 시 경기 침체 전조 증상" value={data.yield_curve?.value} />
        </div>
      </div>

      {/* ── 3. 미니 팩터 그리드 ── */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <GridCard title="숌 룰 지수" tooltip="실업률 기반 침체 확률 (0.5% 경계)" value={data.sahm_rule?.value} suffix="%" threshold={0.5} />
          <GridCard title="하이일드" tooltip="기업 신용 경색 지표 (5.0% 경계)" value={data.high_yield_spread?.value} suffix="%" threshold={5.0} />
          <GridCard title="VIX 지수" tooltip="S&P 500 변동성 (25 이상 공포)" value={data.vix?.value} suffix="" threshold={25} />
          <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Tooltip label="원/달러 환율" desc="DXY 달러 인덱스 연동" />
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{data.fx?.usd_krw?.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>달러 인덱스: {data.fx?.dxy}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. 주도 테마 매트릭스 (메가 vs 이머징) ── */}
      <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        
        {data.theme_trends && (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#ffb800" }}>💡 글로벌 테마 트렌드</h3>
              <span style={{ fontSize: 11, color: "#666" }}>메가 트렌드 vs 단기 모멘텀</span>
            </div>

            {/* 🚀 메가 트렌드 그룹 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#888", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🚀</span> 장기 구조적 주도 테마 (Mega)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.theme_trends.mega?.map((t: any) => (
                  <TrendRow key={t.ticker} item={t} badge="Mega" />
                ))}
              </div>
            </div>

            {/* 🔥 최근 모멘텀 그룹 */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#888", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔥</span> 이머징 & 핫 모멘텀 테마 (Recent)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.theme_trends.recent?.map((t: any) => (
                  <TrendRow key={t.ticker} item={t} badge="Hot" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GICS 12개 상세 섹터 ── */}
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
  );
}

// ==========================================
// 5. 잘게 쪼갠 UI 하위 컴포넌트들
// ==========================================

// 정보 가림막(Progressive Disclosure) 툴팁 컴포넌트
function Tooltip({ label, desc }: { label: string, desc: string }) {
  return (
    <div className="tooltip-wrapper">
      <span style={{ fontSize: 13, fontWeight: 700, color: "#888", borderBottom: "1px dotted #666" }}>{label}</span>
      <span style={{ fontSize: 14, color: "#666" }}>ⓘ</span>
      <div className="tooltip-box">{desc}</div>
    </div>
  );
}

// 공포탐욕 / 버핏 지표용 스펙트럼 게이지
function GaugeRow({ title, tooltip, value, suffix = "", isReversed = false }: any) {
  if (value === undefined) return null;
  const isDanger = isReversed ? value <= 25 : value >= 180;
  let percent = isReversed ? value : Math.min(100, (value / 250) * 100);
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 12 }}>
        <Tooltip label={title} desc={tooltip} />
        <div style={{ fontSize: 20, fontWeight: 800, color: isDanger ? "#ff4d4d" : "#fff" }}>{value}{suffix}</div>
      </div>
      <div style={{ position: "relative", width: "100%", height: 6, borderRadius: 3, background: isReversed ? "linear-gradient(90deg, #ff4d4d, #ffb800, #00d26a)" : "linear-gradient(90deg, #00d26a 30%, #ffb800 60%, #ff4d4d 90%)", marginBottom: 6 }}>
        <div style={{ position: "absolute", left: `${percent}%`, top: -3, bottom: -3, width: 4, background: "#fff", borderRadius: 2, boxShadow: "0 0 8px rgba(0,0,0,0.8)", transition: "left 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
    </div>
  );
}

// 장단기 금리차용 제로 베이스 시소 차트
function SeesawRow({ title, tooltip, value }: any) {
  if (value === undefined) return null;
  const isInv = value < 0;
  const leftPos = isInv ? `${Math.max(0, 50 + value * 25)}%` : "50%";
  const barWidth = `${Math.min(50, Math.abs(value) * 25)}%`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 12 }}>
        <Tooltip label={title} desc={tooltip} />
        <div style={{ fontSize: 20, fontWeight: 800, color: isInv ? "#ff4d4d" : "#fff" }}>{value > 0 ? "+" : ""}{value}%p</div>
      </div>
      <div style={{ position: "relative", width: "100%", height: 6, background: "#222", borderRadius: 3, marginBottom: 6 }}>
        <div style={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: 2, background: "#555", zIndex: 2 }} />
        <div style={{ position: "absolute", left: leftPos, width: barWidth, height: "100%", background: isInv ? "#ff4d4d" : "#00d26a", borderRadius: 3, transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
    </div>
  );
}

// 2x2 미니 그리드 카드
function GridCard({ title, tooltip, value, suffix, threshold }: any) {
  if (value === undefined) return null;
  const isDanger = value >= threshold;
  return (
    <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Tooltip label={title} desc={tooltip} />
        {isDanger && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4d4d", boxShadow: "0 0 8px #ff4d4d" }} />}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: isDanger ? "#ff4d4d" : "#fff", marginTop: 12 }}>
        {value}{suffix}
      </div>
    </div>
  );
}

// 🛠️ TypeScript 에러 해결 및 뱃지 디자인이 추가된 TrendRow 컴포넌트
function TrendRow({ item, badge }: { item: any; badge?: "Mega" | "Hot" }) {
  const isPos = item.change_pct >= 0;
  
  // 뱃지 타입별 테마 스타일링 (Mega = 퍼플 계열, Hot = 오렌지 계열)
  const badgeStyle = badge === "Mega"
    ? { background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }
    : { background: "rgba(249, 115, 22, 0.15)", color: "#ff9d43", border: "1px solid rgba(249, 115, 22, 0.3)" };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* 심볼 아이콘 영역 */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 12, fontWeight: 800, color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>
          {item.ticker}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eee" }}>{item.name}</div>
            {/* 🚀 전달받은 뱃지 텍스트를 컴포넌트 내부에 동적으로 렌더링 */}
            {badge && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 6, ...badgeStyle }}>
                {badge}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>테마 주도 자산</div>
        </div>
      </div>
      {/* 등락률 배경 라벨링 */}
      <div style={{ fontSize: 15, fontWeight: 800, color: isPos ? "#ff4d4d" : "#4d94ff", background: isPos ? "rgba(255,77,77,0.1)" : "rgba(77,148,255,0.1)", padding: "6px 12px", borderRadius: 8 }}>
        {isPos ? "+" : ""}{item.change_pct}%
      </div>
    </div>
  );
}

// 🚀 수정 2. 상세 섹터 타일 (정렬 통일 및 비활성 색상 밝기 상향)
function SectorTile({ item, rank }: { item: any, rank: number }) {
  const isPos = item.change_pct >= 0;
  const isTop = rank <= 3;
  return (
    <div style={{ padding: "14px 12px", background: isTop ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", borderRadius: 12, border: isTop ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* 하위 순위 숫자 색상을 #555 -> #888 로 밝혀서 가독성 확보 */}
          <span style={{ fontSize: 14, fontWeight: 900, color: isTop ? "#ffb800" : "#888", width: 16 }}>{rank}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{item.ticker}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: isPos ? "#ff4d4d" : "#4d94ff" }}>
          {isPos ? "+" : ""}{item.change_pct}%
        </span>
      </div>
      {/* 텍스트 줄맞춤을 위해 paddingLeft 적용 및 색상 밝기 상향 */}
      <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", paddingLeft: 24, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {item.name}
      </div>
    </div>
  );
}