import React from "react";
// ✨ TossBanner 임포트 추가
import { MajorIndexTile, TrendRow, SectorTile, TossBanner } from "./MacroShared";

export function IndicatorsTab({ data, isPro }: { data: any, isPro: boolean }) {
  const majorIndices = data.major_indices || [];
  
  return (
    // ✨ 변경: 다른 탭과 동일하게 전체 좌우 패딩을 제거(0px)하고 gap으로 정렬을 위임합니다.
    <div style={{ padding: "20px 0px 30px", display: "flex", flexDirection: "column", gap: 12 }}>
      
      {/* 1. 주요 핵심 지표 */}
      <div style={{ padding: "0 16px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
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
      </div>

      {/* 2. 글로벌 테마 매트릭스 */}
      {data.theme_trends && (
        <div style={{ padding: "0 16px" }}>
          <div className="paywall-container glass-panel">
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
        </div>
      )}

      {/* ✨ [신규] 섹션 중간: 리스트형 광고 삽입 구역 (거시 테마 확인 후 미시 섹터로 넘어가기 전 시각적 환기) */}
      <div style={{ margin: "4px 0" }}>
        <TossBanner 
          adGroupId="ait.v2.live.9385fff4639c4949" 
          minHeight="72px"
        />
      </div>

      {/* 3. GICS 12개 상세 섹터 */}
      <div style={{ padding: "0 16px" }}>
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

      {/* ✨ [신규] 맨 하단: 피드형(대형) 광고 삽입 구역 (상세 섹터 조회가 끝난 뒤 체류 지점) */}
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