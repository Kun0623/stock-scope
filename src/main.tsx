import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 🚨 임시 주석 처리: PC 환경 에러 방지
// import { TDSMobileAITProvider } from "@toss/tds-mobile-ait"; 
// import config from "../granite.config.ts";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 🚨 TDSMobileAITProvider를 제거하고 빈 태그(<>)로 감싸줍니다 */}
    <>
      <App />
    </>
  </StrictMode>,
);