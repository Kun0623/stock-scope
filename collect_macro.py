import os
import json
import re
import sys
import time
import math
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup
import yfinance as yf
import feedparser
import google.generativeai as genai

FRED_API_KEY = "***REMOVED***"
FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
OUTPUT_FILE = "public/macro_status.json"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}

KST = timezone(timedelta(hours=9))

def fetch_fred(series_id: str) -> float:
    time.sleep(1) 
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": 5,
    }
    resp = requests.get(FRED_BASE, params=params, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    for obs in data["observations"]:
        if obs["value"] != ".":
            return float(obs["value"])
    raise ValueError(f"{series_id} 유효 데이터 없음")

def get_sahm_rule() -> dict:
    try:
        value = fetch_fred("SAHMCURRENT")
        return {"value": round(value, 2), "status": "Recession" if value >= 0.5 else "Normal"}
    except Exception as e:
        return {"value": None, "status": "Unavailable"}

def get_high_yield_spread() -> dict:
    try:
        value = fetch_fred("BAMLH0A0HYM2")
        return {"value": round(value, 2), "status": "High Risk" if value >= 5.0 else "Normal"}
    except Exception as e:
        return {"value": None, "status": "Unavailable"}

def get_yield_curve() -> dict:
    try:
        value = fetch_fred("T10Y2Y")
        return {"value": round(value, 2), "status": "Inverted" if value < 0 else "Normal"}
    except Exception as e:
        return {"value": None, "status": "Unavailable"}

def get_fear_greed() -> dict:
    url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        score = resp.json().get("fear_and_greed", {}).get("score")
        if score is not None:
            return {"value": round(float(score)), "status": "Normal"}
    except Exception as e:
        pass
    return {"value": 50, "status": "Neutral"}

def get_buffett_indicator() -> dict:
    try:
        w5000 = yf.Ticker("^W5000").history(period="5d")
        gdp = fetch_fred("GDP")
        if not w5000.empty and gdp:
            ratio = (float(w5000['Close'].iloc[-1]) / gdp) * 100
            return {"value": round(ratio, 1), "status": "Overvalued" if ratio >= 180 else "Normal"}
    except Exception as e:
        pass
    return {"value": None, "status": "Unavailable"}

def get_vix_index() -> dict:
    try:
        vix = yf.Ticker("^VIX").history(period="2d")
        if not vix.empty:
            val = float(vix['Close'].iloc[-1])
            return {"value": round(val, 2), "status": "Panic" if val >= 25 else "Stable"}
    except Exception as e:
        pass
    return {"value": None, "status": "Unavailable"}

# ✨ 신규: VVIX 지수 실시간 수집 함수 (yfinance 활용)
def get_vvix_index() -> dict:
    try:
        vvix = yf.Ticker("^VVIX").history(period="2d")
        if not vvix.empty:
            val = float(vvix['Close'].iloc[-1])
            # NaN 방어 로직
            if math.isnan(val):
                return {"value": 85.0} 
            return {"value": round(val, 2)}
    except Exception as e:
        print(f"VVIX 수집 오류: {e}")
        pass
    return {"value": 85.0} # 에러 시 기본값 반환

# ✨ 신규: PCR 데이터 플레이스홀더 (추후 CBOE 크롤링 연동 전까지 UI 테스트용)
def get_pcr_data() -> dict:
    return {"value": 0.85}

# ✨ 신규: COT 리포트 플레이스홀더 (추후 CFTC 매주 토요일 데이터 연동 전까지 UI 테스트용)
def get_cot_report() -> dict:
    return {
        "value": "Net Short (순매도)",
        "is_short": True,
        "desc": "헤지펀드 S&P500 선물 하방 베팅 우위"
    }

def get_fx_data() -> dict:
    try:
        dxy = yf.Ticker("DX-Y.NYB").history(period="2d")
        krw = yf.Ticker("KRW=X").history(period="2d")
        return {
            "dxy": round(float(dxy['Close'].iloc[-1]), 2) if not dxy.empty else None,
            "usd_krw": round(float(krw['Close'].iloc[-1]), 1) if not krw.empty else None
        }
    except Exception as e:
        pass
    return {"dxy": None, "usd_krw": None}

def get_major_indices() -> list:
    indices = {
        "^KS11": "KOSPI",
        "^GSPC": "S&P 500",
        "^IXIC": "NASDAQ",
        "CL=F": "WTI 원유",
        "GC=F": "금 (Gold)",
        "^TNX": "미 10년물 국채"
    }
    results = []
    print("📈 실시간 주요 핵심 지표 수집 시작...")
    for ticker, name in indices.items():
        try:
            hist = yf.Ticker(ticker).history(period="2d")
            if not hist.empty and len(hist) >= 2:
                curr = float(hist['Close'].iloc[-1])
                prev = float(hist['Close'].iloc[-2])
                change = curr - prev
                change_pct = (change / prev) * 100
                results.append({
                    "name": name, "value": round(curr, 2), "change": round(change, 2), "change_pct": round(change_pct, 2)
                })
            elif not hist.empty and len(hist) == 1:
                curr = float(hist['Close'].iloc[-1])
                results.append({"name": name, "value": round(curr, 2), "change": 0.0, "change_pct": 0.0})
        except Exception as e:
            pass
    return results

def get_theme_trends() -> dict:
    themes = {
        "mega": {"AIQ": "인공지능 & 빅데이터", "SKYY": "클라우드 컴퓨팅", "CIBR": "사이버 보안", "BOTZ": "로봇공학 & 자동화"},
        "recent": {"BLOK": "웹 3.0 & 블록체인", "QTUM": "양자컴퓨팅 & 차세대 통신", "ITA": "우주항공 & 국방", "URA": "우라늄 & 차세대 에너지"}
    }
    results = {"mega": [], "recent": []}
    for category, etfs in themes.items():
        for ticker, name in etfs.items():
            try:
                hist = yf.Ticker(ticker).history(period="2d")
                if not hist.empty and len(hist) >= 2:
                    curr = float(hist['Close'].iloc[-1])
                    prev = float(hist['Close'].iloc[-2])
                    change = ((curr - prev) / prev) * 100
                    results[category].append({"ticker": ticker, "name": name, "change_pct": round(change, 2)})
            except Exception as e:
                pass
        results[category].sort(key=lambda x: x["change_pct"], reverse=True)
    return results

def get_sector_data() -> list:
    sectors = {"XLK": "기술 (Tech)", "XLF": "금융 (Financials)", "XLV": "헬스케어 (Health Care)", "XLE": "에너지 (Energy)", "XLY": "임의소비재 (Discretionary)", "XLP": "필수소비재 (Staples)", "XLI": "산업재 (Industrials)", "XLB": "소재 (Materials)", "XLRE": "부동산 (Real Estate)", "XLU": "유틸리티 (Utilities)", "XLC": "통신 (Communication)", "SMH": "반도체 (Semiconductors)"}
    results = []
    for ticker, name in sectors.items():
        try:
            hist = yf.Ticker(ticker).history(period="2d")
            if not hist.empty and len(hist) >= 2:
                curr = float(hist['Close'].iloc[-1])
                prev = float(hist['Close'].iloc[-2])
                change = ((curr - prev) / prev) * 100
                results.append({"ticker": ticker, "name": name, "change_pct": round(change, 2)})
        except Exception as e:
            pass
    results.sort(key=lambda x: x["change_pct"], reverse=True)
    return results

def get_ai_news_sentiment(existing_data: dict) -> dict:
    current_timestamp = datetime.now().timestamp()
    
    if existing_data and "ai_sentiment" in existing_data:
        prev_ai = existing_data["ai_sentiment"]
        last_timestamp = prev_ai.get("updated_timestamp", 0)
        
        if current_timestamp - last_timestamp < 900:
            print("⚡ AI 분석 15분 캐시 적용 (Gemini API 호출을 생략하여 비용을 절약합니다)")
            return prev_ai

    if not GEMINI_API_KEY:
        print("⚠️ Gemini API 키가 설정되지 않았습니다.")
        return {"sentiment_score": 50, "summary": ["API 키 오류"], "news_sources": [], "updated_timestamp": current_timestamp}

    print("🤖 15분 경과: 글로벌 뉴스 실시간 스크래핑 및 AI 요약 분석 실행 중...")
    try:
        rss_url = "https://news.google.com/rss/search?q=stock+market+OR+technology+OR+economy&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(rss_url)
        if not feed.entries:
            raise ValueError("RSS 뉴스를 가져오지 못했습니다.")
            
        headlines = [entry.title for entry in feed.entries[:20]]
        news_text = "\n".join(headlines)
        
        prompt = f"""
        너는 퀀트 애널리스트야. 다음 20개 글로벌 경제 헤드라인을 바탕으로 아래 JSON 형식으로 답해.
        {news_text}
        
        1. sentiment_score: 시장의 긍정/부정 상태 (0~100 정수)
        2. summary: 현재 시장 핵심 트렌드를 명확하고 간결하게 3줄 요약 (한국어)
        3. news_sources: 가장 중요한 뉴스 3~5개를 선정해 출처(provider), 원본 제목(title), 1~2문장의 한글 요약(summary) 작성
        
        출력 형식:
        {{
            "sentiment_score": 75,
            "summary": ["1. 요약", "2. 요약", "3. 요약"],
            "news_sources": [{{"provider": "Bloomberg", "title": "제목", "summary": "내용"}}]
        }}
        """
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        
        if match:
            result_json = json.loads(match.group(0))
            result_json["updated_timestamp"] = current_timestamp 
            return result_json
        else:
            raise ValueError("JSON 형식을 찾을 수 없음")
            
    except Exception as e:
        print(f"❌ AI 분석 실패: {e}")
        if existing_data and "ai_sentiment" in existing_data:
            return existing_data["ai_sentiment"]
        return {"sentiment_score": 50, "summary": ["데이터 수집 중 오류 발생"], "news_sources": [], "updated_timestamp": 0}

def calculate_quant_risk_score(fg, vix, yc, sahm, hy) -> int:
    score = 0; weight_total = 0
    if fg and fg.get("value") is not None: score += (100 - fg["value"]) * 0.25; weight_total += 0.25
    if vix and vix.get("value") is not None: score += max(0, min(100, ((vix["value"] - 12) / 23) * 100)) * 0.25; weight_total += 0.25
    if yc and yc.get("value") is not None: score += max(0, min(100, ((0.4 - yc["value"]) / 0.8) * 100)) * 0.20; weight_total += 0.20
    if sahm and sahm.get("value") is not None: score += max(0, min(100, (sahm["value"] / 0.6) * 100)) * 0.15; weight_total += 0.15
    if hy and hy.get("value") is not None: score += max(0, min(100, ((hy["value"] - 3.0) / 3.0) * 100)) * 0.15; weight_total += 0.15
    return round(score / weight_total) if weight_total > 0 else 50

def main():
    print("📡 안안(AnAn) 통합 매크로 엔진 가동 (실시간/캐시 하이브리드)...\n")
    
    existing_data = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        except:
            pass

    sahm = get_sahm_rule()
    hy_spread = get_high_yield_spread()
    yield_curve = get_yield_curve()
    fear_greed = get_fear_greed()
    buffett = get_buffett_indicator()
    vix = get_vix_index()
    fx = get_fx_data()
    major_indices = get_major_indices()
    theme_trends = get_theme_trends()
    sectors = get_sector_data()
    
    # ✨ 신규 지표 수집 호출
    vvix = get_vvix_index()
    pcr = get_pcr_data()
    cot = get_cot_report()
    
    ai_sentiment = get_ai_news_sentiment(existing_data)
    
    risk_score = calculate_quant_risk_score(fear_greed, vix, yield_curve, sahm, hy_spread)
    now_kst = datetime.now(KST).isoformat(timespec="seconds")

    result = {
        "updated_at": now_kst,
        "quant_risk_score": risk_score, 
        "fear_greed": fear_greed,
        "buffett_indicator": buffett,
        "sahm_rule": sahm,
        "high_yield_spread": hy_spread,
        "yield_curve": yield_curve,
        "vix": vix,
        "vvix": vvix,   # ✨ JSON에 VVIX 추가
        "pcr": pcr,     # ✨ JSON에 PCR 추가
        "cot": cot,     # ✨ JSON에 COT 추가
        "fx": fx,
        "major_indices": major_indices, 
        "theme_trends": theme_trends,
        "sectors": sectors,
        "ai_sentiment": ai_sentiment, 
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        
    print(f"\n✅ 데이터 갱신 완료! 리스크 점수: {risk_score}점")

if __name__ == "__main__":
    main()