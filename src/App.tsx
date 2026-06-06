import { MacroDashboardPage } from "./pages/MacroDashboardPage"; // (경로는 실제에 맞게 유지)

export default function App() {
  return (
    // 🚀 화면 전체 배경색만 까맣게 잡아주고, 모든 관리는 MacroDashboardPage에 맡깁니다.
    <div style={{ backgroundColor: "#0a0a0a", minHeight: "100vh" }}>
      <MacroDashboardPage />
    </div>
  );
}