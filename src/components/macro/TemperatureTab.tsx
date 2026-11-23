import { useState } from "react";
import { Share } from "@apps-in-toss/web-framework";

// 미국장 온도: 시장 분위기 '정보'이며 매수·매도 신호가 아님.
// 계산식은 collect_macro.py의 calculate_market_temperature와 같게 유지할 것.
type ComponentKey = "fear_greed" | "vix" | "high_yield_spread" | "buffett_indicator";
type Components = Partial<Record<ComponentKey, number>>;
type HistoryItem = { date: string; value: number; components?: Components };

const WEIGHTS: Record<ComponentKey, number> = { fear_greed: 0.4, vix: 0.2, high_yield_spread: 0.2, buffett_indicator: 0.2 };
const LABELS: Record<ComponentKey, string> = {
  fear_greed: "공포·탐욕지수",
  vix: "변동성(VIX)",
  high_yield_spread: "하이일드 스프레드",
  buffett_indicator: "버핏지수",
};

const scale = (v: number, cold: number, hot: number) => Math.max(0, Math.min(100, ((v - cold) / (hot - cold)) * 100));

const statusOf = (t: number) =>
  t < 20 ? "냉각" : t < 40 ? "차분" : t < 60 ? "보통" : t < 80 ? "뜨거움" : "과열";

const colorOf = (t: number) =>
  t < 20 ? "#4dabf7" : t < 40 ? "#74c0fc" : t < 60 ? "#ced4da" : t < 80 ? "#ff922b" : "#ff4d4f";

// 수집 데이터에 temperature가 아직 없을 때(갱신 전) 원자료로 같은 식을 계산
function computeFallback(data: any): { value: number | null; components: Components } {
  const comps: Components = {};
  const fg = data?.fear_greed?.value, vix = data?.vix?.value, hy = data?.high_yield_spread?.value, bf = data?.buffett_indicator?.value;
  if (fg != null) comps.fear_greed = scale(+fg, 0, 100);
  if (vix != null) comps.vix = scale(+vix, 40, 10);
  if (hy != null) comps.high_yield_spread = scale(+hy, 8, 2.5);
  if (bf != null) comps.buffett_indicator = scale(+bf, 80, 200);
  const keys = Object.keys(comps) as ComponentKey[];
  if (!keys.length) return { value: null, components: {} };
  const w = keys.reduce((s, k) => s + WEIGHTS[k], 0);
  const value = Math.round(keys.reduce((s, k) => s + (comps[k] as number) * WEIGHTS[k], 0) / w);
  keys.forEach((k) => (comps[k] = Math.round(comps[k] as number)));
  return { value, components: comps };
}

// 어제보다 온도를 가장 많이 움직인 지표 한 줄 (템플릿 문장, AI 아님)
function reasonLine(today: Components, prev?: Components): string {
  const keys = Object.keys(today) as ComponentKey[];
  if (prev) {
    let best: ComponentKey | null = null, bestImpact = 0;
    for (const k of keys) {
      if (prev[k] == null) continue;
      const impact = ((today[k] as number) - (prev[k] as number)) * WEIGHTS[k];
      if (Math.abs(impact) > Math.abs(bestImpact)) { best = k; bestImpact = impact; }
    }
    if (best && Math.abs(bestImpact) >= 0.5) {
      return `${LABELS[best]} 때문에 온도가 ${bestImpact > 0 ? "올랐어요" : "내려갔어요"}`;
    }
    return "어제와 비슷한 분위기예요";
  }
  const hottest = keys.sort((a, b) => (today[b] as number) * WEIGHTS[b] - (today[a] as number) * WEIGHTS[a])[0];
  return hottest ? `지금은 ${LABELS[hottest]}의 영향이 가장 커요` : "";
}

export function TemperatureTab({ data, onShowDetail }: { data: any; onShowDetail: () => void }) {
  const [showFormula, setShowFormula] = useState(false);
  const [toast, setToast] = useState("");

  const fallback = computeFallback(data);
  const value: number | null = data?.temperature?.value ?? fallback.value;
  const components: Components = data?.temperature?.components ?? fallback.components;
  const history: HistoryItem[] = (data?.temperature_history ?? []).slice(-7);

  if (value == null) {
    return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>오늘 온도를 아직 계산하지 못했어요</div>;
  }

  const prev = history.length >= 2 ? history[history.length - 2] : undefined;
  const delta = prev ? value - prev.value : null;
  const color = colorOf(value);
  const status = statusOf(value);
  const warn = (data?.sahm_rule?.value ?? 0) >= 0.5 || (data?.yield_curve?.value ?? 1) < 0;
  const dateText = data?.updated_at
    ? new Date(data.updated_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
    : "";

  const onShare = async () => {
    const text = `${dateText} 미국장 온도 ${value}° (${status})\n${reasonLine(components, prev?.components)}`;
    try {
      const link = await Share.createLink({ path: "intoss://stock-scope" });
      await Share.sendMessage({ message: `${text}\n오늘 온도 보기 👉 ${link}` });
    } catch (e) {
      console.error("공유 실패:", e);
      setToast("이 환경에서는 공유할 수 없어요");
      setTimeout(() => setToast(""), 2000);
    }
  };

  // 최근 값 범위로 높이를 잡아 작은 변화도 보이게 (최소 높이 12px)
  const vals = history.map((h) => h.value);
  const lo = Math.min(...vals) - 5, hi = Math.max(...vals);
  const barHeight = (v: number) => 12 + ((v - lo) / Math.max(1, hi - lo)) * 44;

  return (
    <div style={{ padding: "28px 20px", display: "flex", flexDirection: "column", gap: 20, wordBreak: "keep-all" }}>
      <div style={{ fontSize: 15, color: "#aaa", fontWeight: 600 }}>{dateText} 미국장 온도</div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <div style={{ fontSize: 88, lineHeight: 1, fontWeight: 800, color }}>{value}°</div>
        <div style={{ paddingBottom: 10 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color }}>{status}</div>
          {delta != null && (
            <div style={{ fontSize: 14, color: delta > 0 ? "#ff922b" : delta < 0 ? "#4dabf7" : "#888", fontWeight: 700 }}>
              어제보다 {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : "변화 없음"}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 17, color: "#eee", fontWeight: 600 }}>{reasonLine(components, prev?.components)}</div>

      {warn && (
        <div style={{ background: "rgba(255,77,79,0.12)", border: "1px solid rgba(255,77,79,0.4)", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: "#ff8787" }}>
          경기 경고 지표(삼의 법칙·장단기 금리차)가 경고 구간이에요
        </div>
      )}

      {history.length >= 2 && (
        <div style={{ background: "#151515", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>최근 {history.length}일</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {history.map((h) => (
              <div key={h.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 11, color: "#aaa" }}>{h.value}</div>
                <div style={{ width: "100%", height: barHeight(h.value), background: colorOf(h.value), borderRadius: 4 }} />
                <div style={{ fontSize: 10, color: "#666" }}>{h.date.slice(5).replace("-", "/")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onShare} style={{ height: 52, borderRadius: 14, border: "none", background: "#3182f6", color: "#fff", fontSize: 16, fontWeight: 700 }}>
        오늘 온도 공유하기
      </button>
      <button onClick={onShowDetail} style={{ height: 48, borderRadius: 14, border: "1px solid #333", background: "transparent", color: "#ddd", fontSize: 15, fontWeight: 600 }}>
        지표 자세히 보기
      </button>

      <button onClick={() => setShowFormula((v) => !v)} style={{ background: "none", border: "none", color: "#888", fontSize: 13, textDecoration: "underline", alignSelf: "center" }}>
        온도는 이렇게 계산해요
      </button>
      {showFormula && (
        <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6, background: "#151515", borderRadius: 12, padding: 14 }}>
          {(Object.keys(WEIGHTS) as ComponentKey[]).map((k) => (
            <div key={k}>· {LABELS[k]} {WEIGHTS[k] * 100}% — 지금 {components[k] ?? "-"}점</div>
          ))}
          <div style={{ marginTop: 8 }}>각 지표를 0(차가움)~100(뜨거움)으로 바꿔 비중대로 평균 냈어요. 시장 분위기를 보여 주는 정보이고, 매수·매도 추천이 아니에요.</div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 140, transform: "translateX(-50%)", background: "#333", color: "#fff", padding: "10px 16px", borderRadius: 20, fontSize: 14 }}>{toast}</div>
      )}
    </div>
  );
}
