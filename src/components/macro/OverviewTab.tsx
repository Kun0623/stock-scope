import React, { useEffect, useRef } from "react";
import { Tooltip, GaugeRow, SeesawRow, GridCard } from "./MacroShared";
import { TossBanner } from "./MacroShared";

export function OverviewTab({ data, isPro }: { data: any, isPro: boolean }) {
  let dangerCount = 0;

  // 1. 공포탐욕 지수 (세분화)
  if (data.fear_greed?.value <= 25) dangerCount += 2;
  else if (data.fear_greed?.value <= 44) dangerCount += 1;

  // 2. 숌 룰 (경기침체)
  if (data.sahm_rule?.value >= 0.5) dangerCount += 2;
  else if (data.sahm_rule?.value >= 0.35) dangerCount += 1;

  // 3. 하이일드 스프레드 (기업 부도 위험)
  if (data.high_yield_spread?.value >= 5.0) dangerCount += 2;
  else if (data.high_yield_spread?.value >= 4.0) dangerCount += 1;

  // 4. 장단기 금리차 (경기 침체 전조)
  if (data.yield_curve?.value < -0.5) dangerCount += 2; // 역전 심화는 더 위험
  else if (data.yield_curve?.value < 0) dangerCount += 1;

  // 5. VIX 지수 (시장 공포)
  if (data.vix?.value >= 30) dangerCount += 3; // 패닉 상태
  else if (data.vix?.value >= 25) dangerCount += 2;
  else if (data.vix?.value >= 20) dangerCount += 1;

  let shield = { 
    title: "안정적 추세 구간", 
    desc: "5대 핵심 거시 지표가 모두 안정권에 머물며, 펀더멘털과 투자 심리가 견고한 흐름을 보이고 있습니다.", // 텍스트 보강
    color: "#00d26a", bg: "#00d26a10", level: "green" 
  };
  
  // 기준점은 3점으로 유지 (최적의 밸런스)
  if (dangerCount >= 3) {
    shield = { 
      title: "고변동성 국면 진입", 
      desc: "핵심 지표의 임계치 돌파 또는 복합적인 매크로 충격이 감지된 고위험 구간입니다. 리스크 관리가 필요합니다.", // 텍스트 보강
      color: "#ff4d4d", bg: "#ff4d4d10", level: "red" 
    };
  } else if (dangerCount >= 1) {
    shield = { 
      title: "추세 전환 모니터링", 
      desc: "일부 지표에서 경계 신호가 발생했습니다. 단기적인 시장 변동성 확대에 대비한 모니터링 구간입니다.", // 텍스트 보강
      color: "#ffb800", bg: "#ffb80010", level: "yellow" 
    };
  }

  const getRiskScore = (count: number) => {
    // 거시 경제 리스크는 선형이 아니라 계단식으로 증폭됨을 반영
    const scoreMap: Record<number, number> = {
      0: 15,  // 완전 평온 (기본 시스템 리스크 15점만 부여)
      1: 38,  // 주의 시작 (노란불 진입)
      2: 55,  // 주의 심화
      3: 72,  // 위험 진입 (빨간불 진입 - VIX 30 도달 시 즉시 이 구간)
      4: 82,  // 고위험 
      5: 89,  // 심각한 스트레스
      6: 94,  // 패닉 전조
    };
    
    if (count >= 7) return 98; // 7점 이상은 극단적 패닉 상태 (98점 고정)
    return scoreMap[count] ?? 50; 
  };

  const riskScore = getRiskScore(dangerCount);
  // 점수 색상 기준은 그대로 유지 (완벽히 호환됨)
  const scoreColor = riskScore >= 65 ? "#ff4d4d" : riskScore >= 35 ? "#ffb800" : "#00d26a";

  return (
    // 전체 컨테이너에 일정한 gap을 주어 패널 간격을 자동 정렬
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 30 }}>
      
      {/* 1. 마스터 쉴드 */}
      <div style={{ padding: "20px 16px 0px" }}>
        <div style={{ background: shield.bg, border: `1px solid ${shield.color}30`, borderRadius: 16, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: shield.color }}>경기 위험 신호</div>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#fff" }}>{shield.title}</h2>
              <p style={{ fontSize: 14, color: "#aaa", margin: 0, wordBreak: "keep-all", lineHeight: 1.4 }}>{shield.desc}</p>
            </div>
            <div style={{ display: "flex", gap: 6, background: "#000", padding: "8px 12px", borderRadius: 20, border: "1px solid #333" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: shield.level === "red" ? "#ff4d4d" : "#222", boxShadow: shield.level === "red" ? "0 0 10px #ff4d4d" : "none" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: shield.level === "yellow" ? "#ffb800" : "#222", boxShadow: shield.level === "yellow" ? "0 0 10px #ffb800" : "none" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: shield.level === "green" ? "#00d26a" : "#222", boxShadow: shield.level === "green" ? "0 0 10px #00d26a" : "none" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 리스크 스코어 게이지: 첫 화면 온도와 판정이 엇갈려 숨김 (2026-11) */}
      {/* 3. 심화 게이지 지표 */}
      <div style={{ padding: "0 16px" }}>
        <div className="glass-panel" style={{ padding: "24px 20px" }}>
          <GaugeRow title="투자 심리 (공포·탐욕)" tooltip="시장 참여자들의 심리 상태" value={data.fear_greed?.value} type="fear_greed" />
          <div style={{ height: 32 }} />
          <GaugeRow title="주가 수준 (버핏지수)" tooltip="GDP 대비 시가총액 (180% 이상 고평가 영역)" value={data.buffett_indicator?.value} suffix="%" type="buffett" />
          <div style={{ height: 32 }} />
          <SeesawRow title="경기 전망 (장단기 금리차)" tooltip="마이너스 진입 시 경기 침체 통계적 전조" value={data.yield_curve?.value} />
        </div>
      </div>

      {/* 4. 미니 팩터 그리드 (5대 코어) */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <GridCard title="실업 경고" tooltip="삼의 법칙(Sahm rule). 0.35% 주의, 0.5% 위험" value={data.sahm_rule?.value} suffix="%" warningThreshold={0.35} dangerThreshold={0.5} />
          <GridCard title="회사 빚 위험" tooltip="하이일드 스프레드. 4.0% 주의, 5.0% 위험" value={data.high_yield_spread?.value} suffix="%" warningThreshold={4.0} dangerThreshold={5.0} />
          <GridCard title="변동성 (VIX)" tooltip="공포 지수. 20 pt 주의, 25 pt 위험" value={data.vix?.value} suffix="" warningThreshold={20} dangerThreshold={25} />
          
          <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Tooltip label="원/달러 환율" desc="DXY 달러 인덱스 연동 (점수 미포함)" />
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{data.fx?.usd_krw?.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>달러 인덱스: {data.fx?.dxy}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ [정리] 섹션 중간: 리스트형 광고 1개만 유지 (위아래 여백 제거, gap에 정렬 위임) */}
      <div>
        <TossBanner 
          adGroupId="ait.v2.live.9385fff4639c4949" // 🚨 중간 리스트형 광고 ID
          minHeight="72px"
        />
      </div>

      {/* 5. 시장 불안 신호 (풋/콜 비율·COT는 실제 수집 전까지 자리 채움 값이라 숨김, 2026-11) */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 16, paddingLeft: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#ffb800" }}>시장 불안 신호</h3>
          <span style={{ fontSize: 11, color: "#888", marginTop: 4 }}>변동성 지수 자체가 얼마나 출렁이는지 보여 줘요</span>
        </div>
        <GridCard 
          title="불안 확산 (VVIX)" 
          tooltip="VIX의 변동성. 95 주의, 110 위험" 
          value={data.vvix?.value ?? null} 
          suffix="" 
          warningThreshold={95} 
          dangerThreshold={110} 
        />
      </div>

      {/* ✨ 맨 하단: 피드형(대형) 광고 삽입 구역 */}
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