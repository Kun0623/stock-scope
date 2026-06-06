import yfinance as yf
import pandas as pd
import json
import os
from datetime import datetime

OUTPUT_FILE = "public/backtest_data.json"

# 역사적 주요 이벤트 매핑
EVENTS = {
    "2022-02-24": {"type": "war", "title": "러-우 전쟁 발발", "desc": "지정학적 리스크 극대화"},
    "2022-03-16": {"type": "rate", "title": "연준 첫 금리 인상", "desc": "제로금리 시대 종료"},
    "2022-08-26": {"type": "shock", "title": "잭슨홀 쇼크", "desc": "파월 매파적 발언, 증시 급락"},
    "2023-03-10": {"type": "bank", "title": "SVB 파산 사태", "desc": "실리콘밸리 은행 뱅크런"},
    "2023-07-26": {"type": "rate", "title": "금리 5.5% 도달", "desc": "22년 만에 최고치"},
    "2024-04-19": {"type": "shock", "title": "중동 확전 우려", "desc": "이스라엘-이란 충돌"}
}

def generate_backtest_data():
    print("⏳ 과거 3년치 백테스트 데이터 및 이벤트 마커 병합 중...")
    
    # 1. 벤치마크, 리스크 지표, 주요 기술주 과거 데이터 로드
    tickers = ["^GSPC", "^VIX", "NVDA", "IONQ"]
    data = yf.download(tickers, period="3y", interval="1d")['Close']
    data = data.dropna()

    results = []
    
    for date, row in data.iterrows():
        date_str = date.strftime("%Y-%m-%d")
        
        # 2. VIX와 S&P500 이격도를 활용한 가상의 과거 리스크 스코어 역산 (0~100)
        vix_val = row['^VIX']
        risk_score = min(100, max(0, ((vix_val - 12) / 25) * 100))
        
        # 3. 이벤트 확인
        event = EVENTS.get(date_str, None)
        
        results.append({
            "date": date_str,
            "sp500": round(row['^GSPC'], 2),
            "nvda": round(row['NVDA'], 2),
            "ionq": round(row['IONQ'], 2),
            "risk_score": round(risk_score),
            "event": event
        })
        
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print("✅ 백테스트 JSON 생성 완료 (public/backtest_data.json)")

if __name__ == "__main__":
    generate_backtest_data()