import React from "react";
import { MajorIndexTile, TrendRow, SectorTile } from "./MacroShared";

export function IndicatorsTab({ data, isPro }: { data: any, isPro: boolean }) {
  const majorIndices = data.major_indices || [];
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 20, padding: "0 16px" }}>
      
      {/* 1. 주요 핵심 지표 */}
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

      {/* 2. 글로벌 테마 매트릭스 */}
      {data.theme_trends && (
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
      )}

      {/* 3. GICS 12개 상세 섹터 */}
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
  );
}